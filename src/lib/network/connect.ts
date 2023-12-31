import { NETWORKS } from "$lib/resources/networks";
import { HttpBatchClient, Tendermint37Client, type StatusResponse } from "@cosmjs/tendermint-rpc";
import type { KujiraClient } from "./types";
import { QueryClient, setupAuthExtension, setupAuthzExtension, setupBankExtension, setupGovExtension, setupStakingExtension, setupTxExtension } from "@cosmjs/stargate";
import { setupWasmExtension } from "@cosmjs/cosmwasm-stargate";
import { setupBankExtensionExtended } from "./cosmos/bank";


export async function createTMClient(rpc: string, dispatchInterval: number = 100, batchSizeLimit: number = 200): Promise<Tendermint37Client> {
    return Tendermint37Client.create(
        new HttpBatchClient(rpc, {
            dispatchInterval,
            batchSizeLimit,
        })
    );
}

export async function selectBestRPC(chainId: string, staleThreshold: number = 10): Promise<KujiraClient> {
    const startTime = Date.now();
    let latestHeight = 0;

    const rpcs = NETWORKS[chainId].rpcs;
    let clients: { client: Tendermint37Client, rpc: string, latency: number, status: StatusResponse }[] = [];
    const promises = rpcs.map(async (rpc) => {
        const client = await createTMClient(rpc);
        const status = await client.status();
        const latency = Date.now() - startTime;
        const height = status.syncInfo.latestBlockHeight;
        if (height > latestHeight) {
            latestHeight = height;
        }
        clients.push({ client, rpc, latency, status });
    }).map((p) => p.catch((e) => { }));

    let tries = 0;
    while (clients.length === 0) {
        await Promise.race([
            Promise.all(promises),
            new Promise(resolve => setTimeout(resolve, 1000))
        ]);
        tries += 1;
        if (tries > 5) {
            break;
        }
    }

    clients = clients.filter((c) => latestHeight - c.status.syncInfo.latestBlockHeight < staleThreshold);
    clients.sort((a, b) => a.latency - b.latency);

    if (clients.length === 0) {
        throw new Error(`No RPCs available for ${chainId}`);
    }

    return await createKujiraClient(clients[0].client, chainId, clients[0].rpc);
}

export async function createKujiraClient(client: Tendermint37Client, chainId: string, rpc: string): Promise<KujiraClient> {
    let qc = QueryClient.withExtensions(client,
        setupAuthExtension,
        setupAuthzExtension,
        setupBankExtensionExtended,
        setupGovExtension,
        setupStakingExtension,
        setupTxExtension,
        setupWasmExtension,
    );
    Object.defineProperty(qc, 'getTmClient', {
        value: function () { return this.tmClient; },
    });
    Object.defineProperty(qc, 'getChainId', {
        value: function () { return chainId; },
    });
    Object.defineProperty(qc, 'getRpc', {
        value: function () { return rpc; },
    });
    return qc as KujiraClient;
}