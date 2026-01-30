import {Disc} from './disc';
import {discs} from './TestUtils';

const minecraftFile = discs.minecraft.files[0];
const minecraftTrack = minecraftFile.tracks[0];

// Données récupérées du player YouTube
minecraftFile.duration = 7613.001;

describe('Disc.Track', function () {

    const file = minecraftFile;
    const track = minecraftTrack;

    it('has properties of cuesheet.Track', function () {
        expect(track.number).toBe(1);
        expect(track.title).toBe('Key (Nuance 1)');

        // par défaut on a toujours un index
        expect(track.indexes).toEqual([{
            'number': 1,
            'time': {
                'min': 0,
                'sec': 0,
                'frame': 0
            }
        }]);
    });

    it('has index', function () {
        expect(track.index).toBe(0);
    });

    it('has file', function () {
        expect(track.file).toEqual(file);
    });

    it('has disc', function () {
        expect(track.disc).toEqual(discs.minecraft);
    });

    it('has startSeconds', function () {
        expect(track.startSeconds).toEqual(0);
        expect(file.tracks[1].startSeconds).toEqual(64); // 01:04
        expect(file.tracks[27].startSeconds).toEqual(111 * 60 + 48); // 1:51:48 -> 6708 s.
    });

    it('has next', function () {
        expect(file.tracks[0].next).toEqual(file.tracks[1]);
        // expect(file.tracks[26].next).toEqual(file.tracks[1]);
    });

    it('has endSeconds', function () {
        expect(track.endSeconds).toEqual(64);
        expect(file.tracks[27].endSeconds).toEqual(7613.001);
    });

    // Disque dont les pistes ne sont pas ordonnés par startSeconds
    it('has endSeconds even on tracks non ordered', function () {
        const disc = discs['samples/LeGrandBleu-cd2-unordered.json'];
        const track7 = disc.tracks[6];
        const nextInTime = disc.tracks[2]; // next = Watergames

        // verif de la propriété indexInTime
        expect(track7.indexInTime).toBe(12);
        expect(nextInTime.indexInTime).toBe(13);

        expect(track7.endSeconds).toEqual(nextInTime.startSeconds);
    });

    // On dirait que ce test peut provoquer une impression de page (peut-être quand il échoue, ou quand on utilise expect(file).toBe(file))
    it('remove', () => {
        const disc = new Disc();
        const file1 = disc.newFile();
        file1.newTrack();
        file1.newTrack();

        const file2 = disc.newFile();
        const track3 = file2.newTrack();
        const track4 = file2.newTrack();
        const track5 = file2.newTrack();

        expect(disc.tracks.length).toBe(5);
        expect(disc.tracks[3]).toEqual(track4);
        expect(disc.tracks[3].number).toBe(4);
        expect(disc.tracks[4]).toEqual(track5);
        expect(disc.tracks[4].number).toBe(5);

        track4.remove();

        expect(disc.tracks.length).toBe(4);
        expect(disc.tracks[2]).toEqual(track3);
        expect(disc.tracks[2].number).toBe(3);
        expect(disc.tracks[3]).toEqual(track5);
        expect(disc.tracks[3].number).toBe(4);

        // Suppression jusqu'à supprimer file2

        track3.remove();
        track5.remove();

        expect(disc.tracks.length).toBe(2);
        expect(disc.files.length).toBe(1);
        expect(disc.files[0]).toEqual(file1);

    });

});

describe('Disc.File', function () {

    const file = minecraftFile;

    it('has cuesheetFile', function () {
        expect(file.cuesheetFile).not.toBeNull();
    });

    it('has properties of cuesheet.File', function () {
        expect(minecraftFile.name).toBe('https://www.youtube.com/watch?v=Dg0IjOzopYU');
        expect(file.type).toBe('MP3');
    });

    it('has tracks', function () {
        expect(file.tracks).not.toBeNull();
        expect(file.tracks.length).toBe(discs.minecraft.tracks.length);
        expect(file.tracks[0]).toEqual(discs.minecraft.tracks[0]); // TODO pourquoi toBe => false ?
        expect(file.tracks[file.tracks.length - 1]).toEqual(discs.minecraft.tracks[file.tracks.length - 1]); // TODO pourquoi toBe => false ?
    });

    it('has videoId', function () {
        expect(file.videoId).toBe('Dg0IjOzopYU');
    });

    it('has index', function () {
        expect(file.index).toBe(0);
    });

    it('should find track at time in multitrack video', function () {
        const file0 = discs.minecraft.files[0];
        let track;

        // Par défaut => 1ère
        track = file0.getTrackAt(0);
        expect(track).not.toBeNull();
        expect(track.title).toBe('Key (Nuance 1)');

        track = file0.getTrackAt(3600 + 14 * 60 + 2);
        expect(track).not.toBeNull();
        expect(track.title).toBe('Taswell (Creative 6)');

        // Par défaut => dernière
        track = file0.getTrackAt(3 * 3600);
        expect(track).not.toBeNull();
        expect(track.title).toBe('End');
    });

    it('should find track at time in multi video disc', function () {
        const file0 = discs.age2.files[0];
        let track, trackBis;

        // Par défaut => 1ère
        track = file0.getTrackAt(0);
        expect(track).not.toBeNull();
        expect(track.title).toBe('Main Theme');

        trackBis = file0.getTrackAt(50);
        expect(trackBis).toBe(track);

        // Par défaut => dernière
        trackBis = file0.getTrackAt(3 * 3600);
        expect(trackBis).toBe(track);
    });

    it('newTrack in previous file', () => {
        const disc = new Disc();

        const file1 = disc.newFile();
        const file2 = disc.newFile();

        const track2 = file2.newTrack();
        const track1 = file1.newTrack();

        expect(track1.number).toBe(1);
        expect(track2.number).toBe(2);
        expect(track1.file).toEqual(file1);
        expect(track2.file).toEqual(file2);
        expect(file1.cuesheetFile.tracks).toEqual([track1.cuesheetTrack]);
        expect(file2.cuesheetFile.tracks).toEqual([track2.cuesheetTrack]);
    });

    it('remove', () => {
        const disc = new Disc();
        const file1 = disc.newFile();
        // noinspection JSUnusedLocalSymbols
        const track1 = file1.newTrack();
        file1.newTrack();

        const file2 = disc.newFile();
        file2.newTrack();
        const track4 = file2.newTrack();

        const file3 = disc.newFile();
        const track5 = file3.newTrack();
        const track6 = file3.newTrack();

        expect(disc.tracks.length).toBe(6);
        expect(disc.tracks[3]).toBe(track4);
        expect(disc.tracks[3].number).toBe(4);
        expect(disc.tracks[4]).toBe(track5);
        expect(disc.tracks[4].number).toBe(5);

        file2.remove();

        expect(disc.tracks.length).toBe(4);
        expect(disc.tracks[2]).toBe(track5);
        expect(disc.tracks[2].number).toBe(3);
        expect(disc.tracks[3]).toBe(track6);
        expect(disc.tracks[3].number).toBe(4);
    });

});

describe('Disc mono vidéo', function () {

    it('has properties of cuesheet.CueSheet', function () {
        expect(discs.minecraft.title).toBe('Minecraft FULL SOUNDTRACK (2016)');
        expect(discs.minecraft.performer).toBe('Luigi');
    });

    it('has cuesheet', function () {
        expect(discs.minecraft.cuesheet).not.toBeNull();
    });

    it('has files', function () {
        expect(discs.minecraft.files.length).toBe(1);
    });

    it('has videoId', function () {
        expect(discs.minecraft.videoId).toBe('Dg0IjOzopYU');
    });

    it('has tracks', function () {
        expect(discs.minecraft.tracks.length).toBe(28);
    });

    it('is enabled', function () {
        expect(discs.minecraft.enabled).toBe(true);
    });

    it('is playable', function () {
        const disc = new Disc();
        expect(disc.playable).toBe(false);

        const file = disc.newFile();
        const track = file.newTrack();
        track.enabledByUser = false;
        expect(disc.playable).toBe(false);

        track.enabledByUser = true;
        expect(disc.playable).toBe(true);

        const track2 = file.newTrack();

        track.enabledByUser = false;
        track2.enabledByUser = false;
        expect(disc.playable).toBe(false);

        track.enabledByUser = false;
        track2.enabledByUser = true;
        expect(disc.playable).toBe(true);

        track.enabledByUser = true;
        track2.enabledByUser = false;
        expect(disc.playable).toBe(true);
    });

    it('has disabled tracks', function () {
        const disc = new Disc();

        const file = disc.newFile();
        const track1 = file.newTrack();
        file.newTrack();

        expect(disc.disabledTracks.length).toBe(0);

        track1.enabledByUser = false;
        expect(track1.number).toBe(1);
        expect(disc.disabledTracks.map(track => track.number)).toEqual([1]);
    });

    it('contains rem 1', function () {
        const disc = new Disc();
        disc.setRem('DATE', 'BAD');
        disc.setRem('DATE', '1970-01-01');
        expect(disc.rem).toEqual(['DATE "1970-01-01"']);

        disc.rem = ['DATE "1970-01-01"'];
        expect(disc.getRem('DATE')).toBe('1970-01-01');
    });

    it('contains rem 2', function () {
        const disc = new Disc();
        expect(disc.src).toBeUndefined();

        disc.src = 'value';
        expect(disc.src).toBe('value');
    });
});

describe('Disc multi vidéo', function () {

    it('has properties of cuesheet.CueSheet', function () {
        expect(discs.age2.title).toBe('Age of Empires 2: Age of Kings');
        expect(discs.age2.performer).toBe('Gamegroove');
    });

    it('has cuesheet', function () {
        expect(discs.age2.cuesheet).not.toBeNull();
    });

    it('has files', function () {
        expect(discs.age2.files.length).toBe(15);
    });

    it('has videoId', function () {
        expect(discs.age2.videoId).toBe('RRtlWfi6jiM');
    });

    it('has tracks', function () {
        expect(discs.age2.tracks.length).toBe(15);
    });

    it('is enabled', function () {
        expect(discs.age2.enabled).toBe(true);
    });

    it('has newFile constructor + File.newTrack', function () {
        const disc = new Disc();

        const file = disc.newFile();
        expect(file.disc).toEqual(disc);
        expect(file.index).toBe(0);

        const file2 = disc.newFile();
        expect(file2.disc).toEqual(disc);
        expect(file2.index).toBe(1);

        const track1 = file.newTrack();
        track1.title = 'Track 1';
        expect(track1.title).toBe('Track 1');
        expect(track1.disc).toEqual(disc);
        expect(track1.file).toEqual(file);
        expect(track1.index).toBe(0);

        const track2 = file.newTrack();
        track2.title = 'Track 2';
        expect(track2.title).toBe('Track 2');
        expect(track2.disc).toEqual(disc);
        expect(track2.file).toEqual(file);
        expect(track2.index).toBe(1);

        const track3 = file2.newTrack();
        track3.title = 'Track 3';
        expect(track3.title).toBe('Track 3');
        expect(track3.disc).toEqual(disc);
        expect(track3.file).toEqual(file2);
        expect(track3.index).toBe(0);

        expect(disc.tracks).toEqual([track1, track2, track3]);
    });

    it('is playable', function () {
        const disc = new Disc();

        const file1 = disc.newFile();
        const track1 = file1.newTrack();
        const track2 = file1.newTrack();

        const file2 = disc.newFile();
        const track3 = file2.newTrack();

        expect(disc.playable).toBe(true);

        disc.enabledByUser = false;
        expect(disc.playable).toBe(false);

        disc.enabledByUser = true;
        expect(disc.playable).toBe(true);

        track3.enabledByUser = false;
        expect(disc.playable).toBe(true);

        track1.enabledByUser = false;
        track3.enabledByUser = true;
        expect(disc.playable).toBe(true);

        track3.enabledByUser = false;
        expect(disc.playable).toBe(true);

        track2.enabledByUser = false;
        expect(disc.playable).toBe(false);
    });
});
