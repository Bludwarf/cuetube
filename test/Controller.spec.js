/**
 * Created by MLAVIGNE on 28/07/2017.
 */
describe("CueTube Controller", function() {

    // src : https://stackoverflow.com/a/27625632/1655155
    var $scope;
    var ctrl;

    beforeEach(function() {

        module("cuetube");

        inject(function(_$rootScope_, $controller, $http, cuetubeConf) {

            $scope = _$rootScope_.$new();
            ctrl = new Controller($scope, $http, cuetubeConf);

        });

    });

    it("should get playlist id from url", function () {
        // TODO
    });

});