import type {Evaluate, Expression, Leaf } from "./types";

export function evaluateTreeVar<T> (    
    branch: Expression<T>,
    evaluate: Evaluate<T>,
): Expression<T> {
    if(branch._tag === "leaf") {
        return branch.val;
    }
    if(branch._tag === "neg") {
        return evaluate(branch.val);
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