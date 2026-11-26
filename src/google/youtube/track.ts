import {ExternalTrack} from '../../refacto-2026/external-track';
import {YouTubeVideo} from './video';

export abstract class YouTubeTrack implements ExternalTrack {

    protected constructor(
        readonly video: YouTubeVideo,
    ) {
    }

    get icon(): URL {
        return this.video.icon;
    }
}

/**
 * Piste correspondant à une vidéo YouTube ne contenant qu'une seule piste / morceau
 */
export class SingleVideoTrack extends YouTubeTrack {

    constructor(
        video: YouTubeVideo,
    ) {
        super(video);
    }

    toString() {
        return this.video.toString();
    }
}

/**
 * Piste correspondant à une vidéo YouTube contenant un album entier, avec plusieurs pistes / morceaux
 */
export class AlbumVideoTrack extends YouTubeTrack {

    constructor(
        video: YouTubeVideo,
        readonly time: number,
    ) {
        super(video);
    }

    /**
     * @deprecated TODO ne semble plus marcher sur YouTube !?
     */
    get url(): URL {
        const url = new URL(this.video.url);
        url.searchParams.append('t', String(this.time));
        return url;
    }

    toString() {
        return this.video.toString() + `?t=${this.time}`;
    }
}
