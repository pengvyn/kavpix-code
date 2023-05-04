import type { Expression, Leaf } from "../types";
import type { AddLeaf, DivLeaf, MulLeaf, NegLeaf, SubLeaf } from "./numbers";

export function add(left: Leaf<number>, right: Leaf<number>): AddLeaf | Leaf<number> {
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
export function sub(left: Leaf<number>, right: Leaf<number>): SubLeaf | Leaf<number> {
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
export function mul(left: Leaf<number>, right: Leaf<number>): MulLeaf | Leaf<number> {
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
export function div(left: Leaf<number>, right: Leaf<number>): DivLeaf | Leaf<number> {
    if(left.val._tag === "var" || right.val._tag === "var") {
        return {_tag: "div", left, right};
    }
    return {
        _tag: "leaf",
        val: {
            _tag: "val",
            val:  left.val.val / right.val.val
        }
    };
}
export function neg(val: Leaf<number>): NegLeaf | Leaf<number> {
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