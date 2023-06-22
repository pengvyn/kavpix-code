import { isEqual } from "lodash";
import { Add, Div, Evaluate, Expression, Leaf, makeLeaf, makeWaiting, Mul, Neg, Paran, ParanWait, ParsedWaitNext, ParseInp, Sub, Tag, ValLeaf, Variable, variables, VarLeaf, Waiting } from "../types";
import type { OrderOfOp } from "../tree-funcs";

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

type LeafExp = AddLeaf | SubLeaf | MulLeaf | DivLeaf | NegLeaf | Leaf<number>;

function makeNewVal(e: Expression<number>): Expression<number>[] {
    if(e._tag === "add" || e._tag === "sub") {
        return simplifyRecurse(removeParan(e));
    }
    if(e._tag === "neg") {
        return e.val._tag === "leaf"
            ? e.val.val._tag === "val" 
                ? [
                    {_tag: "leaf", val: {
                            _tag: "val", val: -1 * e.val.val.val
                        }
                    }
                ]
                : [e]
            : negateAll(makeNewVal(e.val));
    }
    if(e._tag === "mul" || e._tag === "div") {
        return simplifyRecurse(e);
    }
    return [e];
}

const findEqualNegExp = (list: Expression<number>[], cur: Expression<number>) => list.findIndex(
    (exp) => (exp._tag === "neg" && isEqual(exp.val, cur)) || (cur._tag === "neg" && isEqual(exp, cur.val))
);
function negateAll(exps: Expression<number>[]): Expression<number>[] {
    return exps.map(
        (exp) => exp._tag === "neg"
            ? exp.val
            : makeNumExp(exp, undefined, "neg") as Neg<number>
    );
}

export function simplifyRecurse(exp: Expression<number>): Expression<number>[] {
    // recursion:
    // it checks the left and right
    // if it's a leaf, it adds it into the list
    // if it's a neg, 
        // if the value is a number, it multiplies it by -1 and adds it to the list
        // if the value is a variable, it just adds the neg to the list
    // if it's add/sub, it does the recurse, and adds the values to the list
    // if it's none of those, it just returns the list ??

    // what
    // each recurse should return a new expression with the list as the root of the expression
    // when recursing, no need to give the list as input, just returns the expression list

    
    if(exp._tag === "mul" || exp._tag === "div") {
        const newLeft = makeNewVal(exp.left);
        const newRight = makeNewVal(exp.right);
        return [
            {
                _tag: exp._tag,
                left: addListToExp(newLeft),
                right: addListToExp(newRight)
            }
        ]
    }
    if(exp._tag === "neg" || exp._tag === "paran") {
        return simplifyRecurse(exp.val);
    }
    if(exp._tag !== "add" && exp._tag !== "sub") {
        return [exp];
    }

    // If the expression is add or subtract
    const left = exp.left;
    const right = exp.right;

    const newLeft = makeNewVal(left);
    const newRight = makeNewVal(
        exp._tag === "sub" 
            ? {_tag: "neg", val: right} 
            : right
    );

    const listed = [...newLeft, ...newRight];

    const nums = listed.filter((val) => val._tag === "leaf" && val.val._tag === "val") as {_tag: "leaf", val: {_tag: "val", val: number}}[];
    
    const notNums = listed.filter(
        (val) => 
            (val._tag === "leaf" && val.val._tag === "var") 
            || val._tag !== "leaf"
    );

    const varEvalled = notNums.reduce(
        (p, c) => findEqualNegExp(p, c) === -1
            ? [...p, c] 
            : [...p.slice(0, findEqualNegExp(p, c)), ...p.slice(findEqualNegExp(p, c) + 1)], 
        [] as Expression<number>[]
    )

    const added = nums.reduce((p, c) => p + c.val.val, 0);
    return [...(added === 0 ? [] : [makeLeaf(added)]), ...varEvalled];
}

export function addListToExp(list: Expression<number>[]): Expression<number> {
    if(list.length === 0) {
        return makeLeaf(0);
    }
    return list.reduce(
        (p, c) => c._tag === "neg"
            ? {_tag: "sub", left: p, right: c.val}
            : {_tag: "add", left: p, right: c},
    )
}

export function simplify(tree: Expression<number>): Expression<number> {
    const simplifyRecursed = simplifyRecurse(tree);
    return addListToExp(simplifyRecursed);
}

export function isFullyEvaluated<T>(exp: Expression<T>): boolean {
    if(exp._tag === "leaf" || exp._tag === "val" || exp._tag === "var") {
        return true;
    }
    if(exp._tag === "neg" && exp.val._tag === "leaf" && exp.val.val._tag === "val") {
        // ^ checking if the neg is for a number and not a var or exp
        return false;
    }
    if(exp._tag === "neg" || exp._tag === "paran") {
        const r = isFullyEvaluated(exp.val);
        return r;
    }
    const leftEvalled = isFullyEvaluated(exp.left);
    const rightEvalled = isFullyEvaluated(exp.right);
    if(!leftEvalled || !rightEvalled) {
        return false;
    }
    
    const isVar = (e: Expression<T>) => e._tag === "leaf" && e.val._tag === "var";

    // one of it (left or right) is either a variable OR not a leaf
    return ((isVar(exp.left) || isVar(exp.right)) && !isEqual(exp.left, exp.right)) || exp.left._tag !== "leaf" || exp.right._tag !== "leaf";

}

export function removeParan<T>(exp: Expression<T>): Expression<T> {
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

            const newLeft = leftIsParan && (left.val._tag === "add" || left.val._tag === "sub")
                ? left.val
                : left;
            const newRight = rightIsParan && (right.val._tag === "add" || right.val._tag === "sub")
            ? right.val
            : right;
            return {_tag: exp._tag, left: newLeft, right: newRight};
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

export const numOrder: OrderOfOp = [["leaf", "val", "var"], ["neg"], ["add", "sub"], ["mul", "div"], ["paran"]];

////NEW evaluateRecurse

export function cantBeEvaluatedFurther<T>(tree: Expression<T>): boolean {
    switch(tree._tag) {
        case "add":
        case "sub":
        case "mul":
        case "div":
            // both left and right can't be evaluated further
            // AND, left and right aren't BOTH values
            return (cantBeEvaluatedFurther(tree.left) && cantBeEvaluatedFurther(tree.right)) 
                && !(
                    (tree.left._tag === "leaf" && tree.left.val._tag === "val")
                    && (tree.right._tag === "leaf" && tree.right.val._tag === "val")
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

export function isReadyForEvaluation<T>(tree: Expression<T>): boolean {
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

export function evaluateRecurse<T>(
    expression: Expression<T>,
    evaluate: (t: Expression<T>) => Expression<T>
): Expression<T> {
    const tree = removeParan(expression);
    if(tree._tag === "leaf" || tree._tag === "var" || tree._tag === "val") {
        return tree;
    }
    if(isReadyForEvaluation(tree)) {
        return evaluate(tree);
    }

    if(tree._tag === "neg" || tree._tag === "paran") {
        const valueEvaluated = evaluateRecurse(tree.val, evaluate);
        return evaluate({_tag: tree._tag, val: valueEvaluated});
    }
    
    const leftEvaluated = evaluateRecurse(tree.left, evaluate);
    const rightEvaluated = evaluateRecurse(tree.right, evaluate);

    return evaluate({left: leftEvaluated, right: rightEvaluated, _tag: tree._tag});
}