/**
 * @file A Tooled Up - Builder app controller to preview changes to Card Expansion pack data.
 *
 * @author David Fritz
 * @version 1.0.0
 *
 * @copyright 2015-2017 David Fritz
 * @license MIT
 */
angular.module("tooledUpBuilder").controller("TubDialogPreviewCardValueSplitCtrl", ["$scope", "$mdDialog", "cpak", "xpak", "oldValues", TubDialogPreviewCardValueSplitCtrl]);

function TubDialogPreviewCardValueSplitCtrl($scope, $mdDialog, cpak, xpak, oldValues) {
    var self = this;

    self.cpak = cpak;
    self.cpakWithMerge = cpak.duplicate();
    self.cpakWithoutMerge = cpak.duplicate();
    self.xpak = xpak;
    self.oldValues = oldValues;
    self.cardIndex = 0;
    self.merge = false;

    /**
     * Initializes controller by executing first run operations.
     *
     * Must be called at end of assignments.
     */
    function init() {
        //testRandomValueRemoval(); // Uncomment line to simulate a random user expansion change
        // Update card pack demonstrating an original value merge first
        self.cpakWithMerge.mergeCardValues(oldValues);
        self.cpakWithMerge.splitCardValues(xpak.cardValues);

        // Update pack demonstrating new value merge only
        self.cpakWithoutMerge.mergeCardValues(xpak.cardValues);
        self.cpakWithoutMerge.splitCardValues(xpak.cardValues);

        self.generateRandomCard();
    }

    /**
     * Removes a random value pair from the Xpak value sets for debugging.
     */
    function testRandomValueRemoval() {
        var count = Math.floor(Math.random() * xpak.cardValues.length);
        for (var i = 0; i < count; i++) {
            var pos = parseInt(Math.floor(Math.random() * (xpak.cardValues.length - i)));
            xpak.cardValues.splice(pos, 1);
        }
    }

    /**
     * Selects a random card to be the active index for this controller.
     */
    self.generateRandomCard = function () {
        self.cardIndex = Math.floor(Math.random() * cpak.cards.length);
    };

    /**
     * Provides name of currently selected with special formatting.
     *
     * @returns {string} Name of currently selected card.
     */
    self.getCardName = function () {
        var card = cpak.cards[self.cardIndex];
        var name = card.title;
        var legacy = card.legacy;

        if (legacy) {
            name += " - " + legacy;
        }

        return name;
    };

    /**
     * Returns a string based representation of a Card value using the original expansion pack value sets.
     *
     * @param {number} index Position of the value group in the expansion pack.
     * @returns {string} Title of the value if it exists or an informative placeholder
     */
    self.getOriginalCardValue = function (index) {
        var card = cpak.cards[self.cardIndex];

        var version = card.versions[0];
        if (version) {
            var value = version.valuesGroup[oldValues[index].title];

            if (value !== undefined) {
                return value.toString();
            } else {
                return oldValues[index].title || ">> No Data Found <<";
            }
        } else {
            return "<< No Data Found >>";
        }
    };

    /**
     * Returns a string based representation of a Card value using the new expansion pack value sets.
     *
     * @param {number} index Position of the value group in the expansion pack.
     * @param {string} packType How to create final Card values.Valid choices: merge, nomerge
     * @returns {string} Title of the value if it exists or an informative placeholder
     */
    self.getFinalCardValue = function (index, packType) {
        var card = cpak.cards[self.cardIndex];

        switch (packType) {
            case "merge": {
                card = self.cpakWithMerge.cards[self.cardIndex];
                break;
            }
            case "nomerge": {
                card = self.cpakWithoutMerge.cards[self.cardIndex];
                break;
            }
        }

        var version = card.versions[0];
        if (version) {
            var value = version.valuesGroup[xpak.cardValues[index].title];

            if (value !== undefined) {
                return value.toString();
            } else {
                return oldValues[index].title || ">> No Data Found <<";
            }
        } else {
            return "<< No Data Found >>";
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
     * Hides popup dialog and returns choice of whether to merge pack data to calling controller.
     */
    $scope.answer = function (answer) {
        $mdDialog.hide(self.merge);
    };

    init();
}
