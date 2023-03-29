import { Evaluate, Expression, makeWaiting, Neg, ParsedWaitNext, ParseInp, Waiting } from "./types";

export type NumberOperator = "+";
export const numberOperators: NumberOperator[] = ["+"]
export type ExpectedNumVal = "neg" | "number" | "operator";

// export function joinSimilars(list: string[], similars: string[]): string[] {
//     return list.reduce((p: string[], c: string) => similars.includes(c)
//             // ? p.length !== 0 && similars.includes(p[p.length - 1].split("")[0])
//             //     ? [...p.slice(p.length - 1), p + c]
//             //     : [...p, `P DOT LENGTH IS ${p.length}`]
//             // : p.length === 0
//             //     ? ["AKJSDKASJDHLAKJHAAAAAAAAAA"]
//             //     : [...p, c],
//             // []
//             ? 
//         )
// }

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

function makeNumExp(leftOrValue: Expression<number>, right: Expression<number> | null = null, operator: NumberOperator | "-"): Expression<number> {
    if(right === null && operator !== "-") {
        throw "Error: Operator is null";
    }
    if(operator === "+") {
        return {left: leftOrValue, right: right as Expression<number>, _tag: "add"};
    }
    return {val: leftOrValue, _tag: "neg"};
}
// function isExpected(val: string, expectedValues: ExpectedNumVal[]): boolean {
//     console.log(val);
//     if(val === "+") {
//         return expectedValues.includes("operator");
//     }
//     if(val === "-") {
//         return expectedValues.includes("neg");
//     }
//     if(Number.isInteger(JSON.parse(val))) {
//         return expectedValues.includes("number");
//     }
//     return false;
// }

// export const parseNumber: ParseInp<number> = (inp: string) => {
//     const splitted = joinSimilars(inp.replaceAll(" ", "").split(""), "1234567890".split(""));
//     let parsed: Expression<number> | null = null;
//     let waiting: Waiting<NumberOperator> = makeWaiting();
//     let expectedValue: ExpectedNumVal[] = ["neg", "number"];
//     console.log(splitted);
//     for(let idx = 0; idx < splitted.length; idx++) {
//         const curVal = splitted[idx];

//         if(!isExpected(curVal, expectedValue)) {
//             throw `Error: Unexpected value "${curVal}" at ${idx}`;
//         } else if((numberOperators as string[]).includes(curVal)) {
//             waiting = curVal === "-" 
//                 ? makeWaiting<NumberOperator>(null, true) 
//                 : {...waiting, operator: curVal as NumberOperator};
//             expectedValue = curVal === "-" ? ["number"] : ["neg", "number"];
//         } else {
//             const curValNum: number = JSON.parse(curVal);

//             const operatorNull = waiting.operator === null;
//             const negateNull = waiting.negate === null;

//             if(parsed === null) {
//                 if(waiting.negate) {
//                     parsed = makeNumExp(curValNum, null, "-");
//                 } else {
//                     parsed = curValNum;
//                 }
//                 expectedValue = ["operator"];
//                 waiting = makeWaiting();
//             } else {
//                 if(operatorNull) {
//                     throw `Error at ${idx}: Operator is null`;
//                 } else if(negateNull) {
//                     parsed = makeNumExp(parsed, curValNum, waiting.operator as NumberOperator);
//                     waiting = makeWaiting();
//                     expectedValue = ["operator"];
//                 } else {
//                     const negated = makeNumExp(curValNum, null, "-");
//                     parsed = makeNumExp(parsed, negated, waiting.operator as NumberOperator);
//                     expectedValue = ["operator"];
//                     waiting = makeWaiting();
//                 }
//             }
//         }
//     }
//     return parsed;
// }

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
    return false;
}

export function valueIsOperator(
    value: NumberOperator, 
    parsed: Expression<number>, 
    waiting: Waiting<NumberOperator>
    ): ParsedWaitNext<number, NumberOperator, ExpectedNumVal> {
        const newWaiting: Waiting<NumberOperator> = {...waiting, operator: value};
        const nextExp: ExpectedNumVal[] = ["neg", "number"];
        return {parsed, waiting: newWaiting, next: nextExp};
}
export function valueIsNumber(
    value: number, 
    parsed: Expression<number> | null, 
    waiting: Waiting<NumberOperator>
    ): ParsedWaitNext<number, NumberOperator, ExpectedNumVal> {
        const newBranch: Expression<number> = waiting.negate 
        ? makeNumExp(value, null, "-")
        : value;
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
        const nextExp: ExpectedNumVal[] = ["number"];
        return {parsed, waiting: newWaiting, next: nextExp};
}

export function parseInput(input: string): Expression<number> | null {
    const listed = joinSimilars(input.replaceAll(" ", "").split(""), "1234567890".split(""));

    let parsed: Expression<number> | null = null;
    let waiting: Waiting<NumberOperator> = { operator: null, negate: false};
    let nextExp: ExpectedNumVal[] = ["neg", "number"];

    for(let idx = 0; idx < listed.length; idx++) {
        const curVal: string = listed[idx];
        if(!isExpected(curVal, nextExp)) {
            throw "Error: Unexpected value";
        } else {
            const newStorage: ParsedWaitNext<number, NumberOperator, ExpectedNumVal> = 
            curVal === "-"
                ? valueIsNegate(parsed, waiting)
                : (numberOperators as string[]).includes(curVal)
                    ? valueIsOperator(curVal as NumberOperator, parsed as Expression<number>, waiting)
                    : valueIsNumber(JSON.parse(curVal), parsed, waiting);
            
            parsed = newStorage.parsed;
            waiting = newStorage.waiting;
            nextExp = newStorage.next;
        }
        // } else if(curVal === "-") {
        //     const newStorage = valueIsNegate(parsed, waiting);
        //     parsed = newStorage.parsed;
        //     waiting = newStorage.waiting;
        //     nextExp = newStorage.next;

        // } else if((numberOperators as string[]).includes(curVal)) {
        //     const newStorage = valueIsOperator(curVal as NumberOperator, parsed, waiting);
        //     parsed = newStorage.parsed;
        //     waiting = newStorage.waiting;
        // }
    }
    return parsed;
}

// function that checks if the value is expected
//  (this means that this function should take care of EVERYTHING. no value that shouldn't be there should pass)
//  cases:
//      value is an operator (in this case just "+")
//      value is the negation
//      value is a number (can check this by splitting the number and seeing if each of them are included in the list of numbers)
//      value is parantheses (TODO later)
//      if it isn't any of these, return false

// handler function for each value:
//  each of the functions may do these things:
//      update the Waiting
//      update the Parsed
//      update the Next Expected

//  function for if the value is an operator
//      Put the operator into the waiting
//      the next expected is either a negate or a number

//--------------

//  function for if the value is a number
//      if there's something in the waiting:
//          it should check if theres a negate in the waiting 
//              if there is, it should create a negate expression and another expression w/ the parsed and the negate
//          if there isn't a negate
//              create an expression with the parsed and the number
//      otherwise, it should set parsed to the number

//      next expected is an operator
//      waiting should be reset to empty

//------------------

//  function for if the value is negate
//      it should be put into the waiting
//      everything else remains the same