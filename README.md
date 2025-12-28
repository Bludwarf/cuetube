[![Build Status](https://travis-ci.org/Bludwarf/cuetube.svg?branch=master)](https://travis-ci.org/Bludwarf/cuetube)

# Utilisation

## Player

  - Décocher une vidéo pour ne plus la lire automatiquement
  - Décocher une ou plusieurs (maj + click) pistes d'un disque
  - Inverser des pistes cochées (alt + click)
  - Démarrer directement et uniquement un disque en double cliquant dessus
  - Sauvegarder l'état du lecteur
    - Disques désactivés
    - Pistes désactivées pour chaque disque
    - Pistes suivantes pour chaque disque
    - Dernière piste lue

## Gestion

  - Edition de cue : `/edit/:id.cue`
  
## API

  - Charger une collection de disques : `/player?collection=jeux%20vidéos`
  - Charger un ou plusieurs disque : `/player?discs=Dg0IjOzopYU,0WGKC2J3g_Y`

# Routes

## Exemples

Récupérer la cue pour la vidéo Minecraft (#Dg0IjOzopYU) :

    https://m3u-youtube-bludwarf.c9users.io/Dg0IjOzopYU.json?title=Minecraft%20FULL%20SOUNDTRACK%20(2016)&performer=Luigi&duration=7613
    
# Ajout d'une vidéo

Créer le fichier `/client/youtube/{id}.json` en s'inspirant d'un déjà existant.
Remplacer le titre et la durée de la vidéo ainsi que le nom de la chaîne.

Créer le fichier `/client/cues/{id}.cue.txt`.

Copier la tracklist dedans en respectant strictement la syntaxe :

    H:SS Titre...

ou

    Titre... H:SS

On s'attend juste à avoir une durée quelque part dans chaque ligne et on prend tout le reste comme titre.

Ajouter l'id de la vidéo dans play.ejs (variable videosIds)

# Génération des cues

Dans l'ordre d'existance :

  - /client/cues/*.cue.txt : copié-collé de la tracklist dans les commentaires Youtube
  - /client/cues/*.cue.json : généré automatiquement à partir du .cue.txt ou du .cue
  - /client/cues/*.cue : généré automatiquement à partir du .cue.json
  
## Outils

  * <http://cue.tools/wiki/CUETools_Download>

# Informations YouTube

Stockée dans `/client/youtube/*.json`.

## Exemple de tracklist parsées

```
01 Artiste - Piste 1
```

```
01 Artiste - Piste 1 (commentaire) 00:00
```

```
#01. Piste 1 (commentaire) - 00:00
```

```
01. "Piste 1" - 00:00
```

# DEV

Version NodeJS : [4.6.1](https://nodejs.org/en/blog/release/v4.6.1/)

Créer le fichier [.env](src/environments/.env) avec le contenu suivant :

```dotenv
GOOGLE_API_KEY=[...]
```

Lancer `npm run generate-dot-env`.

## cuesheet

Liste des remarques `REM` utilisées :

  * `REM SRC` : URL importé dans CueTube
  
Liste des remarques `REM` générées par le plugin cuesheet de MusicBrainz Picard
  
  * `REM MUSICBRAINZ_ALBUM_ID`
  * `REM MUSICBRAINZ_ALBUM_ARTIST_ID`
  * `REM MUSICBRAINZ_TRACK_ID`
  
Nécessaire de patcher la library (rems doit être rem) :

## Browserify

Lancer la commande :

    browserify node_modules/cue-parser/lib/cuesheet.js --standalone cuesheet -o client/js/cuesheet.js

## Mettre à jour GitHub Pages

Sans changer de branche (très long) :

    git subtree push --prefix client origin gh-pages
    
En changeant de branche :

    git checkout gh-pages // go to the gh-pages branch
    git rebase master // bring gh-pages up to date with master
    git push origin gh-pages // commit the changes
    git checkout master // return to the master branch

## Lancement de l'appli sur CodeSpace

```bash
export NODE_OPTIONS=--openssl-legacy-provider
npm start
```
