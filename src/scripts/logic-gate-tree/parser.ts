// takes in an input (string)
// it gets parsed, the same way as the number tree

import { variables } from "../tree-expressions/types";
import { makeGate, makeLeaf } from "./make-gates";
import type { Gate, GateName, Leaf, NextExp, ParsedWaitNext, Waiting } from "./types";

// export const gateNames = ["not", "and", "or", "nand", "nor", "xor", "true", "false"];

export const gateNames = ["~", "&", "|", "~&", "~|", "#", "true", "false"];

export function prepareGateString(gate: string, names: string[]): string[] {
    const listed = gate.split("").reduce(
        (p, c) => [...p, c === "T" || c === "F"
            ? c
            : c.toLowerCase()
        ],
        [] as string[]
    )
    
    // joining
    let waiting: string = "";
    let prepared: string[] = [];

    for (const idx in listed) {
        if (listed[idx] === " ") {
            
            if(waiting !== "") {
                prepared = [...prepared, waiting];
            }

            waiting = "";

        } else if (listed[idx] === "(" || listed[idx] === ")") {
            prepared = [...prepared, ...(waiting === "" ? [] : [waiting]), listed[idx]];
            waiting = "";

        } else if (JSON.parse(idx) === listed.length - 1) {
            waiting = waiting /*+ listed[idx];*/
            prepared = [...prepared, ...(waiting === "" ? [] : [waiting]), listed[idx]];

        } else if (waiting === "~") {
            if(listed[idx] === "&" || listed[idx] === "|") {
                waiting = waiting + listed[idx];
            } else {
                prepared = [...prepared, waiting, listed[idx]];
                waiting = "";
            }
        } else {
            waiting = waiting + listed[idx];

        }
    }
    const r = prepared.reduce(
        (p, c) => names.includes(c)
            ? [...p, c.slice(0, 1).toUpperCase() + c.slice(1)]
            : [...p, c],
        [] as string[]
    )

    return r;
}

const binaryGateNames = ["&", "|", "~&", "~|", "#", "=>", "<=>"];

export function isExpected(cur: string, nextExp: NextExp[]): NextExp | "unexpected" {
    if(["(", ")"].includes(cur)) {
        return nextExp.includes("parentheses") ? "parentheses" : "unexpected";
    }
    if(["T", "F", "1", "0", ...variables].includes(cur)) {
        return nextExp.includes("leaf") ? "leaf" : "unexpected";
    }
    if(binaryGateNames.includes(cur.toLowerCase())) {
        return nextExp.includes("gate") ? "gate" : "unexpected";
    }
    if(cur === "~") {
        return nextExp.includes("not") ? "not" : "unexpected";
    }
    return "unexpected";
}

export function valueIsGate(name: GateName, PWD: ParsedWaitNext): ParsedWaitNext {
    const newWait: Waiting = name === "~" 
        ? {...PWD.wait, isNegated: PWD.wait.isNegated ? false : true} 
        : {...PWD.wait, gateName: name};
    const newNext: NextExp[] = ["not", "parentheses", "leaf"];
    return {...PWD, wait: newWait, next: newNext};
}
export function valueIsLeaf(stringVal: string, PWD: ParsedWaitNext): ParsedWaitNext {
    const val = stringVal === "1" || stringVal === "0" ? JSON.parse(stringVal) : stringVal;
    const {parsed, wait, next} = PWD;
    const leafed: Gate = wait.isNegated ? makeGate("~", makeLeaf(val), null) : makeLeaf(val);

    // parsed is empty and waiting is empty
    // parsed is empty but waiting is not empty
    // parsed is not empty and waiting is not empty
    const newNext: NextExp[] = ["gate", "parentheses"];

    if(parsed === null) {
        if(wait.gateName === null) {
            const newParsed: Gate = leafed;
            return {...PWD, wait: {...wait, isNegated: false}, parsed: newParsed, next: newNext};
        }
        
        const newParsed = makeGate(wait.gateName, leafed, null);
        const newWait: Waiting = {...wait, gateName: null};
        return {parsed: newParsed, wait: newWait, next: newNext};
    }

    const newParsed = makeGate(wait.gateName?.toLowerCase() as GateName, parsed, leafed);
    const newWait: Waiting = {...wait, isNegated: false, gateName: null};
    return {parsed: newParsed, wait: newWait, next: newNext};
}

// -------------- PARAN FUNCS ---------------

export function valueIsOpenParan(PWD: ParsedWaitNext): ParsedWaitNext {
    const group = PWD.wait.group;

    if(group._tag === "grouped") {
        return {
            ...PWD, 
            wait: {
                ...PWD.wait, 
                group: {_tag: "grouped", expression: group.expression}
            },
            next: ["parentheses", "leaf", "not"]
        };
    }
    return {
        ...PWD, 
        wait: {
            ...PWD.wait,
            group: {
                ...group,
                _tag: "grouped",
            }
        }
    }
}

export function areAllParenthesesClosed(str: string): boolean {
    const openParans = str.match(/[\(]/g);
    const closedParans = str.match(/[\)]/g);
    return openParans?.length === closedParans?.length
}

export function valueIsClosedParan(PWD: ParsedWaitNext): ParsedWaitNext {
    const {parsed, wait, next} = PWD;
    const group = wait.group;

    if(!areAllParenthesesClosed(group.expression)) {
        return {
            ...PWD, 
            wait: {
                ...wait, 
                group: {
                    _tag: "grouped", 
                    expression: group.expression + ")"
                }
            },
            next: ["gate", "parentheses"]
        }
    }

    const newGate = makeGate("group", parseGate(group.expression) as Gate, null);

    const notted = wait.isNegated ? makeGate("~", newGate, null) : newGate;
    const newParsed = parsed === null
        ? notted
        : makeGate((wait.gateName as string).toLowerCase() as GateName, parsed, notted);
    
    const newWait: Waiting = {
        ...wait,
        gateName: null,
        isNegated: false,
        group: {
            _tag: "ungrouped",
            expression: ""
        }
    }
    const newNext: NextExp[] = ["gate", "leaf", "parentheses"];

    return {parsed: newParsed, wait: newWait, next: newNext};
}
export function valueIsInGroup(val: string, PWD: ParsedWaitNext): ParsedWaitNext {
    const wait = PWD.wait;
    const group = wait.group;
    return {
        ...PWD,
        wait: {
            ...wait,
            group: {
                ...group,
                expression: group.expression + " " + val,
            }
        },
        next: ["gate", "leaf", "not", "parentheses"],
    }
}

export function valueIsOrInGroup(val: string, PWD: ParsedWaitNext): ParsedWaitNext {
    switch(val) {
        case "(":
            return valueIsOpenParan(PWD);
        case ")":
            return valueIsClosedParan(PWD);
        default:
            return valueIsInGroup(val, PWD);
    }
}

// ----------

export function parseGate(gate: string): Gate | null {
    const listed = prepareGateString(gate, gateNames);
    console.log(listed);

    let waiting: Waiting = { 
        gateName: null, 
        isNegated: false,
        group: {expression: "", _tag: "ungrouped"}
    };
    let parsed: Gate | null = null;
    let nextExp: NextExp[] = ["gate", "parentheses", "leaf", "not"];

    for (const idx in listed) {
        const curVal = listed[idx];
        const curValType = isExpected(curVal, nextExp);
        if(curValType === "unexpected") {
            console.log(waiting, parsed)
            console.log("UNEXPECTED:", curVal)
            throw "Unexpected character: " + curVal;
        }

        const curPWD = {parsed, wait: waiting, next: nextExp};

        if(waiting.group._tag === "grouped") {
            const PWD = valueIsOrInGroup(curVal, curPWD);
            parsed = PWD.parsed;
            waiting = PWD.wait;
            nextExp = PWD.next;
        } else {
            let PWD: ParsedWaitNext = {parsed, wait: waiting, next: nextExp};

            switch(curValType) {
                case "parentheses":
                    PWD = valueIsOrInGroup(curVal, curPWD);
                    break;
                case "leaf":
                    PWD = valueIsLeaf(curVal, curPWD);
                    break;
                case "gate":
                case "not":
                    PWD = valueIsGate(curVal as GateName, curPWD);
                    break;
            }

            parsed = PWD.parsed;
            waiting = PWD.wait;
            nextExp = PWD.next;
        }
    }

    return parsed;
}