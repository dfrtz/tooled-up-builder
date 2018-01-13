/**
 * @file A Tooled Up - Builder app controller for Card Pack (cpak) cards management. This controller requires
 * nesting under a TubCpakCtrl controller.
 *
 * @author David Fritz
 * @version 1.0.0
 *
 * @copyright 2015-2017 David Fritz
 * @license MIT
 */
angular.module("tooledUpBuilder").controller("TubCpakCardsCtrl", ["MainData", "$scope", "$timeout", "$http", "$mdColors", "$mdDialog", "$mdToast", TubCpakCardsCtrl]);

function TubCpakCardsCtrl(MainData, $scope, $timeout, $http, $mdColors, $mdDialog, $mdToast) {
    var self = this;
    var pack = MainData.cpak;

    self.schemaDataModelOriginal = {};
    self.schemaDataModel = {};
    self.formDataModelOriginal = [];
    self.formDataModel = [];
    self.cardDataCurrent = {};
    self.selection = -1;
    self.pendingData = 0;

    var imagePreviewTemplate =
        '<div style="width: 100%" layout="row">' +
        '   <span flex></span>' +
        '   <md-button class="md-raised md-primary" style="margin: auto;" ng-click="form.preview($event)">Preview Images</md-button>' +
        '   <span flex></span>' +
        '</div>';

    var hitboxPreviewTemplate =
        '<div style="width: 100%" layout="row">' +
        '   <span flex></span>' +
        '   <md-button class="md-raised md-primary" style="margin: auto;" ng-click="form.edit(selected.tab, arrayIndex)">View/Edit Coordinates</md-button>' +
        '   <span flex></span>' +
        '</div>';


    /**
     * Initializes controller by executing first run operations.
     *
     * Must be called at end of assignments.
     */
    function init() {
        $http({
            url: "data/schema-cpak-card.json",
            dataType: "json",
            method: "GET",
            data: "",
            headers: {
                "Content-Type": "application/json"
            }
        }).success(function (response) {
            self.schemaDataModelOriginal = response || {};
            self.schemaDataModel = Solari.json.duplicate(self.schemaDataModelOriginal);
        });

        $http({
            url: "data/form-cpak-card.json",
            dataType: "json",
            method: "GET",
            data: "",
            headers: {
                "Content-Type": "application/json"
            }
        }).success(function (response) {
            self.formDataModelOriginal = response || [];
            self.formDataModel = injectSpecialButtons(Solari.json.duplicate(self.formDataModelOriginal));
        });

        initDragAndDrop();
    }

    /**
     * Replaces placeholders in JSON form model data with button templates.
     *
     * @param model JSON form data with placeholders.
     * @returns {*} New object representing form data with button templates injected.
     */
    function injectSpecialButtons(model) {
        Solari.json.inject(model, "replaceImageType", "type", "template");
        Solari.json.inject(model, "replaceImageTemplate", "template", imagePreviewTemplate);
        Solari.json.inject(model, "replaceImagePreview", "preview", self.onCardPreview);

        Solari.json.inject(model, "replaceHitboxType", "type", "template");
        Solari.json.inject(model, "replaceHitboxTemplate", "template", hitboxPreviewTemplate);
        Solari.json.inject(model, "replaceHitboxEdit", "edit", editHitbox);

        return model;
    }

    /**
     * Initializes drag and drop region for user to place card data.
     */
    function initDragAndDrop() {
        if (window.File && window.FileList && window.FileReader) {
            // Primary triggers upload anywhere, secondary is for visual hint only
            var primary = document.getElementById("cpak-card-drag-primary");
            var secondary = document.getElementById("cpak-card-drag-secondary");

            primary.addEventListener("dragover", Solari.ui.onDragHover);
            primary.addEventListener("dragleave", Solari.ui.onDragHover);
            primary.addEventListener("drop", function () {
                Solari.ui.onSelectFiles(event, self.onCardImport);
            });
        }
    }

    /**
     * Loads Cards from a data set and discards remaining information.
     *
     * @param {*} data Object representing a card pack.
     */
    function importCards(data) {
        var newPack = MainData.preprocessCpak(data, pack.lastXpakSplitValues);

        if (newPack.cards) {
            for (var i = 0; i < newPack.cards.length; i++) {
                pack.packData.cards.push(newPack.cards[i]);
            }

            var message = newPack.cards.length + " Card" + (newPack.cards.length > 1 ? "s" : "") + " imported";
            $scope.simpleToast(message);
        }
    }

    /**
     * Process data set for any valid Cards.
     *
     * @param {*} data Object representing a card pack.
     */
    function readData(data) {
        if (data) {
            importCards(data);
        }

        self.pendingData--;
        checkUploadStatus();
    }

    /**
     * Updates UI after all pending loads complete.
     */
    function checkUploadStatus() {
        if (self.pendingData === 0) {
            pack.packData.sortCards();

            // Update form
            $scope.$digest();
            $timeout(function () {
                $scope.$emit("resizeMsg");
            });
            self.onCardSelect(self.selection);
        }
    }

    /**
     * Processes a zip compressed file to validate if it contains CardPack data.
     *
     * @param {JSZip} zip Zipped file object to load.
     */
    function processZip(zip) {
        var configs = Solari.utils.sortArray(zip.file(/json$/i), "name");

        if (configs.length === 1) {
            zip.file(configs[0].name)
                .async("string")
                .then(function success(content) {
                    readData(JSON.parse(content));
                }, function error(e) {
                    console.log("Unable to load: " + configs[0]);
                });
        } else if (configs.length > 1) {
            // TODO Prompt user if more than 1 JSON found
        } else {
            // TODO Alert user no configuration found
        }
    }

    /**
     * Updates user and internal processing counter during a failure to load.
     *
     * @param {object} error Object containing an
     */
    function errorProcessingZip(error) {
        readData(null);
        console.log("Unable to load cpak: " + error.message);
    }

    /**
     * Dynamically creates form and schema representing card value groups and injects into DOM.
     */
    function updateValueGroupSchemas() {
        // Create new form, and add custom rows before applying to scope
        var model = Solari.json.duplicate(self.formDataModelOriginal);
        var form = MainData.xpak.packData.parseValueGroupForm();
        var schema = MainData.xpak.packData.parseValueGroupSchema();

        // Assign final form. Separate step is required to trigger angular-schema-form parsing
        injectSpecialButtons(model);
        Solari.json.inject(model, "replaceCategoryItems", "items", form);
        self.formDataModel = model;

        // Create new schema, and add properties before applying to scope
        var tempSchema = Solari.json.duplicate(self.schemaDataModelOriginal);
        tempSchema.properties.versions.items.properties.valuesGroup.properties = schema;
        self.schemaDataModel = tempSchema;

        // Manually update UI
        $timeout(function () {
            $scope.$apply();
        });
        $timeout(function () {
            $scope.$emit("resizeMsg");
        });
    }

    /**
     * Displays hitbox editor dialog.
     *
     * @param {number} versionIndex Version of the card to load into dialog.
     * @param {number} hitboxIndex Which hitbox from the version to edit.
     */
    function editHitbox(versionIndex, hitboxIndex) {
        var card = pack.packData.cards[self.selection];

        $mdDialog.show({
            controller: "TubDialogCardHitboxEditCtrl",
            controllerAs: "editorCtrl",
            templateUrl: "app/templates/template_dialog_cardhitboxeditor.html",
            parent: angular.element(document.body),
            //clickOutsideToClose: true,
            locals: {
                card: self.cardDataCurrent,
                version: versionIndex,
                hitbox: hitboxIndex,
                getCachedImageByName: $scope.getCachedImageByName
            }
        }).then(function ok(values) {
            card.versions[versionIndex].hitboxes[hitboxIndex].values = values;
            $scope.simpleToast(card.title + " hitbox values updated.");
        }, function cancel() {
            // No action on cancel
        });
    }

    /**
     * Processes files to load Card data from various extension types.
     *
     * @param {File[]} files Array of files to process.
     */
    self.onCardImport = function (files) {
        if (!files) {
            return;
        }

        self.pendingData += (files.length || 0);
        for (var i = 0; i < files.length; i++) {
            var file = files[i];

            if (!file) {
                self.pendingData--;
                checkUploadStatus();
                continue;
            }

            var extension = Solari.file.getExtension(file.name);
            if (extension === "json") {
                Solari.json.readFile(file, readData);
            } else if (extension === "cpak") {
                JSZip.loadAsync(file).then(processZip, errorProcessingZip);
            } else {
                self.pendingData--;
                checkUploadStatus();
                alert(file.name + ' is not valid file. Please select a ".cpak" or ".json" file and try again.');
            }
        }
    };

    /**
     * Retrieves card name with optional formatted text.
     *
     * @param {number} index Position of Card in cache.
     * @param {boolean} html Whether to add special html formatting to tag.
     *
     * @returns String representing card name.
     */
    self.getCardName = function (index, html) {
        var card = pack.packData.cards[index];
        var name = card.title;
        var legacy = card.legacy;

        if (!name) {
            name = "Card " + index;
        }

        if (legacy) {
            if (html === undefined || html) {
                name += '<br /><div class="md-caption">' + legacy + "</div>";
            } else {
                name += " - " + legacy;
            }
        }

        return name;
    };

    /**
     * Updates internal tracking information based on actively selected card.
     *
     * @param {number} index Position of Card in cache.
     */
    self.onCardSelect = function (index) {
        if (!pack.packData.cards.length) {
            // No items left, clear form and hide
            self.selection = -1;
            self.cardDataCurrent = {};
            return;
        }

        if (index === -1) {
            index = 0;
        }

        self.cardDataCurrent = pack.packData.cards[index];
        self.selection = index;
    };

    /**
     * Adds a new blank Card to cache.
     */
    self.onCardAdd = function () {
        pack.packData.cards.push(new Card());
        self.onCardSelect(pack.packData.cards.length - 1);
    };

    /**
     * Duplicates currently selected Card and increases revision by one.
     */
    self.onCardDuplicate = function () {
        var newCard = Solari.json.duplicate(self.cardDataCurrent);
        newCard.idGroup.revision++;

        pack.packData.cards.splice(self.selection + 1, 0, newCard);
        self.onCardSelect(self.selection + 1);
    };

    /**
     * Removes currently selected Card from cache.
     */
    self.onCardDelete = function () {
        var cardName = self.getCardName(self.selection, false);

        var dialog = $mdDialog.confirm()
            .title("Delete Card")
            .textContent("Remove " + cardName + "? (Cannot be undone)")
            .targetEvent(event)
            .ok("Delete")
            .cancel("Cancel");

        $mdDialog.show(dialog).then(function () {
            pack.packData.cards.splice(self.selection, 1);
            self.onCardSelect(self.selection - 1);

            var toast = $mdToast.simple()
                .textContent("Deleted " + cardName)
                //.action("UNDO")
                .highlightAction(true)
                .highlightClass("md-accent")
                .position("bottom right")
                .hideDelay(3000);

            $mdToast.show(toast).then(function (response) {
                if (response === "ok") {
                    //TODO: Undo Card Delete"
                }
            });
        }, function () {
            // No action on cancel
        });
    };

    /**
     * Displays popup dialog to preview current Card configuration.
     *
     * @param {event} event Event generated by element.
     */
    self.onCardPreview = function (event) {
        $mdDialog.show({
            controller: "TubDialogPreviewCardCtrl",
            controllerAs: "previewCtrl",
            templateUrl: "app/templates/template_dialog_cardpreview.html",
            targetEvent: event,
            clickOutsideToClose: true,
            locals: {
                card: self.cardDataCurrent,
                getCachedImageByName: $scope.getCachedImageByName
            }
        });
    };

    /**
     * Sorts Card cache and updates UI.
     */
    self.onCardSort = function () {
        pack.packData.sortCards();
        self.onCardSelect(self.selection);
    };

    /**
     * Removes all Cards from Card PAck.
     */
    self.onCardReset = function () {
        var dialog = $mdDialog.confirm()
            .title("Remove All Cards")
            .textContent("Delete all cards from card pack? (Cannot be undone)")
            .targetEvent(event)
            .ok("Delete All")
            .cancel("Cancel");

        $mdDialog.show(dialog).then(function () {
            pack.packData.cards = [];
            self.onCardSelect(-1);

            // Show undo toast
            var toast = $mdToast.simple()
                .textContent("Cards Reset")
                //.action("UNDO")
                .highlightAction(true)
                .highlightClass("md-accent")
                .position("bottom right")
                .hideDelay(3000);

            $mdToast.show(toast).then(function (response) {
                if (response === "ok") {
                    //TODO: Undo Card Delete"
                }
            });
        }, function () {
            // No action on cancel
        });
    };

    /**
     * Updates all Cards and versions with Expansion Pack value pairs.
     */
    self.onCardValueUpdate = function () {
        if (pack.lastXpakSplitValues.length <= 0 || pack.packData.cards.length <= 0) {
            // Values are not currently split, do not prompt user
            pack.lastXpakSplitValues = Solari.json.duplicate(MainData.xpak.packData.cardValues);
            pack.packData.splitCardValues(pack.lastXpakSplitValues);
            updateValueGroupSchemas();
            $scope.simpleToast("Card Pack categories updated to match Expansion Pack");
        } else if (JSON.stringify(pack.lastXpakSplitValues) !== JSON.stringify(MainData.xpak.packData.cardValues)) {
            // Values changed, prompt user to decide if values should be updated
            self.onCardValueUpdatePreview();
        } else {
            $scope.simpleToast("Card Pack categories identical to Expansion Pack, no update required.");
        }
    };

    /**
     * Displays dialog demonstrating changes to all Cards and versions based on Expansion Pack value pairs.
     */
    self.onCardValueUpdatePreview = function () {
        $mdDialog.show({
            controller: "TubDialogPreviewCardValueSplitCtrl",
            controllerAs: "previewCtrl",
            templateUrl: "templates/template_dialog_cardupdatepreview.html",
            parent: angular.element(document.body),
            clickOutsideToClose: true,
            locals: {
                // Duplicate packs to allow previewing without modifying
                cpak: MainData.cpak.packData.duplicate(),
                xpak: MainData.xpak.packData.duplicate(),
                oldValues: Solari.json.duplicate(pack.lastXpakSplitValues)
            }
        }).then(function (merge) {
            if (merge) {
                // Merge with original values, maintaining original order
                pack.packData.mergeCardValues(pack.lastXpakSplitValues);
            } else {
                // Only merge with new values, dropping old order
                pack.packData.mergeCardValues(MainData.xpak.packData.cardValues);
            }

            // Split card values back into groupings
            pack.packData.splitCardValues(MainData.xpak.packData.cardValues);
            pack.lastXpakSplitValues = Solari.json.duplicate(MainData.xpak.packData.cardValues);
            updateValueGroupSchemas();
            $scope.simpleToast("Card Pack categories synchronized with Expansion Pack.");
        }, function () {
            // No action on cancel
        });
    };

    // Listen for broadcasts and value changes
    $scope.$on("selectCard", function (event, args) {
        self.onCardSelect(args.position);
    });

    $scope.$on("updateCpakCardForm", function (event, args) {
        self.onCardValueUpdate();
    });

    $scope.$watch(function () {
        return $scope.formcards;
    }, function () {
        // Update form in service to allow cross controller validation
        pack.formCards = $scope.formcards;
    });

    $scope.$watch(function () {
        return self.cardDataCurrent.versions;
    }, function (newValue, oldValue) {
        // Required to update the form UI size if content changes
        if (newValue !== oldValue) {
            $timeout(function () {
                $scope.$emit("resizeMsg");
            });
        }
    }, true);

    init();
}