///<reference path="../../../node_modules/@types/youtube/index.d.ts"/>
import {AfterViewInit, Component, EventEmitter, NgZone, OnInit, Output, ViewChild} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {LocalStoragePersistence} from '../../persistence/LocalStoragePersistence';
import {LocalServerPersistence} from '../../persistence/LocalServerPersistence';
import {GoogleDrivePersistence} from '../../persistence/GoogleDrivePersistence';
import {Disc} from '../../disc';
import {Collection} from '../../Collection';
import {Persistence} from '../../persistence';
import {CueService} from '../../CueService';
import * as _ from 'underscore';
import {GapiClientService} from '../gapi-client.service';
import {SliderComponent} from '../slider/slider.component';
import {ytparser} from '../../yt-parser';
import {LocalAndDistantPersistence} from '../../persistence/LocalAndDistantPersistence';

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
export class PlayerComponent implements OnInit, AfterViewInit {

  private cueService: CueService;

  private localPersistence: LocalStoragePersistence;
  public googleDrivePersistence: GoogleDrivePersistence; // debug
  private persistence: Persistence;

  private discsParam: string;
  private discIds: string[];
  public lastCheckedDisc: Disc;
  public lastCheckedTrack: Disc.Track;
  /** disque ouvert dans la liste des pistes (tooltip) */
  private discInTracklist: Disc;

  /** Toutes les collections indexées par nom de collection */
  private discIdsByCollection: {[key: string]: string[]} = {};

  /**
   * Nom de toutes les collections disponibles
   */
  collectionNames: string[] = [];
  /**
   * Nom de toutes les collections en cours de lecture
   */
  currentCollectionNames = [];

  /** Utilisé par la persistance */
  public debugData: any;

  repeatMode: string;

  public discs: Disc[];
  private discsById: {[key: string]: Disc};

  public shuffle = true;
  private history = [];
  public currentTrack: Disc.Track = null;
  public loadingTrack: Disc.Track = null;
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
  @ViewChild(SliderComponent)
  slider: SliderComponent;
  private sliderPosition = 0;

  private lastCheckedTime: number;
  private nextCheckCurrentTime: number;
  /** prochain appel */
  private checkCurrentTimeTimeout: number;
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

  constructor(public http: HttpClient/*, private cuetubeConf*//*, private $ngConfirm*/, private gapiClient: GapiClientService, private zone: NgZone) { }

    ngOnInit() {

        // FIXME pour debugger
        this.enrichWindow((<any>window));

        this.localPersistence = new LocalStoragePersistence(this, this.http);
        this.persistence = this.getPersistence();
        this.discsParam = getParameterByName('discs', document.location.search);

        // Paramètres
        this.shuffle = this.restore('shuffle', true);
        this.repeatMode = this.restore('repeatMode', '');
        this.slider.value = this.restore('time', 0);

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
            const track: Disc.Track = this.loadingTrack || this.currentTrack; // loadingTrack vide si manual seeking

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

            $(".background-overlay").css('background-image', `url(${track.file.background})`);

            // Notif
            notify((track.title || 'Track ' + track.number), {
                tag: 'onTrackStarted',
                body: disc.title,
                icon: track.file.icon
            });

            // Historique
            this.history.push({
                discId: disc.discId,
                discIndex: track.disc.index,
                fileIndex: track.file.index,
                trackIndex: track.index,
                date: new Date()
            });

            this.loadingDiscIndex = null;
            this.loadingFileIndex = null;
            this.loadingTrack = null;
            this.currentTrack = track;

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
            if (this.loadingTrack) {
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
            file.enabled = false;
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
            const googleDrivePersistence = new GoogleDrivePersistence(this, this.http);

            // TODO : synchro avec l'ancienne persistance pour ne rien perdre

            // RAZ de variables/caches, etc...
            // this.discIdsByCollection = {}; // déjà fait par init()

            persistence = googleDrivePersistence;
            localStorage.setItem("persistence", "GoogleDrive");
            this.init();
          });
        };
        */

    }

  enrichWindow(window) {
    const component = this;
    window.$scope = component;

    // Avant fermeture de la page
    window.onbeforeunload = function(e) {
      console.log('Sauvegarde avant fermeture...');
      component.save();
    };

    // Raccourcis clavier
    window.onkeypress = function(event) {
      const code = event.code;
      switch (code) {
        case 'Space':
          component.playPause();
          event.stopPropagation();
          event.preventDefault();
          break;
      }
    };

    window.onkeydown = function(event) {
      const code = event.code;
      switch (code) {
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

    window.toggleDiscList = function(discListElement) {
      $(discListElement).toggle();
    };

    // Fermeture de la tracklist ouverte si click ailleurs
    window.document.addEventListener('click', function(e) {
      const lastToggled = component.lastToggledTracklist;
      if (lastToggled != null) $(lastToggled).hide();
    });

  }

  init() {

    const collectionParam = this.getCollectionParam();

    // Collections
    this.persistence.init({gapiClient: this.gapiClient})/*.then(isInit => {
      if (isInit && persistence instanceof GoogleDrivePersistence) {
        const loginBtn = document.getElementById("login-btn");
        loginBtn.innerText = "Connecté·e";
        this.connectedToGoogleDrive = true;
      }
    })*/.then(isInit => this.persistence.getCollectionNames())
    .then(collectionNames => collectionNames.filter(collectionName => collectionNames && collectionName.toLowerCase() !== DEFAULT_COLLECTION.toLowerCase()))
    .then(collectionNames => {
      collectionNames.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())); // tri alphabétique
      this.collectionNames = collectionNames;
      console.log('this.$apply(); init');
      return collectionNames;
    }).catch(e => {
      console.error(e);
      alert('Erreur lors du chargement de la liste des collections :' + e);
      throw e;
    }).then(knownCollectionNames => {

      this.discsById = {};
      /** @deprecated TODO à remplacer par discsById */
      this.discs = []; // au cas où personne ne l'initialise

      // Liste des disque en paramètre ?
      if (this.discsParam) {
        this.discIds = this.discsParam.split(',');
        this.loadDiscs(this.discIds);
      } else if (collectionParam) {
        const requestedCollectionNames = collectionParam.split(',');
        const collectionNames = [];
        const unknownCollectionNames = [];
        requestedCollectionNames.forEach(collectionName => {
          if ((<string[]> knownCollectionNames).indexOf(collectionName) !== -1) {
            collectionNames.push(collectionName);
          } else {
            unknownCollectionNames.push(collectionName);
          }
        });
        if (unknownCollectionNames.length) {
          alert('Les collections suivantes n\'ont pas été trouvées : ' + unknownCollectionNames.join(', '));
        }
        this.currentCollectionNames = collectionNames;

        const promises = [];
        this.discIdsByCollection = {};
        collectionNames.forEach(collectionParamI => {

          promises.push(Promise.resolve(collectionParamI)
            .then(collectionName => this.discIdsByCollection[collectionName])
            .then(discIds => {
              if (discIds) { return discIds; }

              return this.persistence.getCollectionDiscIds(collectionParamI)
                .catch(err => {
                  // alert("Impossible d'ouvrir la collection : " + collectionParam + " : " + err);
                  this.persistence.newCollection(collectionParamI).then(collection => {
                    this.collectionNames = this.collectionNames || [];
                    this.collectionNames.push(collectionParamI);
                    console.log('this.$apply(); init2');
                  }).catch(err2 => {
                    alert('Erreur lors de la création de cette collection');
                    history.back();
                  });
                });
            }));
        });

        Promise.all(promises.map(p => p.catch(e => e)))
          .then(results => {
            // Liste des disques pour chaque collection
            collectionNames.forEach((collectionParamI, i) => {
              this.discIdsByCollection[collectionParamI] = results[i];
            });
            this.loadDiscsFromCollections();
          })
          .catch(e => console.log(e));
      } else if (localStorage.getItem('discIds')) {
        console.log('On charge les disques enregistrés dans le localStorage');
        this.discIds = localStorage.getItem('discIds').split(',');
        this.loadDiscs(this.discIds);
      } else {
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
    }); // persistence.getCollectionNames.then

    // Tracklist togglée
    this.lastToggledTracklist = null;
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

  get $foreground() {
    return $('#foreground-overlay');
  }

  get $foregroundIcon() {
    return $('#foreground-overlay-icon');
  }

  showPlayer() {
    this.$foregroundIcon.html('<span class=\'glyphicon glyphicon-play\'></span>');
    this.$foreground.hide();
  }

  onYouTubeIframeAPIReady() {

    console.log("YouTube initialisé");

    // On cache le masque
    this.$foregroundIcon.html('<span class=\'glyphicon glyphicon-play\'></span>');
    this.$foreground.hide();

    // Si chargement
    const currentStr = localStorage.getItem('current');
    if (currentStr) {
      const current = JSON.parse(currentStr);
      const disc: Disc = _.find(this.discs, (discI) => discI && discI.id === current.discId);

      if (!disc) {
        console.error(`Disque anciennement joué d'id ${current.discId} non retrouvé. On lance un disque aléatoirement`);
        this.repeatMode = null;
        this.next();
      } else {
        console.log('Chargement de la précédente lecture...', current);

        const file = disc.files[current.fileIndex];
        const track = file.tracks[current.trackIndex];
        this.currentTrack = track;

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
      (<any>window).onYouTubeIframeAPIReady = function() {
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
    discIndex = defaults(discIndex, this.currentTrack && this.currentTrack.disc.index);

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
        console.error(`Impossible de charger la piste #${track.index} du disque ${disc.title} à t=${time} car début=${track.startSeconds} et fin =${track.endSeconds}.`, track);
        track = file.getTrackAt(time);
        console.log(`On charge la piste #${track.index} à la place`);
    }

    // On active automatiquement cette piste et ce disque
    disc.enabled = true;
    track.enabled = true;

    // Suppression dans la liste des suivants auto
    if (this.shuffle) {
      const nextTracks = disc.nextTracks;
      const i = nextTracks.indexOf(track.number);
      nextTracks.splice(i, 1); // on supprime que celui-ci
    }

    this.showOnlyPlaylist(disc.index);

    const start = getYouTubeStartSeconds(track, time); // YouTube n'accèpte que des entiers
    const end = multiTrack ? Math.floor(track.endSeconds) : undefined; // YouTube n'accèpte que des entiers
    if (start || end) { console.log(`Piste ${track.number} du disque ${disc.id} (de ${start}s à ${end}s) : ${track.title}`); }

    this.loadingTrack = track;
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

      // Premier chargement on en profite
      this.onFirstPlayerLoad();
    } else {

      const player = this.player;

      // TODO Ne pas recharger si on ne change pas de vidéo (videoId)
      if (this.currentTrack === track || player && player.getVideoUrl
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
    this.loadingTrack = track;
    const start = getYouTubeStartSeconds(track); // YouTube n'accèpte que des entiers
    this.seekTo(start ? start : 0); // start undefined quand video non multitrack
  }

  seekTo(time) {
    if (isNaN(time)) { return false; }
    if (this.checkCurrentTimeTimeout) { clearTimeout(this.checkCurrentTimeTimeout); }
    // console.log("TODO : seekTo("+time+")");
    this.player.seekTo(time, true);
    this.slider.value = time;
    this.fileSlider.value = time;
  }

  /**
   * Prochaine piste
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
        if (nextDisc && nextDisc.enabled && nextDisc.playable) { possibleDiscs.push(nextDisc); }
      }
    } else {
      possibleDiscs.push(disc);
    }

    // Aucun disque jouable ?
    if (!possibleDiscs.length) {
      throw new Error('Aucun disque activé (ou sans piste activées)');
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

    const previousEntry = this.history.length && this.history[this.history.length - 2];
    if (!previousEntry) { return; }

    const disc = this.discs[previousEntry.discIndex];
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
    if (!videoId) { return; }

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
    if (!video.snippet.title || !video.snippet.channelTitle || !video.contentDetails.duration) { return; }

    this.persistence.postDisc(videoId, video).then(() => {
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
    if (!this.currentTrack) { return undefined; }
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
    if (!player) { return; }
    const state = player.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
      this.pause(skipForeground);
    } else {
      this.play();
    }
  }

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
    if (!player) { return; }
    this.showPlayer();
    player.playVideo();
    this.isPlaying = true;
  }

  pause(skipForeground) {
    const player = this.player;
    if (!player) { return; }
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
    if (fn && (typeof(fn) === 'function')) {
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

  createDisc(disc) {
    console.log('Disque créé');

    const existingIds = this.discs.map(discI => discI.id);

    const existingDiscIndex = existingIds.indexOf(disc.id);
    if (existingDiscIndex !== -1) {
      if (!confirm('Ce disque est déjà dans le lecteur. Voulez-vous le remplacer ?')) {
        console.log('Création du disque annulée');
        return;
      }
      const existingDisc = this.discs[existingDiscIndex];
      disc.index = existingDisc.index;
      this.discs[existingDiscIndex] = disc;
    } else {
      disc.index = this.discs.length;
      this.discs.push(disc);
    }

    // En mode collection on ajoute également le disque à la collection
    if (this.currentCollectionNames && this.currentCollectionNames.length) {
      const collectionNames = this.currentCollectionNames;
      collectionNames.forEach(collectionName => {

        // uniquement si non existant
        const discIds = this.discIdsByCollection[collectionName];
        if (discIds.indexOf(disc.id) === -1) {

          if (collectionNames.length > 1 && !confirm(`On ajoute cette vidéo à la collection ${collectionName} ?`)) {
            return;
          }

          console.log('Ajout du disque dans la collection ' + collectionName);
          discIds.push(disc.id);
          this.persistence.postCollectionDiscIds(collectionName, discIds).then(discIdsI => {
            console.log('Disque ajouté avec succès dans la collection ' + collectionName);
          }, resKO => {
            alert('Erreur lors de l\'ajout du disque dans la collection ' + collectionName);
          });
        }

      });
    }

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
    if (!playlistId) { return cb('Aucun id de playlist'); }

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
  createNewDiscFromVideo (videoIdOrUrl, url, cb) {
    const videoId = getIdOrUrl(videoIdOrUrl, 'Id ou URL de la vidéo YouTube (multipiste)', 'v');
    if (!videoId) { return; }
    cb = cb || function (err, disc) {
    };

    this.getVideoSnippet(videoId, (err, snippet) => {
      if (err) { return cb(err); }

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
          const win = openInNewTab(`edit-cue?id=${disc.id}`);
        } else {
          alert('Erreur lors de la création du disque : ' + e.message);
        }
      }
    });

  }

  importDisc(disc, cb) {
    enrichDisc(disc, this.discs.length, this);

    console.log('Création du disc...', disc);
    // TODO : pouvoir passer le disc en JSON -> problème de circular ref
    this.persistence.postDisc(disc.id, disc).then(createdDisc => {
      this.createDisc(disc);
      if (cb) { cb(null, disc); }
    }, resKO => {
      alert('Erreur postDisc : ' + resKO.data);
      if (cb) { cb(resKO.data); }
    });
  }

  /**
   * Création d'un nouveau disque à partir d'une vidéo ou d'une playlist YouTube
   * @param {string} url? URL de la vidéo/playlist, si vide alors on demande à l'utilisateur
   * @param cb? callback
   */
  createNewDiscFromVideoOrPlaylist(url?: string, cb?: {(collection: Collection)}) {

    url = url || prompt('URL de la vidéo/playlist YouTube');
    cb = cb || (err => {
      console.log('this.$apply(); createNewDiscFromVideoOrPlaylist');
      if (err) {
        console.error(err);
        alert(err);
      }
    });
    if (!url) { return; }
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
      const index = this.discs.length;

      console.log(`On recherche si ${id} n'est pas déjà connu localement...`);
      this.persistence.getDisc(id, index).then(disc => {
        const msg = 'La vidéo/playlist existe déjà localement. L\'importer ?\nSi vous annulez le disque sera récréé à partir de YouTube.';
        if (confirm(msg)) {
          disc.src = url;
          // Import du disque (sans sauvegarde avec la persistance)
          enrichDisc(disc, this.discs.length, this);
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
      this.persistence.postCollection(collection).then(collectionCreee => {
        this.openCollection(name);
      });
    }
  }

  openCollection(name) {
    window.location.href = setParameterByName('collection', name);
  }

  /**
   * Sauvegarde l'état actuel dans le localStorage
   */
  save() {
    localStorage.setItem('discIds', this.discs
      .filter(disc => disc)
      .map(disc => disc.id)
      .filter(id => id)
      .toString()); // Angular fait chier : _.pluck(this.discs, 'id')
    localStorage.setItem('shuffle', '' + this.shuffle);
    if (this.repeatMode) {
        localStorage.setItem('repeatMode', this.repeatMode);
    } else {
        localStorage.removeItem('repeatMode');
    }
    localStorage.setItem('current', JSON.stringify({
        discId: this.currentTrack.disc.id,
        fileIndex: this.currentTrack.file.index,
        trackIndex: this.currentTrack.index,
        time: this.slider.value
    }));

    // Sauvegarde pour chaque disque
    this.discs.forEach((disc) => {
        const storage: any = {};

        if (!disc.enabled) {
            storage.enabled = false;
        }

        const disabledTrackIndices = disc.disabledTracks;
        if (disabledTrackIndices && disabledTrackIndices.length) {
            storage.disabledTrackIndices = disc.disabledTracks.map((track) => track.number - 1);
        }

        _.extend(storage, {
            nextTracks: disc.nextTracks
        });

        if (!_.isEmpty(storage)) {
            localStorage.setItem('disc.' + disc.id, JSON.stringify(storage)); // Chargé dans loadDisc
        }
    });

    console.log('Sauvegarde terminée');
  }

  restore(key, defaultValue) {
    const string = localStorage.getItem(key);
    if (!string) { return defaultValue; }
    if (string === 'true') { return true; }
    if (string === 'false') { return false; }
    if (string.match(/^\w/)) { return string; }
    return JSON.parse(string);
  }

  /**
   * Appelé par loadTrack lors de la 1ère création du player
   */
  onFirstPlayerLoad() {
    /*const lists = $("#playlist .video-list");
    lists.each(function()  {
        toggleVideoList(this);
    });*/
  }

  onPlayerReady(event) {
    const player = event ? event.target : this.player;
    player.playVideo();
    this.videoStarted.emit();
  }

  // 5. The API calls this function when the player's state changes.
  //    The function indicates that when playing a video (state=1),
  //    the player should play for six seconds and then stop.
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

    if (this.lastPlayerStates.length >= 10) { this.lastPlayerStates.shift(); }
    const lastState = this.lastPlayerStates.length ? this.lastPlayerStates[this.lastPlayerStates.length - 1] : undefined;
    this.lastPlayerStates.push(state);

    console.log('%c player state : ' + state + (YT_STATES[state] ? ':' + YT_STATES[state] : ''), `background: no-repeat left center url(https://youtube.com/favicon.ico); background-size: 16px; padding-left: 20px;`);

    // N'importe quel évènement après un chrono de deleted video => la supprimée n'est pas supprimée
    if (this.deletedVideoTimeout) {
      window.clearTimeout(this.deletedVideoTimeout);
      delete this.deletedVideoTimeout;
    }

    // Fin de la vidéo
    // on vérifie lastPlayedVideoIndex car cet évènement est souvent appelé deux fois
    // Détail des évènements : 2, 0 => next, -1, 0, -1, 3
    // Quand l'utilisateur scroll après la fin de la cue courante => YT.PlayerState.PAUSED
    if (state === YT.PlayerState.ENDED && (!this.loadingTrack ||
        this.loadingTrack.disc.index !== this.currentTrack.disc.index &&
        this.loadingTrack.file.index !== this.currentTrack.file.index &&
        this.loadingTrack.index !== this.currentTrack.index)) {
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
          if (index === -1) { return discIdsI; }

          discIdsI.splice(index, 1);
          return this.persistence.postCollectionDiscIds(collectionName, discIdsI);
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
        if (index === -1) { return; }

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

    this.loadDiscsFromCollections();
  }

  // TODO : comment déclarer des services avec Angular ?
  getCueService() {
    if (!this.cueService) { this.cueService = new CueService(this.http); }
    return this.cueService;
  }

  getDiscsIds(collectionName) {
    return new Promise((resolve, reject) => {
      // Recherche d'abord dans la mémoire
      resolve(this.discIdsByCollection[collectionName]);
    }).then(discIds => {
      if (discIds) {
        return discIds;
      } else {
        return this.persistence.getCollectionDiscIds(collectionName)
          .then(discIdsI => this.discIdsByCollection[collectionName] = discIdsI)
          .catch(err => {
            alert('Impossible d\'ouvrir la collection : ' + collectionName + ' : ' + err);
          });
      }
    });
  }

  playCollection(collectionName?): Promise<Disc[]> {
    this.currentCollectionNames = collectionName ? [collectionName] : [];
    return this.loadDiscsFromCollections();
  }

  // gapiClient.isSignedIn(GOOGLE_AUTH_PARAMS.clientId).then(isSignedIn => this.connectedToGoogleDrive = isSignedIn);
    connectGoogleDrive() {

        const loginBtn = document.getElementById('login-btn');
        loginBtn.innerText = 'Connexion...';
        // this.hidePlayer();

        const oldPersistence = this.persistence instanceof GoogleDrivePersistence ? this.localPersistence : this.persistence;
        const googleDrivePersistence = new GoogleDrivePersistence(this, this.http);
        this.googleDrivePersistence = googleDrivePersistence; // debug
        googleDrivePersistence.init({gapiClient: this.gapiClient}).then(isInit => {

            if (isInit) {
                notify(`Démarrage de la synchro avec ${googleDrivePersistence.title}...`);
                loginBtn.innerText = 'Connecté·e';
                this.connectedToGoogleDrive = true;
                localStorage.setItem('connectedToGoogleDrive', 'true');

                // synchro avec l'ancienne persistance pour ne rien perdre
                oldPersistence.sync(googleDrivePersistence).then(syncResult => {
                    const message = `Synchro terminée avec ${googleDrivePersistence.title}`;
                    console.log(message);
                    console.log(syncResult);
                    notify(message);

                    // On ne change pas de persistence pour accélérer les perfs
                    // puisse qu'on synchronise à chaque démarrage
                    // TODO : attention on crée avec this.persistence et pas localStorage
                    this.persistence = new LocalAndDistantPersistence(oldPersistence, googleDrivePersistence);
                    localStorage.setItem('persistence', `${this.persistence.title}('${oldPersistence.title}', '${googleDrivePersistence.title}')`);

                    this.init();
                }).catch(err => {
                    loginBtn.innerText = 'Connecté·e';
                    // this.showPlayer();
                    alert("Erreur de synchro entre la persistance actuelle et Google Drive");
                    console.error(err);
                });
            } else {
                loginBtn.innerText = 'Google Drive';
                // this.showPlayer();
            }
        }).catch(err => {
            loginBtn.innerText = 'Google Drive';
            // this.showPlayer();
            alert('Erreur de connexion à Google Drive');
            console.error(err);
        });
    }

  disconnectGoogleDrive() {
    // TODO
    this.connectedToGoogleDrive = false;
    const loginBtn = document.getElementById('login-btn');

    localStorage.removeItem('persistence');
    this.persistence = this.getPersistence();

    loginBtn.innerText = 'Google Drive';
  }

  /**
   *
   * @return {Persistence}
   */
  getPersistence(persistenceName = localStorage.getItem('persistence')) {
    if (persistenceName === 'GoogleDrive') {
      if (!GoogleDrivePersistence) {
        window.location.reload(); // FIXME bug à chaque démarrage auto en mode GoogleDrive
      }
      return new GoogleDrivePersistence(this, this.http);
    }
    if (persistenceName === 'LocalStorage') {
      return this.localPersistence;
    }
    if (persistenceName === 'LocalServer') {
      return new LocalServerPersistence(this, this.http);
    }
    if (persistenceName.startsWith('LocalAndDistant')) {
        const m = /LocalAndDistant\('(\w+)', '(\w+)'\)/.exec(persistenceName);
        if (m) {
            const local = this.getPersistence(m[1]);
            const distant = this.getPersistence(m[2]);
            if (local !== distant) {
                return new LocalAndDistantPersistence(local, distant);
            } else {
                return local;
            }
        }
        return this.localPersistence;
    }

    return (
      window.location.host === 'bludwarf.github.io'
      || window.location.port !== '3000'
      || getParameterByName('persistence', document.location.search) === 'LocalStorage') ?
         this.localPersistence : new LocalServerPersistence(this, this.http);
  }

  loadDiscs(discIdsToLoad): Promise<Disc[]> {

    console.log('Chargement des disques :', discIdsToLoad);
    this.hidePlayer();

    const discLoaders: Promise<Disc>[] = [];

    for (let discIndex = 0; discIndex < discIdsToLoad.length; ++discIndex) {

      const discId = discIdsToLoad[discIndex];
      const component = this;

      // Recherche d'abord dans la mémoire
      discLoaders[discIndex] = new Promise<Disc>((resolve, reject) => resolve(component.discsById[discId]))

        .then(cacheDisc => { // Disc en cache ?
          if (cacheDisc) { return cacheDisc; }

          let continueConfirm = false; // on désactive totalement la confirmation quand il manque une playlist
          return this.persistence.getDisc(discId, discIndex)
            .then(disc => {
              enrichDisc(disc, discIndex, this);

              // Reprise des paramètres sauvegardés
              const savedString = localStorage.getItem('disc.' + disc.id);
              if (savedString) {
                const saved = JSON.parse(savedString);
                if (saved.enabled !== undefined) {
                  disc.enabled = saved.enabled;
                }
                if (saved.disabledTrackIndices) {
                  const tracks = disc.tracks;
                  saved.disabledTrackIndices.forEach((trackIndex) => {
                    tracks[trackIndex].enabled = false;
                  });
                }
                _.extend(disc, {
                  nextTracks: saved.nextTracks
                });
              }

              // Cache
              this.discsById[discId] = disc;
              return disc;
            })
            .catch(resKO => {
              console.error('Error GET cuesheet ' + discId + ' via this.http :', resKO || resKO.data);
              if (continueConfirm) {
                continueConfirm = prompt('Veuillez ajouter la cuesheet ' + discId, discId) !== null;
              }
              return <Disc>null;
            });
        });

      // .then(disc => {
      //   // INIT si dernier disque
      //   if (--remainingDiscNumber === 0)
      //     initYT();
      // }, resKO => {
      //   // INIT si dernier disque
      //   if (--remainingDiscNumber === 0)
      //     initYT();
      //
      // })

      // .then(disc => this.discs[discIndex] = disc);
    } // for

    return Promise.all(discLoaders.map(p => p.catch(e => e)))
      .then(loadedDiscs => {
        this.discs = loadedDiscs;
        console.log('Disques chargés :', loadedDiscs);
        if (!this.isInitYT) {
          this.initYT(); // Aucun disque n'est présent ? On charge quand même YouTube pour plus tard
        } else {
          this.showPlayer();
        }
        return loadedDiscs;
      })
      .catch(e => {
        console.log(e);
        return <Disc[]>null;
      });

  }

  loadDiscsFromCollections(): Promise<Disc[]> {
    this.hidePlayer();
    const isDefaultCollection = this.currentCollectionNames.length === 0;

    // Historique navigateur
    const state = {
      currentCollectionNames: this.currentCollectionNames
    };
    const title = document.title;
    if (isDefaultCollection) {
      document.title = 'CueTube';
      history.pushState(state, document.title, '/player'); // TODO donne bien l'URL actuelle dans l'historique ?
    } else {
      document.title = 'CueTube - ' + this.currentCollectionNames.join(' + ');
      const collectionParam = this.currentCollectionNames.join(',');
      history.pushState(state, document.title, '/player' + collectionParam ? '?collection=' + encodeURIComponent(collectionParam) : 'player');
    }
    document.title = title;

    // On récupère la liste des disques de toutes les collections actives
    const getDiscsIds = this.currentCollectionNames
      .map(collectionName => this.getDiscsIds(collectionName ? collectionName : DEFAULT_COLLECTION));
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

    if (this.checkCurrentTimeTimeout) { clearTimeout(this.checkCurrentTimeTimeout); }
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
    if (lastToggledTracklist !== null && lastToggledTracklist !== tracklist) { $(lastToggledTracklist).hide(); }

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
      if (this.restore('connectedToGoogleDrive', false)) {
          this.connectGoogleDrive();
      }
  }

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
  if (typeof(value) === 'undefined') { return defaultValue; } else { return value; }
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

function enrichDisc(disc, discIndex, player: PlayerComponent) {

  disc.player = player;

  for (let fileIndex = 0; fileIndex < disc.files.length; ++fileIndex) {
    const file = disc.files[fileIndex];

    for (let trackIndex = 0; trackIndex < file.tracks.length; ++trackIndex) {
      const track = file.tracks[trackIndex];

      track.enabled = disc.enabled; // pour choisir les pistes à lire
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
