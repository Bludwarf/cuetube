/**
 * @property track.played : nombre de fois joué
 * @param cuetubeConf cf fichier de conf /js/app.conf.js
 */
angular.module('cuetube').factory('gapiClient', function($rootScope, $http, cuetubeConf) {

  const GOOGLE_AUTH_PARAMS = {

    // Client ID and API key from the Developer Console
    apiKey: 'AIzaSyBOgJtkG7pN1jX4bmppMUXgeYf2vvIzNbE',
    clientId: '873045101562-3t98pn5qlml130icgp9e8q5tqsqsao76.apps.googleusercontent.com', // à reporter dans <meta name="google-signin-client_id"

    // Array of API discovery doc URLs for APIs used by the quickstart
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],

    // Authorization scopes required by the API; multiple scopes can be
    // included, separated by spaces.
    // On n'utilise pas le dossier https://developers.google.com/drive/v2/web/appdata car non visible pas l'utilisateur
    scope: 'https://www.googleapis.com/auth/drive'  // à reporter dans <meta name="google-signin-scope"
  };

  return {
    // TODO : pourquoi on doit rappeler load + init même si on est connecté ?
    init: function(params) {

      if (!params) {
        params = GOOGLE_AUTH_PARAMS;
      }

      return new Promise((resolve, reject) => {
        gapi.load('client', function start() {
          gapi.client.init(params).then(() => {
            const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
            if (!isSignedIn) {
              return gapi.auth2.getAuthInstance().signIn();
            }
          }, reason => {
            console.error(name, 'getConnection Google Drive error:', reason || reason.result || reason.result.error.message);
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