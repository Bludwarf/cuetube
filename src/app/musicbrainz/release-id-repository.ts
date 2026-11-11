import {Disc} from '../../disc';
import {Repository} from './repository';
import {RelationListItem} from './types';
import {mbApi} from './api';

export class ReleaseIdRepository extends Repository<Disc, string> {

    constructor() {
        super('Disque');
    }

    protected async search(disc: Disc): Promise<string | undefined> {

        // TODO test pour retrouver https://beta.musicbrainz.org/release/7b0e54f9-db6e-4bf2-9028-8cac7961e61d
        const urlList = await mbApi.search('url', {
            query: `targettype:release AND ${disc.url}`,
            limit: 1,
        });
        console.debug(`urlList.count`, urlList.count);
        if (urlList.count === 1) { // TODO si != 1 ?
            const url = urlList.urls[0];
            const relationList = url['relation-list'] as RelationListItem[];
            const relations = relationList.flatMap(relationListItem => relationListItem.relations);
            const relationsWithRelease = relations.filter(relation => relation.release);
            console.debug(`relationsWithRelease.length`, relationsWithRelease.length);
            if (relationsWithRelease.length === 1) { // TODO si != 1 ?
                const relation = relationsWithRelease[0];
                const release = relation.release;
                console.debug(`release`, release);
                return release.id;
            }
        }

        // TODO mock : on renvoie la seule parution qui correspond au nombre de piste trouvé sur YouTube
        if (disc.title.match(/Age of Empires (II|2)/i)) {
            return 'baf88928-1c13-449d-9ebd-669155869fc1'; // https://beta.musicbrainz.org/release/baf88928-1c13-449d-9ebd-669155869fc1
        }

        return undefined;
    }

    protected getInputTitle(disc: Disc): string {
        return disc.title;
    }

    protected computeHash(disc: Disc): string {
        return disc.id;
    }

}
