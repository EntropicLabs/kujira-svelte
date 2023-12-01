import { CosmjsOfflineSigner, connectSnap, getSnap, suggestChain } from "@leapwallet/cosmos-snap-provider";
import IconMetaMask from "../icons/IconMetaMask.svelte";
import type { GasPrice } from "@cosmjs/stargate";
import { CHAIN_INFO, type NETWORK } from "$lib/resources/networks";
import type { EncodeObject, OfflineSigner } from "@cosmjs/proto-signing";
import { WalletAdapter, type AccountData, type WalletMetadata, ConnectionError, type ISigner } from "./types";
import type { TendermintClient } from "@cosmjs/tendermint-rpc";
import { convertAccountData, offlineSignerSign } from "./common";

export class MetaMask implements ISigner {
    private constructor(private acc: AccountData, private signer: OfflineSigner) { }

    public static async connect(chain: NETWORK): Promise<MetaMask> {
        if (!await MetaMask.isInstalled()) {
            throw ConnectionError.NotInstalled;
        }

        try {
            connectSnap();
            await suggestChain(CHAIN_INFO[chain], {});
            const offlineSigner = new CosmjsOfflineSigner(chain);
            const accounts = await offlineSigner.getAccounts();
            if (accounts.length === 0) {
                throw ConnectionError.NoAccounts;
            }
            return new MetaMask(convertAccountData(accounts[0]), offlineSigner);
        } catch (error) {
            console.error(error);
            throw ConnectionError.GenericError;
        }
    }
    public disconnect() { /* noop */ }

    public static metadata: WalletMetadata = {
        adapter: WalletAdapter.MetaMask,
        name: 'MetaMask',
        logo: IconMetaMask,
        canSign: true,
    }
    public getMetadata(): WalletMetadata { return MetaMask.metadata; }

    public static async isInstalled(): Promise<boolean> { return !!(await getSnap()); }

    public account(): AccountData { return this.acc; }

    public async sign(
        client: TendermintClient,
        msgs: EncodeObject[],
        gasLimit: number,
        gasPrice: GasPrice,
        memo?: string
    ): Promise<Uint8Array> {
        return offlineSignerSign(this.signer, this.acc.address, client, msgs, gasLimit, gasPrice, memo);
    }
}