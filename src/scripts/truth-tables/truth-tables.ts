// input will be in string format
// input should look like "X and Y" or "X or Y" ORR "X => Y" (that can also be written as "If X then Y") etc etc.
// parse the input to have statements and functions(?) separately
// the number of rows is 2^[number of statements]
// returns truth table in string format? separated by | and _ maybe

import { getStatements, parseInput } from "./truth-tables-parsing";

export type Statement = "A"|"B"|"C"|"D"|"E"|"F"|"G"|"H"|"I"|"J"|"K"|"L"|"M"|"N"|"O"|"P"|"Q"|"R"|"S"|"T"|"U"|"V"|"W"|"X"|"Y"|"Z";
export const statementValues: Statement[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("") as Statement[];
export type TOrF = "T" | "F";
export type Operator = "|" | "&" | "=>" | "<=>";
export const operatorValues: Operator[] = ["|", "&", "=>", "<=>"];

export function removeStatementDupes(statements: Statement[]): Statement[] {
    return statements.reduce(
        (dupeless, stmt) => dupeless.includes(stmt) 
            ? dupeless 
            : [...dupeless, stmt], 
            [] as Statement[]
        );
}

export function singleStatementTableRows(statements: Statement[]): TOrF[][] {
    // s1: [T] [F]
    // s2: [T, T] [T, F] [F, T] [F, F]
    // s3: [T, T, T] [T, T, F] [T, F, T] [T, F, F] [F, T, T] [F, T, F] [F, F, T] [F, F, F]

    // start w [[T], [F]]
    // when the index goes up, combine T with all the values, then F with all the values and join them together
    // keep repeating until all the statements are finished / count is the statement's length
    let table: TOrF[][] = [["T"], ["F"]];
    for(let c = 1; c < statements.length; c++) {
        const tableWithT = table.map((row) => ["T" as TOrF, ...row]);
        const tableWIthF = table.map((row) => ["F" as TOrF, ...row]);
        table = [...tableWithT, ...tableWIthF];
    }
    return table;
}

export function singleStatementTableCols(rows: TOrF[][]): TOrF[][] {
    const cols = Array(rows[0].length).fill([]); // rows[0].length is the number of columns

    function updateCols(columns: TOrF[][], row: TOrF[]): TOrF[][] {
        return row.map((el, idx) => [...columns[idx], el]); 
        // new list with the columns having all the values of the row respectively 
    }

    return rows.reduce((columns, row) => updateCols(columns, row), cols);
}


function or(v1: TOrF[], v2: TOrF[]): TOrF[] {
    return v1.map((val, idx) => val === "T" || v2[idx] === "T" ? "T" : "F");
}
function and(v1: TOrF[], v2: TOrF[]): TOrF[] {
    return v1.map((val, idx) => val === "T" && v2[idx] === "T" ? "T" : "F");
}
function not(v: TOrF[]) {
    return v.map((val) => val === "T" ? "F" : "T");
}
function conditional(v1: TOrF[], v2: TOrF[]): TOrF[] {
    const isTrueOrFalse = (val1: TOrF, val2: TOrF): TOrF => {
        if(val1 === "T") {
            return val2 === "T" ? "T" : "F";
        }
        return "T";
    }
    return v1.map((val, idx) => isTrueOrFalse(val, v2[idx]));
}

export function getTruthTable(input: string): string {
    const statements = removeStatementDupes(getStatements(input));
    const sstr = singleStatementTableRows(statements);
    const sstc = singleStatementTableCols(sstr);
    console.log(parseInput(input));
    return "";
}
