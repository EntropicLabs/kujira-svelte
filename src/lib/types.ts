import { QueryClient, type AuthExtension, type BankExtension, type GovExtension, type StakingExtension, setupAuthExtension, setupAuthzExtension, setupBankExtension, setupGovExtension, setupStakingExtension } from "@cosmjs/stargate";
import type { Keplr } from "$lib/adapters/keplr";
import type { Leap } from "$lib/adapters/leap";
import type { MetaMask } from "$lib/adapters/metamask";
import type { Sonar } from "$lib/adapters/sonar";
import type { Station } from "$lib/adapters/station";
import type { XDefi } from "$lib/adapters/xdefi";
import type { AuthzExtension } from "@cosmjs/stargate/build/modules/authz/queries";
import { setupWasmExtension, type WasmExtension } from "@cosmjs/cosmwasm-stargate";
import type { TendermintClient } from "@cosmjs/tendermint-rpc";

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

export interface AccountData {
    address: string;
    pubkey: Uint8Array;
}

export enum ConnectionError {
    NotInstalled = 'not_installed',
    NoAccounts = 'no_accounts',
    GenericError = 'generic_error',
}

export type WalletMetadata = {
    adapter: WalletAdapter,
    name: string,
    logo: any,
};

export type Connectable<T> = { connect(chain: string): Promise<T>; isInstalled(): Promise<boolean>; metadata: WalletMetadata; };
export type Wallet = Connectable<Keplr> | Connectable<Sonar> | Connectable<Leap> | Connectable<MetaMask> | Connectable<Station> | Connectable<XDefi>;

export interface IWallet {
    disconnect: (this: IWallet) => void;
    account: AccountData | null;
    getMetadata: (this: IWallet) => WalletMetadata;
    // isInstalled: () => Promise<boolean>;
    // metadata: WalletMetadata;
    // connect: (chain: string) => Promise<IWallet>;
    // signAndBroadcast: (
    //     msgs: EncodeObject[],
    //     memo?: string
    // ) => Promise<DeliverTxResponse>;
    // feeDenom: string;
    // setFeeDenom: (denom: string) => void;
    // chainInfo: ChainInfo;
    // adapter: null | WalletAdapter;
};

export type KujiraClient = QueryClient &
    AuthExtension &
    AuthzExtension &
    BankExtension &
    GovExtension &
    StakingExtension &
    WasmExtension;
export async function createKujiraClient(client: TendermintClient): Promise<KujiraClient> {
    return QueryClient.withExtensions(client,
        setupAuthExtension,
        setupAuthzExtension,
        setupBankExtension,
        setupGovExtension,
        setupStakingExtension,
        setupWasmExtension,
    );
}