import { describe, it } from "vitest";
import { parseInput } from "../../scripts/tree-expressions/numbers/numbers";
import { evaluateNumExp } from "../../scripts/tree-expressions/numbers/evaluate";
import { evaluateTreeVar } from "../../scripts/tree-expressions/tree-funcs";
import type { Expression } from "../../scripts/tree-expressions/types";

describe("Tree functions", () => {
    it("sdlfjsfs", () => {
        // traverseLeftMap(parseInput("-1 + 2 + 3") as Expression<number>, function a(inp: unknown) { console.log(inp); console.log("----------------------------")} );
        console.log(evaluateTreeVar(parseInput(" 20 x 10 + 5") as Expression<number>, evaluateNumExp));
    })
})