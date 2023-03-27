import { Evaluate, Expression, makeWaiting, Neg, ParseInp, Waiting } from "./types";

type NumberOperator = "-" | "+";
const numberOperators: NumberOperator[] = ["+", "-"];
type ExpectedNumVal = "neg" | "number" | "operator";

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

function makeNumExp(leftOrValue: Expression<number>, right: Expression<number> | null = null, operator: NumberOperator): Expression<number> {
    if(right === null && operator !== "-") {
        throw "Error: Operator is null";
    }
    if(operator === "+") {
        return {left: leftOrValue, right: right as Expression<number>, _tag: "add"};
    }
    return {val: leftOrValue, _tag: "neg"};
}
function isExpected(val: string, expectedValues: ExpectedNumVal[]): boolean {
    if(!(numberOperators as string[]).includes(val)) {
        return expectedValues.includes("number");
    }
    if(val === "+") {
        return expectedValues.includes("operator");
    }
    return expectedValues.includes("neg");
}

export const parseNumber: ParseInp<number> = (inp: string) => {
    const splitted = joinSimilars(inp.replaceAll(" ", "").split(""), "1234567890".split(""));
    let parsed: Expression<number> | null = null;
    let waiting: Waiting<NumberOperator> = makeWaiting();
    let expectedValue: ExpectedNumVal[] = ["neg", "number"];
    console.log(splitted);
    for(let idx = 0; idx < splitted.length; idx++) {
        const curVal = splitted[idx];

        if(!isExpected(curVal, expectedValue)) {
            throw `Error: Unexpected value "${curVal}" at ${idx}`;
        } else if((numberOperators as string[]).includes(curVal)) {
            waiting = curVal === "-" 
                ? makeWaiting<NumberOperator>(null, true) 
                : {...waiting, operator: curVal as NumberOperator};
            expectedValue = curVal === "-" ? ["number"] : ["neg", "number"];
        } else {
            const curValNum: number = JSON.parse(curVal);

            const operatorNull = waiting.operator === null;
            const negateNull = waiting.negate === null;

            if(parsed === null) {
                if(waiting.negate) {
                    parsed = makeNumExp(curValNum, null, "-");
                } else {
                    parsed = curValNum;
                }
                expectedValue = ["operator"];
                waiting = makeWaiting();
            } else {
                if(operatorNull) {
                    throw `Error at ${idx}: Operator is null`;
                } else if(negateNull) {
                    parsed = makeNumExp(parsed, curValNum, waiting.operator as NumberOperator);
                    waiting = makeWaiting();
                    expectedValue = ["operator"];
                } else {
                    const negated = makeNumExp(curValNum, null, "-");
                    parsed = makeNumExp(parsed, negated, waiting.operator as NumberOperator);
                    expectedValue = ["operator"];
                    waiting = makeWaiting();
                }
            }
        }
    }
    return parsed;
}