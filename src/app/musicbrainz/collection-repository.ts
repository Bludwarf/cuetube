import {Repository} from './repository';
import {MusicBrainzTrackFilter} from '../track-filter/track-filter';
import {getAuthenticatedMbApi} from './api';

export class CollectionRepository extends Repository<MusicBrainzTrackFilter, string[]> {

    protected async search(filter: MusicBrainzTrackFilter): Promise<string[] | undefined> {
        const authenticatedMbApi = await getAuthenticatedMbApi();
        const collectionRecordings = await authenticatedMbApi.browse('recording', {collection: filter.mbid});
        return collectionRecordings.recordings.map(recording => recording.id);
    }

    protected getInputTitle(filter: MusicBrainzTrackFilter): string {
        return filter.title;
    }

    protected computeHash(filter: MusicBrainzTrackFilter): string {
        return filter.mbid;
    }

}

export const CALME_COLLECTION_MBID = '0f312d6c-56f6-4548-8e51-0a99a062a99f';
