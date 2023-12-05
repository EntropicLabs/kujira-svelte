import { selectBestRPC, createTMClient, createKujiraClient } from "$lib/network/connect";
import { persisted } from "svelte-persisted-store";
import { get } from "svelte/store";
import { refreshing } from "$lib/refreshing";
import type { KujiraClient } from "./types";

export type NetworkOptions = {
    [network: string]: {
        preferredRpc: string | null;
    };
};

export const savedNetwork = persisted('network', { chainId: 'kaiyo-1' });
export const savedNetworkOptions = persisted<NetworkOptions>('network-options', {});

export const client = refreshing<KujiraClient>(async () => {
    const { chainId } = get(savedNetwork);
    const { preferredRpc } = get(savedNetworkOptions)[chainId] ?? {};
    let c;
    if (!preferredRpc) {
        // We want to autoselect the best RPC
        c = await selectBestRPC(chainId);
    } else {
        // We want to use the preferred RPC
        c = await createKujiraClient(await createTMClient(preferredRpc), chainId, preferredRpc);
    }
    return c
}, { refreshOn: [savedNetwork, savedNetworkOptions] });