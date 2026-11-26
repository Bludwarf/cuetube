import {Disc} from './disc';

export class Track {
    constructor(
        readonly disc: Disc,
        readonly number: number,
        public title: string,
    ) {
    }

    toString() {
        return `${this.number}. ${this.title}`;
    }

}
