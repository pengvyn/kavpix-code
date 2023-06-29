import { findIndex, isEqual } from "lodash";
import { Add, Div, Evaluate, Expression, Leaf, makeLeaf, makeWaiting, Mul, Neg, Paran, ParanWait, ParsedWaitNext, ParseInp, Sub, Tag, ValLeaf, Variable, variables, VarLeaf, Waiting } from "../types";
import type { OpAndPrecedence, OrderOfOp } from "../tree-funcs";

export type NumberOperator = "+" | "*" | "-" | "/";
export const numberOperators: NumberOperator[] = ["+", "*", "-", "/"];
export type ExpectedNumVal = "neg" | "number" | "operator" | "paran"| "variable";

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

function makeNumExp(leftOrValue: Expression<number>, right: Expression<number> | null = null, tag: NumberOperator | "neg" | "paran"): Expression<number> {
    if(right === null && !(["neg", "paran"].includes(tag))) {
        throw "Error: Operator is null";
    }
    let _tag: "add" | "sub" | "mul" | "div" | "neg" | "paran";
    let noRight: boolean = false;
    switch(tag) {
        case "+":
            _tag = "add";
            break;
        case "-":
            _tag = "sub";
            break;
        case "*":
            _tag = "mul";
            break;
        case "/":
            _tag = "div";
            break;
        case "neg":
            noRight = true;
            _tag = "neg";
            break;
        case "paran":
            noRight = true;
            _tag = "paran";
            break;
        default:
            throw "Error: Unexpected operator";
    }
    return noRight 
        ? {val: leftOrValue, _tag: tag} as Expression<number>
        : {left: leftOrValue, right: right as Expression<number>, _tag} as Expression<number>;
}

const oneDigitNums = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

export function isExpected(value: string, expected: ExpectedNumVal[]): boolean {
    if(value === "-") {
        return expected.includes("neg") || expected.includes("operator");
    }
    if((numberOperators as string[]).includes(value)) {
        return expected.includes("operator");
    }
    if((variables as string[]).includes(value)) {
        return expected.includes("variable");
    }
    if(value.split("").every((n) => oneDigitNums.includes(n))) {
        return expected.includes("number");
    }
    if(value === "(" || value === ")") {
        return expected.includes("paran");
    }
    return false;
}

// ------------- VALUE IS ____ FUNCS ----------

export function valueIsOperator(
    value: NumberOperator, 
    parsed: Expression<number>, 
    waiting: Waiting<NumberOperator>
    ): ParsedWaitNext<number, NumberOperator, ExpectedNumVal> {
        const newWaiting: Waiting<NumberOperator> = {...waiting, operator: value};
        const nextExp: ExpectedNumVal[] = ["neg", "number", "paran", "variable"];
        return {parsed, waiting: newWaiting, next: nextExp};
}
export function valueIsNumber(
    value: number, 
    parsed: Expression<number> | null, 
    waiting: Waiting<NumberOperator>
    ): ParsedWaitNext<number, NumberOperator, ExpectedNumVal> {
        const newBranch: Expression<number> = waiting.negate 
        ? makeNumExp(makeLeaf(value), null, "neg")
        : makeLeaf(value);
        const newParsed: Expression<number> = parsed === null
        ? newBranch
        : makeNumExp(parsed, newBranch, waiting.operator as NumberOperator);
        const nextExp: ExpectedNumVal[] = ["operator", "paran"];
        const newWaiting: Waiting<NumberOperator> = makeWaiting();
        return {parsed: newParsed, next: nextExp, waiting: newWaiting};
}
export function valueIsNegate(
    parsed: Expression<number> | null, 
    waiting: Waiting<NumberOperator>
    ): ParsedWaitNext<number, NumberOperator, ExpectedNumVal> {
        const newWaiting: Waiting<NumberOperator> = {...waiting, negate: true};
        const nextExp: ExpectedNumVal[] = ["number", "paran", "variable"];
        return {parsed, waiting: newWaiting, next: nextExp};
}

export function unclosedParan(exp: string): boolean {
    const splitted = exp.split("");
    const opens: number = splitted.reduce((p, c) => c === "(" ? p + 1 : p, 0);
    const closeds: number = splitted.reduce((p, c) => c === ")" ? p + 1 : p, 0);
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
        next: ["neg", "number", "paran", "variable"]
    }
}
export function closedParan(
    parsed: Expression<number> | null, 
    waiting: Waiting<NumberOperator>
): ParsedWaitNext<number, NumberOperator, ExpectedNumVal> {
    const paran = waiting.paran;

    if(paran._tag === "not-paranned") {
        throw "Error: No opening parantheses";
    }
    if(paran.exp === null || paran.exp === "") {
        throw "Error: No expression in parantheses";
    }
    if(parsed !== null && waiting.operator === null) {
        throw "Error: Operator missing";
    }
    if(unclosedParan(paran.exp)) {
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
        next: ["neg", "number", "paran", "operator", "variable"]
    };
}
export function valueIsOrInParan(
    parsed: Expression<number> | null,
    waiting: Waiting<NumberOperator>,
    value: string
): ParsedWaitNext<number, NumberOperator, ExpectedNumVal> {
    let PWN: ParsedWaitNext<number, NumberOperator, ExpectedNumVal>;

    if(value === ")") {
        PWN = closedParan(parsed, waiting);
    } else if(waiting.paran._tag === "paranned") {
        PWN = inParan(parsed, waiting, value);
    } else {
        PWN = openParan(parsed, waiting);
    }

    return PWN;
}

export function valueIsVar(
    parsed: Expression<number> | null,
    waiting: Waiting<NumberOperator>,
    value: Variable,
): ParsedWaitNext<number, NumberOperator, ExpectedNumVal> {
    const valExp: Leaf<number> = {
        _tag: "leaf",
        val: {
            _tag: "var",
            val: value
        }
    }

    const negd: Expression<number> = waiting.negate 
        ? makeNumExp(valExp, null, "neg")
        : valExp;

        const newParsed = waiting.operator === null
        ? negd
        : makeNumExp(parsed as Expression<number>, negd, waiting.operator);

        const newWaiting = makeWaiting<NumberOperator>();
    const next: ExpectedNumVal[] = ["operator", "paran"];
    return {
        parsed: newParsed,
        waiting: newWaiting,
        next
    }
}
// --------------== variables ==-------------------

// ----------

export function parseInput(input: string): Expression<number> | null {
    const listed = joinSimilars(input.replaceAll(" ", "").split(""), "1234567890".split(""));

    let parsed: Expression<number> | null = null;
    let waiting: Waiting<NumberOperator> = makeWaiting()
    let nextExp: ExpectedNumVal[] = ["neg", "number", "paran", "variable"];

    for(let idx = 0; idx < listed.length; idx++) {
        const curVal: string = listed[idx];
        if(!isExpected(curVal, nextExp)) {
            throw "Error: Unexpected value";
        } else {
            const shouldCallParan = waiting.paran._tag === "paranned" || curVal === ")" || curVal === "(";

            const newStorage: ParsedWaitNext<number, NumberOperator, ExpectedNumVal> = 
            shouldCallParan 
            ? valueIsOrInParan(parsed, waiting, curVal)
            : curVal === "-" && (waiting.operator !== null || parsed === null)
                ? valueIsNegate(parsed, waiting)
                : (numberOperators as string[]).includes(curVal)
                    ? valueIsOperator(curVal as NumberOperator, parsed as Expression<number>, waiting)
                    : (variables as string[]).includes(curVal) 
                        ? valueIsVar(parsed, waiting, curVal as Variable)
                        : valueIsNumber(JSON.parse(curVal), parsed, waiting);
            
            parsed = newStorage.parsed;
            waiting = newStorage.waiting;
            nextExp = newStorage.next;
        }
    }
    return parsed;
}

export interface AddLeaf {
    left: Leaf<number>
    right: Leaf<number>
    _tag: "add"
}
export interface SubLeaf{
    left: Leaf<number>
    right: Leaf<number>
    _tag: "sub"
}
export interface MulLeaf {
    left: Leaf<number>
    right: Leaf<number>
    _tag: "mul"
}
export interface DivLeaf {
    left: Leaf<number>
    right: Leaf<number>
    _tag: "div"
}
export interface NegLeaf {
    val: Leaf<number>
    _tag: "neg"
}

// ------------------ SIMPLIFY -------------------

// simplify recurse

// makes a list of expressions, each to be added with each other, and returns the list.
// another function to add up the numbers
// another function to convert the list to an expression

// example: 1 + a + 2
// wanted result: a + 3

// Step 1: (recursion for left) 1 and a get added to a list each (one for numbers and one for variables)
// (right is just a leaf and can't be recursed)
// Step 2: 2 is added to the list for  numbers
// Step 3: 1 and 2 get added together to make 3
// Step 4: a and 3 combine to form a + 3

// No need for two functions. two recursions at the same time AND overlapping is way too messy
// Only one simplify function. it recurses with the left and right / val and returns an expression, not a list
// addSimplifiedNumbers and then convertListToExpression are called in each cycle.
// Theres no extra list shenanigans here as well

export function convertAddListToExpression(list: Expression<number>[]): Expression<number> {
    if(list.length === 0) {
        return makeLeaf(0);
    }
    return list.reduce(
        (p, c) => {
            if(c._tag === "neg") {
                return {
                    _tag: "sub",
                    left: p,
                    right: c.val
                };
            }
            if(p._tag === "neg") {
                return {
                    _tag: "sub",
                    left: c,
                    right: p.val,
                }
            }
            return {
                _tag: "add",
                left: p,
                right: c
            }
        }
    );
}

export function addExpressionList(list: Expression<number>[]): Expression<number> {
    // filters out the numbers
    // filters out the variables
    // adds all the numbers
    // converts the new thing to an expression 
        // (basically maps each element and creates a new Add for each of them)

    const added: number = list.reduce(
        (p: number, c: Expression<number>) => {
            if(
                c._tag === "neg" && c.val._tag === "leaf" && c.val.val._tag === "val"
            ) {
                return p + c.val.val.val; 
                // neg --> leaf --> valLeaf --> actual number
            }

            if (
                c._tag === "leaf" && c.val._tag === "val"
            ) {
                return p + c.val.val 
                // leaf --> valLeaf --> actual number
            }

            return p;
        }, 0
    )
    const notNumbers = list.filter(
        (tree) => 
            !(tree._tag === "neg" && tree.val._tag === "leaf" && tree.val.val._tag === "val")
            && !(tree._tag === "leaf" && tree.val._tag === "val")
    )
    const variablesSimplified = notNumbers.reduce(
        (p: Expression<number>[], c: Expression<number>) => {
            if(c._tag === "neg") {
                const idx = p.findIndex((e) => isEqual(e, c.val));

                if(idx !== -1) {
                    const r = idx === 0 
                        ? p.slice(1)
                        : [...p.slice(0, idx), ...p.slice(idx + 1)];
                    return r;
                }
            }
            const negIdx = p.findIndex((e) => e._tag === "neg" && isEqual(e.val, c));

            if(negIdx !== -1) {
                return negIdx === 0
                    ? p.slice(1)
                    : [...p.slice(0, negIdx), ...p.slice(negIdx + 1)]
            }

            return [...p, c]
        }, []
    )
    return convertAddListToExpression([
        ...variablesSimplified.length === 0 ? [] : variablesSimplified, 
        ...added === 0 ? [] : [makeLeaf(added)]
    ]);
}

export function simplifyRecurse(tree: Expression<number>): Expression<number>[] {
    switch(tree._tag) {
        case "add":
        case "sub":
            const newLeft = simplifyRecurse(tree.left);
            const newRight = simplifyRecurse(tree._tag === "sub" ? {_tag: "neg", val: tree.right} : tree.right);

            return [...newLeft, ...newRight];
        case "mul":
        case "div":
            return [{
                _tag: tree._tag,
                left: addExpressionList(simplifyRecurse(tree.left)),
                right: addExpressionList(simplifyRecurse(tree.right))
            }];
        case "neg":
        case "paran":
            return [{
                _tag: tree._tag,
                val: addExpressionList(simplifyRecurse(tree.val))
            }];
        default:
            return [tree];
    }
}

export function simplify(tree: Expression<number>): Expression<number> {
    return addExpressionList(simplifyRecurse(tree));
}

// -------

export function removeParan(exp: Expression<number>): Expression<number> {
    switch(exp._tag) {
        case "add":
        case "sub":
            const left = exp.left;
            const right = exp.right;

            const leftIsParan = left._tag === "paran";
            const rightIsParan = right._tag === "paran";
            
            if(!leftIsParan && !rightIsParan) {
                return exp;
            }

            const isLeftRemovable = leftIsParan && (
                left.val._tag === "add"
                || left.val._tag === "sub"
                || left.val._tag === "leaf"
            )
            const isRightRemovable = rightIsParan && (
                right.val._tag === "add"
                || right.val._tag === "sub"
                || right.val._tag === "leaf"
            )

            const newLeft = isLeftRemovable
                ? left.val
                : left;
            const newRight = isRightRemovable
                ? right.val
                : right;
            return {_tag: exp._tag, left: newLeft, right: newRight};
        case "mul":
        case "div":
            const left2 = exp.left;
            const right2 = exp.right;


            const newLeft2: Expression<number> = left2._tag === "paran" && (
                left2.val._tag === "leaf" 
                || left2.val._tag === "neg"
            ) 
            ? left2.val 
            : left2;

            const newRight2: Expression<number> = right2._tag === "paran" && (
                right2.val._tag === "leaf" 
                || right2.val._tag === "neg"
            )
            ? right2.val
            : right2
            
            return {
                _tag: exp._tag,
                left: newLeft2,
                right: newRight2
            }
        case "paran":
            if(exp.val._tag === "leaf" || exp.val._tag === "neg") {
                return exp.val;
            }
            return exp;
        default:
            return exp;
    }
}

export function reverseParse(exp: Expression<number>): string {
    // does the same as evaluation, first evaluates left, then right
    // or evaluates val
    // if its a leaf, it returns the value
    // if it's an expression (like add/neg/div etc) 
    // it does the left, right/val and translates the tag and adds it together
    const revParBoth = (
        left: Expression<number>, 
        right: Expression<number>, 
        sy: NumberOperator
    ) => `${reverseParse(left)} ${sy} ${reverseParse(right)}`;

    switch(exp._tag) {
        case "val":
            return `${exp.val}`;
        case "var":
            return exp.val;
        case "leaf":
            return `${exp.val.val}`;
        case "add":
            return revParBoth(exp.left, exp.right, "+");
        case "sub":
            return revParBoth(exp.left, exp.right, "-");
        case "div":
            return revParBoth(exp.left, exp.right, "/");
        case "mul":
            return revParBoth(exp.left, exp.right, "*");
        case "neg":
            return "-" + reverseParse(exp.val);
        case "paran":
            return "(" + reverseParse(exp.val) + ")";
    }

    // if(exp._tag === "paran") {
    //     const paranVal = reverseParse(exp.val);
    //     return "(" + paranVal + ")";
    // }
    // if(exp._tag === "leaf") {
    //     return `${exp.val.val}`;
    // }
    // if(exp.)
    // switch(exp._tag) {
    //     case "add":
    //         return "+"
    // }
}

function makeOap(op: Tag, precedence: number): OpAndPrecedence {
    return {op, precedence}
}

// export const numOrder: OrderOfOp = [["leaf", "val", "var"], ["neg"], ["add", "sub"], ["mul", "div"], ["paran"]];
export const numOrder: OrderOfOp = [
    makeOap("leaf", 1),
    makeOap("var", 1),
    makeOap("val", 1),
    makeOap("neg", 2),
    makeOap("add", 3),
    makeOap("sub", 3),
    makeOap("mul", 4),
    makeOap("div", 4),
    makeOap("paran", 5)
];

////NEW evaluateRecurse

export function cantBeEvaluatedFurther(tree: Expression<number>): boolean {
    switch(tree._tag) {
        case "add":
        case "sub":
        case "mul":
        case "div":
            const left = tree.left;
            const right = tree.right;
            // both left and right can't be evaluated further
            // AND, left and right aren't BOTH values
            return (cantBeEvaluatedFurther(tree.left) && cantBeEvaluatedFurther(tree.right)) 
                && !(
                    (
                        (left._tag === "leaf" && left.val._tag === "val")
                        || (left._tag === "paran" && left.val._tag === "leaf")
                    )
                    && (
                        (right._tag === "leaf" && right.val._tag === "val")
                        || (right._tag === "paran" && right.val._tag === "leaf")
                    )
                    );
        case "paran":
            return cantBeEvaluatedFurther(tree.val);
        case "neg":
            // [neg].val cant be evaluated further
            // AND [neg].val isn't a Val(number)
            return cantBeEvaluatedFurther(tree.val) 
                && !(tree.val._tag === "leaf" && tree.val.val._tag === "val");
        default:
            return true;
    }
}

export function isReadyForEvaluation(tree: Expression<number>): boolean {
    switch(tree._tag) {
        case "neg":
        case "paran":
            return cantBeEvaluatedFurther(tree.val);
        case "add":
        case "sub":
        case "mul":
        case "div":
            return cantBeEvaluatedFurther(tree.left) && cantBeEvaluatedFurther(tree.right);
        default:
            return true;
    }
}