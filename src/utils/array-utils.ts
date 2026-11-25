/**
 * Fusionne deux listes triées, avec remplacement d'élément si besoin.
 * Complexité O(n + m).
 */
export function sortedMerge<T>(
    existingLines: T[],
    linesToAdd: T[],
    compareFn: (a: T, b: T) => number,
    shouldBeReplaced: (existingLine: T, lineToAdd: T) => boolean
): T[] {
    // Étape 1 : dédupliquer les doublons internes à linesToAdd
    // (garde le "gagnant" selon shouldBeReplaced entre deux lignes consécutives de même clé)
    const dedupedLinesToAdd: T[] = [];
    for (const line of linesToAdd) {
        const last = dedupedLinesToAdd[dedupedLinesToAdd.length - 1];
        if (last && compareFn(last, line) === 0) {
            if (shouldBeReplaced(last, line)) {
                dedupedLinesToAdd[dedupedLinesToAdd.length - 1] = line;
            }
            // sinon on garde `last`, on jette `line`
        } else {
            dedupedLinesToAdd.push(line);
        }
    }

    // Étape 2 : fusion classique à deux pointeurs
    const result: T[] = [];
    let i = 0;
    let j = 0;

    while (i < existingLines.length && j < dedupedLinesToAdd.length) {
        const cmp = compareFn(existingLines[i], dedupedLinesToAdd[j]);

        if (cmp < 0) {
            result.push(existingLines[i]);
            i++;
        } else if (cmp > 0) {
            result.push(dedupedLinesToAdd[j]);
            j++;
        } else {
            // même clé : on choisit la ligne qui gagne
            if (shouldBeReplaced(existingLines[i], dedupedLinesToAdd[j])) {
                console.warn(`On remplace la ligne`, existingLines[i], `par`, dedupedLinesToAdd[j]);
                result.push(dedupedLinesToAdd[j]);
            } else {
                result.push(existingLines[i]);
            }
            i++;
            j++;
        }
    }

    while (i < existingLines.length) {
        result.push(existingLines[i++]);
    }
    while (j < dedupedLinesToAdd.length) {
        result.push(dedupedLinesToAdd[j++]);
    }

    return result;
}
