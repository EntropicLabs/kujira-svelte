import IconKeplr from "$lib/icons/IconKeplr.svelte";
import { aminoTypes, protoRegistry } from "../utils";
import { CHAIN_INFO, type NETWORK } from "$lib/resources/networks";
import type { OfflineSigner } from "@cosmjs/proto-signing";
import { GasPrice, SigningStargateClient } from "@cosmjs/stargate";
import type { Window as KeplrWindow } from "@keplr-wallet/types";
import { WalletAdapter, type AccountData, type IWallet, type WalletMetadata, ConnectionError } from "./types";
import type { KujiraClient } from "$lib/types";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Window extends KeplrWindow { }
}

export class Keplr implements IWallet {
    private constructor(public account: AccountData, public signer: OfflineSigner, private chain: NETWORK) { }

    public static metadata: WalletMetadata = {
        adapter: WalletAdapter.Keplr,
        name: 'Keplr',
        logo: IconKeplr,
        canSign: true,
    }
    public getMetadata(): WalletMetadata { return Keplr.metadata; }
    public static async isInstalled(): Promise<boolean> {
        return !!window.keplr;
    }
    public static async connect(chain: string): Promise<Keplr> {
        if (!Keplr.isInstalled()) {
            throw ConnectionError.NotInstalled;
        }

        const keplr = window.keplr!;

        try {
            await keplr.experimentalSuggestChain(CHAIN_INFO[chain as NETWORK]);
            await keplr.enable(chain);
            const offlineSigner = await keplr.getOfflineSignerAuto(chain);
            const accounts = await offlineSigner.getAccounts();
            if (accounts.length === 0) {
                throw ConnectionError.NoAccounts;
            }
            const account = accounts[0];
            return new Keplr(account, offlineSigner, chain as NETWORK);
        } catch (error) {
            console.error(error);
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
        return SigningStargateClient.createWithSigner(client.getTmClient(), this.signer, { gasPrice, registry: protoRegistry, aminoTypes: aminoTypes("kujira") });
    }
}