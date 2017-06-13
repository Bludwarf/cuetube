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
      for cueFile in @cuesheet.files
        @files.push new Disc.File cueFile

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
      if !this.enabled
        false
      # au moins un track.enabled
      _.some @tracks, (track) ->
        track.enabled

class Disc.File
  constructor: (@cuesheetFile) ->
    if !@cuesheetFile
      @cuesheetFile = new cuesheet.File()

    @tracks = [] # TODO devrait être en lecture seule
    if @cuesheetFile.tracks
      for cueTrack in @cuesheetFile.tracks
        @tracks.push new Disc.Track cueTrack

  @DEFAULT_TYPE: "MP3"

  # Propriétés directement liées au file de la cue
  @propertiesOf 'cuesheetFile', ['name', 'type']

class Disc.Track
  constructor: (@cuesheetTrack) ->
    if !@cuesheetTrack
      @cuesheetTrack = new cuesheet.Track(undefined, Disc.File.DEFAULT_TYPE) # number doit être setté manuellement
    @enabled = true

  # Propriétés directement liées au track de la cue
  @propertiesOf 'cuesheetTrack', ['number', 'title', 'indexes']