import { CosmjsOfflineSigner, connectSnap, getSnap, suggestChain } from "@leapwallet/cosmos-snap-provider";
import IconMetaMask from "$lib/icons/IconMetaMask.svelte";
import { GasPrice, SigningStargateClient } from "@cosmjs/stargate";
import { CHAIN_INFO, type NETWORK } from "$lib/resources/networks";
import type { OfflineSigner } from "@cosmjs/proto-signing";
import { aminoTypes, protoRegistry } from "../utils";
import { WalletAdapter, type AccountData, type IWallet, type WalletMetadata, ConnectionError } from "./types";
import type { KujiraClient } from "$lib/types";

export class MetaMask implements IWallet {
    private constructor(public account: AccountData, public signer: OfflineSigner, private chain: NETWORK) { }

    public static metadata: WalletMetadata = {
        adapter: WalletAdapter.MetaMask,
        name: 'MetaMask',
        logo: IconMetaMask,
        canSign: true,
    }
    public getMetadata(this: IWallet): WalletMetadata { return MetaMask.metadata; }
    public static async isInstalled(): Promise<boolean> {
        return !!(await getSnap());
    }
    public static async connect(chain: NETWORK): Promise<MetaMask> {
        if (!await MetaMask.isInstalled()) {
            throw ConnectionError.NotInstalled;
        }

        try {
            connectSnap();
            await suggestChain(CHAIN_INFO[chain], {}); try {
                const offlineSigner = new CosmjsOfflineSigner(chain);
                const accounts = await offlineSigner.getAccounts();
                if (accounts.length === 0) {
                    throw ConnectionError.NoAccounts;
                }
                const account = accounts[0];
                return new MetaMask(account, offlineSigner, chain as NETWORK);
            } catch (error) {
                console.error(error);
                throw ConnectionError.GenericError;
            }
        } catch (error) {
            console.error(error);
            throw ConnectionError.GenericError;
        }
    }

    public disconnect(): void { /* noop */ }

    public async getSigningClient(client: KujiraClient): Promise<SigningStargateClient> {
        if (!this.account) {
            throw new Error("No account connected");
        }
        const feeDenom = CHAIN_INFO[this.chain].feeCurrencies[0];
        const gasPrice = GasPrice.fromString(`${feeDenom.gasPriceStep!.low}${feeDenom.coinMinimalDenom}`);
        return SigningStargateClient.createWithSigner(client.getTmClient(), this.signer, { gasPrice, registry: protoRegistry, aminoTypes: aminoTypes("kujira") });
    }
}