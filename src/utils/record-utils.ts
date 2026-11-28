export function mapValues<V, J>(record: Record<string, V>, valueMapper: (value: V) => J) {
    return Object.keys(record).map(key => valueMapper(record[key]));
}
