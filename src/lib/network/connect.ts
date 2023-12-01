import { NETWORKS } from "$lib/resources/networks";
import { HttpBatchClient, Tendermint37Client, type StatusResponse, type TendermintClient } from "@cosmjs/tendermint-rpc";
import type { Client, KujiraClient } from "./types";
import { QueryClient, setupAuthExtension, setupAuthzExtension, setupBankExtension, setupGovExtension, setupStakingExtension, setupTxExtension } from "@cosmjs/stargate";
import { setupWasmExtension } from "@cosmjs/cosmwasm-stargate";


export async function createTMClient(rpc: string, dispatchInterval: number = 100, batchSizeLimit: number = 200): Promise<TendermintClient> {
    return Tendermint37Client.create(
        new HttpBatchClient(rpc, {
            dispatchInterval,
            batchSizeLimit,
        })
    );
}

export async function selectBestRPC(chainId: string, staleThreshold: number = 10): Promise<Client> {
    const startTime = Date.now();
    let latestHeight = 0;

    const rpcs = NETWORKS[chainId].rpcs;
    let clients: { client: TendermintClient, rpc: string, latency: number, status: StatusResponse }[] = [];
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

    return { client: await createKujiraClient(clients[0].client), rpc: clients[0].rpc, chainId };
}

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