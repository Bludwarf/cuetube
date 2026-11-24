/**
 * Écart-type
 */
export function calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) {
        // un seul point = pas de dispersion
        return 0;
    }

    // 1. Moyenne
    const mean = values.reduce((sum, r) => sum + r, 0) / values.length;

    // 2. Variance (moyenne des écarts au carré)
    const variance = values.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / values.length;

    // 3. Écart type = racine de la variance
    return Math.sqrt(variance);
}
