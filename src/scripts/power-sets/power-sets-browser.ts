import { getPowerSet, getPowerSetIterations } from "./power-sets";

function parseInput(inp: string): string[] {
    const splitted: string[] = inp.split(",");
    const trimmed: string[] = splitted.map((s) => s.trim());
    return trimmed;
}

export function convertSetToString(set: unknown[]): string {
    if (set.length === 0) {
        return "{}";
    }
    const r = `${set.reduce((p, c, idx) => idx === 0 ? `{${c}}` : `${p}, {${c}}`, "")}`;
    return r;
}

function convertSetsToStrings(sets: unknown[][]): string[] {
    return sets.map((set) => convertSetToString(set));
}

function showNewIter(iter: string, result: HTMLElement): Animation {
    const f: DocumentFragment = new DocumentFragment();
    const div = document.createElement("div");
    div.textContent = iter;
    f.append(div);
    result.appendChild(f);

    const keyframes = [{opacity: 0, fontSize: 0}, {opacity: 100}];
    const options = {duration: 400, easing: "ease-out", endDelay: 10};
    return div.animate(keyframes, options);
}

function showAllIters(iters: string[], result: HTMLElement, count: number = 0) {
    if(count === iters.length) {
        return;
    }
    const anim = showNewIter(iters[count], result);
    anim.onfinish = (ev) => {
        showAllIters(iters, result, count + 1);
    }
}

export function displayPS(ev: SubmitEvent) {
    ev.preventDefault();

    const inp: string = (document.getElementById("power-set-inp") as HTMLInputElement).value;
    const r = document.getElementById("result") as HTMLElement;

    r.replaceChildren("");

    const setted: string[] = parseInput(inp);
    const iters: unknown[][] = getPowerSetIterations(setted);
    const stringed: string[] = convertSetsToStrings(iters);

    showAllIters(stringed, r);
    
}