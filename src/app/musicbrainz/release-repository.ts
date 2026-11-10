import {Disc} from '../../disc';
import {Repository} from './repository';
import {MBID} from './types';

export class ReleaseRepository extends Repository<Disc> {

    protected search(disc: Disc): MBID | undefined {
        // TODO mock : on renvoie la seule parution qui correspond au nombre de piste trouvé sur YouTube
        if (disc.title.match(/Age of Empires (II|2)/i)) {
            return AGE_OF_KINGS_RELEASE_MBID; // https://beta.musicbrainz.org/release/baf88928-1c13-449d-9ebd-669155869fc1
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

export const AGE_OF_KINGS_RELEASE_MBID = 'baf88928-1c13-449d-9ebd-669155869fc1';
