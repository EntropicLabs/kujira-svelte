import type { KujiraClient } from "$lib/network/types";
import { BroadcastTxError, fromTendermintEvent, type DeliverTxResponse, type IndexedTx, TimeoutError } from "@cosmjs/stargate";
import { TxMsgData } from "cosmjs-types/cosmos/base/abci/v1beta1/abci";

export async function doBroadcastTx(client: KujiraClient, tx: Uint8Array) {
    const broadcasted = await client.getTmClient().broadcastTxSync({ tx });
    if (broadcasted.code) {
        throw new BroadcastTxError(broadcasted.code, broadcasted.codespace ?? "", broadcasted.log);
    }

    const transactionId = Buffer.from(broadcasted.hash).toString("hex").toUpperCase();
    return transactionId;
}

export async function getTx(client: KujiraClient, id: string): Promise<IndexedTx | null> {
    const results = await txsQuery(client, `tx.hash='${id}'`);
    return results[0] ?? null;
}

async function txsQuery(client: KujiraClient, query: string): Promise<IndexedTx[]> {
    const results = await client.getTmClient().txSearchAll({ query: query });
    return results.txs.map((tx): IndexedTx => {
        const txMsgData = TxMsgData.decode(tx.result.data ?? new Uint8Array());
        return {
            height: tx.height,
            txIndex: tx.index,
            hash: Buffer.from(tx.hash).toString("hex").toUpperCase(),
            code: tx.result.code,
            events: tx.result.events.map(fromTendermintEvent),
            rawLog: tx.result.log || "",
            tx: tx.tx,
            msgResponses: txMsgData.msgResponses,
            gasUsed: tx.result.gasUsed,
            gasWanted: tx.result.gasWanted,
        };
    });
}

export async function pollInclusion(client: KujiraClient, hash: string, timeoutMs: number = 60_000, pollIntervalMs: number = 3_000) {
    let timedOut = false;
    const txPollTimeout = setTimeout(() => {
        timedOut = true;
    }, timeoutMs);

    const pollForTx = async (txId: string): Promise<DeliverTxResponse> => {
        if (timedOut) {
            throw new TimeoutError(
                `Transaction with ID ${txId} was submitted but was not yet found on the chain. You might want to check later. There was a wait of ${timeoutMs / 1000
                } seconds.`,
                txId,
            );
        }
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        const result = await getTx(client, txId);
        return result
            ? {
                code: result.code,
                height: result.height,
                txIndex: result.txIndex,
                rawLog: result.rawLog,
                transactionHash: txId,
                events: result.events,
                msgResponses: result.msgResponses,
                gasUsed: result.gasUsed,
                gasWanted: result.gasWanted,
            }
            : pollForTx(txId);
    };

    return await pollForTx(hash).finally(() => clearTimeout(txPollTimeout));
}