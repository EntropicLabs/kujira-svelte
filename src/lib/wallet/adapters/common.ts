import type { AccountData as CosmAccountData, EncodeObject, OfflineSigner } from "@cosmjs/proto-signing";
import { SigningStargateClient, type Account, accountFromAny, type StdFee } from "@cosmjs/stargate";
import type { TendermintClient } from "@cosmjs/tendermint-rpc";
import { aminoTypes, protoRegistry } from "../utils";
import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import type { Any } from "cosmjs-types/google/protobuf/any";
import { encodeSecp256k1Pubkey, type Algo, type Pubkey, encodeEd25519Pubkey } from "@cosmjs/amino";
import type { AccountData } from "./types";

export async function offlineSignerSign(
    signer: OfflineSigner,
    address: string,
    client: TendermintClient,
    msgs: EncodeObject[],
    fee: StdFee,
    memo?: string
): Promise<Uint8Array> {
    const s = await SigningStargateClient.createWithSigner(
        client,
        signer,
        {
            registry: protoRegistry,
            aminoTypes: aminoTypes("kujira")
        }
    );
    const txRaw = await s.sign(
        address,
        msgs,
        fee,
        memo ?? "",
    );
    const bytes = TxRaw.encode(txRaw).finish();
    return bytes;
}

export function validateAccount(acc: Any | null): Account & { pubkey: Pubkey } {
    if (!acc) throw new Error("Account not found on chain.");
    const account = accountFromAny(acc);
    if (!account.pubkey) throw new Error("Account has no pubkey.");
    return account as Account & { pubkey: Pubkey };
}

export function encodePubkey(pubkey: Uint8Array, algo: Algo): Pubkey {
    switch (algo) {
        case "secp256k1":
            return encodeSecp256k1Pubkey(pubkey);
        case "ed25519":
            return encodeEd25519Pubkey(pubkey);
        default:
            throw new Error("Unsupported pubkey type.");
    }
}

export function convertAccountData(acc: CosmAccountData): AccountData {
    return {
        address: acc.address,
        pubkey: encodePubkey(acc.pubkey, acc.algo),
    };
} 