import { get } from "svelte/store";
import { Sonar } from "./sonar";
import { Station } from "./station";
import { Keplr } from "./keplr";
import { Leap } from "./leap";
import { MetaMask } from "./metamask";
import { XDefi } from "./xdefi";
import { WalletAdapter, type Connectable } from "./types";
import { signer } from "$lib/stores";

export async function adapterToIWallet(adapter: WalletAdapter): Promise<Connectable | null> {
    switch (adapter) {
        case WalletAdapter.Keplr:
            const { Keplr } = await import("./keplr");
            return Keplr;
        case WalletAdapter.Leap:
            const { Leap } = await import("./leap");
            return Leap;
        case WalletAdapter.MetaMask:
            const { MetaMask } = await import("./metamask");
            return MetaMask;
        case WalletAdapter.Sonar:
            const { Sonar } = await import("./sonar");
            return Sonar;
        case WalletAdapter.Station:
            const { Station } = await import("./station");
            return Station;
        case WalletAdapter.XDefi:
            const { XDefi } = await import("./xdefi");
            return XDefi;
        default:
            return null;
    }
}

export const WALLETS: Connectable[] = [Sonar, /*MetaMask,*/ Keplr, Leap, Station, XDefi];

let hasSetupEventListeners = false;
export function setupEventListeners(): void {
    if (hasSetupEventListeners) return;
    hasSetupEventListeners = true;

    window.addEventListener("keplr_keystorechange", async () => {
        const meta = (await get(signer))?.getMetadata();
        if (meta?.adapter === WalletAdapter.Keplr || meta?.adapter === WalletAdapter.XDefi) {
            console.log("Reloading signer (keplr_keystorechange)");
            signer.reload!();
        }
    });

    window.addEventListener("leap_keystorechange", async () => {
        const s = await get(signer);
        if (s?.getMetadata().adapter === WalletAdapter.Leap) {
            console.log("Reloading signer (leap_keystorechange)");
            signer.reload!();
        }
    });
}