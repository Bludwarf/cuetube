import * as _ from 'underscore';
// import * as cuesheet from '../client/js/cuesheet' // TODO inclure cuesheet.js dans bundle.js
import {Disc} from './disc';
import {CueService} from './CueService';
import PlayerCtrl from './controllers/Controller';




const angular = require('angular');


export default angular.module('cuetube', [/*'cp.ngConfirm'*/])
    .constant('cuetubeConf', {
        /** Ajout de disques */
        addDisc: {
            /** Lecture automatique des disques ajoutés ? */
            autoplay: false
        },
        debug: false
    })
    /** https://stackoverflow.com/a/25344423/1655155 */
    .directive('emptyToNull', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, elem, attrs, ctrl) {
                ctrl.$parsers.push(function (viewValue) {
                    if (viewValue == null || viewValue.trim() === "") {
                        return null;
                    }
                    return viewValue;
                });
            }
        };
    })
    // .config(routing)
    .controller('PlayerCtrl', PlayerCtrl)
    .name;