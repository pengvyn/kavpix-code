import cytoscape, { BaseLayoutOptions } from "cytoscape";
import { evaluateGateRecurse } from "./evaluator";
import { gateToString } from "./gateToString";
import { listifyGate } from "./listifier";
import { defaultOrder, reOrderGates } from "./orderer";
import { parseGate } from "./parser";
import type { CytoscapeEdge, CytoscapeNode, Gate, GatePrecedence } from "./types";
import dagre from "cytoscape-dagre";
import { Variable, _variables } from "../tree-expressions/types";

export function gateListener() {
    document.getElementById("logic-gate-form")?.addEventListener("submit", (ev) => gateCallback(ev));
}

function translateLabel(tag: string): string {
    switch(tag) {
        case "group":
            return "( )";
        case "=>":
            return "⇒";
        case "<=>":
            return "⇔";
        case "~":
            return "¬";
        case "|":
            return "∥";
        case "!=":
            return "≢";
        default:
            return tag;
    }
}
function translateGatenameToSymbol(name: string): string {
    switch(name) {
        case "and":
            return "&";
        case "or":
            return "|";
        case "nand":
            return "~&";
        case "nor":
            return "~|";
        case "xor":
            return "!=";
        case "implies":
            return "=>";
        case "biconditional":
            return "<=>";
        default:
            return name;
    }
}

let order: GatePrecedence[] = defaultOrder;

function changeGatePrecedence(ev: Event, ids: {
    and: string, 
    or: string, 
    nand: string, 
    nor: string, 
    xor: string, 
    implies: string, 
    biconditional: string,
}) {
    console.log("CHANGE GATE PRECEDENCE", ids.and)
    ev.preventDefault();

    const andInp = document.getElementById(ids.and);
    const orInp = document.getElementById(ids.or);
    const nandInp = document.getElementById(ids.nand);
    const norInp = document.getElementById(ids.nor);
    const xorInp = document.getElementById(ids.xor);
    const impliesInp = document.getElementById(ids.implies);
    const biconInp = document.getElementById(ids.biconditional);

    const gatePrecedence = [andInp, orInp, nandInp, norInp, xorInp, impliesInp, biconInp].map(
        (gate) => {
            console.log(gate)
            return {
                name: translateGatenameToSymbol((gate as HTMLInputElement).id.replaceAll("order-", "")),
                precedence: JSON.parse((gate as HTMLInputElement).value ? (gate as HTMLInputElement).value : (gate as HTMLInputElement).placeholder),
            }
        }
    )

    const lowest = gatePrecedence.reduce((p, c) => c.precedence < p.precedence ? c : p).precedence;
    const highest = gatePrecedence.reduce((p, c) => c.precedence > p.precedence ? c : p).precedence;

    order = [
        {name: "group", precedence: highest + 1},
        {name: "~", precedence: highest + 1},
        ...gatePrecedence as GatePrecedence[],
        {name: "binary", precedence: lowest - 1},
        {name: "variable", precedence: lowest - 1},
        {name: "boolean", precedence: lowest - 1},
    ];

    callFunctions();
}

export function gatePrecedenceListener(form: HTMLFormElement, ids: {
    and: string, 
    or: string, 
    nand: string, 
    nor: string, 
    xor: string, 
    implies: string, 
    biconditional: string
}) {
    form.addEventListener("input", (ev) => changeGatePrecedence(ev, ids));
}

// ===== MAIN FUNCTION =====


function isNodeOperator(n: cytoscape.NodeSingular): boolean {
    return ["( )", "&", "|", "~", "~&", "~|", "!=", "=>", "<=>"].includes(n.data("label"));
}
function isNodeVariable(n: cytoscape.NodeSingular): boolean {
    return _variables.includes(n.data("label"));
}

dagre(cytoscape);

let curCy: cytoscape.Core | null = null;

function callFunctions() {

    const str = (document.getElementById("logic-gate-inp") as HTMLInputElement).value;
    const parsed = parseGate(str);

    if(parsed === null) {
        throw "Empty input!"
    }


    const ordered = reOrderGates(parsed, order);
    const evalled = evaluateGateRecurse(ordered);

    // ===== Reset tree =====


    const dgdiv = document.getElementById("myDiagramDiv") as HTMLElement;
    const parent = dgdiv.parentElement;

    const fragment = new DocumentFragment();

    const newDiv = document.createElement("div");
    newDiv.id = dgdiv.id;
    fragment.append(newDiv);
    dgdiv.remove();
    parent?.append(fragment);

    curCy?.destroy();
    curCy = null;

    // === TREEEEE ===

    const listified = listifyGate(evalled);

    function makeNode(key: string, label: string): CytoscapeNode { 
        return {data: {id: key, label: translateLabel(label)} };
    };
    function makeEdge(key: string, parent: string): CytoscapeEdge {
        return {data: {source: parent, target: key, id: parent + "-" + key}};
    }

    const nodes: CytoscapeNode[] = listified.map((val) => makeNode(val.key, val.name));
    const edges: CytoscapeEdge[] = listified.reduce((eds, val) => 
        val.parent === null
        ? eds
        : [...eds, makeEdge(val.key, val.parent)],
        [] as CytoscapeEdge[]
    )


    //

    const strung = gateToString(evalled);
    (document.getElementById("result") as HTMLElement).textContent = strung;

    const c = cytoscape({
        container: document.getElementById("myDiagramDiv"),
        elements: {
            nodes: nodes,
            edges: edges,
        },
        style: [
            {
                selector: "node",
                style: {
                    "label": "data(label)",
                    "text-halign": "center",
                    "text-valign": "center",

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
    } as BaseLayoutOptions).run();

    c.resize()
    c.center()

    curCy = c;
}

function gateCallback(ev: SubmitEvent) {
    ev.preventDefault();

    callFunctions();
}