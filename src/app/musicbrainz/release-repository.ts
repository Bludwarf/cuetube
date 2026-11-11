import {Repository} from './repository';
import {mbApi} from './api';
import {IRelease} from 'musicbrainz-api';

export class ReleaseRepository extends Repository<string, IRelease> {

    constructor() {
        super('Disque');
    }

    protected search(mbid: string): Promise<IRelease | undefined> {
        return mbApi.lookup('release', mbid, [
            'recordings',
        ]);
    }

    protected getInputTitle(mbid: string): string {
        return mbid;
    }

    protected computeHash(mbid: string): string {
        return mbid;
    }

}
