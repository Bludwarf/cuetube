/**
 * Created by mlavigne on 22/08/2017.
 */

/// <reference path="@types/cuesheet.d.ts" />

class Disc {
    cuesheet: cuesheet.CueSheet;
    files: Disc.File[] = [];
    index: number = undefined;
    /** pour choisir les vidéos à lire */
    enabled: boolean = true;
    /** Disc-ID dans le format cuesheet */
    discId: string;

    _id: string;

    constructor(srcCuesheet: cuesheet.CueSheet) {
        this.cuesheet = srcCuesheet;
        if (!srcCuesheet) {
            this.cuesheet = new cuesheet.CueSheet();
        }
        if (this.cuesheet.files) {
            for (let i = 0; i < srcCuesheet.files.length; ++i) {
                const cueFile = this.cuesheet.files[i];
                this.files.push(new Disc.File(this, i, cueFile));
            }
        }
    }

    get title(): string {
        return this.cuesheet.title;
    }
    set title(value: string) {
        this.cuesheet.title = value;
    }

    get performer(): string {
        return this.cuesheet.performer;
    }
    set performer(value: string) {
        this.cuesheet.performer = value;
    }

    get rems():string [] {
        return this.cuesheet.rems;
    }
    set rems(value: string[]) {
        this.cuesheet.rems = value;
    }

    get id() {
        return this._id ? this._id : this.videoId;
    }
    set id(value: string) {
        this._id = value;
    }

    get videoId(): string {
        if (!this.files || !this.files.length) return undefined;
        return this.files[0].videoId;
    }

    get tracks(): Disc.Track[] {
        let tracks = [];
        if (this.files) {
            this.files.forEach(file => {
                tracks = tracks.concat(file.tracks);
            });
        }
        return tracks;
    }

    get playable(): boolean {
        if (!this.enabled)
            return false;
        // au moins un track.enabled
        return _.some(this.tracks, (track) => track.enabled);
    }

    get disabledTracks(): Disc.Track[] {
        const tracks = [];
        this.tracks.forEach(track => {
            if (!track.enabled)
                tracks.push(track);
        });
        return tracks;
    }

    newFile() {
        this.cuesheet.newFile();
        const cuesheetFile = this.cuesheet.getCurrentFile();
        const file = new Disc.File(this, this.files.length, cuesheetFile);
        this.files.push(file);
        return file;
    }

    // TODO : Pour éviter le problème : TypeError: Converting circular structure to JSON
    //noinspection JSUnusedGlobalSymbols
    toJSON(): any {
        return this.cuesheet;
    }

    setRem(key: string, value: any): void {
        this.rems = this.rems || [];
        // Suppr ancien REM pour cette key
        this.rems = this.rems.filter(rem => rem.indexOf(key + " ") != 0);
        this.rems.push(key + " \"" + value + "\"");
    }

    getRem(key: string): string {
        if (!this.rems)
            return undefined;
        const rem = this.rems.find(aRem => aRem.indexOf(key+" ") == 0);
        if (!rem)
            return undefined;
        let value = rem.slice(key.length + 1);
        if (value.startsWith("\"") && value.endsWith("\"")) value = value.slice(1, -1);
        return value;
    }

    get src(): string {
        const src = this.getRem("SRC");
        if (src || this.files.length > 1) return src;

        if (!this.files || this.files.length === 0) return undefined;

        // On peut calculer la source pour les vidéos multipistes
        return this.files[0].name;
    }
    set src(src: string) {
        this.setRem("SRC", src);
    }
}

module Disc {

    export class File {

        static DEFAULT_TYPE = "MP3";

        tracks: Track[] = []; // TODO devrait être en lecture seule

        /** Fixé dès qu'on a trouvé la vidéo sur YouTube */
        public duration: number;

        private _tracksInTime: Track[] = undefined; // cache pour tracksInTime

        constructor(public disc: Disc, public index: number, public cuesheetFile: cuesheet.File) {
            if (!this.cuesheetFile) {
                this.cuesheetFile = new cuesheet.File()
            }

            if (this.cuesheetFile.tracks) {
                for (let i = 0; i < this.cuesheetFile.tracks.length; ++i) {
                    let cueTrack = this.cuesheetFile.tracks[i];
                    this.tracks.push(new Disc.Track(this, i, cueTrack));
                }
            }
        }

        get name(): string {
            return this.cuesheetFile.name;
        }
        set name(value: string) {
            this.cuesheetFile.name = value;
        }

        get type(): string {
            return this.cuesheetFile.type;
        }
        set type(value: string) {
            this.cuesheetFile.type = value;
        }

        get videoId() {
            return getParameterByName("v", this.name);
        }
        
        newTrack() {
            const tracks = this.disc.tracks;
            this.disc.cuesheet.newTrack(tracks.length+1, File.DEFAULT_TYPE);
            const cuesheetTrack = this.disc.cuesheet.getCurrentTrack();
            const track = new Disc.Track (this, tracks.length, cuesheetTrack);
            this.tracks.push(track);
            this._tracksInTime = undefined; // RAZ du cache pour tracksInTime
            return track;
        }

        /**
         * Par défaut : 1ère si avant disque, dernière si après
         * @param time
         * @return {Track}
         */
        getTrackAt(time: number) {
            for (let track of this.tracks) {
                if (time <= track.endSeconds)
                    return track
            }
            return this.tracks[this.tracks.length - 1];
        }

        /**
         * Les pistes ne sont pas toujours triées dans l'ordre chronologique
         */
        get tracksInTime(): Track[] {
            if (!this._tracksInTime) {
                return this._tracksInTime = [].concat(this.tracks);
            }
            this._tracksInTime.sort((t1, t2) => t1.startSeconds - t2.startSeconds);
            return this._tracksInTime;
        }

        remove(): void {
            const files = this.disc.files;
            const indexInDisc = files.indexOf(this);
            if (indexInDisc === -1) return;

            const tracks = this.disc.tracks;

            files.splice(indexInDisc, 1);
            const deletedTracks = this.tracks.length;

            // On décale l'index de toutes les pistes suivantes
            for (let i = indexInDisc; i < tracks.length; ++i) {
                const track = tracks[i];
                track.index -= deletedTracks;
                track.number -= deletedTracks;
            }
        }
    }

    export class Track {

        public enabled: boolean;

        constructor(public file: File, public index: number, public cuesheetTrack: cuesheet.Track) {
            if (!this.cuesheetTrack) {
                console.log(index);
                this.cuesheetTrack = new cuesheet.Track(undefined, Disc.File.DEFAULT_TYPE); // number doit être setté manuellement
                _.extend(this.cuesheetTrack, {
                    number: index + 1
                });
            } else {
                // Clean du title si vide pour avoir "Track #" par défaut
                if (this.cuesheetTrack.title != null && !this.cuesheetTrack.title.trim()) {
                    this.cuesheetTrack.title = null;
                }
            }
            this.enabled = this.file.disc.enabled;
        }

        /** Numéro de la piste parmi toutes les pistes du disque (commence à 1) */
        get number(): number {
            return this.cuesheetTrack.number;
        }
        set number(value: number) {
            this.cuesheetTrack.number = value;
        }
        get title(): string {
            return this.cuesheetTrack.title;
        }
        set title(value: string) {
            this.cuesheetTrack.title = value;
        }
        get indexes(): cuesheet.Index[] {
            return this.cuesheetTrack.indexes;
        }
        set indexes(value: cuesheet.Index[]) {
            this.cuesheetTrack.indexes = value;
        }
        get performer(): string {
            return this.cuesheetTrack.performer;
        }
        set performer(value: string) {
            this.cuesheetTrack.performer = value;
        }

        get indexInTime(): number {
            for (let i = 0; i < this.file.tracksInTime.length; ++i) {
                let track = this.file.tracksInTime[i];
                if (track == this) {
                    return i;
                }
            }
            return -1
        }

        get disc(): Disc {
            return this.file.disc;
        }

        get startSeconds(): number {
            const time = this.indexes[this.indexes.length - 1].time;
            return time.min * 60 + time.sec + time.frame / 75;
        }

        get endSeconds(): number {
            const tracksInTime = this.file.tracksInTime;
            const indexInTime = this.indexInTime;
            if (indexInTime + 1 < tracksInTime.length) {
                return tracksInTime[indexInTime + 1].startSeconds // TODO perf OK tracks => tracksInTime ?
            } else if (this.file.duration) {
                return this.file.duration;
            } else {
                // auto apprentissage de la durée du fichier par : $scope.$on("video started")...
                console.warn("Impossible de connaitre la fin de la piste #{this.number} sans connaitre la durée de son fichier #{this.file.name}");
                return undefined
            }
        }

        get next(): Track {
            // Même fichier ?
            if (this.index < this.file.tracks.length - 1)
                return this.file.tracks[this.index+1];
            // Même disque ?
            else if (this.file.index < this.file.disc.files.length - 1) {
                const nextFile = this.file.disc.files[this.file.index + 1];
                if (nextFile.tracks && nextFile.tracks.length)
                    return nextFile.tracks[0];
            }
            return null;
        }

        /** Si on supprime la dernière piste d'un fichier alors le fichier est supprimé */
        remove(): void {
            const tracks = this.disc.tracks;
            const indexInDisc = tracks.indexOf(this);
            if (indexInDisc === -1) return;

            const indexInFile = this.file.tracks.indexOf(this);
            this.file.tracks.splice(indexInFile, 1);

            // On décale l'index de toutes les pistes suivantes
            for (let i = indexInDisc; i < tracks.length; ++i) {
                const track = tracks[i];
                --track.index;
                --track.number;
            }

            // Fichier vide ? => on supprime le fichier
            if (this.file.tracks.length === 0) {
                this.file.remove();
            }
        }
    }
}