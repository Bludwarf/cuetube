//
// # SimpleServer
//
// Play YouTube videos from cuesheets
//
var http = require('http');
var path = require('path');
var fs = require('fs');

var CueService = require("./services/CueService");
var VideoService = require("./services/VideoService");
var CollectionService = require("./services/CollectionService");

var async = require('async');
//var socketio = require('socket.io');
var express = require('express');
var bodyParser = require('body-parser');

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
//var io = socketio.listen(server);

function getCue(req, cb) {
    var q = {
        title: req.query.title || req.query.name || "Minecraft FULL SOUNDTRACK (2016)",
        name: req.query.title || req.query.name || "Minecraft FULL SOUNDTRACK (2016)",
        author: req.query.author || "Luigi",
        duration: req.query.duration || 2*3600 + 6*60 + 53, // TODO : pouvoir entrer 2h6m53
    };

    CueService.getCue(req.params.id + ".cue", {
        title: q.name,
        performer: q.author,
        file: "https://www.youtube.com/watch?v="+req.params.id,
        type: 'MP3',
        duration: q.duration * 1
    }, function(err, cue) {
        // On ignore l'erreur si aucun fichier cue n'existe
        if (err) {
            if (err.code === 'ENOENT') {
                // TODO : il faut quand même créer un fichier CUE avec une seule piste ? (pour garder l'url par exemple)
                // TODO : ou alors modifier la signature de VideoService.createVideo pour passer options
                console.log("Aucun fichier cue pour la vidéo "+req.params.id);
            }
            /*else*/ return cb(err);
        }
        return cb(null, cue);
    });
}


/**
 *
 * @param req
 * @param cb Function(err, Video)
 */
function getVideo(req, cb) {
    getCue(req, function(err, cue) {
        if (err) {
            console.log("Erreur de création de la vidéo", err);
            return cb(err);
        }
        console.log("Create video : "+cue.title);
        var video = VideoService.createVideo(cue.title, cue.performer, req.query.duration, cue);
        return cb(null, video);
    });
}

router
    .use(express.static(path.resolve(__dirname, 'client')))
    .use('/socket.io/socket.io.js', express.static(__dirname+'/node_modules/socket.io/node_modules/socket.io-client/dist/socket.io.min.js'))
    .use(bodyParser.json()) // for parsing application/json
    .use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
    .set('view engine', 'ejs')

    .get("/:id.cue.json", function(req, res) {

        var options = getOptions(req);

        CueService.getCue(req.params.id + ".cue", options, function(err, cue) {
            if (err) {
                console.dir(err);
                if (err.code === 'ENOENT') return res.status(404).send(`Cuesheet ${req.params.id} introuvable`);
                return res.status(500).send(err.message);
            }
            res.json(cue);
        });

    })

    // EXEMPLE : GET /minecraft.cue
    // Si le fichier existe déjà les paramètres de la requête sont ignorés
    .get("/:id.cue", function(req, res) {

        var options = getOptions(req);

        CueService.getCueFile(req.params.id + ".cue", options, function(err, targetFile) {
            if (err) return res.status(500).send(err.message);
            res.sendFile(targetFile);
        });
    })

    // EXEMPLE : GET /minecraft.json
    .get("/:id.json", function(req, res) {

        getVideo(req, function(err, video) {
            // On ignore l'erreur si aucun fichier cue n'existe
            if (err) {
                return res.status(500).send(err.message);
            }
            res.json(video);
        });

    })

    // Création d'un disque (à partir d'un objet CueSheet de cue-parser)
    .post("/:id.cue.json", function(req, res) {
        var id = req.params.id;
        var disc = req.body;
        var cueFile = CueService.getPath(id+'.cue');
        CueService.writeCueFile(cueFile, disc, (err) => {
            if (err) return res.status(500).send(err.message);
            return res.end();
        });
    })

    // Création d'une vidéo
    .post("/:id.json", function(req, res) {
        var videoId = req.params.id;
        VideoService.createVideoFiles(videoId, req.body, (err) => {
            return res.end();
        })
    })

    // Rechargement de cache, etc...
    .get("/reload", function(req, res) {
        CueService.reload();
        VideoService.reload();
        res.redirect("/");
    })

    .get("/", function(req, res) {
        res.render("index.ejs");
    })

    /**
     * Paramètres :
     *   - discs : liste des id des disques à charger séparés par ",". Exemple pour les jeux vidéos : Dg0IjOzopYU,0WGKC2J3g_Y,TGXwvLupP5A,WGmHaMRAXuI,GRWpooKRLwg,zvHQELG1QHE
     *   - collection : id d'un fichier /client/collections/*.cues contenant une liste d'ids de disques
     */
    .get("/player", function(req, res) {
        //res.render("player.ejs");
        res.sendFile(path.resolve(__dirname, 'client', 'player.html'));
    })

    .get("/discs", function(req, res) {
        CueService.getDiscsIds((err, discs) => {
            if (err) return res.status(500).send(err.message);
            res.json(discs);
        })
    })

    .get("/collection/:id/discs", function(req, res) {
        CollectionService.getDiscsIds(req.params.id, (err, discs) => {
            if (err) return res.status(500).send(err.message);
            res.json(discs);
        })
    })

    .post("/collection/:id/discs", function(req, res) {
        CollectionService.setDiscsIds(req.params.id, req.body, (err) => {
            if (err) return res.status(500).send(err.message);
            res.end();
        })
    })

    .get("/collections", function(req, res) {
        CollectionService.getCollectionsIds((err, ids) => {
            if (err) return res.status(500).send(err.message);
            res.json(ids);
        })
    })

    .get("/edit/:id.cue", function(req, res) {

        getCue(req, function(err, cue) {
            if (err) {
                return res.status(500).send(err.message);
            }
            res.render("edit-cue.ejs", {
                req: req,
                cueData: cue
            });
        });
    })

;


function getOptions(req) {
    return {
        title: req.query.title, // || "Minecraft FULL SOUNDTRACK (2016)",
        performer: req.query.performer, // || "Luigi",
        file: "https://www.youtube.com/watch?v="+req.params.id, // || "https://www.youtube.com/watch?v=Dg0IjOzopYU",
        type: req.query.type || 'MP3',
        duration: req.query.duration*1, // || 2*3600 + 6*60 + 53 // TODO : pouvoir entrer 2h6m53
    };
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
    var addr = server.address();
    console.log("Server listening at", addr.address + ":" + addr.port);
});
