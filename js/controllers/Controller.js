/* global $, _, YT, cuesheet */
/* require ../cuesheet.js */
/* require ../cue.js */

/**
 * @property track.played : nombre de fois joué
 * @param cuetubeConf cf fichier de conf /js/app.conf.js
 */
function Controller($scope, $http, cuetubeConf/*, $ngConfirm*/) {

    const GOOGLE_KEY = "AIzaSyBOgJtkG7pN1jX4bmppMUXgeYf2vvIzNbE";
    const persistence = (window.location.host === "bludwarf.github.io" || getParameterByName("persistence", document.location.search) === 'LocalStorage') ? new LocalStoragePersistence($scope, $http) : new LocalServerPersistence($scope, $http);
    const DEFAULT_COLLECTION = '_DEFAULT_';

    //const socket = io.connect();
    //socket.emit('getVideo', $scope.text);

    /*fetch("/minecraft.json").then((res) => {
       return res.blob();
    })*/

    const discsParam = getParameterByName("discs", document.location.search);

    // Par défaut on se place toujours dans une collection pour éviter de perdre toutes ses données
    const collectionParam = getParameterByName("collection", document.location.search) || DEFAULT_COLLECTION;

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
        persistence.getCollectionDiscIds(collectionParam).then(discIds => {
            loadDiscs(discIds);
        }).catch(err => {
            alert("Impossible d'ouvrir la collection : " + collectionParam + " : " + err);
            //history.back();
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

    $scope.stopPropagation = function(e) {
        e.stopPropagation(); // pour ne pas appeler document.onclick
    };

    function enrichDisc(disc, discIndex) {

        disc.clickThumb = function(e) {

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
        disc.doubleClickThumb = function(e) {

            $scope.discs.forEach((disc) => {
                if (!disc) return;
                disc.enabled = disc === this;
            });

            this.load();
        };

        disc.afterClickThumbCheckbox = function(e) {
            // Alt + Click => activer/désactiver tous les autres
            if (e.altKey) {
                const input = e.currentTarget;
                // Cochage => on décoche tous les autres
                // et vice-versa
                const discs = $scope.discs;
                for (let i = 0; i < discs.length; ++i) {
                    const disc = discs[i];
                    if (!disc || disc === this) continue;
                    disc.enabled = !input.checked;
                }
            }

            e.stopPropagation();
        };

        disc.openTracklist = function(e, disc) {
            const discThumb = e.currentTarget;
            toggleTracklist(discThumb.nextElementSibling, disc);
            e.stopPropagation(); // pour ne pas appeler document.onclick
        };

        disc.load = function() {
            $scope.currentDiscIndex = discIndex === undefined ? this.index : discIndex;
            $scope.currentDisc = this;
            this.enabled = true;
            this.nextTrack($scope.shuffle);
            $scope.loadCurrentTrack($scope.player);
        };

        disc.play = function() {
            return this.load();
        };

        // TODO : à mettre dans disc.js
        /**
         * Prochaines pistes en mode aléatoire
         * Note dev : le tableau généré doit toujours pouvoir être modifié en dehors avec un shift()
         */
        Object.defineProperty(disc, 'nextTracks', {
            get: function() {

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
            set: function(value) {
                //console.log(`Pistes suivantes pour le disque ${this.id} : ${JSON.stringify(value)}`);
                this._nextTracks = value;
            }
        });

        // disc doit bien être playable avant de lancer nextTrack
        disc.nextTrack = function(shuffled) {

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

            // TODO : à changer en playTrack() ou setTrack()
            $scope.currentTrackIndex = track.index;
            $scope.currentTrack = track;
            $scope.currentFileIndex = track.file.index;
            $scope.currentFile = track.file;

            return track;
        };

        for (let fileIndex = 0; fileIndex < disc.files.length; ++fileIndex) {
            const file = disc.files[fileIndex];

            for (let trackIndex = 0; trackIndex < file.tracks.length; ++trackIndex) {
                const track = file.tracks[trackIndex];

                track.enabled = disc.enabled; // pour choisir les pistes à lire
                Object.defineProperties(track, {
                    isCurrent: {
                        get: function() {
                            return $scope.currentTrackIndex === this.index
                                && $scope.currentFileIndex  === this.file.index
                                && $scope.currentDiscIndex  === this.file.disc.index;
                        }
                    }
                });

                /**
                 * Quand coché + alt click =>   coche tous
                 *  si décoché + alt click => décoche tous
                 */
                track.afterClickCheckbox = function(e) {
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
                        let endIndex   = Math.max(last.index, this.index);
                        let tracks = this.disc.tracks.slice(startIndex, endIndex + 1);
                        tracks.forEach(function(track) {
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
                let savedString = localStorage.getItem('disc.'+disc.id);
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
                console.error("Error GET cuesheet "+discId+" via $http : "+resKO.data);
                prompt('Veuillez ajouter la cuesheet '+discId, discId);
            });
        }

        // Aucun disque n'est présent ? On charge quand même YouTube pour plus tard
        if (discIds.length === 0) {
            initYT();
        }

    }

    $scope.shuffle = true;
    $scope.history = [];

    $scope.currentDiscIndex = 0;
    $scope.currentDisc = null;
    $scope.currentFileIndex = 0;
    $scope.currentFile = null;
    $scope.currentTrackIndex = 0;

    $scope.loadingDiscIndex = null;
    $scope.loadingFileIndex = null;
    $scope.loadingTrackIndex = null;



    function initYT() {

        // TODO : éviter l'erreur : Uncaught ReferenceError: ytcfg is not defined
        console.log("Initialisation de YouTube");

        // 2. This code loads the IFrame Player API code asynchronously.
        const tag = document.createElement('script');

        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    }

    $scope.onYouTubeIframeAPIReady = function() {

        // Si chargement
        let currentStr = localStorage.getItem('current');
        if (currentStr) {
            let current = JSON.parse(currentStr);
            const disc = _.find($scope.discs, (disc) => disc && disc.id === current.discId);

            if (!disc) {
                console.error(`Disque anciennement joué d'id ${current.discId} non retrouvé`);
                $scope.currentDisc = undefined;
                $scope.currentDiscIndex = undefined;
                $scope.currentFile = undefined;
                $scope.currentFileIndex = undefined;
                $scope.currentTrack = undefined;
                $scope.currentTrackIndex = undefined;
            } else {
                console.log("Chargement de la précédente lecture...", current);

                $scope.currentDisc = disc;
                $scope.currentDiscIndex = disc.index;

                let file = disc.files[current.fileIndex];
                $scope.currentFile = file;
                $scope.currentFileIndex = file.index;

                let track = file.tracks[current.trackIndex];
                $scope.currentTrack = track;
                $scope.currentTrackIndex = track.index;

                // loadCurrentTrack sorti de apply pour éviter l'erreur "$apply already in progress"
                let player = $scope.loadCurrentTrack();
                $scope.$apply(() => {
                    $scope.player = player;
                });

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

    //@deprecated
    $scope.setDiscIndex = function(discIndex) {
        $scope.$apply(() => {
            $scope.currentDiscIndex = discIndex;
        });
    };

    //@deprecated
    $scope.setTrackIndex = function(trackIndex) {
        $scope.$apply(() => {
          $scope.currentTrackIndex = trackIndex;
        });
    };

    // @deprecated
    $scope.loadDiscIndex = function(discIndex) {
        this.currentDiscIndex = discIndex;
        const disc = $scope.discs[discIndex];
        $scope.currentDisc = disc;

        // Next file
        const fileIndex = $scope.shuffle ? Math.floor(Math.random() * disc.files.length) : 0;
        const file = disc.files[fileIndex];
        this.currentFileIndex = fileIndex;
        $scope.currentFile = file;

        // Next track
        const trackIndex = $scope.shuffle ? Math.floor(Math.random() * file.tracks.length) : 0;
        this.currentTrackIndex = trackIndex;

        this.loadTrackIndex(trackIndex);
    };

    function defaults(value, defaultValue) {
        if (typeof(value) === 'undefined') return defaultValue;
        else return value;
    }

    /**
     * @param [videoIndex]
     */
    $scope.loadTrackIndex = function(trackIndex, fileIndex, discIndex) {

        trackIndex = defaults(trackIndex, $scope.currentTrackIndex);
        fileIndex  = defaults(fileIndex, $scope.currentFileIndex);
        discIndex  = defaults(discIndex, $scope.currentDiscIndex);

        $scope.currentTrackIndex = trackIndex;
        $scope.currentFileIndex  = fileIndex;
        $scope.currentDiscIndex  = discIndex;

        const disc = $scope.discs[discIndex];
        $scope.currentDisc = disc;
        const file = disc.files[fileIndex];
        $scope.currentFile = file;
        const track = file.tracks[trackIndex];
        $scope.currentTrack = track;

        // On active automatiquement cette piste et ce disque
        disc.enabled = true;
        track.enabled = true;

        // Suppression dans la liste des suivants auto
        if ($scope.shuffle) {
            let nextTracks = $scope.currentDisc.nextTracks;
            let i = nextTracks.indexOf(track.number);
            nextTracks.splice(i, 1); // on supprime que celui-ci
        }

        $scope.loadCurrentTrack($scope.player);
    };

    /**
     * Prochaine piste
     */
    $scope.next = function() {
        $scope.$apply(() => {
            const discs = $scope.discs;
            let disc = $scope.currentDisc;
            let track = $scope.currentTrack;

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

            // Aléatoire ?
            if ($scope.shuffle) {

                $scope.currentDisc = weightedRandom(possibleDiscs, disc => disc.tracks.length);
                disc = $scope.currentDisc;
                $scope.currentDiscIndex = $scope.currentDisc.index;

                track = disc.nextTrack($scope.shuffle); // FIXME : arrêter la lecture si plus aucune piste
            }

            else {

                // prochaine piste ou 1ère du prochain disque
                do {
                    track = track.next;
                    if (!track) {
                        disc = discIndex < possibleDiscs.length - 1 ? possibleDiscs[discIndex + 1] : possibleDiscs[0];
                        track = disc.tracks[0];
                    }
                } while (!track.enabled);
            }

            $scope.currentTrackIndex = track.index;
            $scope.currentTrack = track;
            $scope.currentFileIndex = track.file.index;
            $scope.currentFile = track.file;
            $scope.currentDiscIndex = track.file.disc.index;
            $scope.currentDisc = track.file.disc;
        });

        // loadCurrentTrack sorti de apply pour éviter l'erreur "$apply already in progress"
        if ($scope.currentTrack) {
          const player = $scope.loadCurrentTrack($scope.player);
          $scope.$apply(() => {
            $scope.player = player;
          });
        } else {
            alert("Aucun disque à lire !");
        }
    };

    $scope.previous = function() {

        const previousEntry = this.history.length && this.history[this.history.length - 2];
        if (!previousEntry) return;

        this.currentDiscIndex = previousEntry.discIndex;
        this.currentFileIndex = previousEntry.fileIndex;
        this.currentTrackIndex = previousEntry.trackIndex;

        const disc = $scope.discs[this.currentDiscIndex];
        $scope.currentDisc = disc;
        $scope.currentFile = disc.files[this.currentFileIndex];

        this.history.pop(); // suppression du previous
        this.loadCurrentTrack($scope.player);
        this.history.pop(); // suppression du previous (ajouté par loadCurrentTrack)
    };

    $scope.showOnlyPlaylist = function(discIndex) {
        const discs = $("#playlist .disc");
        discs.each(function() {
            const list = $(".disc-list", this);
            if (this.dataset.index === discIndex)
                list.show();
            else
                list.hide();
        });
    };

    /** Ajout d'une nouvelle vidéo */
    $scope.addVideo = function() {
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

    // TODO : mettre un getter dans l'objet Cue.File
    $scope.getVideoId = function() {
        const disc = this.discs[this.currentDiscIndex];
        const file = disc.files[this.currentFileIndex];
        //return getVideoIdFromUrl(file.name);
        //return getParameterByName("v", file.name);
        return file.videoId;
    };

    $scope.getVideoUrlFromId = function(id) {
        return "https://www.youtube.com/watch?v="+id;
    };


    /** @return Promise https://developers.google.com/youtube/v3/docs/videos#resource */
    $scope.getVideoSnippet = function(videoId, cb) {
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

    $scope.loadCurrentTrack = function() {
        const disc = this.discs[this.currentDiscIndex];
        const file = disc.files[this.currentFileIndex];
        const track = file.tracks[this.currentTrackIndex];
        const multiTrack = file.tracks.length > 1;

        disc.enabled = true;
        track.enabled = true;

        this.showOnlyPlaylist(this.currentDiscIndex);

        let start = multiTrack ? Math.floor(track.startSeconds) : undefined; // YouTube n'accèpte que des entiers
        const end = multiTrack ? Math.floor(track.endSeconds) : undefined; // YouTube n'accèpte que des entiers
        if (start || end) console.log("Track from "+start+" to "+end);

        // Youtube ne redémarre pas à 0 si on lui indique exactement 0
        if (multiTrack && !start) {
            start = 0.001; // FIXME : OK  alors que YouTube n'accèpte que des entiers ?
        }

        if (!$scope.player) {
            // On peut récupérer cette variable a posteriori avec : YT.get("player")
            $scope.player = new YT.Player('player', {
                height: '360',
                width: '640',
                videoId: this.getVideoId(),
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
        // else {
        //     player = new YT.Player('player', {
        //         height: '90',
        //         width: '160',
        //         videoId: video.videoId,
        //         playerVars: { // https://developers.google.com/youtube/player_parameters?hl=fr
        //             autoplay: 1,
        //             start: cue.startSeconds,
        //             end: cue.endSeconds
        //         },
        //         events: {
        //             'onReady': onPlayerReady,
        //             'onStateChange': onPlayerStateChange
        //         }
        //     });
        // }
        else {

            const player = $scope.player;

            // TODO Ne pas recharger si on ne change pas de vidéo (videoId)
            /*
             const loadedVideoId = getParameterByName('v', player.getVideoUrl());
             if (loadedVideoId == this.getVideoId()) {
             this.changeVideoIHM();
             $scope.seekTo(start);
             //player.playVideoAt(start); // TODO : lancer si pausé
             }

             // Changement de vidéo YouTube
             else {
             */
            // FIXME : graphiquement on ne voit plus les bornes start et end
            player.loadVideoById({
                videoId: this.getVideoId(),
                startSeconds: start,
                endSeconds: end,
                playerVars: { // https://developers.google.com/youtube/player_parameters?hl=fr
                    autoplay: 1,
                    start: start,
                    end: end
                }
            });

            // Changement IHM (déjà appelé au 1er chargement par onPlayerReady)
            //this.changeVideoIHM();
            //}
        }

        $scope.loadingDiscIndex = $scope.currentDiscIndex;
        $scope.loadingFileIndex = $scope.currentFileIndex;
        $scope.loadingTrackIndex = $scope.currentTrackIndex;

        // Notif
        notify((track.title || "Track "+track.number), {
            tag: 'loadCurrentTrack',
            body: disc.title
        });

        // Historique
        this.history.push({
            discId: disc.discId,
            discIndex: this.currentDiscIndex,
            fileIndex: this.currentFileIndex,
            trackIndex: this.currentTrackIndex,
            date: new Date()
        });

        return $scope.player;
    };

    function onPlayerReady(event) {
        event.target.playVideo();
        $scope.changeVideoIHM();
        checkCurrentTime();
    }

    const YT_STATES = [
        "ENDED",
        "PLAYING",
        "PAUSED",
        "BUFFERING",
        null,
        "CUED",
    ];

    $scope.$on("video started", (event) => {
        const scope = event.currentScope;
        const player = scope.player;
        scope.loadingDiscIndex = null;
        scope.loadingFileIndex = null;
        scope.loadingTrackIndex = null;

        // On en profite pour renseigner la durée de la vidéo maintenant qu'on la connait
        const file = scope.currentFile;
        if (!file.duration) file.duration = player.getDuration();
        // TODO : on pourrait stocker cette information sur le serveur

        // Pour les vidéos à une seule piste on ne connaissait pas la durée de la vidéo avant
        //const slider = document.getElementById("player-controls-form").trackPosition;
        const slider = scope.slider;
        if (slider && (!slider.max || slider.max === 'undefined')) {
            console.log("Pour les vidéos à une seule piste on ne connaissait pas la durée de la vidéo avant");
            slider.max = file.duration;
        }
        scope.fileSlider.max = file.duration;

        scope.changeVideoIHM(); // au cas ou on a déplacé le curseur

        // Incrémentation du nombre de lectures de la piste courante
        const track = $scope.getCurrentTrack();
        ++track.played;
    });

    $scope.$on("video ended", (event) => {
        const scope = event.currentScope;
        scope.next();
    });

    $scope.$on("video manual seeked", (event) => {
        // on cherche la piste courant uniquement pour une vidéo multipiste
        if ($scope.currentDisc.tracks.length > 1) {
          const track = $scope.currentFile.getTrackAt($scope.player.getCurrentTime());
          if (track) {
            console.log(`On a sauté manuellement vers la piste #${track.number} ${track.title}`);
            $scope.currentTrack = track;
            $scope.currentTrackIndex = track.index;
          }
        }
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

        console.log("player state : " + state + (YT_STATES[state] ? ":"+YT_STATES[state] : ""));

        // Fin de la vidéo
        // on vérifie lastPlayedVideoIndex car cet évènement est souvent appelé deux fois
        // Détail des évènements : 2, 0 => next, -1, 0, -1, 3
        // Quand l'utilisateur scroll après la fin de la cue courante => YT.PlayerState.PAUSED
        if (state === YT.PlayerState.ENDED && $scope.loadingDiscIndex !== $scope.currentDiscIndex && $scope.loadingFileIndex !== $scope.currentFileIndex && $scope.loadingTrackIndex !== $scope.currentTrackIndex) {
            $scope.$emit("video ended");
        }

        // Vidéo démarrée
        // vérification pour ne pas appeler deux fois l'évènement "Fin de la vidéo"
        // TODO : ne pas appeler quand on fait un manual seek
        else if (state === YT.PlayerState.PLAYING) {
            $scope.$emit("video started");
        }

        // FIXME : détection changement manuel de cue
        /*else if (event.data = YT.PlayerState.PAUSED && loadingFileIndex == null && loadingTrackIndex == null) {
          console.log("Pause at : "+player.getCurrentTime());
          const cueIndex = getCueIndexAt(videos[currentDiscIndex], player.getCurrentTime());
          console.log("Pause at cue :", cueIndex);

          if (cueIndex != -1 && cueIndex != currentTrackIndex) {
            console.log("Changement de cue manuel");
            const video = videos[currentDiscIndex];
            player.loadVideoById({
              videoId: video.videoId,
              startSeconds: video.cues[cueIndex].startSeconds,
              endSeconds: (cueIndex + 1 < video.cues.length ? video.cues[cueIndex+1].startSeconds : video.endSeconds)
            });
            loadingFileIndex = currentDiscIndex;
            loadingTrackIndex = cueIndex;
          }
        }*/

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

    $scope.changeVideoIHM = function() {
        const disc = this.discs[this.currentDiscIndex];
        const file = disc.files[this.currentFileIndex];
        const track = file.tracks[this.currentTrackIndex];
        document.title = track.title + " - CueTube"; // Youtube affiche : disc.title + " - m3u-YouTube"

        // Slider
        //const form = document.getElementById("player-controls-form");
        //const slider = form.trackPosition;
        const slider = $scope.slider;
        slider.min = track.startSeconds;
        slider.max = track.endSeconds;
        $scope.fileSlider.max = file.duration;
    };

    /**
     * Appelé par loadCurrentTrack lors de la 1ère création du player
     */
    function onFirstPlayerLoad() {
       /*const lists = $("#playlist .video-list");
       lists.each(function()  {
           toggleVideoList(this);
       });*/
    }


    $scope.playPause = function() {
        const player = $scope.player;
        if (!player) return;
        const state = player.getPlayerState();
        if (state === YT.PlayerState.PLAYING)
            player.pauseVideo();
        else
            player.playVideo();
    };

    $scope.getCurrentTrack = function() {
      return $scope.currentFile.tracks[this.currentTrackIndex];
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

    $scope.seekTo = function(time) {
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
          nextCheckCurrentTime = (1 - ($scope.player.getCurrentTime() % 1)) *1000; // on actualise qu'au prochain changement de seconde
          checkCurrentTimeTimeout = setTimeout(checkCurrentTime, nextCheckCurrentTime); // boucle
        }

        // changement de secondes ?
        if (!lastCheckedTime || Math.floor(time) !== Math.floor(lastCheckedTime)) {
          $scope.safeApply(() => { // FIXME : aucune actualisation sans safeApply, erreur "$apply already in progress" si $apply
            $scope.slider.value = time;
            $scope.fileSlider.value = time;
            scheduleNextCheckCurrentTime();
          });
        } else {
            scheduleNextCheckCurrentTime();
        }
    }

    /** src : https://coderwall.com/p/ngisma/safe-apply-in-angular-js */
    $scope.safeApply = function(fn) {
      const phase = this.$root.$$phase;
      if(phase === '$apply' || phase === '$digest') {
        if(fn && (typeof(fn) === 'function')) {
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
     * Crée un disque à partir d'une playlist contenant uniquement des vidéos avec une seule piste
     */
    $scope.newDiscFromPlaylistItems = function(playlistItems) {
        playlistItems = playlistItems.items || playlistItems;
        let disc = ytparser.newDiscFromPlaylistItems(playlistItems, prompt("Nom du disque", playlistItems[0].snippet.title));
        return enrichDisc(disc, $scope.discs.length);
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

    $scope.createDisc = function(disc) {
        console.log("Disque créé");

        const existingIds = $scope.discs.map(disc => disc.id);

        const existingDiscIndex = existingIds.indexOf(disc.id);
        if (existingDiscIndex !== -1) {
            if (!confirm("Ce disque est déjà dans le lecteur. Voulez-vous l'écraser ?")) {
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
            console.log("Ajout du disque dans la collection "+collectionParam);
            const discIds = $scope.discs.map(disc => disc.id);
            persistence.postCollectionDiscIds(collectionParam, discIds).then(discIds => {
                console.log("Disque ajouté avec succès dans la collection "+collectionParam);
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

    $scope.createNewDiscFromPlaylist = function(playlistIdOrUrl, url, cb) {
        const playlistId = getIdOrUrl(playlistIdOrUrl, 'Id ou URL de la playlist YouTube', 'list');
        if (!playlistId) return;

        $scope.getPlaylistItems(playlistId, (err, playlistItems) => {
            if (err) {
                alert('Erreur createNewDiscFromPlaylist : '+err.message);
                return;
            }

            const disc = $scope.newDiscFromPlaylistItems(playlistItems);
            disc.src = url;
            persistence.postDisc(disc.id, disc).then(res => {
                $scope.createDisc(disc);
                if (cb) cb(null, disc);
            }, resKO => {
                alert('Erreur POST createNewDiscFromPlaylist : '+resKO.data);
                if (cb) cb(resKO.data); // FIXME : throw err ?
            });
        });
    };

    $scope.$watch('currentDisc', function(newDisc, oldDisc) {
        if (newDisc !== oldDisc) {
            document.body.style.backgroundImage = 'url(https://img.youtube.com/vi/'+newDisc.videoId+'/hqdefault.jpg)'
        }
    });

    // TODO : cb => Promise
    $scope.createNewDiscFromVideo = function(videoIdOrUrl, url, cb) {
        const videoId = getIdOrUrl(videoIdOrUrl, 'Id ou URL de la vidéo YouTube (multipiste)', 'v');
        if (!videoId) return;
        cb = cb || function(err, disc) {
        };

        $scope.getVideoSnippet(videoId, (err, snippet) => {
            if (err) return cb(err);

            const videoUrl = $scope.getVideoUrlFromId(videoId);
            try {
                let disc = ytparser.newDiscFromVideoSnippet(snippet, videoUrl);
                disc.src = url;
                enrichDisc(disc, $scope.discs.length);

                console.log("Création du disc...", disc);

                // TODO : pouvoir passer le disc en JSON -> problème de circular ref
                persistence.postDisc(videoId, disc).then(createdDisc => {
                    $scope.createDisc(disc);
                    if (cb) cb(null, disc);
                }, resKO => {
                    alert('Erreur POST createNewDiscFromVideo : ' + resKO.data);
                    if (cb) cb(resKO.data);
                });
            } catch (e) {
                    if (e.name === "youtube.notracklist") {
                    const disc = e.disc;
                    alert("La description de la vidéo ne contient aucune tracklist, on va faire une recherche sur freedb...");
                    const win = openInNewTab(`http://www.regeert.nl/cuesheet/?str=${encodeURIComponent(disc.title)}`);



                } else {
                    alert("Erreur lors de la création du disque : " + e.message);
                }
            }
        });

    };

    function openInNewTab(url) {
        const win = window.open(url, '_blank');
        win.focus();
        return win;
    }

    $scope.createNewDiscFromVideoOrPlaylist = function(url, cb) {

        url = url || prompt("URL de la vidéo/playlist YouTube");
        cb = cb || (err => {
            if (err) {
                console.error(err);
                alert(err);
            }
        });
        if (!url) return;
        const playlistId = getParameterByName('list', url);

        if (playlistId) {
            return $scope.createNewDiscFromPlaylist(playlistId, url, cb);
        } else {
            return $scope.createNewDiscFromVideo(url, url, cb);
        }
    };

    /**
     * Sauvegarde l'état actuel dans le localStorage
     */
    $scope.save = function() {
        localStorage.setItem('discIds', _.pluck($scope.discs, 'id'));
        localStorage.setItem('shuffle', $scope.shuffle);
        localStorage.setItem('current', JSON.stringify({
            discId: $scope.currentDisc.id,
            fileIndex: $scope.currentFile.index,
            trackIndex: $scope.currentTrack.index
        }));

        // Sauvegarde pour chaque disque
        $scope.discs.forEach((disc) => {
            let storage = {};

            if (!disc.enabled) {
                storage.enabled = false;
            }

            const disabledTrackIndices = disc.disabledTracks;
            if (disabledTrackIndices && disabledTrackIndices.length) {
                storage.disabledTrackIndices = disc.disabledTracks.map((track) => track.number-1);
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

    $scope.restore = function(key, defaultValue) {
        const string = localStorage.getItem(key);
        if (!string) return defaultValue;
        return JSON.parse(string);
    };

  /**
   *
   * @param time
   * @return {string}
   * @author https://stackoverflow.com/a/6313008
   */
  $scope.formatHHMMSS = function(time) {
    return formatHHMMSS(time);
  };

  /**
   *
   * @param time
   * @return {string}
   */
    $scope.formatMMSS = function(time) {
      return formatMMSS(time);
    };

  /**
   * Format YouTube
   * @param time
   * @return {string}
   */
    $scope.formatHMSS = function(time) {
      return formatHMSS(time);
    };

  /**
   * L'heure actuelle
   * @param offset décalage en secondes
   * @return {string} exemple "12:48"
   */
  $scope.getTime = function(offset) {
        const d = new Date();
        if (offset) {
            d.setTime(d.getTime() + offset * 1000);
        }
        return d.toTimeString().substring(0, 5);
    };

    // INIT

    // Paramètres
    $scope.shuffle = $scope.restore('shuffle', true);

} // Controller
