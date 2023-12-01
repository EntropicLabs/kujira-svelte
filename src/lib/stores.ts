import { createKujiraClient, type KujiraClient } from "$lib/types";
import { selectBestRPC, createTMClient } from "$lib/resources/networks";
import { adapterToIWallet } from "$lib/wallet/adapters";
import { WalletAdapter, type ISigner } from "./wallet/adapters/types";
import { persisted } from "svelte-persisted-store";
import { get } from "svelte/store";
import { refreshing } from "./refreshing";

export type NetworkOptions = {
    [network: string]: {
        preferredRpc: string | null;
    };
};

export type PersistedNetwork = { chainId: string; }

export const savedAdapter = persisted('wallet-adapter', WalletAdapter.Disconnected);
export const savedNetwork = persisted('network', { chainId: 'kaiyo-1' });
export const savedNetworkOptions = persisted<NetworkOptions>('network-options', {});

export const signer = refreshing<ISigner | null>(async (old) => {
    if (old) old.disconnect();
    const adapter = get(savedAdapter);
    const network = get(savedNetwork);
    let handle = await adapterToIWallet(adapter);
    let wallet = await handle?.connect(network.chainId).catch((error) => {
        console.error(error);
        savedAdapter.set(WalletAdapter.Disconnected);
        return null;
    });
    return wallet ?? null;
}, { refreshOn: [savedAdapter, savedNetwork] });
export const signerResolved = signer.resolved;

export declare type Client = {
    client: KujiraClient;
    rpc: string;
    chainId: string;
};
export const client = refreshing<Client>(async () => {
    const { chainId } = get(savedNetwork);
    const { preferredRpc } = get(savedNetworkOptions)[chainId] ?? {};
    let c;
    if (!preferredRpc) {
        // We want to autoselect the best RPC
        c = await selectBestRPC(chainId);
    } else {
        // We want to use the preferred RPC
        const kc = await createKujiraClient(await createTMClient(preferredRpc));
        c = { client: kc, rpc: preferredRpc, chainId };
    }
    return c
}, { refreshOn: [savedNetwork, savedNetworkOptions] });