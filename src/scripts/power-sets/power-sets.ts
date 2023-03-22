export function getPowerSet(set: unknown[]): unknown[][] {
    let subsets: unknown[][] = [[]];
    let prevIter: unknown[][] = [[]];
    let newIter: unknown[][] = [];

    const includesFinishedElement = (idx: number, cur: unknown[]) => 
            set.slice(0, idx + 1)
            .findIndex(
                (el) => cur.includes(el)
            );

    for(let c = 1; c <= set.length; c++) {
        for(let idx = 0; idx < set.length; idx++) {
            const n = set[idx];
            newIter = [...newIter, ...prevIter.reduce(
                (iter, cur) => includesFinishedElement(idx, cur) !== -1 
                    ? iter 
                    : [...iter, [n, ...cur]], []
                )
            ] as unknown[][];
        }
        
        subsets = [...subsets, ...newIter];
        prevIter = newIter;
        newIter = [];
    }
    return subsets;
}

export function getPowerSetIterations(set: unknown[]): unknown[][][] {
    let iters: unknown[][][] = [[]];
    let prevIter: unknown[][] = [[]];
    let newIter: unknown[][] = [];

    const includesFinishedElement = (idx: number, cur: unknown[]) => 
            set.slice(0, idx + 1)
            .findIndex(
                (el) => cur.includes(el)
            );

    for(let c = 1; c <= set.length; c++) {
        for(let idx = 0; idx < set.length; idx++) {
            const n = set[idx];
            newIter = [...newIter, ...prevIter.reduce(
                (iter, cur) => includesFinishedElement(idx, cur) !== -1 
                    ? iter 
                    : [...iter, [n, ...cur]], []
                )
            ] as unknown[][];
        }
        
        iters = [...iters, newIter];
        prevIter = newIter;
        newIter = [];
    }
    return iters;
}