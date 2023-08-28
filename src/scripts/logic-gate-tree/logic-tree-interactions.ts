import { evaluateGateRecurse } from "./evaluator";
import { gateToString } from "./gateToString";
import { defaultOrder, reOrderGates } from "./orderer";
import { parseGate } from "./parser";

export function gateListener() {
    document.getElementById("logic-gate-form")?.addEventListener("submit", (ev) => gateCallback(ev));
}

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
    const strung = gateToString(evalled);

    (document.getElementById("result") as HTMLElement).textContent = strung;
}