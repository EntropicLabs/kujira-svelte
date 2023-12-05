
import type { QueryClient, AuthExtension, GovExtension, StakingExtension, TxExtension } from "@cosmjs/stargate";
import type { AuthzExtension } from "@cosmjs/stargate/build/modules/authz/queries";
import type { WasmExtension } from "@cosmjs/cosmwasm-stargate";
import type { Tendermint37Client } from "@cosmjs/tendermint-rpc";
import type { BankExtensionExtended } from "./cosmos/bank";

export interface ClientExtension {
    getTmClient: () => Tendermint37Client;
    getChainId: () => string;
    getRpc: () => string;
}

export type KujiraClient = QueryClient &
    AuthExtension &
    AuthzExtension &
    BankExtensionExtended &
    GovExtension &
    StakingExtension &
    TxExtension &
    WasmExtension &
    ClientExtension;