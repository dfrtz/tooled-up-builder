/**
 * @file A Tooled Up - Builder app controller to view image data. This controller does not provide any editing ability.
 *
 * @author David Fritz
 * @version 1.0.0
 *
 * @copyright 2015-2017 David Fritz
 * @license MIT
 */
angular.module("tooledUpBuilder").controller("TubDialogPreviewImageCtrl", ["$scope", "$mdDialog", "image", TubDialogPreviewImageCtrl]);

function TubDialogPreviewImageCtrl($scope, $mdDialog, image) {
    $scope.image = image;

    /**
     * Gets image information in format that can be displayed in HTML element.
     *
     * @returns {string} Text representing image.
     */
    $scope.getImage = function () {
        return "data:image/png;base64," + image.data;
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
