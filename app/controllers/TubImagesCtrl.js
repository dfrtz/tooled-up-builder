/**
 * @file A set of Tooled Up - Builder app controllers for image management.
 *
 * @author David Fritz
 * @version 1.0.0
 *
 * @copyright 2015-2017 David Fritz
 * @license MIT
 */
angular.module("tooledUpBuilder").controller("TubImagesCtrl", ["MainData", "$scope", "$timeout", "$mdColors", "$mdDialog", "$mdToast", TubImagesCtrl]);
angular.module("tooledUpBuilder").controller("TubCpakImagesCtrl", ["MainData", "$scope", "$timeout", "$mdColors", "$mdDialog", "$mdToast", TubCpakImagesCtrl]);
angular.module("tooledUpBuilder").controller("TubXpakImagesCtrl", ["MainData", "$scope", "$timeout", "$mdColors", "$mdDialog", "$mdToast", TubXpakImagesCtrl]);

function TubImagesCtrl(MainData, $scope, $timeout, $mdColors, $mdDialog, $mdToast, pack) {
    var self = this;

    self.page = 0;
    self.imagesPerPage = 20;
    self.pendingData = 0;
    self.imageCache = pack.imageCache;

    /**
     * Updates UI to notify user if all uploads are complete.
     */
    function checkUploadStatus() {
        if (self.pendingData === 0) {
            // Sort and update UI after all pending loads complete
            Solari.utils.sortArray(pack.imageCache, "path");
            $scope.$digest();
        }
    }

    /**
     * Processes a list of Files to upload into image cache and pack.
     *
     * @param {File[]} files Array of files to process.
     */
    self.onImageUpload = function (files) {
        var dialog = $mdDialog.prompt()
            .title("Image Upload")
            .textContent("Optional: Change base folder?")
            .placeholder("Leave blank for no folder")
            .ariaLabel("Image upload folder")
            .initialValue("")
            .targetEvent(event)
            .ok("Upload")
            .cancel("Cancel");

        $mdDialog.show(dialog).then(function (result) {
            if (result !== undefined && result !== "") {
                result = result.replace(/([^a-z0-9/.'\s-]+)/gi, "");

                if (!result.endsWith("/")) {
                    result = result + "/";
                }
            } else {
                result = "";
            }

            var images = [];

            // Filter out non-image or duplicate files
            var duplicates = 0;
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                var oldImage = $scope.getCachedImageByName(result + file.name);

                if (oldImage) {
                    duplicates++;
                }
                if (!file.type.match("image.*") || oldImage) {
                    // Not an image, or a duplicate image
                    continue;
                }

                images.push(file);
            }
            document.getElementById("file-uploads").reset();

            if (duplicates) {
                var message = duplicates + " Duplicate" + (duplicates > 1 ? "s" : "") + " skipped";
                var toast = $mdToast.simple()
                    .textContent(message)
                    //.action("OVERWRITE")
                    .highlightAction(true)
                    .highlightClass("md-accent")
                    .position("bottom right")
                    .hideDelay(3000);
                $mdToast.show(toast).then(function (response) {
                    if (response === "ok") {
                        //TODO allow user to overwrite existing files
                    }
                });
            }

            self.pendingData += images.length;
            var processImage = function (file, data) {
                var finalName = result + file.name;
                self.pendingData--;

                // Strip URL data for base64 only
                data = data.replace(/^data:.*base64,/, "");
                pack.zipFile.file(finalName, data, {base64: true, createFolders: true});
                pack.imageCache.push(new Image(finalName, data));

                checkUploadStatus();
                if (self.pendingData === 0) {
                    var message = images.length + " Image" + (images.length > 1 ? "s" : "") + " uploaded";
                    var toast = $mdToast.simple()
                        .textContent(message)
                        //.action("UNDO")
                        .highlightAction(true)
                        .highlightClass("md-accent")
                        .position("bottom right")
                        .hideDelay(3000);
                    $mdToast.show(toast).then(function (response) {
                        if (response === "ok") {
                            //TODO allow user to undo upload
                        }
                    });
                }
            };

            for (i = 0; i < images.length; i++) {
                Solari.file.readAsDataURL(images[i], processImage);
            }
        }, function () {
            // No action on cancel
        });
    };

    /**
     * Displays a view only popup dialog for an image.
     *
     * @param {event} event Interaction based event to originate popup.
     * @param {number} index Position of image in image cache.
     */
    self.onImagePreview = function (event, index) {
        $mdDialog.show({
            controller: "TubDialogPreviewImageCtrl",
            templateUrl: "app/templates/template_dialog_imagepreview.html",
            targetEvent: event,
            clickOutsideToClose: true,
            locals: {
                image: pack.imageCache[self.page * self.imagesPerPage + index]
            }
        }).then(function () {
            // Dismiss dialog
        }, function () {
            // No action on cancel
        });
    };

    /**
     * Prompts and removes an image from the cache and pack data.
     *
     * @param {event} event Interaction based event to originate popups.
     * @param {number} index Position of image in image cache.
     */
    self.onImageDelete = function (event, index) {
        var arrayIndex = self.page * self.imagesPerPage + index;
        var image = pack.imageCache[arrayIndex];

        var dialog = $mdDialog.confirm()
            .title("Remove Image")
            .textContent("Delete " + image.path + " from pack? (Cannot be undone)")
            .targetEvent(event)
            .ok("Delete")
            .cancel("Cancel");

        $mdDialog.show(dialog).then(function () {
            var image = pack.imageCache[arrayIndex];

            pack.imageCache.splice(arrayIndex, 1);
            if (pack.zipFile) {
                pack.zipFile.remove(image.path);
            }

            // Change page if it was the last item visible
            var images = pack.imageCache.length;
            if (arrayIndex > images - 1 && // Last image in cache?
                images % self.imagesPerPage === 0 && // Last image on page?
                images > 0) { // Other images available?
                self.page--;
            }

            // Force immediate redraw of UI, angular will not detect automatically
            $timeout(function () {
                $scope.$emit("resizeMsg");
            });

            var toast = $mdToast.simple()
                .textContent("Deleted " + image.path)
                //.action("UNDO")
                .highlightAction(true)
                .highlightClass("md-accent")
                .position("bottom right")
                .hideDelay(3000);
            $mdToast.show(toast).then(function (response) {
                if (response === "ok") {
                    //TODO Undo Image Delete"
                }
            });
        }, function () {
            // No action on cancel
        });
    };

    /**
     * Prompts and renames an image in the cache and pack data.
     *
     * @param {event} event Interaction based event to originate popups.
     * @param {number} index Position of image in image cache.
     */
    self.onImageRename = function (event, index) {
        var arrayIndex = self.page * self.imagesPerPage + index;
        var image = pack.imageCache[arrayIndex];

        var confirm = $mdDialog.prompt()
            .title("Image Rename")
            .textContent("Rename: " + image.path)
            .placeholder("Image name")
            .ariaLabel("Image name")
            .initialValue(image.path)
            .targetEvent(event)
            .ok("Rename")
            .cancel("Cancel");

        $mdDialog.show(confirm).then(function (result) {
            result = result.replace(/([^a-z0-9/.'\s-]+)/gi, "");
            if (result === image.path) {
                return;
            }

            if ($scope.getCachedImageByName(result)) {
                var toast = $mdToast.simple()
                    .textContent("Skipping rename, existing image found: " + result)
                    //.action("OVERWRITE")
                    .highlightAction(true)
                    .highlightClass("md-accent")
                    .position("bottom right")
                    .hideDelay(3000);

                $mdToast.show(toast).then(function (response) {
                    if (response === "ok") {
                        //TODO Allow rename overwrite
                    }
                });

                return;
            }

            pack.zipFile.remove(image.path);
            image.path = result;
            pack.zipFile.file(image.path, image.data, {base64: true, createFolders: true});
            Solari.utils.sortArray(pack.imageCache, "path");
        }, function () {
            // No action on cancel
        });
    };

    /**
     * Prompts and removes all images in the cache and pack data.
     */
    self.onImageReset = function () {
        var dialog = $mdDialog.confirm()
            .title("Remove All Images")
            .textContent("Delete all images from card pack? (Cannot be undone)")
            .targetEvent(event)
            .ok("Delete All")
            .cancel("Cancel");

        $mdDialog.show(dialog).then(function () {
            self.page = 0;

            // Remove files "LIFO" to prevent outOfBounds exception
            if (pack.zipFile) {
                for (var i = pack.imageCache.length - 1; i >= 0; i--) {
                    var image = pack.imageCache[i];

                    if (image) {
                        pack.zipFile.remove(image.path);
                    }
                }
            }
            pack.imageCache.length = 0;

            // Force immediate redraw of UI, angular will not detect automatically
            $timeout(function () {
                $scope.$emit("resizeMsg");
            });

            // Show undo toast
            var toast = $mdToast.simple()
                .textContent("Images Reset")
                //.action("UNDO")
                .highlightAction(true)
                .highlightClass("md-accent")
                .position("bottom right")
                .hideDelay(3000);

            $mdToast.show(toast).then(function (response) {
                if (response === "ok") {
                    //TODO: Undo Image Reset"
                }
            });
        }, function () {
            // No action on cancel
        });
    };

    /**
     * Sets the currently active page in the image grid.
     *
     * @param newPage
     */
    self.onSetImagePage = function (newPage) {
        self.page = newPage;
    };

    /**
     * Calculates the number of pages in the image grid.
     *
     * @returns {number} Maximum amount of pages.
     */
    self.getImagePageCount = function () {
        return Math.ceil(pack.imageCache.length / self.imagesPerPage);
    };

    /**
     * Finds the index of the first image in the image cache for a given image grid page.
     *
     * @param {number} page Index of the page in the image grid.
     * @returns {number} Index of the first image in the image cache for this page.
     */
    self.getImagePageStart = function (page) {
        if (page === undefined) {
            page = self.page;
        }
        return page * self.imagesPerPage;
    };

    /**
     * Finds the index of the last image in the image cache for a given image grid page.
     *
     * @param {number} page Index of the page in the image grid.
     * @returns {number} Index of the last image in the image cache for this page.
     */
    self.getImagePageEnd = function (page) {
        if (page === undefined) {
            page = self.page;
        }

        page = page * self.imagesPerPage + self.imagesPerPage;
        return page < pack.imageCache.length ? page : pack.imageCache.length;
    };

    /**
     * Finds an Image in the cache.
     *
     * @param {number} index Position of the image in the image grid.
     * @returns {Image} Image object from the cache at specified position
     */
    self.getCachedImage = function (index) {
        var arrayIndex = self.page * self.imagesPerPage + index;
        return $scope.getCachedImageByIndex(arrayIndex);
    };
}

function TubCpakImagesCtrl(MainData, $scope, $timeout, $mdColors, $mdDialog, $mdToast) {
    var self = this;

    // Initialize parent controller
    TubImagesCtrl.call(this, MainData, $scope, $timeout, $mdColors, $mdDialog, $mdToast, MainData.getPack("cpak"));

    /**
     * Initializes controller drag and drop areas.
     *
     * Must be called at end of assignments.
     */
    function initDragAndDrop() {
        var fileselect = document.getElementById("cpak-image-select");
        fileselect.addEventListener("change", function () {
            Solari.ui.onSelectFiles(event, self.onImageUpload);
        });

        if (window.File && window.FileList && window.FileReader) {
            // Primary triggers upload anywhere, secondary is for visual hint only
            var primary = document.getElementById("cpak-image-drag-primary");
            var secondary = document.getElementById("cpak-image-drag-secondary");

            primary.addEventListener("dragover", Solari.ui.onDragHover);
            primary.addEventListener("dragleave", Solari.ui.onDragHover);
            primary.addEventListener("drop", function () {
                Solari.ui.onSelectFiles(event, self.onImageUpload);
            });
        }
    }

    initDragAndDrop();
}

TubCpakImagesCtrl.prototype = Object.create(TubImagesCtrl.prototype);
TubCpakImagesCtrl.prototype.constructor = TubCpakImagesCtrl;

function TubXpakImagesCtrl(MainData, $scope, $timeout, $mdColors, $mdDialog, $mdToast) {
    var self = this;

    // Initialize parent controller
    TubImagesCtrl.call(this, MainData, $scope, $timeout, $mdColors, $mdDialog, $mdToast, MainData.getPack("xpak"));

    /**
     * Initializes controller drag and drop areas.
     *
     * Must be called at end of assignments.
     */
    function initDragAndDrop() {
        var fileselect = document.getElementById("xpak-image-select");
        fileselect.addEventListener("change", function () {
            Solari.ui.onSelectFiles(event, self.onImageUpload);
        });

        if (window.File && window.FileList && window.FileReader) {
            // Primary triggers upload anywhere, secondary is for visual hint only
            var primary = document.getElementById("xpak-image-drag-primary");
            var secondary = document.getElementById("xpak-image-drag-secondary");

            primary.addEventListener("dragover", Solari.ui.onDragHover);
            primary.addEventListener("dragleave", Solari.ui.onDragHover);
            primary.addEventListener("drop", function () {
                Solari.ui.onSelectFiles(event, self.onImageUpload);
            });
        }
    }

    initDragAndDrop();
}

TubXpakImagesCtrl.prototype = Object.create(TubImagesCtrl.prototype);
TubXpakImagesCtrl.prototype.constructor = TubXpakImagesCtrl;
