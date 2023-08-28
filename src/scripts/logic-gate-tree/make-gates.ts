import type { BinaryInput, BooleanInput, Gate, GateName, Leaf, VariableInput } from "./types";

// --------- MAKE LEAF ------------

export function makeBoolean(bool: BooleanInput): Leaf {
    return {
        value: bool,
        _tag: "boolean"
    }
}
export function makeBinary(binary: BinaryInput): Leaf {
    return {
        value: binary,
        _tag: "binary"
    }
}
export function makeVariable(variable: VariableInput): Leaf {
    return {
        value: variable,
        _tag: "variable"
    }
}

export function makeLeaf(inp: BooleanInput | BinaryInput | VariableInput): Leaf {
    switch(inp) {
        case "F":
        case "T":
            return makeBoolean(inp);
        case 1:
        case 0:
            return makeBinary(inp);
        default:
            return makeVariable(inp);
    }
}

// ----- MAKE GATE FROM STRING ------

export function makeGate(name: GateName, a: Gate, b: Gate | null): Gate {
    if(b === null && (name !== "~" && name !== "group")) {
        throw "Second input missing";
    }

    switch(name) {
        case "~":
            return {
                in: a,
                _tag: "~"
            }
        case "group":
            return {
                val: a,
                _tag: "group"
            }
        case "&":
        case "|":
        case "~&":
        case "~|":
        case "#":
        case "=>":
        case "<=>":
            return {
                a,
                b: b as Gate,
                _tag: name
            }
    }
}
