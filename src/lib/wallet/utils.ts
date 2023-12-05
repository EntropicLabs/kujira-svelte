import { createWasmAminoConverters } from "@cosmjs/cosmwasm-stargate";
import * as s from "@cosmjs/stargate";
import { GasPrice, defaultRegistryTypes, type StdFee } from "@cosmjs/stargate";
import { wasmTypes } from "@cosmjs/cosmwasm-stargate";
import { ibcTypes } from "@cosmjs/stargate/build/modules";
import { Registry, coins } from "@cosmjs/proto-signing";
import type BigNumber from "bignumber.js";
import { Uint64 } from "@cosmjs/math";
import type { GasInfo } from "cosmjs-types/cosmos/base/abci/v1beta1/abci";

const types = [
    ...defaultRegistryTypes,
    ...wasmTypes,
    ...ibcTypes,
];

export const protoRegistry = new Registry(types);
export const aminoTypes = (prefix: string): s.AminoTypes =>
    new s.AminoTypes({
        ...s.createBankAminoConverters(),
        ...s.createDistributionAminoConverters(),
        ...s.createFeegrantAminoConverters(),
        ...s.createGovAminoConverters(),
        ...s.createIbcAminoConverters(),
        ...s.createStakingAminoConverters(),
        ...s.createVestingAminoConverters(),
        ...createWasmAminoConverters(),
    });



export function localeDecimalSep() {
    return Intl.NumberFormat()
        .formatToParts(1.1)
        .find(part => part.type === 'decimal')!
        .value;
}

export function localeThousandsSep() {
    return Intl.NumberFormat()
        .formatToParts(1000)
        .find(part => part.type === 'group')!
        .value;
}

export function formatBigNumber(value: BigNumber, decimals: number = 2): string {
    const parts = value.toFixed(decimals, 1).split(".");
    const integer = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, localeThousandsSep());
    if (parts.length === 1) return integer;
    const decimal = parts[1];
    return `${integer}${localeDecimalSep()}${decimal}`;
}

export function calculateFee(gas: number | GasInfo, gasPrice: GasPrice, gasAdjustment: number = 1.0): StdFee {
    if (typeof gas !== "number") {
        gas = parseInt(gas.gasUsed.toString());
    }
    const amount = gasPrice.amount.multiply(Uint64.fromNumber(gas * gasAdjustment)).ceil().toString();
    const fee = {
        amount: coins(amount, gasPrice.denom),
        gas: gas.toString(),
    };
    return fee;
}