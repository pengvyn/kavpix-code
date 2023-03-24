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
        // checking if it's biconditional
        ? splitted[idx - 2] === "<"
            // yes? join the <, = and >
            ? [...prev, splitted[idx - 2] + splitted[idx - 1] + cur] 
            // no? just join = and >
            : [...prev, splitted[idx - 1] + cur]
        // not even a condition? do nothing
        : (statementValues as string[]).includes(cur)
            ? [...prev, cur]
            : prev
        , [] as string[]);
}

export function parseInput(input: string): Expression[] {
    const spaceless: string = input.replaceAll(" ", "");
    const splitted: string[] = joinOperators(spaceless.split(""));
    return splitted.reduce((expressions, cur, idx) => (operatorValues as string[]).includes(cur) 
            ? [...expressions, 
                {   left: expressions.length === 0 ? splitted[idx - 1] : expressions[expressions.length - 1], 
                    right: splitted[idx + 1], 
                    _tag: selectWhichTag(cur as Operator)
                } as Expression]
            : expressions
        , [] as Expression[] 
    )
}

// how should the parsing be doneeee
// adding parantheses first would help a LOT
// how should the parantheses be added
// there needs to be a way to find the logical expression symbols
// or should it just be using words like "or" and "and" instead of symbols?
// the if then can use => and if and only if can use <=> though

// or first it should execute the already existing parantheses, and then add parantheses to the new statement
// maybe splitting the 

// export function findParantheses(input: string): string[] {
//     const splitted = input.split("");
//     let paranExp: string[][] = [];
//     let shouldAddToList = false;
//     for(let i = 0; i < splitted.length; i++) {
//         if(shouldAddToList) {
//             if(splitted[i] === ")") {
//                 console.log("closed paran");
//                 shouldAddToList = false;
//             } else {
//                 const lastEl = paranExp[paranExp.length - 1];
//                 paranExp = [...paranExp.slice(paranExp.length - 1), [...(lastEl === undefined ? [] : lastEl), splitted[i]]];
//                 console.log(lastEl, splitted[i]);
//             }
//         } else {
//             if(splitted[i] === "(") {
//                 console.log("open paran")
//                 shouldAddToList = true;
//             }
//         }
//     }
//     console.log(paranExp)
//     return paranExp.map((thing) => thing.join(""));
// }

// find elements in parantheses:
// 1. loop which goes through a split version of the input string
// 2. if it finds open parantheses, it keeps adding the elements after that into a list
// 3. if it finds closed parantheses, it stops adding and goes through the rest of the list
// 4. if it finds an open parantheses while adding elements into a list, it stops adding into that sub-list and adds it into a different sub-list
// ^ this wouldn't work too well... when solving the expressions the parent parantheses will get solved first, but it can't
// maybe putting the parantheses inside parantheses in the start of the list might work. that way those would get solved first

///////////////----------------------------
// instead of a reduce for parsing, use for loop:
// there has to be 3 "parts": 
// 1. Parsed, everything that has already been parsed (if it was a reduce, this would be the previous value)
//    This should be in a "tree" format. like this:
//              And
//             /   \
//            A     Or
//                 /  \
//                B    C
//
//      The input for the tree above would look like this: A & B | C (left to right)
//
// 2. "Consumed". this is when the split list has found an operator, like | or &, 
//     but needs more information before putting it into the expression tree
//      (Note that a statement is an expression as well. If the statement A is found, 
//      it doesn't go into the consumed box but instead into the tree)
//
// 3. "Next expected". This will be to "predict" the next element based on the consumed part. 
//    For example, if the | or & operators are found, the next element has to be a statement. 
//    If, for example, < is found, the next element will be =, and the element after that will be >
//    If = is found, the next element should be >
//    (In the 2 examples above, the values go into consumed. like if it finds "=", it is put into the consumed box,
//     and once it finds >, that is put into the consumed box along with the = until the statement is found)
//    IF the next item isn't the expected value, an error should be given
// Output is an EXPRESSION !! it will be a "tree", basically expressions with expressions inside
// The return value for the tree above willll be:
// {
//  left: A
//  right: {
//      left: B
//      right: C
//      _tag: or    
//  }
//  _tag: and
// }

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
    console.log(left, right, main, not, "Make expression");
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

export function parseInput2(input: string): Expression | null {
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
            // console.log("notttttttttt asjdfhkjahldkjh")
            console.log("hii");
            waiting = makeWait(waiting.main, true);
            console.log(waiting);
            expectedValue = ["Statement"];

        } else if((statementValues as string[]).includes(curVal)) {
            console.log(waiting);
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