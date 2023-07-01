export interface Add<T> {
    left: Expression<T>;
    right: Expression<T>;
    _tag: "add";
}
export interface Sub<T> {
    left: Expression<T>;
    right: Expression<T>;
    _tag: "sub";
}
export interface Mul<T> {
    left: Expression<T>
    right: Expression<T>
    _tag: "mul"
}
export interface Div<T> {
    left: Expression<T>
    right: Expression<T>
    _tag: "div"
}
export interface Neg<T> {
    val: Expression<T>;
    _tag: "neg"
}
export interface Leaf<T> {
    val: VarLeaf | ValLeaf<T>
    _tag: "leaf"
}
export interface Paran<T> {
    val: Expression<T>
    _tag: "paran"
}
export interface VarLeaf {
    val: Variable
    _tag: "var"
}
export interface ValLeaf<T> {
    val: T
    _tag: "val"
}

export type Expression<T> = Add<T> | Sub<T> | Neg<T> | Mul<T> | Div<T> | Paran<T> | Leaf<T> | ValLeaf<T> | VarLeaf;

export interface LeafWithVar {
    _tag: "leaf",
    val: VarLeaf,
}
export interface LeafWithVal<T> {
    _tag: "leaf"
    val: ValLeaf<T>
}

export type Tag = Expression<unknown>["_tag"]

export const _variables = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"] as const;
export type Variable = typeof _variables[number];
export const variables: readonly Variable[] = _variables;

interface Paranned {
    exp: string
    _tag: "paranned"
}
interface NotParanned {
    exp: null;
    _tag: "not-paranned"
}
export type ParanWait = Paranned | NotParanned;

export interface Waiting<Operator> {
    operator: Operator | null;
    negate: boolean;
    paran: ParanWait;
}

// waiting structure:

export type ParseInp<T> = (input: string) => Expression<T> | null;
export type Evaluate<T> = (exp: Expression<T>) => Expression<T>;

export function makeWaiting<Operator> (
    operator: Operator | null = null, 
    negate: boolean | null = null,
    paran: ParanWait | null = null
    ): Waiting<Operator> {
        return {operator, negate: negate ? true : false, 
            paran: paran === null ? {_tag: "not-paranned", exp: null} : paran
        };
}

export interface ParsedWaitNext<T, O, NE> {
    parsed: Expression<T> | null;
    waiting: Waiting<O>;
    next: NE[];
}

export function makeLeafVal<T>(val: T | Variable): ValLeaf<T> | VarLeaf {
    return variables.includes(val as Variable)
        ? {_tag: "var", val: val as Variable} 
        : {_tag: "val", val: val as T};
}
export function makeLeaf<T>(val: T | Variable): Leaf<T> {
    return {
        _tag: "leaf",
        val: makeLeafVal(val)
    }
}