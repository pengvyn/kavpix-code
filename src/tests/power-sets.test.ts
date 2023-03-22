import { describe, it } from "vitest";
import * as fc from "fast-check";
import { StrNumSet, strNumSet } from "./arbitraries";
import { getPowerSet, getPowerSetIterations } from "../scripts/power-sets/power-sets";
import { convertSetToString } from "../scripts/power-sets/power-sets-browser";

describe("Power Sets", () => {
    describe("Power set generator", () => {
        it("Length is 2^n", () => {
            fc.assert(fc.property(
                strNumSet, (set: StrNumSet) => {
                    const result = getPowerSet(set);
                    return result.length === (2 ** set.length);
                }
            ))
        })
    })
    describe("Power set iteration generator", () => {
        // Length is 1 + set length
        // Each iteration has elements of the same length
        it("Length is 1+n", () => {
            fc.assert(fc.property(
                strNumSet, (set: StrNumSet) => {
                    const result = getPowerSetIterations(set);
                    return result.length === set.length + 1;
                }
            ))
        })
        it("Each iteration has elements of the same length", () => {
            fc.assert(fc.property(
                strNumSet, (set: StrNumSet) => {
                    const result = getPowerSetIterations(set);
                    return result.every((iter, idx) => iter.every((subset) => subset.length === idx));
                }
            ))
        })
    })
    describe("Power set parsing actions", () => {
        // Convert set to string:
        // all elements and no extra elements
        // all elements from set are wrapped in curly braces
        describe("Convert set to string", () => {
            it("All elements from set are in the string", () => {
                fc.assert(fc.property(
                    strNumSet, (set: StrNumSet) => {
                        const result = convertSetToString(set);
                        const split = result.split(", ");
                        console.log(result, split, set);
                        return set.every((el) => split.includes(el.toString()));
                    }
                ), { seed: 1887768712, path: "0:1:0:0:0:1", endOnFailure: true })
            })
        })
    })
})