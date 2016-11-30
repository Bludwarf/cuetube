var fs = require("fs");

var videoUrl = "https://www.youtube.com/watch?v=Dg0IjOzopYU";
var videoDuration = 2*3600 + 6*60 + 53;
var title = "Minecraft FULL SOUNDTRACK (2016)";
var artist = "Luigi";
var cueFile = __dirname + "/../samples/minecraft.cue";
var cueTxtFile = __dirname + "/../samples/minecraft.cue.txt";
/*var input = 
    "0:00 - Key\n"+
    "1:04 - Subwoofer Lullaby\n"+
    "4:40 - Living Mice\n"+
    "7:30 - Haggstrom\n"+
    "10:53 - Minecraft\n"+
    "15:08 - Oxygene\n"+
    "16:14 - Mice on Venus\n"+
    "21:08 - Dry Hands\n"+
    "22:04 - Wet Hands\n"+
    "23:34 - Clark\n"+
    "26:46 - Sweden\n"+
    "30:21 - Danny\n"+
    "34:38 - Biome Fest\n"+
    "40:58 - Blind Spots\n"+
    "46:34 - Haunt Muskie\n"+
    "52:32 - Aria Math\n"+
    "57:54 - Dreiton\n"+
    "1:06:05 - Taswell\n"+
    "1:14:32 - Mutation\n"+
    "1:17:46 - Moog City 2\n"+
    "1:20:52 - Beginning 2\n"+
    "1:23:56 - Floating Trees\n"+
    "1:28:01 - Concrete Halls\n"+
    "1:32:22 - Dead Voxel\n"+
    "1:37:24 - Warmth\n"+
    "1:41:28 - Ballad of the Cats\n"+
    "1:46:03 - Boss\n"+
    "1:51:48 - End";*/
    
function pad2(i) {
    return (i < 10 ? "0" : "") + i;
}

function convert(cb) {
    fs.readFile(cueTxtFile, 'utf-8', function(err, input) {
    	if (err) cb(err);
    
        // Parseur
        var lines = input.split("\n");
        var tracks = [];
        lines.forEach(function(line) {
            var mid = line.split(/ *- */);
            var track = {
                title: mid[1],
                /** index en secondes */
                time: 0,
                get index() {
                    return pad2(this.hours * 60 + this.mins) + ":" + pad2(this.secs) + ":00"; // TODO : INDEX 00:00:FRAME
                }
            };
            
            var timeStr = mid[0];
            var times = timeStr.split(":");
            var hours = 0, mins, secs;
            if (times.length == 3) {
                hours = times[0] * 1;
                mins = times[1] * 1;
                secs = times[2] * 1;
            } else {
                mins = times[0] * 1;
                secs = times[1] * 1;
            }
            track.time = hours * 3600 + mins * 60 + secs;
            tracks.push(track);
        });
        
        // Formatteur pour le js
        var jsContent = JSON.stringify(tracks, null, 4);
        
        var cueJsonFile = cueFile + ".json";
        fs.writeFile(cueJsonFile, jsContent, function(err) {
            if (err) return cb(err);
            return cb(null, cueJsonFile);
        });	
    });
}

module.exports = {
    convert: convert
}