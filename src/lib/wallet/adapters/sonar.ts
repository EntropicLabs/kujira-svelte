import IconSonar from "$lib/icons/IconSonar.svelte";
import { CHAIN_INFO, type NETWORK } from "$lib/resources/networks";
import type { AccountData, Algo, DirectSignResponse, OfflineDirectSigner, OfflineSigner } from "@cosmjs/proto-signing";
import { GasPrice, SigningStargateClient } from "@cosmjs/stargate";
import Client, { SignClient } from "@walletconnect/sign-client";
import type { SignDoc } from "cosmjs-types/cosmos/tx/v1beta1/tx";

import type { SessionTypes } from "@walletconnect/types";
import { writable } from "svelte/store";
import { wallet } from "$lib/stores";
import { aminoTypes, protoRegistry } from "../utils";
import { WalletAdapter, type IWallet, type WalletMetadata } from "./types";
import type { KujiraClient } from "$lib/types";

type Session = SessionTypes.Struct;

const requiredNamespaces = {
    cosmos: {
        chains: ["cosmos:kaiyo-1"],
        methods: [],
        events: [],
    },
};

export const SonarURI = writable<string | null>(null);

export class Sonar implements IWallet {
    public account: AccountData | null;
    private constructor(
        private signClient: Client,
        private session: Session,
        private chain: NETWORK
    ) {
        const [account] = session.namespaces["cosmos"].accounts.map(
            (address) => ({
                address: address.split(":")[2],
                pubkey: new Uint8Array(),
                algo: "secp256k1" as Algo,
            })
        );
        this.account = account;
        this.signClient.on("session_delete", () => {
            wallet.set(null);
        });
    }

    get signer(): OfflineSigner | null {
        return this.account ? this.getOfflineSigner() : null;
    }

    private getOfflineSigner(): OfflineSigner {
        return {
            getAccounts: async () => [this.account],
            signDirect: (signerAddress: string, signDoc: SignDoc) =>
                this.signDirect(signerAddress, signDoc),
        } as OfflineDirectSigner;
    }

    private async signDirect(signerAddress: string, signDoc: SignDoc): Promise<DirectSignResponse> {
        if (!this.session) {
            throw new Error(`Session for ${this.chain} not established yet.`);
        }

        const res = await this.signClient.request<string>({
            topic: this.session.topic,
            chainId: `cosmos:${this.chain}`,
            request: {
                method: 'cosmos_signDirect',
                params: {
                    signerAddress,
                    signDoc,
                }
            }
        });

        return {
            signed: signDoc,
            signature: {
                pub_key: {
                    type: "tendermint/PubKeySecp256k1",
                    value: this.account!.pubkey
                },
                signature: res,
            }
        }
    }

    public static metadata: WalletMetadata = {
        adapter: WalletAdapter.Sonar,
        name: 'Sonar',
        logo: IconSonar,
        canSign: true,
    }
    public getMetadata(this: IWallet): WalletMetadata { return Sonar.metadata; }
    public static async isInstalled(): Promise<boolean> { return true; }
    public static async connect(chain: string): Promise<Sonar> {
        const signClient = await SignClient.init({
            projectId: "fbda64846118d1a3487a4bfe3a6b00ac",
        });
        const lastSession = signClient
            .find({
                requiredNamespaces,
            })
            .at(-1);
        if (lastSession) {
            const res = await signClient.request({
                topic: lastSession.topic,
                chainId: `cosmos:${chain}`,
                request: {
                    method: "cosmos_getAccounts",
                    params: {},
                },
            });
            return new Sonar(signClient, lastSession, chain as NETWORK);
        }

        const { uri, approval } = await signClient.connect({
            requiredNamespaces,
            optionalNamespaces: {
                cosmos: {
                    chains: ["cosmos:kaiyo-1"],
                    methods: ["cosmos_signDirect"],
                    events: [],
                },
            },
        });

        uri && SonarURI.set(uri);
        console.log(uri);

        const session = await approval();

        SonarURI.set(null);

        return new Sonar(signClient, session, chain as NETWORK);
    }

    public disconnect(): void {
        this.signClient.disconnect({
            topic: this.session.topic,
            reason: { code: 1, message: "USER_CLOSED" },
        });
    }

    public async getSigningClient(client: KujiraClient): Promise<SigningStargateClient> {
        if (!this.account) {
            throw new Error("No account connected");
        }
        const feeDenom = CHAIN_INFO[this.chain].feeCurrencies[0];
        const gasPrice = GasPrice.fromString(`${feeDenom.gasPriceStep!.low}${feeDenom.coinMinimalDenom}`);
        return SigningStargateClient.createWithSigner(client.getTmClient(), this.signer!, { gasPrice, registry: protoRegistry, aminoTypes: aminoTypes("kujira") });
    }
}