import { EventEmitter, Injectable, Output, Directive } from '@angular/core';
import * as _ from 'underscore';
import {Disc} from '../disc';
import {PlayerComponent} from './player/player.component';
import {CurrentPlayerState, SavedDiscPrefs} from '../LocalStorageTypes';
import Track = Disc.Track;
import {LocalStoragePersistence} from '../persistence/LocalStoragePersistence';

const KEY_CURRENT = 'current';
const KEY_TIME = 'time';

@Directive()
@Injectable()
export class LocalStoragePrefsService {

  /** À la sauvegarde d'un disque */
  @Output() discSaved: EventEmitter<string> = new EventEmitter();

  /** À la modif des préférences d'un disque */
  @Output() discPrefsSaved: EventEmitter<string> = new EventEmitter();

  constructor() {
    window.addEventListener('storage', (event) => {

      // Sauvegarde du contenu d'un disque
      const discId = LocalStoragePersistence.getDiscId(event.key);
      if (discId) {
        this.discSaved.emit(discId);
      }

      // Sauvegarde des préférences du disque
      const prefsDiscId = LocalStoragePrefsService.getDiscId(event.key);
      if (prefsDiscId) {
        this.discPrefsSaved.emit(prefsDiscId);
      }
    });
  }

  /** Sauvegarde pour chaque disque la sélection des pistes et les pistes suivantes (aléatoires) */
  saveDiscs(discs: Disc[]): void {
    // Sauvegarde pour chaque disque
    discs.forEach(disc => {
      const discPrefs: SavedDiscPrefs = {};

      if (!disc.enabledByUser) {
        discPrefs.enabledByUser = false;
      }

      const disabledFiles = disc.disabledByYouTubeFiles;
      if (disabledFiles && disabledFiles.length) {
        discPrefs.disabledByYouTubeFileIndices = disabledFiles.map((file) => file.index);
      }

      const disabledTrackIndices = disc.disabledTracks;
      if (disabledTrackIndices && disabledTrackIndices.length) {
        discPrefs.disabledTrackIndices = disabledTrackIndices.map((track) => track.number - 1);
      }

      _.extend(discPrefs, {
        nextTracks: disc.nextTracks
      });

      if (!_.isEmpty(discPrefs)) {
        this.saveDisc(disc.id, discPrefs);
      }
    });
  }

  saveDisc(discId: string, discPrefs: SavedDiscPrefs) {
    this.set(LocalStoragePrefsService.getDiscKey(discId), discPrefs); // Chargé dans loadDisc
  }

  restoreDisc(disc: Disc) {
    if (this.hasDisc(disc.id)) {
      const saved: SavedDiscPrefs = this.getDisc(disc.id);
      console.log(`Préférences pour le disque ${disc.id} "${disc.title}"`, saved);
      // rétrocompa avant #160
      if (saved.enabled !== undefined) {
        disc.enabledByUser = saved.enabled;
      }
      // après #160
      if (saved.enabledByUser !== undefined) {
        disc.enabledByUser = saved.enabledByUser;
      }
      if (saved.disabledByYouTubeFileIndices) {
        const files = disc.files;
        saved.disabledByYouTubeFileIndices.forEach((fileIndex) => {
          files[fileIndex].disabledByYouTube = true;
        });
      }
      if (saved.disabledTrackIndices) {
        const tracks = disc.tracks;
        saved.disabledTrackIndices.forEach((trackIndex) => {
          const track = tracks[trackIndex];
          if (track) {
            track.enabledByUser = false;
          } else {
            console.error(`La piste #${trackIndex + 1} a été désactivée mais elle n'existe plus dans le disque "${disc.title}"`);
          }
        });
      }
      _.extend(disc, {
        nextTracks: saved.nextTracks
      });
    }
  }

  hasDisc(discId: string): boolean {
    return this.has(LocalStoragePrefsService.getDiscKey(discId));
  }

  getDisc(discId: string): SavedDiscPrefs {
    return this.get(LocalStoragePrefsService.getDiscKey(discId));
  }

  static getDiscKey(discId: string): string {
    return 'disc.' + discId;
  }

  static getDiscId(key: string): string {
    const m = key.match(/^disc\.([^.]+)$/);
    return m ? m[0] : undefined;
  }

  /** Préférences pour l'utilisateur */
  savePlayerPrefs(player: PlayerComponent): void {
    localStorage.setItem('shuffle', '' + player.shuffle);
    if (player.repeatMode) {
      localStorage.setItem('repeatMode', player.repeatMode);
    } else {
      localStorage.removeItem('repeatMode');
    }
  }

  restorePlayerPrefs(player: PlayerComponent): void {
    player.shuffle = this.get('shuffle', true);
    player.repeatMode = this.get('repeatMode', '');
  }

  /** État actuel du lecteur hors préférences */
  savePlayerState(player: PlayerComponent): void {
    if (player.currentTrack) {
      const current: CurrentPlayerState = {
        collectionNames: player.getCurrentCollectionNames(),
        discId: player.currentTrack.disc.id,
        fileIndex: player.currentTrack.file.index,
        trackIndex: player.currentTrack.index,
        time: player.slider.value
      };
      this.set('current', current);
    }
    localStorage.setItem('connectedToGoogleDrive', JSON.stringify(player.connectedToGoogleDrive));
  }

  getCurrentPlayerState(): CurrentPlayerState {
    return this.has(KEY_CURRENT) ? this.get(KEY_CURRENT) : undefined;
  }

  isConnectedToGoogleDrive(): boolean {
    return this.get('connectedToGoogleDrive', false);
  }

  saveAllPlayer(player: PlayerComponent): void {
    this.saveDiscs(player.discs);
    this.savePlayerPrefs(player);
    this.savePlayerState(player);
    console.log('Sauvegarde terminée');
  }

  protected has(key: string): boolean {
    return !!localStorage.getItem(key);
  }

  protected get(key: string, defaultValue?: any): any {
    const string = localStorage.getItem(key);
    if (!string) {
      if (defaultValue !== undefined) {
        return defaultValue;
      } else {
        throw new Error(`Cannot get LocalStoragePref "${key}"`);
      }
    }
    if (string === 'true') {
      return true;
    }
    if (string === 'false') {
      return false;
    }
    if (string.match(/^\w/)) {
      return string;
    }
    return JSON.parse(string);
  }

  protected set(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  protected remove(key: string): void {
    localStorage.removeItem(key);
  }

  removeTrack(track: Track) {
    const disc = this.getDisc(track.disc.id);

    // Si le Disc.File a été supprimé (car plus de pistes)
    // TODO

    // Suppression de la piste dans SavedDiscPrefs
    if (disc.disabledTrackIndices) {
      disc.disabledTrackIndices = disc.disabledTrackIndices
        .filter(index => index + 1 !== track.number)
        .map(index => index + 1 > track.number ? index - 1 : index);
    }

    this.saveDisc(track.disc.id, disc);

    // Suppression de la piste dans CurrentPlayerState
    const current = this.getCurrentPlayerState();
    if (current) {
      if (track.file.index === current.fileIndex && track.index === current.trackIndex) {
        this.remove('fileIndex');
        this.remove('trackIndex');
        this.remove(KEY_TIME);
        console.log(`Piste ${track.number} supprimée des préférences`);
      }
    }

    console.log(`Piste ${track.number} supprimée`);
  }

}
