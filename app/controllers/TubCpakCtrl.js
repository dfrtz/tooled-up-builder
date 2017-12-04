/**
 * @file A Tooled Up - Builder app controller for Card Pack (cpak) file management. This controller requires
 * nesting under a TubCtrl controller.
 *
 * @author David Fritz
 * @version 1.0.0
 *
 * @copyright 2015-2017 David Fritz
 * @license MIT
 */
angular.module('tooledUpBuilder').controller('TubCpakCtrl', ['MainData', '$rootScope', '$scope', '$timeout', '$mdColors', '$mdDialog', '$mdToast', TubCpakCtrl]);

function TubCpakCtrl(MainData, $rootScope, $scope, $timeout, $mdColors, $mdDialog, $mdToast) {
    var self = this;

    var pack = MainData.cpak;

    self.activeCards = {
        main: true,
        summary: true,
        cards: true,
        images: true
    };

    self.loadingActivated = false;

    // Internal functions
    function init() {
        // Load Schemas
        /*$http({
            url: 'data/schema-model-guildball.json',
            dataType: 'json',
            method: 'GET',
            data: '',
            headers: {
                "Content-Type": "application/json"
            }
        }).success(function(response) {
            MainData.schemaDataModel = response || {};
        });*/
    }

    function resetCpakData() {
        pack.zipFile = new JSZip();
        pack.imageCache.length = 0;
        pack.imageWorkerPool.cacheData = undefined;
        pack.imageWorkerPool.initCache();
        $scope.$broadcast('selectCard', {
            position: 0
        });
    }

    function loadCpak(ofiles) {
        // Copy the file list locally and reset the input for user to load again
        var files = [];
        for (var i = 0; i < ofiles.length; i ++) {
            files.push(ofiles[i]);
        }
        document.getElementById('file-uploads').reset();

        // We can only access user selected files from web input
        var file = files[0];
        if (!file) {
            return;
        }

        var extension = file.name.split('.').pop();
        if (extension === "json") {
            Solari.json.readFile(file, function(data) {
                resetCpakData();

                // Set form model data, and current Card data
                pack.lastXpakSplitValues = Solari.json.duplicate(MainData.xpak.packData.cardValues);
                pack.packData.readObject(MainData.preprocessCpak(data, pack.lastXpakSplitValues));
                pack.originalName = pack.packData.title;
                $scope.$broadcast('selectCard', {
                    position: 0
                });

                // Update form
                $scope.$digest();
            });
        } else if (extension == "cpak") {
            self.loadingActivated = true;

            JSZip.loadAsync(file)
            .then(processZip, errorProcessingZip);
        } else {
            $scope.simpleToast(file.name + " is not valid file. Select a \".cpak\" or \".json\" and try again.");
            return;
        }
    }

    function processZip(zip) {
        // Find config files, image files, and alphabetize
        var configs = Solari.utils.sortArray(zip.file(/json$/i), "name");
        var images = Solari.utils.sortArray(zip.file(/jpg$|png$/i), "name");

        // Load JSON
        //if (configs.length == 1) {
        // TODO Prompt user if more than 1 JSON found
        if (configs.length > 0) {
            zip.file(configs[0].name)
            .async("string")
            .then(function success(content) {
                resetCpakData();
                pack.zipFile = zip;

                // Set form model data, and current Card data
                pack.lastXpakSplitValues = Solari.json.duplicate(MainData.xpak.packData.cardValues);
                pack.packData.readObject(MainData.preprocessCpak(JSON.parse(content), pack.lastXpakSplitValues));

                pack.originalName = pack.packData.title;
                $scope.$broadcast('selectCard', {
                    position: 0
                });

                // Load images
                var imageCount = images.length;
                if (imageCount > 0) {
                    for (var i = 0; i < imageCount; i++) {
                        // Create placeholder image that will be filled by adapter
                        var image = new Image();
                        image.path = images[i].name;
                        pack.imageCache.push(image);
                    }
                }

                self.loadingActivated = false;
                $scope.$digest();
            }, function error(e) {
                self.loadingActivated = false;
                $scope.$digest();
                $scope.simpleToast("Unable to load " + configs[0]);
                return;
            });
        } else {
            // TODO Prompt user if more than 1 JSON found
        }
    }

    function errorProcessingZip(e) {
        self.loadingActivated = false;
        $scope.simpleToast(Solari.utils.format("Error reading {0} : {1}", file.name, e.message));
    }

    function saveCpakFile(saveToAIO) {
        // Preprocess the file for saving
        var json = MainData.postprocessCpak(pack.packData, pack.lastXpakSplitValues);
        var oldTitle = pack.originalName;
        var newTitle = pack.packData.title;

        // TODO allow saving JSON only
        //Solari.file.saveObjectURL(newTitle + '.json', Solari.json.makeObjectURL(json));

        if (newTitle !== oldTitle) {
            // Remove original title based files
            pack.zipFile.remove(oldTitle + ".json");
                //.remove(oldTitle + ".png")
                //.remove(oldTitle + "-bg.jpg");

            // Add back image files if they exist in cache
            /*var imageCache = pack.imageCache;

            for (var i = 0, replacedItems = 0; i < imageCache[i] && replacedItems < 2; i++) {
                var item = imageCache[i];

                if (item.path == oldTitle + ".png") {
                    pack.zipFile.file(newTitle + ".png", item.data, {base64: true});
                    item.path = newTitle + ".png";
                    replacedItems++;
                } else if (item.path == oldTitle + "-bg.jpg") {
                    pack.zipFile.file(newTitle + "-bg.jpg", item.data, {base64: true});
                    item.path = newTitle + "-bg.jpg";
                    replacedItems++;
                }
            }*/

            pack.originalName = newTitle;
        } else {
            // Remove only the configuration file
            pack.zipFile.remove(newTitle + ".json");
        }

        // Add new JSON to cpak
        if (!pack.prettyPrintSave) {
            pack.zipFile.file(newTitle + ".json", JSON.stringify(json));
        } else {
            pack.zipFile.file(newTitle + ".json", JSON.stringify(json, undefined, 2));
        }

        // Generate and save final file
        pack.zipFile.generateAsync({type: "arraybuffer"})
        .then(function(content) {
            var name = newTitle + '.cpak';
            if (saveToAIO) {
                $rootScope.$broadcast('sendToAIO', {
                    path: name,
                    data: content
                });
            } else {
                Solari.file.saveBlob(name, new Blob([content]));
            }
        });
    }

    function onSave(sendToAIO) {
        // First we broadcast an event so all fields validate themselves
        $scope.$broadcast('schemaFormValidate');

        // Then we check if the forms are valid
        if (pack.packData.validate() &&
            pack.formPack.$valid &&
            pack.formCards.$valid) {
            saveCpakFile(sendToAIO);
        } else {
            // TODO Dialog with list of errors
            $scope.listErrors(pack.formPack.$error);
            $scope.listErrors(pack.formCards.$error);
            $scope.simpleToast("Invalid data. Resolve outstanding alerts and try again.");
            return;
        }
    }

    // External functions
    self.getBannerData = function() {
        return pack.bannerData;
    };

    self.getModelData = function() {
        return pack.packData;
    };

    self.onSendToAIO = function() {
        onSave(true);
    };

    $scope.onSubmit = function(form) {
        onSave(false);
    };

    // Wrapper functions for DOM access
    $scope.getCachedImageByIndex = function(index) {
        return MainData.getImageByIndex(pack, index, $scope);
    };

    $scope.getCachedImageByName = function(name) {
        return MainData.getImageByName(pack, name, $scope);
    };

    // Add watchers to update UI
    $scope.$watch(function() { return pack.packData.title; }, function (newValue, oldValue) {
        if (newValue !== oldValue) {
            // Load background picture into header if exists
            try {
                pack.zipFile.file(pack.packData.title + "-bg.jpg")
                .async("base64")
                .then(function success(content) {
                    pack.bannerData = "data:image/jpeg;base64," + content;
                    $scope.$apply();
                }, function error(e) {
                    pack.bannerData = "./images/promo.jpg";
                });
            } catch(e) {
                pack.bannerData = "./images/promo.jpg";
            }
        }
    });

    $scope.$on('sendToCpak', function(event, args) {
        $scope.onSelectTab(0);

        self.loadingActivated = true;
        processZip(args.data);
    });

    // Add user event listeners
    document.getElementById('cpak-file-input').addEventListener('change', function() {Solari.ui.onSelectFiles(event, loadCpak);});

    // Action to perform on load
    init();
}