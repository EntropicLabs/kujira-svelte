import IconXDefi from "$lib/icons/IconXDefi.svelte";
import { CHAIN_INFO, type NETWORK } from "$lib/resources/networks";
import { ConnectionError, type AccountData, WalletAdapter, type WalletMetadata, type IWallet, type KujiraClient } from "$lib/types";
import type { OfflineSigner } from "@cosmjs/proto-signing";
import { GasPrice, SigningStargateClient } from "@cosmjs/stargate";
import type { Window as KeplrWindow, Keplr } from "@keplr-wallet/types";

declare global {
    interface Window extends KeplrWindow {
        xfi: Keplr;
    }
}

export class XDefi implements IWallet {
    private constructor(public account: AccountData, public signer: OfflineSigner, private chain: NETWORK) { }

    public static metadata: WalletMetadata = {
        adapter: WalletAdapter.XDefi,
        name: 'XDefi',
        logo: IconXDefi,
        canSign: true,
    };
    public getMetadata(this: IWallet): WalletMetadata { return XDefi.metadata; }
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
            return new XDefi(account, offlineSigner, chain as NETWORK);
        } catch (error) {
            console.log(error);
            throw ConnectionError.GenericError;
        }
    }

    public disconnect(): void { /* noop */ }

    public async getSigningClient(client: KujiraClient): Promise<SigningStargateClient> {
        if (!this.account) {
            throw new Error("No account connected");
        }
        const feeDenom = CHAIN_INFO[this.chain].feeCurrencies[0];
        const gasPrice = GasPrice.fromString(`${feeDenom.gasPriceStep!.low}${feeDenom.coinMinimalDenom}`);
        return SigningStargateClient.createWithSigner(client.getTmClient(), this.signer, { gasPrice });
    }
}