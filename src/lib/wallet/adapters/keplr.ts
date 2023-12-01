import IconKeplr from "../icons/IconKeplr.svelte";
import { CHAIN_INFO, type NETWORK } from "$lib/resources/networks";
import type { EncodeObject, OfflineSigner } from "@cosmjs/proto-signing";
import type { GasPrice } from "@cosmjs/stargate";
import type { Window as KeplrWindow } from "@keplr-wallet/types";
import { WalletAdapter, type AccountData, type WalletMetadata, ConnectionError, type ISigner } from "./types";
import type { TendermintClient } from "@cosmjs/tendermint-rpc";
import { convertAccountData, offlineSignerSign } from "./common";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Window extends KeplrWindow { }
}

export class Keplr implements ISigner {
    private constructor(private acc: AccountData, private signer: OfflineSigner) { }

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
            return new Keplr(convertAccountData(accounts[0]), offlineSigner);
        } catch (error) {
            console.error(error);
            throw ConnectionError.GenericError;
        }
    }
    public disconnect() { /* noop */ }

    public static metadata: WalletMetadata = {
        adapter: WalletAdapter.Keplr,
        name: 'Keplr',
        logo: IconKeplr,
        canSign: true,
    }
    public getMetadata(): WalletMetadata { return Keplr.metadata; }

    public static async isInstalled(): Promise<boolean> { return !!window.keplr; }

    public account(): AccountData { return this.acc; }

    public async sign(
        client: TendermintClient,
        msgs: EncodeObject[],
        gasLimit: number,
        gasPrice: GasPrice,
        memo?: string
    ): Promise<Uint8Array> {
        return offlineSignerSign(this.signer, this.acc.address, client, msgs, gasLimit, gasPrice, memo);
    }
}