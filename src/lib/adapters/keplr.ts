import IconKeplr from "$lib/icons/IconKeplr.svelte";
import { ConnectionError, type AccountData, WalletAdapter, type WalletMetadata, type IWallet } from "$lib/types";
import type { Window as KeplrWindow } from "@keplr-wallet/types";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Window extends KeplrWindow { }
}

export class Keplr implements IWallet {
    private constructor(public account: AccountData | null) { }

    public static metadata: WalletMetadata = {
        adapter: WalletAdapter.Keplr,
        name: 'Keplr',
        logo: IconKeplr,
    }
    public getMetadata (this: IWallet): WalletMetadata { return Keplr.metadata; }
    public static async isInstalled(): Promise<boolean> {
        return !!window.keplr;
    }
    public static async connect(chain: string): Promise<Keplr> {
        if (!Keplr.isInstalled()) {
            throw ConnectionError.NotInstalled;
        }

        const keplr = window.keplr!;

        try {
            await keplr.enable(chain);
            const offlineSigner = keplr.getOfflineSigner(chain);
            const accounts = await offlineSigner.getAccounts();
            if (accounts.length === 0) {
                throw ConnectionError.NoAccounts;
            }
            const account = accounts[0];
            return new Keplr(account);
        } catch (error) {
            console.log(error);
            throw ConnectionError.GenericError;
        }
    }

    public disconnect(): void { console.log('keplr disconnect'); }
}