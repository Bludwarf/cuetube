/**
 * Created by mlavigne on 22/08/2017.
 */

/// <reference path="@types/cuesheet.d.ts" />

class Disc {
    cuesheet: cuesheet.CueSheet;
    _files: Disc.File[] = [];
    index: number = undefined;
    /** pour choisir les vidéos à lire */
    enabled: boolean = true;
    /** Disc-ID dans le format cuesheet */
    discId: string;

    _id: string;

    constructor(srcCuesheet?: cuesheet.CueSheet) {
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

    get files(): Disc.File[] {
        return this._files;
    }

    set files(files: Disc.File[]) {
        throw new Error("Cannot modify files. Use newFile() ou files[i].remove()");
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

    get rem():string [] {
        return this.cuesheet.rem;
    }
    set rem(value: string[]) {
        this.cuesheet.rem = value;
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
        this.rem = this.rem || [];
        // Suppr ancien REM pour cette key
        this.rem = this.rem.filter(rem => rem.indexOf(key + " ") != 0);
        this.rem.push(key + " \"" + value + "\"");
    }

    getRem(key: string): string {
        if (!this.rem)
            return undefined;
        const rem = this.rem.find(aRem => aRem.indexOf(key+" ") == 0);
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

        private _tracks: Track[] = [];

        /** Fixé dès qu'on a trouvé la vidéo sur YouTube */
        public duration: number;

        private _tracksInTime: Track[] = undefined; // cache pour tracksInTime

        /**
         * @param {Disc} disc disque parent
         * @param {number} index index de la piste dans ce fichier
         * @param {cuesheet.File} cuesheetFile File dans le fichier cue tel que parsé par cue-parser
         */
        constructor(public disc: Disc, public index: number, public cuesheetFile: cuesheet.File) {
            if (!this.cuesheetFile) {
                this.cuesheetFile = new cuesheet.File()
            }

            if (this.cuesheetFile.tracks) {
                for (let i = 0; i < this.cuesheetFile.tracks.length; ++i) {
                    let cueTrack = this.cuesheetFile.tracks[i];
                    this.tracks.push(new Disc.Track(this, cueTrack));
                }
            }
        }

        /**
         * @return {Disc.Track[]} piste uniquement présente dans de fichier
         */
        get tracks(): Track[] {
            return this._tracks;
        }

        set tracks(tracks: Track[]) {
            throw new Error("Cannot modify tracks. Use newTrack() ou tracks[i].remove()");
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

        set videoId(value: string) {
            this.name = setParameterByName("v", value, this.name);
        }
        
        newTrack() {
            const tracks = this.disc.tracks;
            const number = tracks.length+1;
            this.disc.cuesheet.newTrack(number, File.DEFAULT_TYPE);
            const cuesheetTrack = this.disc.cuesheet.getCurrentTrack();
            const track = new Disc.Track(this, cuesheetTrack);
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
            this.disc.cuesheet.files.splice(indexInDisc, 1);
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
        public index: number;

        /**
         * @param {Disc.File} file fichier parent
         * @param {cuesheet.Track} cuesheetTrack piste telle que parsée par cue-parser
         */
        constructor(public file: File, public cuesheetTrack: cuesheet.Track) {
            const fileTracks = this.file.tracks;
            this.index = fileTracks.length;

            if (!this.cuesheetTrack) {
                this.cuesheetTrack = new cuesheet.Track(undefined, Disc.File.DEFAULT_TYPE); // number doit être setté manuellement
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
            if (!this.cuesheetTrack.indexes) {
                const index = new cuesheet.Index(); // FIXME : prendre le temps de début de la piste précédente
                index.number = 1;
                this.cuesheetTrack.indexes = [index];
            }
            return this.cuesheetTrack.indexes; // FIXME : time.frame arrive à undfined dans CueService.writeCueFile
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
            if (!time) return 0; // FIXME : prendre la valeur de la piste précédente
            return time.min * 60 + time.sec + time.frame / 75;
        }

        /*set startSeconds(value: number) {
            if (!this.indexes) {
                this.indexes = [];
            }
            if (!this.indexes.length) {
                this.indexes.push(new cuesheet.Index());
            }
            const index = this.indexes[0];
            index.time = new cuesheet.Time(Math.floor(value % 60), Math.floor(value / 60), Math.floor(value % 1 * 75));
        }*/

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
            this.file.cuesheetFile.tracks.splice(indexInFile, 1);

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