/* global $, _, YT, cuesheet */
/* require ../cuesheet.js */
/* require ../cue.js */

/**
 * @property track.played : nombre de fois joué
 */
function EditCue($scope, $http) {

    const localPersistence = new LocalStoragePersistence($scope, $http);
    const persistence = (window.location.host === "bludwarf.github.io" || getParameterByName("persistence", document.location.search) === 'LocalStorage') ? localPersistence : new LocalServerPersistence($scope, $http);
    /** true si le disque n'existe pas encore */
    let creationMode = false;

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

        // On est peut-être en train de créer ce disque ?
      const cue = new cuesheet.CueSheet();
      _.extend(cue, localPersistence.getItem("discToCreate"));
      const discToCreate = new Disc(cue);
        if (discToCreate && discToCreate.id === params.id) {
          creationMode = true;
          console.log("Le disque n'existe pas encore mais il va être créé");
          $scope.disc = discToCreate;
          $scope.$apply();
        }

        // En fait non
        else {
          console.error(err);
          alert(`Disque ${params.id} introuvable !\n\nErreur technique : ${err.data || err}`);
        }
    });

    $scope.$watch('track.performer', function (newValue, oldValue) {
        if(newValue === "")
            $scope.track.performer = null;
    });

    $scope.save = function() {
      persistence.postDisc($scope.disc.id, $scope.disc).then(disc => {
            alert('Disque sauvegardé !');
            if (creationMode) {
              creationMode = false;
              localStorage.removeItem('discToCreate');
              prompt("Le disque est maintenant créé vous pouvez l'ajouter dans CueTube avec cette URL :", $scope.disc.url);
            }
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

    $scope.setTracklist = function(tracklist, file) {
        yth.setTracklist(tracklist, file);
    };
    $scope.setTracklistFromButton = function($event, file) {
        const button = $event.currentTarget;
        const textarea = $('textarea', button.parent).get(0);
        this.setTracklist(textarea.value, file);
    };

} // Controller
