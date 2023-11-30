import { asyncDerived, asyncWritable, type Loadable, type Readable } from "@square/svelte-store";
import { createKujiraClient, type IWallet, type KujiraClient, type Simulation } from "./types";
import { client, wallet, type Client } from "./stores";
import type { SimulateResponse } from "cosmjs-types/cosmos/tx/v1beta1/service";
import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { Registry, type EncodeObject } from "@cosmjs/proto-signing";
import { accountFromAny, calculateFee, GasPrice, SigningStargateClient, type DeliverTxResponse, type StdFee } from "@cosmjs/stargate";
import { encodeSecp256k1Pubkey } from "@cosmjs/amino";
import { CHAIN_INFO } from "./resources/networks";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { writable, type Writable, type Stores, type StoresValues } from "svelte/store";

export type ConnectedWallet = IWallet & { account: NonNullable<IWallet['account']> };
export type LiveWallet = ConnectedWallet & { signer: NonNullable<IWallet['signer']> }

export function isConnectedWallet(wallet: IWallet | null | undefined): wallet is ConnectedWallet { return wallet?.account !== null && wallet?.account !== undefined; }
export function isLiveWallet(wallet: IWallet | null | undefined): wallet is LiveWallet { return isConnectedWallet(wallet) && wallet.signer !== null; }

type QueryFn<T, S> = S extends never[] ?
    (client: KujiraClient) => Promise<T> :
    (client: KujiraClient, vals: S) => Promise<T>;
type QueryFnWithWallet<T, S> = S extends never[] ?
    (client: KujiraClient, wallet: ConnectedWallet) => Promise<T> :
    (client: KujiraClient, wallet: ConnectedWallet, vals: S) => Promise<T>;

interface TxInput { msgs: EncodeObject[], memo?: string }
type ConstructTxFn<S extends Stores> = S extends never[] ?
    (client: KujiraClient, wallet: LiveWallet) => Promise<TxInput> :
    (client: KujiraClient, wallet: LiveWallet, vals: S) => Promise<TxInput>;

type LoadableWithState<T> = Loadable<T> & { state: NonNullable<Loadable<T>['state']> };

export type QueryOptions<T, S extends Stores> = {
    extraStores?: S,
    initial?: T,
};

export type TxOptions<S extends Stores> = {
    extraStores?: S,
};

function waitUntilNotNullish<T>(loadable: Loadable<T | null | undefined>, ready?: (x: T) => boolean): Loadable<T> {
    return asyncDerived(
        [loadable],
        async ([$l]) => {
            if ($l === null || $l === undefined || (ready && !ready($l))) {
                // never resolve
                return new Promise(() => { });
            } else {
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
export function query<T, S extends Stores = []>(
    fn: QueryFn<T, StoresValues<S>> | QueryFnWithWallet<T, StoresValues<S>>,
    opts: QueryOptions<T, S> = {}
): LoadableWithState<T> {
    let handles: Readable<any>[] = [client, waitUntilNotNullish(wallet, w => w.account !== null) as Loadable<ConnectedWallet>];

    const { initial, extraStores } = opts;
    const storeOpts = { initial, trackState: true as true, reloadable: true as true };

    if (extraStores) {
        if (Array.isArray(extraStores)) {
            handles.push(...extraStores);
        } else {
            handles.push(extraStores);
        }
    }

    if (fn.length === 1 + (extraStores ? 1 : 0)) {
        return asyncDerived(
            handles,
            async ([$c, ...$s]) => {
                const client = await createKujiraClient($c.client);
                if ($s.length === 0) {
                    return await (fn as QueryFn<T, []>)(client);
                }
                return await (fn as QueryFn<T, S>)(client, $s as StoresValues<S>);
            },
            storeOpts,
        ) as LoadableWithState<T>;
    } else {
        return asyncDerived(
            handles,
            async ([$c, $w, ...$s]) => {
                const client = await createKujiraClient($c.client);
                if ($s.length === 0) {
                    return await (fn as QueryFnWithWallet<T, []>)(client, ($w as ConnectedWallet));
                }
                return await (fn as QueryFnWithWallet<T, S>)(client, ($w as ConnectedWallet), $s as StoresValues<S>);
            },
            storeOpts,
        ) as LoadableWithState<T>;
    }
}

export declare type TxStatus = "WAITING" | "SIMULATING" | "SIMULATED" | "SIGNING" | "BROADCASTING" | "COMMITTED" | "ERROR";
export declare type TxState = {
    isWaiting: boolean;
    isSimulating: boolean;
    isSimulated: boolean;
    isSigning: boolean;
    isBroadcasting: boolean;
    isCommitted: boolean;
    isError: boolean;
    isPending: boolean;
    isSettled: boolean;
}

const getTxState = (stateString: TxStatus): TxState => {
    return {
        isWaiting: stateString === "WAITING",
        isSimulating: stateString === "SIMULATING",
        isSimulated: stateString === "SIMULATED",
        isSigning: stateString === "SIGNING",
        isBroadcasting: stateString === "BROADCASTING",
        isCommitted: stateString === "COMMITTED",
        isError: stateString === "ERROR",
        isPending: stateString === "WAITING" || stateString === "SIMULATING" || stateString === "SIGNING" || stateString === "BROADCASTING" || stateString === "SIMULATED",
        isSettled: stateString === "COMMITTED" || stateString === "ERROR",
    };
};

export interface TxStore {
    state: TxState;
    simulate: () => Promise<{ simulation: SimulateResponse, fee: StdFee }>;
    sign: (simulation?: { simulation: SimulateResponse, fee: StdFee }) => Promise<TxRaw>;
    broadcast: (raw?: TxRaw) => Promise<DeliverTxResponse>;
    signAndBroadcast: (simulation?: { simulation: SimulateResponse, fee: StdFee }) => Promise<DeliverTxResponse>;
}
/**
 * Class for managing creation and dispatch of transactions.
 * 
 * Will rebuild the transaction messages whenever the client or wallet changes.
 * 
 * Manually need to call `simulate`, `sign`, and `broadcast` to trigger those actions.
 * 
 * Track the state of the transaction using `$state`.
 * 
 */
export class Tx<S extends Stores> {
    public msgs: Loadable<TxInput>;
    private state: Writable<TxState>;
    // private store: Writable<TxStore>;
    public subscribe;

    constructor(
        private fn: ConstructTxFn<StoresValues<S>>,
        opts: TxOptions<S> = {}
    ) {
        type ExtendedStores = [] | (S extends Array<unknown> ? [...S] : [S]);
        const handles: [Loadable<Client>, Loadable<LiveWallet>, ...ExtendedStores]
            = [client, waitUntilNotNullish(wallet, w => (w.account !== null && w.signer !== null)) as Loadable<LiveWallet>];

        const { extraStores } = opts;
        if (extraStores) {
            if (Array.isArray(extraStores)) {
                handles.push(...extraStores);
            } else {
                (handles as Readable<any>[]).push(extraStores);
            }
        }


        this.msgs = asyncDerived(
            handles,
            async ([c, w, ...s]) => {
                const client = await createKujiraClient(c.client);
                const txArgs = await this.fn(client, w, s as StoresValues<S>);
                return txArgs;
            },
            {
                reloadable: true,
            }
        );

        this.state = writable<TxState>(getTxState("WAITING"));

        this.subscribe = this.state.subscribe;
    }

    public subscribeSimulate(): Loadable<{ ok: true, simulation: SimulateResponse, fee: StdFee } | { ok: false; err: any } | null> {
        return asyncWritable(this.msgs, async () => {
            const sim = await this.simulate().catch((e) => {
                return { ok: false as false, err: e };
            });
            return { ok: true as true, ...sim };
        });
    }

    public async simulate(): Promise<Simulation> {
        const handles: [Loadable<Client>, Loadable<LiveWallet>, Loadable<TxInput>]
            = [client, waitUntilNotNullish(wallet, w => (w.account !== null && w.signer !== null)) as Loadable<LiveWallet>, this.msgs];

        let [c, w, tx]
            = await Promise.all(handles.map(h => h.load())) as [Client, LiveWallet, TxInput];
        const kClient = await createKujiraClient(c.client);

        this.state.set(getTxState("SIMULATING"));
        try {
            const anyMsgs = tx.msgs.map((m) => new Registry().encodeAsAny(m));

            const accountQuery = await kClient.auth.account(w.account.address);
            if (!accountQuery) {
                throw new Error("Account not found");
            }
            const pubkey = (await w.signer.getAccounts()).find((acc) => acc.address === w.account.address)?.pubkey!;

            const account = accountFromAny(accountQuery);
            const simulation = await kClient.tx.simulate(anyMsgs, tx.memo, encodeSecp256k1Pubkey(pubkey), account.sequence);
            const feeDenom = CHAIN_INFO[c.chainId].feeCurrencies[0];
            const gasPrice = GasPrice.fromString(`${feeDenom.gasPriceStep!.low}${feeDenom.coinMinimalDenom}`);
            const fee = calculateFee(Math.round(simulation.gasInfo!.gasUsed.toNumber() * 1.4), gasPrice);

            this.state.set(getTxState("SIMULATED"));
            return {
                simulation,
                fee,
                account,
            };
        } catch (e) {
            this.state.set(getTxState("ERROR"));
            throw e;
        }
    }

    public async sign(simulation?: Simulation): Promise<TxRaw> {
        const { fee, account: { accountNumber, sequence } } = simulation ?? await this.simulate();
        const handles: [Loadable<Client>, Loadable<LiveWallet>, Loadable<TxInput>]
            = [client, waitUntilNotNullish(wallet, w => (w.account !== null && w.signer !== null)) as Loadable<LiveWallet>, this.msgs];

        let [$c, $w, $tx] = await Promise.all(handles.map(h => h.load())) as [Client, LiveWallet, TxInput];

        this.state.set(getTxState("SIGNING"));
        try {
            const signing = await SigningStargateClient.offline($w.signer);
            return await signing.sign($w.account.address, $tx.msgs, fee, $tx.memo ?? "", { accountNumber, sequence, chainId: $c.chainId });
        } catch (e) {
            this.state.set(getTxState("ERROR"));
            throw e;
        }
    }

    public async broadcast(raw?: TxRaw): Promise<DeliverTxResponse> {
        const bytes = TxRaw.encode(raw ?? await this.sign()).finish();
        const $c = await client.load();

        this.state.set(getTxState("BROADCASTING"));
        try {
            const cwClient = await CosmWasmClient.create($c.client);
            return cwClient.broadcastTx(bytes).then((res) => {
                this.state.set(getTxState("COMMITTED"));
                return res;
            });
        } catch (e) {
            this.state.set(getTxState("ERROR"));
            throw e;
        }
    }

    public async signAndBroadcast(simulation?: Simulation): Promise<{ ok: true, res: DeliverTxResponse } | { ok: false, err: any }> {
        try {
            const raw = await this.sign(simulation);
            return {
                ok: true as true,
                res: await this.broadcast(raw),
            };
        } catch (e) {
            return { ok: false, err: e };
        }
    }
}