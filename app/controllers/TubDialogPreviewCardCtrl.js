angular.module('tooledUpBuilder').controller('TubDialogPreviewCardCtrl', ['$scope', '$mdDialog', 'card', 'getCachedImageByName', TubDialogPreviewCardCtrl]);

function TubDialogPreviewCardCtrl($scope, $mdDialog, card, getCachedImageByName) {
    $scope.card = card;

    $scope.getImage =  function(name) {
        var image = getCachedImageByName(name);

        return "data:image/png;base64," + image.data;
    };

    $scope.getImageRatio = function() {
        if (card.landscape) {
            return "4/3";
        } else {
            return "3/4";
        }
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
