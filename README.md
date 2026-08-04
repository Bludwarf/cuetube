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

# DEV

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

## Lancement de l'appli sur CodeSpace

```bash
export NODE_OPTIONS=--openssl-legacy-provider
npm start
```
