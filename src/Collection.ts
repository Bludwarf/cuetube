import {Disc} from './disc';

export class Collection {
    public discIds: string[] = [];

    constructor(public name: string) {

    }

    /**
     * Ajoute le ou les disques à cette collection
     * @param {Disc} discsOrIds disc ou ids
     */
    push(... discsOrIds: (Disc|string)[]) {
        return discsOrIds.filter(discsOrId => !!discsOrId).map(discsOrId => {
            if (discsOrId instanceof Disc) {
                return this.pushDiscs(discsOrId)[0];
            } else {
                return this.pushDiscIds(discsOrId)[0];
            }
        });
    }

    /**
     * Ajoute le ou les disques à cette collection
     * @param {Disc} discs
     * @return ids des disques ajoutés
     */
    pushDiscs(... discs: Disc[]): string[] {
        return discs.map(disc => {
            this.discIds.push(disc.id)
            return disc.id;
        });
    }

    /**
     * Ajoute le ou les disques à cette collection
     * @param {string[]} discIds
     * @return ids ajoutés
     */
    pushDiscIds(... discIds: string[]): string[] {
        return discIds.map(discId => {
            this.discIds.push(discId)
            return discId;
        });
    }

    /**
     * Remplace cette collection par une nouvelle
     * @param {Collection} collection nouvelle collection
     */
    replaceWith(collection: Collection) {
        this.discIds = collection.discIds;
    }
}

export default Collection;
