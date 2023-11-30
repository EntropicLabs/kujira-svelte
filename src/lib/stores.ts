import { asyncDerived, asyncWritable, persisted, type Loadable, type Persisted, type WritableLoadable } from "@square/svelte-store";
import { WalletAdapter, type IWallet, createKujiraClient, type KujiraClient } from "$lib/types";
import { selectBestRPC, type NETWORK, createTMClient } from "$lib/resources/networks";
import { adapterToIWallet } from "$lib/wallet/adapters";
import type { TendermintClient } from "@cosmjs/tendermint-rpc";

export type NetworkOptions = {
    [network in NETWORK]: {
        preferredRpc: string | null;
    };
};

export type PersistedNetwork = { chainId: NETWORK; }

export const persistedWallet = persisted(WalletAdapter.Disconnected, 'wallet-adapter');
export const selectedNetwork: Persisted<PersistedNetwork> = persisted({ chainId: 'kaiyo-1' }, 'network');
export const networkOptions: Persisted<NetworkOptions> = persisted({} as NetworkOptions, 'network-options');

export const wallet: WritableLoadable<IWallet | null> = asyncWritable(
    [persistedWallet, selectedNetwork],
    async ([$persistedWallet, $selectedNetwork]) => {
        let handle = adapterToIWallet($persistedWallet);
        let wallet = await handle?.connect($selectedNetwork.chainId).catch((error) => {
            console.error(error);
            persistedWallet.set(WalletAdapter.Disconnected);
            return null;
        });
        return wallet as IWallet;
    },
    async (newWallet: IWallet, _, oldWallet: IWallet | undefined) => {
        if (oldWallet) oldWallet.disconnect();
        persistedWallet.set(newWallet?.getMetadata().adapter ?? WalletAdapter.Disconnected);
        return newWallet;
    },
    { reloadable: true, trackState: true }
);

export declare type Client = {
    client: KujiraClient;
    rpc: string;
    chainId: NETWORK;
};
export const client: Loadable<Client> = asyncDerived(
    [selectedNetwork, networkOptions],
    async ([$selectedNetwork, $networkOptions]) => {
        const { chainId } = $selectedNetwork;
        const { preferredRpc } = $networkOptions[chainId] ?? {};
        let c;
        if (!preferredRpc) {
            // We want to autoselect the best RPC
            c = await selectBestRPC(chainId);
        } else {
            // We want to use the preferred RPC
            const kc = await createKujiraClient(await createTMClient(chainId, preferredRpc));
            c = { client: kc, rpc: preferredRpc, chainId };
        }
        return c
    },
    { trackState: true }
);