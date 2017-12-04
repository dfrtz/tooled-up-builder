/**
 * @file A Tooled Up - Builder app controller for Card Pack (cpak) summary management. This controller requires
 * nesting under a TubCpakCtrl controller.
 *
 * @author David Fritz
 * @version 1.0.0
 *
 * @copyright 2015-2017 David Fritz
 * @license MIT
 */
angular.module('tooledUpBuilder').controller('TubCpakSummaryCtrl', ['MainData', '$scope', '$http', '$mdColors', '$mdDialog', '$mdToast', TubCpakSummaryCtrl]);

function TubCpakSummaryCtrl(MainData, $scope, $http, $mdColors, $mdDialog, $mdToast) {
    var self = this;

    this.schemaDataPack = {};
    this.formDataPack = [];

    // Internal functions
    function init() {
        // Load Schemas
        $http({
            url: 'data/schema-cpak-details.json',
            dataType: 'json',
            method: 'GET',
            data: '',
            headers: {
                "Content-Type": "application/json"
            }
        }).success(function(response) {
            self.schemaDataPack = response || {};
        });

        // Load forms
        $http({
            url: 'data/form-cpak-details.json',
            dataType: 'json',
            method: 'GET',
            data: '',
            headers: {
                "Content-Type": "application/json"
            }
        }).success(function(response) {
            self.formDataPack = response || [];
        });
    }

    // External functions
    this.onPackReset = function() {
        var dialog = $mdDialog.confirm()
              .title("Reset Summary")
              .textContent("Remove all details about pack? (Cannot be undone)")
              .targetEvent(event)
              .ok("Reset Summary")
              .cancel("Cancel");

        $mdDialog.show(dialog).then(function() {
            MainData.cpak.bannerData = "./promo.jpg";
            MainData.cpak.packData.set = "";
            MainData.cpak.packData.title = "";
            MainData.cpak.packData.version = 0;
            MainData.cpak.packData.group = "";
            MainData.cpak.packData.description = "";
            MainData.cpak.packData.compatibility = "";

            // Show undo toast
            var toast = $mdToast.simple()
                .textContent('Pack Summary Reset')
                //.action('UNDO')
                .highlightAction(true)
                .highlightClass('md-accent')
                .position("bottom right")
                .hideDelay(3000);

            $mdToast.show(toast).then(function(response) {
                if (response == 'ok') {
                    //TODO: Undo Card Delete"
                }
            });
        }, function() {
          // No action on cancel
        });
    };

    // Wrapper fucntions for DOM access

    // Add watchers to update UI
    $scope.$watch(function() { return $scope.formpack; }, function() {
        // Update form in service to allow cross controller validation
        MainData.cpak.formPack = $scope.formpack;
    });

    // Add user event listeners

    // Action to perform on load
    init();
}
