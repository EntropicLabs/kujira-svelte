import { getSnap } from "@leapwallet/cosmos-snap-provider";
import { ConnectionError, type AccountData, WalletAdapter, type WalletMetadata, type IWallet } from "$lib/types";
import IconMetaMask from "$lib/icons/IconMetaMask.svelte";

export class MetaMask implements IWallet {
    private constructor(public account: AccountData | null) { }

    public static metadata: WalletMetadata = {
        adapter: WalletAdapter.MetaMask,
        name: 'MetaMask',
        logo: IconMetaMask,
    }
    public getMetadata (this: IWallet): WalletMetadata { return MetaMask.metadata; }
    public static async isInstalled(): Promise<boolean> {
        return !!(await getSnap());
    }
    public static async connect(chain: string): Promise<MetaMask> {
        if (!await MetaMask.isInstalled()) {
            throw ConnectionError.NotInstalled;
        }

        throw new Error('MetaMask unimplemented');
    }

    public disconnect(): void { console.log('metamask disconnect'); }
}