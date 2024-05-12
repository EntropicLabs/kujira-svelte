import type { OfflineAminoSigner, Pubkey } from "@cosmjs/amino";
import type { EncodeObject, OfflineDirectSigner } from "@cosmjs/proto-signing";
import type { StdFee } from "@cosmjs/stargate";
import type { TendermintClient } from "@cosmjs/tendermint-rpc";
import type { KeplrSignOptions, Keplr as KeplrT } from "@keplr-wallet/types";
import type { Keplr } from "./keplr";
import type { Leap } from "./leap";
import type { MetaMask } from "./metamask";
import type { Sonar } from "./sonar";
import type { Station } from "./station";
import type { XDefi } from "./xdefi";

export interface AccountData {
    address: string;
    pubkey: Pubkey;
}

export enum WalletAdapter {
    Keplr = 'keplr',
    Leap = 'leap',
    MetaMask = 'metamask',
    Sonar = 'sonar',
    Station = 'station',
    XDefi = 'xdefi',
    Readonly = 'readonly',
    Disconnected = 'disconnected',
};

export enum ConnectionError {
    NotInstalled = 'not_installed',
    NoAccounts = 'no_accounts',
    GenericError = 'generic_error',
}

export type WalletMetadata = {
    adapter: WalletAdapter,
    name: string,
    logo: any,
    canSign: boolean,
};

type ISignerStatic<T> = {
    connect(chain: string): Promise<T>;
    isInstalled(): Promise<boolean>;
    metadata: WalletMetadata;
};
export type Connectable = ISignerStatic<Keplr> | ISignerStatic<Sonar> | ISignerStatic<Leap> | ISignerStatic<MetaMask> | ISignerStatic<Station> | ISignerStatic<XDefi>;

export interface ISigner {
    disconnect: () => void;
    getMetadata: () => WalletMetadata;
    account(): AccountData;
    sign(
        client: TendermintClient,
        msgs: EncodeObject[],
        fee: StdFee,
        memo?: string,
    ): Promise<Uint8Array>;
}