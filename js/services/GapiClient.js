/**
 * @property track.played : nombre de fois joué
 * @param cuetubeConf cf fichier de conf /js/app.conf.js
 */
angular.module('cuetube').factory('gapiClient', function($rootScope, $http, cuetubeConf) {

  return {
    // TODO : pourquoi on doit rappeler load + init même si on est connecté ?
    init: function(params) {

      return new Promise((resolve, reject) => {
        gapi.load('client', function start() {
          gapi.client.init(params).then(() => {
            const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
            if (!isSignedIn) {
              return gapi.auth2.getAuthInstance().signIn();
            }
          }, reason => {
            console.error(name, 'getConnection Google Drive error:', reason.result.error.message);
            reject(reason);
          }).then(() => {
            resolve();
          });
        });
      });
    },

    isSignedIn: function(client_id) {
      return new Promise((resolve, reject) => {
        gapi.auth.checkSessionState({client_id}, function(stateMatched) {
          resolve(stateMatched);
        });
      });
    },

    load: function() {
      return new Promise((resolve, reject) => {
        gapi.load('client', function start() {
          resolve();
        });
      });
    },
  };

});