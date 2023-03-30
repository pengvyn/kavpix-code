export interface Add<T> {
    left: Expression<T>;
    right: Expression<T>;
    _tag: "add";
}
export interface Neg<T> {
    val: Expression<T>;
    _tag: "neg"
}
export interface Leaf<T> {
    val: T
    _tag: "leaf"
}

export interface Waiting<Operator> {
    operator: Operator | null;
    negate: boolean;
}

export type Expression<T> = Add<T> | Neg<T> | Leaf<T>;

export type ParseInp<T> = (input: string) => Expression<T> | null;
export type Evaluate<T, U> = (input: Expression<T>) => U;

export function makeWaiting<Operator> (
    operator: Operator | null = null, 
    negate: boolean | null = null
    ): Waiting<Operator> {
        return {operator, negate: negate ? true : false };
}

export interface ParsedWaitNext<T, O, NE> {
    parsed: Expression<T> | null;
    waiting: Waiting<O>;
    next: NE[];
}

export function makeLeaf<T>(leaf: T): Leaf<T> {
    return { val: leaf, _tag: "leaf" };
}