import {Disc} from './disc';

export class Collection {
    public discIds: string[] = [];

    constructor(public name?: string) {

    }

    /**
     * Ajoute le ou les disques à cette collection
     * @param {Disc} discs
     */
    push(... discs: Disc[]) {
        this.discIds = discs.map(disc => disc.id);
    }
}

export default Collection;
