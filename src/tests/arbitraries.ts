import * as fc from "fast-check";
import { ExpectedNumVal, NumberOperator, numberOperators } from "../scripts/tree-expressions/numbers";
import type { Expression, Waiting } from "../scripts/tree-expressions/types";
import type { Statement } from "../scripts/truth-tables/truth-tables";

const lowercaseLetters = "abcdefghijklmnopqrstuvwxyz";
const uppercaseLetters = lowercaseLetters.toUpperCase();

export function joinArbs<T>(list: fc.Arbitrary<T>[]): fc.Arbitrary<T[]> {
    const initial = fc.array(fc.constant(undefined), {
        minLength: 0,
        maxLength: 0,
    }) as unknown as fc.Arbitrary<T[]>;
    return list.reduce(
        (joined, cur) =>
            joined.chain((vals) => cur.chain((val) => fc.constant([...vals, val]))),
        initial
    );
}

// power set

const alphabet = lowercaseLetters + lowercaseLetters.toUpperCase();
const alphabetAndNums = [...alphabet.split(""), 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const strNumList: fc.Arbitrary<(number | string)[]> = fc.array(
    fc.constantFrom(...alphabetAndNums), 
    { maxLength: 10, minLength: 0}
);
export const strNumSet: fc.Arbitrary<(number | string)[]> = strNumList.chain(
    (list) => fc.constant(Array.from(new Set(list)))
)
export type StrNumSet = (number | string)[];

// truth table

export const statementArb: fc.Arbitrary<Statement> = fc.constantFrom(...(uppercaseLetters.split("") as Statement[]));
export const statementsArb: fc.Arbitrary<Statement[]> = fc.array(
    fc.constantFrom(
        ...(uppercaseLetters.split("") as Statement[])), 
        {minLength: 2, maxLength: 20}
);

// exp tree
//  number

export const arbNumOperator: fc.Arbitrary<NumberOperator> = fc.constantFrom(...numberOperators);

export const arbNumWaiting: fc.Arbitrary<Waiting<number>> = fc.constantFrom(...numberOperators, null).chain(
    (op) => fc.constantFrom(true, false).chain((neg) => fc.constant({operator: op, negate: neg} as Waiting<number>))
)

export const arbStringAndNumList: fc.Arbitrary<string[]> = fc.array(fc.constantFrom(...alphabet, ..."01234567890".split("")), 
            {minLength: 0, maxLength: 50}
)

export const arb2DigitNum: fc.Arbitrary<number> = fc.integer({min: 0, max: 99});

// export function arbWaitingString(
//     str: fc.Arbitrary<string> = fc.constant(""), 
//     next: ExpectedNumVal[] = ["neg", "number", "paran"],
//     prev: ExpectedNumVal | null = null,
//     length: number = 10,
// ): fc.Arbitrary<string> {
//     const rand = Math.floor(Math.random() * next.length);
//     const cur: ExpectedNumVal = next[rand];

//     const chainAndAdd = (addTo: fc.Arbitrary<string>, val: string) => addTo.chain(
//         (s) => fc.constant(s + val)
//     );

//     switch(cur) {
//         case "neg":
//             return arbWaitingString(
//                 chainAndAdd(str, "-"),
//                 ["number", "paran"],
//                 cur,
//                 length
//             );
//         case "paran":
//             if(prev === "neg" || prev === "paran") {
//                 return arbWaitingString(
//                     chainAndAdd(str, "("),
//                     ["neg", "number", "paran"],
//                     "paran",
//                     length
//                 )
//             }
//             return fc.constantFrom(")", "(").chain((p) => 
//                 arbWaitingString(
//                     chainAndAdd(str, p),
//                     p === ")" ? ["operator", "paran", ],
//                     length
//                 )
//             )
//     }
// }