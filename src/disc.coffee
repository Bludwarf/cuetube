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
    @discId = undefined # Disc-ID dans le format cuesheet

  # Propriétés directement liées à la cue
  @propertiesOf 'cuesheet', ['title', 'performer', 'rems']

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
  
  @property 'disabledTracks',
    get: ->
      tracks = []
      @tracks.forEach (track) ->
        if !track.enabled
          tracks.push track
      tracks
  
  newFile: ->
    @cuesheet.newFile()
    cuesheetFile = @cuesheet.getCurrentFile()
    file = new Disc.File @, @.files.length, cuesheetFile
    @.files.push file
    file

  # TODO : Pour éviter le problème : TypeError: Converting circular structure to JSON
  toJSON: ->
    @cuesheet

  addRem: (key, value) ->
    if !@rems then @rems = []
    @rems.push key+" \"" + value + "\""
    
  @property 'src',
    set: (src) ->
      @addRem "SRC", src

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
    @disc.cuesheet.newTrack @.tracks.length+1, @DEFAULT_TYPE
    cuesheetTrack = @disc.cuesheet.getCurrentTrack()
    track = new Disc.Track @, @.tracks.length, cuesheetTrack
    @.tracks.push track
    @_tracksInTime = undefined # RAZ du cache pour tracksInTime
    track

  # Par défaut : 1ère si avant disque, dernière si après
  getTrackAt: (time) ->
    for track in @tracks
      if (time <= track.endSeconds)
        return track
    return @tracks[@tracks.length - 1]

  # Les pistes ne sont pas toujours triées dans l'ordre chronologique
  @property 'tracksInTime',
    get: ->
      if (!@_tracksInTime)
        @_tracksInTime = [].concat @tracks
        @_tracksInTime.sort (t1, t2) ->
          t1.startSeconds - t2.startSeconds
      return @_tracksInTime

class Disc.Track
  # Attention index = index dans le fichier et pas dans le disque, utiliser number-1 pour cela
  constructor: (@file, @index, @cuesheetTrack) ->
    if !@cuesheetTrack
      @cuesheetTrack = new cuesheet.Track(undefined, Disc.File.DEFAULT_TYPE) # number doit être setté manuellement
      _.extend @cuesheetTrack, {
        number: @index + 1
      }
    else
      # Clean du title si vide pour avoir "Track #" par défaut
      if @cuesheetTrack.title != null and !@cuesheetTrack.title.trim()
        @cuesheetTrack.title = null

    @enabled = @file.disc.enabled



  # Propriétés directement liées au track de la cue
  @propertiesOf 'cuesheetTrack', ['number', 'title', 'indexes', 'performer']

  # Index dans file.tracksInTime
  @property 'indexInTime',
    get: ->
      for track, i in @file.tracksInTime
        if track == @
          return i
      return -1
  
  @property 'disc',
    get: -> @file.disc
    
  @property 'startSeconds',
    get: ->
      time = @indexes[@indexes.length - 1].time;
      time.min * 60 + time.sec + time.frame / 75;
  
  @property 'endSeconds',
    get: ->
      tracksInTime = @file.tracksInTime
      indexInTime = @indexInTime
      if (indexInTime+1 < tracksInTime.length)
        return tracksInTime[indexInTime+1].startSeconds # TODO perf OK tracks => tracksInTime ?
      else if (@file.duration)
        return @file.duration
      else
        # auto apprentissage de la durée du fichier par : $scope.$on("video started")...
        console.warn "Impossible de connaitre la fin de la piste #{@number} sans connaitre la durée de son fichier #{@file.name}"
        return undefined
    
  @property 'next',
    get: ->
      # Même fichier ?
      if @index < @file.tracks.length - 1
        return @file.tracks[@index+1]
      # Même disque ?
      else if @file.index < @file.disc.files.length - 1
        nextFile = @file.disc.files[@file.index+1]
        if nextFile.tracks && nextFile.tracks.length
          return nextFile.tracks[0]
      return null