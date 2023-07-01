import fc from "fast-check";
import { describe, it } from "vitest";
import { removeStatementDupes, singleStatementTableCols, singleStatementTableRows, Statement, TOrF } from "../scripts/truth-tables/truth-tables";
import { statementsArb } from "./arbitraries";

describe("Truth tables", () => {
    describe("Remove statement dupes", () => {
        it("Always less than or equal to og length", () => {
            fc.assert(fc.property(
                statementsArb, (stmt: Statement[]) => {
                    const result = removeStatementDupes(stmt);
                    return result.length <= stmt.length;
                }
            ))
        })
        it("All items in result are in og list", () => {
            fc.assert(fc.property(
                statementsArb, (statements: Statement[]) => {
                    const result = removeStatementDupes(statements);
                    return result.every((s) => statements.includes(s));
                }
            ))
        })
    })
    describe("Single statement table (row)", () => {
        it("Number of rows is 2^n", () => {
            fc.assert(fc.property(
                statementsArb, (stmtDupes: Statement[]) => {
                    const stmt: Statement[] = removeStatementDupes(stmtDupes);
                    const result: TOrF[][] = singleStatementTableRows(stmt);
                    return result.length === (2 ** stmt.length);
                }
            ))
        })
        it("All rows are different", () => {
            fc.assert(fc.property(
                statementsArb, (stmtDupes: Statement[]) => {
                    const stmt: Statement[] = Array.from(new Set(stmtDupes));
                    const result: TOrF[][] = singleStatementTableRows(stmt);
                    return result.every((torf) => 
                        result.findIndex((el => el === torf)) === result.lastIndexOf(torf)
                    );
                }
            ))
        })
        it("Length of each row is input's length", () => {
            fc.assert(fc.property(
                statementsArb, (stmtDupes: Statement[]) => {
                    const stmt: Statement[] = Array.from(new Set(stmtDupes));
                    const result: TOrF[][] = singleStatementTableRows(stmt);
                    return result.every((row) => row.length === stmt.length);
                }
            ))
        })
    })
    describe("Single statement table (col)", () => {
        it("Length of each col is 2^n", () => {
            fc.assert(fc.property(
                statementsArb, (stmtDupes: Statement[]) => {
                    const statements = removeStatementDupes(stmtDupes);
                    const rows = singleStatementTableRows(statements);
                    const result = singleStatementTableCols(rows);
                    return result.every((col) => col.length === (2 ** statements.length));
                }
            ))
        })
        it("Number of colums is the number of statements", () => {
            fc.assert(fc.property(
                statementsArb, (stmtDupes: Statement[]) => {
                    const statements = removeStatementDupes(stmtDupes);
                    const rows = singleStatementTableRows(statements);
                    const result = singleStatementTableCols(rows);
                    return result.length === statements.length;
                }
            ))
        })
        it("All columns are different", () => {
            fc.assert(fc.property(
                statementsArb, (stmtDupes: Statement[]) => {
                    const statements = removeStatementDupes(stmtDupes);
                    const rows = singleStatementTableRows(statements);
                    const result = singleStatementTableCols(rows);
                    return result.every((col) => 
                        result.findIndex((el => el === col)) === result.lastIndexOf(col)
                    );
                }
            ))
        })
    })
})