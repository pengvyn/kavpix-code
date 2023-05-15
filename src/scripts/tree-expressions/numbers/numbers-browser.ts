import {evaluateRecurse, parseInput, reverseParse, simplify, simplifyRecurse } from "./numbers";
import type { Expression } from "../types";
import { evaluateTreeVar, listify } from "../tree-funcs";
import cytoscape, { BaseLayoutOptions } from "cytoscape";
import dagre from "cytoscape-dagre"
import { evaluateNumExp } from "./evaluate";

dagre(cytoscape);


interface CyNodeInp {
    data: {
        id: string
        label: string
    }
}
interface CyEdgeInp {
    data: {
        id: string
        source: string
        target: string
    }
}

function translateLabel(label: string): string {
    switch(label) {
        case "add":
            return "+";
        case "sub":
            return "-";
        case "mul":
            return "*";
        case "div":
            return "÷" // U+00F7
        case "paran":
            return "()";
        case "neg":
            return "-";
        default:
            return label;
    }
}

const f = document.querySelector(".form") as HTMLFormElement;

function callback(ev: SubmitEvent) {
    ev.preventDefault();
    const val = (document.getElementById("num-exp-inp") as HTMLInputElement).value;
    const tree = parseInput(val);

    if(tree === null) {
        return;
    }

    //---

    const evalled = evaluateRecurse(tree as Expression<number>, evaluateNumExp);
    const simplified = simplify(evalled);
    const listified = listify(simplified);

    
    const result = (document.getElementById("result") as HTMLElement);
    result.textContent = `${reverseParse(simplified)}`;

    // -------------- RESET DIV / DIAGRAM -----------------

    const dgdiv = document.getElementById("myDiagramDiv") as HTMLElement;
    const parent = dgdiv.parentElement;

    const fragment = new DocumentFragment();

    const newDiv = document.createElement("div");
    newDiv.id = dgdiv.id;
    fragment.append(newDiv);
    dgdiv.remove();
    parent?.append(fragment);


    // ----------- MAKE INPUT FOR CYTOSCAPE ----------


    // const nodes: {data: {id: string}}[] = listified.map((val) => {n: val.key});
    // console.log(listified.map((val) => {data: {id: val.key}}));
    
    function makeNode(key: string, label: string): CyNodeInp { 
        return {data: {id: key, label: translateLabel(label)} };
    };
    function makeEdge(key: string, parent: string): CyEdgeInp {
        return {data: {source: parent, target: key, id: parent + "-" + key}};
    }

    const nodes: CyNodeInp[] = listified.map((val) => makeNode(val.key, val.name));
    const edges: CyEdgeInp[] = listified.reduce((eds, val) => 
        val.parent === null
        ? eds
        : [...eds, makeEdge(val.key, val.parent)],
        [] as CyEdgeInp[]
    )


    // -------- CREATE DIAGRAM -------------

    const c = cytoscape({
        container: document.getElementById("myDiagramDiv"),
        elements: {
            nodes: nodes,
            edges: edges
        },
        style: [
            {
                selector: "node",
                style: {
                    "label": "data(label)",
                    "text-halign": "center",
                    "text-valign": "center",
                    "width": "max-content",

                    "border-color": "black",
                    "border-width": "2px",

                    "background-color": function(n) {
                        return ["()", "+", "-", "*", "/"].includes(n.data("label")) 
                            ? "orange"
                            : "#F5D60F"
                    },
                }
            },
            {
                selector: "edge",
                style: {
                    "line-color": "blue",
                    "opacity": 0.5
                }
            }
        ]
    })
    c.zoomingEnabled(false);

    

    c.layout({
        name: "dagre",
        rankDir: "TB",
        fit: true,

        animate: true,
        // fit: true,
        // directed: true,
        // animate: true,
    } as BaseLayoutOptions).run();

    c.resize()
    c.center()
}


export function startListening() {
    f.addEventListener("submit", (ev) => callback(ev));
}