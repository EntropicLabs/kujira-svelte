import IconSonar from "../icons/IconSonar.svelte";
import type { EncodeObject } from "@cosmjs/proto-signing";
import type { Account, GasPrice } from "@cosmjs/stargate";
import Client, { SignClient } from "@walletconnect/sign-client";

import type { SessionTypes } from "@walletconnect/types";
import { get, writable } from "svelte/store";
import { protoRegistry } from "../utils";
import { WalletAdapter, type WalletMetadata, type ISigner, type AccountData } from "./types";
import type { TendermintClient } from "@cosmjs/tendermint-rpc";
import { client, savedAdapter } from "$lib/stores";
import type { Pubkey } from "@cosmjs/amino";
import { validateAccount } from "./common";

type Session = SessionTypes.Struct;

const requiredNamespaces = {
    cosmos: {
        chains: ["cosmos:kaiyo-1"],
        methods: [],
        events: [],
    },
};

export const SonarURI = writable<string | null>(null);

export class Sonar implements ISigner {
    private acc: AccountData;
    private constructor(private signClient: Client, private session: Session, private chainId: string, account: Account & { pubkey: Pubkey }) {
        this.signClient.on("session_delete", () => {
            savedAdapter.set(WalletAdapter.Disconnected);
        });
        this.acc = {
            address: account.address,
            pubkey: account.pubkey,
        };
    }

    public static async connect(chain: string): Promise<Sonar> {
        const rpc = (await get(client)).client;
        const signClient = await SignClient.init({
            projectId: "fbda64846118d1a3487a4bfe3a6b00ac",
        });
        const chainId = `cosmos:${chain}`;
        const lastSession = signClient
            .find({
                requiredNamespaces,
            })
            .at(-1);
        if (lastSession) {
            const [addr] = lastSession.namespaces["cosmos"].accounts;
            const a = await rpc.auth.account(addr.split(":")[2])
            return new Sonar(signClient, lastSession, chainId, validateAccount(a));
        }

        const { uri, approval } = await signClient.connect({
            requiredNamespaces,
            optionalNamespaces: {
                cosmos: {
                    chains: [chainId],
                    methods: ["cosmos_signDirect"],
                    events: [],
                },
            },
        });

        uri && SonarURI.set(uri);

        const session = await approval();

        SonarURI.set(null);
        const [addr] = session.namespaces["cosmos"].accounts;
        const a = await rpc.auth.account(addr.split(":")[2])

        return new Sonar(signClient, session, chainId, validateAccount(a));
    }
    public disconnect() {
        this.signClient.disconnect({
            topic: this.session.topic,
            reason: { code: 1, message: "USER_CLOSED" },
        });
    }

    public static metadata: WalletMetadata = {
        adapter: WalletAdapter.Sonar,
        name: 'Sonar',
        logo: IconSonar,
        canSign: true,
    }
    public getMetadata(): WalletMetadata { return Sonar.metadata; }

    public static async isInstalled(): Promise<boolean> { return true; }

    public account(): AccountData { return this.acc; }

    public async sign(
        client: TendermintClient,
        msgs: EncodeObject[],
        gasLimit: Long,
        gasPrice: GasPrice,
        memo?: string
    ): Promise<Uint8Array> {
        const bytes = await this.signClient.request<string>({
            topic: this.session.topic,
            chainId: this.chainId,
            request: {
                method: this.session.namespaces["cosmos"].methods[0],
                params: {
                    feeDenom: gasPrice.denom,
                    memo,
                    msgs: msgs
                        .map((m) => protoRegistry.encodeAsAny(m))
                        .map((x) => ({
                            ...x,
                            value: Buffer.from(x.value).toString("base64"),
                        })),
                },
            },
        });
        return Buffer.from(bytes, "base64");
    }
}