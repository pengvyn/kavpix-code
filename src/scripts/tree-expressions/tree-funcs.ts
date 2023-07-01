import { isLeaf, isNeg, isParan, isVal, isVar } from "./is-exp-funcs";
import type {Add, Div, Evaluate, Expression, Leaf, Mul, Neg, Sub, Tag } from "./types";

export function evaluateTreeVar<T> (    
    branch: Expression<T>,
    evaluate: Evaluate<T>,
): Expression<T> {
    if(branch._tag === "leaf") {
        return branch.val;
    }
    if(branch._tag === "neg") {
        const valEvalled = evaluate(branch.val);
        const result = evaluate({_tag: "neg", val: valEvalled});
        return result;
    }
    if(branch._tag === "paran") {
        return evaluateTreeVar(branch.val, evaluate);
    }
    if(branch._tag === "val" || branch._tag === "var") {
        return branch;
    }
    
    const leftIsLeaf = branch.left._tag === "leaf";
    const rightIsLeaf = branch.right._tag === "leaf";
    
    const leftEval = leftIsLeaf ? branch.left : evaluateTreeVar(branch.left, evaluate);
    const rightEval = rightIsLeaf ? branch.right : evaluateTreeVar(branch.right, evaluate);
    return evaluate({_tag: branch._tag, left: leftEval, right: rightEval});
}

export interface BranchElement {
    name: string;
    key: string;
    parent: string | null;
}

export function listify<T>(
    tree: Expression<T>, 
    branch: Expression<T> = tree, 
    parent: string | null = null, 
    list: BranchElement[] = []
): BranchElement[] {
    const newKey = list.length === 0 ? "1" : `${JSON.parse(list[list.length - 1].key) + 1}`;
    const newVal = {name: branch._tag, key: newKey, parent};

    if(branch._tag === "var" || branch._tag === "val") {
        return list;
    }
    if(branch._tag === "leaf") {
        return [...list, {name: `${branch.val.val}`, key: newKey, parent}];
    }
    if(branch._tag === "paran" || branch._tag === "neg") {
        return listify(tree, branch.val, newKey, [...list, newVal]);
    }
    const left = listify(tree, branch.left, newKey, [...list, newVal]);
    const leftExtra = left.slice(list.length);

    const right = listify(tree, branch.right, newKey, [...list, ...leftExtra]);
    return right;
}


// ------ ORDER OF OPERATIONS ---------

export type OpAndPrecedence = {op: Tag, precedence: number};
export type OrderOfOp = OpAndPrecedence[];

function isOperatorHigher(operator: Tag, comparer: Tag, order: OrderOfOp): boolean {
    const operatorPrecedence = order[order.findIndex((oap) => oap.op === operator)].precedence;
    const comparerPrecedence = order[order.findIndex((oap) => oap.op === comparer)].precedence;

    const r =  operatorPrecedence > comparerPrecedence;
    return r;
}

type BiOperatorTag = "add" | "sub" | "mul" | "div";
type BiOperator<T> = Add<T> | Sub<T> | Div<T> | Mul<T>;

function precedenceLeft<T>(left: BiOperator<T>, right: Expression<T>, tag: BiOperatorTag): Expression<T> {
    const ll = left.left;
    const lr = left.right;

    const attached: Expression<T> = {
        _tag: tag,
        left: lr,
        right: right,
    }
    
    const r =  {
        _tag: left._tag,
        left: ll,
        right: attached,
    }

    return r
}
function precedenceRight<T>(left: Expression<T>, right: BiOperator<T>, tag: BiOperatorTag): Expression<T> {
    const rl = right.left;
    const rr = right.right;

    const attached: Expression<T> = {
        _tag: tag,
        left: left,
        right: rl,
    }
    
    return {
        _tag: right._tag,
        left: attached,
        right: rr,
    }
}
function precedenceBoth<T>(left: BiOperator<T>, right: BiOperator<T>, tag: BiOperatorTag): Expression<T> {
    const ll = left.left;
    const lr = left.right;
    const rl = right.left;
    const rr = right.right;

    const centerAttached = {
        _tag: tag,
        left: lr,
        right: rl,
    };

    const attached2 = {
        _tag: left._tag,
        left: ll,
        right: centerAttached,
    }
    return {
        _tag: right._tag,
        left: attached2,
        right: rr,
    }
}

function reArrangeBinaryOperator<T>(exp: BiOperator<T>, order: OrderOfOp): Expression<T> {
    const left = orderOfOperations(exp.left, order)
    const right = orderOfOperations(exp.right, order)

    const newExp: Expression<T> = {
        _tag: exp._tag,
        left: left,
        right: right,
    }
    
    const leftTooLow = isLeaf(left) || isVar(left) || isVal(left) || isParan(left) || isNeg(left);
    const rightTooLow = isLeaf(right) || isVar(right) || isVal(right) || isParan(right) || isNeg(right);
    
    if(leftTooLow && rightTooLow) {
        return newExp;
    }
    const leftLower = isOperatorHigher(exp._tag, left._tag, order);
    const rightLower = isOperatorHigher(exp._tag, right._tag, order);

    if(!leftLower && !rightLower) {
        return newExp;
    }

    if(leftLower && rightLower) {
        if(leftTooLow) {
            return precedenceRight(left, right as BiOperator<T>, exp._tag);
        }
        if(rightTooLow) {
            return precedenceLeft(left as BiOperator<T>, right, exp._tag);
        }
        return precedenceBoth(left as BiOperator<T>, right as BiOperator<T>, exp._tag);
    }
    if(leftLower) {
        if(leftTooLow) {
            return newExp;
        }
        return precedenceLeft(left, right, exp._tag);
    }
    if(rightLower) {
        if(rightTooLow) {
            return newExp;
        }
        return precedenceRight(left, right, exp._tag);
    }
    return newExp;
}

export function orderOfOperations<T>(exp: Expression<T>, order: OrderOfOp): Expression<T> {
    switch(exp._tag) {
        case "neg":
        case "paran":
            const newVal = orderOfOperations(exp.val, order);
            const result = {
                _tag: exp._tag,
                val: newVal
            }
            return result;
        case "add":
        case "sub":
        case "mul":
        case "div":
            return reArrangeBinaryOperator(exp, order);
        default:
            return exp;
    }
}

export function evaluateRecurse<T>(
    expression: Expression<T>,
    funcs: {
        evaluate: (t: Expression<T>) => Expression<T>,
        isReadyForEvaluation: (t: Expression<T>) => boolean,
        removeGroup: (t: Expression<T>) => Expression<T>
    }
): Expression<T> {
    const {evaluate, isReadyForEvaluation, removeGroup} = funcs;

    const tree = removeGroup(expression);

    if(tree._tag === "leaf" || tree._tag === "var" || tree._tag === "val") {
        return tree;
    }
    if(isReadyForEvaluation(tree)) {
        return evaluate(tree);
    }

    if(tree._tag === "neg" || tree._tag === "paran") {
        const valueEvaluated = evaluateRecurse(tree.val, funcs);
        return evaluate({_tag: tree._tag, val: valueEvaluated});
    }
    
    const leftEvaluated = evaluateRecurse(tree.left, funcs);
    const rightEvaluated = evaluateRecurse(tree.right, funcs);

    return evaluate({left: leftEvaluated, right: rightEvaluated, _tag: tree._tag});
}