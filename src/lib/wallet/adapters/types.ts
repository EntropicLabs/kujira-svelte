import type { EncodeObject, OfflineSigner } from "@cosmjs/proto-signing";
import type { Keplr } from "./keplr";
import type { Leap } from "./leap";
import type { MetaMask } from "./metamask";
import type { Sonar } from "./sonar";
import type { Station } from "./station";
import type { XDefi } from "./xdefi";
import type { KujiraClient } from "$lib/types";
import type { SigningStargateClient } from "@cosmjs/stargate";

export interface AccountData {
    address: string;
    pubkey: Uint8Array;
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

export type Connectable<T> = {
    connect(chain: string): Promise<T>;
    isInstalled(): Promise<boolean>;
    metadata: WalletMetadata;
};
export type Wallet = Connectable<Keplr> | Connectable<Sonar> | Connectable<Leap> | Connectable<MetaMask> | Connectable<Station> | Connectable<XDefi>;

export interface IWallet {
    disconnect: () => void;
    account: AccountData | null;
    signer: OfflineSigner | null;
    getMetadata: () => WalletMetadata;
    getSigningClient(client: KujiraClient): Promise<SigningStargateClient>;
    // feeDenom: string;
    // setFeeDenom: (denom: string) => void;
    // chainInfo: ChainInfo;
    // adapter: null | WalletAdapter;
};

export interface Simulation {

}

export interface ISigner {
    disconnect: () => void;
    getMetadata: () => WalletMetadata;
    sign(
        msgs: EncodeObject[],
        gasLimit: Long,
        feeDenom: string,
        memo?: string,
    ): Promise<Uint8Array>;
    account: AccountData;

}