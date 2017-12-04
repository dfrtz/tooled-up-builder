/**
 * @file A set of Tooled Up - Builder app controllers for image management.
 *
 * @author David Fritz
 * @version 1.0.0
 *
 * @copyright 2015-2017 David Fritz
 * @license MIT
 */
angular.module('tooledUpBuilder').controller('TubImagesCtrl', ['MainData', '$scope', '$timeout', '$mdColors', '$mdDialog', '$mdToast', TubImagesCtrl]);
angular.module('tooledUpBuilder').controller('TubCpakImagesCtrl', ['MainData', '$scope', '$timeout', '$mdColors', '$mdDialog', '$mdToast', TubCpakImagesCtrl]);
angular.module('tooledUpBuilder').controller('TubXpakImagesCtrl', ['MainData', '$scope', '$timeout', '$mdColors', '$mdDialog', '$mdToast', TubXpakImagesCtrl]);

function TubImagesCtrl(MainData, $scope, $timeout, $mdColors, $mdDialog, $mdToast, pack) {
    var self = this;

    self.page = 0;
    self.imagesPerPage = 20;

    self.pendingData = 0;

    self.imageCache = pack.imageCache;

    // Internal functions
    function checkUploadStatus() {
        if (self.pendingData === 0) {
            // Sort and update UI after all pending loads complete
            Solari.utils.sortArray(pack.imageCache, "path");
            $scope.$digest();
        }
    }

    // External functions
    self.onImageUpload = function(files) {
        var dialog = $mdDialog.prompt()
            .title('Image Upload')
            .textContent('Optional: Change base folder?')
            .placeholder('Leave blank for no folder')
            .ariaLabel('Image upload folder')
            .initialValue('')
            .targetEvent(event)
            .ok('Upload')
            .cancel('Cancel');

        $mdDialog.show(dialog).then(function(result) {
            if (result !== undefined && result !== '') {
                result = result.replace(/([^a-z0-9/.'\s-]+)/gi, '');

                if (!result.endsWith('/')) {
                    result = result + '/';
                }
            } else {
                result = '';
            }

            var images = [];

            // Filter out non-image files
            var duplicates = 0;
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                var oldImage = $scope.getCachedImageByName(result + file.name);

                if (oldImage) {
                    duplicates++;
                }
                if (!file.type.match('image.*') || oldImage) {
                    // Not an image, or a duplicate image
                    continue;
                }

                images.push(file);
            }
            document.getElementById('file-uploads').reset();

            if (duplicates) {
                var message = duplicates + ' Duplicate' + (duplicates > 1 ? 's' : '') + ' skipped';
                var toast = $mdToast.simple()
                    .textContent(message)
                    .highlightAction(true)
                    .highlightClass('md-accent')
                    .position("bottom right")
                    .hideDelay(3000);
                $mdToast.show(toast).then(function(response) {
                    if (response == 'ok') {
                    }
                });
            }

            // Set processing flag to display progress bar
            self.pendingData += images.length;

            var processImage = function(file, data) {
                self.pendingData--;

                var finalName = result + file.name;

                // Strip URL data for base64 only
                data = data.replace(/^data:.*base64,/, '');

                //pack.zipFile.file(file.name, data, {base64: true});
                pack.zipFile.file(finalName, data, {base64: true, createFolders: true});
                pack.imageCache.push(new Image(finalName, data));

                checkUploadStatus();
                if (self.pendingData === 0) {
                    var message = images.length + ' Image' + (images.length > 1 ? 's' : '') + ' uploaded';
                    var toast = $mdToast.simple()
                        .textContent(message)
                        .highlightAction(true)
                        .highlightClass('md-accent')
                        .position("bottom right")
                        .hideDelay(3000);
                    $mdToast.show(toast).then(function(response) {
                        if (response == 'ok') {
                        }
                    });
                }
            };

            for (i = 0; i < images.length; i++) {
                Solari.file.readAsDataURL(images[i], processImage);
            }
        }, function() {
            // No action on cancel
        });
    };

    self.onImagePreview = function(event, index) {
        $mdDialog.show({
            controller: 'TubDialogPreviewImageCtrl',
            templateUrl: 'templates/template_dialog_imagepreview.html',
            targetEvent: event,
            clickOutsideToClose: true,
            locals : {
                image: pack.imageCache[self.page * self.imagesPerPage + index]
            }
        })
        .then(function() {
            //console.log('You said the information was "' + answer + '".');
        }, function() {
            // No action on cancel
        });
    };

    self.onImageDelete = function(event, index) {
        var arrayIndex = self.page * self.imagesPerPage + index;
        var image = pack.imageCache[arrayIndex];

        var dialog = $mdDialog.confirm()
            .title("Remove Image")
            .textContent("Delete " + image.path + " from pack? (Cannot be undone)")
            .targetEvent(event)
            .ok("Delete")
            .cancel("Cancel");

        $mdDialog.show(dialog).then(function() {
            var image = pack.imageCache[arrayIndex];

            // Remove from zip
            if (pack.zipFile) {
                pack.zipFile.remove(image.path);
            }

            // Remove from cache
            pack.imageCache.splice(arrayIndex, 1);

            // Change page if it was the last item visible
            var images = pack.imageCache.length;
            if (arrayIndex > images - 1 && // Last image in cache?
                (images) % self.imagesPerPage === 0 && // Last image on page?
                images > 0) { // Other images available?
                self.page--;
            }

            // Force immediate redraw of UI, angular will not detect automatically
            $timeout(function() { $scope.$emit('resizeMsg'); });

            // Show undo toast
            var toast = $mdToast.simple()
                .textContent('Deleted ' + image.path)
                //.action('UNDO')
                .highlightAction(true)
                .highlightClass('md-accent')
                .position("bottom right")
                .hideDelay(3000);

            $mdToast.show(toast).then(function(response) {
                if (response == 'ok') {
                    //TODO: Undo Image Delete"
                }
            });
        }, function() {
          // No action on cancel
        });
    };

    self.onImageRename = function(event, index) {
        var arrayIndex = self.page * self.imagesPerPage + index;
        var image = pack.imageCache[arrayIndex];

        var confirm = $mdDialog.prompt()
            .title('Image Rename')
            .textContent('Rename: ' + image.path)
            .placeholder('Image name')
            .ariaLabel('Image name')
            .initialValue(image.path)
            .targetEvent(event)
            .ok('Rename')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function(result) {
            // Clean our dirty characters for file names
            result = result.replace(/([^a-z0-9/.\'\s-]+)/gi, '');

            if (result == image.path) {
                // Image name was not changed
                return;
            }

            // Check for duplicate
            if ($scope.getCachedImageByName(result)) {
                var toast = $mdToast.simple()
                    .textContent('Skipping rename, existing image found: ' + result)
                    .highlightAction(true)
                    .highlightClass('md-accent')
                    .position("bottom right")
                    .hideDelay(3000);

                $mdToast.show(toast).then(function(response) {
                    if (response == 'ok') {
                    }
                });

                return;
            }

            // Remove existing image from file, and update cache path
            pack.zipFile.remove(image.path);
            image.path = result;

            // Add new image and re-sort images
            pack.zipFile.file(image.path, image.data, {base64: true, createFolders: true});
            Solari.utils.sortArray(pack.imageCache, "path");
        }, function() {
            // No action on cancel
        });
    };

    self.onImageReset = function() {
        var dialog = $mdDialog.confirm()
            .title("Remove All Images")
            .textContent("Delete all images from card pack? (Cannot be undone)")
            .targetEvent(event)
            .ok("Delete All")
            .cancel("Cancel");

        $mdDialog.show(dialog).then(function() {
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

            // Clear cache
            pack.imageCache.length = 0;

            // Force immediate redraw of UI, angular will not detect automatically
            $timeout(function() { $scope.$emit('resizeMsg'); });

            // Show undo toast
            var toast = $mdToast.simple()
                .textContent('Images Reset')
                //.action('UNDO')
                .highlightAction(true)
                .highlightClass('md-accent')
                .position("bottom right")
                .hideDelay(3000);

            $mdToast.show(toast).then(function(response) {
                if (response == 'ok') {
                    //TODO: Undo Image Reset"
                }
            });
        }, function() {
          // No action on cancel
        });
    };

    self.onSetImagePage = function(newPage) {
        self.page = newPage;
    };

    self.getImagePageCount = function() {
        return Math.ceil(pack.imageCache.length / self.imagesPerPage);
    };

    self.getImagePageStart = function(page) {
        if (page === undefined) {
            page = self.page;
        }
        return page * self.imagesPerPage;
    };

    self.getImagePageEnd = function(page) {
        if (page === undefined) {
            page = self.page;
        }

        page = page * self.imagesPerPage + self.imagesPerPage;

        return page < pack.imageCache.length ? page : pack.imageCache.length;
    };

    self.getCachedImage = function(index) {
        var arrayIndex = self.page * self.imagesPerPage + index;

        return $scope.getCachedImageByIndex(arrayIndex);
    };

    // Wrapper fucntions for DOM access

    // Add watchers to update UI

    // Add user event listeners
}

function TubCpakImagesCtrl(MainData, $scope, $timeout, $mdColors, $mdDialog, $mdToast) {
    var self = this;

    TubImagesCtrl.call(this, MainData, $scope, $timeout, $mdColors, $mdDialog, $mdToast, MainData.getPack('cpak'));

    function initDragAndDrop() {
        var fileselect = document.getElementById("cpak-image-select");
        fileselect.addEventListener("change", function() {Solari.ui.onSelectFiles(event, self.onImageUpload);});

        if (window.File && window.FileList && window.FileReader) {
            // Primary triggers upload anywhere, secondary is for visual hint only
            var	primary = document.getElementById("cpak-image-drag-primary");
            var	secondary = document.getElementById("cpak-image-drag-secondary");

            primary.addEventListener("dragover", Solari.ui.onDragHover);
            primary.addEventListener("dragleave", Solari.ui.onDragHover);
            primary.addEventListener("drop", function() {Solari.ui.onSelectFiles(event, self.onImageUpload);});
        }
    }

    initDragAndDrop();
}
TubCpakImagesCtrl.prototype = Object.create(TubImagesCtrl.prototype);
TubCpakImagesCtrl.prototype.constructor = TubCpakImagesCtrl;

function TubXpakImagesCtrl(MainData, $scope, $timeout, $mdColors, $mdDialog, $mdToast) {
    var self = this;

    TubImagesCtrl.call(this, MainData, $scope, $timeout, $mdColors, $mdDialog, $mdToast, MainData.getPack('xpak'));

    function initDragAndDrop() {
        var fileselect = document.getElementById("xpak-image-select");
        fileselect.addEventListener("change", function() { Solari.ui.onSelectFiles(event, self.onImageUpload); });

        if (window.File && window.FileList && window.FileReader) {
            // Primary triggers upload anywhere, secondary is for visual hint only
            var	primary = document.getElementById("xpak-image-drag-primary");
            var	secondary = document.getElementById("xpak-image-drag-secondary");

            primary.addEventListener("dragover", Solari.ui.onDragHover);
            primary.addEventListener("dragleave", Solari.ui.onDragHover);
            primary.addEventListener("drop", function() { Solari.ui.onSelectFiles(event, self.onImageUpload); });
        }
    }

    initDragAndDrop();
}
TubXpakImagesCtrl.prototype = Object.create(TubImagesCtrl.prototype);
TubXpakImagesCtrl.prototype.constructor = TubXpakImagesCtrl;
