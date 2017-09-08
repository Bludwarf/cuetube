/**
 * Created by mlavigne on 22/08/2017.
 */
/// <reference path="@types/cuesheet.d.ts" />
class Disc {
    constructor(srcCuesheet) {
        this._files = [];
        this.index = undefined;
        /** pour choisir les vidéos à lire */
        this.enabled = true;
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
    get files() {
        return this._files;
    }
    set files(files) {
        throw new Error("Cannot modify files. Use newFile() ou files[i].remove()");
    }
    get title() {
        return this.cuesheet.title;
    }
    set title(value) {
        this.cuesheet.title = value;
    }
    get performer() {
        return this.cuesheet.performer;
    }
    set performer(value) {
        this.cuesheet.performer = value;
    }
    get rem() {
        return this.cuesheet.rem;
    }
    set rem(value) {
        this.cuesheet.rem = value;
    }
    get id() {
        return this._id ? this._id : this.videoId;
    }
    set id(value) {
        this._id = value;
    }
    get videoId() {
        if (!this.files || !this.files.length)
            return undefined;
        return this.files[0].videoId;
    }
    get tracks() {
        let tracks = [];
        if (this.files) {
            this.files.forEach(file => {
                tracks = tracks.concat(file.tracks);
            });
        }
        return tracks;
    }
    get playable() {
        if (!this.enabled)
            return false;
        // au moins un track.enabled
        return _.some(this.tracks, (track) => track.enabled);
    }
    get disabledTracks() {
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
    toJSON() {
        return this.cuesheet;
    }
    setRem(key, value) {
        this.rem = this.rem || [];
        // Suppr ancien REM pour cette key
        this.rem = this.rem.filter(rem => rem.indexOf(key + " ") != 0);
        this.rem.push(key + " \"" + value + "\"");
    }
    getRem(key) {
        if (!this.rem)
            return undefined;
        const rem = this.rem.find(aRem => aRem.indexOf(key + " ") == 0);
        if (!rem)
            return undefined;
        let value = rem.slice(key.length + 1);
        if (value.startsWith("\"") && value.endsWith("\""))
            value = value.slice(1, -1);
        return value;
    }
    get src() {
        const src = this.getRem("SRC");
        if (src || this.files.length > 1)
            return src;
        if (!this.files || this.files.length === 0)
            return undefined;
        // On peut calculer la source pour les vidéos multipistes
        return this.files[0].name;
    }
    set src(src) {
        this.setRem("SRC", src);
    }
}
(function (Disc) {
    class File {
        /**
         * @param {Disc} disc disque parent
         * @param {number} index index de la piste dans ce fichier
         * @param {cuesheet.File} cuesheetFile File dans le fichier cue tel que parsé par cue-parser
         */
        constructor(disc, index, cuesheetFile) {
            this.disc = disc;
            this.index = index;
            this.cuesheetFile = cuesheetFile;
            this._tracks = [];
            this._tracksInTime = undefined; // cache pour tracksInTime
            if (!this.cuesheetFile) {
                this.cuesheetFile = new cuesheet.File();
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
        get tracks() {
            return this._tracks;
        }
        // noinspection JSAnnotator
      set tracks(tracks) {
            throw new Error("Cannot modify tracks. Use newTrack() ou tracks[i].remove()");
        }
        get name() {
            return this.cuesheetFile.name;
        }
        set name(value) {
            this.cuesheetFile.name = value;
        }
        get type() {
            return this.cuesheetFile.type;
        }
        set type(value) {
            this.cuesheetFile.type = value;
        }
        get videoId() {
            return getParameterByName("v", this.name);
        }
        newTrack() {
            const tracks = this.disc.tracks;
            const number = tracks.length + 1;
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
        getTrackAt(time) {
            for (let track of this.tracks) {
                if (time <= track.endSeconds)
                    return track;
            }
            return this.tracks[this.tracks.length - 1];
        }
        /**
         * Les pistes ne sont pas toujours triées dans l'ordre chronologique
         */
        get tracksInTime() {
            if (!this._tracksInTime) {
                return this._tracksInTime = [].concat(this.tracks);
            }
            this._tracksInTime.sort((t1, t2) => t1.startSeconds - t2.startSeconds);
            return this._tracksInTime;
        }
        remove() {
            const files = this.disc.files;
            const indexInDisc = files.indexOf(this);
            if (indexInDisc === -1)
                return;
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
    File.DEFAULT_TYPE = "MP3";
    Disc.File = File;
    class Track {
        /**
         * @param {Disc.File} file fichier parent
         * @param {cuesheet.Track} cuesheetTrack piste telle que parsée par cue-parser
         */
        constructor(file, cuesheetTrack) {
            this.file = file;
            this.cuesheetTrack = cuesheetTrack;
            const fileTracks = this.file.tracks;
            this.index = fileTracks.length;
            if (!this.cuesheetTrack) {
                this.cuesheetTrack = new cuesheet.Track(undefined, Disc.File.DEFAULT_TYPE); // number doit être setté manuellement
            }
            else {
                // Clean du title si vide pour avoir "Track #" par défaut
                if (this.cuesheetTrack.title != null && !this.cuesheetTrack.title.trim()) {
                    this.cuesheetTrack.title = null;
                }
            }
            this.enabled = this.file.disc.enabled;
        }
        /** Numéro de la piste parmi toutes les pistes du disque (commence à 1) */
        get number() {
            return this.cuesheetTrack.number;
        }
        set number(value) {
            this.cuesheetTrack.number = value;
        }
        get title() {
            return this.cuesheetTrack.title;
        }
        set title(value) {
            this.cuesheetTrack.title = value;
        }
        get indexes() {
            return this.cuesheetTrack.indexes;
        }
        set indexes(value) {
            this.cuesheetTrack.indexes = value;
        }
        get performer() {
            return this.cuesheetTrack.performer;
        }
        set performer(value) {
            this.cuesheetTrack.performer = value;
        }
        get indexInTime() {
            for (let i = 0; i < this.file.tracksInTime.length; ++i) {
                let track = this.file.tracksInTime[i];
                if (track == this) {
                    return i;
                }
            }
            return -1;
        }
        get disc() {
            return this.file.disc;
        }
        get startSeconds() {
            const time = this.indexes[this.indexes.length - 1].time;
            return time.min * 60 + time.sec + time.frame / 75;
        }
        get endSeconds() {
            const tracksInTime = this.file.tracksInTime;
            const indexInTime = this.indexInTime;
            if (indexInTime + 1 < tracksInTime.length) {
                return tracksInTime[indexInTime + 1].startSeconds; // TODO perf OK tracks => tracksInTime ?
            }
            else if (this.file.duration) {
                return this.file.duration;
            }
            else {
                // auto apprentissage de la durée du fichier par : $scope.$on("video started")...
                console.warn("Impossible de connaitre la fin de la piste #{this.number} sans connaitre la durée de son fichier #{this.file.name}");
                return undefined;
            }
        }
        get next() {
            // Même fichier ?
            if (this.index < this.file.tracks.length - 1)
                return this.file.tracks[this.index + 1];
            else if (this.file.index < this.file.disc.files.length - 1) {
                const nextFile = this.file.disc.files[this.file.index + 1];
                if (nextFile.tracks && nextFile.tracks.length)
                    return nextFile.tracks[0];
            }
            return null;
        }
        /** Si on supprime la dernière piste d'un fichier alors le fichier est supprimé */
        remove() {
            const tracks = this.disc.tracks;
            const indexInDisc = tracks.indexOf(this);
            if (indexInDisc === -1)
                return;
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
    Disc.Track = Track;
})(Disc || (Disc = {}));
//# sourceMappingURL=disc.js.map