// makes a tree for cytoscape

import type { Gate, GateBranch } from "./types";


export function listifyGate(
    gate: Gate, 
    child: Gate = gate, 
    parent: string | null = null, 
    list: GateBranch[] = []
): GateBranch[] {
    const newKey = list.length === 0 ? "1" : `${JSON.parse(list[list.length - 1].key) + 1}`;
    const newVal = {name: child._tag, key: newKey, parent};

    switch(child._tag) {
        case "variable":
        case "binary":
        case "boolean":
            return [...list, {name: `${child.value}`, key: newKey, parent}];
        case "group":
            return listifyGate(gate, child.val, newKey, [...list, newVal]);
        case "~":
            return listifyGate(gate, child.in, newKey, [...list, newVal]);
        default:
            const left = listifyGate(gate, child.a, newKey, [...list, newVal]);
            const leftExtra = left.slice(list.length);

            const right = listifyGate(gate, child.b, newKey, [...list, ...leftExtra]);
            return right;
    }
}