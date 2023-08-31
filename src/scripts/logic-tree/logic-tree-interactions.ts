import cytoscape, { BaseLayoutOptions } from "cytoscape";
import { evaluateGateRecurse } from "./evaluator";
import { gateToString } from "./gateToString";
import { listifyGate } from "./listifier";
import { defaultOrder, reOrderGates } from "./orderer";
import { parseGate } from "./parser";
import type { CytoscapeEdge, CytoscapeNode, Gate, GatePrecedence, VariableAndValue, VariablesValue } from "./types";
import dagre from "cytoscape-dagre";
import { Variable, _variables } from "../tree-expressions/types";
import { isEqual } from "lodash";

const form = document.getElementById("logic-gate-form");

export function gateListener() {
    form?.addEventListener("submit", (ev) => gateCallback(ev));
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

// ===== VARIABLES ======


export function variableListener() {
    document.getElementById("variables")?.addEventListener("input", (ev) => {
        ev.preventDefault();

        callFunctions();
    });
}

function variableValueIsAllowed(val: string | undefined): val is VariablesValue {
    return val === "0" || val === "1" || val === "T" || val === "F";
}

function getVariables(): VariableAndValue[] {
    const children = (document.getElementById("variables") as HTMLElement).children;

    return Array.from(children).map((n) => {
        const varName = n.querySelector("label")?.textContent;
        const val = n.querySelector("input")?.value;
        const isVarAllowed = variableValueIsAllowed(val);

        return {
            variable: varName as Variable,
            value: isVarAllowed ? val : undefined
        }
    })
}

function replaceVariables(str: string, variables: VariableAndValue[]): string {
    if(variables.length === 0) {
        return str;
    }

    return variables.reduce(
        (p, c) => c.value === undefined
            ? p
            : p.replace(c.variable, "" + c.value), 
        str
    )
}

function updateVariables(input: string) {
    const exp = input.split("");

    const cont = document.getElementById("variables") as HTMLDivElement;
    const children = Array.from(cont.children);
    const vars: Variable[] = children.map(
        (c) => (c.querySelector("label") as HTMLLabelElement).textContent as Variable
    );
    const newVars = exp.filter(
        (c) => ([..._variables] as string[]).includes(c) && !([...vars] as string[]).includes(c)
    )
    const singleInstanceVars = newVars.reduce((p, c) => p.includes(c) ? p : [...p, c], [] as string[]);

    const varsToBeRemoved: Variable[] = vars.filter((v) => !exp.includes(v));

    varsToBeRemoved.map((v) => {
        const inp = document.getElementById(`variable-${v}`);
        if(inp === null) {
            return;
        }
        inp.parentElement?.remove();
    })

    singleInstanceVars.map((v) => {
        const fragment = new DocumentFragment();
        const div = document.createElement("div");
        div.className = "variable";

        const label = document.createElement("label");
        label.textContent = v;
        div.appendChild(label);

        const inp = document.createElement("input");
        inp.type = "text";
        inp.id = `variable-${v}`;

        div.appendChild(inp);

        fragment.append(div);

        cont.appendChild(fragment);
    })
    
    if(newVars.length !== 0) {
        (document.querySelector(".variables-cont") as HTMLElement).className = "variables-cont";
    }
}

export function updateVariablesListener() {
    form?.addEventListener("input", (ev) => updateVariables((ev.target as HTMLInputElement).value));
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

    const inputStr = (document.getElementById("logic-gate-inp") as HTMLInputElement).value;
    const str = replaceVariables(inputStr, getVariables());
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

// ==== EXAMPLES ====

function exampleCallback(ev: Event) {
    const target = ev.target as HTMLElement | null;

    if(target === null || target.className !== "example") {
        return;
    }

    console.log(form);
    const inp = (document.getElementById("logic-gate-inp") as HTMLInputElement)
    console.log(inp);
    inp.value = target.textContent === null ? "" : target.textContent;
    // in reality this will never be null since it's an example i manually provide

    updateVariables(target.textContent === null ? "" : target.textContent);
    callFunctions();
}

export function exampleListener(cont: HTMLDivElement) {
    cont.addEventListener("click", (ev) => exampleCallback(ev));
}