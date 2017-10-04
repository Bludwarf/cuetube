Doc : <https://musicbrainz.org/doc/Development>

# Définitions

Un `release-group` est un groupe de parutions concernant le même album.

Une `release` est une parution précise d'un album (pays, année, version, etc...).

# Plugin cuesheet

Liste des remarques `REM` générées par le plugin cuesheet de MusicBrainz Picard
  
  * `REM MUSICBRAINZ_ALBUM_ID`
  * `REM MUSICBRAINZ_ALBUM_ARTIST_ID`
  * `REM MUSICBRAINZ_TRACK_ID`

# Lien MusicBrainz vers YouTube

| MusicBrainz   | YouTube                 | MusicBrainz (FR)   |
|---------------|-------------------------|--------------------|
| release-group |                         | Groupe de parution |
| release       | Vidéo multipiste        | Parution           |
| recording     | Vidéo (une seule piste) | Enregistrement     |

## Lier les enregistrements d'un album à plusieurs vidéos

Ouvrir la `release` de l'album qui correspond le mieux aux vidéos puis :

  - aller dans l'onglet `Modifier`
  - puis dans l'onget `Enregistrement`
  - pour chaque piste ouvrir le lien de la colonne `enregistrement`
    - aller dans l'onglet `Modifier`
    - aller tout en bas dans la section `Liens externes`
    - ajouter l'URL de la vidéo dans le champ `Ajouter un autre lien`
    - cocher `vidéo`
    - remplir `youtube` par exemple comme note de modification
    - cocher `Pouvoir voter sur toutes les modifications`
    - Valider en cliquant sur le bouton `Saisir une modification`

## Playlist YouTube

Il est préférable de ne pas lier une `release` à une liste de lecture YouTube (PlayList) car cette dernière peut être modifiée à tout moment et rien ne garanti son intégrité.

On préferera lier chaque vidéo de la liste à un `recording`.

Le site MusicBrainz lui-même ne permet de lier que des vidéo et non des listes de lecture. En effet il ne conserve que la valeur du paramètre `v` de YouTube (id de vidéo).

# Lien YouTube vers MusicBrainz

## Playlist

Importer d'abord la playlist dans CueTube. Exemple "Come Away With Me (HD)" :  `https://www.youtube.com/watch?v=1LH4vnrM-Vs&list=PL8Lpw39GxwbNEoB_LstYRWwmEhJMZvKtV&index=1`.

Saisir le nom de l'album et de l'artiste en vérifiant qu'ils sont les mêmes que sur MusicBrainz.

Lancer la recherche indexée avec syntaxe approfondie. Exemple :

```
release:"Come Away With Me" AND artist:"Norah Jones" AND tracks:14
```

# Vidéo

Rechercher avant l'ID de l'artiste : -> **Pas forcément nécessaire**

```
artist:"Norah Jones"
```

Lancer la recherche indexée avec syntaxe approfondie. Exemple :

```
recording:"Come Away With Me" AND artist:"Norah Jones"
```

ou

```
recording:"Come Away With Me" AND arid:"985c709c-7771-4de3-9024-7bda29ebe3f9"
```

Rechercher alors l'ID de l'album avec MusicBrainz Picard.

Une fois le disque trouvé générer le fichier cue avec le plugin cuesheet.