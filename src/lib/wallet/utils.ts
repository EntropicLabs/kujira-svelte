import { createWasmAminoConverters } from "@cosmjs/cosmwasm-stargate";
import * as s from "@cosmjs/stargate";
import { defaultRegistryTypes } from "@cosmjs/stargate";
import { wasmTypes } from "@cosmjs/cosmwasm-stargate";
import { ibcTypes } from "@cosmjs/stargate/build/modules";
import { Registry } from "@cosmjs/proto-signing";

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
