import type { Expression, Leaf, Neg, ValLeaf, VarLeaf, Add, Sub, Div, Paran } from "./types";

export function isLeaf<T>(exp: Expression<T>): exp is Leaf<T> {
    return exp._tag === "leaf";
}
export function isVar<T>(exp: Expression<T>): exp is VarLeaf {
    return exp._tag === "var";
}
export function isVal<T>(exp: Expression<T>): exp is ValLeaf<T> {
    return exp._tag === "val";
}
export function isParan<T>(exp: Expression<T>): exp is Paran<T> {
    return exp._tag === "paran";
}
export function isNeg<T>(exp: Expression<T>): exp is Neg<T> {
    return exp._tag === "neg";
}