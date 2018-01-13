/**
 * @file A Tooled Up - Builder app controller for Expansion Pack (xpak) file management. This controller requires
 * nesting under a TubCtrl controller.
 *
 * @author David Fritz
 * @version 1.0.0
 *
 * @copyright 2015-2017 David Fritz
 * @license MIT
 */
angular.module("tooledUpBuilder").controller("TubXpakCtrl", ["MainData", "$rootScope", "$scope", "$http", "$timeout", TubXpakCtrl]);

function TubXpakCtrl(MainData, $rootScope, $scope, $http, $timeout) {
    var self = this;
    var pack = MainData.xpak;

    self.activeCards = {
        main: true,
        summary: true,
        items: true,
        images: true
    };
    self.pendingData = 0;

    /**
     * Initializes controller by executing first run operations.
     *
     * Must be called at end of assignments.
     */
    function init() {
        document.getElementById("xpak-file-input").addEventListener("change", function () {
            Solari.ui.onSelectFiles(event, loadFiles);
        });
    }

    /**
     * Resets all data for the currently open Expansion Pack.
     */
    function resetXpakData() {
        pack.zipFile = new JSZip();
        pack.imageCache.length = 0;
        pack.imageWorkerPool.cacheData = undefined;
        pack.imageWorkerPool.initCache();
    }

    /**
     * Loads Xpak related data from files into the current Xpak.
     *
     * @param {File[]} ofiles Array of files to parse.
     */
    function loadFiles(ofiles) {
        // Copy the file list locally and reset the input for user to load again
        var files = [];
        for (var i = 0; i < ofiles.length; i++) {
            files.push(ofiles[i]);
        }
        document.getElementById("file-uploads").reset();

        // We can only access user selected files from web input
        var file = files[0];
        if (!file) {
            return;
        }

        var extension = Solari.file.getExtension(file.name);
        if (extension === "json") {
            Solari.json.readFile(file, function (data) {
                resetXpakData();

                // Set form model data, and current Card data
                pack.packData = MainData.preprocessXpak(data);
                pack.originalName = pack.packData.title;

                $rootScope.$broadcast("updateCpakCardForm");

                // Update form
                $scope.$digest();
            });
        } else if (extension === "xpak") {
            self.pendingData += files.length;
            JSZip.loadAsync(file).then(processZip, errorProcessingZip);
        } else {
            $scope.simpleToast(file.name + " is not valid file. Select a \".xpak\" or \".json\" and try again.");
        }
    }

    /**
     * Processes a zip compressed file to load valid Xpak information.
     *
     * @param {JSZip} zip Zipped file object to load.
     */
    function processZip(zip) {
        var configs = Solari.utils.sortArray(zip.file(/json$/i), "name");
        var images = Solari.utils.sortArray(zip.file(/jpg$|png$/i), "name");

        // Load JSON
        // if (configs.length === 1) {
        if (configs.length !== 0) {
            //TODO more intelligently find the parent config than choosing index 0
            zip.file(configs[0].name)
                .async("string")
                .then(function success(content) {
                    resetXpakData();
                    pack.zipFile = zip;

                    // Set form model data, and current Card data
                    pack.packData = MainData.preprocessXpak(JSON.parse(content));
                    pack.originalName = pack.packData.title;

                    $rootScope.$broadcast("updateCpakCardForm");

                    // Load images
                    var imageCount = images.length;
                    if (imageCount > 0) {
                        for (var i = 0; i < imageCount; i++) {
                            var image = new Image();

                            image.path = images[i].name;
                            pack.imageCache.push(image);
                        }
                    }

                    self.pendingData--;
                    checkLoadStatus();
                }, function error(error) {
                    self.pendingData--;
                    checkLoadStatus();
                    $scope.simpleToast("Unable to load " + configs[0]);
                });
        } else if (configs.length > 1) {
            // TODO Prompt user if more than 1 JSON found
        }
    }

    /**
     * Updates user and internal processing counter during a failure to load.
     *
     * @param {object} error Object containing an
     */
    function errorProcessingZip(error) {
        self.pendingData--;
        $scope.simpleToast(Solari.utils.format("Error reading {0} : {1}", file.name, error.message));
    }

    /**
     * Checks for pending work and notifies user if all work is completed.
     */
    function checkLoadStatus() {
        if (self.pendingData <= 0) {
            $timeout(function () {
                $scope.$emit("resizeMsg");
                $scope.$digest();
            });
            $scope.simpleToast("Loading completed.");
        }
    }

    /**
     * Saves a zip compressed Xpak file consisting of all adapter information.
     *
     * @param {boolean} saveToAIO Whether to save the data to the current Apak adapter.
     */
    function saveXpakFile(saveToAIO) {
        // Preprocess the file for saving
        var json = MainData.postprocessXpak(pack.packData);
        var oldTitle = pack.originalName;
        var newTitle = pack.packData.title;

        // TODO allow saving JSON only
        //Solari.file.saveObjectURL(newTitle + ".json", Solari.json.makeObjectURL(json));

        if (newTitle !== oldTitle) {
            // Remove original title based files
            pack.zipFile.remove(oldTitle + ".json");
            //TODO remove and add back background images based on name
            pack.originalName = newTitle;
        } else {
            // Remove only the configuration file
            pack.zipFile.remove(newTitle + ".json");
        }

        if (!pack.prettyPrintSave) {
            pack.zipFile.file(newTitle + ".json", JSON.stringify(json));
        } else {
            pack.zipFile.file(newTitle + ".json", JSON.stringify(json, undefined, 2));
        }

        pack.zipFile.generateAsync({type: "arraybuffer"})
            .then(function (content) {
                var name = newTitle + ".xpak";
                if (saveToAIO) {
                    $rootScope.$broadcast("sendToAIO", {
                        path: name,
                        data: content
                    });
                } else {
                    Solari.file.saveBlob(name, new Blob([content]));
                }
            });
    }

    /**
     * Trigger form validation and save process.
     *
     * @param {boolean} sendToAIO Whether to save the data to the current Apak adapter.
     */
    function onSave(sendToAIO) {
        // First we broadcast an event so all fields validate themselves
        $scope.$broadcast("schemaFormValidate");

        // Then we check if the forms are valid
        if (pack.packData.validate() && pack.formCardValues.$valid) {
            saveXpakFile(sendToAIO);
        } else {
            // TODO Dialog with list of errors
            $scope.listErrors(pack.formCardValues.$error);
            $scope.simpleToast("Invalid data. Resolve outstanding alerts and try again.");
        }
    }

    /**
     * Receives a data pack from another controller.
     *
     * @param {event} event Broadcasted event data from controller.
     * @param {object} args Arguments containing data about incoming pack.
     */
    function receivePack(event, args) {
        $scope.onSelectTab(1);
        self.pendingData++;
        processZip(args.data);
    }

    /**
     * Checks the pack for image information that can be set as an element's background.
     *
     * @returns {string|undefined} Data that can be set as an elements background.
     */
    self.getBannerData = function () {
        return pack.bannerData;
    };

    /**
     * Retrieves the pack for Model information that can be used for DOM access.
     *
     * @returns {string|undefined} Pack data that can be accessed by DOM controller scripts.
     */
    self.getModelData = function () {
        return pack.packData;
    };

    /**
     * Triggers a save action to the Apak.
     */
    self.onSendToAIO = function () {
        onSave(true);
    };

    /**
     * Validates pack data as fields are updated and saves data.
     *
     * @param {*} form JSON schema form to validate.
     */
    $scope.onSubmit = function (form) {
        onSave(false);
    };

    // Wrapper functions for DOM access
    $scope.getCachedImageByIndex = function (index) {
        return MainData.getImageByIndex(pack, index, $scope);
    };

    $scope.getCachedImageByName = function (name) {
        return MainData.getImageByName(pack, name, $scope);
    };

    // Listen for broadcasts and value changes
    $scope.$on("sendToXpak", receivePack);

    $scope.$watch(function () {
        return pack.packData.title;
    }, function (newValue, oldValue) {
        if (newValue !== oldValue) {
            // Load background picture into header if exists
            try {
                pack.zipFile.file(pack.packData.title + "-bg.jpg")
                    .async("base64")
                    .then(function success(content) {
                        pack.bannerData = "data:image/jpeg;base64," + content;
                        $scope.$apply();
                    }, function error(error) {
                        pack.bannerData = "./images/promo.jpg";
                    });
            } catch (error) {
                pack.bannerData = "./images/promo.jpg";
            }
        }
    });

    init();
}