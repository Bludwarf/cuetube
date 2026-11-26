import {Track} from './track';

/**
 * Différence avec la classe Disc créée en 2017 : on modélise un disque indépendamment de YouTube
 */
export class Disc {

    readonly tracks: Track[] = [];
    public performer: string;
    public date: string;

    constructor(
        public title: string,
    ) {
    }

    static suggestId(title: string): string {
        return this.normalizeId(title);
    }

    static normalizeId(id: string): string {
        return id.replace(/ +/g, '_');
    }

    [Symbol.iterator]() {
        return this.tracks[Symbol.iterator]();
    }

    getTrackByNumber(trackNumber: number): Track {
        const found = this.tracks[trackNumber - 1];
        if (!found) {
            throw new Error(`Piste #${trackNumber} introuvable dans le disque ${this.title}`);
        }
        return found;
    }

    newTrack(title: string): Track {
        const track = new Track(this, this.tracks.length + 1, title);
        this.tracks.push(track);
        return track;
    }

}
