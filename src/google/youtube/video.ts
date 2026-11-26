import {getParameterByName} from '../../utils/utils';

// TODO vérifier ce qu'on peut déplacer de /src/yt-helper.ts vers ici

export class YouTubeVideo {

    disabledByYouTube: boolean;

    /** Fixé dès qu'on a trouvé la vidéo sur YouTube */
    duration: number;

    constructor(
        readonly id: string,
    ) {
    }

    static getVideoIdFromUrl(url: string): string {
        return getParameterByName('v', url);
    }

    get playable(): boolean {
        return this.disabledByYouTube !== undefined ? !this.disabledByYouTube : true;
    }

    get url(): URL {
        return new URL(`https://www.youtube.com/watch?v=${this.id}`);
    }

    /**
     * @see background
     */
    get icon(): URL {
        return this.getImgUrl('default');
    }

    /**
     * L'image de la vidéo en grande taille pour un fond d'écran
     * @return {string}
     * @see icon
     */
    get background(): URL {
        return this.getImgUrl('hqdefault');
    }

    private getImgUrl(name: string): URL {
        return new URL(`https://img.youtube.com/vi/${this.id}/${name}.jpg`);
    }

    toString() {
        return `v=${this.id}`;
    }

}

