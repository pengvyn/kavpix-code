import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import { ExpectedNumVal, isExpected, joinSimilars, NumberOperator, openParan, parseInput, valueIsNegate, valueIsNumber, valueIsOperator, valueIsOrInParan } from "../../scripts/tree-expressions/numbers";
import { Add, Expression, Leaf, makeLeaf, makeWaiting, Neg, Waiting } from "../../scripts/tree-expressions/types";
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
                        const result = valueIsNumber(value, null, {operator: null, negate: false, paran: {_tag: "not-paranned", exp: null}});
                        const parsedIsVal = isEqual(result.parsed, makeLeaf(value));
                        const waitIsEmpty = isEqual(result.waiting, {operator: null, negate: false, paran: {_tag: "not-paranned", exp: null}});
                        const nextIsOp = isEqual(result.next, ["operator"]);
                        return parsedIsVal && waitIsEmpty && nextIsOp;
                    }
                ))
            })
            it("Nothing parsed, negate", () => {
                fc.assert(fc.property(
                    fc.integer({min: -1000, max: 1000}),
                    (value: number) => {
                        const result = valueIsNumber(value, null, {operator: null, negate: true, paran: {_tag: "not-paranned", exp: null}});
                        const parsedIsVal = isEqual(result.parsed, {val: makeLeaf(value), _tag: "neg"} as Neg<number>);
                        const waitIsEmpty = isEqual(result.waiting, {operator: null, negate: false, paran: {_tag: "not-paranned", exp: null}});
                        const nextIsOp = isEqual(result.next, ["operator"]);
                        return parsedIsVal && waitIsEmpty && nextIsOp;
                    }
                ))
            })
            it("Parsed, no negate", () => {
                fc.assert(fc.property(
                    fc.integer({min: -1000, max: 1000}),
                    (value: number) => {

                        const l: Leaf<number>[] = [makeLeaf(20), makeLeaf(90123), makeLeaf(15)]

                        const parsed: Expression<number> = {
                            left: l[0], right: {
                                left: l[1], right: {
                                    val: l[2], _tag: "neg"
                                }, _tag: "add"
                            }, _tag: "add"
                        };
                        const result = valueIsNumber(value, parsed, {operator: "+", negate: false, paran: {_tag: "not-paranned", exp: null}});

                        const parsedEquals = isEqual(result.parsed, { 
                            left: parsed, right: makeLeaf(value), _tag: "add"
                        } as Add<number>);
                        const waitEquals = isEqual(result.waiting, {operator: null, negate: false, paran: {_tag: "not-paranned", exp: null}});
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
                            left: {val: makeLeaf(20), _tag: "neg"}, 
                            right: {
                                left: makeLeaf(1231231), right: {
                                    val: makeLeaf(34), _tag: "neg"
                                }, _tag: "add"
                            }, _tag: "add"
                        };
                        const result = valueIsNumber(value, parsed, {operator: "+", negate: true, paran: {_tag: "not-paranned", exp: null}});

                        const parsedEquals = isEqual(result.parsed, { 
                            left: parsed, right: {
                                val: makeLeaf(value), _tag: "neg"
                            }
                            , _tag: "add"
                        } as Add<number>);
                        const waitEquals = isEqual(result.waiting, {operator: null, negate: false, paran: {_tag: "not-paranned", exp: null}});
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
                                left: { val: makeLeaf(1002), _tag: "neg" }, right: makeLeaf(10), _tag: "add"
                            },
                            right: {
                                left: makeLeaf(13), right: { val: makeLeaf(578), _tag: "neg" }, _tag: "add"
                            },
                            _tag: "add"
                        },
                        right: makeLeaf(10),
                        _tag: "add"
                    }
                    const result = valueIsOperator(operator, parsed, {operator: null, negate: false, paran: {_tag: "not-paranned", exp: null}});

                    const negNum: ExpectedNumVal[] = ["neg", "number", "paran"];

                    const waitEquals = isEqual(result.waiting, {operator, negate: false, paran: {_tag: "not-paranned", exp: null}});
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
                const result = valueIsNegate(null, {operator: null, negate: false, paran: {_tag: "not-paranned", exp: null}});
                const parsedEquals = result.parsed === null;
                const waitEquals = isEqual(result.waiting, {operator: null, negate: true, paran: {_tag: "not-paranned", exp: null}});
                const nextEquals = isEqual(result.next, ["number"]);
                return parsedEquals && waitEquals && nextEquals;
            })
            it("Parsed", () => {
                fc.assert(fc.property(
                    arbNumOperator, (operator: NumberOperator) => {
                        const parsed: Expression<number> = {
                            val: makeLeaf(21031),
                            _tag: "neg"
                        };
        
                        const result = valueIsNegate(parsed, {operator: operator, negate: false, paran: {_tag: "not-paranned", exp: null}});
        
                        const parsedEquals = isEqual(result.parsed, parsed);
                        const waitEquals = isEqual(result.waiting, {operator: operator, negate: true, paran: {_tag: "not-paranned", exp: null}});

                        const nextExp: ExpectedNumVal[] = ["paran", "number"];
                        const nextEquals = 
                            nextExp.every((ne) => result.next.includes(ne)) 
                            && nextExp.length === result.next.length;

                        return parsedEquals && waitEquals && nextEquals;
                    }
                ))
            })
        })
    })
    describe.skip("Parse input", () => {
        // 
    })
    describe("Paran functions", () => {
        
        describe("Open paran", () => {
            // parsed is same as before
            // waiting paran is {_tag: "paranned", exp: ""}
            // next is ["paran", "neg", "number"]

            const parsed1: Expression<number> = {
                _tag: "add",
                left: {
                    _tag: "leaf",
                    val: 1
                },
                right: {
                    _tag: "add",
                    left: {
                        _tag: "leaf",
                        val: 2,
                    },
                    right: {
                        _tag: "leaf",
                        val: 2,
                    }
                }
            }
            const wait1: Waiting<NumberOperator> = {
                operator: "+",
                negate: true,
                paran: {
                    _tag: "not-paranned",
                    exp: null,
                }
            }

            const wait2: Waiting<NumberOperator> = {
                operator: "+",
                negate: true,
                paran: {
                    _tag: "paranned",
                    exp: ""
                }
            }

            const wait3: Waiting<NumberOperator> = {
                operator: null,
                negate: false,
                paran: {
                    _tag: "not-paranned",
                    exp: null
                }
            }

            const wait4: Waiting<NumberOperator> = {
                operator: null,
                negate: true,
                paran: {
                    _tag: "not-paranned",
                    exp: null
                }
            }
            const result1 = openParan(parsed1, wait1);
            const result2 = openParan(parsed1, wait2);
            const result3 = openParan(parsed1, wait3);
            const result4 = openParan(parsed1, wait4);

            const results = [result1, result2, result3, result4]

            it("Parsed stays the same", () => {
                return results.every((result) => 
                    isEqual(result.parsed, parsed1)
                );
            })
            it("Waiting becomes paranned", () => {
                return results.every((result) =>
                    isEqual(result.waiting.paran, {_tag: "paranned", exp: ""})
                )
            })
            it("Next is [paran, neg, number]", () => {
                const nextExp: ExpectedNumVal[] = ["paran", "neg", "number"];
                return results.every((result) =>
                    nextExp.every((ne) => result.next.includes(ne)) && result.next.length === nextExp.length
                )
            })

        })
        describe.skip("Closed paran", () => {
            // if the input string has more open than closed parans:
                // parsed stays the same
                // waiting.paran is {_tag: paranned, exp: [exp with ) attatched]}
                // next is [paran, operator]
            // if the input string doesn't have more open:
                // waiting gets reset to default
                // parsed's right should be the paran expression
                // next is [paran, operator]
        })
        describe("Value in paran", () => {
            // parsed stays the same
            // waiting.paran.exp has the value attatched to it but otherwise same
            // next is [neg, number, paran, operator]
            const parsed: Expression<number> = {
                _tag: "mul",
                left: {
                    _tag: "add",
                    left: {
                        _tag: "neg",
                        val: {
                            _tag: "leaf",
                            val: 1,
                        },
                    },
                    right: {
                        _tag: "leaf",
                        val: 2
                    }
                },
                right: {
                    _tag: "leaf",
                    val: 3
                }
            }

            const wait1: Waiting<NumberOperator> = {
                operator: "+",
                negate: true,
                paran: {
                    _tag: "paranned",
                    exp: "1+2*"
                }
            }
            const wait2: Waiting<NumberOperator> = {
                operator: null,
                negate: false,
                paran: {
                    _tag: "paranned",
                    exp: ""
                }
            }
            const wait3: Waiting<NumberOperator> = {
                operator: "x",
                negate: true,
                paran: {
                    _tag: "paranned",
                    exp: "1x(2+3)"
                }
            }
            const wait4: Waiting<NumberOperator> = {
                operator: null,
                negate: true,
                paran: {
                    _tag: "paranned",
                    exp: "1x10+7+(10 + 1)",
                }
            }
            it("1", () => {
                fc.assert(fc.property(
                    fc.integer(), (val: number) => {
                        const result = valueIsOrInParan(parsed, wait1, `${val}`);

                        const wait = result.waiting;

                        const parsedEquals = isEqual(result.parsed, parsed);
                        const nextExp: ExpectedNumVal[] = ["neg", "paran", "number", "operator"];
                        const nextEquals = 
                            nextExp.every(ne => result.next.includes(ne)) 
                            && nextExp.length === result.next.length;
                        const waitEquals = isEqual(wait, {
                            ...wait, 
                            paran: {_tag: "paranned", exp: (wait1.paran.exp as string) + `${val}`}
                        })
                        return parsedEquals && nextEquals && waitEquals;
                    }
                ))
            })
            it("2", () => {
                fc.assert(fc.property(
                    fc.integer(), (val: number) => {
                        const result = valueIsOrInParan(parsed, wait2, `${val}`);

                        const wait = result.waiting;

                        const parsedEquals = isEqual(result.parsed, parsed);
                        const nextExp: ExpectedNumVal[] = ["neg", "paran", "number", "operator"];
                        const nextEquals = 
                            nextExp.every(ne => result.next.includes(ne)) 
                            && nextExp.length === result.next.length;
                        const waitEquals = isEqual(wait, {
                            ...wait, 
                            paran: {_tag: "paranned", exp: (wait2.paran.exp as string) + `${val}`}
                        })
                        return parsedEquals && nextEquals && waitEquals;
                    }
                ))
            })
            it("3", () => {
                fc.assert(fc.property(
                    arbNumOperator, (op: NumberOperator) => {
                        const result = valueIsOrInParan(null, wait3, op);

                        const wait = result.waiting;

                        const parsedEquals = isEqual(result.parsed, null);
                        const nextExp: ExpectedNumVal[] = ["neg", "paran", "number", "operator"];
                        const nextEquals = 
                            nextExp.every(ne => result.next.includes(ne)) 
                            && nextExp.length === result.next.length;
                        const waitEquals = isEqual(wait, {
                            ...wait, 
                            paran: {_tag: "paranned", exp: (wait3.paran.exp as string) + op}
                        })
                        return parsedEquals && nextEquals && waitEquals;
                    }
                ))
            })
            it("4", () => {
                fc.assert(fc.property(
                    arbNumOperator, (op: NumberOperator) => {
                        const result = valueIsOrInParan(parsed, wait4, op);

                        const wait = result.waiting;

                        const parsedEquals = isEqual(result.parsed, parsed);
                        const nextExp: ExpectedNumVal[] = ["neg", "paran", "number", "operator"];
                        const nextEquals = 
                            nextExp.every(ne => result.next.includes(ne)) 
                            && nextExp.length === result.next.length;
                        const waitEquals = isEqual(wait, {
                            ...wait, 
                            paran: {_tag: "paranned", exp: (wait4.paran.exp as string) + op}
                        })
                        return parsedEquals && nextEquals && waitEquals;
                    }
                ))
            })
        })
    })
})