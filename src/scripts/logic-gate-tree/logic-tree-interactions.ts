import cytoscape, { BaseLayoutOptions } from "cytoscape";
import { evaluateGateRecurse } from "./evaluator";
import { gateToString } from "./gateToString";
import { listifyGate } from "./listifier";
import { defaultOrder, reOrderGates } from "./orderer";
import { parseGate } from "./parser";
import type { CytoscapeEdge, CytoscapeNode, Gate } from "./types";
import dagre from "cytoscape-dagre";
import { _variables } from "../tree-expressions/types";

export function gateListener() {
    document.getElementById("logic-gate-form")?.addEventListener("submit", (ev) => gateCallback(ev));
}

function translateLabel(tag: string): string {
    switch(tag) {
        case "group":
            return "( )";
        default:
            return tag;
    }
}

function isNodeOperator(n: cytoscape.NodeSingular): boolean {
    return ["( )", "&", "|", "~", "~&", "~|", "#", "=>", "<=>"].includes(n.data("label"));
}
function isNodeVariable(n: cytoscape.NodeSingular): boolean {
    return _variables.includes(n.data("label"));
}

dagre(cytoscape);

function gateCallback(ev: SubmitEvent) {
    ev.preventDefault();

    const str = (document.getElementById("logic-gate-inp") as HTMLInputElement).value;
    const parsed = parseGate(str);

    if(parsed === null) {
        throw "Empty input!"
    }

    console.log(parsed);

    const ordered = reOrderGates(parsed, defaultOrder);
    const evalled = evaluateGateRecurse(ordered);
    console.log(evalled);

    // === TREEEEE ===

    const listified = listifyGate(evalled);

    function makeNode(key: string, label: string): CytoscapeNode { 
        return {data: {id: key, label: translateLabel(label)} };
    };
    function makeEdge(key: string, parent: string): CytoscapeEdge {
        return {data: {source: parent, target: key, id: parent + "-" + key}};
    }

    const nodes: CytoscapeNode[] = listified.map((val) => makeNode(val.key, val.name));
    console.log(listified)
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
        container: document.getElementById("tree"),
        elements: {
            nodes,
            edges,
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
}