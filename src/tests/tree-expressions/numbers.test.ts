import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import { addExpressionList, closedParan, convertAddListToExpression, ExpectedNumVal, isExpected, isReadyForEvaluation, joinSimilars, NumberOperator, numOrder, openParan, parseInput, removeParan, reverseParse, simplify, simplifyRecurse, valueIsNegate, valueIsNumber, valueIsOperator, valueIsOrInParan } from "../../scripts/tree-expressions/numbers/numbers";
import { add, evaluateNumExp, sub, mul, div, neg } from "../../scripts/tree-expressions/numbers/evaluate";
import { Add, Expression, Leaf, makeLeaf, makeWaiting, Neg, Paran, Sub, Variable, variables, Waiting } from "../../scripts/tree-expressions/types";
import { arbNumOperator, arbNumWaiting, arbStringAndNumList, arbVarOrNum, strNumSet } from "../arbitraries";
import { isEqual, negate, reverse } from "lodash";
import { evaluateTreeVar, orderOfOperations, evaluateRecurse } from "../../scripts/tree-expressions/tree-funcs";

describe("Numbers expression tree", () => {
    describe("Join similars", () => {
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
                    const result: boolean = isExpected(operator, ["paran"]);
                    const result2: boolean = isExpected(operator, ["number"]);
                    const result3: boolean = isExpected(operator, ["variable", "number"]);
                    return !result && !result2 && !result3;
                }
            ))
        })
        it("Unexpected negative", () => {
            const result: boolean = isExpected("-", ["paran"]);
            const result2: boolean = isExpected("-", ["number"]);
            const result3: boolean = isExpected("-", ["variable", "number", "paran"]);
            expect(result).toBe(false);
            expect(result2).toBe(false);
            expect(result3).toBe(false);
        })
    })
    describe("Value is ____", () => {
        describe("Value is number", () => {
            it("Nothing parsed, nothing waiting", () => {
                fc.assert(fc.property(
                    fc.integer({min: -1000, max: 1000}),
                    (value: number) => {
                        const result = valueIsNumber(value, null, {operator: null, negate: false, paran: {_tag: "not-paranned", exp: null}});
                        const parsedIsVal = isEqual(result.parsed, makeLeaf(value));
                        const waitIsEmpty = isEqual(result.waiting, {operator: null, negate: false, paran: {_tag: "not-paranned", exp: null}});
                        const nextIsOp = isEqual(result.next, ["operator", "paran"]);
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
                        const nextIsOp = isEqual(result.next, ["operator", "paran"]);
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
                        const nextEquals = isEqual(result.next, ["operator", "paran"]);
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
                        const nextEquals = isEqual(result.next, ["operator", "paran"]);
                        return parsedEquals && waitEquals && nextEquals;
                    }
                ))
            })
        })
        it("Value is operator", () => {
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

                    const negNum: ExpectedNumVal[] = ["neg", "number", "paran", "variable"];

                    const waitEquals = isEqual(result.waiting, {operator, negate: false, paran: {_tag: "not-paranned", exp: null}});
                    const nextEquals = result.next.every((ne) => negNum.includes(ne))
                        && negNum.every((ne) => result.next.includes(ne));
                    const parsedEquals = isEqual(result.parsed, parsed);

                    return waitEquals && nextEquals && parsedEquals;
                }
            ))
        })
        describe("Value is negate", () => {
            it("Nothing parsed", () => {
                const result = valueIsNegate(null, {operator: null, negate: false, paran: {_tag: "not-paranned", exp: null}});
                const parsedEquals = result.parsed === null;
                const waitEquals = isEqual(result.waiting, {operator: null, negate: true, paran: {_tag: "not-paranned", exp: null}});
                const nextEquals = result.next.every((ne) => ["number", "paran", "variable"].includes(ne)) 
                    && result.next.length === 3;
                
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

                        const nextExp: ExpectedNumVal[] = ["paran", "number", "variable"];
                        const nextEquals = 
                            nextExp.every((ne) => result.next.includes(ne)) 
                            && nextExp.length === result.next.length;

                        return parsedEquals && waitEquals && nextEquals;
                    }
                ))
            })
        })
    })
    describe("Paran functions", () => {
        
        describe("Open paran", () => {
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
            it("Next is [paran, neg, number, variable]", () => {
                const nextExp: ExpectedNumVal[] = ["paran", "neg", "number", "variable"];
                const nextEquals = results.every((result) =>
                    nextExp.every((ne) => result.next.includes(ne)) && result.next.length === nextExp.length
                )
                expect(nextEquals).toBe(true);
            })

        })
        describe("Closed paran", () => {

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
                        exp: "1 + (2 * -3)",
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
                    exp: "1*(2+3)"
                }
            }
            const wait4: Waiting<NumberOperator> = {
                operator: null,
                negate: true,
                paran: {
                    _tag: "paranned",
                    exp: "1*10+7+(10 + 1)",
                }
            }
            it("1", () => {
                fc.assert(fc.property(
                    fc.integer(), (val: number) => {
                        const result = valueIsOrInParan(parsed, wait1, `${val}`);

                        const wait = result.waiting;

                        const parsedEquals = isEqual(result.parsed, parsed);
                        const nextExp: ExpectedNumVal[] = ["neg", "paran", "number", "operator", "variable"];
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
                        const nextExp: ExpectedNumVal[] = ["neg", "paran", "number", "operator", "variable"];
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
                        const nextExp: ExpectedNumVal[] = ["neg", "paran", "number", "operator", "variable"];
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
                        const nextExp: ExpectedNumVal[] = ["neg", "paran", "number", "variable", "operator"];
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
    })
    it("simplify add", () => {
        const exp = parseInput("10 / 3 + x") as Add<number>;
        const evalled = evaluateRecurse(
            exp, 
            {evaluate: evaluateNumExp, removeGroup: removeParan, isReadyForEvaluation: isReadyForEvaluation}
        );
        const r = simplifyRecurse(evalled as Add<number> | Sub<number>);
    })
    describe("Evaluate functions", () => {
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
        describe("sub", () => {
            it("Left and right are numbers", () => {
                fc.assert(fc.property(
                    fc.integer(), fc.integer(),
                    (left: number, right: number) => {
                        const result = sub(makeLeaf(left), makeLeaf(right));
                        return result._tag === "leaf" && result.val.val === left - right;
                    }
                ))
            })
            it("Left and right are var or num", () => {
                fc.assert(fc.property(
                    arbVarOrNum, arbVarOrNum,
                    (left: Variable | number, right: Variable | number) => {
                        const result = sub(makeLeaf(left), makeLeaf(right));
                        return variables.includes(left as Variable) || variables.includes(right as Variable)
                            ? left === right
                                ? result._tag === "leaf" && result.val.val === 0
                                : result._tag === "sub"
                            : result._tag === "leaf"
                    }
                ))
            })
        })
        describe("add", () => {
            it("Left and right are numbers", () => {
                fc.assert(fc.property(
                    fc.integer(), fc.integer(),
                    (left: number, right: number) => {
                        const result = mul(makeLeaf(left), makeLeaf(right));
                        return result._tag === "leaf" && result.val.val === left * right;
                    }
                ))
            })
            it("Left and right are var or num", () => {
                fc.assert(fc.property(
                    arbVarOrNum, arbVarOrNum,
                    (left: Variable | number, right: Variable | number) => {
                        const result = mul(makeLeaf(left), makeLeaf(right));
                        return variables.includes(left as Variable) || variables.includes(right as Variable)
                            ? result._tag === "mul"
                            : result._tag === "leaf"
                    }
                ))
            })
        })
        describe("add", () => {
            it("Left and right are numbers", () => {
                fc.assert(fc.property(
                    fc.integer(), fc.integer(),
                    (left: number, right: number) => {
                        const result = div(makeLeaf(left), makeLeaf(right));
                        return result._tag === "leaf" && result.val.val === left / right;
                    }
                ))
            })
            it("Left and right are var or num", () => {
                fc.assert(fc.property(
                    arbVarOrNum, arbVarOrNum,
                    (left: Variable | number, right: Variable | number) => {
                        const result = div(makeLeaf(left), makeLeaf(right));
                        return variables.includes(left as Variable) || variables.includes(right as Variable)
                            ? result._tag === "div"
                            : result._tag === "leaf"
                    }
                ))
            })
        })
    })
    it("thing", () => {
        const parsed = parseInput("a - (a + a)");
        const evalled = evaluateRecurse(
            parsed as Expression<number>, 
            {evaluate: evaluateNumExp, removeGroup: removeParan, isReadyForEvaluation: isReadyForEvaluation}
        );
        const simplified = simplify(evalled);
        const revParred = reverseParse(simplified);
    })
    it("simplify", () => {
        const exp = parseInput("a + (1 + b - 2) + (3 - a + 4) + 2 * a - 3 * a / a") as Expression<number>;

        const evalled = evaluateRecurse(
            exp,
            {evaluate: evaluateNumExp, removeGroup: removeParan, isReadyForEvaluation: isReadyForEvaluation}
        );
        const r = simplify(evalled);
    })
    describe("Order of operations", () => {
        it.each([
            [
                "1 + 2 * 3",
                "7",
            ],
            [
                "2 / 4 * 10",
                "5",
            ],
            [
                "(1 * 2) + 5",
                "7"
            ],
            [
                "1 + 2 * 3 + 5",
                "12"
            ],
            [
                "2 / -1 * 5",
                "-10"
            ]
        ])("order of operations", (input: string, expected: string) => {

            const parsed = parseInput(input);
            const result = orderOfOperations(parsed as Expression<number>, numOrder)
            const evalled = evaluateTreeVar(result, evaluateNumExp);
            const simplified = simplify(evalled);
            const stringed = reverseParse(simplified);
            expect(stringed).toBe(expected);
        })
    })
    describe("Order of Operations", () => {
        it.each([
            {
                tree: "(10 - 3 * 5 / b) * a / d",
                expectation: {
                    _tag: "div",
                    left: {
                        _tag: "mul",
                        left: {
                            _tag: "paran",
                            val: {
                                _tag: "sub",
                                left: makeLeaf(10),
                                right: {
                                    _tag: "div",
                                    left: {
                                        _tag: "mul",
                                        left: makeLeaf(3),
                                        right: makeLeaf(5)
                                    },
                                    right: makeLeaf("b")
                                },
                            }
                        },
                        right: makeLeaf("a")
                    },
                    right: makeLeaf("d")
                },
            }
        ])("Order of Operations", ({tree, expectation}) => {
            const r = orderOfOperations(parseInput(tree) as Expression<number>, numOrder);
            expect(r).toEqual(expectation);
        })
    })
    describe("NEW evaluate num exp", () => {
        it.each([
            {tree: parseInput("(a + b)"), expected: true},
            {tree: parseInput("a + b * c"), expected: true},
            {tree: parseInput("(10 * a) - 10"), expected: true},
            {tree: parseInput("1 + 2"), expected: true},
            {tree: parseInput("1 + 2 + 3"), expected: false},
            {tree: parseInput("-(1 * 2)"), expected: false},
            {tree: parseInput("-1"), expected: true},
            {tree: parseInput("a + b"), expected: true},
        ])("Is ready for evaluation", ({tree, expected}) => {
            const r = isReadyForEvaluation(tree as Expression<number>);
            expect(r).toBe(expected);
        })
        it.each([
            {tree: parseInput("1 + 2"), expected: parseInput("3")},
            {tree: parseInput("(3 * 5)"), expected: parseInput("(15)")},
            {tree: parseInput("12 + 3 + 5"), expected: parseInput("12 + 3 + 5")},
            {tree: parseInput("a + 4"), expected: parseInput("a + 4")},
        ])("Evaluate num exp", ({tree, expected}) => {
            const r = evaluateNumExp(tree as Expression<number>);
            expect(r).toEqual(expected);
        })
        it.each([
            {
                tree: "a",
                expected: "a"
            }
        ])("Evaluate recurse", () => {
            const tree = orderOfOperations(
                parseInput("(10 - 3 * 5 / b) * a / b") as Expression<number>, 
                numOrder
            )
            expect(1).toBe(1)
        })
        describe("Precedence funcs", () => {
            it.each([
                {tree: parseInput("1 * 2 + 3"), expected: parseInput("1 * 2 + 3")},
                {
                    tree: parseInput("10 - 3 * 5"), 
                    expected: {
                        _tag: "sub",
                        left: makeLeaf(10),
                        right: {
                            _tag: "mul",
                            left: makeLeaf(3),
                            right: makeLeaf(5)
                        },
                    }
                },
                {
                    tree: parseInput("10 - 3 * 5 / b"),
                    expected: {
                        _tag: "sub",
                        left: makeLeaf(10),
                        right: {
                            _tag: "div",
                            left: {
                                _tag: "mul",
                                left: makeLeaf(3),
                                right: makeLeaf(5)
                            },
                            right: makeLeaf("b")  
                        },
                    }
                },
            ])("Precedence left", ({tree, expected}) => {
                const result = orderOfOperations(tree as Expression<number>, numOrder);
                expect(result).toEqual(expected);
            })
        })
    })
    describe("Removing unwanted parentheses (leaf)", () => {
        it("Evaluator", () => {
            const exp = parseInput("4 + 4 * (4) - 4 - 4 + 4 / 4 * 4") as Expression<number>;
            const ordered = orderOfOperations(exp, numOrder);

            const evalled = evaluateRecurse(ordered, {evaluate: evaluateNumExp, isReadyForEvaluation: isReadyForEvaluation, removeGroup: removeParan});
            const simplified = simplify(evalled);
            expect(simplified).toEqual(parseInput("16"));
        })
        it("Remove paran", () => {
            const exp = parseInput("(x)");
            const result = removeParan(exp as Expression<number>);
            expect(result).toEqual(makeLeaf("x"));
        })
        it("Process inside evaluator test", () => {
            const exp = parseInput("(x)") as Paran<number>;

            const valEvaluated = evaluateRecurse(exp.val, {evaluate: evaluateNumExp, isReadyForEvaluation: isReadyForEvaluation, removeGroup: removeParan});
            const newExpEvaluated = evaluateNumExp({_tag: exp._tag, val: valEvaluated});
            const paranRemoved = removeParan(newExpEvaluated);
            expect(paranRemoved).toEqual(makeLeaf("x"));
        })
    })
    describe("NEW simplify", () => {
        it.each([
            {
                list: [
                    parseInput("10") as Expression<number>, 
                    parseInput("a") as Expression<number>, 
                    parseInput("b") as Expression<number>
                ],
                expectation: parseInput("10 + a + b")
            },
            {
                list: [
                    parseInput("10") as Expression<number>, 
                    parseInput("a") as Expression<number>, 
                    parseInput("-b") as Expression<number>
                ],
                expectation: parseInput("10 + a - b")
            }
        ])("convertAddListToExpression", ({list, expectation}) => {
            const result = convertAddListToExpression(list);

            expect(result).toEqual(expectation);
        })
        it.each([
            {
                list: [
                    parseInput("10") as Expression<number>, 
                    parseInput("a") as Expression<number>, 
                    parseInput("b") as Expression<number>
                ],
                expectation: parseInput("a + b + 10")
            },
            {
                list: [
                    parseInput("10") as Expression<number>, 
                    parseInput("a") as Expression<number>, 
                    parseInput("-b") as Expression<number>
                ],
                expectation: parseInput("a - b + 10")
            },
            {
                list: [
                    parseInput("10") as Expression<number>, 
                    parseInput("-a") as Expression<number>, 
                    parseInput("b") as Expression<number>
                ],
                expectation: parseInput("b - a + 10")
            },
            {
                list: [
                    parseInput("a") as Expression<number>,
                    parseInput("10") as Expression<number>, 
                    parseInput("-a") as Expression<number>, 
                ],
                expectation: parseInput("10"),
            },
            {
                list: [
                    parseInput("a") as Expression<number>,
                    parseInput("-a") as Expression<number>,
                ],
                expectation: parseInput("0")
            },
            {
                list: [
                    parseInput("a") as Expression<number>,
                    parseInput("b") as Expression<number>,
                    parseInput("-a") as Expression<number>,
                    parseInput("-b") as Expression<number>,
                ],
                expectation: parseInput("0")
            },
            {
                list: [
                    parseInput("-a") as Expression<number>,
                    parseInput("a") as Expression<number>,
                ],
                expectation: parseInput("0")
            }
        ])("addExpressionList", ({list, expectation}) => {
            const result = addExpressionList(list);

            expect(result).toEqual(expectation);
        })
        it.each([
            {
                tree: parseInput("a - a"),
                expectation: parseInput("0")
            },
            {
                tree: orderOfOperations(parseInput("10 - a + b * c + a") as Expression<number>, numOrder),
                expectation: parseInput("b * c + 10")
            }
        ])("Simplify", ({tree, expectation}) => {
            const result = simplify(tree as Expression<number>);
            expect(result).toEqual(expectation);
        })
    })
})