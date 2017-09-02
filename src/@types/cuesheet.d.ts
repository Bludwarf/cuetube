/**
 * Created by mlavigne on 22/08/2017.
 */
declare module cuesheet {

    class CueSheet {
        catalog: string;
        cdTextFile: string;
        files: File[];
        performer: string;
        songWriter: string;
        title;
        rems: string[];

        getCurrentFile(): File;
        getCurrentTrack(): Track;
        newFile(): File;
        newTrack(number: number, type: string): Track;
    }

    class File {
        name: string;
        type: string;
        tracks: Track[]
    }

    class Track {
        number: number;
        type: string;
        title: string;
        flags;
        isrc;
        performer: string;
        songWriter: string;
        pregap;
        postgap;
        indexes: Index[];

        constructor(number: number, type: string);
    }

    class Index {
        number: number;
        time: Time;
    }

    class Time {
        min: number;
        sec: number;
        frame: number;
    }
}