import { get, writable } from "svelte/store";
import type { GasPrice, StdFee } from "@cosmjs/stargate";
import type { TendermintClient } from "@cosmjs/tendermint-rpc";
import type { AccountData as CosmAccountData, EncodeObject } from "@cosmjs/proto-signing";
import { WalletAdapter, type AccountData, type WalletMetadata, ConnectionError, type ISigner } from "./types";
import { Eye } from "lucide-svelte";

export let readonlySignerAddress = writable<string | null>(null);

export class ReadOnly implements ISigner {
    private constructor(private acc: AccountData) { }

    public static async connect(chain: string): Promise<ReadOnly> {
        const address = get(readonlySignerAddress);
        if (!address) throw new Error("Readonly Signer Address is null");
        //TODO: Missing wallet input from user
        const account: AccountData = {
            address,
            pubkey: { type: '', value: '' }
        }

        return new ReadOnly(account);
    }
    public disconnect() { /* noop */ }

    public static metadata: WalletMetadata = {
        adapter: WalletAdapter.Readonly,
        name: 'Read Only',
        logo: Eye,
        canSign: false,
    }

    public getMetadata(): WalletMetadata { return ReadOnly.metadata; }

    public static async isInstalled(): Promise<boolean> { return true; }

    public account(): AccountData { return this.acc; }

    public async sign(_client: TendermintClient, _msgs: EncodeObject[], _fee: StdFee, _memo?: string | undefined): Promise<Uint8Array> {
        throw new Error("Readonly signer cannot sign");
    }
}
