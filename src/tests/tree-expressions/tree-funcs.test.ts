import { describe, it } from "vitest";
import { evaluateNum, parseInput } from "../../scripts/tree-expressions/numbers";
import { evaluateTree, traverseLeftMap } from "../../scripts/tree-expressions/tree-funcs";
import type { Expression } from "../../scripts/tree-expressions/types";

describe("Tree functions", () => {
    it("sdlfjsfs", () => {
        // traverseLeftMap(parseInput("-1 + 2 + 3") as Expression<number>, function a(inp: unknown) { console.log(inp); console.log("----------------------------")} );
        console.log(evaluateTree(parseInput("1 + 20 + -1") as Expression<number>, evaluateNum));
    })
})