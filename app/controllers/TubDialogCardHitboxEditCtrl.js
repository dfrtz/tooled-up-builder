angular.module('tooledUpBuilder').controller('TubDialogCardHitboxEditCtrl', ['$scope', '$mdDialog', 'card', 'version', 'hitbox', 'getCachedImageByName', '$mdToast', '$timeout', TubDialogCardHitboxEditCtrl]);

function TubDialogCardHitboxEditCtrl($scope, $mdDialog, card, version, hitbox, getCachedImageByName, $mdToast, $timeout) {
    var self = this;

    self.versionIndex = version;
    self.hitboxIndex = hitbox;

    self.card = card;
    self.activeVersion = self.card.versions[version];
    self.activeHitbox = self.activeVersion.hitboxes[hitbox];

    self.canvases = [];
    self.canvasLock = true;
    self.coords = [];

    self.selectedCoord = undefined;

    var flipperCtrl;

    function init() {
        self.coords = preprocessCoords(self.activeHitbox.values, getDefaults(self.activeHitbox));
    }

    init();

    function preprocessCoords(values, defaults) {
        var coords = [];
        if (!defaults) {
            defaults = getDefaults();
        }

        if (values) {
            var tuples = values.split(' ');

            for (var i = 0; i < tuples.length; i++) {
                var tuple = tuples[i].split(',');
                var x = parseInt(tuple[0]) || defaults.x;
                var y = parseInt(tuple[1]) || defaults.y;
                var z = parseInt(tuple[2]) || defaults.z;
                var size = parseInt(tuple[3]) || defaults.size;
                var color = Solari.ui.hexToRGBA(tuple[4]) || defaults.color;
                var shape = parseInt(tuple[5]) || defaults.shape;

                coords.push(new Solari.ui.Coordinate(x, y, z, size, color, shape, i));
            }
        }

        return coords;
    }

    function postprocessCoords(coords, defaults) {
        var tuples = [];

        if (!defaults) {
            defaults = getDefaults();
        }

        var defaultColor = Solari.ui.rgbaStringToHex(defaults.color);
        for (var i = 0; i < coords.length; i++) {
            var coord = coords[i];
            var tuple = '';
            var x = parseInt(coord.x) || defaults.x;
            var y = parseInt(coord.y) || defaults.y;
            var z = parseInt(coord.z) || defaults.z;
            var size = parseInt(coord.size) || defaults.size;
            var color = Solari.ui.rgbaStringToHex(coord.color) || defaultColor;
            var shape = parseInt(coord.shape) || defaults.shape;

            x = x === defaults.x ? '' : x;
            y = y === defaults.y ? '' : y;
            z = z === defaults.z ? '' : z;
            size = size === defaults.size ? '' : size;
            color = color === defaultColor ? '' : color;
            shape = shape === defaults.shape ? '' : shape;

            tuple = Solari.utils.format('{0},{1},{2},{3},{4}', x, y, z, size, color, shape).replace(/,+$/, '');
            tuples.push(tuple);
        }

        return tuples.join(' ');
    }

    function onUpdateGridSize(index) {
        var canvas = self.canvases[index];

        canvas.setDimensions(self.canvasWidth, self.canvasHeight);

        canvas.drawRatio = self.canvasHeight / 1000;
    }

    function onUpdateCoordList(index) {
        var canvas = self.canvases[index];
        var side = index + 1;

        for (var i = 0; i < self.coords.length; i++) {
            var coord = self.coords[i];

            if (side == coord.z) {
                canvas.addCoordinate(coord);
            }
        }
    }

    function getDefaults(hitbox) {
        if (!hitbox) {
            hitbox = {};
        }

        return {
            x: hitbox.defaultX || 0,
            y: hitbox.defaultY || 0,
            z: hitbox.defaultZ || 1,
            size: hitbox.defaultSize || 20,
            color: Solari.ui.hexToRGBA(hitbox.color) || Solari.ui.hexToRGBA('#ccd01716'),
            shape: hitbox.defaultShape || 0
        };
    }

    self.initFlipper = function () {
        flipperCtrl = angular.element(document.getElementById("flipper")).scope().getController();

        self.canvasWidth = parseFloat(flipperCtrl.width);
        self.canvasHeight = parseFloat(flipperCtrl.height);
    };

    self.initCanvas = function (index) {
        var defaults = getDefaults(self.activeHitbox);

        var canvas = new Solari.ui.CoordinateCanvas(document.getElementById('canvas' + index));
        self.canvases.splice(index, 0, canvas);

        onUpdateGridSize(index);
        onUpdateCoordList(index);

        canvas.lock();
        canvas.setOnDoubleClickListener(function (event) {
            var pos = canvas.getMousePos(event);
            var size = defaults.size;
            var color = defaults.color;
            var shape = defaults.shape;
            var ratio = canvas.drawRatio;

            if (self.coords.length > 0) {
                size = self.coords[self.coords.length - 1].size;
                color = self.coords[self.coords.length - 1].color;
                shape = self.coords[self.coords.length - 1].shape;
            }

            var coord = new Solari.ui.Coordinate(Math.round(pos.x / ratio), Math.round(pos.y / ratio),
                flipperCtrl.position + 1, size, color, shape, self.coords.length);
            self.coords.push(coord);
            canvas.addCoordinate(coord);
        });
        canvas.setOnSelectListener(function (position) {
            if (position !== undefined) {
                self.selectedCoord = self.coords[position];
            } else {
                self.selectedCoord = undefined;
            }

            $timeout(function () {
                $scope.$apply();
            });
        });
        canvas.setDrawCallback(function () {
            $timeout(function () {
                $scope.$apply();
            });
        });
    };

    self.onLockCanvas = function () {
        flipperCtrl.disabled = false;
        self.canvasLock = true;

        for (var i = 0; i < self.canvases.length; i++) {
            self.canvases[i].lock();
        }

        self.canvases[flipperCtrl.position].selectCoordinate(undefined, true);

        $scope.simpleToast('Coordinates locked, card flipping enabled');
    };

    self.onUnlockCanvas = function () {
        flipperCtrl.disabled = true;
        self.canvasLock = false;

        for (var i = 0; i < self.canvases.length; i++) {
            self.canvases[i].unlock();
        }

        $scope.simpleToast('Coordinates unlocked, card flipping disabled.');
    };

    self.getImage = function (name) {
        var image = getCachedImageByName(name);

        return "data:image/png;base64," + image.data;
    };

    self.getImageRatio = function () {
        if (card.landscape) {
            return "4/3";
        } else {
            return "3/4";
        }
    };

    self.getGridSize = function () {
        if (card.landscape) {
            return {x: 1000, y: 750};
        } else {
            return {x: 750, y: 1000};
        }
    };

    self.idGetterSetter = function (id) {
        if (arguments.length && self.selectedCoord) {
            var newId = id - 1;

            self.coords.splice(newId, 0, self.coords.splice(self.selectedCoord.id, 1)[0]);

            for (var i = 0; i < self.coords.length; i++) {
                self.coords[i].id = i;
            }

            var canvas = self.canvases[flipperCtrl.position];
            canvas.selectCoordinate(newId);
            canvas.invalidate();
        } else if (self.selectedCoord) {
            return self.selectedCoord.id + 1;
        }

        return undefined;
    };

    self.colorGetterSetter = function (color) {
        if (arguments.length && self.selectedCoord) {
            var newColor = Solari.ui.hexToRGBA(color);
            if (newColor) {
                self.selectedCoord.color = newColor;
            } else {
                self.selectedCoord.color = color;
            }

            self.canvases[flipperCtrl.position].invalidate();
        } else if (self.selectedCoord) {
            return Solari.ui.rgbaStringToHex(self.selectedCoord.color);
        }

        return undefined;
    };

    self.posGetterSetter = function (axis, value) {
        if (value && self.selectedCoord) {
            self.selectedCoord[axis] = value;
            self.canvases[self.selectedCoord.z - 1].invalidate();
        } else if (self.selectedCoord) {
            return self.selectedCoord[axis];
        }

        return undefined;
    };

    self.xGetterSetter = function (x) {
        return self.posGetterSetter('x', x);
    };

    self.yGetterSetter = function (y) {
        return self.posGetterSetter('y', y);
    };

    self.zGetterSetter = function (z) {
        if (z && self.selectedCoord) {
            self.canvases[self.selectedCoord.z - 1].removeCoordinate(self.selectedCoord.id, false, true);
            self.canvases[z - 1].addCoordinate(self.selectedCoord);

            $timeout(function () {
                self.canvases[0].invalidate();
            }, 100);
        }

        return self.posGetterSetter('z', z);
    };

    self.sizeGetterSetter = function (size) {
        return self.posGetterSetter('size', size);
    };

    self.onMoveCoord = function (direction) {
        if (!self.selectedCoord) {
            return;
        }

        if (direction == 'u') {
            self.posGetterSetter('y', self.selectedCoord.y - 1);
        } else if (direction == 'd') {
            self.posGetterSetter('y', self.selectedCoord.y + 1);
        } else if (direction == 'l') {
            self.posGetterSetter('x', self.selectedCoord.x - 1);
        } else if (direction == 'r') {
            self.posGetterSetter('x', self.selectedCoord.x + 1);
        }
    };

    self.onDeleteCoord = function (index) {
        var canvas = self.canvases[flipperCtrl.position];

        // Remove from canvas first so that ID can be used
        canvas.removeCoordinate(index);

        // Remove from backing array using stored ID second, as point was unselected
        self.coords.splice(index, 1);
        for (var i = 0; i < self.coords.length; i++) {
            self.coords[i].id = i;
        }

        canvas.invalidate();
    };

    self.onDeleteAll = function (index) {
        self.coords.length = 0;

        for (var i = 0; i < self.canvases.length; i++) {
            self.canvases[i].reset();
        }
    };

    $scope.hide = function () {
        $mdDialog.hide();
    };

    $scope.cancel = function () {
        $mdDialog.cancel();
    };

    $scope.answer = function (answer) {
        $mdDialog.hide(postprocessCoords(self.coords, getDefaults(self.activeHitbox)));
    };

    $scope.simpleToast = function (message) {
        var toast = $mdToast.simple()
            .textContent(message)
            .highlightAction(true)
            .highlightClass('md-accent')
            .position("bottom right")
            .hideDelay(3000);
        $mdToast.show(toast);
    };
}
