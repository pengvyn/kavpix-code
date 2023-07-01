import { parseInput } from "../tree-expressions/numbers/numbers";
import type { Expression } from "./truth-tables-parsing";

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
    let table: TOrF[][] = [["T"], ["F"]];
    for(let c = 1; c < statements.length; c++) {
        const tableWithT = table.map((row) => ["T" as TOrF, ...row]);
        const tableWIthF = table.map((row) => ["F" as TOrF, ...row]);
        table = [...tableWithT, ...tableWIthF];
    }
    return table;
}

export function singleStatementTableCols(rows: TOrF[][]): TOrF[][] {
    const cols = Array(rows[0].length).fill([]);

    function updateCols(columns: TOrF[][], row: TOrF[]): TOrF[][] {
        return row.map((el, idx) => [...columns[idx], el]); 
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
function biconditional(v1: TOrF[], v2: TOrF[]): TOrF[] {
    return v1.map((val, idx) => 
        val === "T" 
        ? v2[idx] === "T"
            ? "T"
            : "F"
        : v2[idx] === "F"
            ? "T"
            : "F"
    );
}

function untitled(tree: Expression, branches: Expression[] = [tree]) {
    
}

export function getTruthTable(input: string): string {
    const tree = parseInput(input);
    console.log(tree);

    return "";
}
