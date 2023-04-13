import { evaluateNum, parseInput } from "./numbers";
import type { Expression } from "./types";
import { evaluateTree, listify } from "./tree-funcs";
// import { Diagram, Model, Node, Shape, TextBlock } from "gojs";
import * as go from "gojs";

const f = document.querySelector(".form") as HTMLFormElement;

function callback(ev: SubmitEvent) {
    ev.preventDefault();
    const val = (document.getElementById("num-exp-inp") as HTMLInputElement).value;
    const tree = parseInput(val);

    if(tree === null) {
        return;
    }

    //---

    const listified = listify(tree);

    const evalled = evaluateTree<number>(tree as Expression<number>, evaluateNum);
    
    const result = (document.getElementById("result") as HTMLElement);
    result.textContent = `${evalled.val}`;

    // -------------- RESET DIV / DIAGRAM -----------------

    const dgdiv = document.getElementById("myDiagramDiv") as HTMLElement;
    const parent = dgdiv.parentElement;

    const fragment = new DocumentFragment();

    const newDiv = document.createElement("div");
    newDiv.id = dgdiv.id;
    fragment.append(newDiv);
    dgdiv.remove();
    parent?.append(fragment);

// -------- CREATE DIAGRAM -------------

    let diagram =
        new go.Diagram("myDiagramDiv",
        {
            "undoManager.isEnabled": true,
            layout: new go.TreeLayout({ angle: 90, layerSpacing: 20 })
        });

    diagram.nodeTemplate =
        new go.Node("Horizontal", {background: "#33333377"})
            .add(new go.TextBlock(
                "[default text]",
                { margin: 10, stroke: "white", font: "bold"}
            ).bind("text", "name"));

    diagram.model = new go.TreeModel(
        listified
    )
}


export function startListening() {
    f.addEventListener("submit", (ev) => callback(ev));
}