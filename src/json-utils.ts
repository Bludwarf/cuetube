import * as _ from 'underscore';

export function cloneWithout<T>(object: T, fields: Array<keyof T>): T {
    const clone = _.extend({}, object);
    for (const field of fields) {
        delete clone[field];
    }
    return clone;
}
