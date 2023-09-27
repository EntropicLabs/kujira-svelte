import IconLeap from "$lib/icons/IconLeap.svelte";
import { ConnectionError, type AccountData, WalletAdapter, type WalletMetadata, type IWallet } from "$lib/types";
import type { Window as KeplrWindow, Keplr } from "@keplr-wallet/types";

declare global {
    interface Window extends KeplrWindow {
        leap: Keplr;
    }
}

export class Leap implements IWallet {
    private constructor(public account: AccountData | null) { }

    public static metadata: WalletMetadata = {
        adapter: WalletAdapter.Leap,
        name: 'Leap',
        logo: IconLeap
    };
    public getMetadata (this: IWallet): WalletMetadata { return Leap.metadata; }
    public static async isInstalled(): Promise<boolean> {
        return !!window.leap;
    }
    public static async connect(chain: string): Promise<Leap> {
        if (!Leap.isInstalled()) {
            throw ConnectionError.NotInstalled;
        }

        const leap = window.leap;

        try {
            await leap.enable(chain);
            const offlineSigner = leap.getOfflineSigner(chain);
            const accounts = await offlineSigner.getAccounts();
            if (accounts.length === 0) {
                throw ConnectionError.NoAccounts;
            }
            const account = accounts[0];
            return new Leap(account);
        } catch (error) {
            console.log(error);
            throw ConnectionError.GenericError;
        }
    }

    public disconnect(): void { console.log('leap disconnect'); }
}