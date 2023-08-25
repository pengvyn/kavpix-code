import { makeGate } from "./make-gates";
import type { BinaryInputGate, Gate, GatePrecedence } from "./types";

export const defaultOrder: GatePrecedence[] = [
    { name: "group", precedence: 6 },
    { name: "~", precedence: 6 },
    { name: "~&", precedence: 5 },
    { name: "~|", precedence: 4 },
    { name: "&", precedence: 3 },
    { name: "|", precedence: 2},
    { name: "#", precedence: 1 },
];

function isAHigherThanB(a: Gate, b: Gate, order: GatePrecedence[]): boolean {
    const aPrecedence = order[order.findIndex(g => g.name === a._tag)].precedence;
    const bPrecedence = order[order.findIndex(g => g.name === b._tag)].precedence;

    return aPrecedence > bPrecedence;
}

export function reOrderGates(gate: Gate, order: GatePrecedence[]): Gate {
    // recursion
    // if unary gate (or parentheses), recurse with input
    // if binary, recurse a and b, then check for order

    switch(gate._tag) {
        case "~":
            return makeGate("~", reOrderGates(gate.in, order), null);
        case "group":
            return makeGate("group", reOrderGates(gate.val, order), null);
        case "binary":
        case "boolean":
        case "variable":
            return gate;
        case "#":
        case "&":
        case "|":
        case "~&":
        case "~|":
            const orderedLeft = reOrderGates(gate.a, order);
            const orderedRight = reOrderGates(gate.b, order);

            const leftUnaryOrLeaf = orderedLeft._tag === "binary" || 
                orderedLeft._tag === "boolean" || 
                orderedLeft._tag === "variable" || 
                orderedLeft._tag === "~" || 
                orderedLeft._tag === "group";

            const rightUnaryOrLeaf = orderedRight._tag === "binary" || 
                orderedRight._tag === "boolean" || 
                orderedRight._tag === "variable" || 
                orderedRight._tag === "~" || 
                orderedRight._tag === "group";

            if(leftUnaryOrLeaf && rightUnaryOrLeaf) {
                return {
                    _tag: gate._tag,
                    a: orderedLeft,
                    b: orderedRight,
                }
            }

            const leftHigher = isAHigherThanB(orderedLeft, gate, order);
            const rightHigher = isAHigherThanB(orderedRight, gate, order);

            if(leftHigher && rightHigher) {
                return gate;
            }
            if(leftHigher) {
                if(rightUnaryOrLeaf) {
                    return gate;
                }

                // a and b or c xor b
                // (a and b) or (c xor b)
                // left higher, right lower
                // ((a and b) or c) xor b !!

                // take left of right becomes right of gate, left becomes left of gate.
                // the new gate becomes the left of right, and the rights right stays as rights right
                
                const newLeft: Gate = {
                    _tag: gate._tag,
                    a: orderedLeft,
                    b: orderedRight.a
                }
                return {
                    _tag: orderedRight._tag,
                    a: newLeft,
                    b: orderedRight.b
                }
            }
            if(rightHigher) {
                if(leftUnaryOrLeaf) {
                    return gate;
                }

                const newRight: Gate = {
                    _tag: gate._tag,
                    a: orderedLeft.a,
                    b: orderedRight
                }
                return {
                    _tag: orderedLeft._tag,
                    a: orderedLeft.a,
                    b: newRight
                }
            }
            
            // BOTH lower

            if(leftUnaryOrLeaf && !rightUnaryOrLeaf) {
                const newLeft: Gate = {
                    _tag: gate._tag,
                    a: orderedLeft,
                    b: orderedRight.a
                }
                return {
                    _tag: orderedRight._tag,
                    a: newLeft,
                    b: orderedRight.b
                }
            }
            if(rightUnaryOrLeaf && !leftUnaryOrLeaf) {
                const newRight: Gate = {
                    _tag: gate._tag,
                    a: orderedLeft.b,
                    b: orderedRight,
                }

                return {
                    _tag: orderedLeft._tag,
                    a: orderedLeft.a,
                    b: newRight
                }
            }
            if(!leftUnaryOrLeaf && !rightUnaryOrLeaf) {
                const newGate: Gate = {
                    _tag: gate._tag,
                    a: orderedLeft.b,
                    b: orderedRight.a,
                }

                const isLeftHigherThanRight = isAHigherThanB(orderedLeft, orderedRight, order);

                if(isLeftHigherThanRight) {
                    const newLeft: Gate = {
                        _tag: orderedLeft._tag,
                        a: orderedLeft.a,
                        b: newGate
                    }
                    return {
                        _tag: orderedRight._tag,
                        a: newLeft,
                        b: orderedRight.b
                    }
                }
                
                const newRight: Gate = {
                    _tag: orderedRight._tag,
                    a: newGate,
                    b: orderedRight.b,
                }
                return {
                    _tag: orderedLeft._tag,
                    a: orderedLeft.a,
                    b: newRight
                }
            }

            throw "Error in operator precedence";
    }
}