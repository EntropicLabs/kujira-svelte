import type { KujiraClient } from "$lib/network/types";
import type { AccountData, ISigner } from "$lib/wallet/adapters/types";
import { protoRegistry } from "$lib/wallet/utils";
import type { EncodeObject } from "@cosmjs/proto-signing";
import { GasPrice, accountFromAny } from "@cosmjs/stargate";
import type { SimulateResponse } from "cosmjs-types/cosmos/tx/v1beta1/service";
import type { Writable } from "svelte/store";
import { doBroadcastTx, pollInclusion } from "./broadcast";

export enum TxStep {
    None = "none",
    AccountQuery = "account_query",
    Simulation = "simulation",
    Simulated = "simulated",
    Signing = "signing",
    Broadcast = "broadcast",
    Inclusion = "inclusion",
    Committed = "committed",
}

export async function simulate(client: KujiraClient, account: AccountData, msgs: EncodeObject[], memo: string = "", trackState?: Writable<TxStep>) {
    const anyMsgs = msgs.map((m) => protoRegistry.encodeAsAny(m));

    trackState?.set(TxStep.AccountQuery);
    const accountQuery = await client.auth.account(account.address);
    if (!accountQuery) throw new Error("Account not found");
    const { sequence } = accountFromAny(accountQuery);

    trackState?.set(TxStep.Simulation);
    const simulation = await client.tx.simulate(
        anyMsgs,
        memo,
        account.pubkey,
        sequence
    );

    trackState?.set(TxStep.Simulated);
    return simulation;
}

export async function broadcastTx(client: KujiraClient, signer: ISigner, sim: SimulateResponse, msgs: EncodeObject[], memo: string = "", trackState?: Writable<TxStep>) {
    const gasEstimate = parseInt(sim.gasInfo!.gasUsed.toString());
    const gas = Math.round(gasEstimate * 1.4);

    trackState?.set(TxStep.Signing);
    const bytes = await signer.sign(
        client.getTmClient(),
        msgs,
        gas,
        GasPrice.fromString("0.00125ukuji"),
        memo
    );

    trackState?.set(TxStep.Broadcast);
    const hash = await doBroadcastTx(client, bytes);

    trackState?.set(TxStep.Inclusion);
    const result = await pollInclusion(client, hash);

    trackState?.set(TxStep.Committed);
    return result;
}