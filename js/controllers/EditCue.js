/* global $, _, YT, cuesheet */
/* require ../cuesheet.js */
/* require ../cue.js */

/**
 * @property track.played : nombre de fois joué
 */
function EditCue($scope, $http) {

    $scope.init = function(id, cueData) {
        var cue = new cuesheet.CueSheet();
        _.extend(cue, cueData);

        var disc = new Disc(cue);
        $scope.disc = disc;
    }

} // Controller
