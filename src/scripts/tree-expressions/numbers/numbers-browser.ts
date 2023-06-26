import {isReadyForEvaluation, numOrder, parseInput, removeParan, reverseParse, simplify, simplifyRecurse } from "./numbers";
import { variables, type Expression } from "../types";
import { evaluateTreeVar, listify, orderOfOperations, evaluateRecurse } from "../tree-funcs";
import cytoscape, { BaseLayoutOptions } from "cytoscape";
import dagre from "cytoscape-dagre"
import { evaluateNumExp } from "./evaluate";

function isNodeOperator(n: cytoscape.NodeSingular): boolean {
    return ["( )", "+", "-", "\u00D7", "\u00F7"].includes(n.data("label"));
}
function isNodeVariable(n: cytoscape.NodeSingular): boolean {
    return variables.includes(n.data("label"));
}

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
            return "\u00D7";
        case "div":
            return "\u00F7"
        case "paran":
            return "( )";
        case "neg":
            return "-";
        default:
            return label;
    }
}

const f = document.querySelector("form") as HTMLFormElement;

function animateError() {
    const inp = f.querySelector("input");
    console.log(inp);
    
    const keyframes: Keyframe[] = [
        { 
            border: "2px solid #dd3333",
            transform: "translateX(0.3rem) scale(1.3)",
        },
        {
            border: "2px solid #dd3333",
            transform: "translateX(-0.3rem) scale(1)",
        },
        {
            border: "2px solid #dd3333",
            transform: "translateX(-0.3rem)",
        },
        {
            border: "2px solid #dd3333",
            transform: "translateX(0.1rem)",
        },
        {
            border: "2px solid #dd3333",
            transform: "translateX(-0.1rem)",
        },
        {
            border: "2px solid #dd3333",
            transform: "translateX(-0.1rem)",
        },
        {
            borderColor: "blue",
            borderOpacity: 1,
        }
    ]

    inp?.animate(keyframes, 300);
}

function submitCallback(ev: SubmitEvent) {
    ev.preventDefault();
    runExpressionFuncs((document.getElementById("num-exp-inp") as HTMLInputElement).value)
}

function exampleCallback(ev: MouseEvent) {
    const target = ev.target as HTMLDivElement;
    if(target.className === "examples") {
        return;
    }
    runExpressionFuncs(target.innerText);
    (document.getElementById("num-exp-inp") as HTMLInputElement).value = target.innerText;
}

function runExpressionFuncs(val: string) {
    let errored = false;

    try {
        parseInput(val);
    } catch(error) {
        errored = true;
    } finally {
        if(errored) {
            animateError();
            return;
        }
    }
    const tree = parseInput(val);
    if(tree === null) {
        return;
    }

    //---
    const orofop = orderOfOperations(tree, numOrder);
    const evalled = evaluateRecurse(
        orofop as Expression<number>, 
        {evaluate: evaluateNumExp, removeGroup: removeParan, isReadyForEvaluation: isReadyForEvaluation}
    );

    const simplified = simplify(evalled);

    const listified = listify(simplified);


    
    const result = (document.getElementById("result") as HTMLElement);
    result.textContent = `${reverseParse(simplified)}`;

    // -------------- RESET DIV / DIAGRAM -----------------

    const dgdiv = document.getElementById("myDiagramDiv") as HTMLElement;
    const parent = dgdiv.parentElement;

    console.log(parent);

    const fragment = new DocumentFragment();

    const newDiv = document.createElement("div");
    newDiv.id = dgdiv.id;
    fragment.append(newDiv);
    dgdiv.remove();
    parent?.append(fragment);

    console.log(fragment)

    // ----------- MAKE INPUT FOR CYTOSCAPE ----------


    // const nodes: {data: {id: string}}[] = listified.map((val) => {n: val.key});
    
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

                    // "border-color": function(n) {
                    //     return isNodeOperator(n)
                    //         ? "#1101dd"
                    //         : "#ffb2a1"
                    // },
                    "border-opacity": 0.5,
                    "border-width": "1px",
                    "border-color": "#220011",

                    "background-color": function(n) {
                        return isNodeOperator(n)
                            ? "#FFCEBE"
                            : isNodeVariable(n)
                                ? "#99FCFF"
                                : "#9EFFDF"
                    },
                    "shape": function(n) {
                        return isNodeOperator(n)
                            ? "ellipse"
                            : "round-octagon"
                    },
                }
            },
            {
                selector: "edge",
                style: {
                    // "line-color": "blue",
                    "opacity": 0.9,
                    "line-fill": "linear-gradient",
                    "line-gradient-stop-colors": ["#c8dce0", "orange", "#c8dce0"],
                    "line-gradient-stop-positions": [5, 100, 10]
                }
            }
        ]
    })
    c.zoomingEnabled(true);

    

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
    f.addEventListener("submit", (ev) => submitCallback(ev));
}

export function exampleClickListener(exampleCont: HTMLDivElement) {
    exampleCont.addEventListener("click", (ev) => exampleCallback(ev));
}