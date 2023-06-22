import { isEqual } from "lodash";
import { Expression, Leaf, Neg, Paran, makeLeaf } from "../types";
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
        if(isEqual(left, right)) {
            return makeLeaf(0);
        }
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

function treeIsValueLeaf(tree: Expression<number>): tree is {_tag: "leaf", val: {_tag: "val", val: number}} {
    return tree._tag === "leaf" && tree.val._tag === "val";
};

export function evaluateNumExp(tree: Expression<number>): Expression<number> {
    switch(tree._tag) {
        case "neg":
            return treeIsValueLeaf(tree.val)
                ? neg(tree.val)
                : tree;
        case "add":
            return treeIsValueLeaf(tree.left) && treeIsValueLeaf(tree.right)
                ? add(tree.left, tree.right)
                : tree
        case "sub":
            return treeIsValueLeaf(tree.left) && treeIsValueLeaf(tree.right)
                ? sub(tree.left, tree.right)
                : tree
        case "div":
            return treeIsValueLeaf(tree.left) && treeIsValueLeaf(tree.right)
                ? div(tree.left, tree.right)
                : tree
        case "mul":
            return treeIsValueLeaf(tree.left) && treeIsValueLeaf(tree.right)
                ? mul(tree.left, tree.right)
                : tree
        case "paran":
            return {
                _tag: "paran",
                val: evaluateNumExp(tree.val)
            }
        default:
            return tree;
    }
}

export function evaluateNumExp2(exp: Expression<number>): Expression<number> | Leaf<number> {
    // if(exp._tag === "neg" || exp._tag === "paran") {
    //     return exp.val._tag === "leaf" ? exp.val : exp;
    // } else if(exp._tag === "leaf" || exp._tag === "var" || exp._tag === "val") {
    //     return exp;
    // } else if(exp.left._tag !== "leaf" || exp.right._tag !== "leaf") {
    //     return exp;
    // }
    if(
        ((exp._tag === "neg" || exp._tag === "paran") && exp.val._tag !== "leaf")
    ) {
        return exp;
    }
    if(
        (exp._tag === "div" || exp._tag === "mul" || exp._tag === "add" || exp._tag === "sub")
        && (exp.left._tag !== "leaf" || exp.right._tag !== "leaf")
    ) {
        return exp
    }
    switch(exp._tag) {
        case "leaf":
        case "var":
        case "val":
            return exp;

        case "add":
            return add(
                exp.left as Leaf<number>, 
                exp.right as Leaf<number>
            );
        case "sub":
            return sub(
                exp.left as Leaf<number>, 
                exp.right as Leaf<number>
            );
        case "mul":
            return mul(
                exp.left as Leaf<number>, 
                exp.right as Leaf<number>
            );
        case "div":
            return div(
                exp.left as Leaf<number>, 
                exp.right as Leaf<number>
            );

        case "neg":
            const val = (exp.val as Leaf<number>).val;            
            const result: Neg<number> | Leaf<number> = val._tag === "val" 
                ? {_tag: "leaf", val: {_tag: "val", val: val.val * -1}}
                : exp;
            return result;
        default:
            return exp;
    }
}