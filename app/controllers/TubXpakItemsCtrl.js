/**
 * @file A Tooled Up - Builder app controller for Expansion Pack (xpak) item management. This controller requires
 * nesting under a TubXpakCtrl controller.
 *
 * @author David Fritz
 * @version 1.0.0
 *
 * @copyright 2015-2017 David Fritz
 * @license MIT
 */
angular.module('tooledUpBuilder').controller('TubXpakItemsCtrl', ['MainData', "$rootScope", '$scope', '$timeout', '$http', '$mdColors', '$mdDialog', '$mdToast', TubXpakItemsCtrl]);

function TubXpakItemsCtrl(MainData, $rootScope, $scope, $timeout, $http, $mdColors, $mdDialog, $mdToast) {
    var self = this;

    var pack = MainData.xpak;

    self.schemaDataPack = {};
    self.formDataPack = {
        cardValues: [],
        titles: [],
        clocks: [],
        scores: [],
        actions: []
    };

    this.selections = {
        page: 0
    };

    // Internal functions
    function init() {
        // Load Schemas
        $http({
            url: 'data/schema-xpak-items.json',
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
            url: 'data/form-xpak-items.json',
            dataType: 'json',
            method: 'GET',
            data: '',
            headers: {
                "Content-Type": "application/json"
            }
        }).success(function(response) {
            self.formDataPack.cardValues = response.cardValues  || [];
            self.formDataPack.titles = response.titles  || [];
            self.formDataPack.clocks = response.clocks  || [];
            self.formDataPack.scores = response.scores  || [];
            self.formDataPack.actions = response.actions  || [];
        });
    }

    // External functions
    this.onCardValueUpdate = function() {
        $rootScope.$broadcast('updateCpakCardForm');
    };

    this.onItemsReset = function() {
        var dialog = $mdDialog.confirm()
              .title("Reset All Items")
              .textContent("Remove all Categories, Titles, Subtitles, Clocks, Scores, and Shortcuts? (Cannot be undone)")
              .targetEvent(event)
              .ok("Reset All Items")
              .cancel("Cancel");

        $mdDialog.show(dialog).then(function() {
            pack.cardValues = [];
            pack.titles = {
                cardStacks: []
            };
            pack.subtitles = {
                card: undefined,
                cardShort: undefined,
                cardStack: undefined,
                deck: undefined
            };
            pack.clocks = [];
            pack.scores = [];
            pack.actions = [];

            // Show undo toast
            var toast = $mdToast.simple()
                .textContent('Expansion Items Reset')
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

    this.onAddItem = function() {
        if (self.selections.page === 0) {
            pack.packData.cardValues.push(new CardValue());
        }
    };

    // Wrapper fucntions for DOM access

    // Add watchers to update UI
    $scope.$watch(function() { return $scope.formcardvalues; }, function() {
        // Update form in service to allow cross controller validation
        pack.formCardValues = $scope.formcardvalues;
    });

    $scope.$watch(function() { return pack.packData.cardValues; }, function (newValue, oldValue) {
        // Required to update the form UI size if content changes
        if (newValue !== oldValue) {
            $timeout(function() { $scope.$emit('resizeMsg'); }, 100);
        } else {
        }
    }, true);

    $scope.$watch(function() { return pack.packData.titles.cardStacks; }, function (newValue, oldValue) {
        // Required to update the form UI size if content changes
        if (newValue !== oldValue) {
            $timeout(function() { $scope.$emit('resizeMsg'); }, 100);
        } else {
        }
    }, true);

    // Add user event listeners

    // Action to perform on load
    init();
}
