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

// function traverseRight<T>(root: Expression<T>)

// export function getBranchList<T>(tree: Expression<T>) {
//     return branchListRecurse<T>(tree);
// }

// ------ ORDER OF OPERATIONS ---------

export type OrderOfOp = Tag[][];
// ^ is a list of lists because of things that are of the same order
// for numbers, the list would be [[add, sub], [mul, div], [paran]]
function isOperatorHigher(operator: Tag, comparer: Tag, order: OrderOfOp): boolean {
    const operatorIdx = order.findIndex((op) => op.includes(operator));
    const comparerIdx = order.findIndex((op) => op.includes(comparer));
    return operatorIdx > comparerIdx;
}

function expIsMulOrDiv<T>(exp: Mul<T> | Div<T>, order: OrderOfOp): Expression<T> {

    // checks the left and right
    // if
    // 1 + 3 * 2 + 3 should become (1 * 2) + 3

    // check if left is lower than exp

    // check if right is lower than exp

    // if both, it needs to take the right of the left, and the left of the

    const left = orderOfOperations(exp.left, order) //as Add<T> | Sub<T> | Div<T> | Mul<T> | Leaf<T>;
    const right = orderOfOperations(exp.right, order) //as Add<T> | Sub<T> | Div<T> | Mul<T> | Leaf<T>;

    const leftLower = isOperatorHigher(exp._tag, left._tag, order);
    const rightLower = isOperatorHigher(exp._tag, right._tag, order);

    if(leftLower && rightLower) {
        const leftLeaf = isLeaf(left) || isVar(left) || isVal(left) || isParan(left) || isNeg(left);
        const rightLeaf = isLeaf(right) || isVar(right) || isVal(right) || isParan(right) || isNeg(right);
        if(leftLeaf && rightLeaf) {
            return exp;
        }
        if(!leftLeaf && rightLeaf) {
            const lr = left.right;
            const ll = left.left;

            return {
                _tag: left._tag,
                left: ll,
                right: {
                    _tag: exp._tag,
                    left: lr,
                    right,
                },
            }
        }
        if(leftLeaf && !rightLeaf) {
            const rr = right.right;
            const rl = right.left;

            return {
                _tag: right._tag,
                left: {
                    _tag: exp._tag,
                    left,
                    right: rl,
                },
                right: rr,
            }
        }
        if(!leftLeaf && !rightLeaf) {
            const ll = left.left;
            const lr = left.right;
            const rl = right.left;
            const rr = right.right;

            const newRL: Expression<T> = {
                _tag: exp._tag,
                left: lr,
                right: rl,
            }
            const newRight = {
                _tag: right._tag,
                left: newRL,
                right: rr,
            }
            return {
                _tag: left._tag,
                left: ll,
                right: newRight,
            }
        }
        
        // left or right is neg
        // left or right is add/sub
        // left or right is 
        
    }
    return exp;

}
function expIsNeg<T>(exp: Neg<T>, order: OrderOfOp): Neg<T> {
    return {
        _tag: "neg",
        val: orderOfOperations(exp.val, order)
    }
}
function expIsAddOrSub<T>(exp: Add<T> | Sub<T>, order: OrderOfOp): Expression<T> {
    const left = orderOfOperations(exp.left, order) as Add<T> | Sub<T> | Div<T> | Mul<T> | Leaf<T>;
    const right = orderOfOperations(exp.right, order) as Add<T> | Sub<T> | Div<T> | Mul<T> | Leaf<T>;

    const leftLower = isOperatorHigher(exp._tag, left._tag, order);
    const rightLower = isOperatorHigher(exp._tag, right._tag, order);

    if(leftLower && rightLower) {
        const leftLeaf =  left._tag === "leaf";
        const rightLeaf = right._tag === "leaf";
        if(leftLeaf && rightLeaf) {
            return exp;
        }
        if(!leftLeaf && rightLeaf) {
            const lr = left.right;
            const ll = left.left;

            return {
                _tag: left._tag,
                left: ll,
                right: {
                    _tag: exp._tag,
                    left: lr,
                    right,
                },
            }
        }
        if(leftLeaf && !rightLeaf) {
            const rr = right.right;
            const rl = right.left;

            return {
                _tag: right._tag,
                left: {
                    _tag: exp._tag,
                    left,
                    right: rl,
                },
                right: rr,
            }
        }
        if(!leftLeaf && !rightLeaf) {
            const ll = left.left;
            const lr = left.right;
            const rl = right.left;
            const rr = right.right;

            const newRL: Expression<T> = {
                _tag: exp._tag,
                left: lr,
                right: rl,
            }
            const newRight = {
                _tag: right._tag,
                left: newRL,
                right: rr,
            }
            return {
                _tag: left._tag,
                left: ll,
                right: newRight,
            }
        }
        
        // left or right is neg
        // left or right is add/sub
        // left or right is 
        
    }
    return exp;
}

export function orderOfOperations<T>(exp: Expression<T>, order: OrderOfOp): Expression<T> {
    switch(exp._tag) {
        case "mul":
        case "div":
            return expIsMulOrDiv(exp, order);
        case "neg":
            return expIsNeg(exp, order);
        case "add":
        case "sub":
            return {
                _tag: exp._tag,
                left: orderOfOperations(exp.left, order),
                right: orderOfOperations(exp.right, order)
            }
        default:
            return exp;
    }
}