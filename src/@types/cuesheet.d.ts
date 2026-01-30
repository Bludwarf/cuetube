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
        rem: string[];

        getCurrentFile(): File;
        getCurrentTrack(): Track;
        newFile(): CueSheet;

        /**
         * Ne pas utiliser si on souhaite ajouter une piste dans un fichier qui n'est pas le fichier courant (getCurrentFile).
         * Dans ce cas, utiliser plutôt Disc.File.newTrack
         */
        newTrack(number?: number, type?: string): CueSheet;
    }

    class File {
        name: string;
        type: string;
        tracks: Track[];
        rem: string[];
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
        rem: string[];

        constructor(number: number, type: string);
    }

    class Index {
        number: number;
        time: Time;

        constructor(number?: number, type?: string);
    }

    class Time {
        min: number;
        sec: number;
        frame: number;

        constructor(min?: number, sec?: number, frame?: number);
    }
}
