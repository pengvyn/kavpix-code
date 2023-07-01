import { Operator, operatorValues, Statement, statementValues } from "./truth-tables";

export interface Or {
    left: Expression
    right: Expression
    _tag: "or"
}
export interface And {
    left: Expression
    right: Expression
    _tag: "and"
}
export interface Not {
    value: Expression
    _tag: "not"
}
export interface Conditional {
    left: Expression
    right: Expression
    _tag: "conditional"
}
export interface Biconditional {
    left: Expression
    right: Expression
    _tag: "biconditional"
}
export interface Paran {
    value: Expression
    _tag: "paran"
}
type Tag = "or" | "and" | "not" | "conditional" | "biconditional" | "paran";
export type Expression = Or | And | Not | Conditional | Biconditional | Paran | Statement;

export function statementTopRow(statements: Statement[]): string {
    const topRow = statements.reduce((p, c, idx) => 
        `${p} ${c} |${idx === statements.length - 1? "|" : ""}`, "||"
    );

    let separator = ""
    for(let i = 0; i < topRow.length; i++) {
        separator = separator + "=";
    }
    return `${topRow}\n${separator}`;
}


export function getStatements(input: string): Statement[] {
    const split = input.split("");
    return split.reduce((p, c) => (statementValues as string[]).includes(c) ? [...p, c as Statement] : p, [] as Statement[]);
}

export function getExpressions(input: string): Operator[] {
    const split = input.toLowerCase().split(" ");
    return split.reduce((p, c) => (operatorValues as string[]).includes(c) 
        ? [...p, c as Operator] 
        : p, 
        [] as Operator[]
    )
}

function selectWhichTag(operator: Operator): Tag {
    return operator === "|"
    ? "or"
    : operator === "&"
        ? "and"
        : operator === "=>"
            ? "conditional"
            : "biconditional"
}

function joinOperators(splitted: string[]): string[] {
    return splitted.reduce((prev, cur, idx) => cur === ">"
        ? splitted[idx - 2] === "<"
            ? [...prev, splitted[idx - 2] + splitted[idx - 1] + cur]
            : [...prev, splitted[idx - 1] + cur]
        : (statementValues as string[]).includes(cur)
            ? [...prev, cur]
            : prev
        , [] as string[]);
}

type ExpectedVal = "Statement" | "Operator" | "Parantheses" | "=" | ">" | "~";

function valueIsExpected(value: Operator | string | Statement | undefined, expected: ExpectedVal[]): boolean {
    if(value === undefined) {
        return false;
    }
    if(expected.includes("~") && expected.includes("Statement")) {
        return (statementValues as string[]).includes(value) || value === "~";
    }
    if(expected.includes("Operator")) {
        const splitOperators = operatorValues.reduce((p, c) => [...p, ...c.split("")], [] as string[]);
        return splitOperators.includes(value);
    }
    if(expected.includes("Statement")) {
        return (statementValues as string[]).includes(value);
    }
    if(expected.includes("=")) {
        return value === "=";
    }
    return value === ">";
}

function makeExpression(left: Expression, right: Statement, {main, not}: Waiting): Expression {
    let rightNot: Expression = right;
    if(not) {
        rightNot = { value: right, _tag: "not"}
    }
    if(main === "|") {
        return { left, right: rightNot, _tag: "or"};
    }
    if(main === "&") {
        return { left, right: rightNot, _tag: "and"};
    }
    if(main === "=>") {
        return { left, right, _tag: "conditional"};
    }
    return { left, right, _tag: "biconditional"};
}

interface Waiting {
    main: string;
    not: boolean;
}

function makeWait(main: string, not: boolean = false): Waiting {
    return { main, not };
}

export function parseInput(input: string): Expression | null {
    const withoutSpaces = input.replaceAll(" ", "");
    if(withoutSpaces.length === 0) {
        return null;
    }
    const split = withoutSpaces.split("");

    let parsed: Expression | null = null;
    let waiting: Waiting = { main: "", not: false };
    let expectedValue: ExpectedVal[] = ["Statement", "~"];

    for(let idx = 0; idx < split.length; idx++) {
        const curVal = split[idx];
        if(!valueIsExpected(curVal, expectedValue)) {
            throw `Error: Unexpected value at ${idx}`;

        } else if(curVal === "=") {
            waiting = makeWait(waiting.main + curVal);
            expectedValue  = [">"];

        } else if(curVal === "<") {
            waiting = makeWait(curVal);
            expectedValue = ["="];

        } else if(curVal === ">") {
            waiting = makeWait(waiting.main + curVal);
            expectedValue = ["Statement", "~"];

        } else if(curVal === "&" || curVal === "|") {
            waiting = makeWait(curVal);
            expectedValue = ["Statement", "~"];

        } else if(curVal === "~") {
            waiting = makeWait(waiting.main, true);
            expectedValue = ["Statement"];

        } else if((statementValues as string[]).includes(curVal)) {
            parsed = parsed === null
            ? waiting.not
                ? { value: curVal, _tag: "not"} as Not
                : curVal as Statement
            : makeExpression(parsed, curVal as Statement, waiting);
            expectedValue = ["Operator"];
        }
    }
    return parsed;
}