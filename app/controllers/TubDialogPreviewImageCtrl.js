/**
 * @file A Tooled Up - Builder app controller to view image data.
 *
 * @author David Fritz
 * @version 1.0.0
 *
 * @copyright 2015-2017 Solari Studios, http://solaristudios.com
 * @license MIT
 */
angular.module('tooledUpBuilder').controller('TubDialogPreviewImageCtrl', ['$scope', '$mdDialog', 'image', TubDialogPreviewImageCtrl]);

function TubDialogPreviewImageCtrl($scope, $mdDialog, image) {
    $scope.image = image;

    /**
     * Gets image information in format that can be displayed in HTML element.
     *
     * @returns {string} Text representing image.
     */
    $scope.getImage =  function() {
        return "data:image/png;base64," + image.data;
    };

    $scope.hide = function() {
        $mdDialog.hide();
    };

    $scope.cancel = function() {
        $mdDialog.cancel();
    };

    $scope.answer = function(answer) {
        $mdDialog.hide(answer);
    };
}
