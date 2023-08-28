import type { Gate } from "./types";

export function gateToString(gate: Gate): string {
    console.log(gate);

    switch(gate._tag) {
        case "variable":
        case "binary":
        case "boolean":
            return `${gate.value}`;
        case "group":
            return `(${gateToString(gate.val)})`;
        case "~":
            return `~${gateToString(gate.in)}`;
        default:
            return `${gateToString(gate.a)} ${gate._tag} ${gateToString(gate.b)}`;
    }
}