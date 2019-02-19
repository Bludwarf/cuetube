import {Disc} from '../disc';
import {readFile} from '../TestUtils';

describe('CueParser', () => {

    it('should parse MusicBrainz Picard generated cuesheet', () => {
        const cueData = readFile('samples/MusicBrainz/cues/Norah Jones.cue');
        const cue = CueParser.parse(cueData, {
            autoCreateFile: true
        });
        expect(cue).not.toBeNull();
        expect(cue.files).not.toBeNull();
        expect(cue.files.length).toBe(1);
        const defaultFile = cue.files[0];
        expect(defaultFile).not.toBeNull();

        const cueTracks = defaultFile.tracks;
        expect(cueTracks).not.toBeNull();
        expect(cueTracks.length).toBe(14);

        // on ne doit retrouver que 3 remarques dans le disque
        const cueRems = cue.rem;
        expect(cueRems).not.toBeNull();
        expect(cueRems.length).toBe(3);
        expect(cueRems[0]).toBe('MUSICBRAINZ_ALBUM_ID 4c6f6712-1ca0-46c9-9484-f24bc1ef83f5');
        expect(cueRems[1]).toBe('MUSICBRAINZ_ALBUM_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9');
        expect(cueRems[2]).toBe('DATE 2013');

        // 2 remarques par piste
        const firstCueTrack = cueTracks[0];
        expect(firstCueTrack.rem[0]).toBe('MUSICBRAINZ_TRACK_ID 478382f6-9fb9-3eea-b29d-80e26985f733');
        expect(firstCueTrack.rem[1]).toBe('MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9');
        const lastCueTrack = cueTracks[13];
        expect(lastCueTrack.rem[0]).toBe('MUSICBRAINZ_TRACK_ID c6eeaa80-b0f7-387a-99c7-c4f95d1df190');
        expect(lastCueTrack.rem[1]).toBe('MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9');

        // le résultat est compatible avec Disc.js
        const disc = new Disc(cue);

        expect(disc).not.toBeNull();

        const tracks = disc.tracks;
        expect(tracks).not.toBeNull();
        expect(tracks.length).toBe(14);

        const firstTrack = tracks[0];
        expect(firstTrack.title).not.toBeNull();
        expect(firstTrack.title).toBe('Don\'t Know Why');

        const lastTrack = tracks[13];
        expect(lastTrack.title).not.toBeNull();
        expect(lastTrack.title).toBe('The Nearness of You');
    });

});
