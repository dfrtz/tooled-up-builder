angular.module('tooledUpBuilder').controller('TubDialogPreviewCardValueSplitCtrl', ['$scope', '$mdDialog', 'cpak', 'xpak', 'oldValues', TubDialogPreviewCardValueSplitCtrl]);

function TubDialogPreviewCardValueSplitCtrl($scope, $mdDialog, cpak, xpak, oldValues) {
    var self = this;

    self.cpak = cpak;
    self.cpakWithMerge = cpak.duplicate();
    self.cpakWithoutMerge = cpak.duplicate();
    self.xpak = xpak;
    self.oldValues = oldValues;

    self.cardIndex = 0;

    self.merge = false;

    function init() {
        // Uncomment line to simulate a random user expansion change
        //testRandomValueRemoval();

        // Update card pack demonstrating an original value merge first
        self.cpakWithMerge.mergeCardValues(oldValues);
        self.cpakWithMerge.splitCardValues(xpak.cardValues);

        // Update pack demonstrating new value merge only
        self.cpakWithoutMerge.mergeCardValues(xpak.cardValues);
        self.cpakWithoutMerge.splitCardValues(xpak.cardValues);

        self.generateRandomCard();
    }

    function testRandomValueRemoval() {
        var count = Math.floor(Math.random() * xpak.cardValues.length);
        for (i = 0; i < count; i++) {
            var pos = parseInt(Math.floor(Math.random() * (xpak.cardValues.length - i)));
            xpak.cardValues.splice(pos, 1);
        }
    }

    this.generateRandomCard = function() {
        self.cardIndex = Math.floor(Math.random() * cpak.cards.length);
    };

    this.getCardName = function() {
        var card = cpak.cards[self.cardIndex];
        var name = card.title;
        var legacy = card.legacy;

        if (legacy) {
            name += ' - ' + legacy;
        }

        return name;
    };

    this.getOriginalCardValue = function(index) {
        // Default to original pack
        var card = cpak.cards[self.cardIndex];

        var version = card.versions[0];
        if (version) {
            var value = version.valuesGroup[oldValues[index].title];

            if (value !== undefined) {
                return value.toString();
            } else {
                return oldValues[index].title || '>> No Data Found <<';
            }
        } else {
            return '<< No Data Found >>';
        }
    };

    this.getFinalCardValue = function(index, packType) {
        // Default to original pack
        var card = cpak.cards[self.cardIndex];

        switch(packType) {
            case 'merge': {
                card = self.cpakWithMerge.cards[self.cardIndex];
                break;
            }
            case 'nomerge': {
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
                return oldValues[index].title || '>> No Data Found <<';
            }
        } else {
            return '<< No Data Found >>';
        }
    };

    this.debugCards = function() {
        console.log("Original Card\n" + JSON.stringify(cpak.cards[self.cardIndex], null, 2));
        console.log("Merged Card\n" + JSON.stringify(self.cpakWithMerge.cards[self.cardIndex], null, 2));
        console.log("Unmerged Card\n" + JSON.stringify(self.cpakWithoutMerge.cards[self.cardIndex], null, 2));
    };

    $scope.hide = function() {
        $mdDialog.hide();
    };

    $scope.cancel = function() {
        $mdDialog.cancel();
    };

    $scope.answer = function(answer) {
        $mdDialog.hide(self.merge);
    };

    // Action to perform on load
    init();
}
