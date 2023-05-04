import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import { addListToExp, closedParan, evaluateRecurse, ExpectedNumVal, isExpected, isFullyEvaluated, joinSimilars, NumberOperator, openParan, parseInput, reverseParse, simplifyAdd, valueIsNegate, valueIsNumber, valueIsOperator, valueIsOrInParan } from "../../scripts/tree-expressions/numbers/numbers";
import { add, evaluateNumExp } from "../../scripts/tree-expressions/numbers/evaluate";
import { Add, Expression, Leaf, makeLeaf, makeWaiting, Neg, Sub, Variable, variables, Waiting } from "../../scripts/tree-expressions/types";
import { arbNumOperator, arbNumWaiting, arbStringAndNumList, arbVarOrNum, strNumSet } from "../arbitraries";
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
            // return !result && !result2 && !result3;
            expect(result).toBe(false);
            expect(result2).toBe(false);
            expect(result3).toBe(false);
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
                const nextEquals = result.next.every((ne) => ["number", "paran"].includes(ne)) 
                    && result.next.length === 2;
                
                expect(parsedEquals).toBe(true);
                expect(waitEquals).toBe(true);
                expect(nextEquals).toBe(true);
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
                    val: {
                        _tag: "val",
                        val: 1
                    },
                },
                right: {
                    _tag: "add",
                    left: {
                        _tag: "leaf",
                        val: {
                            _tag: "val",
                            val: 2
                        },
                    },
                    right: {
                        _tag: "leaf",
                        val: {
                            _tag: "val",
                            val: 2
                        },
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
                const parsedEquals = results.every((result) => 
                    isEqual(result.parsed, parsed1)
                );
                expect(parsedEquals).toBe(true);
            })
            it("Waiting becomes paranned", () => {
                const waitEquals = results.every((result) =>
                    isEqual(result.waiting.paran, {_tag: "paranned", exp: ""})
                )
                expect(waitEquals).toBe(true);
            })
            it("Next is [paran, neg, number]", () => {
                const nextExp: ExpectedNumVal[] = ["paran", "neg", "number"];
                const nextEquals = results.every((result) =>
                    nextExp.every((ne) => result.next.includes(ne)) && result.next.length === nextExp.length
                )
                expect(nextEquals).toBe(true);
            })

        })
        describe("Closed paran", () => {
            // if the input string has more open than closed parans:
                // parsed stays the same
                // waiting.paran is {_tag: paranned, exp: [exp with ) attatched]}
                // next is [paran, operator]
            // if the input string doesn't have more open:
                // waiting gets reset to default
                // parsed's right should be the paran expression
                // next is [paran, operator]

            const parsed: Expression<number> = {
                _tag: "mul",
                left: {
                    _tag: "paran",
                    val: {
                        _tag: "add",
                        left: {
                            _tag: "leaf",
                            val: {
                                _tag: "val",
                                val: 10
                            }
                        },
                        right: {
                            _tag: "neg",
                            val: {
                                _tag: "leaf",
                                val: {
                                    _tag: "val",
                                    val: 3
                                },
                            }
                        }
                    }
                },
                right: {
                    _tag: "leaf",
                    val: {
                        _tag: "val",
                        val: 7
                    }
                }
            }
            
            describe("Unclosed nested paran", () => {
                // parsed is empty
                // parsed is the example
                // closed paran is part of the string
                // closed paran is ending the paran in the waiting
                const wait1: Waiting<NumberOperator> = {
                    operator: "*",
                    negate: false,
                    paran: {
                        _tag: "paranned",
                        exp: "1 + (2 + 3"
                    }
                }
                it("1 - w/ parsed", () => {
                    const result = closedParan(parsed, wait1);
                    const parsedEquals = isEqual(result.parsed, parsed);
                    const waitEquals = isEqual(result.waiting, {
                        ...wait1, 
                        paran: {
                            _tag: "paranned", 
                            exp: wait1.paran.exp + ")"
                        }
                    });
                    const nextEquals = result.next.every((ne) => ["paran", "operator"].includes(ne)) && result.next.length === 2;
                    
                    expect(parsedEquals).toBe(true);
                    expect(waitEquals).toBe(true);
                    expect(nextEquals).toBe(true);
                })
                it("2 - w/o parsed", () => {
                    const result = closedParan(null, wait1);
                    const parsedEquals = result.parsed === null;
                    const waitEquals = isEqual(result.waiting, {
                        ...wait1, 
                        paran: {
                            _tag: "paranned", 
                            exp: wait1.paran.exp + ")"
                        }
                    });
                    const nextEquals = result.next.every((ne) => ["paran", "operator"].includes(ne)) && result.next.length === 2;

                    expect(parsedEquals).toBe(true);
                    expect(waitEquals).toBe(true);
                    expect(nextEquals).toBe(true);
                })
            })
            describe("No unclosed nested paran", () => {
                const wait1: Waiting<NumberOperator> = {
                    operator: "+",
                    negate: true,
                    paran: {
                        _tag: "paranned",
                        exp: "1 + 2",
                    }
                }
                const wait2: Waiting<NumberOperator> = {
                    operator: "*",
                    negate: true,
                    paran: {
                        _tag: "paranned",
                        exp: "1 + (2 x -3)",
                    }
                };

                it("1 - w/ parsed", () => {
                    const result = closedParan(parsed, wait1);
                    const parsedEquals = !isEqual(result.parsed, parsed);
                    const waitEquals = isEqual(result.waiting, makeWaiting());
                    const nextEquals = result.next.every((ne) => ["paran", "operator"].includes(ne)) && result.next.length === 2;

                    expect(parsedEquals).toBe(true);
                    expect(waitEquals).toBe(true);
                    expect(nextEquals).toBe(true);
                })
                it("2 - w/o parsed", () => {
                    const result = closedParan(null, wait1);
                    const parsedEquals = !isEqual(result.parsed, null);
                    const waitEquals = isEqual(result.waiting, makeWaiting());
                    const nextEquals = result.next.every((ne) => ["paran", "operator"].includes(ne)) && result.next.length === 2;

                    expect(parsedEquals).toBe(true);
                    expect(waitEquals).toBe(true);
                    expect(nextEquals).toBe(true);
                })
                it("3 - w/ parsed + nested paran", () => {
                    const result = closedParan(parsed, wait2);
                    const parsedEquals = !isEqual(result.parsed, parsed);
                    const waitEquals = isEqual(result.waiting, makeWaiting());
                    const nextEquals = result.next.every((ne) => ["paran", "operator"].includes(ne)) && result.next.length === 2;

                    expect(parsedEquals).toBe(true);
                    expect(waitEquals).toBe(true);
                    expect(nextEquals).toBe(true);
                })
                it("4 - w/o parsed + nested paran", () => {
                    const result = closedParan(null, wait2);
                    const parsedEquals = !isEqual(result.parsed, null);
                    const waitEquals = isEqual(result.waiting, makeWaiting());
                    const nextEquals = result.next.every((ne) => ["paran", "operator"].includes(ne)) && result.next.length === 2;

                    expect(parsedEquals).toBe(true);
                    expect(waitEquals).toBe(true);
                    expect(nextEquals).toBe(true);
                })
            })
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
                            val: {
                                _tag: "val",
                                val: 1
                            },
                        },
                    },
                    right: {
                        _tag: "leaf",
                        val: {
                            _tag: "val",
                            val: 2
                        }
                    }
                },
                right: {
                    _tag: "leaf",
                    val: {
                        _tag: "val",
                        val: 3
                    }
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
                operator: "*",
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
                        expect(parsedEquals).toBe(true);
                        expect(nextEquals).toBe(true);
                        expect(waitEquals).toBe(true);
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
                        
                        expect(parsedEquals).toBe(true);
                        expect(waitEquals).toBe(true);
                        expect(nextEquals).toBe(true);
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
                        
                        expect(parsedEquals).toBe(true);
                        expect(waitEquals).toBe(true);
                        expect(nextEquals).toBe(true);
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
                        
                        expect(parsedEquals).toBe(true);
                        expect(waitEquals).toBe(true);
                        expect(nextEquals).toBe(true);
                    }
                ))
            })
        })
    })
    it("is fully evaluated", () => {
        const exp: Expression<number> = {
            _tag: "add",
            left: {
                _tag: "add",
                left: {
                    _tag: "leaf",
                    val: {
                        _tag: "val",
                        val: 10
                    }
                },
                right: {
                    _tag: "leaf",
                    val: {
                        _tag: "var",
                        val: "x",
                    }
                }
            },
            right: {
                _tag: "leaf",
                val: {
                    _tag: "val",
                    val: 5
                }
            }
        };
        const exp2: Expression<number> = {
            _tag: "add",
            left: {_tag: "leaf", val: {_tag: "val", val: 1}},
            right: {_tag: "leaf", val: {_tag: "var", val: "a"}}
        };
        const exp3: Expression<number> = {
            _tag: "add",
            left: {_tag: "leaf", val: {_tag: "val", val: 10}},
            right: {_tag: "leaf", val: {_tag: "val", val: 12}}
        }
        console.log(isFullyEvaluated(exp), isFullyEvaluated(exp2), isFullyEvaluated(exp3));
    })
    it("Evaluate recurse", () => {
        const exp: Expression<number> = {
            _tag: "mul",
            left: {
                _tag: "paran",
                val: {
                    _tag: "add",
                    left: {
                        _tag: "leaf",
                        val: {
                            _tag: "val",
                            val: 10,
                        }
                    },
                    right: {
                        _tag: "leaf",
                        val: {
                            _tag: "val",
                            val: 20
                        }
                    }
                }
            },
            right: {
                _tag: "leaf",
                val: {
                    _tag: "var",
                    val: "x",
                }
            }
        }
        const exp2: Expression<number> = {
            _tag: "add",
            left: {
                _tag: "paran",
                val: {
                    _tag: "div",
                    left: {
                        _tag: "leaf",
                        val: {
                            _tag: "var",
                            val: "x"
                        }
                    },
                    right: {
                        _tag: "leaf",
                        val: {
                            _tag: "val",
                            val: 10
                        }
                    }
                }
            },
            right: {
                _tag: "leaf",
                val: {
                    _tag: "var",
                    val: "x"
                }
            }
        }
        const exp3: Expression<number> = {
            _tag: "add",
            left: {
                _tag: "paran",
                val: {
                    _tag: "sub",
                    left: {
                        _tag: "leaf",
                        val: {
                            _tag: "var",
                            val: "x"
                        }
                    },
                    right: {
                        _tag: "leaf",
                        val: {
                            _tag: "var",
                            val: "x"
                        }
                    }
                }
            },
            right: {
                _tag: "leaf",
                val: {
                    _tag: "val",
                    val: 1
                }
            }
        }
        // console.log("========================================== RESULT:", evaluateRecurse(exp, evaluateNumExp));
        console.log("========================================== RESULT:", evaluateRecurse(parseInput("a - a") as Expression<number>, evaluateNumExp));
    })
    it("simplify add", () => {
        const exp = parseInput("10 / 3 + x") as Add<number>;
        const evalled = evaluateRecurse(exp, evaluateNumExp);
        const r = simplifyAdd(evalled as Add<number> | Sub<number>);
        console.log(r);
        console.log(reverseParse(addListToExp(r)));
    })
    describe.only("Evaluate functions", () => {
        describe("add", () => {
            it("Left and right are numbers", () => {
                fc.assert(fc.property(
                    fc.integer(), fc.integer(),
                    (left: number, right: number) => {
                        const result = add(makeLeaf(left), makeLeaf(right));
                        return result._tag === "leaf" && result.val.val === left + right;
                    }
                ))
            })
            it("Left and right are var or num", () => {
                fc.assert(fc.property(
                    arbVarOrNum, arbVarOrNum,
                    (left: Variable | number, right: Variable | number) => {
                        const result = add(makeLeaf(left), makeLeaf(right));
                        return variables.includes(left as Variable) || variables.includes(right as Variable)
                            ? result._tag === "add"
                            : result._tag === "leaf"
                    }
                ))
            })
        })
    })
})