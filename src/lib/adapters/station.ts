import type StationType from "@terra-money/station-connector";
import { WalletAdapter, type AccountData, ConnectionError, type WalletMetadata, type IWallet } from "$lib/types";
import IconStation from "$lib/icons/IconStation.svelte";

declare global {
    interface Window {
        station?: StationType;
    }
}

export class Station implements IWallet {
    private constructor(public account: AccountData | null) { }

    public static metadata: WalletMetadata = {
        adapter: WalletAdapter.Station,
        name: 'Station',
        logo: IconStation,
    };
    public getMetadata (this: IWallet): WalletMetadata { return Station.metadata; }
    public static async isInstalled(): Promise<boolean> {
        return !!window.station;
    }
    public static async connect(chain: string): Promise<Station> {
        if (!await Station.isInstalled()) {
            throw ConnectionError.NotInstalled;
        }

        const station = window.station!.keplr;

        try {
            await station.enable(chain);
            const offlineSigner = station.getOfflineSigner(chain);
            const accounts = await offlineSigner.getAccounts();
            if (accounts.length === 0) {
                throw ConnectionError.NoAccounts;
            }
            const account = accounts[0];
            return new Station(account);
        } catch (error) {
            console.log(error);
            throw ConnectionError.GenericError;
        }
    }

    public disconnect(): void { console.log('station disconnect'); }
}