import type { Expression, Leaf } from "./types";


function branchListRecurse<T>(
    root: Expression<T>, 
    list: Expression<T>[] = [], 
    curBranch: Expression<T> = root) {
    if(curBranch._tag === "leaf") {
        console.log(list);
        return list;
    }
    let newBranch: Expression<T> = curBranch;
    if(curBranch._tag === "neg") {
        newBranch = curBranch.val;
    } else {
        newBranch = curBranch.left;
    }
    branchListRecurse(root, [...list, newBranch], newBranch);
}
export function traverseLeftMap<T>(root: Expression<T>, cb: Function) {
    let curVal = root;
    while(curVal._tag !== "leaf") {
        cb(curVal);
        curVal = curVal._tag === "neg" ? curVal.val : curVal.left;
    }
    cb(curVal);
}

export function evaluateTree<T>(
    tree: Expression<T>, 
    evaluate: Function, 
    branch: Expression<T> = tree): Leaf<T> {

    if(tree._tag === "leaf") {
        return tree;
    } else if(branch._tag === "neg") {
        return(evaluate(branch));
    } else if(branch._tag === "leaf") {
        return branch;
    }

    const leftIsLeaf = branch.left._tag === "leaf";
    const rightIsLeaf = branch.right._tag === "leaf";
    if(leftIsLeaf) {
        if(rightIsLeaf) {
            return(evaluate(branch));
        }
        const rightEval: Leaf<T> = evaluateTree(branch.right, evaluate);
        return evaluate({left: branch.left, right: rightEval, _tag: branch._tag});
    }

    const leftEval: Leaf<T> = evaluateTree(branch.left, evaluate);

    if(rightIsLeaf) {
        return evaluate({left: leftEval, right: branch.right, _tag: branch._tag});
    }
    const rightEval: Leaf<T> = evaluateTree(branch.right, evaluate);
    return evaluate({left: leftEval, right: rightEval, _tag: branch._tag});
}

// function traverseRight<T>(root: Expression<T>)

// export function getBranchList<T>(tree: Expression<T>) {
//     return branchListRecurse<T>(tree);
// }