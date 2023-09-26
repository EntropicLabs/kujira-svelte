import IconXDefi from "$lib/icons/IconXDefi.svelte";
import { ConnectionError, type AccountData, WalletAdapter, type WalletMetadata, type IWallet } from "$lib/types";
import type { Window as KeplrWindow, Keplr } from "@keplr-wallet/types";

declare global {
    interface Window extends KeplrWindow {
        xfi: Keplr;
    }
}

export class XDefi implements IWallet {
    private constructor(public account: AccountData | null) { }

    public static metadata: WalletMetadata = {
        adapter: WalletAdapter.XDefi,
        name: 'XDefi',
        logo: IconXDefi
    };
    public getMetadata (this: IWallet): WalletMetadata { return XDefi.metadata; }
    public static async isInstalled(): Promise<boolean> {
        return !!window.xfi;
    }
    public static async connect(chain: string): Promise<XDefi> {
        if (!XDefi.isInstalled()) {
            throw ConnectionError.NotInstalled;
        }
        const xfi = window.xfi;

        try {
            await xfi.enable(chain);
            const offlineSigner = xfi.getOfflineSigner(chain);
            const accounts = await offlineSigner.getAccounts();
            if (accounts.length === 0) {
                throw ConnectionError.NoAccounts;
            }
            const account = accounts[0];
            return new XDefi(account);
        } catch (error) {
            console.log(error);
            throw ConnectionError.GenericError;
        }
    }

    public disconnect(): void { console.log('xdefi disconnect'); }
}