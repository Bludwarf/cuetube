### Pour avoir des property js. Src: https://stackoverflow.com/a/11592890/1655155 ###
Function::property = (prop, desc) ->
  Object.defineProperty @prototype, prop, desc

# pas de let en CoffeeScript !? : http://coffeescript.org/v2/#unsupported-let-const
Function::propertiesOf = (targetName, props) ->
  for prop in props
    _class = @
    do (prop) ->
      _class.property prop,
        get: -> @[targetName][prop]
        set: (value) -> @[targetName][prop] = value

class Disc
  constructor: (@cuesheet) ->
    if !@cuesheet
      @cuesheet = new cuesheet.CueSheet()

    @files = [] # TODO devrait être en lecture seule
    if @cuesheet.files
      for i in [0...@cuesheet.files.length]
        cueFile = @cuesheet.files[i]
        @files.push new Disc.File @, i, cueFile

    @index = null
    @enabled = true # pour choisir les vidéos à lire

  # Propriétés directement liées à la cue
  @propertiesOf 'cuesheet', ['title', 'performer']

  @property 'id',
    get: -> @videoId

  @property 'videoId',
    get: ->
      if !@files || !@files.length
        return
      @files[0].videoId

  @property 'tracks',
    get: ->
      tracks = []
      if @files
        @files.forEach (file) ->
          tracks = tracks.concat file.tracks
      tracks

  @property 'playable',
    get: ->
      if !@enabled
        return false
      # au moins un track.enabled
      _.some @tracks, (track) ->
        return track.enabled
  
  newFile: ->
    file = new Disc.File @, @.files.length
    @.files.push file
    file

class Disc.File
  constructor: (@disc, @index, @cuesheetFile) ->
    if !@cuesheetFile
      @cuesheetFile = new cuesheet.File()

    @tracks = [] # TODO devrait être en lecture seule
    if @cuesheetFile.tracks
      for i in [0...@cuesheetFile.tracks.length]
        cueTrack = @cuesheetFile.tracks[i]
        @tracks.push new Disc.Track @, i, cueTrack

  @DEFAULT_TYPE: "MP3"

  # Propriétés directement liées au file de la cue
  @propertiesOf 'cuesheetFile', ['name', 'type']
  
  @property 'videoId',
    get: ->
      getParameterByName "v", @name
  
  newTrack: ->
    track = new Disc.Track @, @.tracks.length
    @.tracks.push track
    track

class Disc.Track
  constructor: (@file, @index, @cuesheetTrack) ->
    if !@cuesheetTrack
      @cuesheetTrack = new cuesheet.Track(undefined, Disc.File.DEFAULT_TYPE) # number doit être setté manuellement
    @enabled = @file.disc.enabled

  # Propriétés directement liées au track de la cue
  @propertiesOf 'cuesheetTrack', ['number', 'title', 'indexes']
  
  @property 'disc',
    get: -> @file.disc
    
  @property 'startSeconds',
    get: ->
      time = @indexes[@indexes.length - 1].time;
      time.min * 60 + time.sec + time.frame * .75;
  
  @property 'endSeconds',
    get: ->
      if (@index+1 < @file.tracks.length)
        @file.tracks[@index+1].startSeconds
      # auto apprentissage de la durée du fichier par : $scope.$on("video started")...
      else if (@file.duration)
        @file.duration
      else
        console.log new Error "Impossible de connaitre la fin de la piste #{@number} sans connaitre la durée de son fichier #{@file.name}"
        return undefined
    
  @property 'next',
    get: ->
      # Même fichier ?
      if @index < @file.tracks.length
        return @file.tracks[@index+1]
      # Même disque ?
      else if @file.index < @file.disc.files.length
        nextFile = @file.disc.files[@file.index+1]
        if nextFile.tracks && nextFile.tracks.length
          return nextFile.tracks[0]
      return null