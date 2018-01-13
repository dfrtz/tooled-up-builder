/**
 * @file A Tooled Up - Builder app controller for Expansion Pack (xpak) summary management. This controller requires
 * nesting under a TubXpakCtrl controller.
 *
 * @author David Fritz
 * @version 1.0.0
 *
 * @copyright 2015-2017 David Fritz
 * @license MIT
 */
angular.module('tooledUpBuilder').controller('TubXpakSummaryCtrl', ['MainData', '$scope', '$http', '$mdColors', '$mdDialog', '$mdToast', TubXpakSummaryCtrl]);

function TubXpakSummaryCtrl(MainData, $scope, $http, $mdColors, $mdDialog, $mdToast) {
    var self = this;
    var pack = MainData.xpak;

    self.schemaDataPack = {};
    self.formDataPack = [];
    self.selections = {
        page: 0
    };

    /**
     * Initializes controller by executing first run operations.
     *
     * Must be called at end of assignments.
     */
    function init() {
        $http({
            url: 'data/schema-xpak-details.json',
            dataType: 'json',
            method: 'GET',
            data: '',
            headers: {
                "Content-Type": "application/json"
            }
        }).success(function (response) {
            self.schemaDataPack = response || {};
        });

        $http({
            url: 'data/form-xpak-details.json',
            dataType: 'json',
            method: 'GET',
            data: '',
            headers: {
                "Content-Type": "application/json"
            }
        }).success(function (response) {
            self.formDataPack = response || [];
        });
    }

    /**
     * Prompts user and resets loaded expansion pack.
     */
    self.onPackReset = function () {
        var dialog = $mdDialog.confirm()
            .title("Reset Summary")
            .textContent("Remove all details about pack? (Cannot be undone)")
            .targetEvent(event)
            .ok("Reset Summary")
            .cancel("Cancel");

        $mdDialog.show(dialog).then(function () {
            pack.bannerData = "./promo.jpg";
            pack.packData.set = "";
            pack.packData.title = "";
            pack.packData.version = 0;
            pack.packData.description = "";
            pack.packData.categories = "";

            // Show undo toast
            var toast = $mdToast.simple()
                .textContent('Pack Summary Reset')
                //.action('UNDO')
                .highlightAction(true)
                .highlightClass('md-accent')
                .position("bottom right")
                .hideDelay(3000);

            $mdToast.show(toast).then(function (response) {
                if (response === 'ok') {
                    //TODO: Undo Card Delete"
                }
            });
        }, function () {
            // No action on cancel
        });
    };

    // Listen for broadcasts and value changes
    $scope.$watch(function () {
        return $scope.formpack;
    }, function () {
        // Update form in service to allow cross controller validation
        MainData.xpak.formPack = $scope.formpack;
    });

    init();
}
