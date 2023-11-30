import type StationType from "@terra-money/station-connector";
import { WalletAdapter, type AccountData, type IWallet, type WalletMetadata, ConnectionError } from "./types";
import IconStation from "$lib/icons/IconStation.svelte";
import type { OfflineSigner } from "@cosmjs/proto-signing";
import { CHAIN_INFO, type NETWORK } from "$lib/resources/networks";
import { GasPrice, SigningStargateClient } from "@cosmjs/stargate";
import type { KujiraClient } from "$lib/types";
import type { ChainInfoResponse } from "@terra-money/station-connector/keplrConnector";
import { aminoTypes, protoRegistry } from "../utils";

declare global {
    interface Window {
        station?: StationType;
    }
}

export class Station implements IWallet {
    private constructor(public account: AccountData, public signer: OfflineSigner, private chain: NETWORK) { }

    public static metadata: WalletMetadata = {
        adapter: WalletAdapter.Station,
        name: 'Station',
        logo: IconStation,
        canSign: true,
    };
    public getMetadata(this: IWallet): WalletMetadata { return Station.metadata; }
    public static async isInstalled(): Promise<boolean> {
        return !!window.station;
    }
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
            const account = accounts[0];
            return new Station(account, offlineSigner, chain as NETWORK);
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