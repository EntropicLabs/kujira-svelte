import { selectBestRPC, createTMClient, createKujiraClient } from "$lib/network/connect";
import { persisted } from "svelte-persisted-store";
import { get, writable } from "svelte/store";
import { refreshing } from "$lib/refreshing";
import type { KujiraClient, NetworkOptions } from "./types";
import { browser } from "$app/environment";

export const savedNetwork = browser ? persisted('network', { chainId: 'kaiyo-1' }) : writable({ chainId: 'kaiyo-1' });
export const savedNetworkOptions = browser ? persisted<NetworkOptions>('network-options', {}) : writable<NetworkOptions>({});

export const client = refreshing<KujiraClient>(async () => {
    const { chainId } = get(savedNetwork);

    const select: () => Promise<KujiraClient | undefined> = async () => {
        const { preferredRpc } = get(savedNetworkOptions)[chainId] ?? {};
        if (!preferredRpc) {
            try {
                return await selectBestRPC(chainId);
            } catch (e) {
                // TODO: Show an error to the user
                throw e;
            }
        } else {
            try {
                return await createKujiraClient((await createTMClient(preferredRpc))[0], chainId, preferredRpc);
            } catch (e) {
                // TODO: Show a warning to the user
                savedNetworkOptions.set({
                    ...get(savedNetworkOptions),
                    [chainId]: {
                        preferredRpc: null,
                    },
                });
                return await select();
            }
        }
    };
    const c = await select();
    console.log(c?.getTmClient());
    if (c) return c;
    // infinite promise
    await new Promise(() => { });
    // for typechecking, unreachable
    return undefined as any;
}, { refreshOn: [savedNetwork, savedNetworkOptions], debounce: 100 });