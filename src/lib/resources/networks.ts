import IconKujira from "$lib/icons/IconKujira.svelte";
import type { Client } from "$lib/stores";
import { createKujiraClient } from "$lib/types";
import { HttpBatchClient, Tendermint34Client, type StatusResponse } from "@cosmjs/tendermint-rpc";
import type { ChainInfo, FeeCurrency } from "@keplr-wallet/types";

export const MAINNET = "kaiyo-1";
export const TESTNET = "harpoon-4";
export const LOCALNET = "localkujira";

export type NETWORK = typeof MAINNET | typeof TESTNET | typeof LOCALNET;

export type NetworkMetadata = {
    name: string;
    chainId: NETWORK;
    prod: boolean;
    icon: any;
    explorer: string;
    rpcs: string[];
};

export const NETWORKS: Record<string, NetworkMetadata> = {
    [TESTNET]: {
        name: "Kujira Testnet",
        chainId: TESTNET,
        prod: false,
        icon: IconKujira,
        explorer: `https://finder.kujira.network/${TESTNET}`,
        rpcs: [
            "https://kujira-testnet-rpc.polkachu.com",
            "https://test-rpc-kujira.mintthemoon.xyz",
            "https://dev-rpc-kujira.mintthemoon.xyz",
        ],
    },
    [MAINNET]: {
        name: "Kujira",
        chainId: MAINNET,
        prod: true,
        icon: IconKujira,
        explorer: `https://finder.kujira.network/${MAINNET}`,
        rpcs: [
            "https://kujira-mainnet-rpc.autostake.com",
            "https://kujira-rpc.ibs.team",
            "https://kujira-rpc.nodes.defiantlabs.net",
            "https://kujira-rpc.openbitlab.com",
            "https://kujira-rpc.theamsolutions.info",
            "https://kujira.rpc.ghostinnet.com",
            "https://kujira.rpc.kjnodes.com",
            "https://rpc-kujira.capybaralabs.com/",
            "https://rpc-kujira.mintthemoon.xyz",
            "https://rpc-kujira.mms.team",
            "https://rpc-kujira.rorcualnodes.com",
            "https://rpc-kujira.starsquid.io",
            "https://rpc-kujira.synergynodes.com",
            "https://rpc.kujira.rektdao.club",
            // "https://kuji-rpc.kleomedes.network",
            // "https://kujira-rpc.lavenderfive.com",
            // "https://kujira-rpc.polkachu.com",
            // "https://rpc-kujira.whispernode.com",
        ],
    },
    [LOCALNET]: {
        name: "Local Kujira",
        chainId: LOCALNET,
        prod: false,
        icon: IconKujira,
        explorer: `https://finder.kujira.network/${LOCALNET}`,
        rpcs: ["http://localhost:26657"],
    },
};

const chainInfo = (
    chainId: string,
    chainName: string,
    rpc: string,
    rest: string,
    fees: FeeCurrency[] = []
) => ({
    chainId,
    chainName,
    rpc,
    rest,
    bip44: {
        coinType: 118,
    },
    bech32Config: {
        bech32PrefixAccAddr: "kujira",
        bech32PrefixAccPub: "kujira" + "pub",
        bech32PrefixValAddr: "kujira" + "valoper",
        bech32PrefixValPub: "kujira" + "valoperpub",
        bech32PrefixConsAddr: "kujira" + "valcons",
        bech32PrefixConsPub: "kujira" + "valconspub",
    },
    currencies: [
        {
            coinDenom: "KUJI",
            coinMinimalDenom: "ukuji",
            coinDecimals: 6,
            coinGeckoId: "kujira",
        },
        ...fees,
    ],
    feeCurrencies: [
        {
            coinDenom: "KUJI",
            coinMinimalDenom: "ukuji",
            coinDecimals: 6,
            coinGeckoId: "kujira",
            gasPriceStep: {
                low: 0.00125,
                average: 0.0025,
                high: 0.00375,
            }
        },
        ...fees,
    ],
    stakeCurrency: {
        coinDenom: "KUJI",
        coinMinimalDenom: "ukuji",
        coinDecimals: 6,
        coinGeckoId: "kujira",
    },
    coinType: 118,
});

export const CHAIN_INFO: Record<NETWORK, ChainInfo> = {
    [TESTNET]: chainInfo(
        TESTNET,
        "Kujira Testnet",
        "https://test-rpc-kujira.mintthemoon.xyz",
        "https://test-lcd-kujira.mintthemoon.xyz",
        [
            {
                coinDenom: "DEMO",
                coinMinimalDenom:
                    "factory/kujira1ltvwg69sw3c5z99c6rr08hal7v0kdzfxz07yj5/demo",
                coinDecimals: 6,
                coinGeckoId: "kujira",
                gasPriceStep: {
                    low: 0.00125,
                    average: 0.0025,
                    high: 0.00375,
                },
            },
        ]
    ),
    [LOCALNET]: chainInfo(
        LOCALNET,
        "Kujira Local",
        "http://localhost:26657",
        "http://localhost:1317"
    ),
    [MAINNET]: chainInfo(
        MAINNET,
        "Kujira",
        "https://rpc.cosmos.directory/kujira",
        "https://rest.cosmos.directory/kujira",
        [
            {
                coinDenom: "USK",
                coinMinimalDenom:
                    "factory/kujira1qk00h5atutpsv900x202pxx42npjr9thg58dnqpa72f2p7m2luase444a7/uusk",
                coinDecimals: 6,
                coinGeckoId: "usk",
                gasPriceStep: {
                    low: 0.0015,
                    average: 0.0025,
                    high: 0.0035,
                },
            },
            {
                coinDenom: "axlUSDC",
                coinMinimalDenom:
                    "ibc/295548A78785A1007F232DE286149A6FF512F180AF5657780FC89C009E2C348F",
                coinDecimals: 6,
                coinGeckoId: "usdc",
                gasPriceStep: {
                    low: 0.0015,
                    average: 0.0025,
                    high: 0.0035,
                },
            },
            {
                coinDenom: "ATOM",
                coinMinimalDenom:
                    "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2",
                coinDecimals: 6,
                coinGeckoId: "cosmoshub",
                gasPriceStep: {
                    low: 0.000125,
                    average: 0.000225,
                    high: 0.000325,
                },
            },
            {
                coinDenom: "CMDX",
                coinMinimalDenom:
                    "ibc/3607EB5B5E64DD1C0E12E07F077FF470D5BC4706AFCBC98FE1BA960E5AE4CE07",
                coinDecimals: 6,
                coinGeckoId: "comdex",
                gasPriceStep: {
                    low: 0.00652,
                    average: 0.00852,
                    high: 0.01052,
                },
            },
            {
                coinDenom: "EVMOS",
                coinMinimalDenom:
                    "ibc/F3AA7EF362EC5E791FE78A0F4CCC69FEE1F9A7485EB1A8CAB3F6601C00522F10",
                coinDecimals: 18,
                coinGeckoId: "evmos",
                gasPriceStep: {
                    low: 617283951,
                    average: 717283951,
                    high: 817283951,
                },
            },
            {
                coinDenom: "JUNO",
                coinMinimalDenom:
                    "ibc/EFF323CC632EC4F747C61BCE238A758EFDB7699C3226565F7C20DA06509D59A5",
                coinDecimals: 6,
                coinGeckoId: "juno",
                gasPriceStep: {
                    low: 0.000288,
                    average: 0.000388,
                    high: 0.000488,
                },
            },

            {
                coinDenom: "OSMO",
                coinMinimalDenom:
                    "ibc/47BD209179859CDE4A2806763D7189B6E6FE13A17880FE2B42DE1E6C1E329E23",
                coinDecimals: 6,
                coinGeckoId: "osmosis",
                gasPriceStep: {
                    low: 0.00126,
                    average: 0.0025,
                    high: 0.00375,
                },
            },
            {
                coinDenom: "SCRT",
                coinMinimalDenom:
                    "ibc/A358D7F19237777AF6D8AD0E0F53268F8B18AE8A53ED318095C14D6D7F3B2DB5",
                coinDecimals: 6,
                coinGeckoId: "secret",
                gasPriceStep: {
                    low: 0.00137,
                    average: 0.00237,
                    high: 0.00337,
                },
            },
            {
                coinDenom: "STARS",
                coinMinimalDenom:
                    "ibc/4F393C3FCA4190C0A6756CE7F6D897D5D1BE57D6CCB80D0BC87393566A7B6602",
                coinDecimals: 6,
                coinGeckoId: "stars",
                gasPriceStep: {
                    low: 0.0488,
                    average: 0.0588,
                    high: 0.0688,
                },
            },
            {
                coinDenom: "wAVAX",
                coinMinimalDenom:
                    "ibc/004EBF085BBED1029326D56BE8A2E67C08CECE670A94AC1947DF413EF5130EB2",
                coinDecimals: 18,
                coinGeckoId: "avalanche-2",
                gasPriceStep: {
                    low: 78492936,
                    average: 88492936,
                    high: 98492936,
                },
            },
            {
                coinDenom: "wETH",
                coinMinimalDenom:
                    "ibc/1B38805B1C75352B28169284F96DF56BDEBD9E8FAC005BDCC8CF0378C82AA8E7",
                coinDecimals: 18,
                coinGeckoId: "ethereum",
                gasPriceStep: {
                    low: 964351,
                    average: 1064351,
                    high: 1164351,
                },
            },
        ]
    ),
};

export async function createTMClient(rpc: string, dispatchInterval: number = 100, batchSizeLimit: number = 200): Promise<Tendermint34Client> {
    return Tendermint34Client.create(
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
    let clients: { client: Tendermint34Client, rpc: string, latency: number, status: StatusResponse }[] = [];
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

    return { client: await createKujiraClient(clients[0].client), rpc: clients[0].rpc, chainId };
}