/* global $, _, YT, cuesheet */
/* require ../cuesheet.js */

function Controller($scope, $http) {
    
    var GOOGLE_KEY = "AIzaSyBOgJtkG7pN1jX4bmppMUXgeYf2vvIzNbE";

    //var socket = io.connect();
    //socket.emit('getVideo', $scope.text);

    /*fetch("/minecraft.json").then((res) => {
       return res.blob(); 
    })*/
    
    var discsParam = getParameterByName("discs", document.location.search);
    
    // Playlist jeux vidéos : discs=Dg0IjOzopYU,0WGKC2J3g_Y,TGXwvLupP5A,WGmHaMRAXuI,GRWpooKRLwg,zvHQELG1QHE
    
    var discIds = discsParam && discsParam.split(",") || [
        "Dg0IjOzopYU",
        "0WGKC2J3g_Y",
        "TGXwvLupP5A",
        "WGmHaMRAXuI",
        "GRWpooKRLwg",
        //"8OS4A2a-Fxg", // sushi
        //"zvHQELG1QHE" // démons et manants
    ];
    var remainingDiscNumber = discIds.length;
    var discs = new Array(remainingDiscNumber);
    
    // Tracklist togglée
    $scope.lastToggledTracklist = null;
    function toggleTracklist(tracklist) {
        var lastToggledTracklist = $scope.lastToggledTracklist;
        if (lastToggledTracklist != null && lastToggledTracklist != tracklist) $(lastToggledTracklist).hide();
        
        $(tracklist).toggle();
        
        $scope.lastToggledTracklist = tracklist;
    }
    
    $scope.stopPropagation = function(e) {
        e.stopPropagation(); // pour ne pas appeler document.onclick
    };
    
    function enrichDisc(disc, discIndex) {
        disc.index = discIndex;
        disc.enabled = true; // pour choisir les vidéos à lire
        
        // Getters pour Disc
        Object.defineProperties(disc, {
            id: {
                get: function() {
                    return this.videoId;
                }
            },
            videoId: {
                get: function() {
                    if (!this.files || !this.files.length) return undefined;
                    return this.files[0].videoId;
                }
            }
        });
        
        disc.clickThumb = function(e) {
            // Ctrl + Click => activer/désactiver disque
            if (e.ctrlKey) {
                return this.enabled = !this.enabled;
            }
            
            // Sinon => ouvrir la tracklist
            else {
                return this.openTracklist(e);
            }
        };
        
        disc.afterClickThumbCheckbox = function(e) {
            // Alt + Click => activer/désactiver tous les autres
            if (e.altKey) {
                var input = e.currentTarget;
                // Cochage => on décoche tous les autres
                // et vice-versa
                var discs = $scope.discs;
                for (var i = 0; i < discs.length; ++i) {
                    var disc = discs[i];
                    if (!disc || disc === this) continue;
                    disc.enabled = !input.checked;
                }
            }
            
            e.stopPropagation();
        };
                
        disc.openTracklist = function(e) {
            var discThumb = e.currentTarget;
            toggleTracklist(discThumb.nextElementSibling);
            e.stopPropagation(); // pour ne pas appeler document.onclick
        }
        
        disc.load = function() {
            $scope.currentDiscIndex = discIndex;
            $scope.currentDisc = this;
            this.nextTrack();
            $scope.loadCurrentTrack($scope.player);
        };
        
        disc.nextTrack = function() {
            var disc = this;
            
            // Next file
            var fileIndex = $scope.shuffle ? Math.floor(Math.random() * disc.files.length) : 0;
            var file = disc.files[fileIndex];
            $scope.currentFileIndex = fileIndex;
            $scope.currentFile = file;
            
            // Next track
            var trackIndex = $scope.shuffle ? Math.floor(Math.random() * file.tracks.length) : 0;
            $scope.currentTrackIndex = trackIndex;
        }
        
        for (var fileIndex = 0; fileIndex < disc.files.length; ++fileIndex) {
            
            // fileIndex mutable
            ((fileIndex) => {
                
                var file = disc.files[fileIndex];
                
                // Getters pour File
                Object.defineProperties(file, {
                    videoId: {
                        get: function() {
                            return getParameterByName("v", this.name);
                        }
                    }
                });
                
                for (var trackIndex = 0; trackIndex < file.tracks.length; ++trackIndex) {
                    
                    // trackIndex mutable
                    ((trackIndex) => {
                        
                        var track = file.tracks[trackIndex];
                        Object.defineProperties(track, {
                            index: {
                                get: function() {
                                    return this.number - 1;
                                }
                            },
                            startSeconds: {
                                get: function() {
                                    var time = this.indexes[this.indexes.length - 1].time;
                                    return time.min * 60 + time.sec + time.frame * .75;
                                }
                            },
                            endSeconds: {
                                get: function() {
                                    if (this.index+1 < file.tracks.length)
                                        return file.tracks[this.index+1].startSeconds;
                                    // auto apprentissage de la durée du fichier par : $scope.$on("video started")...
                                    else if (file.duration)
                                        return file.duration;
                                    // impossible à appeler avant de charger la vidéo car duration inconnu => toujours undefined
                                    // cf check
                                    else if ($scope.player && $scope.player.getDuration)
                                        return $scope.player.getDuration();
                                    else
                                        return undefined;
                                }
                            }
                        });
                        
                    })(trackIndex);
                }
                
            })(fileIndex);
        }
    }
    
    // TODO : discsById
    for (var discIndex = 0; discIndex < discIds.length; ++discIndex) {
        
        // discIndex mutable
        ((discIndex) => {
            
            var discId = discIds[discIndex];
            $http.get("/"+discId+".cue.json").then(res => {
                if (res.status != 200) return console.error("Error GET cuesheet "+discId+" $http");
    
                var disc = res.data;
                discs[discIndex] = disc;
                enrichDisc(disc, discIndex);
                
                // INIT si dernier disque
                if (--remainingDiscNumber == 0)
                    initYT();
            }, resKO => {
                // INIT si dernier disque
                if (--remainingDiscNumber == 0)
                    initYT();
                prompt('Veuillez ajouter la cuesheet '+discId, discId);
                    
                console.error("Error GET cuesheet "+discId+" via $http");
            });
            
        })(discIndex);
    }
    $scope.discs = discs;
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
        console.log("initYT");

        // 2. This code loads the IFrame Player API code asynchronously.
        var tag = document.createElement('script');

        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    }
    
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
        var disc = $scope.discs[discIndex];
        $scope.currentDisc = disc;
        
        // Next file
        var fileIndex = $scope.shuffle ? Math.floor(Math.random() * disc.files.length) : 0;
        var file = disc.files[fileIndex];
        this.currentFileIndex = fileIndex;
        $scope.currentFile = file;
        
        // Next track
        var trackIndex = $scope.shuffle ? Math.floor(Math.random() * file.tracks.length) : 0;
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
        
        var disc = $scope.discs[discIndex];
        $scope.currentDisc = disc;
        var file = disc.files[fileIndex];
        $scope.currentFile = file;
        
        $scope.loadCurrentTrack($scope.player);
    };
    
    $scope.next = function() {
        $scope.$apply(() => {
            var discs = $scope.discs;
            
            // Aléatoire ?
            if ($scope.shuffle) {
                var possibleDiscs = [];
                for (var i = 0; i < discs.length; ++i) {
                    var disc = discs[i];
                    if (disc.enabled) possibleDiscs.push(disc);
                }
                
                // Aucun disque activé ?
                if (!possibleDiscs.length) {
                    console.error("Aucun disque activé");
                    return;
                }
                
                $scope.currentDisc = possibleDiscs[Math.floor(Math.random() * possibleDiscs.length)];
                $scope.currentDiscIndex = $scope.currentDisc.index;
            }
            
            // Non aléatoire
            else {
                $scope.currentDiscIndex = $scope.currentDiscIndex + 1;
                $scope.currentDisc = discs[$scope.currentDiscIndex];
            }
            
            $scope.currentDisc.nextTrack();
        });
        
        // loadCurrentTrack sorti de apply pour éviter l'erreur "$apply already in progress"
        var player = $scope.loadCurrentTrack($scope.player);
        $scope.$apply(() => {
            $scope.player = player;
        });
    };
    
    $scope.previous = function() {
        
        var previousEntry = this.history.length && this.history[this.history.length - 2];
        if (!previousEntry) return;
        
        this.currentDiscIndex = previousEntry.discIndex;
        this.currentFileIndex = previousEntry.fileIndex;
        this.currentTrackIndex = previousEntry.trackIndex;
        
        var disc = $scope.discs[this.currentDiscIndex];
        $scope.currentDisc = disc;
        var file = disc.files[this.currentFileIndex];
        $scope.currentFile = file;
        
        this.history.pop(); // suppression du previous
        this.loadCurrentTrack($scope.player);
        this.history.pop(); // suppression du previous (ajouté par loadCurrentTrack)
    };
    
    $scope.showOnlyPlaylist = function(discIndex) {
        var discs = $("#playlist .disc");
        discs.each(function() {
            var list = $(".disc-list", this);
            if (this.dataset.index == discIndex)
                list.show();
            else
                list.hide();
        });
    };

    /** Ajout d'une nouvelle vidéo */
    $scope.addVideo = function() {
        var videoId = prompt("videoId de la nouvelle vidéo ?");
        if (!videoId) return;
        
        // Structure YouTube
        // FIXME : remplacer les prompt en cascade par un form
        var video = {
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
        
        $http.post("/"+videoId+".json", video).then(() => {
            // POST OK
            alert('POST OK');
        }, () => {
            // POST KO
            alert('POST KO');
        });
    };
    
    // TODO : mettre un getter dans l'objet Cue.File
    $scope.getVideoId = function() {
        var disc = this.discs[this.currentDiscIndex];
        var file = disc.files[this.currentFileIndex];
        //return getVideoIdFromUrl(file.name);
        //return getParameterByName("v", file.name);
        return file.videoId;
    };
    
    $scope.getVideoUrlFromId = function(id) {
        return "https://www.youtube.com/watch?v="+id;
    }
    
    
    /*function getVideoIdFromUrl(url) {
        var i = url.indexOf('?');
        if (i === -1) return undefined;
        var query = querystring.decode(url.substr(i+1));
        return query.v;
    }*/
    
    // TODO : clean
    function getParameterByName(name, url) {
        if (!url) {
          url = window.location.href;
        }
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }
    
    $scope.loadCurrentTrack = function(player) {
        var disc = this.discs[this.currentDiscIndex];
        var file = disc.files[this.currentFileIndex];
        var track = file.tracks[this.currentTrackIndex];
        var multiTrack = file.tracks.length > 1;
        this.showOnlyPlaylist(this.currentDiscIndex);
        
        if (!$scope.player) {
            // On peut récupérer cette variable a posteriori avec : YT.get("player")
            $scope.player = new YT.Player('player', {
                height: '360',
                width: '640',
                videoId: this.getVideoId(),
                playerVars: { // https://developers.google.com/youtube/player_parameters?hl=fr
                    autoplay: 1,
                    start: multiTrack ? track.startSeconds : undefined,
                    end: multiTrack ? track.endSeconds : undefined
                },
                events: {
                    // 4. The API will call this function when the video player is ready.
                    'onReady': function onPlayerReady(event) {
                        event.target.playVideo();
                        $scope.changeVideoIHM();
                    },
                    'onStateChange': onPlayerStateChange
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
            // FIXME : graphiquement on ne voit plus les bornes start et end
            $scope.player.loadVideoById({
                videoId: this.getVideoId(),
                startSeconds: track.startSeconds,
                endSeconds: track.endSeconds,
                playerVars: { // https://developers.google.com/youtube/player_parameters?hl=fr
                    autoplay: 1,
                    start: track.startSeconds,
                    end: track.endSeconds
                }
            });
        
            // Changement IHM (déjà appelé au 1er chargement par onPlayerReady)
            this.changeVideoIHM();
        }
        
        $scope.loadingDiscIndex = $scope.currentDiscIndex;
        $scope.loadingFileIndex = $scope.currentFileIndex;
        $scope.loadingTrackIndex = $scope.currentTrackIndex;
        
        // Notif
        notify((track.title || "Track "+track.number) + " - " + disc.title, {
            tag: 'loadCurrentTrack'
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
    
    var YT_STATES = [
        "ENDED",
        "PLAYING",
        "PAUSED",
        "BUFFERING",
        null,
        "CUED",
    ];
    
    $scope.$on("video started", (event) => {
        var scope = event.currentScope;
        var player = scope.player;
        scope.loadingDiscIndex = null;
        scope.loadingFileIndex = null;
        scope.loadingTrackIndex = null;
            
        // On en profite pour renseigner la durée de la vidéo maintenant qu'on la connait
        var file = scope.currentFile;
        if (!file.duration) file.duration = player.getDuration();
        // TODO : on pourrait stocker cette information sur le serveur
        
        // Pour les vidéos à une seule piste on ne connaissait pas la durée de la vidéo avant
        //var slider = document.getElementById("player-controls-form").trackPosition;
        var slider = scope.slider;
        if (slider && (!slider.max || slider.max == 'undefined')) {
            console.log("Pour les vidéos à une seule piste on ne connaissait pas la durée de la vidéo avant");
            slider.max = file.duration;
        }
        scope.fileSlider.max = file.duration;
        
        scope.changeVideoIHM(); // au cas ou on a déplacé le curseur
    });
    
    $scope.$on("video ended", (event) => {
        var scope = event.currentScope;
        scope.next();
    });
    
    $scope.$on("video manual seeked", (event) => {
        console.log("video manual seeked : TODO");
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
        //var player = event.target;
        var state = event.data;
        
        console.log("player state : " + state + (YT_STATES[state] ? ":"+YT_STATES[state] : ""));

        // Fin de la vidéo
        // on vérifie lastPlayedVideoIndex car cet évènement est souvent appelé deux fois
        // Détail des évènements : 2, 0 => next, -1, 0, -1, 3
        // Quand l'utilisateur scroll après la fin de la cue courante => YT.PlayerState.PAUSED
        if (state == YT.PlayerState.ENDED && $scope.loadingDiscIndex != $scope.currentDiscIndex && $scope.loadingFileIndex != $scope.currentFileIndex && $scope.loadingTrackIndex != $scope.currentTrackIndex) {
            $scope.$emit("video ended");
        }

        // Vidéo démarrée
        // vérification pour ne pas appeler deux fois l'évènement "Fin de la vidéo"
        // TODO : ne pas appeler quand on fait un manual seek
        else if (state == YT.PlayerState.PLAYING) {
            $scope.$emit("video started");
        }

        // FIXME : détection changement manuel de cue
        /*else if (event.data = YT.PlayerState.PAUSED && loadingFileIndex == null && loadingTrackIndex == null) {
          console.log("Pause at : "+player.getCurrentTime());
          var cueIndex = getCueIndexAt(videos[currentDiscIndex], player.getCurrentTime());
          console.log("Pause at cue :", cueIndex);
          
          if (cueIndex != -1 && cueIndex != currentTrackIndex) {
            console.log("Changement de cue manuel");
            var video = videos[currentDiscIndex];
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
            var states = new Array(3);
            for (var i = 0; i < 3; ++i)
                states[i] = $scope.lastPlayerStates[$scope.lastPlayerStates.length - (3-i)];
            
            if (states[0] == YT.PlayerState.PAUSED &&
                states[1] == YT.PlayerState.BUFFERING &&
                states[2] == YT.PlayerState.PLAYING)
                $scope.$emit("video manual seeked");
        }
    }
    
    /*function getCueIndexAt(video, time) {
        var first = video.cues[0];
        if (time < first.startSeconds) return -1;

        var last = video.cues[video.cues.length - 1];
        if (time >= last.endSeconds) return -1;

        for (var i = 0; i < video.cues.length; ++i) {
            var cue = video.cues[i];
            if (time <= cue.endSeconds) return i;
        }
        return -1;
    }*/
    
    $scope.changeVideoIHM = function() {
        var disc = this.discs[this.currentDiscIndex];
        $("#player-disc-name").html(disc.title);
        var file = disc.files[this.currentFileIndex];
        var track = file.tracks[this.currentTrackIndex];
        $("#player-track-name").html(track.title || "Track "+track.number);
        document.title = disc.title + " - m3u-YouTube"; // comme Youtube
        
        // Slider
        //var form = document.getElementById("player-controls-form");
        //var slider = form.trackPosition;
        var slider = $scope.slider;
        slider.min = track.startSeconds;
        slider.max = track.endSeconds;
        $scope.fileSlider.max = file.duration;
        $scope.checkCurrentTime(slider); // fixme : player non actif si pas encore chargé
    };

    /**
     * Appelé par loadCurrentTrack lors de la 1ère création du player
     */
    function onFirstPlayerLoad() {
       /*var lists = $("#playlist .video-list");
       lists.each(function()  {
           toggleVideoList(this);
       });*/
    }
    

    $scope.playPause = function() {
        var player = $scope.player;
        if (!player) return;
        var state = player.getPlayerState();
        if (state == YT.PlayerState.PLAYING)
            player.pauseVideo();
        else
            player.playVideo();
    };
    
    $scope.getCurrentTrack = function() {
        var track = $scope.currentFile.tracks[this.currentTrackIndex];
        return track;
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

    $scope.checkCurrentTimeInterval = 1000; // FIXME : mouvement saccadé du slider
    $scope.checkCurrentTime = function (slider) {
        var time = $scope.player.getCurrentTime();
        $scope.safeApply(() => { // FIXME : aucune actualisation sans safeApply, erreur "$apply already in progress" si $apply
            $scope.slider.value = time;
            $scope.fileSlider.value = time;
        });
        
        setTimeout($scope.checkCurrentTime, $scope.checkCurrentTimeInterval); // boucle
    };
    
    /** src : https://coderwall.com/p/ngisma/safe-apply-in-angular-js */
    $scope.safeApply = function(fn) {
      var phase = this.$root.$$phase;
      if(phase == '$apply' || phase == '$digest') {
        if(fn && (typeof(fn) === 'function')) {
          fn();
        }
      } else {
        this.$apply(fn);
      }
    };
    
    /** https://developers.google.com/youtube/v3/docs/playlistItems/list */
    $scope.getPlaylistItems = function(playlistId, cb) {
        $http.get('https://www.googleapis.com/youtube/v3/playlistItems', {
                params: {
                    key: GOOGLE_KEY,
                    part: 'snippet',//'contentDetails',
                    playlistId: playlistId,
                    maxResults: 50 // TODO : YouTube n'autorise pas plus que 50
                }
            })
            .success(function(data) {
                if (data.pageInfo && data.pageInfo.totalResults > data.pageInfo.resultsPerPage) return cb(new Error("Too much results (> 50)"));
                cb(null, data);
            })
            .error(function(data) {
                cb(data);
            })
    };
    
    /**
     * Crée un disque à partir d'une playlist contenant uniquement des vidéos avec une seule piste
     */
    $scope.newDiscFromPlaylistItems = function(playlistItems) {
        playlistItems = playlistItems.items || playlistItems;
        
        var disc = new cuesheet.CueSheet();
        _.extend(disc, {
            title: prompt("Nom du disque"),
            performer: playlistItems[0].snippet.channelTitle
            /*rems: [
                "COMMENT \"Playlist YouTube : https://www.youtube.com/watch?v=0WGKC2J3g_Y&list=PL1800E1EFCA1EABE3\""
            ]*/
        });
        
        for (var i = 0; i < playlistItems.length; ++i) {
            var item = playlistItems[i];
            var file = disc.newFile().getCurrentFile();
            _.extend(file, {
                name: $scope.getVideoUrlFromId(item.snippet.resourceId.videoId),
                type: "MP3"
            });
            
            var track = disc.newTrack().getCurrentTrack();
            _.extend(track, {
                number: i + 1,
                title: item.snippet.title,
                type: "AUDIO",
                indexes: [
                    {
                        "number": 1,
                        "time": {
                            "min": 0,
                            "sec": 0,
                            "frame": 0
                        }
                    }
                ]
            });
        }
        
        enrichDisc(disc);
        
        return disc;
    };
    
    $scope.createNewDiscFromPlaylist = function(playlistId) {
        playlistId = playlistId || prompt('Id de la playlist YouTube');
        
        $scope.getPlaylistItems(playlistId, (err, playlistItems) => {
            if (err) {
                alert('Erreur createNewDiscFromPlaylist : '+err.message);
                return;
            }
            
            var disc = $scope.newDiscFromPlaylistItems(playlistItems);
            $http.post("/"+disc.id+".cue.json", disc).then(res => {
                if (res.status != 200) return alert("POST createNewDiscFromPlaylist $http != 200");
                
                console.log("Disque créé");
                //var disc = res.data; // TODO : doit-on refaire un parsing pour être sûr ?
                disc.index = $scope.discs.length;
                $scope.discs.push(disc);
                
                // On affiche l'id du disque pour que l'utilisateur puisse l'ajouter dans sa playlist (URL)
                prompt("Disque créé avec l'id suivant", disc.id);
                
            }, resKO => {
                alert('Erreur POST createNewDiscFromPlaylist : '+resKO.data);
                return;
            });
        });
    };
    
    $scope.$watch('currentDisc', function(newDisc, oldDisc) {
        if (newDisc != oldDisc) {
            document.body.style.backgroundImage = 'url(https://img.youtube.com/vi/'+newDisc.videoId+'/hqdefault.jpg)'
        }
    });

} // Controller