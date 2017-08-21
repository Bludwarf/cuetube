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
        window.disc = disc;
    };

    $scope.$watch('track.performer', function (newValue, oldValue) {
        if(newValue === "")
            $scope.track.performer = null;
    });

    $scope.save = function() {
        $http({
            method: 'POST',
            url: '/'+$scope.disc.id+'.cue.json',
            /*headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            transformRequest: function(disc) {
                return JSON.stringify(disc, function(key, value) {
                    console.log(key);
                });
            },*/
            data: $scope.disc.cuesheet
        }).success(function () {});
    };

    $scope.getTracklist = function(tracks) {
        return yth.getTracklist(tracks);
    };

    $scope.prompt = function(text, placeholder) {
        return prompt(text, placeholder);
    }

} // Controller
