import IconLeap from "../icons/IconLeap.svelte";
import { CHAIN_INFO, type NETWORK } from "$lib/resources/networks";
import type { EncodeObject, OfflineSigner } from "@cosmjs/proto-signing";
import type { GasPrice } from "@cosmjs/stargate";
import type { Keplr, Window as KeplrWindow } from "@keplr-wallet/types";
import { WalletAdapter, type AccountData, type WalletMetadata, ConnectionError, type ISigner } from "./types";
import type { TendermintClient } from "@cosmjs/tendermint-rpc";
import { convertAccountData, offlineSignerSign } from "./common";

declare global {
    interface Window extends KeplrWindow {
        leap: Keplr;
    }
}

export class Leap implements ISigner {
    private constructor(private acc: AccountData, private signer: OfflineSigner) { }

    public static async connect(chain: string): Promise<Leap> {
        if (!Leap.isInstalled()) {
            throw ConnectionError.NotInstalled;
        }

        const leap = window.leap!;

        try {
            await leap.experimentalSuggestChain(CHAIN_INFO[chain as NETWORK]);
            await leap.enable(chain);
            const offlineSigner = await leap.getOfflineSignerAuto(chain);
            const accounts = await offlineSigner.getAccounts();
            if (accounts.length === 0) {
                throw ConnectionError.NoAccounts;
            }
            return new Leap(convertAccountData(accounts[0]), offlineSigner);
        } catch (error) {
            console.error(error);
            throw ConnectionError.GenericError;
        }
    }
    public disconnect() { /* noop */ }

    public static metadata: WalletMetadata = {
        adapter: WalletAdapter.Leap,
        name: 'Leap',
        logo: IconLeap,
        canSign: true,
    }
    public getMetadata(): WalletMetadata { return Leap.metadata; }

    public static async isInstalled(): Promise<boolean> { return !!window.leap; }

    public account(): AccountData { return this.acc; }

    public async sign(
        client: TendermintClient,
        msgs: EncodeObject[],
        gasLimit: Long,
        gasPrice: GasPrice,
        memo?: string
    ): Promise<Uint8Array> {
        return offlineSignerSign(this.signer, this.acc.address, client, msgs, gasLimit, gasPrice, memo);
    }
}