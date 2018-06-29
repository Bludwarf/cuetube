/**
 * Created by mlavigne on 22/08/2017.
 */

/// <reference path="@types/cuesheet.d.ts" />
import * as _ from 'underscore';
import {PlayerComponent} from './app/player/player.component';

export class Disc {
    cuesheet: cuesheet.CueSheet;
    _files: Disc.File[] = [];
    index: number = undefined;
    /** pour choisir les vidéos à lire */
  enabled = true;
    /** Disc-ID dans le format cuesheet */
    discId: string;

    _id: string;

  private _nextTracks: number[];

  /** @deprecated déplacer plutôt tout ce qui concerne l'IHM dans un DiscComponent (champs + méthodes) */
  public player: PlayerComponent;

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
    throw new Error('Cannot modify files. Use newFile() ou files[i].remove()');
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
        // Dans le cas d'une playlist on prend le paramètre "list" au lieu de l'id de la 1ère vidéo
        // si disponible
        if (this.files && this.files.length > 1) {
            const src = this.src;
      const listId = getParameterByName('list', src);
            if (listId) {
                return listId;
            }
        }
        return this._id ? this._id : this.videoId;
    }
    set id(value: string) {
        this._id = value;
    }

    /** @return l'id de la 1ère vidéo */
    get videoId(): string {
    if (!this.files || !this.files.length) {
      return undefined;
    }
        return this.files[0].videoId;
    }

    get tracks(): Disc.Track[] {
        let tracks: Disc.Track[] = [];
        if (this.files) {
            this.files.forEach(file => {
                tracks = tracks.concat(file.tracks);
            });
        }
        return tracks;
    }

    get playable(): boolean {
    if (!this.enabled) {
            return false;
    }
        // au moins un track.enabled
        return _.some(this.tracks, (track) => track.enabled);
    }

    get disabledTracks(): Disc.Track[] {
        const tracks: Disc.Track[] = [];
        this.tracks.forEach(track => {
      if (!track.enabled) {
                tracks.push(track);
      }
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
    this.rem = this.rem.filter(rem => rem.indexOf(key + ' ') !== 0);
    this.rem.push(key + ' "' + value + '"');
    }

    getRem(key: string): string {
    if (!this.rem) {
            return undefined;
    }
    const rem = this.rem.find(aRem => aRem.indexOf(key + ' ') === 0);
    if (!rem) {
            return undefined;
    }
        let value = rem.slice(key.length + 1);
    if (value.startsWith('"') && value.endsWith('"')) { value = value.slice(1, -1); }
        return value;
    }

    get src(): string {
    const src = this.getRem('SRC');
    if (src || this.files.length > 1) { return src; }

    if (!this.files || this.files.length === 0) { return undefined; }

        // On peut calculer la source pour les vidéos multipistes
        return this.files[0].name;
    }
    set src(src: string) {
    this.setRem('SRC', src);
    }

    get url(): string {
        return this.src || `https://www.youtube.com/watch?v=${this.id}`; // TODO : créer une méthode dans yth
    }

    set date(date: string) {
    this.setRem('DATE', date);
    }
    get date(): string {
    return this.getRem('DATE');
    }

    get icon(): string {
    if (!this.files || !this.files.length) { return undefined; }
        return this.files[0].icon;
    }


  /**
   * Prochaines pistes en mode aléatoire
   * Note dev : le tableau généré doit toujours pouvoir être modifié en dehors avec un shift()
   */
  get nextTracks(): number[] {

    function generate(discI, shuffled) {
      let nextTracks = discI._nextTracks;
      if (!nextTracks || !nextTracks.length) {
        nextTracks = [];
        if (!discI.tracks || !discI.tracks.length) {
            console.error('Aucune piste dans ce disque', discI);
            throw new Error('Aucune piste dans ce disque');
        }
        discI.tracks.forEach((track) => {
          nextTracks.push(track.number);
        });

        if (shuffled) {
          shuffle(nextTracks);
        }
      }
      return nextTracks;
    }

    // Prochaines pistes pour ce disque (aléatoires)
    if (!this._nextTracks || !this._nextTracks.length) {
      this._nextTracks = generate(this, true);
    }

    return this._nextTracks;
  }

  set nextTracks(value) {
    this._nextTracks = value;
  }

  // disc doit bien être playable avant de lancer nextTrack
  nextTrack(shuffled: boolean, currentTrack: Disc.Track) {

    // On prend la prochaine piste active
    let track = null;

    if (shuffled) {
      while (!track || !track.enabled) {
        const nextTracks = this.nextTracks;
        if (!nextTracks || !nextTracks.length) {
            console.log('Aucune piste disponible sur ce disque');
            return null;
        }
        track = this.tracks[nextTracks.shift() - 1];
      }
    } else {
      if (currentTrack.disc === this) {
        track = currentTrack.next;
      } else {
        track = this.tracks[0];
      }
    }

    return track;
  }

  load() {
    this.enabled = true;
    const track = this.nextTrack(this.player.shuffle, this.player.currentTrack);
    if (track) {
        this.player.loadTrack(track);
    } else {
        alert('Plus aucune piste pour ce disque');
    }
  }

  // FIXM : à déplacer dans DiscComponent
  play() {
    return this.load();
  }

  clickThumb(e) {

    // Ctrl + Click => activer/désactiver disque
    if (e.ctrlKey) {
      return this.enabled = !this.enabled;
    } else if (e.altKey) {
      this.enabled = !this.enabled;
      // Cochage => on décoche tous les autres
      // et vice-versa
      for (let i = 0; i < this.player.discs.length; ++i) {
        const discI = this.player.discs[i];
        if (!discI || discI === this) { continue; }
        discI.enabled = !this.enabled;
      }
    } else {
      return this.openTracklist(e, this);
    }
  }


  // Active uniquement ce CD et le lit tout de suite
  doubleClickThumb(e) {

    this.player.discs.forEach((discI) => {
      if (!discI) { return; }
      discI.enabled = discI === this;
    });

    this.load();
  }

  afterClickThumbCheckbox(e) {
    const input = e.currentTarget;

    // Alt + Click => activer/désactiver tous les autres
    if (e.altKey) {
      // Cochage => on décoche tous les autres
      // et vice-versa
      for (let i = 0; i < this.player.discs.length; ++i) {
        const discI = this.player.discs[i];
        if (!discI || discI === this) { continue; }
        discI.enabled = !input.checked;
      }
    }

    // Maj + click => activer/désactiver tous entre les deux
    if (e.shiftKey) {
      const last = this.player.lastCheckedDisc;
      const startIndex = Math.min(last.index, this.index);
      const endIndex = Math.max(last.index, this.index);
      const updatedDiscs = this.player.discs.slice(startIndex, endIndex + 1);
      updatedDiscs.forEach(function (discI) {
        if (!discI || discI === this) { return; }
        discI.enabled = input.checked;
      });
    }

    // Sauvegarde du dernier click (sans Maj)
    if (!e.shiftKey) {
      this.player.lastCheckedDisc = this;
    }

    e.stopPropagation();
  }

  openTracklist(e, discI) {
    const discThumb = e.currentTarget;
    this.player.toggleTracklist(discThumb.nextElementSibling, discI);
    e.stopPropagation(); // pour ne pas appeler document.onclick
  }

}

export module Disc {

    export class File {

    static DEFAULT_TYPE = 'MP3';

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
        this.cuesheetFile = new cuesheet.File();
            }

            if (this.cuesheetFile.tracks) {
                for (let i = 0; i < this.cuesheetFile.tracks.length; ++i) {
          const cueTrack = this.cuesheetFile.tracks[i];
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
      throw new Error('Cannot modify tracks. Use newTrack() ou tracks[i].remove()');
        }

        /** Exemple `https://www.youtube.com/watch?v=0NiJ4_pPO8o` */
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
      return getParameterByName('v', this.name);
        }

        set videoId(value: string) {
      this.name = setParameterByName('v', value, this.name);
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
      for (const track of this.tracks) {
        if (time <= track.endSeconds) {
          return track;
        }
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
      if (indexInDisc === -1) { return; }

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

        removeTracks(): void {
      const toRemove = [].concat(this.tracks);
            toRemove.forEach(track => {
                track.remove(false);
      });
        }

        /**
         * Désactive toutes les pistes de ce fichier.
         * Si toutes les pistes sont désactivées on désactive aussi le disque
         * @param {boolean} enabled
         */
        set enabled(enabled: boolean) {
            this.tracks.forEach(track => track.enabled = enabled);
            if (!enabled && this.tracks.length === this.disc.tracks.length) {
                this.disc.enabled = false;
            }
        }

        get icon(): string {
            return 'https://img.youtube.com/vi/' + this.videoId + '/default.jpg';
        }

        /**
         * L'image de la vidéo en grande taille pour un fond d'écran
         * @return {string}
         */
        get background(): string {
            return 'https://img.youtube.com/vi/' + this.videoId + '/hqdefault.jpg';
        }
    }

    export class Track {

        public enabled: boolean;

        /** Commence à 0 */
        public index: number;

        /** nombre de lecteur de la piste */
        public played = 0;

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
            this.cuesheetTrack.performer = value != null && value.length ? value : null;
        }

        get indexInTime(): number {
            for (let i = 0; i < this.file.tracksInTime.length; ++i) {
        const track = this.file.tracksInTime[i];
        if (track === this) {
                    return i;
                }
            }
      return -1;
        }

        get disc(): Disc {
            return this.file.disc;
        }

        get startSeconds(): number {
            const time = this.indexes[this.indexes.length - 1].time;
      if (!time) { return 0; } // FIXME : prendre la valeur de la piste précédente
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
        return tracksInTime[indexInTime + 1].startSeconds; // TODO perf OK tracks => tracksInTime ?
            } else if (this.file.duration) {
                return this.file.duration;
            } else {
                // auto apprentissage de la durée du fichier par : $scope.$on("video started")...
        console.warn(`Impossible de connaitre la fin de la piste ${this.number} sans connaitre la durée de son fichier ${this.file.name}`);
        return undefined;
            }
        }

        get next(): Track {
            // Même fichier ?
      if (this.index < this.file.tracks.length - 1) {
                return this.file.tracks[this.index+1];
      } else if (this.file.index < this.file.disc.files.length - 1) { // Même disque ?
                const nextFile = this.file.disc.files[this.file.index + 1];
        if (nextFile.tracks && nextFile.tracks.length) {
                    return nextFile.tracks[0];
            }
      }
            return null;
        }

        /**
         * @param cascade Si on supprime la dernière piste d'un fichier alors le fichier est supprimé
         */
        remove(cascade: boolean = true): void {
            const tracks = this.disc.tracks;
            const indexInDisc = tracks.indexOf(this);
      if (indexInDisc === -1) { return; }

            const indexInFile = this.file.tracks.indexOf(this);
            this.file.tracks.splice(indexInFile, 1);
            this.file.cuesheetFile.tracks.splice(indexInFile, 1);

            // On décale l'index de toutes les pistes suivantes
            for (let i = indexInDisc + 1; i < tracks.length; ++i) {
                const track = tracks[i];
                --track.index;
                --track.number;
            }

            // Fichier vide ? => on supprime le fichier
            if (cascade && this.file.tracks.length === 0) {
                this.file.remove();
            }
        }

    /**
     * Quand coché + alt click =>   coche tous
     *  si décoché + alt click => décoche tous
     */
    afterClickCheckbox(e) {
      const input = e.currentTarget;
      const player = this.disc.player;

      // Alt + Click => activer/désactiver tous les autres
      if (e.altKey) {
        // Cochage => on décoche tous les autres
        // et vice-versa
        const tracks = this.disc.tracks;
        for (let i = 0; i < tracks.length; ++i) {
          const trackI = tracks[i];
          if (!trackI || trackI === this) { continue; }
          trackI.enabled = !input.checked;
        }
      }

      // Maj + click => activer/désactiver tous entre les deux
      if (e.shiftKey) {
        const last = player.lastCheckedTrack;
        const startIndex = Math.min(last.index, this.index);
        const endIndex = Math.max(last.index, this.index);
        const tracks = this.disc.tracks.slice(startIndex, endIndex + 1);
        tracks.forEach(function (trackI) {
          if (!trackI || trackI === this) { return; }
          trackI.enabled = input.checked;
        });
      }

      // Sauvegarde du dernier click (sans Maj)
      if (!e.shiftKey) {
        player.lastCheckedTrack = this;
      }

      e.stopPropagation();
    }

        set min(value: number) {
            this.indexes[0].time.min = value;
        }

        get min(): number {
            return this.indexes[0].time.min;
        }

        set sec(value: number) {
            this.indexes[0].time.sec = value;
        }

        get sec(): number {
            return this.indexes[0].time.sec;
        }
  }
}
