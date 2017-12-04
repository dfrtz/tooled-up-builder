/**
 * @file A Tooled Up - Builder app controller for All-In-One pack (apak) file management. This controller requires
 * nesting under a TubCtrl controller.
 *
 * @author David Fritz
 * @version 1.0.0
 *
 * @copyright 2015-2017 David Fritz
 * @license MIT
 */
angular.module('tooledUpBuilder').controller('TubApakCtrl', ['MainData', '$rootScope', '$scope', '$http', '$timeout', '$mdColors', '$mdDialog', '$mdToast', TubApakCtrl]);

function TubApakCtrl(MainData, $rootScope, $scope, $http, $timeout, $mdColors, $mdDialog, $mdToast) {
    var self = this;
    var pack = MainData.apak;

    self.activeCards = {
        main: true,
        summary: true,
        items: true
    };
    self.selections = {
        page: 0
    };
    self.tabs = [
        {page: 0, title: 'Cards', subtitle: 'card packs', type: 'cpak', disabled: false},
        {page: 1, title: 'Expansions', subtitle: 'expansion packs', type: 'xpak', disabled: false},
        {page: 2, title: 'Themes', subtitle: 'theme packs', type: 'tpak', disabled: true}
    ];
    self.packs = [
        'cpak'
    ];
    self.pendingData = 0;

    $scope.$on('sendToAIO', receivePack);
    document.getElementById('apak-file-input').addEventListener('change', function () {
        Solari.ui.onSelectFiles(event, loadFiles);
    });

    /**
     * Initializes controller by executing first run operations.
     *
     * Must be called at end of assignments.
     */
    function init() {
        /* Check if browser supports Worker for multithreading or not */
        if (window.Worker) {
            console.log("Web Worker support detected. Multithreading enabled.");
        } else {
            console.log("Web Workers are not supported by your browser. Try with the latest Google Chrome: <a href=\"https://www.google.com/chrome/\">Google Chrome Download</a>");
        }
    }

    /**
     * Resets all data for the currently open All-In-One pack.
     */
    function resetApakData() {
        pack.title = undefined;
        pack.packData.manifest.length = 0;
    }

    /**
     * Loads new pack files into the current apak.
     *
     * @param {File[]} ofiles Array of files to parse.
     */
    function loadFiles(ofiles) {
        // Copy the file list locally and reset the input for user to load again
        var files = [];
        var duplicates = 0;
        for (var i = 0; i < ofiles.length; i++) {
            if (!pack.packData.contains(ofiles[i].name)) {
                files.push(ofiles[i]);
            } else {
                duplicates++;
            }
        }
        document.getElementById('file-uploads').reset();

        if (duplicates) {
            var message = Solari.utils.format('{0} Duplicate{1} skipped', duplicates, (duplicates > 1 ? 's' : ''));
            var toast = $mdToast.simple()
                .textContent(message)
                .highlightAction(true)
                .highlightClass('md-accent')
                .position("bottom right")
                .hideDelay(3000);
            $mdToast.show(toast).then(function (response) {
                if (response === 'ok') {
                }
            });
        }

        if (files.length > 0) {
            self.pendingData += files.length;
            $timeout(function () {
                $scope.$emit('resizeMsg');
            });

            for (i = 0; i < files.length; i++) {
                var file = files[i];
                if (!file) {
                    return;
                }

                processFile(file);
            }
        }
    }

    /**
     * Processes a single file into the currently loaded apak depending on file extension.
     *
     * @param {File} file File object to load.
     */
    function processFile(file) {
        var extension = Solari.file.getExtension(file.name);
        if (extension === "cpak" || extension === "xpak" || extension === "tpak") {
            Solari.file.readAsArrayBuffer(file, onLoad);
        } else if (extension === "apak") {
            JSZip.loadAsync(file).then(processZip, errorProcessingZip);
        } else {
            $scope.simpleToast(file.name + " is not valid file. Select an \".apak\", \".cpak\", \".xpak\" or \".tpak\" and try again.");
            self.pendingData--;
            checkLoadStatus();
        }
    }

    /**
     * Processes a zip compressed file to validate if it can be added to the apak.
     *
     * @param {JSZip} zip Zipped file object to load.
     */
    function processZip(zip) {
        // Immediately mark zip parent as processed
        self.pendingData--;

        var opaks = [];

        opaks.push.apply(opaks, zip.file(/cpak$/i));
        opaks.push.apply(opaks, zip.file(/xpak$/i));
        opaks.push.apply(opaks, zip.file(/tpak$/i));
        Solari.utils.sortArray(opaks, "name");

        var paks = [];
        var duplicates = 0;
        for (var i = 0; i < opaks.length; i++) {
            if (!pack.packData.contains(opaks[i].name)) {
                paks.push(opaks[i]);
            } else {
                duplicates++;
            }
        }

        if (duplicates) {
            var message = Solari.utils.format('{0} Duplicate{1} skipped', duplicates, (duplicates > 1 ? 's' : ''));
            var toast = $mdToast.simple()
                .textContent(message)
                .highlightAction(true)
                .highlightClass('md-accent')
                .position("bottom right")
                .hideDelay(3000);
            $mdToast.show(toast);
        }

        function successGenerator(file) {
            //TODO merge int onLoad() function
            return function success(content) {
                pack.zipFile.file(file.name, content);
                Solari.crypto.md5Async({path: file.name, data: new Uint8Array(content)}, onChecksum, true);
            };
        }

        if (paks.length > 0) {
            // Discount the apak itself when loading
            self.pendingData += paks.length;
            for (i = 0; i < paks.length; i++) {
                zip.file(paks[i].name)
                    .async("arraybuffer")
                    .then((successGenerator)(paks[i]), errorProcessingZip);
            }
        } else {
            checkLoadStatus();
        }
    }

    /**
     * Updates user and internal processing counter during a failure to load.
     *
     * @param {object} error Object containing an
     */
    function errorProcessingZip(error) {
        $scope.simpleToast(Solari.utils.format("Error reading {0} : {1}", file.name, error.message));
        self.pendingData--;
        checkLoadStatus();
    }

    /**
     * Adds new file to zip package and checksum to manifest.
     *
     * @param {File} file File details to identify data added to apak zip package.
     * @param {Array} content Byte content to add to apak zip package.
     */
    function onLoad(file, content) {
        pack.zipFile.file(file.name, content);
        Solari.crypto.md5Async({path: file.name, data: new Uint8Array(content)}, onChecksum, true);
    }

    /**
     * Updates checksum manifest entry after event callback from hashing.
     *
     * @param {*} event Event callback package containing a data object with a path and checksum as string.
     */
    function onChecksum(event) {
        var entry = new ManifestEntry();

        entry.path = event.data.path;
        entry.checksum = event.data.checksum;

        pack.packData.manifest.push(entry);

        self.pendingData--;
        checkLoadStatus();
    }

    /**
     * Checks for pending work and notifies user if all work is completed.
     */
    function checkLoadStatus() {
        if (self.pendingData <= 0) {
            Solari.utils.sortArray(pack.packData.manifest, "path");
            $timeout(function () {
                $scope.$emit("resizeMsg");
            });
            $scope.simpleToast("Loading completed.");
        }
    }

    /**
     * Prompts user for a name and saves a zip compressed apak file to local storage.
     */
    function saveApakFile() {
        if (pack.packData.manifest.length <= 0) {
            $scope.simpleToast("No packs to save. Add at least one pack and try again.");
            return;
        }

        var dialog = $mdDialog.prompt()
            .title('Save All-In-One Pack')
            .textContent('Choose a name to describe pack')
            .placeholder('File name')
            .ariaLabel('Save All-In-One Pack')
            .initialValue('')
            .targetEvent(event)
            .ok('Save')
            .cancel('Cancel');

        $mdDialog.show(dialog).then(function (result) {
            if (result !== undefined && result !== '') {
                //TODO Strip invalid characters
                //result = result.replace(/([^a-z0-9/.\'\s-]+)/gi, '');
            } else {
                var d = new Date();
                result = Solari.utils.format(
                    'AIOPack_{0}-{1}-{2}T{3}{4}{5}',
                    d.getFullYear(),
                    Solari.utils.padZeros(d.getMonth(), 2),
                    Solari.utils.padZeros(d.getDate(), 2),
                    Solari.utils.padZeros(d.getHours(), 2),
                    Solari.utils.padZeros(d.getMinutes(), 2),
                    Solari.utils.padZeros(d.getSeconds(), 2)
                );
            }

            pack.zipFile.remove("manifest.json");
            var json = MainData.postprocessApak(pack.packData).manifest;
            if (!pack.prettyPrintSave) {
                pack.zipFile.file("manifest.json", JSON.stringify(json));
            } else {
                pack.zipFile.file("manifest.json", JSON.stringify(json, undefined, 2));
            }

            pack.zipFile.generateAsync({type: "arraybuffer"})
                .then(function (content) {
                    Solari.file.saveBlob(result + '.apak', new Blob([content]));
                });
        }, function () {
            // No action on cancel
        });
    }

    /**
     * Removes a single pack from the the apak zip file and checksum manifest.
     * @param path
     */
    function deletePack(path) {
        for (i = 0; i < pack.packData.manifest.length; i++) {
            if (pack.packData.manifest[i].path === path) {
                pack.packData.manifest.splice(i, 1);
                pack.zipFile.remove(path);
                break;
            }
        }
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
     * Retrieves title information to display on main header banner.
     *
     * @returns {string} Special formatted string depending on amount of loaded data.
     */
    self.getBannerTitle = function () {
        var len = pack.packData.manifest.length;
        return len > 0 ? (len + ' Pack' + (len > 1 ? 's' : '') + ' Loaded') : 'No All-In-One Pack Selected';
    };

    /**
     * Provides external access to the pack data object.
     *
     * @returns {AllInOnePack} Currently loaded apak.
     */
    self.getModelData = function () {
        return pack.packData;
    };

    /**
     * Retrieves manifest data for all packs matching a requested type.
     *
     * @param {string} extension Simple name of the requested pack type. Valid options: cpak, xpak, tpak.
     * @returns {ManifestEntry[]} Array of manifest data for requested file type.
     */
    self.getPacks = function (extension) {
        var packs = [];

        for (i = 0; i < pack.packData.manifest.length; i++) {
            if (Solari.file.getExtension(pack.packData.manifest[i].path) === extension) {
                packs.push(pack.packData.manifest[i]);
            }
        }

        return packs;
    };

    /**
     * Broadcasts a message for all controllers to load a saved pack based on type.
     *
     * @param {string} path Location of the file in the apak zip.
     */
    self.onPackOpen = function (path) {
        pack.zipFile.file(path)
            .async("arraybuffer")
            .then(function success(content) {
                JSZip.loadAsync(content)
                    .then(function success(zip) {
                        var ext = Solari.file.getExtension(path);
                        var broadcast;

                        if (ext === 'cpak') {
                            broadcast = 'sendToCpak';
                        } else if (ext === 'xpak') {
                            broadcast = 'sendToXpak';
                        } else {
                            $scope.simpleToast('No editor found for file type: ' + ext);
                            return;
                        }

                        $rootScope.$broadcast(broadcast, {data: zip});
                    }, function error(e) {
                    });
            }, function error(e) {
            });
    };

    /**
     * Prompts user and deletes pack from apak zip.
     *
     * @param {string} path Location of the file in the apak zip.
     */
    self.onPackDelete = function (path) {
        var dialog = $mdDialog.confirm()
            .title("Delete Pack")
            .textContent("Delete " + path + " from pack? (Cannot be undone)")
            .targetEvent(event)
            .ok("Delete")
            .cancel("Cancel");

        $mdDialog.show(dialog).then(function accept() {
            deletePack(path);

            // Show undo toast
            var toast = $mdToast.simple()
                .textContent('Removed ' + path)
                .highlightAction(true)
                .highlightClass('md-accent')
                .position("bottom right")
                .hideDelay(3000);

            //TODO allow user to revert delete
            $mdToast.show(toast).then(function (response) {
                if (response === 'ok') {
                }
            });
        }, function cancel() {
            // No action on cancel
        });
    };

    /**
     * Extracts and save a single file from the apak zip to local storage.
     *
     * @param {string} path Location of the file in the apak zip.
     */
    self.onPackDownload = function (path) {
        pack.zipFile.file(path)
            .async("arraybuffer")
            .then(function success(content) {
                Solari.file.saveBlob(path, new Blob([content]));
            }, function error(error) {
                //TODO notify user that file could not be loaded
            });
    };

    /**
     * Prompts user for new name and updates path of file in apak zip.
     *
     * @param {string} path Location of the file in the apak zip.
     */
    self.onPackRename = function (path) {
        var index = -1;
        for (var i = 0; i < pack.packData.manifest.length; i++) {
            if (pack.packData.manifest[i].path === path) {
                index = i;
            }
        }

        if (index < 0) {
            return;
        }

        var dialog = $mdDialog.prompt()
            .title('Rename Pack')
            .textContent('Choose a new name for: ' + path)
            .placeholder('File name')
            .ariaLabel('Rename Pack')
            .initialValue(path)
            .targetEvent(event)
            .ok('Rename')
            .cancel('Cancel');

        $mdDialog.show(dialog).then(function (result) {
            if (result !== undefined && result !== '') {
                //TODO Strip invalid characters
                //result = result.replace(/([^a-z0-9/.\'\s-]+)/gi, '');
            } else {
                $scope.simpleToast('Invalid name. Please try again.');
                return;
            }

            pack.zipFile.file(path)
                .async('arraybuffer')
                .then(function success(content) {
                    pack.zipFile.remove(path).file(result, content);
                    pack.packData.manifest[index].path = result;
                    $timeout(function () {
                        $scope.$apply();
                    });
                }, function error(error) {
                    //TODO notify user that file could not be renamed
                });
        }, function () {
            // No action on cancel
        });
    };

    /**
     * Prompts user and resets all packs of the tab type selected from the apak zip and checksum manifest.
     */
    self.onPackReset = function () {
        var tab = self.tabs[self.selections.page];

        if (self.getPacks(tab.type) <= 0) {
            $scope.simpleToast('No packs to remove');
            return;
        }

        var dialog = $mdDialog.confirm()
            .title("Reset " + tab.title)
            .textContent("Delete all " + tab.subtitle + " packs? (Cannot be undone)")
            .targetEvent(event)
            .ok("Delete")
            .cancel("Cancel");

        $mdDialog.show(dialog).then(function accept() {
            var type = tab.type;

            for (var i = pack.packData.manifest.length - 1; i >= 0; i--) {
                var path = pack.packData.manifest[i].path;
                var ext = Solari.file.getExtension(path);

                if (ext === type) {
                    pack.packData.manifest.splice(i, 1);
                    pack.zipFile.remove(path);
                }
            }

            // Show undo toast
            var toast = $mdToast.simple()
                .textContent('Removed all ' + tab.subtitle)
                .highlightAction(true)
                .highlightClass('md-accent')
                .position("bottom right")
                .hideDelay(3000);

            //TODO allow user to undo pack type reset
            $mdToast.show(toast).then(function (response) {
                if (response === 'ok') {
                }
            });
        }, function cancel() {
            // No action on cancel
        });
    };

    /**
     * Prompts user and removes all packs from the apak zip and manifest
     */
    self.onResetAll = function () {
        var dialog = $mdDialog.confirm()
            .title('Reset All Packs')
            .textContent('Delete all packs? (Cannot be undone)')
            .targetEvent(event)
            .ok("Delete All")
            .cancel("Cancel");

        $mdDialog.show(dialog).then(function accept() {
            for (var i = pack.packData.manifest.length - 1; i >= 0; i--) {
                var path = pack.packData.manifest[i].path;

                pack.packData.manifest.splice(i, 1);
                pack.zipFile.remove(path);
            }

            // Show undo toast
            var toast = $mdToast.simple()
                .textContent('Removed all packs')
                .highlightAction(true)
                .highlightClass('md-accent')
                .position("bottom right")
                .hideDelay(3000);

            //TODO allow user to undo full pack reset
            $mdToast.show(toast).then(function (response) {
                if (response === 'ok') {
                }
            });
        }, function cancel() {
            // No action on cancel
        });
    };

    /**
     * Initializes a drag and drop area for users to place files based on type.
     *
     * @param {string} type Shortname representation of pack type. Must have a corresponding element with id in HTML.
     */
    self.initDragAndDrop = function (type) {
        var fileselect = document.getElementById("apak-item-select");
        fileselect.addEventListener("change", function () {
            Solari.ui.onSelectFiles(event, loadFiles);
        });

        if (window.File && window.FileList && window.FileReader) {
            // Primary triggers upload anywhere, secondary is for visual hint only
            var primary = document.getElementById("apak-" + type + "-drag-primary");
            var secondary = document.getElementById("apak-" + type + "-drag-secondary");

            primary.addEventListener("dragover", Solari.ui.onDragHover);
            primary.addEventListener("dragleave", Solari.ui.onDragHover);
            primary.addEventListener("drop", function () {
                Solari.ui.onSelectFiles(event, loadFiles);
            });
        }
    };

    /**
     * Validates pack data as fields are updated.
     *
     * @param {*} form JSON schema form to validate.
     */
    $scope.onSubmit = function (form) {
        // First we broadcast an event so all fields validate themselves
        $scope.$broadcast('schemaFormValidate');

        // Then we check if the forms are valid
        //TODO Check forms too: if (pack.packData.validate() && pack.formPackValues.$valid) {
        if (pack.packData.validate()) {
            saveApakFile();
        } else {
            // TODO Dialog with list of errors
            //$scope.listErrors(pack.formPackValues.$error);
            $scope.simpleToast("Invalid data. Resolve outstanding alerts and try again.");
        }
    };

    /**
     * Finds an image from the pack data based on position.
     *
     * @param {number} index Position of image in the cache.
     */
    $scope.getCachedImageByIndex = function (index) {
        return MainData.getImageByIndex(pack, index, $scope);
    };

    $scope.$watch(function () {
        return pack.packData.title;
    }, function (newValue, oldValue) {
        if (newValue !== oldValue) {
            $scope.$apply();
        }
    });

    /**
     * Receives a data pack from another controller.
     *
     * @param {event} event Broadcasted event data from controller.
     * @param {object} args Arguments containing data about incoming pack.
     */
    function receivePack(event, args) {
        $scope.onSelectTab(2);

        var path = args.path;

        if (pack.packData.contains(path)) {
            var dialog = $mdDialog.confirm()
                .title("Overwrite Pack")
                .textContent(Solari.utils.format('Overwrite existing {0}? (Cannot be undone)', path))
                //.targetEvent(event)
                .ok("Overwrite")
                .cancel("Cancel");

            $mdDialog.show(dialog).then(function ok() {
                deletePack(path);

                self.pendingData++;
                onLoad({name: path}, args.data);

                // Show undo toast
                var toast = $mdToast.simple()
                    .textContent('Replaced ' + path)
                    .highlightAction(true)
                    .highlightClass('md-accent')
                    .position("bottom right")
                    .hideDelay(3000);

                //TODO allow user to undo replacement
                $mdToast.show(toast).then(function (response) {
                    if (response === 'ok') {
                    }
                });
            }, function cancel() {
                // No action on cancel
            });
        } else {
            self.pendingData++;
            onLoad({name: args.path}, args.data);
        }
    }

    init();
}
