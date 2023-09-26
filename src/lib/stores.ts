import { asyncDerived, asyncWritable, persisted, type Persisted, type WritableLoadable } from "@square/svelte-store";
import { WalletAdapter, type IWallet } from "$lib/types";
import { selectBestRPC, type NETWORK, createTMClient } from "$lib/resources/networks";
import { adapterToIWallet } from "$lib/adapters";

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
        console.log("setting wallet: ", newWallet);
        if (oldWallet) oldWallet.disconnect();
        persistedWallet.set(newWallet?.getMetadata().adapter ?? WalletAdapter.Disconnected);
        return newWallet;
    }
);

export const client = asyncDerived(
    [selectedNetwork, networkOptions],
    async ([$selectedNetwork, $networkOptions]) => {
        const { chainId } = $selectedNetwork;
        const { preferredRpc } = $networkOptions[chainId] ?? {};
        if (!preferredRpc) {
            // We want to autoselect the best RPC
            return await selectBestRPC(chainId);
        } else {
            // We want to use the preferred RPC
            const c = await createTMClient(chainId, preferredRpc);
            return { client: c, rpc: preferredRpc };
        }
    }
);