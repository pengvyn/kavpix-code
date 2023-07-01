import type { Add, Expression, Sub } from "../types";

export function addOrSub(exp: Add<number> | Sub<number>, evaluate: Function): Expression<number> {
    const left = exp.left;
    const right = exp.right;

    const leftAddOrSub = left._tag === "add" || left._tag === "sub";
    const leftLeaf = left._tag === "leaf";
    const rightAddOrSub = right._tag === "add" || right._tag === "sub";
    const rightLeaf = right._tag === "leaf";
    if(leftAddOrSub) {
        if(rightLeaf) {
            
        }
    } else if(leftLeaf) {

    }
    return exp;
}