import {Disc} from '../../disc';
import {Repository} from './repository';
import {MBID} from './types';
import {AGE_OF_KINGS_RELEASE_MBID, ReleaseRepository} from './release-repository';
import Track = Disc.Track;

export class RecordingRepository extends Repository<Track> {

    constructor(
        inputTypeTitle: string,
        private readonly releaseRepository: ReleaseRepository,
    ) {
        super(inputTypeTitle);
    }

    protected search(track: Track): MBID | undefined {
        const discMbid = this.getDiscMbid(track.disc);

        // TODO on pourrait se baser sur le numéros de piste, mais il faut que le nombre de pistes soit exactement celui attendu
        if (discMbid === AGE_OF_KINGS_RELEASE_MBID) {
            if (track.title) {
                const m = /Track (\d+)/i.exec(track.title);
                if (m) {
                    const trackNumber = Number(m[1]);
                    return [
                        '30145573-fe8a-425f-b76d-f50d3bf2dc8a',
                        '95ae8a53-c8b4-418f-b403-e89dd33a32e2',
                        '1524ad77-ed75-40eb-9bf7-e44459fc5b7a',
                        'ac9a1b86-625b-47f0-9d42-661af7c4fe67',
                        'c8486653-fb0d-4346-82a1-3c87802ae959',
                        '1a331922-ccb6-40b7-97c0-9c4bc7ea18aa',
                        '757d8371-94b0-4408-bfa7-fbb9f27a8772',
                        'ddbd5803-081e-48ff-bf59-cd743a58e68a',
                        '054c9522-f73e-4d7e-a6f6-75b0b84b3efb',
                        '08e92cc5-d98e-4b69-9031-bba09f72a27a',
                    ][trackNumber - 1];
                }
            }
        }

        return undefined;
    }

    protected getInputTitle(track: Track): string {
        return track.title;
    }

    protected computeHash(track: Track): string {
        return `${track.disc.id}:${track.number}`;
    }

    private getDiscMbid(disc: Disc): MBID | undefined {
        return this.releaseRepository.get(disc);
    }

}
