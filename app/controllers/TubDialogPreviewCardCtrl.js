/**
 * @file A Tooled Up - Builder app controller to view card image data from cache.
 *
 * @author David Fritz
 * @version 1.0.0
 *
 * @copyright 2015-2017 Solari Studios, http://solaristudios.com
 * @license MIT
 */
angular.module('tooledUpBuilder').controller('TubDialogPreviewCardCtrl', ['$scope', '$mdDialog', 'card', 'getCachedImageByName', TubDialogPreviewCardCtrl]);

function TubDialogPreviewCardCtrl($scope, $mdDialog, card, getCachedImageByName) {
    $scope.card = card;

    /**
     * Gets image information from in format that can be displayed in HTML element.
     *
     * @param {string} name Image name stored in cache.
     *
     * @returns {string} Text representing image from cache.
     */
    $scope.getImage = function (name) {
        var image = getCachedImageByName(name);

        return "data:image/png;base64," + image.data;
    };

    /**
     * Provides fractional representation of card ratio based on orientation.
     *
     * @returns {string} Fractional value representing image ratio.
     */
    $scope.getImageRatio = function () {
        if (card.landscape) {
            return "4/3";
        } else {
            return "3/4";
        }
    };

    $scope.hide = function () {
        $mdDialog.hide();
    };

    $scope.cancel = function () {
        $mdDialog.cancel();
    };

    $scope.answer = function (answer) {
        $mdDialog.hide(answer);
    };
}
