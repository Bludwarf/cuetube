import { Injectable } from '@angular/core';


const GOOGLE_AUTH_PARAMS = {

    /** Client ID and API key from the Developer Console */
    clientId: '1000775747908-0o7m255fho5q5aa24li8h7012km3513f.apps.googleusercontent.com',
    // à reporter dans <meta name="google-signin-client_id"

    /** Array of API discovery doc URLs for APIs used by the quickstart */
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],

    /**
     * Authorization scopes required by the API; multiple scopes can be
     * included, separated by spaces.
     * On n'utilise pas le dossier https://developers.google.com/drive/v2/web/appdata car non visible pas l'utilisateur
     */
    scope: 'https://www.googleapis.com/auth/drive'
    // à reporter dans <meta name="google-signin-scope"
};


@Injectable()
export class GapiClientService {

  constructor() { }

    // TODO : pourquoi on doit rappeler load + init même si on est connecté ?
    init(params): Promise<void> {

        if (!params) {
            params = GOOGLE_AUTH_PARAMS;
        }

        return Promise.resolve().then(() => {
          if (typeof(gapi) !== 'undefined') {
            return gapi;
          } else {
            // src : https://stackoverflow.com/a/31145147/1655155
            // promise that would be resolved when gapi would be loaded
            return new Promise((resolve, reject) => {
              (<any>window).onLoadCallback = function() {
                resolve(gapi);
              };
            });

            // var authInited = gapiPromise.then(function(){
            //   gapi.auth2.init({
            //     client_id: 'filler_text_for_client_id.apps.googleusercontent.com'
            //   });
            // })


            // $('#btn').click(function(){
            //   gapiPromise.then(function(){
            //     // will be executed after gapi is loaded
            //   });
            //
            //   authInited.then(function(){
            //     // will be executed after gapi is loaded, and gapi.auth2.init was called
            //   });
            // });
          }
        }).then((resolvedGapi) => {
          return new Promise((resolve, reject) => {
            gapi.load('client', function start() {
              gapi.client.init(params).then(() => {
                const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
                if (!isSignedIn) {
                  return gapi.auth2.getAuthInstance().signIn();
                }
              }, reason => {
                console.error(name, 'getConnection Google Drive error:', reason || reason.result || reason.result.error.message);
                alert('Échec de connexion à Google Drive');
                reject(reason);
              }).then(() => {
                resolve();
              });
            });
          });
        });
    }

    // isSignedIn(client_id) {
    //     return new Promise((resolve, reject) => {
    //         gapi.auth.checkSessionState({client_id}, function(stateMatched) {
    //             resolve(stateMatched);
    //         });
    //     });
    // }

    load(): Promise<void> {
        return new Promise((resolve, reject) => {
            gapi.load('client', function start() {
                resolve();
            });
        });
    }

}
