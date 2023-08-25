import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { andGate, evaluateGate, evaluateGateRecurse, nandGate, norGate, notGate, orGate, xorGate } from '../../scripts/logic-gate-tree/evaluator';
import type { BinaryLeaf, Gate } from '../../scripts/logic-gate-tree/types';
import { makeGate, makeLeaf } from '../../scripts/logic-gate-tree/make-gates';
import { defaultOrder, reOrderGates } from '../../scripts/logic-gate-tree/orderer';
import { parseGate } from '../../scripts/logic-gate-tree/parser';

describe("Evaluator", () => {
    describe("Evaluate gate functions", () => {
        it.each([
            {inp: 0, exp: 1},
            {inp: 1, exp: 0},
        ])("Not", ({inp, exp}) => {
            const result = notGate(makeLeaf(inp as 0 | 1) as BinaryLeaf);
            expect(result.value).toBe(exp);
        })

        it.each([
            {a: 0, b: 0, exp: 0},
            {a: 0, b: 1, exp: 0},
            {a: 1, b: 0, exp: 0},
            {a: 1, b: 1, exp: 1}
        ])("And", ({a, b, exp}) => {
            const aLeaf = makeLeaf(a as 0 | 1) as BinaryLeaf;
            const bLeaf = makeLeaf(b as 0 | 1) as BinaryLeaf;

            const result = andGate(aLeaf, bLeaf);

            expect(result.value).toBe(exp);
        })

        it.each([
            {a: 0, b: 0, exp: 0},
            {a: 0, b: 1, exp: 1},
            {a: 1, b: 0, exp: 1},
            {a: 1, b: 1, exp: 1}
        ])("Or", ({a, b, exp}) => {
            const aLeaf = makeLeaf(a as 0 | 1) as BinaryLeaf;
            const bLeaf = makeLeaf(b as 0 | 1) as BinaryLeaf;

            const result = orGate(aLeaf, bLeaf);

            expect(result.value).toBe(exp);
        })

        it.each([
            {a: 0, b: 0, exp: 1},
            {a: 0, b: 1, exp: 1},
            {a: 1, b: 0, exp: 1},
            {a: 1, b: 1, exp: 0}
        ])("Nand", ({a, b, exp}) => {
            const aLeaf = makeLeaf(a as 0 | 1) as BinaryLeaf;
            const bLeaf = makeLeaf(b as 0 | 1) as BinaryLeaf;

            const result = nandGate(aLeaf, bLeaf);

            expect(result.value).toBe(exp);
        })

        it.each([
            {a: 0, b: 0, exp: 1},
            {a: 0, b: 1, exp: 0},
            {a: 1, b: 0, exp: 0},
            {a: 1, b: 1, exp: 0}
        ])("Nor", ({a, b, exp}) => {
            const aLeaf = makeLeaf(a as 0 | 1) as BinaryLeaf;
            const bLeaf = makeLeaf(b as 0 | 1) as BinaryLeaf;

            const result = norGate(aLeaf, bLeaf);

            expect(result.value).toBe(exp);
        })

        it.each([
            {a: 0, b: 0, exp: 0},
            {a: 0, b: 1, exp: 1},
            {a: 1, b: 0, exp: 1},
            {a: 1, b: 1, exp: 0}
        ])("Xor", ({a, b, exp}) => {
            const aLeaf = makeLeaf(a as 0 | 1) as BinaryLeaf;
            const bLeaf = makeLeaf(b as 0 | 1) as BinaryLeaf;

            const result = xorGate(aLeaf, bLeaf);

            expect(result.value).toBe(exp);
        })
    })
    it.each([
        {
            inp: "1 & ~0",
            exp: makeLeaf(1)
        },
        {
            inp: "F | F",
            exp: makeLeaf(0),
        },
        {
            inp: "~(1 & 0) | T",
            exp: makeLeaf(1)
        }
    ])("Evaluate recurse", ({inp, exp}) => {
        const gate = parseGate(inp);
        const ordered = reOrderGates(gate as Gate, defaultOrder);
        const result = evaluateGateRecurse(ordered);
        console.log(result)
        expect(result).toEqual(exp);
    })
})