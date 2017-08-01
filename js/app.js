angular.module('cuetube', [/*'cp.ngConfirm'*/])

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

;