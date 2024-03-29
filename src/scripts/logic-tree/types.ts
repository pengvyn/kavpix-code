import type { Variable } from "../tree-expressions/types"

// ===== INPUT TYPES =====


// --- Main types ---
export type BooleanInput = "T" | "F";
export type BinaryInput = 0 | 1;
export type VariableInput = Variable;

// --- Interfaces ---

export interface BooleanLeaf {
    value: BooleanInput,
    _tag: "boolean",
}
export interface BinaryLeaf {
    value: BinaryInput,
    _tag: "binary",
}

export type BinaryOrBoolLeaf = BooleanLeaf | BinaryLeaf;

interface VariableLeaf {
    value: VariableInput,
    _tag: "variable",
}

// --- All input types combined ---

export type Leaf = BooleanLeaf | BinaryLeaf | VariableLeaf;

// ===== GATE INTERFACES =====

export interface Not {
    in: Gate,
    _tag: "~",
}
export interface And {
    a: Gate,
    b: Gate,
    _tag: "&",
}
export interface Or {
    a: Gate,
    b: Gate,
    _tag: "|",
}
export interface Nand {
    a: Gate,
    b: Gate,
    _tag: "~&",
}
export interface Nor {
    a: Gate,
    b: Gate,
    _tag: "~|",
}
export interface Xor {
    a: Gate,
    b: Gate,
    _tag: "!=",
}
export interface Group {
    val: Gate,
    _tag: "group"
}
export interface Implies {
    a: Gate,
    b: Gate,
    _tag: "=>"
}
export interface Equivalence {
    a: Gate,
    b: Gate,
    _tag: "<=>"
}
export type GatesWithInputs =  Not | And | Or | Nand | Nor | Xor | Group | Implies | Equivalence;
export type BinaryInputGate = And | Or | Nand | Nor | Xor | Implies | Equivalence;
export type GateName = GatesWithInputs["_tag"];

export type BinaryInputLeafGate = {
    a: BinaryLeaf,
    b: BinaryLeaf,
    _tag: BinaryInputGate["_tag"],
}

// ===== MAIN GATE TYPE =====

export type Gate = Not | And | Or | Nand | Nor | Xor | Leaf | Group | Implies | Equivalence;

// --------------------------------------------------------------------------------------

// =========!! PARSER !!=========

// value is T, F, 0, 1, or variable
const _nextExps = ["parentheses", "gate", "leaf", "not"] as const;
export type NextExp = typeof _nextExps[number];
export const nextExps: readonly NextExp[] = _nextExps;

interface WaitingGroup {
    expression: string,
    _tag: "grouped" | "ungrouped",
}

export interface Waiting {
    gateName: GateName | null,
    isNegated: boolean,
    group: WaitingGroup
}

export interface ParsedWaitNext {
    parsed: Gate | null,
    wait: Waiting,
    next: NextExp[],
}


// ======== !ORDERER! ========

export interface GatePrecedence {
    name: Gate["_tag"],
    precedence: number,
}

// ====== !LISTIFIER! =========

export interface GateBranch {
    name: string,
    key: string,
    parent: string | null
}

export interface CytoscapeNode {
    data: {
        id: string,
        label: string,
    }
}
export interface CytoscapeEdge {
    data: {
        id: string,
        source: string,
        target: string,
    }
}

// ============ !LOGIC TREE INTERACTIONS! ===============

export interface VariableAndValue {
    variable: Variable,
    value: VariablesValue,
}

export type VariablesValue = "0" | "1" | "T" | "F" | undefined;