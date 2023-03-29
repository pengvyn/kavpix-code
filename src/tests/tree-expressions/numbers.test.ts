import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import { ExpectedNumVal, isExpected, joinSimilars, NumberOperator, parseInput, valueIsNegate, valueIsNumber, valueIsOperator } from "../../scripts/tree-expressions/numbers";
import type { Add, Expression, Neg, Waiting } from "../../scripts/tree-expressions/types";
import { arbNumOperator, arbNumWaiting, arbStringAndNumList, strNumSet } from "../arbitraries";
import { isEqual, negate } from "lodash";

describe("Numbers expression tree", () => {
    describe("Join similars", () => {
        // length is less than or equal to
        const nums = "0123456789".split("");
        it("Length is less than or equal to", () => {
            fc.assert(fc.property(
                arbStringAndNumList, (list: (string)[]) => {
                    const result = joinSimilars(list, nums);
                    console.log(result);
                    return result.length <= list.length;
                }
            ))
        })
    })
    describe("Is expected", () => {
        it("Expected number", () => {
            fc.assert(fc.property(
                fc.integer({min: 0}), (num: number) => {
                    const result: boolean = isExpected(`${num}`, ["number"]);
                    return result
                }
            ))
        })
        it("Expected negative", () => {
            const result: boolean = isExpected("-", ["neg"]);
            expect(result).toEqual(true);
            const result2: boolean = isExpected("-", ["neg", "number", "operator"]);
            expect(result2).toEqual(true);
        })
        it("Expected operator", () => {
            fc.assert(fc.property(
                arbNumOperator, (operator: NumberOperator) => {
                    const result: boolean = isExpected(operator, ["operator"]);
                    return result === true;
                }
            ))
        })
        it("Unexpected number", () => {
            fc.assert(fc.property(
                fc.integer({min: 0}), (num: number) => {
                    const result: boolean = isExpected(`${num}`, ["neg"]);
                    const result2: boolean = isExpected(`${num}`, ["operator"]);
                    const result3: boolean = isExpected(`${num}`, ["neg", "operator"]);
                    return !result && !result2 && !result3;
                }
            ))
        })
        it("Unexpected operator", () => {
            fc.assert(fc.property(
                arbNumOperator, (operator: NumberOperator) => {
                    const result: boolean = isExpected(operator, ["neg"]);
                    const result2: boolean = isExpected(operator, ["number"]);
                    const result3: boolean = isExpected(operator, ["neg", "number"]);
                    return !result && !result2 && !result3;
                }
            ))
        })
        it("Unexpected negative", () => {
            const result: boolean = isExpected("-", ["operator"]);
            const result2: boolean = isExpected("-", ["number"]);
            const result3: boolean = isExpected("-", ["operator", "number"]);
            return !result && !result2 && !result3;
        })
    })
    describe("Value is ____", () => {
        describe("Value is number", () => {
            // nothing parsed, nothing waiting: parsed should have the value, next is operator
            // nothing parsed, negate
            // parsed, no negate
            // parsed, negate
            it("Nothing parsed, nothing waiting", () => {
                fc.assert(fc.property(
                    fc.integer({min: -1000, max: 1000}),
                    (value: number) => {
                        const result = valueIsNumber(value, null, {operator: null, negate: false});
                        const parsedIsVal = result.parsed === value;
                        const waitIsEmpty = isEqual(result.waiting, {operator: null, negate: false});
                        const nextIsOp = isEqual(result.next, ["operator"]);
                        return parsedIsVal && waitIsEmpty && nextIsOp;
                    }
                ))
            })
            it("Nothing parsed, negate", () => {
                fc.assert(fc.property(
                    fc.integer({min: -1000, max: 1000}),
                    (value: number) => {
                        const result = valueIsNumber(value, null, {operator: null, negate: true});
                        const parsedIsVal = isEqual(result.parsed, {val: value, _tag: "neg"} as Neg<number>);
                        const waitIsEmpty = isEqual(result.waiting, {operator: null, negate: false});
                        const nextIsOp = isEqual(result.next, ["operator"]);
                        return parsedIsVal && waitIsEmpty && nextIsOp;
                    }
                ))
            })
            it("Parsed, no negate", () => {
                fc.assert(fc.property(
                    fc.integer({min: -1000, max: 1000}),
                    (value: number) => {
                        const parsed: Expression<number> = {
                            left: 20, right: {
                                left: 90123, right: {
                                    val: 15, _tag: "neg"
                                }, _tag: "add"
                            }, _tag: "add"
                        };
                        const result = valueIsNumber(value, parsed, {operator: "+", negate: false});

                        const parsedEquals = isEqual(result.parsed, {left: parsed, right: value, _tag: "add"} as Add<number>);
                        const waitEquals = isEqual(result.waiting, {operator: null, negate: false});
                        const nextEquals = isEqual(result.next, ["operator"]);
                        return parsedEquals && waitEquals && nextEquals;
                    }
                ))
            })
            it("Parsed, negate", () => {
                fc.assert(fc.property(
                    fc.integer({min: -1000, max: 1000}),
                    (value: number) => {
                        const parsed: Expression<number> = {
                            left: {val: 20, _tag: "neg"}, 
                            right: {
                                left: 1231231, right: {
                                    val: 34, _tag: "neg"
                                }, _tag: "add"
                            }, _tag: "add"
                        };
                        const result = valueIsNumber(value, parsed, {operator: "+", negate: true});

                        const parsedEquals = isEqual(result.parsed, {left: parsed, right: {val: value, _tag: "neg"}, _tag: "add"} as Add<number>);
                        const waitEquals = isEqual(result.waiting, {operator: null, negate: false});
                        const nextEquals = isEqual(result.next, ["operator"]);
                        return parsedEquals && waitEquals && nextEquals;
                    }
                ))
            })
        })
        it("Value is operator", () => {
            // all have to be parsed
            // not possible to have negate either...
            // sooo the next expected always has to be ["operator", "neg"]
            // and the waiting should have the operator
            // parsed remains the same
            fc.assert(fc.property(
                arbNumOperator, (operator: NumberOperator) => {
                    const parsed: Expression<number> = { 
                        left: {
                            left: {
                                left: { val: 1002, _tag: "neg" }, right: 10, _tag: "add"
                            },
                            right: {
                                left: 13, right: { val: 578, _tag: "neg" }, _tag: "add"
                            },
                            _tag: "add"
                        },
                        right: 10,
                        _tag: "add"
                    }
                    const result = valueIsOperator(operator, parsed, {operator: null, negate: false});

                    const negNum: ExpectedNumVal[] = ["neg", "number"];

                    const waitEquals = isEqual(result.waiting, {operator, negate: false});
                    const nextEquals = result.next.every((ne) => negNum.includes(ne))
                        && negNum.every((ne) => result.next.includes(ne));
                    const parsedEquals = isEqual(result.parsed, parsed);

                    return waitEquals && nextEquals && parsedEquals;
                }
            ))
        })
        describe("Value is negate", () => {
            // nothing parsed
            // parsed
            it("Nothing parsed", () => {
                const result = valueIsNegate(null, {operator: null, negate: false});
                const parsedEquals = result.parsed === null;
                const waitEquals = isEqual(result.waiting, {operator: null, negate: true});
                const nextEquals = isEqual(result.next, ["number"]);
                return parsedEquals && waitEquals && nextEquals;
            })
            it("Parsed", () => {
                fc.assert(fc.property(
                    arbNumOperator, (operator: NumberOperator) => {
                        const parsed: Expression<number> = {
                            val: 21031,
                            _tag: "neg"
                        };
        
                        const result = valueIsNegate(parsed, {operator: operator, negate: false});
        
                        const parsedEquals = isEqual(result.parsed, parsed);
                        const waitEquals = isEqual(result.waiting, {operator: operator, negate: true});
                        const nextEquals = isEqual(result.next, ["number"]);
                        return parsedEquals && waitEquals && nextEquals;
                    }
                ))
            })
        })
    })
    describe.only("Parse input", () => {
        it("aaaa", () => {
            console.log(parseInput("10 + -10 + -64"));
        })
    })
})