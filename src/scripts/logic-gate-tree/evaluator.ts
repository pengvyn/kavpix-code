import { isBinaryOrBooleanLeaf, isLeaf } from "./is-gate";
import { makeGate, makeLeaf } from "./make-gates";
import type { BinaryInputGate, BinaryInputLeafGate, BinaryLeaf, BinaryOrBoolLeaf, BooleanLeaf, Gate, Leaf, Not } from "./types";

export function evaluateGateRecurse(gate: Gate): Gate {
    // evaluate left and evaluate right
    // or evaluate the in/val
    
    switch(gate._tag) {
        case "binary":
        case "boolean":
        case "variable":
            return gate;
        case "~":
            const evalIn = evaluateGateRecurse(gate.in);
            return evaluateGate(makeGate("~", evalIn, null));
        case "group":
            const evalVal = evaluateGateRecurse(gate.val);
            return isLeaf(evalVal) ? evalVal : evaluateGate(makeGate("group", evalVal, null));
        case "&":
        case "|":
        case "~&":
        case "~|":
        case "#":
            const evalA = evaluateGateRecurse(gate.a);
            const evalB = evaluateGateRecurse(gate.b);

            return evaluateGate(makeGate(gate._tag, evalA, evalB));
    }
}

export function getBinaryValue(value: "T" | "F" | 1 | 0): 1 | 0 {
    switch(value) {
        case "T":
        case 1:
            return 1;
        case "F":
        case 0:
            return 0;
    }
}

export function notGate(leaf: BinaryOrBoolLeaf): BinaryLeaf {
    return (getBinaryValue(leaf.value) === 1 ? makeLeaf(0) : makeLeaf(1)) as BinaryLeaf;
}
export function andGate(aBool: BinaryOrBoolLeaf, bBool: BinaryOrBoolLeaf): BinaryLeaf {
    const a = getBinaryValue(aBool.value);
    const b = getBinaryValue(bBool.value);

    return makeLeaf((a * b) as 0 | 1) as BinaryLeaf;
    // 0 * 0 = 0
    // 0 * 1 = 0
    // 1 * 0 = 0
    // 1 * 1 = 1
}
export function orGate(aBool: BinaryOrBoolLeaf, bBool: BinaryLeaf): BinaryLeaf {
    const a = getBinaryValue(aBool.value);
    const b = getBinaryValue(bBool.value);

    return makeLeaf(a === 1 || b === 1 ? 1 : 0) as BinaryLeaf;
}
export function nandGate(aBool: BinaryOrBoolLeaf, bBool: BinaryOrBoolLeaf): BinaryLeaf {
    const a = makeLeaf(getBinaryValue(aBool.value)) as BinaryLeaf;
    const b = makeLeaf(getBinaryValue(bBool.value)) as BinaryLeaf;

    const aAndB = andGate(a, b);
    return notGate(aAndB)
}
export function norGate(aBool: BinaryOrBoolLeaf, bBool: BinaryOrBoolLeaf): BinaryLeaf {
    const a = makeLeaf(getBinaryValue(aBool.value)) as BinaryLeaf;
    const b = makeLeaf(getBinaryValue(bBool.value)) as BinaryLeaf;

    const aOrB = orGate(a, b);
    return notGate(aOrB)
}
export function xorGate(aBool: BinaryOrBoolLeaf, bBool: BinaryOrBoolLeaf): BinaryLeaf {
    const a = makeLeaf(getBinaryValue(aBool.value)) as BinaryLeaf;
    const b = makeLeaf(getBinaryValue(bBool.value)) as BinaryLeaf;

    const aNandB = nandGate(a, b);
    const aOrB = orGate(a, b);

    return andGate(aNandB, aOrB);
}

function aAndBBinaryBoolLeaf(gate: BinaryInputGate): gate is BinaryInputLeafGate {
    return isBinaryOrBooleanLeaf(gate.a) && isBinaryOrBooleanLeaf(gate.b);
}

export function evaluateGate(gate: Gate): Gate {
    switch(gate._tag) {
        case "binary":
        case "boolean":
        case "variable":
            return gate;
        case "~":
            if(!isBinaryOrBooleanLeaf(gate.in)) {
                return gate;
            }
            const notted = notGate(gate.in);
            return notted;
        case "group":
            return gate;
        case "&":
            if(!aAndBBinaryBoolLeaf(gate)) {
                return gate;
            }
            const anded = andGate(gate.a, gate.b);
            return anded;
        case "|":
            if(!aAndBBinaryBoolLeaf(gate)) {
                return gate;
            }
            return orGate(gate.a, gate.b);
        case "~&":
            if(!aAndBBinaryBoolLeaf(gate)) {
                return gate;
            }
            return nandGate(gate.a, gate.b);
        case "~|":
            if(!aAndBBinaryBoolLeaf(gate)) {
                return gate;
            }
            return norGate(gate.a, gate.b);
        case "#":
            if(!aAndBBinaryBoolLeaf(gate)) {
                return gate;
            }
            return xorGate(gate.a, gate.b);
    }
    return gate;
}