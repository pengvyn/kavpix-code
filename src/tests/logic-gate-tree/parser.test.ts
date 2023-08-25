import * as fc from "fast-check";
import { describe, it } from "vitest";
import { gateNames, parseGate, prepareGateString } from "../../scripts/logic-gate-tree/parser";

describe("Parser", () => {
    it("Prepare Gate string", () => {
        console.log(prepareGateString("(a and True) or C and not 1", gateNames));
    })
    describe("Parse gate", () => {
        it.only.each([
            // "T & F",
            // "T & ~F",
            // "T ~& F",
            // "~(a # F)",
            "~0 | 1"
        ])("Parser", (str: string) => {
            console.log(parseGate(str));
            console.log("===========================")
        })
    })
})