import { isEqual } from "lodash";
import { Add, Div, Evaluate, Expression, Leaf, makeLeaf, makeWaiting, Mul, Neg, Paran, ParanWait, ParsedWaitNext, ParseInp, Sub, Tag, ValLeaf, Variable, variables, VarLeaf, Waiting } from "../types";

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
/*

10 + (2 + 3)

  add
 /   \
10    paran
         \
          add
         /   \
*/
// IF the previous value is an empty list (lenght is 0)
//      Add the current value
// elseIF the current value is a number:
//      IF the last element of the previous value is a number:
//          Add the last el of prev value to the current value and spread it into the previous value list
//      else
//          Add the current value
// else
//      Add the current value

function makeNumExp(leftOrValue: Expression<number>, right: Expression<number> | null = null, operator: NumberOperator | "neg" | "paran"): Expression<number> {
    if(right === null && !(["neg", "paran"].includes(operator))) {
        throw "Error: Operator is null";
    }
    let tag: "add" | "sub" | "mul" | "div" | "neg" | "paran";
    let noRight: boolean = false;
    switch(operator) {
        case "+":
            tag = "add";
            break;
        case "-":
            tag = "sub";
            break;
        case "*":
            tag = "mul";
            break;
        case "/":
            tag = "div";
            break;
        case "neg":
            noRight = true;
            tag = "neg";
            break;
        case "paran":
            noRight = true;
            tag = "paran";
            break;
        default:
            throw "Error: Unexpected operator";
    }
    return noRight 
        ? {val: leftOrValue, _tag: tag} as Expression<number>
        : {left: leftOrValue, right: right as Expression<number>, _tag: tag} as Expression<number>;
}

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
    if(value.split("").every((n) => "1234567890".split("").includes(n))) {
        return expected.includes("number");
    }
    if(value === "(" || value === ")") {
        return expected.includes("paran");
    }
    return false;
}

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
        const nextExp: ExpectedNumVal[] = ["operator"];
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
        ? valExp
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
            : curVal === "-" && waiting.operator !== null
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

interface AddLeaf {
    left: Leaf<number>
    right: Leaf<number>
    _tag: "add"
}
interface SubLeaf{
    left: Leaf<number>
    right: Leaf<number>
    _tag: "sub"
}
interface MulLeaf {
    left: Leaf<number>
    right: Leaf<number>
    _tag: "mul"
}
interface DivLeaf {
    left: Leaf<number>
    right: Leaf<number>
    _tag: "div"
}
interface NegLeaf {
    val: Leaf<number>
    _tag: "neg"
}

function add(left: Leaf<number>, right: Leaf<number>): AddLeaf | Leaf<number> {
    console.log(left, right);
    if(left.val._tag === "var" || right.val._tag === "var") {
        return {_tag: "add", left, right};
    }
    return {
        _tag: "leaf",
        val: {
            _tag: "val",
            val: left.val.val + right.val.val
        }
    }
}
function sub(left: Leaf<number>, right: Leaf<number>): SubLeaf | Leaf<number> {
    if(left.val._tag === "var" || right.val._tag === "var") {
        return {_tag: "sub", left, right};
    }
    return {
        _tag: "leaf",
        val: {
            _tag: "val",
            val: left.val.val - right.val.val
        }
    }
}
function mul(left: Leaf<number>, right: Leaf<number>): MulLeaf | Leaf<number> {
    if(left.val._tag === "var" || right.val._tag === "var") {
        return {_tag: "mul", left, right};
    }
    return {
        _tag: "leaf",
        val: {
            _tag: "val",
            val: left.val.val * right.val.val
        }
    }
}
function div(left: Leaf<number>, right: Leaf<number>): DivLeaf | Leaf<number> {
    if(left.val._tag === "var" || right.val._tag === "var") {
        return {_tag: "div", left, right};
    }
    return {
        _tag: "leaf",
        val: {
            _tag: "val",
            val: -1 * left.val.val / right.val.val
        }
    };
}
function neg(val: Leaf<number>): NegLeaf | Leaf<number> {
    if(val.val._tag === "var") {
        return {_tag: "neg", val};
    }
    return {
        _tag: "leaf",
        val: {
            _tag: "val",
            val: -1 * val.val.val
        }
    };
}

type LeafExp = AddLeaf | SubLeaf | MulLeaf | DivLeaf | NegLeaf | Leaf<number>;

export function evaluateNumExp(exp: Expression<number>): Expression<number> | Leaf<number> {
    if(exp._tag === "neg" || exp._tag === "paran") {
        return exp.val._tag === "leaf" ? exp.val : exp;
    } else if(exp._tag === "leaf" || exp._tag === "var" || exp._tag === "val") {
        return exp;
    } else if(exp.left._tag !== "leaf" || exp.right._tag !== "leaf") {
        return exp;
    }
    switch(exp._tag) {
        case "add":
            return add(exp.left, exp.right);
        case "sub":
            return sub(exp.left, exp.right);
        case "mul":
            return mul(exp.left, exp.right);
        case "div":
            return div(exp.left, exp.right);
        default:
            return exp;
    }
}

// there needs to be a simplify function 
// anything that isn't a variable is evaluated immediately, so those get reduced
// when there is a variable, it creates an expression with the evaluated value and the variable
// if the expression w/ a variable is add or sub, and the operation is add to the next value, it should re arrange it and evaluate that
// if the expression has a number on the right (and var on left), and there is an operation with the next value whihc is a number, it should do the op
/*

    mul
   /   \
 add    3
 / \
x   10

^ it should distribute the 3?

     add
    /   \
  add    10
 /   \
x     3

^ it should add the 3 and the 10, so the final result will be {left: "x", right: 13, _tag: "add"} (with the leaf though)

     add
    /   \
  add    10
 /   \
3     x

^ it should look at the two adds and then add everything that isn't a variable
how do i do that bsdfsdfhs

it can maybe keep track of all the adds and subtracts in a "counter" or something ??
what about division and multiplication ?

the add, sub, mul, etc, functions return the expression if a variable is there. the simplify func compresses it if possible

*/


// there should be 2 funcs, one evaluate and one simplify 
// the evaluate function does whatever it used to do, it evaluates what it can and leaves the variable expressions in place
// it calls the simplify function after each recurse

// simplify function:

/*
    if the expression is a leaf, var, or val the value should just be returned
    1. simplify left
    2. simplify right

    switch:
        left is add/sub
            func:
                performs as many operations as it can
        left is mul/div
            func: 
                same as above
        left is paran
            func:
                im not suree ... fsdnfs
        left is neg
            func:
                multiply with val if its a number, otherwise just return as is
        left is leaf/val/var
            func: return as it is
*/
export function simplifyAddRecurse(exp: Add<number>, branch: Add<number> | Sub<number> = exp, vals: Leaf<number>[] = []): Leaf<number>[] {
    let newVals: Leaf<number>[] = vals;
    switch(branch.left._tag) {
        case "add":
            newVals = [...newVals, ...simplifyAddRecurse(exp, branch.left, newVals)];
            break;
        case "sub":
            newVals = [...newVals, ...simplifyAddRecurse(exp, branch.left, newVals)];
            break;
    }

    return newVals;
}
export function simplifyAdd(exp: Add<number> | Sub<number>): Expression<number>[] {
    const left = exp.left;
    const right = exp.right;

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
    function isAcceptableExp(e: Expression<number>): boolean {
        const applicableTags: Tag[] = ["add", "sub", "leaf", "val", "var", "neg"];
        return applicableTags.includes(e._tag);
    }

    if(!isAcceptableExp(exp)) {
        return [exp];
    }

    function makeNewVal(e: Expression<number>): Expression<number>[] {
        if(e._tag === "add" || e._tag === "sub") {
            return simplifyAdd(e);
        }
        if(e._tag === "neg") {
            console.log("heyaiiaia")
            return e.val._tag === "leaf" && e.val.val._tag === "val"
                ? [
                    {_tag: "leaf", val: {
                            _tag: "val", val: -1 * e.val.val.val
                        }
                    }
                ]
                : [e];
        }
        return [e];
    }
    const newLeft = makeNewVal(left);
    const newRight = makeNewVal(exp._tag === "sub" ? {_tag: "neg", val: right} : right);
    const listed = [...newLeft, ...newRight];
    
    const nums = listed.filter((val) => val._tag === "leaf" && val.val._tag === "val") as {_tag: "leaf", val: {_tag: "val", val: number}}[];
    const notNums = listed.filter(
        (val) => 
            (val._tag === "leaf" && val.val._tag !== "val") 
            || val._tag !== "leaf"
    );
    
    const added = nums.reduce((p, c) => p + c.val.val, 0);
    return [makeLeaf(added), ...notNums];
}
export function simplify(exp: Expression<number>, evaluate: Function): Expression<number> {
    switch(exp._tag) {
        case "add":
            
        case "sub":
            
        case "mul":

        case "div":

        case "neg":

        case "paran":

        case "leaf":

        case "val":

        case "var":

    }
}

export function isFullyEvaluated(exp: Expression<number>): boolean {
    if(exp._tag === "leaf" || exp._tag === "val" || exp._tag === "var") {
        return true;
    }
    if(exp._tag === "neg" && exp.val._tag === "leaf" && exp.val.val._tag === "val") {
        // ^ checking if the neg is for a number and not a var or exp
        return false;
    }
    if(exp._tag === "neg" || exp._tag === "paran") {
        return isFullyEvaluated(exp.val) 
    }
    const leftEvalled = isFullyEvaluated(exp.left);
    const rightEvalled = isFullyEvaluated(exp.right);
    if(!leftEvalled || !rightEvalled) {
        return false;
    }
    
    const isVar = (e: Expression<number>) => e._tag === "leaf" && e.val._tag === "var";

    // one of it (left or right) is either a variable OR not a leaf
    return isVar(exp.left) || isVar(exp.right) || exp.left._tag !== "leaf" || exp.right._tag !== "leaf";

}

export function evaluateRecurse(exp: Expression<number>, evaluate: Function): Expression<number> {
    if(
        exp._tag === "leaf" 
        || exp._tag === "val" 
        || exp._tag === "var"
    ) {
        return exp;
    }
    if(exp._tag === "neg" || exp._tag === "paran") {
        const evValled = evaluateRecurse(exp.val, evaluate);
        const r = exp._tag === "neg" 
            ? evaluate({_tag: exp._tag, val: evValled} as Neg<number>)
            : evValled;
        return r
    }
    if(isFullyEvaluated(exp)) {
        return exp;
    }
    console.log(exp)
    const leftEvalled = evaluateRecurse(exp.left, evaluate);
    const rightEvalled = evaluateRecurse(exp.right, evaluate);
    const newExp: Expression<number> = {
        _tag: exp._tag,
        left: leftEvalled,
        right: rightEvalled,
    }
    const evalled = evaluate(newExp);
    return evalled;
}

// function translateTag(exp: Expression<number>): string {
//     switch(exp._tag) {
//         case "add":
//             return "+";
//         case "sub":
//             return "-";
//         case "neg":
//             return "-";
//         case "div":
//             return "/";
//         case "mul":
//             return "*";
//         case ""
//     }
// }

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