/* global $, _, YT, cuesheet */
/* require ../cuesheet.js */
/* require ../cue.js */

/**
 * @property track.played : nombre de fois joué
 */
function EditCue($scope, $http) {

    const persistence = (window.location.host === "bludwarf.github.io" || getParameterByName("persistence", document.location.search) === 'LocalStorage') ? new LocalStoragePersistence($scope, $http) : new LocalServerPersistence($scope, $http);

    const params = {
        id: getParameterByName('id')
    };
    if (!params.id) {
        alert("Veuillez indiquer l'id du disque à modifier");
        return;
    }
    persistence.getDisc(params.id, 0).then(disc => {
        $scope.disc = disc;
        $scope.$apply();
    }).catch(err => {
        console.error(err);
        alert(`Disque ${params.id} introuvable !\n\nErreur technique : ${err.data || err}`);
    });

    $scope.$watch('track.performer', function (newValue, oldValue) {
        if(newValue === "")
            $scope.track.performer = null;
    });

    $scope.save = function() {
        persistence.postDisc($scope.disc.id, $scope.disc).then(disc => {
            alert('Disque sauvegardé !');
        }).catch(err => {
            console.error(err);
            alert("Disque non sauvegardé à cause de l'erreur : "+(err && err.message || err));
        });
    };

    $scope.getTracklist = function(tracks) {
        return yth.getTracklist(tracks);
    };

    $scope.prompt = function(text, placeholder) {
        return prompt(text, placeholder);
    };

} // Controller
