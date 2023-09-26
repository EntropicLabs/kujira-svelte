import IconSonar from "$lib/icons/IconSonar.svelte";
import { type AccountData, WalletAdapter, type WalletMetadata, type IWallet } from "$lib/types";

export class Sonar implements IWallet {
    private constructor(public account: AccountData | null) { }

    public static metadata: WalletMetadata = {
        adapter: WalletAdapter.Sonar,
        name: 'Sonar',
        logo: IconSonar,
    }
    public getMetadata (this: IWallet): WalletMetadata { return Sonar.metadata; }
    public static async isInstalled(): Promise<boolean> { return true; }
    public static async connect(chain: string): Promise<Sonar> {
        throw new Error('Sonar unimplemented');
    }

    public disconnect(): void { console.log('sonar disconnect'); }
}