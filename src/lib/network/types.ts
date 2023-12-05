
import type { QueryClient, AuthExtension, GovExtension, StakingExtension, TxExtension } from "@cosmjs/stargate";
import type { AuthzExtension } from "@cosmjs/stargate/build/modules/authz/queries";
import type { WasmExtension } from "@cosmjs/cosmwasm-stargate";
import type { Tendermint37Client } from "@cosmjs/tendermint-rpc";
import type { BankExtensionExtended } from "./cosmos/bank";

export type KujiraClient = QueryClient &
    AuthExtension &
    AuthzExtension &
    BankExtensionExtended &
    GovExtension &
    StakingExtension &
    TxExtension &
    WasmExtension &
{ getTmClient: () => Tendermint37Client };

export type Client = {
    client: KujiraClient;
    rpc: string;
    chainId: string;
};