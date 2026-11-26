export type LocalComparator<T> = (o1: T, o2: T) => number;

type ComparisonFunction<T, R> = (o: T) => R;

// TODO documenter comment faire un tri pour ne pas prendre en compte les accents (parce que localComparing, ne le fait pas tout seul)
export const NFD_NORMALIZATION: ComparisonFunction<string, string> = (string) => string.normalize('NFD');

export function localComparing<T, R>(fieldNameOrFunction: string | ComparisonFunction<T, R>): LocalComparator<T> {
    if (typeof fieldNameOrFunction === 'string') {
        return localComparingFieldName(fieldNameOrFunction);
    }
    if (typeof fieldNameOrFunction === 'function') {
        return localComparingAfterFunction(fieldNameOrFunction);
    }
    throw new Error('Unexpected fieldNameOrFunction type ' + typeof fieldNameOrFunction);
}

function localComparingFieldName<T>(fieldName: string): LocalComparator<T> {
    return (o1, o2) => localCompare(o1[fieldName], o2[fieldName]);
}

function localComparingAfterFunction<T, R>(fn: ComparisonFunction<T, R>): LocalComparator<T> {
    return (o1, o2) => localCompare(fn(o1), fn(o2));
}

function localCompare<T>(o1: T, o2: T): number {
    if (o1 === null && o2 === null) {
        return 0;
    }
    if (o1 === null) {
        return 1;
    }
    if (o2 === null) {
        return -1;
    }
    const s1 = String(o1);
    const s2 = String(o2);
    return s1.localeCompare(s2);
}

// tslint:disable-next-line:no-any : hérité d'Angular
export type Comparator = (o1: any, o2: any) => boolean;

export function comparing(fieldName: string): Comparator {
    return (o1, o2) => {
        if (o1 === null || o2 === null) {
            return o1 === o2;
        }
        return o1[fieldName] === o2[fieldName];
    };
}
