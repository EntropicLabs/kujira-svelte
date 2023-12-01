import { createWasmAminoConverters } from "@cosmjs/cosmwasm-stargate";
import * as s from "@cosmjs/stargate";
import { defaultRegistryTypes } from "@cosmjs/stargate";
import { wasmTypes } from "@cosmjs/cosmwasm-stargate";
import { ibcTypes } from "@cosmjs/stargate/build/modules";
import { Registry } from "@cosmjs/proto-signing";
import type BigNumber from "bignumber.js";

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