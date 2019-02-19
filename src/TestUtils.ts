import {Disc} from './disc';
import {LocalAndDistantPersistence} from './persistence/LocalAndDistantPersistence';
import {MemoryPersistence} from './persistence/MemoryPersistence';
import Collection from './Collection';
import * as _ from 'underscore';
import {
  GoogleApiYouTubePlaylistItemResource,
  GoogleApiYouTubePaginationInfo,
  GoogleApiYouTubeVideoResource
} from './GoogleApiYouTubePatch';

export class TestUtils {
  static createDisc(id: string, title = id): Disc4Test {
    return new Disc4Test().withId(id).withTitle(title);
  }

  static createLocalAndDistantPersistence(local = new MemoryPersistence(null), distant = new MemoryPersistence(null)) {
    return new LocalAndDistantPersistence(local, distant);
  }
}

class Disc4Test extends Disc {
  withId(id: string): Disc4Test {
    this.id = id;
    return this;
  }

  withTitle(title: string): Disc4Test {
    this.title = title;
    return this;
  }

  withFile(filename: string): File4Test {
    const file = new File4Test(this, this.newFile());
    return file.withName(filename);
  }
}

export class File4Test {
  constructor(public disc: Disc4Test, public file: Disc.File) {

  }

  withName(name: string): File4Test {
    this.file.name = name;
    return this;
  }

  withTrack(title: string): Track4Test {
    const track = new Track4Test(this, this.file.newTrack());
    return track.withTitle(title);
  }

  endFile(): Disc4Test {
    return this.disc;
  }
}

export class Track4Test {
  constructor(public file: File4Test, public track: Disc.Track) {

  }

  withTitle(title: string): Track4Test {
    this.track.title = title;
    return this;
  }

  endTrack(): File4Test {
    return this.file;
  }
}

const fileContents = {
  'samples/MusicBrainz/cues/Norah Jones.cue': `PERFORMER "Norah Jones"
TITLE "Come Away With Me"
REM MUSICBRAINZ_ALBUM_ID 4c6f6712-1ca0-46c9-9484-f24bc1ef83f5
REM MUSICBRAINZ_ALBUM_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
REM DATE 2013
  TRACK 01 AUDIO
    PERFORMER "Norah Jones"
    TITLE "Don't Know Why"
    REM MUSICBRAINZ_TRACK_ID 478382f6-9fb9-3eea-b29d-80e26985f733
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 00:00:00
  TRACK 02 AUDIO
    PERFORMER "Norah Jones"
    TITLE "Seven Years"
    REM MUSICBRAINZ_TRACK_ID eed8a3fb-ad8d-3c35-adfb-395581987d91
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 03:07:00
  TRACK 03 AUDIO
    PERFORMER "Norah Jones"
    TITLE "Cold Cold Heart"
    REM MUSICBRAINZ_TRACK_ID 19c13994-8e0b-3617-944c-ccd157727588
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 05:31:74
  TRACK 04 AUDIO
    PERFORMER "Norah Jones"
    TITLE "Feelin' the Same Way"
    REM MUSICBRAINZ_TRACK_ID f1f3b7b4-2ef2-376a-aef0-3a304cf2835c
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 09:09:74
  TRACK 05 AUDIO
    PERFORMER "Norah Jones"
    TITLE "Come Away With Me"
    REM MUSICBRAINZ_TRACK_ID 8f1b3cdc-239e-3c45-b7b7-f5f5c7340917
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 12:09:29
  TRACK 06 AUDIO
    PERFORMER "Norah Jones"
    TITLE "Shoot the Moon"
    REM MUSICBRAINZ_TRACK_ID 6e8c602e-14b0-3056-8f86-fc040a75761d
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 15:26:29
  TRACK 07 AUDIO
    PERFORMER "Norah Jones"
    TITLE "Turn Me On"
    REM MUSICBRAINZ_TRACK_ID 0ce1e174-d605-3921-ab8f-d49c535629e1
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 19:23:30
  TRACK 08 AUDIO
    PERFORMER "Norah Jones"
    TITLE Lonestar
    REM MUSICBRAINZ_TRACK_ID 28dacf37-bfaa-3790-b3ad-32f0a6ba826a
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 21:58:30
  TRACK 09 AUDIO
    PERFORMER "Norah Jones"
    TITLE "I've Got to See You Again"
    REM MUSICBRAINZ_TRACK_ID 009a3923-bbd5-37b6-8805-1304a309b8d3
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 25:04:30
  TRACK 10 AUDIO
    PERFORMER "Norah Jones"
    TITLE "Painter Song"
    REM MUSICBRAINZ_TRACK_ID 9546f580-7488-35b9-ab8a-f3b1c071550d
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 29:18:30
  TRACK 11 AUDIO
    PERFORMER "Norah Jones"
    TITLE "One Flight Down"
    REM MUSICBRAINZ_TRACK_ID 6a56ea49-389d-34a6-9f29-e3dad0e7f06c
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 31:59:30
  TRACK 12 AUDIO
    PERFORMER "Norah Jones"
    TITLE Nightingale
    REM MUSICBRAINZ_TRACK_ID 68d9ed3e-d8e6-3099-9864-ac78513eb8fe
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 35:05:30
  TRACK 13 AUDIO
    PERFORMER "Norah Jones"
    TITLE "The Long Day Is Over"
    REM MUSICBRAINZ_TRACK_ID 0efe6550-9e47-36ac-bb82-fb62bb2f1dd9
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 39:17:29
  TRACK 14 AUDIO
    PERFORMER "Norah Jones"
    TITLE "The Nearness of You"
    REM MUSICBRAINZ_TRACK_ID c6eeaa80-b0f7-387a-99c7-c4f95d1df190
    REM MUSICBRAINZ_ARTIST_ID 985c709c-7771-4de3-9024-7bda29ebe3f9
    INDEX 01 42:03:29
`
};

/**
 * Emulate reading file from file system. See TestUtils.fileContents constant to get available paths.
 * @param path file path
 */
export function readFile(path: string): string {
  return fileContents[path];
}

export const discs = {
  age2: Disc.fromJSON({
    'catalog': null,
    'cdTextFile': null,
    'files': [{
      'name': 'https://www.youtube.com/watch?v=RRtlWfi6jiM',
      'type': 'MP3',
      'tracks': [{
        'number': 1,
        'type': 'AUDIO',
        'title': 'Main Theme',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 0, 'sec': 0, 'frame': 0}}]
      }]
    }, {
      'name': 'https://www.youtube.com/watch?v=Rxbcp2AK-2Y&list=PL1800E1EFCA1EABE3&index=2',
      'type': 'MP3',
      'tracks': [{
        'number': 2,
        'type': 'AUDIO',
        'title': 'Track 1 : Shamburger',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 0, 'sec': 0, 'frame': 0}}]
      }]
    }, {
      'name': 'https://www.youtube.com/watch?v=FXp--cIRR2c&list=PL1800E1EFCA1EABE3&index=3',
      'type': 'MP3',
      'tracks': [{
        'number': 3,
        'type': 'AUDIO',
        'title': 'Track 2 : I Will Beat On Your Behind',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 0, 'sec': 0, 'frame': 0}}]
      }]
    }, {
      'name': 'https://www.youtube.com/watch?v=wsrvDc8ikpM&list=PL1800E1EFCA1EABE3&index=4',
      'type': 'MP3',
      'tracks': [{
        'number': 4,
        'type': 'AUDIO',
        'title': 'Track 3 : Drizzle (Firelight Smoove Mix)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 0, 'sec': 0, 'frame': 0}}]
      }]
    }, {
      'name': 'https://www.youtube.com/watch?v=NDcZXEMF84k&list=PL1800E1EFCA1EABE3&index=5',
      'type': 'MP3',
      'tracks': [{
        'number': 5,
        'type': 'AUDIO',
        'title': 'Track 4 : Machina del Diablo',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 0, 'sec': 0, 'frame': 0}}]
      }]
    }, {
      'name': 'https://www.youtube.com/watch?v=09hkbF0AFwk&list=PL1800E1EFCA1EABE3&index=6',
      'type': 'MP3',
      'tracks': [{
        'number': 6,
        'type': 'AUDIO',
        'title': 'Track 5 : T Station',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 0, 'sec': 0, 'frame': 0}}]
      }]
    }, {
      'name': 'https://www.youtube.com/watch?v=KtrvTntcBUE&list=PL1800E1EFCA1EABE3&index=7',
      'type': 'MP3',
      'tracks': [{
        'number': 7,
        'type': 'AUDIO',
        'title': 'Track 6 : Bass Bag',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 0, 'sec': 0, 'frame': 0}}]
      }]
    }, {
      'name': 'https://www.youtube.com/watch?v=1T0Yi4x5_8Q&list=PL1800E1EFCA1EABE3&index=8',
      'type': 'MP3',
      'tracks': [{
        'number': 8,
        'type': 'AUDIO',
        'title': 'Track 7 : Ride, Lawrence, Ride!',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 0, 'sec': 0, 'frame': 0}}]
      }]
    }, {
      'name': 'https://www.youtube.com/watch?v=PkOC5BnnXwU&list=PL1800E1EFCA1EABE3&index=9',
      'type': 'MP3',
      'tracks': [{
        'number': 9,
        'type': 'AUDIO',
        'title': 'Track 8 : Smells Like Crickets, Tastes Like Chicken',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 0, 'sec': 0, 'frame': 0}}]
      }]
    }, {
      'name': 'https://www.youtube.com/watch?v=pKxWHEiuIbI&list=PL1800E1EFCA1EABE3&index=10',
      'type': 'MP3',
      'tracks': [{
        'number': 10,
        'type': 'AUDIO',
        'title': 'Track 9 : Operation Monkey',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 0, 'sec': 0, 'frame': 0}}]
      }]
    }, {
      'name': 'https://www.youtube.com/watch?v=iOhW_d90Cfw&list=PL1800E1EFCA1EABE3&index=11',
      'type': 'MP3',
      'tracks': [{
        'number': 11,
        'type': 'AUDIO',
        'title': 'Track 10 : Tazer',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 0, 'sec': 0, 'frame': 0}}]
      }]
    }, {
      'name': 'https://www.youtube.com/watch?v=xcxooGUBkYU&list=PL1800E1EFCA1EABE3&index=12',
      'type': 'MP3',
      'tracks': [{
        'number': 12,
        'type': 'AUDIO',
        'title': 'Scenario Success 1',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 0, 'sec': 0, 'frame': 0}}]
      }]
    }, {
      'name': 'https://www.youtube.com/watch?v=O4pN6EqUN4E&list=PL1800E1EFCA1EABE3&index=13',
      'type': 'MP3',
      'tracks': [{
        'number': 13,
        'type': 'AUDIO',
        'title': 'Scenario Success 2',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 0, 'sec': 0, 'frame': 0}}]
      }]
    }, {
      'name': 'https://www.youtube.com/watch?v=zgOIFjNqcNs&list=PL1800E1EFCA1EABE3&index=14',
      'type': 'MP3',
      'tracks': [{
        'number': 14,
        'type': 'AUDIO',
        'title': 'Scenario Failure',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 0, 'sec': 0, 'frame': 0}}]
      }]
    }, {
      'name': 'https://www.youtube.com/watch?v=FtV5CcJqKMg',
      'type': 'MP3',
      'tracks': [{
        'number': 15,
        'type': 'AUDIO',
        'title': 'Credits',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 0, 'sec': 0, 'frame': 0}}]
      }]
    }],
    'performer': 'Gamegroove',
    'songWriter': 'Stephen Rippy, Kevin McMullan',
    'title': 'Age of Empires 2: Age of Kings',
    'rem': ['COMMENT "Playlist YouTube : https://www.youtube.com/watch?v=FXp--cIRR2c&index=3&list=PL1800E1EFCA1EABE3"']
  }),
  minecraft: Disc.fromJSON({
    'catalog': null,
    'cdTextFile': null,
    'files': [{
      'name': 'https://www.youtube.com/watch?v=Dg0IjOzopYU',
      'type': 'MP3',
      'tracks': [{
        'number': 1,
        'type': 'AUDIO',
        'title': 'Key (Nuance 1)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 0, 'sec': 0, 'frame': 0}}]
      }, {
        'number': 2,
        'type': 'AUDIO',
        'title': 'Subwoofer Lullaby (Hal 1)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 1, 'sec': 4, 'frame': 0}}]
      }, {
        'number': 3,
        'type': 'AUDIO',
        'title': 'Living Mice (Hal 2)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 4, 'sec': 40, 'frame': 0}}]
      }, {
        'number': 4,
        'type': 'AUDIO',
        'title': 'Haggstrom (Hal 3)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 7, 'sec': 30, 'frame': 0}}]
      }, {
        'number': 5,
        'type': 'AUDIO',
        'title': 'Minecraft (Calm 1)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 10, 'sec': 53, 'frame': 0}}]
      }, {
        'number': 6,
        'type': 'AUDIO',
        'title': 'Oxygene (Nuance 2)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 15, 'sec': 8, 'frame': 0}}]
      }, {
        'number': 7,
        'type': 'AUDIO',
        'title': 'Mice on Venus (Piano 3)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 16, 'sec': 14, 'frame': 0}}]
      }, {
        'number': 8,
        'type': 'AUDIO',
        'title': 'Dry Hands (Piano 1)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 21, 'sec': 8, 'frame': 0}}]
      }, {
        'number': 9,
        'type': 'AUDIO',
        'title': 'Wet Hands (Piano 2)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 22, 'sec': 4, 'frame': 0}}]
      }, {
        'number': 10,
        'type': 'AUDIO',
        'title': 'Clark (Calm 2)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 23, 'sec': 34, 'frame': 0}}]
      }, {
        'number': 11,
        'type': 'AUDIO',
        'title': 'Sweden (Calm 3)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 26, 'sec': 46, 'frame': 0}}]
      }, {
        'number': 12,
        'type': 'AUDIO',
        'title': 'Danny (Hal 4)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 30, 'sec': 21, 'frame': 0}}]
      }, {
        'number': 13,
        'type': 'AUDIO',
        'title': 'Biome Fest (Creative 1)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 34, 'sec': 38, 'frame': 0}}]
      }, {
        'number': 14,
        'type': 'AUDIO',
        'title': 'Blind Spots (Creative 2)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 40, 'sec': 58, 'frame': 0}}]
      }, {
        'number': 15,
        'type': 'AUDIO',
        'title': 'Haunt Muskie (Creative 3)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 46, 'sec': 34, 'frame': 0}}]
      }, {
        'number': 16,
        'type': 'AUDIO',
        'title': 'Aria Math (Creative 4)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 52, 'sec': 32, 'frame': 0}}]
      }, {
        'number': 17,
        'type': 'AUDIO',
        'title': 'Dreiton (Creative 5)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 57, 'sec': 54, 'frame': 0}}]
      }, {
        'number': 18,
        'type': 'AUDIO',
        'title': 'Taswell (Creative 6)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 66, 'sec': 5, 'frame': 0}}]
      }, {
        'number': 19,
        'type': 'AUDIO',
        'title': 'Mutation (Menu 1)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 74, 'sec': 32, 'frame': 0}}]
      }, {
        'number': 20,
        'type': 'AUDIO',
        'title': 'Moog City 2 (Menu 2)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 77, 'sec': 46, 'frame': 0}}]
      }, {
        'number': 21,
        'type': 'AUDIO',
        'title': 'Beginning 2 (Menu 3)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 80, 'sec': 52, 'frame': 0}}]
      }, {
        'number': 22,
        'type': 'AUDIO',
        'title': 'Floating Trees (Menu 4)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 83, 'sec': 56, 'frame': 0}}]
      }, {
        'number': 23,
        'type': 'AUDIO',
        'title': 'Concrete Halls (Nether 1)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 88, 'sec': 1, 'frame': 0}}]
      }, {
        'number': 24,
        'type': 'AUDIO',
        'title': 'Dead Voxel (Nether 2)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 92, 'sec': 22, 'frame': 0}}]
      }, {
        'number': 25,
        'type': 'AUDIO',
        'title': 'Warmth (Nether 3)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 97, 'sec': 24, 'frame': 0}}]
      }, {
        'number': 26,
        'type': 'AUDIO',
        'title': 'Ballad of the Cats (Nether 4)',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 101, 'sec': 28, 'frame': 0}}]
      }, {
        'number': 27,
        'type': 'AUDIO',
        'title': 'Boss',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 106, 'sec': 3, 'frame': 0}}]
      }, {
        'number': 28,
        'type': 'AUDIO',
        'title': 'End',
        'flags': null,
        'isrc': null,
        'performer': null,
        'songWriter': null,
        'pregap': null,
        'postgap': null,
        'indexes': [{'number': 1, 'time': {'min': 111, 'sec': 48, 'frame': 0}}]
      }]
    }],
    'performer': 'Luigi',
    'songWriter': null,
    'title': 'Minecraft FULL SOUNDTRACK (2016)',
    'rem': ['COMMENT "http://minecraft.gamepedia.com/Music"']
  }),
  'samples/LeGrandBleu-cd2-unordered.json': Disc.fromJSON({
    'catalog': null,
    'cdTextFile': null,
    'files': [
      {
        'name': 'https://www.youtube.com/watch?v=XiZxPUjc6Ig',
        'type': 'MP3',
        'tracks': [
          {
            'number': 1,
            'type': 'AUDIO',
            'title': 'Let Them Try',
            'flags': null,
            'isrc': null,
            'performer': 'Éric Serra',
            'songWriter': null,
            'pregap': null,
            'postgap': null,
            'indexes': [
              {
                'number': 1,
                'time': {
                  'min': 11,
                  'sec': 11,
                  'frame': 0
                }
              }
            ]
          },
          {
            'number': 2,
            'type': 'AUDIO',
            'title': 'A Walk in Taormina',
            'flags': null,
            'isrc': null,
            'performer': 'Éric Serra',
            'songWriter': null,
            'pregap': null,
            'postgap': null,
            'indexes': [
              {
                'number': 1,
                'time': {
                  'min': 0,
                  'sec': 0,
                  'frame': 0
                }
              }
            ]
          },
          {
            'number': 3,
            'type': 'AUDIO',
            'title': 'Watergames',
            'flags': null,
            'isrc': null,
            'performer': 'Éric Serra',
            'songWriter': null,
            'pregap': null,
            'postgap': null,
            'indexes': [
              {
                'number': 1,
                'time': {
                  'min': 28,
                  'sec': 55,
                  'frame': 0
                }
              }
            ]
          },
          {
            'number': 4,
            'type': 'AUDIO',
            'title': 'Fatal Dive',
            'flags': null,
            'isrc': null,
            'performer': 'Éric Serra',
            'songWriter': null,
            'pregap': null,
            'postgap': null,
            'indexes': [
              {
                'number': 1,
                'time': {
                  'min': 1,
                  'sec': 54,
                  'frame': 0
                }
              }
            ]
          },
          {
            'number': 5,
            'type': 'AUDIO',
            'title': 'Platform',
            'flags': null,
            'isrc': null,
            'performer': 'Éric Serra',
            'songWriter': null,
            'pregap': null,
            'postgap': null,
            'indexes': [
              {
                'number': 1,
                'time': {
                  'min': 14,
                  'sec': 32,
                  'frame': 0
                }
              }
            ]
          },
          {
            'number': 6,
            'type': 'AUDIO',
            'title': 'Leaving Peru',
            'flags': null,
            'isrc': null,
            'performer': 'Éric Serra',
            'songWriter': null,
            'pregap': null,
            'postgap': null,
            'indexes': [
              {
                'number': 1,
                'time': {
                  'min': 6,
                  'sec': 0,
                  'frame': 0
                }
              }
            ]
          },
          {
            'number': 7,
            'type': 'AUDIO',
            'title': 'Virgin Islands',
            'flags': null,
            'isrc': null,
            'performer': 'Éric Serra',
            'songWriter': null,
            'pregap': null,
            'postgap': null,
            'indexes': [
              {
                'number': 1,
                'time': {
                  'min': 26,
                  'sec': 42,
                  'frame': 0
                }
              }
            ]
          },
          {
            'number': 8,
            'type': 'AUDIO',
            'title': 'Strange Feelings',
            'flags': null,
            'isrc': null,
            'performer': 'Éric Serra',
            'songWriter': null,
            'pregap': null,
            'postgap': null,
            'indexes': [
              {
                'number': 1,
                'time': {
                  'min': 19,
                  'sec': 8,
                  'frame': 0
                }
              }
            ]
          },
          {
            'number': 9,
            'type': 'AUDIO',
            'title': 'Sicilia',
            'flags': null,
            'isrc': null,
            'performer': 'Éric Serra',
            'songWriter': null,
            'pregap': null,
            'postgap': null,
            'indexes': [
              {
                'number': 1,
                'time': {
                  'min': 17,
                  'sec': 42,
                  'frame': 0
                }
              }
            ]
          },
          {
            'number': 10,
            'type': 'AUDIO',
            'title': 'Such a Family',
            'flags': null,
            'isrc': null,
            'performer': 'Éric Serra',
            'songWriter': null,
            'pregap': null,
            'postgap': null,
            'indexes': [
              {
                'number': 1,
                'time': {
                  'min': 22,
                  'sec': 28,
                  'frame': 0
                }
              }
            ]
          },
          {
            'number': 11,
            'type': 'AUDIO',
            'title': 'The Third Dive',
            'flags': null,
            'isrc': null,
            'performer': 'Éric Serra',
            'songWriter': null,
            'pregap': null,
            'postgap': null,
            'indexes': [
              {
                'number': 1,
                'time': {
                  'min': 23,
                  'sec': 55,
                  'frame': 0
                }
              }
            ]
          },
          {
            'number': 12,
            'type': 'AUDIO',
            'title': 'Do You Like This Place',
            'flags': null,
            'isrc': null,
            'performer': 'Éric Serra',
            'songWriter': null,
            'pregap': null,
            'postgap': null,
            'indexes': [
              {
                'number': 1,
                'time': {
                  'min': 0,
                  'sec': 47,
                  'frame': 0
                }
              }
            ]
          },
          {
            'number': 13,
            'type': 'AUDIO',
            'title': 'For Enzo',
            'flags': null,
            'isrc': null,
            'performer': 'Éric Serra',
            'songWriter': null,
            'pregap': null,
            'postgap': null,
            'indexes': [
              {
                'number': 1,
                'time': {
                  'min': 3,
                  'sec': 11,
                  'frame': 0
                }
              }
            ]
          },
          {
            'number': 14,
            'type': 'AUDIO',
            'title': 'Leaving the World Behind',
            'flags': null,
            'isrc': null,
            'performer': 'Éric Serra',
            'songWriter': null,
            'pregap': null,
            'postgap': null,
            'indexes': [
              {
                'number': 1,
                'time': {
                  'min': 7,
                  'sec': 56,
                  'frame': 0
                }
              }
            ]
          }
        ]
      }
    ],
    'performer': 'Eric Serra',
    'songWriter': null,
    'title': 'Le Grand Bleu: Version Integral (1988) 2/2',
    'rem': null
  })
};

// Données récupérées du player YouTube
discs.minecraft.files[0].duration = 7613.001;


export const youtube: {
  snippets: {
    playlistItemResourcesUnknownParent: { [key: string]: any }, // TODO
    playlistItemResources: { [key: string]: GoogleApiYouTubePlaylistItemResource[] },
    paginationInfosOfVideo: { [key: string]: GoogleApiYouTubePaginationInfo<GoogleApiYouTubeVideoResource> }
  }
} = {
  snippets: {
    playlistItemResourcesUnknownParent: {
      'mario': {
        'kind': 'youtube#playlistItemListResponse',
        'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/lqT8Tb_YkuEUVBMK5ptLu8MZPg4"',
        'pageInfo': {
          'totalResults': 30,
          'resultsPerPage': 50
        },
        'items': [
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/P6e1fgDmOgJqDsBb3QpmdiSQ9cI"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLkIzNTBBMjkyMkZCODRFQTA=',
            'snippet': {
              'publishedAt': '2008-07-17T22:48:17.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - World Map 1: Grass Land Theme',
              'description': 'This is the first track in \'The SMB3 Anthology.\'\r\n\r\nThis a cool song to get started with.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/LI_mwl3QcYA/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/LI_mwl3QcYA/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/LI_mwl3QcYA/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 0,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': 'LI_mwl3QcYA'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/KuwJHdbj1Jnb0mAYleHcJ7dgA1c"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLkY3MkUzQzgwN0NERTY3NUU=',
            'snippet': {
              'publishedAt': '2008-07-17T22:48:17.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - World Map 2: Desert Land Theme',
              'description': 'The next track in this BGM anthology.\r\n\r\nA cool low-key tune perfect for a desert.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/eRXqOpw3uQA/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/eRXqOpw3uQA/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/eRXqOpw3uQA/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 1,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': 'eRXqOpw3uQA'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/_xi8iZ3ns88OOrO659zvaE4ijOQ"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjJENDVGMDQ4QjQ0MTg1Mjg=',
            'snippet': {
              'publishedAt': '2008-07-17T22:48:17.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - World Map 3: Water Land Theme',
              'description': 'The next track in this BGM anthology.\r\n\r\nThis is kinda cool, but it has a water essence.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/C382wc4StOw/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/C382wc4StOw/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/C382wc4StOw/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 2,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': 'C382wc4StOw'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/G_hfKJ3lRgP8PkneII8rToQzsdU"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjNCQjhBRUM4RjdDRUI2NzY=',
            'snippet': {
              'publishedAt': '2008-07-17T22:48:17.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - World Map 4: Giant Land Theme',
              'description': 'This is the next track in this BGM anthology.\r\n\r\nThis is a cool, fast-paced map tune.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/85yuGwTMJh4/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/85yuGwTMJh4/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/85yuGwTMJh4/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 3,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': '85yuGwTMJh4'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/hW6SI-C_g-lI_5ttF6dYMG2rioU"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLkM1RDIzRDE2Q0JFODRDOTk=',
            'snippet': {
              'publishedAt': '2008-07-17T22:48:17.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - World Map 5: Sky Land Theme',
              'description': 'This is the next track in this BGM anthology.\r\n\r\nThis is my fav World Map theme from SMB3.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/Ob7WHx13X7A/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/Ob7WHx13X7A/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/Ob7WHx13X7A/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 4,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': 'Ob7WHx13X7A'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/AtnGMkzy15wBDFi3MhPhItzL7sI"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLkVDMzg0QjA5MUIwQjI0OEI=',
            'snippet': {
              'publishedAt': '2008-07-17T22:48:17.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - World Map 6: Ice Land Theme',
              'description': 'The next track in this BGM anthology.\r\n\r\nThis is kinda cool, but pretty annyoing after a while.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/c8LnHIODRMM/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/c8LnHIODRMM/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/c8LnHIODRMM/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 5,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': 'c8LnHIODRMM'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/JeJiHntb7HXkU_44L0vrfoYuFJ8"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjhEMjcwRTAwMTdFNTEyNkE=',
            'snippet': {
              'publishedAt': '2008-07-17T22:48:17.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - World Map 7: Pipe Maze Theme',
              'description': 'The next track in this BGM anthology.\r\n\r\nThis is kind of dark. Kinda like it\'s preparing for World 8.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/PhYMtJrfTLY/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/PhYMtJrfTLY/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/PhYMtJrfTLY/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 6,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': 'PhYMtJrfTLY'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/5jZlnB8QTrWhhuvpQmibvjm2J9M"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjBFNjI3Rjc4OTA3MTE5RDg=',
            'snippet': {
              'publishedAt': '2008-07-17T22:48:17.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - World Map 8: Dark Land Theme',
              'description': 'The next track in this BGM anthology.\r\n\r\nBowser really outdid himself with this level.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/XA6xrfUb06E/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/XA6xrfUb06E/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/XA6xrfUb06E/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 7,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': 'XA6xrfUb06E'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/W3jwP9bwt7rR8kbsGmL-6cmB1FM"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjBDQUFGQkVCNjc5M0QwQzU=',
            'snippet': {
              'publishedAt': '2008-07-17T22:48:17.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - Overworld 1 Theme',
              'description': 'The next track in this BGM anthology.\r\n'
                + '\r\nThis is my second fav Overworld Theme fromthe NES SMB series, behind the SMB2 Overworld.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/Q_saM7I20pY/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/Q_saM7I20pY/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/Q_saM7I20pY/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 8,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': 'Q_saM7I20pY'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/S3IobnsVsjYZVb_82cABhdrNpX8"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjA3MDI4REM4MEVFNzEyNTA=',
            'snippet': {
              'publishedAt': '2008-07-17T22:48:17.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - Overworld 2 Theme',
              'description': 'The next track in this BGM anthology.\r\n\r\nThis is my least fav Overworld but it\'s still very good.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/5wApmRF5gyM/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/5wApmRF5gyM/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/5wApmRF5gyM/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 9,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': '5wApmRF5gyM'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/vcE7iGv5I2h33hjmu5mx7zNTctg"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLkVGRDI4NDFDMDhGOEYwMjM=',
            'snippet': {
              'publishedAt': '2008-07-17T22:48:17.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - Underwater Theme',
              'description': 'The next track in this BGM anthology.\r\n' +
                '\r\nThis cooler but not as classic as the underwater theme from SMB1.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/icKfm1MsTxE/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/icKfm1MsTxE/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/icKfm1MsTxE/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 10,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': 'icKfm1MsTxE'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/qKIhebUTVy_ctAiUh9gRJnBY69I"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjY3NzUyMjZFRjU1RDhFMzU=',
            'snippet': {
              'publishedAt': '2008-07-19T16:18:15.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - Underworld Theme',
              'description': 'The next track in this BGM anthology.\r\n\r\nA remix of the SMB1 underworld Theme.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/TmnZgBpYG_4/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/TmnZgBpYG_4/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/TmnZgBpYG_4/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 11,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': 'TmnZgBpYG_4'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/5OKKz5S5fTFwtXy_q_uFwyxdMQo"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjMzQTFFQzM4RDZENzZCNzk=',
            'snippet': {
              'publishedAt': '2008-07-19T17:33:08.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - Warp Zone Theme',
              'description': 'The next track in this BGM anthology.\r\n' +
                '\r\nThis also plays when you go to the secret coin heavens. Cool little chillout track.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/EOg0GZZuCak/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/EOg0GZZuCak/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/EOg0GZZuCak/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 12,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': 'EOg0GZZuCak'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/9SyVu3PJuSazNrOdxWG2-CJpcZc"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLkM2MkU1QkY2REUzMzhBNDM=',
            'snippet': {
              'publishedAt': '2008-07-19T17:33:08.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - Starman Theme',
              'description': 'The next track in this BGM anthology.\r\n\r\n' +
                'The same as the SMB1 and SMB2 one with a litlle snare and cymbal sample added in.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/w3FhYeqX4aU/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/w3FhYeqX4aU/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/w3FhYeqX4aU/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 13,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': 'w3FhYeqX4aU'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/o-aNpbVqRSOo7DF6ofCTgtGMYos"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjhCRTNFOTdBRTIxREYzMDc=',
            'snippet': {
              'publishedAt': '2008-07-19T17:33:08.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - Warp Whistle Theme',
              'description': 'The next track in this BGM anthology.\r\n\r\n' +
                'The quick snippet that plays while the Warp Tornado brings you to the Warp Zone.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/v4HCJ1Cedxk/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/v4HCJ1Cedxk/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/v4HCJ1Cedxk/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 14,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': 'v4HCJ1Cedxk'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/CFX7-BL6pe05IeycMVtpPGtyi2Q"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLkJDMDJGRjI5MEIyQUQ3NDc=',
            'snippet': {
              'publishedAt': '2008-07-19T17:33:08.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - Music Box Theme',
              'description': 'The next track in this BGM anthology.\r\n\r\n' +
                'This is one of the things you can get from a Hammer Bros. fight.' +
                ' It plays a slower and more 8-bit sounding version of the SMB1 overworld.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/nWDSwqu5r2Y/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/nWDSwqu5r2Y/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/nWDSwqu5r2Y/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 15,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': 'nWDSwqu5r2Y'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/j81CaV8rTqfF3gOnRsvfwMNL97o"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjUwMzRGNTNGQjk0OUU3OTg=',
            'snippet': {
              'publishedAt': '2008-07-19T17:33:08.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - Spade Panel Theme',
              'description': 'The next track in this BGM anthology.\r\n\r\n' +
                'This is the song that plays during your run at a Spade Panel Theme. ' +
                'Spade Panels are the places where you play memory matching and slot machine style matching.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/YZFxVDyB0xw/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/YZFxVDyB0xw/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/YZFxVDyB0xw/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 16,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': 'YZFxVDyB0xw'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/IvRxbeAu19UwdsgyQKqqBVMq0cg"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLkE1Qjg0NzBBNDA4RTA2NkI=',
            'snippet': {
              'publishedAt': '2008-07-19T17:33:08.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - Toad\'s House Theme',
              'description': 'The next track in this BGM anthology.\r\n\r\n' +
                'With three chests a visit, Toad\'s House is a surprise every time you go in there.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/3Tf2hgrnw2M/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/3Tf2hgrnw2M/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/3Tf2hgrnw2M/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 17,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': '3Tf2hgrnw2M'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/4A2QgHnRVAwqLFYbyRhsJ4hvJcQ"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLkY5OEI2MzEwM0E5MTQ5QTg=',
            'snippet': {
              'publishedAt': '2008-07-19T17:33:08.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - Fortress Theme',
              'description': 'The next track in this BGM anthology.\r\n\r\n' +
                'With a Koopa Kid in every Fortress it just might be the most challeenging part of the game, next to the Airships.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/wEc6-RUYVoE/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/wEc6-RUYVoE/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/wEc6-RUYVoE/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 18,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': 'wEc6-RUYVoE'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/ikuw-dYied2H1ARGUEuvItfCTa4"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjlCQ0I0N0E0OTY1ODIwMTM=',
            'snippet': {
              'publishedAt': '2008-07-19T17:33:08.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - Hammer Bros. Battle Theme',
              'description': 'The next track in this BGM anthology.\r\n\r\nMy fav track from the SMB3 anthology.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/0-INuS99s5Q/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/0-INuS99s5Q/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/0-INuS99s5Q/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 19,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': '0-INuS99s5Q'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/yXtpn64bF9Pkn3tT_ubXRL5E7jc"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjA0MjI4NjFDQTBBNzA1QTM=',
            'snippet': {
              'publishedAt': '2008-07-19T17:33:08.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - King Theme',
              'description': 'The next track in this BGM anthology.\r\n\r\n' +
                'This is what plays when Toad tells you the HORRIBLE NEWS ' +
                'about how the king has been transformed. Then you have to do a bunch of crap.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/vwk9mrE-cFA/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/vwk9mrE-cFA/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/vwk9mrE-cFA/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 20,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': 'vwk9mrE-cFA'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/fLzQGisOKeRkItjzatJnC6QjO0I"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLkJBRjhENDEyNEYzREYwOTY=',
            'snippet': {
              'publishedAt': '2008-07-19T17:33:08.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - Airship Theme',
              'description': 'The next track in this BGM anthology.\r\n\r\n' +
                'Koopalings roam these parks...and Airships are known to be devilish.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/Uh0OKW5cwVo/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/Uh0OKW5cwVo/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/Uh0OKW5cwVo/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 21,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': 'Uh0OKW5cwVo'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/HcJUZbG8cTg1XAPjFScVRDSASfM"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLkYwRTJBNEEwOUM4OUFERjQ=',
            'snippet': {
              'publishedAt': '2008-07-19T17:33:08.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - Koopa Kid Battle Theme',
              'description': 'The next track in this BGM anthology.\r\n\r\n' +
                'Koopalings and Koopa Kids rule Fortress\' and Airships and there' +
                ' has to be a tune liable enough to handle that many fights.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/03gX-re5C9g/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/03gX-re5C9g/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/03gX-re5C9g/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 22,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': '03gX-re5C9g'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/POJwK19LS3ghjxU_5Zq3y4zM1nM"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLkFDODVDQ0FEODk0NDNGODk=',
            'snippet': {
              'publishedAt': '2008-07-19T17:33:08.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - Victory Fanfare',
              'description': 'The next track in this BGM anthology.\r\n\r\n' +
                'When you get three of the same Card in a row this tune plays.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/5fZJLyJyPKQ/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/5fZJLyJyPKQ/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/5fZJLyJyPKQ/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 23,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': '5fZJLyJyPKQ'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/3TQeFV5tCTAlJVm8cUmx0_7-0sQ"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjYyRDA5N0Y1ODc1RkE3N0Q=',
            'snippet': {
              'publishedAt': '2008-07-19T17:33:08.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - King Restored Fanfare',
              'description': 'The next track in this BGM anthology.\r\n\r\n' +
                'When you find the wand, transform the king, this ong plays. Its a HAPPY HAPPY HAPPY HAPPY HAPPY HAPPY SONG!',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/Wj022XKwbp0/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/Wj022XKwbp0/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/Wj022XKwbp0/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 24,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': 'Wj022XKwbp0'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/vP6M3tucb9dtSDp1iA53p-W-F-0"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjMzRTdDMjEyQkQ1NDk0RkM=',
            'snippet': {
              'publishedAt': '2008-07-19T18:21:36.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - Course Clear Fanfare',
              'description': 'The next track in this BGM anthology.\r\n\r\nWhen you beat a course, this kinky tune plays.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/sE0xXjdrx-Q/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/sE0xXjdrx-Q/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/sE0xXjdrx-Q/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 25,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': 'sE0xXjdrx-Q'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/ROYJXwFtlxWM48LsBxqCvSVh4Sk"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjA5NDM3RUI3MkQ2RkJFN0Y=',
            'snippet': {
              'publishedAt': '2008-07-19T18:21:36.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - You\'re Dead Theme',
              'description': 'The next track in this BGM anthology.\r\n\r\nThis is a kinda cool deatht theme.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/OFX8-ctkQqY/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/OFX8-ctkQqY/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/OFX8-ctkQqY/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 26,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': 'OFX8-ctkQqY'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/HpKcMCq_i4LfZNR9EGjikiQrt_w"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjVDQUYwNDIyRDY0MDMwOEU=',
            'snippet': {
              'publishedAt': '2008-07-19T18:21:36.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - Game Over Theme',
              'description': 'The next track in this BGM anthology.\r\n\r\n' +
                'This is another very happy Game Over theme, though not as happy as the SMB2 game over theme,' +
                ' yet not as touching as the SMB1 game over theme.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/FvIVNRmKW9M/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/FvIVNRmKW9M/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/FvIVNRmKW9M/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 27,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': 'FvIVNRmKW9M'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/dvx0oDBRnYjFv3r1LvG24G38yQw"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjFEM0NDMUNBMDVENTA0QUE=',
            'snippet': {
              'publishedAt': '2008-07-19T18:21:36.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - Bowser Battle Theme',
              'description': 'The next track in this BGM anthology.\r\n\r\n' +
                'This Bowser battle is even easier than the SMB1 Bowser battle. And 80x easier than the SMB2 boss fights.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/h-xih93YIwk/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/h-xih93YIwk/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/h-xih93YIwk/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 28,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': 'h-xih93YIwk'
              }
            }
          },
          {
            'kind': 'youtube#playlistItem',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/02Ozj04Vlcuxb-Awvm2EjJid2kc"',
            'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjk4RTEwQzRFRjAyQjVBQjM=',
            'snippet': {
              'publishedAt': '2008-07-19T18:21:36.000Z',
              'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
              'title': 'Super Mario Bros. 3 - Ending Fanfare',
              'description': 'The final track in this BGM anthology. And the final track for all of the Super Mario Bros. Anthology.' +
                '\r\n\r\n' +
                'My rating:\r\n9.5/10\r\n\r\n' +
                'All three games in my opinion were fabulous, even SMB2(despite my lousy rating). ' +
                'Even with my superior gaming skills and impressive reflexes, I still have yet to beat either one of them.\r\n\r\n' +
                'I believe Shigeru Miyamoto is the biggest genius on the planet. ' +
                'His ideas, ranging from Donkey Kong to Zelda to Metroid back to Mario, are some of the greatest ideas ever created.' +
                '\r\n\r\n' +
                'Koji Kondo\'s 8-bit musical composition work is the work of God. ' +
                'The original SMB series, Mario 64, Zelda, NES and SNES series, Ocarina of Time, ' +
                'and many more Japan-exclusive titles have been endowed with incredible music to play along with, ' +
                'making the gameplay of the some of the greatest even more exsquisite.\r\n\r\n' +
                'Mario will live in our hearts for years to come. Nothing could posbbily eclipse the first three Super Mario Bros. ' +
                'games. Even though SMB2 wasn\'t really a Mario game, it will still go down in history as "one of the whitest black ' +
                'sheeps in the video game world."\r\n\r\nI hope you\'ve played all the games yourself and endeavoured the maticulously ' +
                'well-designed levels and gameplay. All these games have set the standard for some of the biggest games of our time. ' +
                'Castlevania is probably the most obvious. With SMB1-like jumps and obstacles, SMB2-like enemies and bosses,' +
                ' and SMB3-like level design.\r\n\r\nALL HAIL MARIO!\r\n\r\n' +
                'NOTE: I did put in a slight slideshow for you to enjoy. There\'s a thing at the very end that will make you laugh. ' +
                'No, it\'s not a screamer.\r\n\r\nAll of this music has been composed by Koji Kondo.\r\n\r\n' +
                'All three games have been directed by Shigeru Miyamoto.\r\n\r\n' +
                'All games and music are direct copyrgihts of Nintendo. ' +
                'No copyright infringement was meant by uploading the BGM of SMB1, SMB2, and SMB3.\r\n\r\n' +
                'DISCLAIMER: Any problems you have with anything about copyright and/or quality issues of these videos please contact' +
                ' me at daftpunkenstein@yahoo.com\r\n\r\nHEEEEEEEEE!',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/cQWKjnnhKn8/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/cQWKjnnhKn8/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/cQWKjnnhKn8/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                }
              },
              'channelTitle': 'DAFTPUNKletlive',
              'playlistId': 'PL001A1024CB49F661',
              'position': 29,
              'resourceId': {
                'kind': 'youtube#video',
                'videoId': 'cQWKjnnhKn8'
              }
            }
          }
        ]
      }
    },
    playlistItemResources: {
      'mario': [
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/P6e1fgDmOgJqDsBb3QpmdiSQ9cI"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLkIzNTBBMjkyMkZCODRFQTA=',
          'snippet': {
            'publishedAt': '2008-07-17T22:48:17.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - World Map 1: Grass Land Theme',
            'description': 'This is the first track in \'The SMB3 Anthology.\'\r\n\r\nThis a cool song to get started with.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/LI_mwl3QcYA/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/LI_mwl3QcYA/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/LI_mwl3QcYA/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 0,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': 'LI_mwl3QcYA'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/KuwJHdbj1Jnb0mAYleHcJ7dgA1c"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLkY3MkUzQzgwN0NERTY3NUU=',
          'snippet': {
            'publishedAt': '2008-07-17T22:48:17.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - World Map 2: Desert Land Theme',
            'description': 'The next track in this BGM anthology.\r\n\r\nA cool low-key tune perfect for a desert.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/eRXqOpw3uQA/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/eRXqOpw3uQA/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/eRXqOpw3uQA/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 1,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': 'eRXqOpw3uQA'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/_xi8iZ3ns88OOrO659zvaE4ijOQ"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjJENDVGMDQ4QjQ0MTg1Mjg=',
          'snippet': {
            'publishedAt': '2008-07-17T22:48:17.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - World Map 3: Water Land Theme',
            'description': 'The next track in this BGM anthology.\r\n\r\nThis is kinda cool, but it has a water essence.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/C382wc4StOw/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/C382wc4StOw/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/C382wc4StOw/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 2,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': 'C382wc4StOw'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/G_hfKJ3lRgP8PkneII8rToQzsdU"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjNCQjhBRUM4RjdDRUI2NzY=',
          'snippet': {
            'publishedAt': '2008-07-17T22:48:17.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - World Map 4: Giant Land Theme',
            'description': 'This is the next track in this BGM anthology.\r\n\r\nThis is a cool, fast-paced map tune.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/85yuGwTMJh4/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/85yuGwTMJh4/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/85yuGwTMJh4/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 3,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': '85yuGwTMJh4'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/hW6SI-C_g-lI_5ttF6dYMG2rioU"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLkM1RDIzRDE2Q0JFODRDOTk=',
          'snippet': {
            'publishedAt': '2008-07-17T22:48:17.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - World Map 5: Sky Land Theme',
            'description': 'This is the next track in this BGM anthology.\r\n\r\nThis is my fav World Map theme from SMB3.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/Ob7WHx13X7A/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/Ob7WHx13X7A/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/Ob7WHx13X7A/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 4,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': 'Ob7WHx13X7A'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/AtnGMkzy15wBDFi3MhPhItzL7sI"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLkVDMzg0QjA5MUIwQjI0OEI=',
          'snippet': {
            'publishedAt': '2008-07-17T22:48:17.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - World Map 6: Ice Land Theme',
            'description': 'The next track in this BGM anthology.\r\n\r\nThis is kinda cool, but pretty annyoing after a while.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/c8LnHIODRMM/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/c8LnHIODRMM/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/c8LnHIODRMM/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 5,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': 'c8LnHIODRMM'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/JeJiHntb7HXkU_44L0vrfoYuFJ8"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjhEMjcwRTAwMTdFNTEyNkE=',
          'snippet': {
            'publishedAt': '2008-07-17T22:48:17.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - World Map 7: Pipe Maze Theme',
            'description': 'The next track in this BGM anthology.\r\n\r\nThis is kind of dark. Kinda like it\'s preparing for World 8.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/PhYMtJrfTLY/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/PhYMtJrfTLY/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/PhYMtJrfTLY/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 6,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': 'PhYMtJrfTLY'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/5jZlnB8QTrWhhuvpQmibvjm2J9M"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjBFNjI3Rjc4OTA3MTE5RDg=',
          'snippet': {
            'publishedAt': '2008-07-17T22:48:17.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - World Map 8: Dark Land Theme',
            'description': 'The next track in this BGM anthology.\r\n\r\nBowser really outdid himself with this level.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/XA6xrfUb06E/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/XA6xrfUb06E/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/XA6xrfUb06E/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 7,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': 'XA6xrfUb06E'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/W3jwP9bwt7rR8kbsGmL-6cmB1FM"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjBDQUFGQkVCNjc5M0QwQzU=',
          'snippet': {
            'publishedAt': '2008-07-17T22:48:17.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - Overworld 1 Theme',
            'description': 'The next track in this BGM anthology.\r\n'
              + '\r\nThis is my second fav Overworld Theme fromthe NES SMB series, behind the SMB2 Overworld.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/Q_saM7I20pY/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/Q_saM7I20pY/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/Q_saM7I20pY/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 8,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': 'Q_saM7I20pY'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/S3IobnsVsjYZVb_82cABhdrNpX8"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjA3MDI4REM4MEVFNzEyNTA=',
          'snippet': {
            'publishedAt': '2008-07-17T22:48:17.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - Overworld 2 Theme',
            'description': 'The next track in this BGM anthology.\r\n\r\nThis is my least fav Overworld but it\'s still very good.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/5wApmRF5gyM/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/5wApmRF5gyM/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/5wApmRF5gyM/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 9,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': '5wApmRF5gyM'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/vcE7iGv5I2h33hjmu5mx7zNTctg"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLkVGRDI4NDFDMDhGOEYwMjM=',
          'snippet': {
            'publishedAt': '2008-07-17T22:48:17.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - Underwater Theme',
            'description': 'The next track in this BGM anthology.\r\n' +
              '\r\nThis cooler but not as classic as the underwater theme from SMB1.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/icKfm1MsTxE/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/icKfm1MsTxE/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/icKfm1MsTxE/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 10,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': 'icKfm1MsTxE'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/qKIhebUTVy_ctAiUh9gRJnBY69I"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjY3NzUyMjZFRjU1RDhFMzU=',
          'snippet': {
            'publishedAt': '2008-07-19T16:18:15.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - Underworld Theme',
            'description': 'The next track in this BGM anthology.\r\n\r\nA remix of the SMB1 underworld Theme.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/TmnZgBpYG_4/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/TmnZgBpYG_4/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/TmnZgBpYG_4/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 11,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': 'TmnZgBpYG_4'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/5OKKz5S5fTFwtXy_q_uFwyxdMQo"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjMzQTFFQzM4RDZENzZCNzk=',
          'snippet': {
            'publishedAt': '2008-07-19T17:33:08.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - Warp Zone Theme',
            'description': 'The next track in this BGM anthology.\r\n' +
              '\r\nThis also plays when you go to the secret coin heavens. Cool little chillout track.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/EOg0GZZuCak/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/EOg0GZZuCak/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/EOg0GZZuCak/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 12,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': 'EOg0GZZuCak'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/9SyVu3PJuSazNrOdxWG2-CJpcZc"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLkM2MkU1QkY2REUzMzhBNDM=',
          'snippet': {
            'publishedAt': '2008-07-19T17:33:08.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - Starman Theme',
            'description': 'The next track in this BGM anthology.\r\n\r\n' +
              'The same as the SMB1 and SMB2 one with a litlle snare and cymbal sample added in.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/w3FhYeqX4aU/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/w3FhYeqX4aU/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/w3FhYeqX4aU/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 13,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': 'w3FhYeqX4aU'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/o-aNpbVqRSOo7DF6ofCTgtGMYos"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjhCRTNFOTdBRTIxREYzMDc=',
          'snippet': {
            'publishedAt': '2008-07-19T17:33:08.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - Warp Whistle Theme',
            'description': 'The next track in this BGM anthology.\r\n\r\n' +
              'The quick snippet that plays while the Warp Tornado brings you to the Warp Zone.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/v4HCJ1Cedxk/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/v4HCJ1Cedxk/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/v4HCJ1Cedxk/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 14,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': 'v4HCJ1Cedxk'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/CFX7-BL6pe05IeycMVtpPGtyi2Q"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLkJDMDJGRjI5MEIyQUQ3NDc=',
          'snippet': {
            'publishedAt': '2008-07-19T17:33:08.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - Music Box Theme',
            'description': 'The next track in this BGM anthology.\r\n\r\n' +
              'This is one of the things you can get from a Hammer Bros. fight.' +
              ' It plays a slower and more 8-bit sounding version of the SMB1 overworld.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/nWDSwqu5r2Y/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/nWDSwqu5r2Y/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/nWDSwqu5r2Y/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 15,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': 'nWDSwqu5r2Y'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/j81CaV8rTqfF3gOnRsvfwMNL97o"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjUwMzRGNTNGQjk0OUU3OTg=',
          'snippet': {
            'publishedAt': '2008-07-19T17:33:08.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - Spade Panel Theme',
            'description': 'The next track in this BGM anthology.\r\n\r\n' +
              'This is the song that plays during your run at a Spade Panel Theme. ' +
              'Spade Panels are the places where you play memory matching and slot machine style matching.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/YZFxVDyB0xw/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/YZFxVDyB0xw/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/YZFxVDyB0xw/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 16,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': 'YZFxVDyB0xw'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/IvRxbeAu19UwdsgyQKqqBVMq0cg"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLkE1Qjg0NzBBNDA4RTA2NkI=',
          'snippet': {
            'publishedAt': '2008-07-19T17:33:08.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - Toad\'s House Theme',
            'description': 'The next track in this BGM anthology.\r\n\r\n' +
              'With three chests a visit, Toad\'s House is a surprise every time you go in there.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/3Tf2hgrnw2M/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/3Tf2hgrnw2M/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/3Tf2hgrnw2M/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 17,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': '3Tf2hgrnw2M'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/4A2QgHnRVAwqLFYbyRhsJ4hvJcQ"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLkY5OEI2MzEwM0E5MTQ5QTg=',
          'snippet': {
            'publishedAt': '2008-07-19T17:33:08.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - Fortress Theme',
            'description': 'The next track in this BGM anthology.\r\n\r\n' +
              'With a Koopa Kid in every Fortress it just might be the most challeenging part of the game, next to the Airships.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/wEc6-RUYVoE/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/wEc6-RUYVoE/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/wEc6-RUYVoE/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 18,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': 'wEc6-RUYVoE'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/ikuw-dYied2H1ARGUEuvItfCTa4"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjlCQ0I0N0E0OTY1ODIwMTM=',
          'snippet': {
            'publishedAt': '2008-07-19T17:33:08.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - Hammer Bros. Battle Theme',
            'description': 'The next track in this BGM anthology.\r\n\r\nMy fav track from the SMB3 anthology.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/0-INuS99s5Q/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/0-INuS99s5Q/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/0-INuS99s5Q/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 19,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': '0-INuS99s5Q'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/yXtpn64bF9Pkn3tT_ubXRL5E7jc"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjA0MjI4NjFDQTBBNzA1QTM=',
          'snippet': {
            'publishedAt': '2008-07-19T17:33:08.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - King Theme',
            'description': 'The next track in this BGM anthology.\r\n\r\n' +
              'This is what plays when Toad tells you the HORRIBLE NEWS ' +
              'about how the king has been transformed. Then you have to do a bunch of crap.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/vwk9mrE-cFA/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/vwk9mrE-cFA/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/vwk9mrE-cFA/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 20,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': 'vwk9mrE-cFA'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/fLzQGisOKeRkItjzatJnC6QjO0I"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLkJBRjhENDEyNEYzREYwOTY=',
          'snippet': {
            'publishedAt': '2008-07-19T17:33:08.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - Airship Theme',
            'description': 'The next track in this BGM anthology.\r\n\r\n' +
              'Koopalings roam these parks...and Airships are known to be devilish.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/Uh0OKW5cwVo/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/Uh0OKW5cwVo/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/Uh0OKW5cwVo/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 21,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': 'Uh0OKW5cwVo'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/HcJUZbG8cTg1XAPjFScVRDSASfM"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLkYwRTJBNEEwOUM4OUFERjQ=',
          'snippet': {
            'publishedAt': '2008-07-19T17:33:08.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - Koopa Kid Battle Theme',
            'description': 'The next track in this BGM anthology.\r\n\r\n' +
              'Koopalings and Koopa Kids rule Fortress\' and Airships and there' +
              ' has to be a tune liable enough to handle that many fights.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/03gX-re5C9g/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/03gX-re5C9g/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/03gX-re5C9g/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 22,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': '03gX-re5C9g'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/POJwK19LS3ghjxU_5Zq3y4zM1nM"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLkFDODVDQ0FEODk0NDNGODk=',
          'snippet': {
            'publishedAt': '2008-07-19T17:33:08.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - Victory Fanfare',
            'description': 'The next track in this BGM anthology.\r\n\r\n' +
              'When you get three of the same Card in a row this tune plays.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/5fZJLyJyPKQ/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/5fZJLyJyPKQ/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/5fZJLyJyPKQ/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 23,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': '5fZJLyJyPKQ'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/3TQeFV5tCTAlJVm8cUmx0_7-0sQ"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjYyRDA5N0Y1ODc1RkE3N0Q=',
          'snippet': {
            'publishedAt': '2008-07-19T17:33:08.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - King Restored Fanfare',
            'description': 'The next track in this BGM anthology.\r\n\r\n' +
              'When you find the wand, transform the king, this ong plays. Its a HAPPY HAPPY HAPPY HAPPY HAPPY HAPPY SONG!',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/Wj022XKwbp0/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/Wj022XKwbp0/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/Wj022XKwbp0/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 24,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': 'Wj022XKwbp0'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/vP6M3tucb9dtSDp1iA53p-W-F-0"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjMzRTdDMjEyQkQ1NDk0RkM=',
          'snippet': {
            'publishedAt': '2008-07-19T18:21:36.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - Course Clear Fanfare',
            'description': 'The next track in this BGM anthology.\r\n\r\nWhen you beat a course, this kinky tune plays.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/sE0xXjdrx-Q/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/sE0xXjdrx-Q/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/sE0xXjdrx-Q/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 25,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': 'sE0xXjdrx-Q'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/ROYJXwFtlxWM48LsBxqCvSVh4Sk"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjA5NDM3RUI3MkQ2RkJFN0Y=',
          'snippet': {
            'publishedAt': '2008-07-19T18:21:36.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - You\'re Dead Theme',
            'description': 'The next track in this BGM anthology.\r\n\r\nThis is a kinda cool deatht theme.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/OFX8-ctkQqY/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/OFX8-ctkQqY/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/OFX8-ctkQqY/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 26,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': 'OFX8-ctkQqY'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/HpKcMCq_i4LfZNR9EGjikiQrt_w"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjVDQUYwNDIyRDY0MDMwOEU=',
          'snippet': {
            'publishedAt': '2008-07-19T18:21:36.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - Game Over Theme',
            'description': 'The next track in this BGM anthology.\r\n\r\n' +
              'This is another very happy Game Over theme, though not as happy as the SMB2 game over theme,' +
              ' yet not as touching as the SMB1 game over theme.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/FvIVNRmKW9M/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/FvIVNRmKW9M/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/FvIVNRmKW9M/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 27,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': 'FvIVNRmKW9M'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/dvx0oDBRnYjFv3r1LvG24G38yQw"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjFEM0NDMUNBMDVENTA0QUE=',
          'snippet': {
            'publishedAt': '2008-07-19T18:21:36.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - Bowser Battle Theme',
            'description': 'The next track in this BGM anthology.\r\n\r\n' +
              'This Bowser battle is even easier than the SMB1 Bowser battle. And 80x easier than the SMB2 boss fights.',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/h-xih93YIwk/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/h-xih93YIwk/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/h-xih93YIwk/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 28,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': 'h-xih93YIwk'
            }
          }
        },
        {
          'kind': 'youtube#playlistItem',
          'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/02Ozj04Vlcuxb-Awvm2EjJid2kc"',
          'id': 'UEwwMDFBMTAyNENCNDlGNjYxLjk4RTEwQzRFRjAyQjVBQjM=',
          'snippet': {
            'publishedAt': '2008-07-19T18:21:36.000Z',
            'channelId': 'UCenB8W7mKwSnagwi-Uh4ngw',
            'title': 'Super Mario Bros. 3 - Ending Fanfare',
            'description': 'The final track in this BGM anthology. And the final track for all of the Super Mario Bros. Anthology.' +
              '\r\n\r\n' +
              'My rating:\r\n9.5/10\r\n\r\n' +
              'All three games in my opinion were fabulous, even SMB2(despite my lousy rating). ' +
              'Even with my superior gaming skills and impressive reflexes, I still have yet to beat either one of them.\r\n\r\n' +
              'I believe Shigeru Miyamoto is the biggest genius on the planet. ' +
              'His ideas, ranging from Donkey Kong to Zelda to Metroid back to Mario, are some of the greatest ideas ever created.' +
              '\r\n\r\n' +
              'Koji Kondo\'s 8-bit musical composition work is the work of God. ' +
              'The original SMB series, Mario 64, Zelda, NES and SNES series, Ocarina of Time, ' +
              'and many more Japan-exclusive titles have been endowed with incredible music to play along with, ' +
              'making the gameplay of the some of the greatest even more exsquisite.\r\n\r\n' +
              'Mario will live in our hearts for years to come. Nothing could posbbily eclipse the first three Super Mario Bros. ' +
              'games. Even though SMB2 wasn\'t really a Mario game, it will still go down in history as "one of the whitest black ' +
              'sheeps in the video game world."\r\n\r\nI hope you\'ve played all the games yourself and endeavoured the maticulously ' +
              'well-designed levels and gameplay. All these games have set the standard for some of the biggest games of our time. ' +
              'Castlevania is probably the most obvious. With SMB1-like jumps and obstacles, SMB2-like enemies and bosses,' +
              ' and SMB3-like level design.\r\n\r\nALL HAIL MARIO!\r\n\r\n' +
              'NOTE: I did put in a slight slideshow for you to enjoy. There\'s a thing at the very end that will make you laugh. ' +
              'No, it\'s not a screamer.\r\n\r\nAll of this music has been composed by Koji Kondo.\r\n\r\n' +
              'All three games have been directed by Shigeru Miyamoto.\r\n\r\n' +
              'All games and music are direct copyrgihts of Nintendo. ' +
              'No copyright infringement was meant by uploading the BGM of SMB1, SMB2, and SMB3.\r\n\r\n' +
              'DISCLAIMER: Any problems you have with anything about copyright and/or quality issues of these videos please contact' +
              ' me at daftpunkenstein@yahoo.com\r\n\r\nHEEEEEEEEE!',
            'thumbnails': {
              'default': {
                'url': 'https://i.ytimg.com/vi/cQWKjnnhKn8/default.jpg',
                'width': 120,
                'height': 90
              },
              'medium': {
                'url': 'https://i.ytimg.com/vi/cQWKjnnhKn8/mqdefault.jpg',
                'width': 320,
                'height': 180
              },
              'high': {
                'url': 'https://i.ytimg.com/vi/cQWKjnnhKn8/hqdefault.jpg',
                'width': 480,
                'height': 360
              }
            },
            'channelTitle': 'DAFTPUNKletlive',
            'playlistId': 'PL001A1024CB49F661',
            'position': 29,
            'resourceId': {
              'kind': 'youtube#video',
              'videoId': 'cQWKjnnhKn8'
            }
          }
        }
      ]
    },
    paginationInfosOfVideo: {
      'videos': {
        'kind': 'youtube#videoListResponse',
        'etag': '"gMxXHe-zinKdE9lTnzKu8vjcmDI/Zx1YbTaAGfYlB4pRIbAZOpXePDg"',
        'pageInfo': {
          'totalResults': 1,
          'resultsPerPage': 1
        },
        'items': [
          {
            'kind': 'youtube#video',
            'etag': '"gMxXHe-zinKdE9lTnzKu8vjcmDI/SI0G1UjnH0RHDpsVx98JDthHDCc"',
            'id': 'Dg0IjOzopYU',
            'snippet': {
              'publishedAt': '2015-02-10T02:34:24.000Z',
              'channelId': 'UCMXnhfrYrY61tN3v0GmgoJQ',
              'title': 'Minecraft FULL SOUNDTRACK (2016)',
              'description': 'The complete Minecraft soundtrack, composed by C418.\n\n0:00 - Key\n' +
                '1:04 - Subwoofer Lullaby\n4:40 - Living Mice\n7:30 - Haggstrom\n10:53 - Minecraft\n' +
                '15:08 - Oxygene\n16:14 - Mice on Venus\n21:08 - Dry Hands\n22:04 - Wet Hands\n' +
                '23:34 - Clark\n26:46 - Sweden\n30:21 - Danny\n34:38 - Biome Fest\n40:58 - Blind Spots\n' +
                '46:34 - Haunt Muskie\n52:32 - Aria Math\n57:54 - Dreiton\n1:06:05 - Taswell\n1:14:32 - Mutation\n' +
                '1:17:46 - Moog City 2\n1:20:52 - Beginning 2\n1:23:56 - Floating Trees\n1:28:01 - Concrete Halls\n' +
                '1:32:22 - Dead Voxel\n1:37:24 - Warmth\n1:41:28 - Ballad of the Cats\n1:46:03 - Boss\n1:51:48 - End\n\n' +
                'Support C418 and purchase the soundtrack (Comes with unused, bonus, and music disc tracks not featured here!)\n\n' +
                'http://c418.bandcamp.com/album/minecraft-volume-alpha\nhttp://c418.bandcamp.com/album/minecraft-volume-beta',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/Dg0IjOzopYU/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/Dg0IjOzopYU/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/Dg0IjOzopYU/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                },
                'standard': {
                  'url': 'https://i.ytimg.com/vi/Dg0IjOzopYU/sddefault.jpg',
                  'width': 640,
                  'height': 480
                }
              },
              'channelTitle': 'Luigi',
              'tags': [
                'minecraft',
                'minecraft music',
                'minecraft soundtrack',
                'minecraft full soundtrack',
                'minecraft 1.7.2 music',
                'minecraft volume alpha',
                'volume alpha',
                'volume beta',
                'minecraft volume beta',
                'minecraft ost',
                'minecraft theme',
                'calm1',
                'minecraft c418',
                'c418',
                'minecraft sweden',
                'minecraft video',
                'minecraft full ost',
                'minecraft all music',
                'minecraft soundtrack download',
                'c418 volume alpha',
                'c418 volume beta',
                'aria math',
                'minecraft creative mode music',
                'minecraft nether music'
              ],
              'categoryId': '10',
              'liveBroadcastContent': 'none',
              'localized': {
                'title': 'Minecraft FULL SOUNDTRACK (2016)',
                'description': 'The complete Minecraft soundtrack, composed by C418.\n\n' +
                  '0:00 - Key\n1:04 - Subwoofer Lullaby\n4:40 - Living Mice\n7:30 - Haggstrom\n10:53 - Minecraft\n15:08 - Oxygene\n' +
                  '16:14 - Mice on Venus\n21:08 - Dry Hands\n22:04 - Wet Hands\n23:34 - Clark\n26:46 - Sweden\n30:21 - Danny\n' +
                  '34:38 - Biome Fest\n40:58 - Blind Spots\n46:34 - Haunt Muskie\n52:32 - Aria Math\n57:54 - Dreiton\n' +
                  '1:06:05 - Taswell\n1:14:32 - Mutation\n1:17:46 - Moog City 2\n1:20:52 - Beginning 2\n1:23:56 - Floating Trees\n' +
                  '1:28:01 - Concrete Halls\n1:32:22 - Dead Voxel\n1:37:24 - Warmth\n1:41:28 - Ballad of the Cats\n1:46:03 - Boss\n' +
                  '1:51:48 - End\n\n' +
                  'Support C418 and purchase the soundtrack (Comes with unused, bonus, and music disc tracks not featured here!)\n\n' +
                  'http://c418.bandcamp.com/album/minecraft-volume-alpha\nhttp://c418.bandcamp.com/album/minecraft-volume-beta'
              }
            }
          }
        ]
      },
      'braveheart': {
        'kind': 'youtube#videoListResponse',
        'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/h7ZWWjYdA_7iQ-_2RZawDxcYh8s"',
        'pageInfo': {
          'totalResults': 1,
          'resultsPerPage': 1
        },
        'items': [
          {


            'kind': 'youtube#video',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/4m6APd8qZEnw3HSpN23MN60EuTM"',
            'id': 'S7end66UPiI',
            'snippet': {
              'publishedAt': '2014-02-06T15:48:06.000Z',
              'channelId': 'UCCvOdzng6XDd-V3OCCFufrw',
              'title': 'Braveheart soundtrack',
              'description': 'Track listing:\n\n\n' +
                '"Copyright Disclaimer Under Section 107 of the Copyright Act 1976, allowance is made for "fair use" for purposes' +
                ' such as criticism, comment, news reporting, teaching, scholarship, and research. Fair use is a use permitted' +
                ' by copyright statute that might otherwise be infringing. Non-profit, educational or personal use tips the balance' +
                ' in favor of fair use"\n\n\nFrom the movie "Braveheart".Composed by James Horner.\n\n\n' +
                'CD 1\n0:00:00 - 01. Prelude\n0:00:44 - 02. Main Title\n0:03:34 - 03. The Barn\n0:04:26 - 04. I Can Fight\n' +
                '0:05:12 - 05. Death in the Wallace Family\n0:07:54 - 06. A Gift of a Thistle\n' +
                '0:09:31 - 07. Outlawed Tunes On Outlawed Pipes\n0:11:32 - 08. Leaving Home\n0:11:55 - 09. The Royal Wedding\n' +
                '0:13:33 - 10. Returning Home\n0:14:47 - 11. Scottish Wedding Music 1\n0:16:00 - 12. Scottish Wedding Music 2\n' +
                '0:16:52 - 13. Prima Nnoctes\n0:18:35 - 14. Wallace Courts Murron\n0:22:59 - 15. The Secret Wedding\n' +
                '0:29:30 - 16. Attack On Murron\n0:32:28 - 17. Revenge\n0:38:49 - 18. Murron\'s Burial\n' +
                '0:41:00 - 19. Retaliation\n0:41:43 - 20. The King Vengeance\n0:43:51 - 21. The Fighting Continues\n' +
                '0:44:11 - 22. Making Plains - Gathering the Clans\n0:46:03 - 23. Sons of Scotland\n' +
                '0:52:20 - 24. The Battle of Stirling\n0:53:55 - 25. Battle Temptation\n0:54:18 - 26. Heavy Horse\nCD 2\n' +
                '0:56:16 - 01. Sir William\n0:58:38 - 02. Invasion of England\n0:59:54 - 03. Vision of Murron\n' +
                '1:01:39 - 04. Meeting with the Princess\n1:03:24 - 05. Longshank\'s Surprise\n1:04:55 - 06. March to Edinburgh\n' +
                '1:05:50 - 07. Falkirk\n1:09:52 - 08. Betrayal & Desolation\n1:16:12 - 09. Lament\n1:17:39 - 10. Mornay\'s Dream\n' +
                '1:18:54 - 11. The Legend Spreads\n1:20:01 - 12. Ambushed Ambush\n' +
                '1:21:00 - 13. For the Love of a Princess (film version)\n1:23:12 - 14. For the Love of a Princess (album version)\n' +
                '1:27:17 - 15. The Trap\n1:28:55 - 16. The Princess Pleads for Wallace\'s Life\n1:32:30 - 17. Through the Crowd\n' +
                '1:33:47 - 18. The Execution\n1:37:29 - 19. Bannockburn\n1:41:06 - 20. End Credits\n1:48:15 - 21. Johnny Cope (bonus)\n' +
                '1:51:15 - 22. Glendaural (bonus)\n1:55:06 - 23. Scotland the Brave (bonus)\n1:57:54 - 24. Leaving Glenhurqhart (bonus)\n' +
                '2:01:26 - 25. Kirkhill (bonus',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/S7end66UPiI/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/S7end66UPiI/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/S7end66UPiI/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                },
                'standard': {
                  'url': 'https://i.ytimg.com/vi/S7end66UPiI/sddefault.jpg',
                  'width': 640,
                  'height': 480
                },
                'maxres': {
                  'url': 'https://i.ytimg.com/vi/S7end66UPiI/maxresdefault.jpg',
                  'width': 1280,
                  'height': 720
                }
              },
              'channelTitle': 'Henry Fire',
              'categoryId': '10',
              'liveBroadcastContent': 'none',
              'localized': {
                'title': 'Braveheart soundtrack',
                'description': 'Track listing:\n\n\n' +
                  '"Copyright Disclaimer Under Section 107 of the Copyright Act 1976, allowance is made for "fair use" for purposes' +
                  ' such as criticism, comment, news reporting, teaching, scholarship, and research. Fair use is a use permitted by' +
                  ' copyright statute that might otherwise be infringing. Non-profit, educational or personal use tips the balance' +
                  ' in favor of fair use"\n\n\nFrom the movie "Braveheart".Composed by James Horner.\n\n\nCD 1\n' +
                  '0:00:00 - 01. Prelude\n0:00:44 - 02. Main Title\n0:03:34 - 03. The Barn\n0:04:26 - 04. I Can Fight\n' +
                  '0:05:12 - 05. Death in the Wallace Family\n0:07:54 - 06. A Gift of a Thistle\n' +
                  '0:09:31 - 07. Outlawed Tunes On Outlawed Pipes\n0:11:32 - 08. Leaving Home\n0:11:55 - 09. The Royal Wedding\n' +
                  '0:13:33 - 10. Returning Home\n0:14:47 - 11. Scottish Wedding Music 1\n0:16:00 - 12. Scottish Wedding Music 2\n' +
                  '0:16:52 - 13. Prima Nnoctes\n0:18:35 - 14. Wallace Courts Murron\n0:22:59 - 15. The Secret Wedding\n' +
                  '0:29:30 - 16. Attack On Murron\n0:32:28 - 17. Revenge\n0:38:49 - 18. Murron\'s Burial\n0:41:00 - 19. Retaliation\n' +
                  '0:41:43 - 20. The King Vengeance\n0:43:51 - 21. The Fighting Continues\n' +
                  '0:44:11 - 22. Making Plains - Gathering the Clans\n0:46:03 - 23. Sons of Scotland\n' +
                  '0:52:20 - 24. The Battle of Stirling\n0:53:55 - 25. Battle Temptation\n0:54:18 - 26. Heavy Horse\nCD 2\n' +
                  '0:56:16 - 01. Sir William\n0:58:38 - 02. Invasion of England\n0:59:54 - 03. Vision of Murron\n' +
                  '1:01:39 - 04. Meeting with the Princess\n1:03:24 - 05. Longshank\'s Surprise\n1:04:55 - 06. March to Edinburgh\n' +
                  '1:05:50 - 07. Falkirk\n1:09:52 - 08. Betrayal & Desolation\n1:16:12 - 09. Lament\n1:17:39 - 10. Mornay\'s Dream\n' +
                  '1:18:54 - 11. The Legend Spreads\n1:20:01 - 12. Ambushed Ambush\n' +
                  '1:21:00 - 13. For the Love of a Princess (film version)\n1:23:12 - 14. For the Love of a Princess (album version)\n' +
                  '1:27:17 - 15. The Trap\n1:28:55 - 16. The Princess Pleads for Wallace\'s Life\n1:32:30 - 17. Through the Crowd\n' +
                  '1:33:47 - 18. The Execution\n1:37:29 - 19. Bannockburn\n1:41:06 - 20. End Credits\n' +
                  '1:48:15 - 21. Johnny Cope (bonus)\n1:51:15 - 22. Glendaural (bonus)\n1:55:06 - 23. Scotland the Brave (bonus)\n' +
                  '1:57:54 - 24. Leaving Glenhurqhart (bonus)\n2:01:26 - 25. Kirkhill (bonus'
              }
            }
          }
        ]
      },
      'leGrandBleu': {
        'kind': 'youtube#videoListResponse',
        'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/khheNPQa9mYJNXsP0USt9gjbXWk"',
        'pageInfo': {
          'totalResults': 1,
          'resultsPerPage': 1
        },
        'items': [
          {
            'kind': 'youtube#video',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/S-Uto_gCznCU2OXfCrPQEWq0Lvc"',
            'id': '8J5ptf0POnA',
            'snippet': {
              'publishedAt': '2012-11-08T01:51:39.000Z',
              'channelId': 'UCLX6EMl4KC8WsxFWmsSO7wA',
              'title': 'Eric Serra - Le Grand Bleu - Soundtrack',
              'description': 'http://www.discogs.com/Eric-Serra-The-Big-Blue-Original-Motion-Picture-Soundtrack/master/74022\n\n' +
                'FAIR USE NOTICE: This video may contain copyrighted material. Such material is made available for educational ' +
                'purposes only. This constitutes a \'fair use\' of any such copyrighted material as provided for in Title 17 U.S.C. ' +
                'section 107 of the US Copyright Law.\n\nIn other words All credits goes to the Magnificent Eric Serra.',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/8J5ptf0POnA/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/8J5ptf0POnA/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/8J5ptf0POnA/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                },
                'standard': {
                  'url': 'https://i.ytimg.com/vi/8J5ptf0POnA/sddefault.jpg',
                  'width': 640,
                  'height': 480
                }
              },
              'channelTitle': 'OnenessAmbassador',
              'tags': [
                'The Big Blue (Film)',
                'Le Grand Bleu',
                'Eric Serra',
                'Album',
                'Soundtrack',
                'Luc Besson'
              ],
              'categoryId': '10',
              'liveBroadcastContent': 'none',
              'localized': {
                'title': 'Eric Serra - Le Grand Bleu - Soundtrack',
                'description': 'http://www.discogs.com/Eric-Serra-The-Big-Blue-Original-Motion-Picture-Soundtrack/master/74022\n\n' +
                  'FAIR USE NOTICE: This video may contain copyrighted material. Such material is made available for educational ' +
                  'purposes only. This constitutes a \'fair use\' of any such copyrighted material as provided for in Title 17 U.S.C. ' +
                  'section 107 of the US Copyright Law.\n\nIn other words All credits goes to the Magnificent Eric Serra.'
              }
            },
            'contentDetails': {
              'duration': 'PT57M22S',
              'dimension': '2d',
              'definition': 'sd',
              'caption': 'false',
              'licensedContent': false,
              'regionRestriction': {
                'blocked': [
                  'IT'
                ]
              },
              'projection': 'rectangular'
            }
          }
        ]
      },
      'unIndienDansLaVille': {
        'kind': 'youtube#videoListResponse',
        'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/JXGwhTnbQbI5l76uQB95PJGl9nA"',
        'pageInfo': {
          'totalResults': 1,
          'resultsPerPage': 1
        },
        'items': [
          {
            'kind': 'youtube#video',
            'etag': '"m2yskBQFythfE4irbTIeOgYYfBU/SklJ97LhiVdu91xil33vyQVZXd4"',
            'id': 'g4hleRuajmY',
            'snippet': {
              'publishedAt': '2014-06-26T16:51:52.000Z',
              'channelId': 'UCAYW5uFmfWAYtZGJwYHN43Q',
              'title': 'K.O.D. - Un Indien Dans La Ville Soundtrack (1994) - FULL ALBUM',
              'description': '01 Geoffrey Oryema - Un Indien Dans La Ville\n' +
                '02 Manu Katché, Geoffrey Oryema & Tonton David - Chacun Sa Route 05:14\n' +
                '03 Manu Katché & Geoffrey Oryema - Mother & Father 08:16\n' +
                '04 Manu Katché, Geoffrey Oryema & Tonton David - Sunshine 12:03\n' +
                '05 Hello You 17:13\n06 Manu Katché & Tonton David - La Misére 21:34\n' +
                '07 Manu Katché & Geoffrey Oryema - You And I 25:45\n08 Douce Enfance 29:57\n09 Innocence 31:29\n' +
                '10 Manu Katché, Geoffrey Oryema & Tonton David - Veillée 37:50\n' +
                '11 Manu Katché, Geoffrey Oryema & Tonton David - Chacun Sa Route (Club Remix) 41:37\n' +
                '12 Tonton David - La Misére (Club Remix) 46:37\n\nK.O.D. is: Manu Katché, Geoffrey Oryema & Tonton David\n\n' +
                'http://musique.fnac.com/a622094/Tonton-David-Un-indien-dans-la-ville-CD-album',
              'thumbnails': {
                'default': {
                  'url': 'https://i.ytimg.com/vi/g4hleRuajmY/default.jpg',
                  'width': 120,
                  'height': 90
                },
                'medium': {
                  'url': 'https://i.ytimg.com/vi/g4hleRuajmY/mqdefault.jpg',
                  'width': 320,
                  'height': 180
                },
                'high': {
                  'url': 'https://i.ytimg.com/vi/g4hleRuajmY/hqdefault.jpg',
                  'width': 480,
                  'height': 360
                },
                'standard': {
                  'url': 'https://i.ytimg.com/vi/g4hleRuajmY/sddefault.jpg',
                  'width': 640,
                  'height': 480
                }
              },
              'channelTitle': 'Tonton Old School',
              'tags': [
                'tonton david chacun sa route',
                'un indian dans la ville soundtrack',
                'tonton david un indien dans la ville soundtrack',
                'tonton david un indien dans la ville',
                'tonton david la misere',
                'kod chacun sa route',
                'tonton david sunshine',
                'princess erika full album',
                'nuttea full album',
                'taxi 2 soundtrack',
                'tonton david full album',
                'manu katche',
                'geoffrey oryema',
                'manu katche un indien dans la ville',
                'geoffrey oryema un indien dans la ville'
              ],
              'categoryId': '24',
              'liveBroadcastContent': 'none',
              'localized': {
                'title': 'K.O.D. - Un Indien Dans La Ville Soundtrack (1994) - FULL ALBUM',
                'description': '01 Geoffrey Oryema - Un Indien Dans La Ville\n' +
                  '02 Manu Katché, Geoffrey Oryema & Tonton David - Chacun Sa Route 05:14\n' +
                  '03 Manu Katché & Geoffrey Oryema - Mother & Father 08:16\n' +
                  '04 Manu Katché, Geoffrey Oryema & Tonton David - Sunshine 12:03\n05 Hello You 17:13\n' +
                  '06 Manu Katché & Tonton David - La Misére 21:34\n07 Manu Katché & Geoffrey Oryema - You And I 25:45\n' +
                  '08 Douce Enfance 29:57\n09 Innocence 31:29\n10 Manu Katché, Geoffrey Oryema & Tonton David - Veillée 37:50\n' +
                  '11 Manu Katché, Geoffrey Oryema & Tonton David - Chacun Sa Route (Club Remix) 41:37\n' +
                  '12 Tonton David - La Misére (Club Remix) 46:37\n\nK.O.D. is: Manu Katché, Geoffrey Oryema & Tonton David\n\n' +
                  'http://musique.fnac.com/a622094/Tonton-David-Un-indien-dans-la-ville-CD-album'
              }
            },
            'contentDetails': {
              'duration': 'PT50M38S',
              'dimension': '2d',
              'definition': 'sd',
              'caption': 'false',
              'licensedContent': false,
              'projection': 'rectangular'
            }
          }
        ]
      }
    }
  }
};
