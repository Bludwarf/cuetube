import {Repository} from './repository';
import {MusicBrainzTrackFilter} from '../track-filter/track-filter';

export class CollectionRepository extends Repository<MusicBrainzTrackFilter, string[]> {

    protected async search(filter: MusicBrainzTrackFilter): Promise<string[] | undefined> {
        // TODO democker https://beta.musicbrainz.org/collection/0f312d6c-56f6-4548-8e51-0a99a062a99f
        if (filter.mbid === CALME_COLLECTION_MBID) {
            return [
                '46e2adaf-158e-4bb0-bbb9-0f42347f5d4c', // Ripple Reef (Recovering)
                '30145573-fe8a-425f-b76d-f50d3bf2dc8a', // 	Shamburger
                '1524ad77-ed75-40eb-9bf7-e44459fc5b7a', // Drizzle
                'c8486653-fb0d-4346-82a1-3c87802ae959', // T Station
            ];
        }
        return undefined;
    }

    protected getInputTitle(filter: MusicBrainzTrackFilter): string {
        return filter.title;
    }

    protected computeHash(filter: MusicBrainzTrackFilter): string {
        return filter.mbid;
    }

}

export const CALME_COLLECTION_MBID = '0f312d6c-56f6-4548-8e51-0a99a062a99f';
