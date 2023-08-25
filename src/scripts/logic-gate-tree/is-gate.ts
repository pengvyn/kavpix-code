import type { BinaryLeaf, BooleanLeaf, Gate, Leaf } from "./types";

export function isBinaryOrBooleanLeaf(gate: Gate): gate is BinaryLeaf | BooleanLeaf {
    return gate._tag === "binary" || gate._tag === "boolean";
}
export function isLeaf(gate: Gate): gate is Leaf {
    return gate._tag === "binary" || gate._tag == "boolean" || gate._tag === "variable";
}