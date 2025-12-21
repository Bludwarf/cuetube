///<reference path="../../../node_modules/@types/youtube/index.d.ts"/>
import {AfterViewInit, Component, EventEmitter, NgZone, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {LocalStoragePersistence} from '../../persistence/LocalStoragePersistence';
// import {GoogleDrivePersistence} from '../../persistence/GoogleDrivePersistence';
import {Disc} from '../../disc';
import {Collection} from '../../Collection';
import {Persistence} from '../../persistence';
import {CueService} from '../../CueService';
import * as _ from 'underscore';
import {GapiClientService} from '../gapi-client.service';
import {SliderComponent} from '../slider/slider.component';
import {ytparser} from '../../yt-parser';
import {AppComponent} from '../app.component';
import {HistoryUtils} from '../../HistoryUtils';
import {Location as AngularLocation} from '@angular/common';
import {SubscriptionLike as ISubscription} from 'rxjs';
import {LocalStoragePrefsService} from '../local-storage-prefs.service';
import $ from 'jquery';

const GOOGLE_KEY = 'AIzaSyBOgJtkG7pN1jX4bmppMUXgeYf2vvIzNbE';

const YT_STATES = [
  'ENDED',
  'PLAYING',
  'PAUSED',
  'BUFFERING',
  null,
  'CUED',
];

const DEFAULT_COLLECTION = '_DEFAULT_';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit, AfterViewInit, OnDestroy {

  private cueService: CueService;

  private localPersistence: LocalStoragePersistence;
  // public googleDrivePersistence: GoogleDrivePersistence; // debug
  private persistence: Persistence;

  private discsParam: string;
  private discIds: string[];
  public lastCheckedDisc: Disc;
  public lastCheckedTrack: Disc.Track;
  /** disque ouvert dans la liste des pistes (tooltip) */
  private discInTracklist: Disc;

  /** Toutes les collections indexées par nom de collection */
  private discIdsByCollection: { [key: string]: string[] } = {};

  /**
   * Nom de toutes les collections disponibles
   */
  collectionNames: string[] = [];

  @Output()
  public collectionNamesChange = new EventEmitter<string[]>();

  /**
   * Nom de toutes les collections en cours de lecture
   */
  currentCollectionNames = [];

  @Output()
  public currentCollectionNamesChange = new EventEmitter<string[]>();

  /** Utilisé par la persistance */
  public debugData: any;

  repeatMode: string;

  /** Disques chargés par index */
  public discs: Disc[];

  public shuffle = true;
  public history = [];
  public previousTrack: Disc.Track = null;
  public currentTrack: Disc.Track = null;
  public trackIsLoading = false;
  loadingDiscIndex: number;
  loadingFileIndex: number;

  private player: YT.Player;
  private isInitYT = false;

  /** latence si on passe par this.player.getPlayerStat() */
  isPlaying: boolean = undefined;

  // EVENTS //////////////////////

  @Output() videoStarted: EventEmitter<void> = new EventEmitter();
  @Output() videoPlaying: EventEmitter<void> = new EventEmitter();
  @Output() videoEnded: EventEmitter<void> = new EventEmitter();
  @Output() videoManualSeeked: EventEmitter<void> = new EventEmitter();
  @Output() unstartedVideo: EventEmitter<void> = new EventEmitter();
  @Output() deletedVideo: EventEmitter<void> = new EventEmitter();
  @Output() trackStarted: EventEmitter<void> = new EventEmitter();
  @Output() trackPlaying: EventEmitter<void> = new EventEmitter();

  private fileSlider = {
    min: 0,
    value: 0,
    max: 100
  };
  @ViewChild(SliderComponent, {static: true})
  slider: SliderComponent;

  private lastCheckedTime: number;
  private nextCheckCurrentTime: number;
  /** prochain appel */
  private checkCurrentTimeTimeout;
  private deletedVideoTimeout;

  /** @see YT_STATES */
  private lastPlayerStates: number[] = [];

  public connectedToGoogleDrive = false;

  private lastToggledTracklist;

  // FIXME : à remettre dans le constructeur
  private cuetubeConf = {
    debug: false,
    addDisc: {
      autoplay: true
    }
  };

  private locationSubscription: ISubscription;

  constructor(public http: HttpClient, private gapiClient: GapiClientService, private zone: NgZone, private location: AngularLocation,
              public prefs: LocalStoragePrefsService) {
  }

  ngOnInit() {

    // FIXME pour debugger
    this.enrichWindow((<any>window));

    this.localPersistence = new LocalStoragePersistence(this.http);
    this.persistence = this.getPersistence();
    this.discsParam = getParameterByName('discs', document.location.search);

    // Paramètres
    this.prefs.restorePlayerPrefs(this);
    const current = this.prefs.getCurrentPlayerState();
    if (current) {
      this.slider.value = current.time;
    }

    /** Temps d'attente avant de déclarer une vidéo supprimée (en secondes) */
    const DELETED_VIDEO_TIMEOUT = 10;


    const $window = $(window);

    // Ajustement pour le CSS
    const $fontSize50List = $('.font-size-50p'); // ajuste la taille du texte pour avoir une police qui prend 50% de l'écran
    // Run the following when the window is resized, and also trigger it once to begin with.
    $window.resize(() => {
      // Get the current height of the div and save it as a variable.
      const height = $window.height() / 2;
      // Set the font-size and line-height of the text within the div according to the current height.
      $fontSize50List.css({
        'font-size': (height / 2) + 'px',
        'line-height': height + 'px'
      });
    }).trigger('resize');

    // const socket = io.connect();
    // socket.emit('getVideo', this.text);

    /*fetch("/minecraft.json").then((res) => {
       return res.blob();
    })*/

    // Playlist jeux vidéos : collection=Jeux%20Vid%C3%A9os

    this.init(); // TODO : on devrait attendre l'authent Google avant d'initialiser

    this.debugData = {
      getVideoSnippet: undefined
    };


    /*function getVideoIdFromUrl(url) {
        const i = url.indexOf('?');
        if (i === -1) return undefined;
        const query = querystring.decode(url.substr(i+1));
        return query.v;
    }*/

    this.videoStarted.subscribe(() => {
      this.trackStarted.emit();
    });

    this.trackStarted.subscribe(() => {
      console.log('on video started');
      const player = this.player;
      const track: Disc.Track = this.currentTrack; // loadingTrack vide si manual seeking

      // On en profite pour renseigner la durée de la vidéo maintenant qu'on la connait
      const file = track.file;
      if (!file.duration) {
        file.duration = player.getDuration();
      }
      // TODO : on pourrait stocker cette information sur le serveur

      // Incrémentation du nombre de lectures de la piste courante
      track.played = track.played ? track.played + 1 : 1;

      const disc = file.disc;
      document.title = track.title + ' - CueTube'; // Youtube affiche : disc.title + " - m3u-YouTube"

      $('.background-overlay').css('background-image', `url(${track.file.background})`);

      // Notif
      notify((track.title || 'Track ' + track.number), {
        tag: 'onTrackStarted',
        body: disc.title,
        icon: track.file.icon
      });

      // Historique
      this.history.push({
        discId: disc.discId,
        discIndex: this.indexOf(track.disc),
        fileIndex: track.file.index,
        trackIndex: track.index,
        date: new Date()
      });

      this.loadingDiscIndex = null;
      this.loadingFileIndex = null;
      this.trackIsLoading = false;

      this.trackPlaying.emit();
    });

    this.trackPlaying.subscribe(() => {
      const track = this.currentTrack;
      const file = track.file;

      // Pour les vidéos à une seule piste on ne connaissait pas la durée de la vidéo avant
      // const slider = document.getElementById("player-controls-form").trackPosition;
      const slider = this.slider;
      if (slider && (!slider.max || slider.max === undefined)) {
        console.log('Pour les vidéos à une seule piste on ne connaissait pas la durée de la vidéo avant');
        slider.max = file.duration;
      }
      this.fileSlider.max = file.duration;

      this.isPlaying = true;
      this.changeVideoIHM(); // au cas ou on a déplacé le curseur
    });

    this.videoPlaying.subscribe(() => {
      console.log('on video playing');

      // On vient en fait de démarrer une nouvelle piste ?
      if (this.trackIsLoading) {
        return this.trackStarted.emit();
      } else {
        return this.trackPlaying.emit();
      }
    });

    this.videoEnded.subscribe(() => {
      console.log('on video ended"');
      this.next();
    });

    this.videoManualSeeked.subscribe(() => {
      // on cherche la piste courant uniquement pour une vidéo multipiste
      if (this.currentTrack.disc.tracks.length > 1) {
        this.checkCurrentTrack();
      }
    });

    /** On vient de lancer une vidéo retirée de YouTube */
    this.unstartedVideo.subscribe(() => {
      // On démarre un chrono de 2 seconde pour détecter si la vidéo a été supprimée
      if (!this.deletedVideoTimeout) {
        console.log(`La vidéo n'a pas encore démarré. On attend ${DELETED_VIDEO_TIMEOUT}`
          + ` secondes avant de la déclarer comme supprimée de YouTube...`);
        const thisComponent = this;
        this.deletedVideoTimeout = window.setTimeout(function () {
          console.error(`La vidéo n'a toujours pas démarrée depuis ${DELETED_VIDEO_TIMEOUT} secondes. On la déclare supprimée.`);
          thisComponent.deletedVideo.emit();
        }, DELETED_VIDEO_TIMEOUT * 1000);
      }
    });

    /** On vient de lancer une vidéo retirée de YouTube */
    this.deletedVideo.subscribe(() => {
      if (!this.currentTrack) {
        return;
      }

      const file = this.currentTrack.file;
      console.error(`La vidéo ${file.videoId} du disque "${file.disc.title}" n'existe plus sur YouTube.`
        + ` On la désactive et on passe à la suivante...`);
      file.disabledByYouTube = true;
      this.next();
    });

    /*function getCueIndexAt(video, time) {
        const first = video.cues[0];
        if (time < first.startSeconds) return -1;

        const last = video.cues[video.cues.length - 1];
        if (time >= last.endSeconds) return -1;

        for (const i = 0; i < video.cues.length; ++i) {
            const cue = video.cues[i];
            if (time <= cue.endSeconds) return i;
        }
        return -1;
    }*/

    // this.$watch('currentTrack', function (newTrack, oldTrack) {
    //   const newDisc = newTrack ? newTrack.disc : null;
    //   const oldDisc = oldTrack ? oldTrack.disc : null;
    //   if (newDisc !== oldDisc) {
    //     document.body.style.backgroundImage = 'url(https://img.youtube.com/vi/' + newDisc.videoId + '/hqdefault.jpg)';
    //   }
    // });

    // INIT

    /*
    this.onSignIn = function(googleUser) {
      gapiClient.init().then(() => {

        const logoutBtn = document.getElementById("logout-btn");
        // logoutBtn.innerHTML = `<img src="${googleUser.getImageUrl()}" />${googleUser.getGivenName()}`;
        logoutBtn.innerHTML = `${googleUser.getGivenName()}`;

        if (!gapi.client.drive) {
          alert("Google Drive non initialisé");
          return;
        }
        const googleDrivePersistence = new GoogleDrivePersistence(this.http);

        // TODO : synchro avec l'ancienne persistance pour ne rien perdre

        // RAZ de variables/caches, etc...
        // this.discIdsByCollection = {}; // déjà fait par init()

        persistence = googleDrivePersistence;
        localStorage.setItem("persistence", "GoogleDrive");
        this.init();
      });
    };
    */

    // FIXME Contournement pour : Perte du history.state suite à plusieurs aller-retour #171
    HistoryUtils.getState = () => {
      return history.state || this.getStateFromLocation(document.location);
    };

    this.locationSubscription = this.location.subscribe(event => {
      const state = HistoryUtils.getState();
      if (state) {
        console.log('state', state);
        if ('currentCollectionNames' in state) {
          this.currentCollectionNames = state.currentCollectionNames;
          this.currentCollectionNamesChange.emit(this.currentCollectionNames);
          this.loadDiscsFromCurrentCollections();
        }
      }
    });

    this.currentCollectionNamesChange.subscribe(currentCollectionNames => {
      const isDefaultCollection = this.currentCollectionNames.length === 0;

      // Historique navigateur
      const state = {
        currentCollectionNames: this.currentCollectionNames
      };
      // Uniquement si le statut est différent de celui actuel
      HistoryUtils.pushStateOnlyNew(state, stateBuilder => {
        if (isDefaultCollection) {
          stateBuilder.title('CueTube')
            .searchParam('collection', null);
        } else {
          stateBuilder.title('CueTube - ' + this.currentCollectionNames.join(' + '))
            .searchParam('collection', this.currentCollectionNames);
        }
        return stateBuilder;
      });
    });

    // Attente de notif entre les onglets de l'appli
    this.prefs.discSaved.subscribe(discId => {
      console.log(`Le disque ${discId} a été modifié => on le recharge...`);
      this.reloadDisc(discId);
    });

  }

  enrichWindow(window) {
    const component = this;
    window.$scope = component;

    // Avant fermeture de la page
    window.onbeforeunload = function (e) {
      console.log('Sauvegarde avant fermeture...');
      component.save();
    };

    // Raccourcis clavier. Ne pas utiliser onkeypress (#159).
    window.onkeydown = function (event) {
      const code = event.code;
      switch (code) {
        case 'Space':
          component.playPause();
          event.stopPropagation();
          event.preventDefault();
          break;
        case 'ArrowUp':
          component.previous();
          break;
        case 'ArrowDown':
          component.next();
          break;
        case 'ArrowLeft':
          // ...
          break;
        case 'ArrowRight':
          // ...
          break;
        default:
          return;
      }
      event.stopPropagation();
      event.preventDefault();
    };

    window.toggleDiscList = function (discListElement) {
      $(discListElement).toggle();
    };

    // Fermeture de la tracklist ouverte si click ailleurs
    window.document.addEventListener('click', function (e) {
      const lastToggled = component.lastToggledTracklist;
      if (lastToggled != null) {
        $(lastToggled).hide();
      }
    });

  }

  async init(): Promise<any> {

    const collectionParam = this.getCollectionParam();

    // Collections
    const isInit = await this.persistence.init({gapiClient: this.gapiClient});
    const collectionNames = await this.loadCollectionNames();

    /** @deprecated TODO à remplacer par discsById */
    this.discs = []; // au cas où personne ne l'initialise

    // Tracklist togglée
    this.lastToggledTracklist = null;

    // Liste des disque en paramètre ?
    if (this.discsParam) {
      this.discIds = this.discsParam.split(',');
      return this.loadDiscs(this.discIds);
    }

    if (collectionParam) {
      const requestedCollectionNames = collectionParam.split(',');
      return this.loadDiscsFromCollections(requestedCollectionNames);
    }

    // Récup de l'état de la lecture précédente
    const current = this.prefs.getCurrentPlayerState();
    if (current) {
      if (current.collectionNames) {
        console.log('On reprendre la lecture des collections ' + current.collectionNames.join(', '));
        return this.loadDiscsFromCollections(current.collectionNames);
      }
    }

    this.playCollection();
    // discIds = [
    //   "Dg0IjOzopYU",
    //   "RRtlWfi6jiM",
    //   "TGXwvLupP5A",
    //   "WGmHaMRAXuI",
    //   "_VlTKjkDdbs",
    //   //"8OS4A2a-Fxg", // sushi
    //   //"zvHQELG1QHE" // démons et manants
    // ];
  }

  async loadCollectionNames(): Promise<string[]> {
    let collectionNames = await this.persistence.getCollectionNames();
    collectionNames = collectionNames
      .filter(collectionName => collectionNames && collectionName.toLowerCase() !== DEFAULT_COLLECTION.toLowerCase());

    try {
      collectionNames.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())); // tri alphabétique
      this.collectionNames = collectionNames;
      this.collectionNamesChange.emit(collectionNames);
      console.log('Noms des collections chargés', collectionNames);
      return collectionNames;
    } catch (e) {
      console.error(e);
      alert('Erreur lors du chargement de la liste des collections :' + e);
      throw e;
    }
  }

  async loadDiscsFromCollections(requestedCollectionNames: string[]): Promise<Disc[]> {

    const knownCollectionNames = this.collectionNames;

    const collectionNames = [];
    const unknownCollectionNames = [];
    requestedCollectionNames.forEach(collectionName => {
      if (knownCollectionNames.includes(collectionName) && !collectionNames.includes(collectionName)) {
        collectionNames.push(collectionName);
      } else {
        unknownCollectionNames.push(collectionName);
      }
    });
    if (unknownCollectionNames.length) {
      alert('Les collections suivantes n\'ont pas été trouvées : ' + unknownCollectionNames.join(', '));
    }
    this.currentCollectionNames = collectionNames;
    this.currentCollectionNamesChange.emit(this.currentCollectionNames);

    const promises = [];
    this.discIdsByCollection = {};
    collectionNames.forEach(collectionName => {

      promises.push((async () => {
        const discIds = this.discIdsByCollection[collectionName];
        if (discIds) {
          return discIds;
        }

        try {
          return this.persistence.getCollectionDiscIds(collectionName);
        } catch (e) {
          // alert("Impossible d'ouvrir la collection : " + collectionParam + " : " + err);
          try {
            const collection = await this.persistence.newCollection(collectionName);
            this.collectionNames = this.collectionNames || [];
            this.collectionNames.push(collectionName);
            this.collectionNamesChange.emit(this.collectionNames);
            console.log('Collection "' + collectionName + '" créée');
            return collection;
          } catch (e) {
            alert('Erreur lors de la création de cette collection');
            history.back();
          }
        }
      })());

    });

    return Promise.all(promises.map(p => p.catch(e => e)))
      .then(collections => {
        // Liste des disques pour chaque collection
        collectionNames.forEach((collectionName, i) => {
          this.discIdsByCollection[collectionName] = collections[i];
        });
        return this.loadDiscsFromCurrentCollections();
      })
      .catch(e => {
        console.error('Erreur après le chargement des collections ' + requestedCollectionNames.join(', '), e);
        return [];
      });

  }

  /**
   * Par défaut on se place toujours dans une collection pour éviter de perdre toutes ses données
   */
  getCollectionParam() {
    const param = getParameterByName('collection', document.location.search);
    if (!param) {
      return null;
    }
    return decodeURIComponent(param);
  }

  toggleRepeatMode(e) {
    if (!this.repeatMode) {
      this.repeatMode = 'disc';
    } else if (this.repeatMode === 'disc') {
      this.repeatMode = 'track';
    } else {
      this.repeatMode = '';
    }
  }

  stopPropagation(e) {
    e.stopPropagation(); // pour ne pas appeler document.onclick
  }

  // TODO : remonter dans app
  get $foreground() {
    return $('#foreground-overlay');
  }

  // TODO : remonter dans app
  get $foregroundIcon() {
    return $('#foreground-overlay-icon');
  }

  onYouTubeIframeAPIReady() {

    console.log('YouTube initialisé');

    // On cache le masque
    this.$foregroundIcon.html('<span class=\'glyphicon glyphicon-play\'></span>');
    this.$foreground.hide();

    // Si chargement
    const current = this.prefs.getCurrentPlayerState();
    if (current) {
      const disc: Disc = _.find(this.discs, (discI) => discI && discI.id === current.discId);

      if (!disc) {
        console.warn(`Disque anciennement joué d'id ${current.discId} non retrouvé. On lance un disque aléatoirement`);
        this.repeatMode = null;
        this.next(); // FIXME que faire si aucun disque n'est trouvé ?
        return;
      } else {
        console.log('Chargement de la précédente lecture...', current);

        const file = disc.files[current.fileIndex];
        const track = file ? file.tracks[current.trackIndex] : disc.nextTrack(this.shuffle, undefined);

        // loadTrack sorti de apply pour éviter l'erreur "$apply already in progress"
        this.loadTrack(track, current.time);

        return;
      }
    }

    // Premier lancement ...
    if ((!this.discs || !this.discs.length)) {
      // ... de l'application
      if (!this.getCollectionParam()) {
        alert('Bienvenue sur CueTube mec ! Pour lancer du gros son ajoute un album avec le bouton en haut à droite. Enjoy !');
      } else {
        alert('Cette collection est vide pour le moment. Ajoute un disque et fais péter les watts.');
      }
      return;
    }

    this.next();
  }


  initYT() {
    if (!this.isInitYT) {
      // TODO : éviter l'erreur : Uncaught ReferenceError: ytcfg is not defined
      console.log('Initialisation de YouTube');


      // 3. This function creates an <iframe> (and YouTube player)
      //    after the API code downloads.
      // Appelé automatiquement par l'IFRAME YouTube
      const component = this;
      (<any>window).onYouTubeIframeAPIReady = function () {
        component.onYouTubeIframeAPIReady();
      };

      // 2. This code loads the IFrame Player API code asynchronously.
      const tag = document.createElement('script');

      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      this.isInitYT = true;
    }
  }

  /**
   * @param [videoIndex]
   * @deprecated
   */
  loadTrackIndex(trackIndex, fileIndex, discIndex) {

    trackIndex = defaults(trackIndex, this.currentTrack && this.currentTrack.index);
    fileIndex = defaults(fileIndex, this.currentTrack && this.currentTrack.file.index);
    discIndex = defaults(discIndex, this.currentTrack && this.indexOf(this.currentTrack.disc));

    const disc = this.discs[discIndex];
    const file = disc.files[fileIndex];
    const track = file.tracks[trackIndex];

    this.loadTrack(track);
  }

  /**
   * @param track {Disc.Track} piste à charger TODO devrait être remplacé par file pour éviter des désynchro
   */
  loadTrack(track: Disc.Track, time?) {

    clearTimeout(this.checkCurrentTimeTimeout); // suppression de tous les timers

    const file = track.file;
    const disc = file.disc;
    const multiTrack = file.tracks.length > 1;

    if (time < track.startSeconds || time > track.endSeconds) {
      console.error(`Impossible de charger la piste #${track.index} du disque ${disc.title} à t=${time} car`
        + ` début=${track.startSeconds} et fin =${track.endSeconds}.`, track);
      track = file.getTrackAt(time);
      console.log(`On charge la piste #${track.index} à la place`);
    }

    // On active automatiquement cette piste et ce disque
    disc.enabledByUser = true;
    file.disabledByYouTube = false; // On tente également de réactiver la vidéo pour voir si elle est de nouveau dispo sur YouTube
    track.enabledByUser = true;

    // Suppression dans la liste des suivants auto
    if (this.shuffle) {
      const nextTracks = disc.nextTracks;
      const i = nextTracks.indexOf(track.number);
      nextTracks.splice(i, 1); // on supprime que celui-ci
    }

    this.showOnlyPlaylist(this.indexOf(disc));

    const start = getYouTubeStartSeconds(track, time); // YouTube n'accèpte que des entiers
    const end = multiTrack && track.endSeconds ? Math.floor(track.endSeconds) : undefined; // YouTube n'accèpte que des entiers
    if (start || end) {
      console.log(`Piste ${track.number} du disque ${disc.id} (de ${start}s à ${end}s) : ${track.title}`);
    }

    this.previousTrack = this.currentTrack;
    this.currentTrack = track;
    this.trackIsLoading = true;
    if (!this.player) {
      const component = this;
      // On peut récupérer cette variable a posteriori avec : YT.get("player")
      const aspect = 16 / 9;
      const height = 180;
      this.player = new YT.Player('player', {
        height: height,
        width: height * aspect,
        videoId: track.file.videoId,
        playerVars: { // https://developers.google.com/youtube/player_parameters?hl=fr
          autoplay: 1,
          start: start,
          end: end
        },
        events: {
          // 4. The API will call this function when the video player is ready.
          onReady: component.onPlayerReady.bind(component), // https://stackoverflow.com/a/38245500/1655155
          onStateChange: component.onPlayerStateChange.bind(component) // https://stackoverflow.com/a/38245500/1655155
        }
      });
    } else {

      const player = this.player;

      // TODO Ne pas recharger si on ne change pas de vidéo (videoId)
      if (this.previousTrack === this.currentTrack || player && player.getVideoUrl
        && getParameterByName('v', player.getVideoUrl()) === track.file.videoId) {
        this.seekToTrack(track);
      } else {
        // FIXME : graphiquement on ne voit plus les bornes start et end
        player.loadVideoById({
          videoId: track.file.videoId,
          startSeconds: start,
          endSeconds: end,
          // suite : KO Angular4
          // playerVars: { // https://developers.google.com/youtube/player_parameters?hl=fr
          //   autoplay: 1,
          //   start: start,
          //   end: end
          // }
        });
      }
    }
  }

  /**
   * Charge une piste de la vidéo (file) déjà en cours de lecture
   * @param track {Disc.Track} piste à charger
   */
  seekToTrack(track) {
    track = track || this.currentTrack;
    this.trackIsLoading = true;
    const start = getYouTubeStartSeconds(track); // YouTube n'accèpte que des entiers
    this.seekTo(start ? start : 0); // start undefined quand video non multitrack
  }

  seekTo(time) {
    if (isNaN(time)) {
      return false;
    }
    if (this.checkCurrentTimeTimeout) {
      clearTimeout(this.checkCurrentTimeTimeout);
    }
    // console.log("TODO : seekTo("+time+")");
    this.player.seekTo(time, true);
    this.slider.value = time;
    this.fileSlider.value = time;
  }

  /**
   * Prochaine piste (si disponible, sinon aucune action mais aucune erreur)
   */
  next() {
    const discs = this.discs;
    let track = this.currentTrack;
    let disc = track && track.disc;

    const possibleDiscs = [];
    // Répétition du disque ? (uniquement si disque existant)
    if (!this.repeatMode || !disc) {
      for (let i = 0; i < discs.length; ++i) {
        const nextDisc = discs[i];
        if (nextDisc && nextDisc.enabled && nextDisc.playable) {
          possibleDiscs.push(nextDisc);
        }
      }
    } else {
      possibleDiscs.push(disc);
    }

    // Aucun disque jouable ?
    if (!possibleDiscs.length) {
      console.warn('Aucun disque activé (ou sans piste activées)');
      return;
    }

    const discIndex = possibleDiscs.indexOf(disc);

    // Répétition de la piste ?
    if (this.repeatMode === 'track') {
      console.log('On répète la même piste comme demandé');
    } else if (this.shuffle) {
      disc = weightedRandom(possibleDiscs, discI => discI.tracks.length);
      track = disc.nextTrack(this.shuffle, this.currentTrack); // FIXME : arrêter la lecture si plus aucune piste
    } else {

      // prochaine piste ou 1ère du prochain disque
      do {
        if (track) {
          track = track.next;
        }
        if (!track) {
          disc = discIndex < possibleDiscs.length - 1 ? possibleDiscs[discIndex + 1] : possibleDiscs[0];
          track = disc.tracks[0];
        }
      } while (!track.enabled);
    }

    // loadTrack sorti de apply pour éviter l'erreur "$apply already in progress"
    if (track) {
      this.loadTrack(track);
    } else {
      alert('Aucun disque à lire !');
    }
  }

  previous() {

    const previousEntry = this.history.length >= 2 && this.history[this.history.length - 2];
    if (!previousEntry) {
      return;
    }

    const disc = this.discs[previousEntry.discIndex];
    if (!disc) {
      console.error(`Cannot find previous track's disc ! discIndex = ${previousEntry.discIndex}, previousEntry =`, previousEntry);
      this.history.pop();
      return;
    }
    const file = disc.files[previousEntry.fileIndex];
    const track = file.tracks[previousEntry.trackIndex];

    this.history.pop(); // suppression du previous
    this.loadTrack(track);
    this.history.pop(); // suppression du previous (ajouté par loadTrack)
  }

  showOnlyPlaylist(discIndex) {
    const discs = $('#playlist .disc');
    discs.each(function () {
      const list = $('.disc-list', this);
      if (this.dataset.index === discIndex) {
        list.show();
      } else {
        list.hide();
      }
    });
  }

  /** Ajout d'une nouvelle vidéo */
  addVideo() {
    const videoId = prompt('videoId de la nouvelle vidéo ?');
    if (!videoId) {
      return;
    }

    // Structure YouTube
    // FIXME : remplacer les prompt en cascade par un form
    const video = {
      snippet: {
        title: prompt('Titre'),
        channelTitle: prompt('Nom de la chaîne')
      },
      contentDetails: {
        duration: prompt('Durée (exemple : "PT2H6M53S" = 2h 6m 53s)')
      }
    };

    // Annulé ?
    if (!video.snippet.title || !video.snippet.channelTitle || !video.contentDetails.duration) {
      return;
    }

    this.persistence.saveDisc(videoId, video).then(() => {
      // POST OK
      alert('POST OK');
    }, () => {
      // POST KO
      alert('POST KO');
    });
  }

  getVideoId() {
    // return getVideoIdFromUrl(file.name);
    // return getParameterByName("v", file.name);
    if (!this.currentTrack) {
      return undefined;
    }
    return this.currentTrack.file.videoId;
  }

  getVideoUrlFromId(id) {
    return 'https://www.youtube.com/watch?v=' + id;
  }

  /** @return Promise https://developers.google.com/youtube/v3/docs/videos#resource */
  getVideoSnippet(videoId, cb) {
    // TODO comment recréer une Promise par dessus le promise de getVideo .
    this.persistence.getVideo(videoId, GOOGLE_KEY).then(video => {
      cb(null, video.snippet);
    }).catch(err => {
      cb(err);
    });
  }

  checkCurrentTrack() {
    const track = this.currentTrack.file.getTrackAt(this.player.getCurrentTime());
    if (track && track !== this.currentTrack) {
      console.log(`On est passé à la piste #${track.number} ${track.title}`);
      this.currentTrack = track;
      this.videoStarted.emit();
    }
  }

  /**
   * Déclenché à chaque mise à jour de la position
   */
  changeVideoIHM() {
    const track = this.currentTrack;

    // Slider
    // const form = document.getElementById("player-controls-form");
    // const slider = form.trackPosition;
    const slider = this.slider;
    slider.min = track.startSeconds;
    slider.max = track.endSeconds;
    this.fileSlider.max = track.file.duration;

    this.checkCurrentTime();
  }

  playPause(skipForeground = false) {
    const player = this.player;
    if (!player) {
      return;
    }
    const state = player.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
      this.pause(skipForeground);
    } else {
      this.play();
    }
  }

  // TODO : remonter dans app
  showPlayer() {
    this.$foregroundIcon.html('<span class=\'glyphicon glyphicon-play\'></span>');
    this.$foreground.hide();
  }

  // TODO : remonter dans app
  hidePlayer(pauseButton = false) {
    if (pauseButton) {
      this.$foregroundIcon.html(`<span class="glyphicon glyphicon-pause"></span>`);
    } else {
      this.$foregroundIcon.html(`<div id="foreground-overlay-icon" class="center font-size-50p"></div>`);
    }
    this.$foreground.show();
  }

  play() {
    const player = this.player;
    if (!player) {
      return;
    }
    this.showPlayer();
    player.playVideo();
    this.isPlaying = true;
  }

  pause(skipForeground) {
    const player = this.player;
    if (!player) {
      return;
    }
    player.pauseVideo();
    if (!skipForeground) {
      this.hidePlayer(true);
    }
    this.isPlaying = false;
  }

  /** src : https://coderwall.com/p/ngisma/safe-apply-in-angular-js */
  safeApply(fn) {

    // // AngularJS
    // const phase = this.$root.$$phase;
    // if (phase === '$apply' || phase === '$digest') {
    //   if (fn && (typeof(fn) === 'function')) {
    //     fn();
    //   }
    // } else {
    //   this.$apply(fn);
    // }

    // Angular 4 ?
    if (fn && (typeof (fn) === 'function')) {
      fn();
    }
  }

  /** https://developers.google.com/youtube/v3/docs/playlistItems/list */
  // TODO : convertir en promise
  getPlaylistItems(playlistId, cb) {
    this.persistence.getPlaylistItems(playlistId, GOOGLE_KEY).then(data => {
      cb(null, data);
    }).catch(err => {
      cb(err);
    });
  }

  createDisc(disc: Disc) {
    console.log('Disque créé');

    const existingDiscIndex = this.indexOf(disc);
    if (existingDiscIndex !== -1) {
      if (!confirm('Ce disque est déjà dans le lecteur. Voulez-vous le remplacer ?')) {
        console.log('Création du disque annulée');
        return;
      }
      this.discs[existingDiscIndex] = disc;
    } else {
      this.discs.push(disc);
    }

    // On ajoute également le disque à la collection courante
    const collectionNames = this.getCurrentCollectionNames();
    collectionNames.forEach(collectionName => {

      // uniquement si non existant
      const discIds = this.discIdsByCollection[collectionName];
      if (discIds.indexOf(disc.id) === -1) {

        if (collectionNames.length > 1 && !confirm(`On ajoute cette vidéo à la collection ${collectionName} ?`)) {
          return;
        }

        console.log('Ajout du disque dans la collection ' + collectionName);
        discIds.push(disc.id);
        this.persistence.saveCollectionDiscIds(collectionName, discIds).then(discIdsI => {
          console.log('Disque ajouté avec succès dans la collection ' + collectionName);
        }, resKO => {
          alert('Erreur lors de l\'ajout du disque dans la collection ' + collectionName);
        });
      }

    });

    // On affiche l'id du disque pour que l'utilisateur puisse l'ajouter dans sa playlist (URL)
    if (existingDiscIndex === -1 && this.cuetubeConf.debug) {
      prompt('Disque créé avec l\'id suivant', disc.id);
    }

    // Lecture auto
    if (this.cuetubeConf.addDisc.autoplay) {
      disc.play();
    }
  }

  createNewDiscFromPlaylist(playlistIdOrUrl, url, cb) {
    const playlistId = getIdOrUrl(playlistIdOrUrl, 'Id ou URL de la playlist YouTube', 'list');
    if (!playlistId) {
      return cb('Aucun id de playlist');
    }

    this.getPlaylistItems(playlistId, (err, playlistItems) => {
      if (err) {
        return cb('Erreur createNewDiscFromPlaylist : ' + err.message);
      }

      playlistItems = playlistItems.items || playlistItems;
      const disc = ytparser.newDiscFromPlaylistItems(playlistItems, prompt('Nom du disque', playlistItems[0].snippet.title));
      disc.src = url;
      this.importDisc(disc, cb);
    });
  }

  // TODO : cb => Promise
  createNewDiscFromVideo(videoIdOrUrl, url, cb) {
    const videoId = getIdOrUrl(videoIdOrUrl, 'Id ou URL de la vidéo YouTube (multipiste)', 'v');
    if (!videoId) {
      return;
    }
    cb = cb || function (err, disc) {
    };

    this.getVideoSnippet(videoId, (err, snippet) => {
      if (err) {
        return cb(err);
      }

      const videoUrl = this.getVideoUrlFromId(videoId);
      try {
        const disc = ytparser.newDiscFromVideoSnippet(snippet, videoUrl);
        disc.src = url;
        this.importDisc(disc, cb);
      } catch (e) {
        if (e.name === 'youtube.notracklist') {
          const disc = e.disc;
          this.localPersistence.setItem('discToCreate', disc);
          alert('La description de la vidéo ne contient aucune tracklist, on va commencer la création du disque...');
          openInNewTab(`edit-cue?id=${disc.id}`);
        } else {
          if (confirm(`Erreur lors de la création du disque : ${e.message}. On crée quand même la playlist ?`)) {
            openInNewTab(`edit-cue?id=${videoId}`);
          }
        }
      }
    });

  }

  importDisc(disc, cb) {
    enrichDisc(disc, this);

    console.log('Création du disc...', disc);
    // TODO : pouvoir passer le disc en JSON -> problème de circular ref
    this.persistence.saveDisc(disc.id, disc).then(createdDisc => {
      this.createDisc(disc);
      if (cb) {
        cb(null, disc);
      }
    }, resKO => {
      alert('Erreur postDisc : ' + resKO.data);
      if (cb) {
        cb(resKO.data);
      }
    });
  }

  /**
   * Création d'un nouveau disque à partir d'une vidéo ou d'une playlist YouTube
   * @param {string} url? URL de la vidéo/playlist, si vide alors on demande à l'utilisateur
   * @param cb? callback
   */
  createNewDiscFromVideoOrPlaylist(url?: string, cb?: { (collection: Collection) }) {

    url = url || prompt('URL de la vidéo/playlist YouTube');
    cb = cb || (err => {
      console.log('this.$apply(); createNewDiscFromVideoOrPlaylist');
      if (err) {
        console.error(err);
        alert(err);
      }
    });
    if (!url) {
      return;
    }
    const playlistId = getParameterByName('list', url);
    const videoId = getParameterByName('v', url);
    const ctrl = this;

    // Si la cue n'est pas connue de CueTube/cues
    function fallback() {
      if (playlistId) {
        return ctrl.createNewDiscFromPlaylist(playlistId, url, cb);
      } else {
        return ctrl.createNewDiscFromVideo(url, url, cb);
      }
    }

    // Vidéo déjà connue sur CueTube/cues ?
    if (playlistId || videoId) {
      const id = playlistId || videoId;
      console.log(`Récupération du disque ${id}...`);
      this.persistence.getDisc(id).then(disc => {
        const msg = 'La vidéo/playlist existe déjà localement. L\'importer ?\nSi vous annulez le disque sera récréé à partir de YouTube.';
        if (confirm(msg)) {
          disc.src = url;
          // Import du disque (sans sauvegarde avec la persistance)
          enrichDisc(disc, this);
          this.createDisc(disc);
          console.log('this.$apply(); createNewDiscFromVideoOrPlaylist2');
        } else {
          fallback();
        }
      }).catch(err => {
        console.error('Erreur lors de la récupération locale :', err);

        console.log('On recherche si ' + id + ' n\'est pas déjà connu de CueTube...');
        this.getCueService().getCueFromCueTube(id).then(cue => {
          const msg = 'La vidéo/playlist existe déjà dans CueTube.'
            + ' L\'importer ?\nSi vous annulez le disque sera récréé à partir de YouTube.';
          if (confirm(msg)) {
            const disc = new Disc(cue);
            disc.src = url;
            this.importDisc(disc, cb);
            console.log('this.$apply(); createNewDiscFromVideoOrPlaylist3');
          } else {
            fallback();
          }
        }).catch(err2 => {
          console.error('Erreur lors de la récupération dans CueTube : ' + err2);
          fallback();
        });
      });

    } else {
      fallback();
    }
  }

  /**
   * Création d'une nouvelle collection vide
   * @param {string} name? nom de la collection, si vide alors on demande à l'utilisateur
   */
  createCollection(name?: string) {
    name = name || prompt('Nom de la collection à créer');
    if (name) {
      name = name.trim();
      if (this.collectionNames.indexOf(name) !== -1) {
        alert('Cette collection existe déjà mec !');
        return;
      }
      const collection = new Collection(name);
      this.persistence.saveCollection(collection).then(collectionCreee => {
        this.collectionNames.push(collection.name);
        this.collectionNames = this.collectionNames.sort();
        this.collectionNamesChange.emit(this.collectionNames);
        this.openCollection(name);
      });
    }
  }

  openCollection(name) {
    this.playCollection(name);
  }

  /**
   * Sauvegarde l'état actuel dans le localStorage
   */
  save() {
    this.prefs.saveAllPlayer(this);
  }

  onPlayerReady(event) {
    const player = event ? event.target : this.player;
    player.playVideo();
    this.videoStarted.emit();
  }

  // 5. The API calls this function when the player's state changes.
  //    The function indicates that when playing a video (state=1),
  // liste des codes : http://stackoverflow.com/a/8204143/1655155
  /**
   * -1 (unstarted)
   * 0  YT.PlayerState.ENDED
   * 1  YT.PlayerState.PLAYING
   * 2  YT.PlayerState.PAUSED
   * 3  YT.PlayerState.BUFFERING
   * 5  YT.PlayerState.CUED
   */
  onPlayerStateChange(event) {
    // const player = event.target;
    const state = event.data;

    if (this.lastPlayerStates.length >= 10) {
      this.lastPlayerStates.shift();
    }
    const lastState = this.lastPlayerStates.length ? this.lastPlayerStates[this.lastPlayerStates.length - 1] : undefined;
    this.lastPlayerStates.push(state);

    console.log('%c player state : ' + state + (YT_STATES[state] ? ':' + YT_STATES[state] : ''),
      `background: no-repeat left center url(https://youtube.com/favicon.ico); background-size: 16px; padding-left: 20px;`);

    // N'importe quel évènement après un chrono de deleted video => la supprimée n'est pas supprimée
    if (this.deletedVideoTimeout) {
      window.clearTimeout(this.deletedVideoTimeout);
      delete this.deletedVideoTimeout;
    }

    // Fin de la vidéo
    // on vérifie lastPlayedVideoIndex car cet évènement est souvent appelé deux fois
    // Détail des évènements : 2, 0 => next, -1, 0, -1, 3
    // Quand l'utilisateur scroll après la fin de la cue courante => YT.PlayerState.PAUSED
    if (state === YT.PlayerState.ENDED && (!this.trackIsLoading ||
      this.previousTrack.disc.id !== this.currentTrack.disc.id &&
      this.previousTrack.file.index !== this.currentTrack.file.index &&
      this.previousTrack.index !== this.currentTrack.index)) {
      // est-ce que la vidéo était en lecture actuellement ?
      if (lastState === YT.PlayerState.PLAYING) {
        this.videoEnded.emit();
      } else {
        console.log('La vidéo ne s\'est pas vraiment arrêtée');
      }
    } else if (state === YT.PlayerState.PLAYING) {
      this.isPlaying = true;
      this.videoPlaying.emit();
    } else if (state === YT.PlayerState.PAUSED) {
      this.isPlaying = false;
    }

    // Détection d'une série de 3 évènements
    if (this.lastPlayerStates.length >= 3) {
      const states = new Array(3);
      for (let i = 0; i < 3; ++i) {
        states[i] = this.lastPlayerStates[this.lastPlayerStates.length - (3 - i)];
      }

      if (states[0] === YT.PlayerState.PAUSED &&
        states[1] === YT.PlayerState.BUFFERING &&
        states[2] === YT.PlayerState.PLAYING) {
        this.videoManualSeeked.emit();
      }

      if (states[0] === -1 &&
        states[1] === YT.PlayerState.BUFFERING &&
        states[2] === -1) {
        this.unstartedVideo.emit();
      }
    } else if (state === -1) {
      this.unstartedVideo.emit();
    }
  }

  removeDisc(disc) {
    const collectionParam = this.getCollectionParam();
    const collectionNames = collectionParam.split(',');
    const promises = [];
    let removeConfirmed = true;
    collectionNames.forEach(collectionName => {

      if (collectionNames.length > 1 && !confirm(`Supprimer le disque ${disc.title} de la collection ${collectionName} ?`)) {
        removeConfirmed = false;
        return false;
      }

      promises.push(Promise.resolve(collectionParam)
        .then(collectionParamI => {
          const discIdsI = this.discIdsByCollection[collectionParamI];
          if (discIdsI) {
            return discIdsI;
          } else {
            return this.persistence.getCollectionDiscIds(collectionName);
          }
        })
        .then(discIdsI => {
          const index = discIdsI.indexOf(disc.id);
          if (index === -1) {
            return discIdsI;
          }

          discIdsI.splice(index, 1);
          return this.persistence.saveCollectionDiscIds(collectionName, discIdsI);
        })
        .then(discIds => {
          this.discIdsByCollection[collectionName] = discIds;
          console.log(`Disques sauvegardés pour la collection ${collectionName}`, discIds);
          return discIds;
        })
      );
    });

    // Attente des promises
    Promise.all(promises).then(results => {
      if (removeConfirmed) {
        const index = this.discs.indexOf(disc);
        if (index === -1) {
          return;
        }

        // Suppression dans les disques actuellement affichés
        this.discs.splice(index, 1);
      }
    });
  }

  toggleCollection(collectionName, $event) {

    this.hidePlayer();
    $event.stopPropagation();

    // Coché ?
    const index = this.currentCollectionNames.indexOf(collectionName);
    const checked = index === -1;
    if (checked) {
      this.currentCollectionNames.push(collectionName);
    } else {
      this.currentCollectionNames.splice(index, 1);
    }
    this.currentCollectionNamesChange.emit(this.currentCollectionNames);

    this.loadDiscsFromCurrentCollections();
  }

  async removeCollection(collectionName: string): Promise<boolean> {

    await this.persistence.deleteCollection(collectionName);

    this.collectionNames = this.collectionNames.filter(collectionNameI => collectionNameI !== collectionName);
    this.currentCollectionNames = this.currentCollectionNames.filter(collectionNameI => collectionNameI !== collectionName);
    console.log(`Collection "${collectionName}" supprimée avec succès`);
    this.collectionNamesChange.emit(this.collectionNames);
    this.currentCollectionNamesChange.emit(this.currentCollectionNames);

    return true;
  }

  // TODO : comment déclarer des services avec Angular ?
  getCueService() {
    if (!this.cueService) {
      this.cueService = new CueService(this.http);
    }
    return this.cueService;
  }

  async getDiscsIds(collectionName): Promise<string[]> {

    // Recherche d'abord dans la mémoire
    let discIds = await this.discIdsByCollection[collectionName];
    if (discIds) {
      return discIds;
    }

    // Recherche dans la persistance
    try {
      discIds = await this.persistence.getCollectionDiscIds(collectionName);
      return this.discIdsByCollection[collectionName] = discIds; // mémoire
    } catch (err) {
      alert('Impossible d\'ouvrir la collection : ' + collectionName + ' : ' + err);
      return [];
    }
  }

  playCollection(collectionName?): Promise<Disc[]> {
    console.log('Lecture de la collection ' + (collectionName ? collectionName : 'par défaut'));
    this.currentCollectionNames = collectionName ? [collectionName] : [];
    this.currentCollectionNamesChange.emit(this.currentCollectionNames);
    return this.loadDiscsFromCurrentCollections();
  }

  // gapiClient.isSignedIn(GOOGLE_AUTH_PARAMS.clientId).then(isSignedIn => this.connectedToGoogleDrive = isSignedIn);
  // connectGoogleDrive() {
  //
  //   const loginBtn = document.getElementById('login-btn');
  //   loginBtn.innerText = 'Connexion...';
  //   // this.hidePlayer();
  //
  //   const oldPersistence = this.persistence instanceof GoogleDrivePersistence ? this.localPersistence : this.persistence;
  //   const googleDrivePersistence = new GoogleDrivePersistence(this.http);
  //   this.googleDrivePersistence = googleDrivePersistence; // debug
  //   googleDrivePersistence.init({gapiClient: this.gapiClient}).then(isInit => {
  //
  //     if (isInit) {
  //       notify(`Démarrage de la synchro avec ${googleDrivePersistence.title}...`);
  //       loginBtn.innerText = 'Connecté·e';
  //       this.connectedToGoogleDrive = true;
  //       localStorage.setItem('connectedToGoogleDrive', 'true');
  //
  //       // synchro avec l'ancienne persistance pour ne rien perdre
  //       oldPersistence.sync(googleDrivePersistence).then(syncResult => {
  //         const message = `Synchro terminée avec ${googleDrivePersistence.title}`;
  //         console.log(message);
  //         console.log(syncResult);
  //         notify(message);
  //
  //         // On ne change pas de persistence pour accélérer les perfs
  //         // puisse qu'on synchronise à chaque démarrage
  //         // TODO : attention on crée avec this.persistence et pas localStorage
  //         this.persistence = new LocalAndDistantPersistence(oldPersistence, googleDrivePersistence);
  //         localStorage.setItem('persistence', `${this.persistence.title}('${oldPersistence.title}', '${googleDrivePersistence.title}')`);
  //
  //         this.init();
  //       }).catch(err => {
  //         loginBtn.innerText = 'Connecté·e';
  //         // this.showPlayer();
  //         alert('Erreur de synchro entre la persistance actuelle et Google Drive');
  //         console.error(err);
  //       });
  //     } else {
  //       loginBtn.innerText = 'Google Drive';
  //       // this.showPlayer();
  //     }
  //   }).catch(err => {
  //     loginBtn.innerText = 'Google Drive';
  //     // this.showPlayer();
  //     alert('Erreur de connexion à Google Drive');
  //     console.error(err);
  //   });
  // }

  disconnectGoogleDrive() {
    // TODO
    this.connectedToGoogleDrive = false;
    const loginBtn = document.getElementById('login-btn');

    localStorage.removeItem('persistence');
    this.persistence = this.getPersistence();

    loginBtn.innerText = 'Google Drive';
  }

  // TODO : remonter dans app
  getPersistence(): Persistence {
    const persistence = AppComponent.getPersistence(this.localPersistence, this.http);
    console.log('getPersistence() => ' + persistence.title);
    return persistence;
  }

  loadDiscs(discIdsToLoad: string[]): Promise<Disc[]> {

    console.log('Chargement des disques :', discIdsToLoad);
    this.hidePlayer();

    this.discs = [];
    const discLoaders = discIdsToLoad.map(discId => this.loadDisc(discId));

    return Promise.all(discLoaders.map(p => p.catch(e => {
      console.error('Erreur lors du chargement du disque', e);
      return undefined;
    })))
      .then(loadedDiscs => {
        console.log('Disques chargés :', loadedDiscs);
        loadedDiscs = loadedDiscs.filter(disc => disc);
        this.discs = loadedDiscs;
        if (!this.isInitYT) {
          this.initYT(); // Aucun disque n'est présent ? On charge quand même YouTube pour plus tard
        } else {
          this.showPlayer();
        }
        return loadedDiscs;
      })
      .catch(e => {
        console.error('Erreur après le chargement des disques', e);
        return [];
      });

  }

  loadDisc(discId: string): Promise<Disc> {

    console.log(`Chargement du disque ${discId}`);

    // Recherche d'abord dans la mémoire
    let continueConfirm = false; // on désactive totalement la confirmation quand il manque une playlist
    return new Promise<Disc>((resolve, reject) => {
      return resolve(this.persistence.getDisc(discId));
    })
      .catch(resKO => {
        console.error(`Error lors de la récupération du disque ${discId}:`, resKO || resKO.data);
        if (continueConfirm) {
          continueConfirm = prompt('Veuillez ajouter la cuesheet ' + discId, discId) !== null;
        }
        return <Disc>null;
      })
      .then(disc => {
        enrichDisc(disc, this);

        // Reprise des paramètres sauvegardés
        this.prefs.restoreDisc(disc);

        // Ajout dans le player
        this.addDisc(disc);
        return disc;
      });
  }

  /**
   *
   * @param disc
   * @return {number} l'index dans player.discs où le disque a été inséré (ajout ou remplacement)
   */
  addDisc(disc: Disc): number {
    const discIndex = this.indexOf(disc);
    if (discIndex !== -1) {
      this.discs[discIndex] = disc;
    } else {
      this.discs.push(disc);
      return this.discs.length - 1;
    }
  }

  reloadDisc(discId: string): Promise<Disc> {
    const disc = this.getDisc(discId);
    if (disc) {
      return this.loadDisc(disc.id);
    } else {
      throw new Error(`Impossible de recharger le disque ${discId} car il n'existe pas/plus`);
    }
  }

  getDisc(discId: string): Disc {
    return this.discs.find(disc => disc.id === discId);
  }

  indexOf(disc: Disc): number {
    return this.discs
      .map(disc => disc.id)
      .indexOf(disc.id);
  }

  getCurrentCollectionNames(): string[] {
    return this.currentCollectionNames.length ? this.currentCollectionNames : [DEFAULT_COLLECTION];
  }

  loadDiscsFromCurrentCollections(): Promise<Disc[]> {
    this.hidePlayer();
    const currentCollectionNames = this.getCurrentCollectionNames();

    // On récupère la liste des disques de toutes les collections actives
    const getDiscsIds = currentCollectionNames
      .map(collectionName => this.getDiscsIds(collectionName));
    return Promise.all(getDiscsIds.map(p => p.catch(e => e)))
      .then(discIdsByIndex => discIdsByIndex.reduce((all: Array<string>, array: Array<string>) => {
        // On concatère les disques sans doublons
        array.forEach(item => {
          if (all.indexOf(item) === -1) {
            all.push(item);
          }
        });
        return all;
      }, []))
      .then(discIds => this.loadDiscs(discIds))
      .catch(e => {
        console.error(e);
        alert('Erreur lors du chargement des disques des collections : ' + e);
        throw e;
      });
  }

  /**
   *
   * @param time
   * @return {string}
   * @author https://stackoverflow.com/a/6313008
   */
  formatHHMMSS(time) {
    return formatHHMMSS(time);
  }

  /**
   *
   * @param time
   * @return {string}
   */
  formatMMSS(time) {
    return formatMMSS(time);
  }

  /**
   * Format YouTube
   * @param time
   * @return {string}
   */
  formatHMSS(time) {
    return formatHMSS(time);
  }


  /**
   * Actualise l'IHM à chaque changement de seconde ou sur demande (en l'appelant)
   */
  checkCurrentTime() {

    if (this.checkCurrentTimeTimeout) {
      clearTimeout(this.checkCurrentTimeTimeout);
    }
    // FIXME par moment this.player devient un élément IFRAME au lieu d'un objet
    const time = this.player && this.player.getCurrentTime ? this.player.getCurrentTime() : undefined;
    // console.log(`time=${time}`);

    const component = this;

    function scheduleNextCheckCurrentTime() {
      // on actualise qu'au prochain changement de seconde
      component.nextCheckCurrentTime = (1 - (component.player.getCurrentTime() % 1)) * 1000;
      component.checkCurrentTimeTimeout = setTimeout(component.checkCurrentTime.bind(component), component.nextCheckCurrentTime); // boucle
    }

    // changement de secondes ?
    if (this.lastCheckedTime === undefined || Math.floor(time) !== Math.floor(this.lastCheckedTime)) {
      this.zone.run(() => {
        this.slider.value = time;
        this.fileSlider.value = time;
        this.lastCheckedTime = time;
        // Changement de piste ?
        if (this.slider.value >= this.slider.max) {
          this.onTrackEnded();
        }
        scheduleNextCheckCurrentTime();
      });
    } else {
      scheduleNextCheckCurrentTime();
    }
  }

  onTrackEnded(event?) {
    const scope = event ? event.currentScope : this;

    if (scope.repeatMode === 'track') {
      scope.seekToTrack();
    } else if (scope.shuffle) {
      scope.next();
    } else {
      scope.checkCurrentTrack();
    }
  }


  toggleTracklist(tracklist, disc) {
    const lastToggledTracklist = this.lastToggledTracklist;
    if (lastToggledTracklist !== null && lastToggledTracklist !== tracklist) {
      $(lastToggledTracklist).hide();
    }

    $(tracklist).toggle();

    if ($(tracklist).is(':visible')) {
      this.discInTracklist = disc;
    } else {
      this.discInTracklist = null;
    }

    this.lastToggledTracklist = tracklist;
  }

  /**
   * L'heure actuelle
   * @param offset décalage en secondes
   * @return {string} exemple "12:48"
   */
  getTime(offset = 0) {
    const d = new Date();
    if (offset) {
      d.setTime(d.getTime() + offset * 1000);
    }
    return d.toTimeString().substring(0, 5);
  }

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit');
    if (this.prefs.isConnectedToGoogleDrive()) {
      // this.connectGoogleDrive();
    }
  }

  ngOnDestroy(): void {
    this.locationSubscription.unsubscribe();
  }

  /**
   * Contournement pour : Perte du history.state suite à plusieurs aller-retour #171
   * @param location
   */
  getStateFromLocation(location: Location): State {
    const url = new URL(location.toString());
    const state: State = {};
    if (url.searchParams.get('collection')) {
      state.currentCollectionNames = url.searchParams.get('collection').split(',');
    }
    return state;
  }
}

interface State {
  currentCollectionNames?: string[];
}

// TODO à déplacer dans yt-helper
function getYouTubeStartSeconds(track, time = track.startSeconds) {
  const file = track.file;
  const multiTrack = file.tracks.length > 1;
  let start = multiTrack ? Math.floor(time) : time; // YouTube n'accèpte que des entiers, on met undefined si !multitrack et pas de time

  // Youtube ne redémarre pas à 0 si on lui indique exactement 0
  if (multiTrack && !start) {
    start = 0.001; // FIXME : OK  alors que YouTube n'accèpte que des entiers ?
  }

  return start;
}

function defaults(value, defaultValue) {
  if (typeof (value) === 'undefined') {
    return defaultValue;
  } else {
    return value;
  }
}

/**
 * @param promptMessage message à afficher si on doit demander d'entrer une valeur pour idOrUrl
 * @param urlParam nom du paramètre contenant l'id à récupérer dans le cas d'une URL passée en argument
 * @return l'id à partir d'un ID ou d'une URL
 */
function getIdOrUrl(idOrUrl, promptMessage, urlParam) {
  idOrUrl = idOrUrl || prompt(promptMessage);
  if (!idOrUrl) {
    return undefined;
  } else if (idOrUrl.match(/:\/\//)) { // URL ?
    return getParameterByName(urlParam, idOrUrl);
  } else {
    return idOrUrl;
  }
}

function openInNewTab(url) {
  const win = window.open(url, '_blank');
  win.focus();
  return win;
}

function enrichDisc(disc, player: PlayerComponent) {

  disc.player = player;

  for (let fileIndex = 0; fileIndex < disc.files.length; ++fileIndex) {
    const file = disc.files[fileIndex];

    for (let trackIndex = 0; trackIndex < file.tracks.length; ++trackIndex) {
      const track = file.tracks[trackIndex];

      Object.defineProperties(track, {
        isCurrent: {
          get: function () {
            return this.currentTrack &&
              this.currentTrack.index === this.index &&
              this.currentTrack.file.index === this.file.index &&
              this.currentTrack.disc.index === this.file.disc.index;
          }
        }
      });
    }
  }

  return disc;
}
