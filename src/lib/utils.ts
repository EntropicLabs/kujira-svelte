import type { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import { asyncDerived, type Loadable } from "@square/svelte-store";
import { createKujiraClient, type IWallet, type KujiraClient } from "./types";
import { client, wallet } from "./stores";

type ConnectedWallet = IWallet & { account: NonNullable<IWallet['account']> };
type QueryFn<T> = (client: KujiraClient) => Promise<T>;
type QueryFnWithWallet<T> = (client: KujiraClient, wallet: ConnectedWallet) => Promise<T>;

export type QueryOptions<T> = {
    initial?: T,
    trackState?: true,
};

function waitUntilNotNullish<T>(loadable: Loadable<T | null | undefined>, ready?: (x: T) => boolean): Loadable<T> {
    return asyncDerived(
        [loadable],
        async ([$l]) => {
            if ($l === null || $l === undefined || (ready && !ready($l))) {
                // never resolve
                console.log("Nullish!")
                return new Promise(() => { });
            } else {
                console.log("Not nullish!")
                return $l;
            }
        },
    );
}

/**
 * Creates a reloadable store that uses the provided query function to pull data from the blockchain.
 * 
 * The query function is given a `KujiraClient`, and optionally, the Connected Wallet, and should return
 * a promise that resolves to the data being queried.
 * 
 * This function handles delaying the query until the RPC and Wallet (if needed) are ready.
 */
export function query<T>(
    fn: QueryFn<T> | QueryFnWithWallet<T>,
    opts: QueryOptions<T> = {}
): Loadable<T> {
    const handles: [Loadable<{ rpc: string; client: Tendermint34Client }>, Loadable<ConnectedWallet>]
        = [client, waitUntilNotNullish(wallet, w => w.account !== null) as Loadable<ConnectedWallet>];

    const { initial, trackState } = opts;
    const storeOpts = { initial, trackState, reloadable: true as true };
    if (fn.length === 1) {
        return asyncDerived(
            handles,
            async ([$c]) => {
                const client = await createKujiraClient($c.client);
                return await (fn as QueryFn<T>)(client);
            },
            storeOpts,
        );
    } else {
        return asyncDerived(
            handles,
            async ([$c, $w]) => {
                const client = await createKujiraClient($c.client);
                return await (fn as QueryFnWithWallet<T>)(client, ($w as ConnectedWallet));
            },
            storeOpts,
        );
    }
}