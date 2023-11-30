import type StationType from "@terra-money/station-connector";
import { WalletAdapter, type AccountData, type WalletMetadata, ConnectionError, type ISigner } from "./types";
import IconStation from "../icons/IconStation.svelte";
import type { EncodeObject, OfflineSigner } from "@cosmjs/proto-signing";
import { CHAIN_INFO, type NETWORK } from "$lib/resources/networks";
import type { GasPrice } from "@cosmjs/stargate";
import type { ChainInfoResponse } from "@terra-money/station-connector/keplrConnector";
import type { TendermintClient } from "@cosmjs/tendermint-rpc";
import { convertAccountData, offlineSignerSign } from "./common";

declare global {
    interface Window {
        station?: StationType;
    }
}

export class Station implements ISigner {
    private constructor(private acc: AccountData, private signer: OfflineSigner) { }

    public static async connect(chain: string): Promise<Station> {
        if (!await Station.isInstalled()) {
            throw ConnectionError.NotInstalled;
        }

        const station = window.station!.keplr;

        try {
            await station.experimentalSuggestChain(CHAIN_INFO[chain as NETWORK] as ChainInfoResponse);
            await station.enable(chain);
            const offlineSigner = await station.getOfflineSignerAuto(chain);
            const accounts = await offlineSigner.getAccounts();
            if (accounts.length === 0) {
                throw ConnectionError.NoAccounts;
            }
            return new Station(convertAccountData(accounts[0]), offlineSigner);
        } catch (error) {
            console.error(error);
            throw ConnectionError.GenericError;
        }
    }
    public disconnect() { /* noop */ }

    public static metadata: WalletMetadata = {
        adapter: WalletAdapter.Station,
        name: 'Station',
        logo: IconStation,
        canSign: true,
    };
    public getMetadata(): WalletMetadata { return Station.metadata; }

    public static async isInstalled(): Promise<boolean> { return !!window.station; }

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