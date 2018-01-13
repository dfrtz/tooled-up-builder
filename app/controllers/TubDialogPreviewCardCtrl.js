/**
 * @file A Tooled Up - Builder app controller to view card image data from cache. This controller does not provide any
 * editing ability.
 *
 * @author David Fritz
 * @version 1.0.0
 *
 * @copyright 2015-2017 David Fritz
 * @license MIT
 */
angular.module('tooledUpBuilder').controller('TubDialogPreviewCardCtrl', ['$scope', '$mdDialog', 'card', 'getCachedImageByName', TubDialogPreviewCardCtrl]);

function TubDialogPreviewCardCtrl($scope, $mdDialog, card, getCachedImageByName) {
    var self = this;
    $scope.card = card;

    /**
     * Retrieves image data for display as a view's background.
     *
     * @param {string} name Canonical image path.
     * @returns {string} Formatted data that can be set as a background in DOM.
     */
    self.getImage = function (name) {
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

    /**
     * Hides popup dialog without making any changes to data.
     */
    $scope.hide = function () {
        $mdDialog.hide();
    };

    /**
     * Hides popup dialog without making any changes to data.
     */
    $scope.cancel = function () {
        $mdDialog.cancel();
    };

    /**
     * Hides popup dialog without making any changes to data.
     */
    $scope.answer = function (answer) {
        $mdDialog.hide(answer);
    };
}
