import { QueryClient, type AuthExtension, type BankExtension, type GovExtension, type StakingExtension, setupAuthExtension, setupAuthzExtension, setupBankExtension, setupGovExtension, setupStakingExtension, type TxExtension, setupTxExtension, type StdFee, type Account } from "@cosmjs/stargate";
import type { AuthzExtension } from "@cosmjs/stargate/build/modules/authz/queries";
import { setupWasmExtension, type WasmExtension } from "@cosmjs/cosmwasm-stargate";
import type { TendermintClient } from "@cosmjs/tendermint-rpc";
import type { SimulateResponse } from "cosmjs-types/cosmos/tx/v1beta1/service";

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