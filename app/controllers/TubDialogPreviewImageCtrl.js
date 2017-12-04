angular.module('tooledUpBuilder').controller('TubDialogPreviewImageCtrl', ['$scope', '$mdDialog', 'image', TubDialogPreviewImageCtrl]);

function TubDialogPreviewImageCtrl($scope, $mdDialog, image) {
    $scope.image = image;

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
