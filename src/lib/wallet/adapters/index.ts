import { get } from "svelte/store";
import { WalletAdapter, type Connectable } from "./types";
import { signer } from "../stores";
import { browser } from "$app/environment";

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
        case WalletAdapter.Readonly:
            const { ReadOnly } = await import("./readonly");
            return ReadOnly;
        default:
            return null;
    }
}

export const WALLETS: WalletAdapter[] = [WalletAdapter.Sonar, /*WalletAdapter.MetaMask,*/ WalletAdapter.Keplr, WalletAdapter.Leap, WalletAdapter.Station, WalletAdapter.XDefi, WalletAdapter.Readonly];

let hasSetupEventListeners = false;
export function setupEventListeners(): void {
    if (hasSetupEventListeners || !browser) return;
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