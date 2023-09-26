import { WalletAdapter, type Wallet } from "$lib/types";
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

export const WALLETS: Wallet[] = [Sonar, Keplr, MetaMask, Leap, Station, XDefi];