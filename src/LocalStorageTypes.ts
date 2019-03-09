export interface SavedDiscPrefs {
  /** rétrocompa enabledByUser avant #160 */
  enabled?: boolean;

  /** enabled après #160 */
  enabledByUser?: boolean;

  /** index des Disc.File désactivés dans disc.fileComponents */
  disabledByYouTubeFileIndices?: number[];

  /** index des Disc.Track désactivés dans disc.tracks */
  disabledTrackIndices?: number[];

  /** prochaines pistes dans le cas d'une lecture du disque aléatoire */
  nextTracks?: number[];
}

export interface CurrentPlayerState {
  /** ID du disque actuellement lu */
  discId?: string;

  /** index du Disc.File de la piste actuellement lue dans disc.fileComponents */
  fileIndex?: number;

  /** index du Disc.Track de la piste actuellement lue dans disc.tracks */
  trackIndex?: number;

  /** cf Slider.value */
  time?;
}
