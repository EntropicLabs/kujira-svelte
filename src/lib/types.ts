import { QueryClient, type AuthExtension, type BankExtension, type GovExtension, type StakingExtension, setupAuthExtension, setupAuthzExtension, setupBankExtension, setupGovExtension, setupStakingExtension, type TxExtension, setupTxExtension, type DeliverTxResponse, SigningStargateClient, type StdFee, type Account } from "@cosmjs/stargate";
import type { Keplr } from "$lib/adapters/keplr";
import type { Leap } from "$lib/adapters/leap";
import type { MetaMask } from "$lib/adapters/metamask";
import type { Sonar } from "$lib/adapters/sonar";
import type { Station } from "$lib/adapters/station";
import type { XDefi } from "$lib/adapters/xdefi";
import type { AuthzExtension } from "@cosmjs/stargate/build/modules/authz/queries";
import { setupWasmExtension, type WasmExtension } from "@cosmjs/cosmwasm-stargate";
import type { TendermintClient } from "@cosmjs/tendermint-rpc";
import type { OfflineSigner } from "@cosmjs/proto-signing";
import type { SimulateResponse } from "cosmjs-types/cosmos/tx/v1beta1/service";

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

export type KujiraClient = QueryClient &
    AuthExtension &
    AuthzExtension &
    BankExtension &
    GovExtension &
    StakingExtension &
    TxExtension &
    WasmExtension &
{ getTmClient: () => TendermintClient };
export async function createKujiraClient(client: TendermintClient): Promise<KujiraClient> {
    let qc = QueryClient.withExtensions(client,
        setupAuthExtension,
        setupAuthzExtension,
        setupBankExtension,
        setupGovExtension,
        setupStakingExtension,
        setupTxExtension,
        setupWasmExtension,
    );
    Object.defineProperty(qc, 'getTmClient', {
        value: function () { return this.tmClient; },
    });
    return qc as KujiraClient;
}

export type Simulation = {
    fee: StdFee;
    simulation: SimulateResponse;
    account: Account;
}