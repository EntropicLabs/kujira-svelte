import { writable } from "svelte/store";
import type { GasPrice } from "@cosmjs/stargate";
import type { TendermintClient } from "@cosmjs/tendermint-rpc";
import type { AccountData as CosmAccountData, EncodeObject } from "@cosmjs/proto-signing";
import { WalletAdapter, type AccountData, type WalletMetadata, ConnectionError, type ISigner } from "./types";

export let ViewOnlyAddress = writable<string | null>(null);

export class ReadOnly implements ISigner {
    private constructor(private acc: AccountData) { }

    public static async connect(chain: string): Promise<ReadOnly> {

        //TODO: Missing wallet input from user
        const account: AccountData = {
            address: 'kujira1w29z0mzn7sx48xrcke0nzsr8gcwvcel7euj9mk',
            pubkey: {
                type: '',
                value: ''
            }
        }

        return new ReadOnly(account);
    }
    public disconnect() { /* noop */ }

    public static metadata: WalletMetadata = {
        adapter: WalletAdapter.Readonly,
        name: 'View Only',
        logo: '',
        canSign: false,
    }
    public getMetadata(): WalletMetadata { return ReadOnly.metadata; }

    public static async isInstalled(): Promise<boolean> { return true; }

    public account(): AccountData { return this.acc; }

    public async sign(
        client: TendermintClient,
        msgs: EncodeObject[],
        gasLimit: number,
        gasPrice: GasPrice,
        memo?: string
    ): Promise<Uint8Array> {
        return new Uint8Array();
    }
}
