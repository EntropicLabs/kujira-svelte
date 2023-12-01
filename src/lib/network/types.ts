
import type { QueryClient, AuthExtension, BankExtension, GovExtension, StakingExtension, TxExtension } from "@cosmjs/stargate";
import type { AuthzExtension } from "@cosmjs/stargate/build/modules/authz/queries";
import type { WasmExtension } from "@cosmjs/cosmwasm-stargate";
import type { TendermintClient } from "@cosmjs/tendermint-rpc";

export type KujiraClient = QueryClient &
    AuthExtension &
    AuthzExtension &
    BankExtension &
    GovExtension &
    StakingExtension &
    TxExtension &
    WasmExtension &
{ getTmClient: () => TendermintClient };

export type Client = {
    client: KujiraClient;
    rpc: string;
    chainId: string;
};