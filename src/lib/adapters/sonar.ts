import IconSonar from "$lib/icons/IconSonar.svelte";
import { CHAIN_INFO, type NETWORK } from "$lib/resources/networks";
import { type AccountData, WalletAdapter, type WalletMetadata, type IWallet, type KujiraClient } from "$lib/types";
import type { OfflineSigner } from "@cosmjs/proto-signing";
import { GasPrice, SigningStargateClient } from "@cosmjs/stargate";

export class Sonar implements IWallet {
    private constructor(public account: AccountData | null, public signer: OfflineSigner, private chain: NETWORK) { }

    public static metadata: WalletMetadata = {
        adapter: WalletAdapter.Sonar,
        name: 'Sonar',
        logo: IconSonar,
        canSign: true,
    }
    public getMetadata (this: IWallet): WalletMetadata { return Sonar.metadata; }
    public static async isInstalled(): Promise<boolean> { return true; }
    public static async connect(chain: string): Promise<Sonar> {
        throw new Error('Sonar unimplemented');
    }

    public disconnect(): void { /* noop */ }

    public async getSigningClient(client: KujiraClient): Promise<SigningStargateClient> {
        if (!this.account) {
            throw new Error("No account connected");
        }
        const feeDenom = CHAIN_INFO[this.chain].feeCurrencies[0];
        const gasPrice = GasPrice.fromString(`${feeDenom.gasPriceStep!.low}${feeDenom.coinMinimalDenom}`);
        throw new Error('Sonar unimplemented');
        // return SigningStargateClient.createWithSigner(client.getTmClient(), this.signer, { gasPrice });
    }
}