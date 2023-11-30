import { wallet } from "$lib/stores";
import { WalletAdapter, type Wallet } from "$lib/types";
import { get } from "svelte/store";
import { Keplr } from "./keplr";
import { Leap } from "./leap";
import { MetaMask } from "./metamask";
import { Sonar } from "./sonar";
import { Station } from "./station";
import { XDefi } from "./xdefi";

export function adapterToIWallet(adapter: WalletAdapter): Wallet | null {
    switch (adapter) {
        case WalletAdapter.Keplr:
            return Keplr;
        case WalletAdapter.Leap:
            return Leap;
        case WalletAdapter.MetaMask:
            return MetaMask;
        case WalletAdapter.Sonar:
            return Sonar;
        case WalletAdapter.Station:
            return Station;
        case WalletAdapter.XDefi:
            return XDefi;
        default:
            return null;
    }
}

export const WALLETS: Wallet[] = [/*Sonar, MetaMask,*/ Keplr, Leap, Station, XDefi];

let hasSetupEventListeners = false;
export function setupEventListeners(): void {
    if (hasSetupEventListeners) return;
    hasSetupEventListeners = true;

    window.addEventListener("keplr_keystorechange", async () => {
        const meta = get(wallet)?.getMetadata();
        if (meta?.adapter === WalletAdapter.Keplr || meta?.adapter === WalletAdapter.XDefi) {
            wallet.reload!();
        }
    });

    window.addEventListener("leap_keystorechange", async () => {
        const w = get(wallet);
        if (w && w.getMetadata().adapter === WalletAdapter.Leap) {
            wallet.reload!();
        }
    });
}