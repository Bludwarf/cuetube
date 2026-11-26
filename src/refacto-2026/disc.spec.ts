import {Disc} from './disc';
import {Track} from './track';

describe('Disc', () => {

    it('constructor', () => {
        const disc = new Disc('Minecraft');
        expect(disc).toBeDefined();
    });

    it('track iterator', () => {
        const disc = new Disc(`Minecraft`);
        const track1 = disc.newTrack(`Key`);
        const track2 = disc.newTrack(`Subwoofer Lullaby`);

        const tracks: Track[] = [];
        for (const track of disc) {
            tracks.push(track);
        }

        expect(tracks).toEqual([
            track1,
            track2,
        ]);
    });

    it('getTrackByNumber', () => {
        const disc = new Disc(`Minecraft`);
        const track1 = disc.newTrack(`Key`);
        const track2 = disc.newTrack(`Subwoofer Lullaby`);

        expect(disc.getTrackByNumber(1)).toBe(track1);
        expect(disc.getTrackByNumber(2)).toBe(track2);
    });

});
