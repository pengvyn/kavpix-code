import * as fc from "fast-check";
import type { Statement } from "../scripts/truth-tables/truth-tables";

const lowercaseLetters = "abcdefghijklmnopqrstuvwxyz";
const uppercaseLetters = lowercaseLetters.toUpperCase();

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