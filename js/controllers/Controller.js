/* global $, _, YT, cuesheet */
/* require ../cuesheet.js */

/* require ../cue.js */

/**
 * @property track.played : nombre de fois joué
 * @param cuetubeConf cf fichier de conf /js/app.conf.js
 */
function Controller($scope, $http, cuetubeConf/*, $ngConfirm*/) {

  const GOOGLE_KEY = "AIzaSyBOgJtkG7pN1jX4bmppMUXgeYf2vvIzNbE";
  const localPersistence = new LocalStoragePersistence($scope, $http);
  const persistence = (window.location.host === "bludwarf.github.io" || getParameterByName("persistence", document.location.search) === 'LocalStorage') ? localPersistence : new LocalServerPersistence($scope, $http);
  const DEFAULT_COLLECTION = '_DEFAULT_';

  /** Temps d'attente avant de déclarer une vidéo supprimée (en secondes) */
  const DELETED_VIDEO_TIMEOUT = 10;

  const $foreground = $("#foreground-overlay");
  const $foregroundIcon = $("#foreground-overlay-icon");
  const $window = $(window);

  // Ajustement pour le CSS
  const $fontSize50List = $(".font-size-50p"); // ajuste la taille du texte pour avoir une police qui prend 50% de l'écran
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

  //const socket = io.connect();
  //socket.emit('getVideo', $scope.text);

  /*fetch("/minecraft.json").then((res) => {
     return res.blob();
  })*/

  const discsParam = getParameterByName("discs", document.location.search);

  // Par défaut on se place toujours dans une collection pour éviter de perdre toutes ses données
  const collectionParam = getParameterByName("collection", document.location.search) || DEFAULT_COLLECTION;

  $scope.isDefaultCollection = collectionParam.toLocaleLowerCase() === DEFAULT_COLLECTION.toLocaleLowerCase();
  /** Nom de la collection affiché à l'écran */
  $scope.collectionName = !$scope.isDefaultCollection ? collectionParam : 'Collection par défaut';

  /** Toutes les collections indexées par nom de collection */
  $scope.discIdsByCollection = {};
  $scope.currentCollectionNames = [];

  // Playlist jeux vidéos : collection=Jeux%20Vid%C3%A9os

  let discIds;
  let remainingDiscNumber;
  let discs;
  $scope.discs = []; // au cas où personne ne l'initialise

  // Liste des disque en paramètre ?
  if (discsParam) {
    discIds = discsParam.split(",");
    loadDiscs(discIds);
  }

  // Collection de disques en paramètre ?
  else if (collectionParam) {
    if ($scope.currentCollectionNames.indexOf(collectionParam) === -1) {
      $scope.currentCollectionNames.push(collectionParam);
    }
    persistence.getCollectionDiscIds(collectionParam).then(discIds => {
      loadDiscs(discIds);
    }).catch(err => {
      // alert("Impossible d'ouvrir la collection : " + collectionParam + " : " + err);
      persistence.newCollection(collectionParam).then(collection => {
        $scope.collectionNames = $scope.collectionNames || [];
        $scope.collectionNames.push(collectionParam);
        $scope.$apply();
        loadDiscs(collection.discIds);
      }).catch(err => {
        alert('Erreur lors de la création de cette collection');
        history.back();
      });
    });
  }

  // Pas de demande, on reprend la sauvegarde
  else if (localStorage.getItem('discIds')) {
    console.log("On charge les disques enregistrés dans le localStorage");
    discIds = localStorage.getItem('discIds').split(',');
    loadDiscs(discIds);
  }

  // Pas de demande de playlist => "Démo"
  else {
    discIds = [
      "Dg0IjOzopYU",
      "RRtlWfi6jiM",
      "TGXwvLupP5A",
      "WGmHaMRAXuI",
      "_VlTKjkDdbs",
      //"8OS4A2a-Fxg", // sushi
      //"zvHQELG1QHE" // démons et manants
    ];
  }

  // Tracklist togglée
  $scope.lastToggledTracklist = null;

  function toggleTracklist(tracklist, disc) {
    const lastToggledTracklist = $scope.lastToggledTracklist;
    if (lastToggledTracklist !== null && lastToggledTracklist !== tracklist) $(lastToggledTracklist).hide();

    $(tracklist).toggle();

    if ($(tracklist).is(':visible')) {
      $scope.discInTracklist = disc; // disque ouvert dans la liste des pistes (tooltip)
    } else {
      $scope.discInTracklist = null;
    }

    $scope.lastToggledTracklist = tracklist;
  }

  $scope.toggleRepeatMode = function(e) {
    if ($scope.repeatMode === 'track') {
      $scope.repeatMode = '';
    } else {
      $scope.repeatMode = 'track';
    }
  };

  $scope.stopPropagation = function (e) {
    e.stopPropagation(); // pour ne pas appeler document.onclick
  };

  function enrichDisc(disc, discIndex) {

    disc.clickThumb = function (e) {

      // Ctrl + Click => activer/désactiver disque
      if (e.ctrlKey) {
        return this.enabled = !this.enabled;
      }

      // Alt + Click => activer/désactiver tous les autres
      else if (e.altKey) {
        this.enabled = !this.enabled;
        // Cochage => on décoche tous les autres
        // et vice-versa
        const discs = $scope.discs;
        for (let i = 0; i < discs.length; ++i) {
          const disc = discs[i];
          if (!disc || disc === this) continue;
          disc.enabled = !this.enabled;
        }
      }

      // Sinon => ouvrir la tracklist
      else {
        return this.openTracklist(e, this);
      }
    };

    // Active uniquement ce CD et le lit tout de suite
    disc.doubleClickThumb = function (e) {

      $scope.discs.forEach((disc) => {
        if (!disc) return;
        disc.enabled = disc === this;
      });

      this.load();
    };

    disc.afterClickThumbCheckbox = function (e) {
      const input = e.currentTarget;

      // Alt + Click => activer/désactiver tous les autres
      if (e.altKey) {
        // Cochage => on décoche tous les autres
        // et vice-versa
        const discs = $scope.discs;
        for (let i = 0; i < discs.length; ++i) {
          const disc = discs[i];
          if (!disc || disc === this) continue;
          disc.enabled = !input.checked;
        }
      }

      // Maj + click => activer/désactiver tous entre les deux
      if (e.shiftKey) {
        let last = $scope.lastCheckedDisc;
        let startIndex = Math.min(last.index, this.index);
        let endIndex = Math.max(last.index, this.index);
        let discs = $scope.discs.slice(startIndex, endIndex + 1);
        discs.forEach(function (disc) {
          if (!disc || disc === this) return;
          disc.enabled = input.checked;
        });
      }

      // Sauvegarde du dernier click (sans Maj)
      if (!e.shiftKey) {
        $scope.lastCheckedDisc = this;
      }

      e.stopPropagation();
    };

    disc.openTracklist = function (e, disc) {
      const discThumb = e.currentTarget;
      toggleTracklist(discThumb.nextElementSibling, disc);
      e.stopPropagation(); // pour ne pas appeler document.onclick
    };

    disc.load = function () {
      this.enabled = true;
      const track = this.nextTrack($scope.shuffle, this);
      $scope.loadTrack(track);
    };

    disc.play = function () {
      return this.load();
    };

    // TODO : à mettre dans disc.js
    /**
     * Prochaines pistes en mode aléatoire
     * Note dev : le tableau généré doit toujours pouvoir être modifié en dehors avec un shift()
     */
    Object.defineProperty(disc, 'nextTracks', {
      get: function () {

        function generate(disc, shuffled) {
          let nextTracks = disc._nextTracks;
          if (!nextTracks || !nextTracks.length) {
            nextTracks = [];
            disc.tracks.forEach((track) => {
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
      },
      set: function (value) {
        //console.log(`Pistes suivantes pour le disque ${this.id} : ${JSON.stringify(value)}`);
        this._nextTracks = value;
      }
    });

    // disc doit bien être playable avant de lancer nextTrack
    disc.nextTrack = function (shuffled) {

      // On prend la prochaine piste active
      let track = null;

      if (shuffled) {
        while (track === null || !track.enabled) {
          let nextTracks = this.nextTracks;
          track = this.tracks[nextTracks.shift() - 1];
        }
      } else {
        if ($scope.currentTrack.disc === this) {
          track = $scope.currentTrack.next;
        } else {
          track = this.tracks[0];
        }
      }

      return track;
    };

    for (let fileIndex = 0; fileIndex < disc.files.length; ++fileIndex) {
      const file = disc.files[fileIndex];

      for (let trackIndex = 0; trackIndex < file.tracks.length; ++trackIndex) {
        const track = file.tracks[trackIndex];

        track.enabled = disc.enabled; // pour choisir les pistes à lire
        Object.defineProperties(track, {
          isCurrent: {
            get: function () {
              return $scope.currentTrack &&
                  $scope.currentTrack.index === this.index &&
                  $scope.currentTrack.file.index === this.file.index &&
                  $scope.currentTrack.disc.index === this.file.disc.index;
            }
          }
        });

        /**
         * Quand coché + alt click =>   coche tous
         *  si décoché + alt click => décoche tous
         */
        track.afterClickCheckbox = function (e) {
          let input = e.currentTarget;

          // Alt + Click => activer/désactiver tous les autres
          if (e.altKey) {
            // Cochage => on décoche tous les autres
            // et vice-versa
            const tracks = this.disc.tracks;
            for (let i = 0; i < tracks.length; ++i) {
              const track = tracks[i];
              if (!track || track === this) continue;
              track.enabled = !input.checked;
            }
          }

          // Maj + click => activer/désactiver tous entre les deux
          if (e.shiftKey) {
            let last = $scope.lastCheckedTrack;
            let startIndex = Math.min(last.index, this.index);
            let endIndex = Math.max(last.index, this.index);
            let tracks = this.disc.tracks.slice(startIndex, endIndex + 1);
            tracks.forEach(function (track) {
              if (!track || track === this) return;
              track.enabled = input.checked;
            });
          }

          // Sauvegarde du dernier click (sans Maj)
          if (!e.shiftKey) {
            $scope.lastCheckedTrack = this;
          }

          e.stopPropagation();
        };
      }
    }

    return disc;
  }

  // TODO : discsById
  function loadDiscs(discIds) {
    remainingDiscNumber = discIds.length;
    discs = new Array(remainingDiscNumber);
    $scope.discs = discs;

    for (let discIndex = 0; discIndex < discIds.length; ++discIndex) {

      const discId = discIds[discIndex];
      persistence.getDisc(discId, discIndex).then(disc => {
        discs[discIndex] = disc;
        enrichDisc(disc, discIndex);

        // Reprise des paramètres sauvegardés
        let savedString = localStorage.getItem('disc.' + disc.id);
        if (savedString) {
          let saved = JSON.parse(savedString);
          if (saved.enabled !== undefined) {
            disc.enabled = saved.enabled;
          }
          if (saved.disabledTrackIndices) {
            let tracks = disc.tracks;
            saved.disabledTrackIndices.forEach((trackIndex) => {
              tracks[trackIndex].enabled = false;
            });
          }
          _.extend(disc, {
            nextTracks: saved.nextTracks
          });
        }

        // INIT si dernier disque
        if (--remainingDiscNumber === 0)
          initYT();
      }, resKO => {
        // INIT si dernier disque
        if (--remainingDiscNumber === 0)
          initYT();
        console.error("Error GET cuesheet " + discId + " via $http : " + resKO.data);
        prompt('Veuillez ajouter la cuesheet ' + discId, discId);
      });
    }

    // Aucun disque n'est présent ? On charge quand même YouTube pour plus tard
    if (discIds.length === 0) {
      initYT();
    }

  }

  $scope.shuffle = true;
  $scope.history = [];
  $scope.currentTrack = null;
  $scope.loadingTrack = null;

  function initYT() {

    // TODO : éviter l'erreur : Uncaught ReferenceError: ytcfg is not defined
    console.log("Initialisation de YouTube");

    // 2. This code loads the IFrame Player API code asynchronously.
    const tag = document.createElement('script');

    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  }

  $scope.onYouTubeIframeAPIReady = function () {

    // On cache le masque
    $foregroundIcon.html("<span class='glyphicon glyphicon-play'></span>");
    $foreground.hide();

    // Si chargement
    let currentStr = localStorage.getItem('current');
    if (currentStr) {
      let current = JSON.parse(currentStr);
      const disc = _.find($scope.discs, (disc) => disc && disc.id === current.discId);

      if (!disc) {
        console.error(`Disque anciennement joué d'id ${current.discId} non retrouvé`);
        $scope.currentTrack = undefined;
      } else {
        console.log("Chargement de la précédente lecture...", current);

        let file = disc.files[current.fileIndex];
        let track = file.tracks[current.trackIndex];
        $scope.currentTrack = track;

        // loadTrack sorti de apply pour éviter l'erreur "$apply already in progress"
        $scope.loadTrack(track, current.time);

        return;
      }
    }

    // Premier lancement ...
    if ((!$scope.discs || !$scope.discs.length)) {
      // ... de l'application
      if (collectionParam === DEFAULT_COLLECTION) {
        alert("Bienvenue sur CueTube mec ! Pour lancer du gros son ajoute un album avec le bouton en haut à droite. Enjoy !");
      }
      // ... de la collection
      else {
        alert("Cette collection est vide pour le moment. Ajoute un disque et fais péter les watts.");
      }
      return;
    }

    getCtrl().next();
  };

  // @deprecated
  $scope.loadDiscIndex = function (discIndex) {
    const disc = $scope.discs[discIndex];

    // Next file
    const fileIndex = $scope.shuffle ? Math.floor(Math.random() * disc.files.length) : 0;
    const file = disc.files[fileIndex];

    // Next track
    const trackIndex = $scope.shuffle ? Math.floor(Math.random() * file.tracks.length) : 0;
    this.loadTrack(track);
  };

  function defaults(value, defaultValue) {
    if (typeof(value) === 'undefined') return defaultValue;
    else return value;
  }

  /**
   * @param [videoIndex]
   */
  $scope.loadTrackIndex = function (trackIndex, fileIndex, discIndex) {

    trackIndex = defaults(trackIndex, $scope.currentTrack.index);
    fileIndex = defaults(fileIndex, $scope.currentTrack.file.index);
    discIndex = defaults(discIndex, $scope.currentTrack.disc.index);

    const disc = $scope.discs[discIndex];
    const file = disc.files[fileIndex];
    const track = file.tracks[trackIndex];

    $scope.loadTrack(track);
  };

  // TODO à déplacer dans yt-helper
  function getYouTubeStartSeconds(track, time) {
    const file = track.file;
    const multiTrack = file.tracks.length > 1;
    let start = multiTrack ? Math.floor(track.startSeconds + (time ? time : 0)) : time; // YouTube n'accèpte que des entiers, on met undefined si !multitrack et pas de time

    // Youtube ne redémarre pas à 0 si on lui indique exactement 0
    if (multiTrack && !start) {
      start = 0.001; // FIXME : OK  alors que YouTube n'accèpte que des entiers ?
    }

    return start;
  }

  /**
   * @param track {Disc.Track} piste à charger
   */
  $scope.loadTrack = function (track, time) {

    clearTimeout(checkCurrentTimeTimeout); // suppression de tous les timers

    const file = track.file;
    const disc = file.disc;
    const multiTrack = file.tracks.length > 1;

    // On active automatiquement cette piste et ce disque
    disc.enabled = true;
    track.enabled = true;

    // Suppression dans la liste des suivants auto
    if ($scope.shuffle) {
      let nextTracks = disc.nextTracks;
      let i = nextTracks.indexOf(track.number);
      nextTracks.splice(i, 1); // on supprime que celui-ci
    }

    this.showOnlyPlaylist(disc.index);

    const start = getYouTubeStartSeconds(track, time); // YouTube n'accèpte que des entiers
    const end = multiTrack ? Math.floor(track.endSeconds) : undefined; // YouTube n'accèpte que des entiers
    if (start || end) console.log("Track from " + start + " to " + end);

    $scope.loadingTrack = track;
    if (!$scope.player) {
      // On peut récupérer cette variable a posteriori avec : YT.get("player")
      const aspect = 16 / 9;
      const height = 180;
      $scope.player = new YT.Player('player', {
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
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange
        }
      });

      // Premier chargement on en profite
      onFirstPlayerLoad();
    }

    else {

      const player = $scope.player;

      // TODO Ne pas recharger si on ne change pas de vidéo (videoId)
      if ($scope.currentTrack === track || getParameterByName('v', player.getVideoUrl()) === track.file.videoId) {
        $scope.reloadTrack(track);
      }

      // Changement de vidéo YouTube
      else {
        // FIXME : graphiquement on ne voit plus les bornes start et end
        player.loadVideoById({
          videoId: track.file.videoId,
          startSeconds: start,
          endSeconds: end,
          playerVars: { // https://developers.google.com/youtube/player_parameters?hl=fr
            autoplay: 1,
            start: start,
            end: end
          }
        });
      }
    }
  };

  /**
   * @param track {Disc.Track} piste à charger
   */
  $scope.reloadTrack = function (track) {
    track = track || $scope.currentTrack;
    $scope.loadingTrack = track;
    const start = getYouTubeStartSeconds(track); // YouTube n'accèpte que des entiers
    $scope.seekTo(start ? start : 0); // start undefined quand video non multitrack
  };

  /**
   * Prochaine piste
   */
  $scope.next = function () {
    const discs = $scope.discs;
    let track = $scope.currentTrack;
    let disc = track && track.disc;

    const possibleDiscs = [];
    for (let i = 0; i < discs.length; ++i) {
      let disc = discs[i];
      if (disc && disc.enabled && disc.playable) possibleDiscs.push(disc);
    }

    // Aucun disque jouable ?
    if (!possibleDiscs.length) {
      throw new Error("Aucun disque activé (ou sans piste activées)");
    }

    const discIndex = possibleDiscs.indexOf(disc);

    // Répétition de la piste ?
    if ($scope.repeatMode === 'track') {
      console.log("On répète la même piste comme demandé");
    }

    // Aléatoire ?
    else if ($scope.shuffle) {
      disc = weightedRandom(possibleDiscs, disc => disc.tracks.length);
      track = disc.nextTrack($scope.shuffle); // FIXME : arrêter la lecture si plus aucune piste
    }

    else {

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
      $scope.loadTrack(track);
    } else {
      alert("Aucun disque à lire !");
    }
  };

  $scope.previous = function () {

    const previousEntry = this.history.length && this.history[this.history.length - 2];
    if (!previousEntry) return;

    const disc = $scope.discs[previousEntry.discIndex];
    const file = disc.files[previousEntry.fileIndex];
    const track = file.tracks[previousEntry.trackIndex];

    this.history.pop(); // suppression du previous
    this.loadTrack(track);
    this.history.pop(); // suppression du previous (ajouté par loadTrack)
  };

  $scope.showOnlyPlaylist = function (discIndex) {
    const discs = $("#playlist .disc");
    discs.each(function () {
      const list = $(".disc-list", this);
      if (this.dataset.index === discIndex)
        list.show();
      else
        list.hide();
    });
  };

  /** Ajout d'une nouvelle vidéo */
  $scope.addVideo = function () {
    const videoId = prompt("videoId de la nouvelle vidéo ?");
    if (!videoId) return;

    // Structure YouTube
    // FIXME : remplacer les prompt en cascade par un form
    const video = {
      snippet: {
        title: prompt("Titre"),
        channelTitle: prompt("Nom de la chaîne")
      },
      contentDetails: {
        duration: prompt("Durée (exemple : \"PT2H6M53S\" = 2h 6m 53s)")
      }
    };

    // Annulé ?
    if (!video.snippet.title || !video.snippet.channelTitle || !video.contentDetails.duration) return;

    persistence.postDisc(videoId, video).then(() => {
      // POST OK
      alert('POST OK');
    }, () => {
      // POST KO
      alert('POST KO');
    });
  };

  $scope.getVideoId = function () {
    //return getVideoIdFromUrl(file.name);
    //return getParameterByName("v", file.name);
    if (!this.currentTrack) return undefined;
    return this.currentTrack.file.videoId;
  };

  $scope.getVideoUrlFromId = function (id) {
    return "https://www.youtube.com/watch?v=" + id;
  };


  /** @return Promise https://developers.google.com/youtube/v3/docs/videos#resource */
  $scope.getVideoSnippet = function (videoId, cb) {
    // TODO comment recréer une Promise par dessus le promise de getVideo .
    persistence.getVideo(videoId, GOOGLE_KEY).then(video => {
      cb(null, video.snippet);
    }).catch(err => {
      cb(err);
    });
  };

  $scope.debugData = {
    getVideoSnippet: undefined
  };


  /*function getVideoIdFromUrl(url) {
      const i = url.indexOf('?');
      if (i === -1) return undefined;
      const query = querystring.decode(url.substr(i+1));
      return query.v;
  }*/

  function onPlayerReady(event) {
    const player = event ? event.target : $scope.player;
    player.playVideo();
    $scope.$emit("video started");
  }

  const YT_STATES = [
    "ENDED",
    "PLAYING",
    "PAUSED",
    "BUFFERING",
    null,
    "CUED",
  ];

  function onTrackStarted(event) {
    console.log("on video started");
    const scope = event ? event.currentScope : $scope;
    const player = scope.player;
    const track = scope.loadingTrack || scope.currentTrack; // loadingTrack vide si manual seeking

    // On en profite pour renseigner la durée de la vidéo maintenant qu'on la connait
    const file = track.file;
    if (!file.duration) file.duration = player.getDuration();
    // TODO : on pourrait stocker cette information sur le serveur

    // Incrémentation du nombre de lectures de la piste courante
    track.played = track.played ? track.played + 1 : 1;

    const disc = file.disc;
    document.title = track.title + " - CueTube"; // Youtube affiche : disc.title + " - m3u-YouTube"

    // Notif
    notify((track.title || "Track " + track.number), {
      tag: 'onTrackStarted',
      body: disc.title,
      icon: track.file.icon
    });

    // Historique
    scope.history.push({
      discId: disc.discId,
      discIndex: track.disc.index,
      fileIndex: track.file.index,
      trackIndex: track.index,
      date: new Date()
    });

    scope.loadingDiscIndex = null;
    scope.loadingFileIndex = null;
    scope.loadingTrack = null;
    scope.currentTrack = track;

    onTrackPlaying(event);
  }

  $scope.$on("video started", (event) => {
    onTrackStarted(event);
  });

  function onTrackPlaying(event) {
    const scope = event.currentScope;
    const track = scope.currentTrack;
    const file = track.file;

    // Pour les vidéos à une seule piste on ne connaissait pas la durée de la vidéo avant
    //const slider = document.getElementById("player-controls-form").trackPosition;
    const slider = scope.slider;
    if (slider && (!slider.max || slider.max === 'undefined')) {
      console.log("Pour les vidéos à une seule piste on ne connaissait pas la durée de la vidéo avant");
      slider.max = file.duration;
    }
    scope.fileSlider.max = file.duration;

    scope.isPlaying = true;
    scope.changeVideoIHM(); // au cas ou on a déplacé le curseur
  }

  $scope.$on("video playing", (event) => {
    console.log("on video playing");
    const scope = event.currentScope;

    // On vient en fait de démarrer une nouvelle piste ?
    if (scope.loadingTrack) {
      return onTrackStarted(event);
    } else {
      return onTrackPlaying(event);
    }
  });

  function onTrackEnded(event) {
    const scope = event ? event.currentScope : $scope;

    if (scope.repeatMode === 'track') {
      scope.reloadTrack();
    } else if (scope.shuffle) {
      scope.next();
    } else {
      scope.checkCurrentTrack();
    }
  }

  $scope.$on("video ended", (event) => {
    console.log("$on(\"video ended\"");
    const scope = event.currentScope;
    scope.next();
  });

  $scope.$on("video manual seeked", (event) => {
    // on cherche la piste courant uniquement pour une vidéo multipiste
    if ($scope.currentTrack.disc.tracks.length > 1) {
      $scope.checkCurrentTrack();
    }
  });

  $scope.checkCurrentTrack = function() {
    const track = $scope.currentTrack.file.getTrackAt($scope.player.getCurrentTime());
    if (track && track !== $scope.currentTrack) {
      console.log(`On est passé à la piste #${track.number} ${track.title}`);
      $scope.currentTrack = track;
      $scope.$emit("video started");
    }
  };

  /** On vient de lancer une vidéo retirée de YouTube */
  $scope.$on("unstarted video", (event) => {
    // On démarre un chrono de 2 seconde pour détecter si la vidéo a été supprimée
    if (!$scope.deletedVideoTimeout) {
      console.log(`La vidéo n'a pas encore démarré. On attend ${DELETED_VIDEO_TIMEOUT} secondes avant de la déclarer comme supprimée de YouTube...`);
      $scope.deletedVideoTimeout = window.setTimeout(function () {
        console.error(`La vidéo n'a toujours pas démarrée depuis ${DELETED_VIDEO_TIMEOUT} secondes. On la déclare supprimée.`);
        $scope.$emit("deleted video");
      }, DELETED_VIDEO_TIMEOUT * 1000);
    }
  });

  /** On vient de lancer une vidéo retirée de YouTube */
  $scope.$on("deleted video", (event) => {
    if (!$scope.currentTrack) return;

    const file = $scope.currentTrack.file;
    console.error(`La vidéo ${file.videoId} du disque "${file.disc.title}" n'existe plus sur YouTube. On la désactive et on passe à la suivante...`);
    file.enabled = false;
    $scope.next();
  });

  $scope.lastPlayerStates = [];

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
  function onPlayerStateChange(event) {
    //const player = event.target;
    const state = event.data;

    console.log("player state : " + state + (YT_STATES[state] ? ":" + YT_STATES[state] : ""));

    // N'importe quel évènement après un chrono de deleted video => la supprimée n'est pas supprimée
    if ($scope.deletedVideoTimeout) {
      window.clearTimeout($scope.deletedVideoTimeout);
      delete $scope.deletedVideoTimeout;
    }

    // Fin de la vidéo
    // on vérifie lastPlayedVideoIndex car cet évènement est souvent appelé deux fois
    // Détail des évènements : 2, 0 => next, -1, 0, -1, 3
    // Quand l'utilisateur scroll après la fin de la cue courante => YT.PlayerState.PAUSED
    if (state === YT.PlayerState.ENDED && (!$scope.loadingTrack ||
            $scope.loadingTrack.disc.index !== $scope.currentTrack.disc.index &&
            $scope.loadingTrack.file.index !== $scope.currentTrack.file.index &&
            $scope.loadingTrack.index !== $scope.currentTrack.index)) {
      $scope.$emit("video ended");
    }

    // Vidéo démarrée
    // vérification pour ne pas appeler deux fois l'évènement "Fin de la vidéo"
    // TODO : ne pas appeler quand on fait un manual seek
    else if (state === YT.PlayerState.PLAYING) {
      $scope.isPlaying = true;
      $scope.$emit("video playing");
    }

    else if (state === YT.PlayerState.PAUSED) {
      $scope.isPlaying = false;
    }

    if ($scope.lastPlayerStates.length >= 10) $scope.lastPlayerStates.shift();
    $scope.lastPlayerStates.push(state);

    // Détection d'une série de 3 évènements
    if ($scope.lastPlayerStates.length >= 3) {
      const states = new Array(3);
      for (let i = 0; i < 3; ++i) {
        states[i] = $scope.lastPlayerStates[$scope.lastPlayerStates.length - (3 - i)];
      }

      if (states[0] === YT.PlayerState.PAUSED &&
          states[1] === YT.PlayerState.BUFFERING &&
          states[2] === YT.PlayerState.PLAYING) {
        $scope.$emit("video manual seeked");
      }

      if (states[0] === -1 &&
          states[1] === YT.PlayerState.BUFFERING &&
          states[2] === -1) {
        $scope.$emit("unstarted video");
      }
    }

    // On démarre un chrono pour détecter si la 1ère vidéo chargée a été supprimée
    else if (state === -1) {
      $scope.$emit("unstarted video");
    }
  }

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

  /**
   * Déclenché à chaque mise à jour de la position
   */
  $scope.changeVideoIHM = function () {
    const track = $scope.currentTrack;

    // Slider
    //const form = document.getElementById("player-controls-form");
    //const slider = form.trackPosition;
    const slider = $scope.slider;
    slider.min = track.startSeconds;
    slider.max = track.endSeconds;
    $scope.fileSlider.max = track.file.duration;

    checkCurrentTime();
  };

  /**
   * Appelé par loadTrack lors de la 1ère création du player
   */
  function onFirstPlayerLoad() {
    /*const lists = $("#playlist .video-list");
    lists.each(function()  {
        toggleVideoList(this);
    });*/
  }

  /** latence si on passe par $scope.player.getPlayerStat() */
  $scope.isPlaying = undefined;

  $scope.playPause = function (skipForeground) {
    const player = $scope.player;
    if (!player) return;
    const state = player.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
      $scope.pause();
    } else {
      $scope.play(skipForeground);
    }
  };

  $scope.play = function () {
    const player = $scope.player;
    if (!player) return;
    $foregroundIcon.html("<span class='glyphicon glyphicon-play'></span>");
    $foreground.hide();
    player.playVideo();
    $scope.isPlaying = true;
  };

  $scope.pause = function (skipForeground) {
    const player = $scope.player;
    if (!player) return;
    player.pauseVideo();
    if (!skipForeground) {
      $foregroundIcon.html(`<span class="glyphicon glyphicon-pause"></span>`);
      $foreground.show();
    }
    $scope.isPlaying = false;
  };

  $scope.fileSlider = {
    min: 0,
    value: 0,
    max: 100
  };
  $scope.slider = {
    min: 0,
    value: 0,
    max: 100
  };
  $scope.sliderPosition = 0;

  $scope.seekTo = function (time) {
    if (isNaN(time)) return false;
    //console.log("TODO : seekTo("+time+")");
    $scope.player.seekTo(time);
    $scope.slider.value = time;
    $scope.fileSlider.value = time;
  };

  let lastCheckedTime = undefined;
  let nextCheckCurrentTime = undefined;
  let checkCurrentTimeTimeout = undefined; // prochain appel
  /**
   * Actualise l'IHM à chaque changement de seconde ou sur demande (en l'appelant)
   */
  function checkCurrentTime() {
    if (checkCurrentTimeTimeout) clearTimeout(checkCurrentTimeTimeout);
    const time = $scope.player.getCurrentTime();

    function scheduleNextCheckCurrentTime() {
      nextCheckCurrentTime = (1 - ($scope.player.getCurrentTime() % 1)) * 1000; // on actualise qu'au prochain changement de seconde
      checkCurrentTimeTimeout = setTimeout(checkCurrentTime, nextCheckCurrentTime); // boucle
    }

    // changement de secondes ?
    if (!lastCheckedTime || Math.floor(time) !== Math.floor(lastCheckedTime)) {
      $scope.safeApply(() => { // FIXME : aucune actualisation sans safeApply, erreur "$apply already in progress" si $apply
        $scope.slider.value = time;
        $scope.fileSlider.value = time;
        // Changement de piste ?
        if ($scope.slider.value >= $scope.slider.max) {
          onTrackEnded();
        }
        scheduleNextCheckCurrentTime();
      });
    } else {
      scheduleNextCheckCurrentTime();
    }
  }

  /** src : https://coderwall.com/p/ngisma/safe-apply-in-angular-js */
  $scope.safeApply = function (fn) {
    const phase = this.$root.$$phase;
    if (phase === '$apply' || phase === '$digest') {
      if (fn && (typeof(fn) === 'function')) {
        fn();
      }
    } else {
      this.$apply(fn);
    }
  };

  /** https://developers.google.com/youtube/v3/docs/playlistItems/list */
  // TODO : convertir en promise
  $scope.getPlaylistItems = function (playlistId, cb) {
    persistence.getPlaylistItems(playlistId, GOOGLE_KEY).then(data => {
      cb(null, data);
    }).catch(err => {
      cb(err);
    })
  };

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

  $scope.createDisc = function (disc) {
    console.log("Disque créé");

    const existingIds = $scope.discs.map(disc => disc.id);

    const existingDiscIndex = existingIds.indexOf(disc.id);
    if (existingDiscIndex !== -1) {
      if (!confirm("Ce disque est déjà dans le lecteur. Voulez-vous le remplacer ?")) {
        console.log("Création du disque annulée");
        return;
      }
      const existingDisc = $scope.discs[existingDiscIndex];
      disc.index = existingDisc.index;
      $scope.discs[existingDiscIndex] = disc;
      return;
    } else {
      disc.index = $scope.discs.length;
    }

    $scope.discs.push(disc);

    // En mode collection on ajoute également le disque à la collection
    if (collectionParam) {
      console.log("Ajout du disque dans la collection " + collectionParam);
      const discIds = $scope.discs.map(disc => disc.id);
      persistence.postCollectionDiscIds(collectionParam, discIds).then(discIds => {
        console.log("Disque ajouté avec succès dans la collection " + collectionParam);
      }, resKO => {
        alert("Erreur lors de l'ajout du disque dans la collection " + collectionParam);
      });
    }

    // On affiche l'id du disque pour que l'utilisateur puisse l'ajouter dans sa playlist (URL)
    if (cuetubeConf.debug) {
      prompt("Disque créé avec l'id suivant", disc.id);
    }

    // Lecture auto
    if (cuetubeConf.addDisc.autoplay) {
      disc.play();
    }
  };

  $scope.createNewDiscFromPlaylist = function (playlistIdOrUrl, url, cb) {
    const playlistId = getIdOrUrl(playlistIdOrUrl, 'Id ou URL de la playlist YouTube', 'list');
    if (!playlistId) return cb("Aucun id de playlist");

    $scope.getPlaylistItems(playlistId, (err, playlistItems) => {
      if (err) {
        return cb('Erreur createNewDiscFromPlaylist : ' + err.message);
      }

      playlistItems = playlistItems.items || playlistItems;
      const disc = ytparser.newDiscFromPlaylistItems(playlistItems, prompt("Nom du disque", playlistItems[0].snippet.title));
      disc.src = url;
      $scope.importDisc(disc, cb);
    });
  };

  $scope.$watch('currentTrack', function (newTrack, oldTrack) {
    const newDisc = newTrack ? newTrack.disc : null;
    const oldDisc = oldTrack ? oldTrack.disc : null;
    if (newDisc !== oldDisc) {
      document.body.style.backgroundImage = 'url(https://img.youtube.com/vi/' + newDisc.videoId + '/hqdefault.jpg)'
    }
  });

  // TODO : cb => Promise
  $scope.createNewDiscFromVideo = function (videoIdOrUrl, url, cb) {
    const videoId = getIdOrUrl(videoIdOrUrl, 'Id ou URL de la vidéo YouTube (multipiste)', 'v');
    if (!videoId) return;
    cb = cb || function (err, disc) {
    };

    $scope.getVideoSnippet(videoId, (err, snippet) => {
      if (err) return cb(err);

      const videoUrl = $scope.getVideoUrlFromId(videoId);
      try {
        let disc = ytparser.newDiscFromVideoSnippet(snippet, videoUrl);
        disc.src = url;
        $scope.importDisc(disc, cb);
      } catch (e) {
        if (e.name === "youtube.notracklist") {
          const disc = e.disc;
          localPersistence.setItem("discToCreate", disc);
          alert("La description de la vidéo ne contient aucune tracklist, on va commencer la création du disque...");
          const win = openInNewTab(`edit-cue?id=${disc.id}`);
        } else {
          alert("Erreur lors de la création du disque : " + e.message);
        }
      }
    });

  };

  $scope.importDisc = function (disc, cb) {
    enrichDisc(disc, $scope.discs.length);

    console.log("Création du disc...", disc);
    // TODO : pouvoir passer le disc en JSON -> problème de circular ref
    persistence.postDisc(disc.id, disc).then(createdDisc => {
      $scope.createDisc(disc);
      if (cb) cb(null, disc);
    }, resKO => {
      alert('Erreur postDisc : ' + resKO.data);
      if (cb) cb(resKO.data);
    });
  };

  function openInNewTab(url) {
    const win = window.open(url, '_blank');
    win.focus();
    return win;
  }

  $scope.createNewDiscFromVideoOrPlaylist = function (url, cb) {

    url = url || prompt("URL de la vidéo/playlist YouTube");
    cb = cb || (err => {
      if (err) {
        console.error(err);
        alert(err);
      }
    });
    if (!url) return;
    const playlistId = getParameterByName('list', url);
    const videoId = getParameterByName('v', url);

    // Si la cue n'est pas connue de CueTube/cues
    function fallback() {
      if (playlistId) {
        return $scope.createNewDiscFromPlaylist(playlistId, url, cb);
      } else {
        return $scope.createNewDiscFromVideo(url, url, cb);
      }
    }

    // Vidéo déjà connue sur CueTube/cues ?
    if (playlistId || videoId) {
      const id = playlistId || videoId;
      const index = $scope.discs.length;

      console.log(`On recherche si ${id} n'est pas déjà connu localement...`);
      persistence.getDisc(id, index).then(disc => {
        if (confirm("La vidéo/playlist existe déjà localement. L'importer ?\nSi vous annulez le disque sera récréé à partir de YouTube.")) {
          disc.src = url;
          $scope.importDisc(disc, cb);
        } else {
          fallback();
        }
      }).catch(err => {
        console.error("Erreur lors de la récupération locale : " + err);

        console.log("On recherche si " + id + " n'est pas déjà connu de CueTube...");
        $scope.getCueService().getCueFromCueTube(id).then(cue => {
          if (confirm("La vidéo/playlist existe déjà dans CueTube. L'importer ?\nSi vous annulez le disque sera récréé à partir de YouTube.")) {
            const disc = new Disc(cue);
            disc.src = url;
            $scope.importDisc(disc, cb);
          } else {
            fallback();
          }
        }).catch(err => {
          console.error("Erreur lors de la récupération dans CueTube : " + err);
          fallback();
        });
      });

    } else {
      fallback();
    }
  };

  $scope.createCollection = function (name) {
    name = name || prompt("Nom de la collection à créer");
    if (name) {
      this.openCollection(name);
    }
  };

  $scope.openCollection = function (name) {
    window.location.href = setParameterByName('collection', name);
  };

  /**
   * Sauvegarde l'état actuel dans le localStorage
   */
  $scope.save = function () {
    localStorage.setItem('discIds', _.pluck($scope.discs, 'id'));
    localStorage.setItem('shuffle', $scope.shuffle);
    localStorage.setItem('repeatMode', $scope.repeatMode);
    localStorage.setItem('current', JSON.stringify({
      discId: $scope.currentTrack.disc.id,
      fileIndex: $scope.currentTrack.file.index,
      trackIndex: $scope.currentTrack.index,
      time: $scope.slider.value
    }));

    // Sauvegarde pour chaque disque
    $scope.discs.forEach((disc) => {
      let storage = {};

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

    console.log("Sauvegarde terminée");
  };

  $scope.restore = function (key, defaultValue) {
    const string = localStorage.getItem(key);
    if (!string) return defaultValue;
    if (string === 'true') return true;
    if (string === 'false') return false;
    if (string.match(/^\w/)) return string;
    return JSON.parse(string);
  };

  /**
   *
   * @param time
   * @return {string}
   * @author https://stackoverflow.com/a/6313008
   */
  $scope.formatHHMMSS = function (time) {
    return formatHHMMSS(time);
  };

  /**
   *
   * @param time
   * @return {string}
   */
  $scope.formatMMSS = function (time) {
    return formatMMSS(time);
  };

  /**
   * Format YouTube
   * @param time
   * @return {string}
   */
  $scope.formatHMSS = function (time) {
    return formatHMSS(time);
  };

  /**
   * L'heure actuelle
   * @param offset décalage en secondes
   * @return {string} exemple "12:48"
   */
  $scope.getTime = function (offset) {
    const d = new Date();
    if (offset) {
      d.setTime(d.getTime() + offset * 1000);
    }
    return d.toTimeString().substring(0, 5);
  };

  // INIT

  // Paramètres
  $scope.shuffle = $scope.restore('shuffle', true);
  $scope.repeatMode = $scope.restore('repeatMode', '');
  $scope.slider.value = $scope.restore('time', 0);

  // Collections
  persistence.getCollectionNames().then((collectionNames => {
    $scope.collectionNames = collectionNames;
  })).catch(e => {
    console.error("Erreur lors du chargement de la liste des collections :", e);
  });

  // TODO : comment déclarer des services avec Angular ?
  $scope.getCueService = function () {
    if (!$scope.cueService) $scope.cueService = new CueService($http);
    return $scope.cueService;
  };

  $scope.removeDisc = function (disc) {
    if (!confirm(`Voulez-vous vraiment retirer le disque\n${disc.title}\nde la collection "${collectionParam}" ?`)) return;
    const index = $scope.discs.indexOf(disc);
    if (index === -1) return;
    $scope.discs.splice(index, 1);
    persistence.postCollectionDiscIds(collectionParam, $scope.discs.map(disc => disc.id));
  };

  $scope.toggleCollection = function(collectionName) {

    // Coché ?
    const index = $scope.currentCollectionNames.indexOf(collectionName);
    const checked = index === -1;
    if (checked) {
      $scope.currentCollectionNames.push(collectionName);
    } else {
      $scope.currentCollectionNames.splice(index, 1);
    }

    // On récupère la liste des disques de toutes les collections actives
    const getDiscsIds = $scope.currentCollectionNames.map(collectionName => $scope.getDiscsIds(collectionName));
    Promise.all(getDiscsIds.map(p => p.catch(e => e)))
        .then(discIdsByIndex => discIdsByIndex.reduce((all, array) => {
          // On concatère les disques sans doublons
          array.forEach(item => {
            if (all.indexOf(item) === -1) {
              all.push(item);
            }
          });
          return all;
        }))
        .then(discIds => loadDiscs(discIds))
        .catch(e => alert('Erreur lors du chargement des disques des collections : '+e));

  };

  $scope.getDiscsIds = function(collectionName) {
    return new Promise(function(resolve, reject) {
      // Recherche d'abord dans la mémoire
      resolve($scope.discIdsByCollection[collectionName]);
    }).then(discIds => {
      if (discIds) {
        return discIds;
      } else {
        return persistence.getCollectionDiscIds(collectionName).catch(err => {
          alert("Impossible d'ouvrir la collection : " + collectionName + " : " + err);
        });
      }
    });
  }

} // Controller
