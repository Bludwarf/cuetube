# Utilisation

  - Décocher une vidéo pour ne plus la lire automatiquement
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

# Informations YouTube

Stockée dans `/client/youtube/*.json`.

# DEV

Version NodeJS : [4.6.1](https://nodejs.org/en/blog/release/v4.6.1/)

## Browserify

Lancer la commande :

    browserify node_modules/cue-parser/lib/cuesheet.js --standalone cuesheet -o client/js/cuesheet.js
