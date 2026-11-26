export function mapToJson<V, J>(map: Map<string, V>, valueMapper: (value: V) => J) {
    const mappedValues = mapValues(map, valueMapper);
    return JSON.stringify(mappedValues, undefined, 4);
}

export function mapValues<V, J>(map: Map<string, V>, valueMapper: (value: V) => J) {
    const mappedValues: Record<string, J> = {};
    for (const [key, value] of map) {
        mappedValues[key] = valueMapper(value);
    }
    return mappedValues;
}
