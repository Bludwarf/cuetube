/**
 * Fusionne deux listes triées, contenant potentiellement beaucoup d'éléments, avec remplacement d'élément, si besoin
 */
export function sortedMerge<T>(existingLines: T[], linesToAdd: T[], compareFn: (existingLine: T, lineToAdd: T) => number,
                               shouldBeReplaced: (existingLine: T, lineToAdd: T) => boolean): T[] {
    const remainingLinesToAdd = [...linesToAdd];
    const newLines: T[] = [];
    for (const existingLine of existingLines) {
        let skipExistingLine = false;
        for (const lineToAdd of [...remainingLinesToAdd]) {
            const comparison = compareFn(existingLine, lineToAdd);
            if (comparison > 0) {
                newLines.push(lineToAdd);
                remainingLinesToAdd.shift();
            } else if (comparison === 0) {
                if (shouldBeReplaced(existingLine, lineToAdd)) {
                    console.warn(`On remplace la ligne`, existingLine, `par`, lineToAdd);
                    newLines.push(lineToAdd);
                    skipExistingLine = true;
                }
                remainingLinesToAdd.shift();
            }
        }
        if (skipExistingLine) {
            continue;
        }
        newLines.push(existingLine);
    }
    newLines.push(...remainingLinesToAdd);
    return newLines;
}
