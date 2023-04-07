import { Add, Evaluate, Expression, Leaf, makeLeaf, makeWaiting, Neg, Paran, ParanWait, ParsedWaitNext, ParseInp, Waiting } from "./types";

export type NumberOperator = "+" | "x";
export const numberOperators: NumberOperator[] = ["+", "x"];
export type ExpectedNumVal = "neg" | "number" | "operator" | "paran";

export function joinSimilars(list: string[], similars: string[]): string[] {
    return list.reduce((p: string[], c: string) => p.length === 0
        ? [c]
        : similars.includes(c)
            ? similars.includes(p[p.length - 1][0])
                ? [...p.slice(0, p.length - 1), p[p.length - 1] + c]
                : [...p, c]
            : [...p, c],
            []
    )
}
// IF the previous value is an empty list (lenght is 0)
//      Add the current value
// elseIF the current value is a number:
//      IF the last element of the previous value is a number:
//          Add the last el of prev value to the current value and spread it into the previous value list
//      else
//          Add the current value
// else
//      Add the current value

function makeNumExp(leftOrValue: Expression<number>, right: Expression<number> | null = null, operator: NumberOperator | "-" | "paran"): Expression<number> {
    if(right === null && !(["-", "paran"].includes(operator))) {
        throw "Error: Operator is null";
    }
    if(operator === "+") {
        return {left: leftOrValue, right: right as Expression<number>, _tag: "add"};
    }
    if(operator === "x") {
        return {left: leftOrValue, right: right as Expression<number>, _tag: "mul"};
    }
    if(operator === "-") {
        return {val: leftOrValue, _tag: "neg"};
    }
    if(operator === "paran") {
        return {val: leftOrValue, _tag: "paran"};
    }
    throw "Error: Unexpected Operator";
}

export function isExpected(value: string, expected: ExpectedNumVal[]): boolean {
    if((numberOperators as string[]).includes(value)) {
        return expected.includes("operator");
    }
    if(value === "-") {
        return expected.includes("neg");
    }
    if(value.split("").every((n) => "1234567890".split("").includes(n))) {
        return expected.includes("number");
    }
    if(value === "(" || value === ")") {
        return expected.includes("paran");
    }
    return false;
}

export function valueIsOperator(
    value: NumberOperator, 
    parsed: Expression<number>, 
    waiting: Waiting<NumberOperator>
    ): ParsedWaitNext<number, NumberOperator, ExpectedNumVal> {
        const newWaiting: Waiting<NumberOperator> = {...waiting, operator: value};
        const nextExp: ExpectedNumVal[] = ["neg", "number", "paran"];
        return {parsed, waiting: newWaiting, next: nextExp};
}
export function valueIsNumber(
    value: number, 
    parsed: Expression<number> | null, 
    waiting: Waiting<NumberOperator>
    ): ParsedWaitNext<number, NumberOperator, ExpectedNumVal> {
        const newBranch: Expression<number> = waiting.negate 
        ? makeNumExp(makeLeaf(value), null, "-")
        : makeLeaf(value);
        const newParsed: Expression<number> = parsed === null
        ? newBranch
        : makeNumExp(parsed, newBranch, waiting.operator as NumberOperator);
        const nextExp: ExpectedNumVal[] = ["operator"];
        const newWaiting: Waiting<NumberOperator> = makeWaiting();
        return {parsed: newParsed, next: nextExp, waiting: newWaiting};
}
export function valueIsNegate(
    parsed: Expression<number> | null, 
    waiting: Waiting<NumberOperator>
    ): ParsedWaitNext<number, NumberOperator, ExpectedNumVal> {
        const newWaiting: Waiting<NumberOperator> = {...waiting, negate: true};
        const nextExp: ExpectedNumVal[] = ["number", "paran"];
        return {parsed, waiting: newWaiting, next: nextExp};
}

export function unclosedParan(exp: string): boolean {
    const splitted = exp.split("");
    const opens: number = splitted.reduce((p, c) => c === "(" ? p + 1 : p, 0);
    const closeds: number = splitted.reduce((p, c) => c === ")" ? p + 1 : p, 0);
    console.log(exp)
    return opens > closeds;
}

//-------------------

export function openParan(
    parsed: Expression<number> | null, 
    waiting: Waiting<NumberOperator>
): ParsedWaitNext<number, NumberOperator, ExpectedNumVal> {
    return {
        parsed, 
        waiting: {...waiting, paran: {_tag: "paranned", exp: ""}}, 
        next: ["neg", "number", "paran"]
    }
}
function closedParan(
    parsed: Expression<number> | null, 
    waiting: Waiting<NumberOperator>
): ParsedWaitNext<number, NumberOperator, ExpectedNumVal> {
    const paran = waiting.paran;

    if(paran._tag === "not-paranned") {
        console.log(parsed, waiting)
        throw "Error: No opening parantheses";
    }
    if(paran.exp === null || paran.exp === "") {
        throw "Error: No expression in parantheses";
    }
    if(parsed !== null && waiting.operator === null) {
        throw "Error: Operator missing";
    }
    if(unclosedParan(paran.exp)) {
        console.log("heyy")
        return {
            parsed,
            waiting: {...waiting, paran: {_tag: "paranned", exp: paran.exp + ")"}},
            next: ["operator", "paran"]
        };
    }

    const parsedParan: Paran<number> = {_tag: "paran", val: parseInput(paran.exp) as Expression<number>};
    const negged: Expression<number> = waiting.negate ? {_tag: "neg", val: parsedParan} : parsedParan;
    const newParsed = parsed === null 
        ? negged 
        : makeNumExp(parsed, negged, waiting.operator as NumberOperator);

    return {
        parsed: newParsed,
        waiting: makeWaiting(),
        next: ["operator", "paran"]
    }
}
function inParan(
    parsed: Expression<number> | null,
    waiting: Waiting<NumberOperator>,
    value: string
): ParsedWaitNext<number, NumberOperator, ExpectedNumVal> {
    return {
        parsed,
        waiting: {...waiting, paran: {_tag: "paranned", exp: waiting.paran.exp + value}},
        next: ["neg", "number", "paran", "operator"]
    };
}
export function valueIsOrInParan(
    parsed: Expression<number> | null,
    waiting: Waiting<NumberOperator>,
    value: string
): ParsedWaitNext<number, NumberOperator, ExpectedNumVal> {
    // let newParan: ParanWait;
    // let newParsed: Expression<number> | null = parsed;
    // let newNext: ExpectedNumVal[] = [];
    let PWN: ParsedWaitNext<number, NumberOperator, ExpectedNumVal>;

    if(value === ")") {
        PWN = closedParan(parsed, waiting);
    } else if(waiting.paran._tag === "paranned") {
        PWN = inParan(parsed, waiting, value);
    } else {
        PWN = openParan(parsed, waiting);
    }
    // switch (value) {
    //     case "(":
    //         PWN = openParan(parsed, waiting);
    //         break;
    //     case ")":
    //         PWN = closedParan(parsed, waiting);
    //         break;
    //     default:
    //         PWN = inParan(parsed, waiting, value);
    // }
    return PWN;
}

// export function valueIsOrInParan(
//     parsed: Expression<number> | null,
//     waiting: Waiting<NumberOperator>,
//     value: string
// ): ParsedWaitNext<number, NumberOperator, ExpectedNumVal> {

    // if the value is an open parantheses
        // set inParan to true
        // next expected is [paran, number, neg]

    // if the value is closed parantheses
        // check if the v

    //-----------

    // if(value === "(") {
    //     return {
    //         parsed, 
    //         waiting: {...waiting, paran: {inParan: true, exp: waiting.paran.exp + value}}, 
    //         next: ["paran", "number", "neg"]
    //     };
    // } else if(value === ")") {
    //     const next: ExpectedNumVal[] = ["operator", "paran"];
        
    //     if(unclosedParan(waiting.paran.exp)) {
    //         console.log("hii", value, parsed)
    //         return {
    //             parsed,
    //             waiting: {...waiting, paran: {inParan: true, exp: waiting.paran.exp + value}},
    //             next
    //         }
    //     } else {

    //         const parsedParan: Expression<number> | null = parseInput(waiting.paran.exp);

    //         if(parsedParan === null) {
    //             throw "Error: Expression missing in parantheses";
    //         }

    //         const paranExped: Expression<number> = makeNumExp(parsedParan, null, "paran");
    //         const negatedParan: Expression<number> = waiting.negate 
    //             ? makeNumExp(paranExped, null, "-")
    //             : paranExped;

    //         return {
    //             parsed: parsed === null || waiting.operator === null
    //                 ? negatedParan
    //                 : makeNumExp(parsed, negatedParan, waiting.operator),
    //             waiting: makeWaiting(),
    //             next
    //         }
    //     }
    // } else {
    //     return {
    //         parsed,
    //         waiting: {...waiting, paran: {inParan: true, exp: waiting.paran.exp + value}},
    //         next: ["neg", "number", "operator", "paran"]
    //     }
    // }
// }

export function parseInput(input: string): Expression<number> | null {
    const listed = joinSimilars(input.replaceAll(" ", "").split(""), "1234567890".split(""));

    let parsed: Expression<number> | null = null;
    let waiting: Waiting<NumberOperator> = makeWaiting()
    let nextExp: ExpectedNumVal[] = ["neg", "number", "paran"];

    for(let idx = 0; idx < listed.length; idx++) {
        const curVal: string = listed[idx];
        if(!isExpected(curVal, nextExp)) {
            console.log(curVal, idx, listed, nextExp)
            throw "Error: Unexpected value";
        } else {
            const shouldCallParan = waiting.paran._tag === "paranned" || curVal === ")" || curVal === "(";

            const newStorage: ParsedWaitNext<number, NumberOperator, ExpectedNumVal> = 
            shouldCallParan 
            ? valueIsOrInParan(parsed, waiting, curVal)
            : curVal === "-"
                ? valueIsNegate(parsed, waiting)
                : (numberOperators as string[]).includes(curVal)
                    ? valueIsOperator(curVal as NumberOperator, parsed as Expression<number>, waiting)
                    : valueIsNumber(JSON.parse(curVal), parsed, waiting);
            
            parsed = newStorage.parsed;
            waiting = newStorage.waiting;
            nextExp = newStorage.next;
        }
    }
    return parsed;
}

interface AddLeaf {
    left: Leaf<number>
    right: Leaf<number>
    _tag: "add"
}
interface MulLeaf {
    left: Leaf<number>
    right: Leaf<number>
    _tag: "mul"
}
interface NegLeaf {
    val: Leaf<number>
    _tag: "neg"
}

function add(exp: AddLeaf): Leaf<number> {
    return makeLeaf(exp.left.val + exp.right.val);
}
function mul(exp: MulLeaf): Leaf<number> {
    return makeLeaf(exp.left.val * exp.right.val);
}
function neg(exp: NegLeaf): Leaf<number> {
    return makeLeaf(exp.val.val * -1);
}
export function evaluateNum(exp: AddLeaf | MulLeaf | NegLeaf): Leaf<number> {
    if(exp._tag === "add") {
        return add(exp);
    }
    if(exp._tag === "mul") {
        return mul(exp);
    }
    return neg(exp);
}