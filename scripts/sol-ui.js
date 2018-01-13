/**
 * @file A library containing HTML element interaction functions, and custom HTML elements.
 *
 * @summary Custom Elements and Element interaction functions.
 *
 * @author David Fritz
 * @version 1.0.0
 *
 * @copyright 2015-2017 David Fritz
 * @license MIT
 */
var Solari = (function (parent) {
    var Ui = parent.ui = parent.ui || {};

    /**
     * Selects files from user input generated by hover operation.
     *
     * @param {event} event Event generated by element.
     * @param {function} callback Where to send processed data.
     */
    function onSelectFiles(event, callback) {
        onDragHover(event);

        if (typeof callback !== "function") {
            return;
        }

        callback(event.target.files || event.dataTransfer.files);
    }

    /**
     * Updates HTML element with drag styles to provide feedback to user.
     *
     * @param {event} event Event generated by element.
     */
    function onDragHover(event) {
        event.stopPropagation();
        event.preventDefault();

        // Only update drag region classes
        if (event.target.classList.contains("drag-region")) {
            if (event.type === "dragover") {
                if (!event.target.classList.contains("hover")) {
                    event.target.classList.add("hover");
                }
            } else {
                event.target.classList.remove("hover");
            }
        }
    }

    /**
     * Converts hexadecimal color string into rgba formatted integer string.
     *
     * @param {string} hex Text representing a hexadecimal (0-9A-F) color.
     * @returns {string} String representing colors as 'rgba(red, green, blue, alpha)'.
     */
    function hexToRGBA(hex) {
        if (hex === undefined) {
            return undefined;
        }

        hex = hex.replace("#", "");

        if (hex.length === 8) {
            var a = parseInt(hex.substring(0, 2), 16);
            var r = parseInt(hex.substring(2, 4), 16);
            var g = parseInt(hex.substring(4, 6), 16);
            var b = parseInt(hex.substring(6, 8), 16);
        } else if (hex.length === 4) {
            a = parseInt(hex.substring(0, 1), 16);
            r = parseInt(hex.substring(1, 2), 16);
            g = parseInt(hex.substring(2, 3), 16);
            b = parseInt(hex.substring(3, 4), 16);
        } else {
            return undefined;
        }

        return "rgba(" + r + "," + g + "," + b + "," + (a / 255) + ")";
    }

    /**
     * Converts four values representing red, green, blue, and alpha into hexadecimal string.
     *
     * @param {string|number} r Red value from 0 to 255
     * @param {string|number} g Green value from 0 to 255
     * @param {string|number} b Blue value from 0 to 255
     * @param {string|number} a Alpha value from 0 to 255
     * @returns {string} String representing color as hexadecimal format.
     */
    function rgbaToHex(r, g, b, a) {
        a = Solari.utils.padZeros(parseInt(a).toString(16), 2);
        r = Solari.utils.padZeros(parseInt(r).toString(16), 2);
        g = Solari.utils.padZeros(parseInt(g).toString(16), 2);
        b = Solari.utils.padZeros(parseInt(b).toString(16), 2);

        return "#" + a + r + g + b;
    }

    /**
     * Converts rgba formatted csv values into hexadecimal.
     *
     * @param {string} rgba Color string formatted as 'rgba(0-255, 0-255, 0-255, 0-1.0)'.
     * @returns {string} String reprenting color in hexadecimal format.
     */
    function rgbaStringToHex(rgba) {
        if (rgba === undefined) {
            return undefined;
        }

        rgba = rgba.replace("rgba(", "");
        rgba = rgba.replace(")", "");
        rgba = rgba.replace(" ", "");
        rgba = rgba.split(",");

        var a = parseInt(parseFloat(rgba[3]) * 255) || 0;
        var r = parseInt(rgba[0]) || 0;
        var g = parseInt(rgba[1]) || 0;
        var b = parseInt(rgba[2]) || 0;

        return rgbaToHex(r, g, b, a);
    }

    /**
     * Draws text at specified coordinates of context.
     *
     * @param {number} x X-Axis position of text.
     * @param {number} y Y-Axis position of text.
     * @param {string} text String to draw.
     * @param {context} ctx Context to draw pattern.
     */
    function drawText(x, y, text, ctx) {
        ctx.font = "14pt Calibri";
        ctx.textAlign = "center";
        ctx.lineWidth = 1;

        ctx.shadowColor = "black";
        ctx.shadowBlur = 7;

        ctx.strokeStyle = "black";
        ctx.strokeText(text, x, y);

        ctx.fillStyle = "white";
        ctx.fillText(text, x, y);

        ctx.shadowBlur = 0;
    }

    /**
     * Draws a filled circle centered at specified location.
     *
     * @param {number} cx X-Axis center position of circle.
     * @param {number} cy Y-Axis center position of circle.
     * @param {number} radius Distance from center to edge of circle.
     * @param {string} color String representing fill color.
     * @param {context} ctx Context to draw pattern.
     */
    function drawCircle(cx, cy, radius, color, ctx) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.fill();
    }

    /**
     * Draws a circle outline at specified location.
     *
     * @param {number} cx X-Axis center position of circle.
     * @param {number} cy Y-Axis center position of circle.
     * @param {number} radius Distance from center to edge of circle.
     * @param {number} lineWidth Thickness of border.
     * @param {string} color String representing border color.
     * @param {context} ctx Context to draw pattern.
     */
    function drawOutlineCircle(cx, cy, radius, lineWidth, color, ctx) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.stroke();
    }

    /**
     * Draws a filled squared centered around location.
     *
     * @param {number} x X-Axis position of text.
     * @param {number} y Y-Axis position of text.
     * @param {number} radius Distance from center to closest edge of square.
     * @param {string} color String representing fill color.
     * @param {context} ctx Context to draw pattern.
     */
    function drawSquare(x, y, radius, color, ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    /**
     * Draws a square outline centered around location.
     *
     * @param {number} x X-Axis position of text.
     * @param {number} y Y-Axis position of text.
     * @param {number} radius Distance from center to closest edge of square.
     * @param {number} lineWidth Thickness of border.
     * @param {string} color String representing fill color.
     * @param {context} ctx Context to draw pattern.
     */
    function drawOutlineSquare(x, y, radius, lineWidth, color, ctx) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.strokeRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    /**
     * Checks if specified location on a grid is contained in a centered circle.
     *
     * @param {number} x X-Axis position of point to verify.
     * @param {number} y Y-Axis position of point to verify.
     * @param {number} cx Center X-Axis position of circle.
     * @param {number} cy Center Y-Axis position of circle.
     * @param {number} radius Distance from center to edge of circle.
     * @returns {boolean} True if position is in circle, False otherwise.
     */
    function containedInCircle(x, y, cx, cy, radius) {
        return (x - cx) * (x - cx) + (y - cy) * (y - cy) <= radius * radius;
    }

    /**
     * Checks if specified location on a grid is contained in a centered square.
     *
     * @param {number} x X-Axis position of point to verify.
     * @param {number} y Y-Axis position of point to verify.
     * @param {number} cx Center X-Axis position of square.
     * @param {number} cy Center Y-Axis position of square.
     * @param {number} radius Distance from center to edge of circle.
     * @returns {boolean} True if position is in square, False otherwise.
     */
    function containedInSquare(x, y, cx, cy, radius) {
        return (cx - radius <= x) && (cy - radius <= y) && (cx + radius >= x) && (cy + radius >= y);
    }

    /**
     * A class representing a drawn object on a 3D plane.
     *
     * @param {number} x X-Axis center position.
     * @param {number} y Y-Axis center position.
     * @param {number} z Z-Axis center position.
     * @param {number} size Distance from center to edge of shape.
     * @param {string} color Color formatted as RGBA or hexadecimal string.
     * @param {number} shape Number representing shape. 0 = Circle, 1 = Square.
     * @param {number} id Unique numerical identifier to reference this object.
     * @class
     */
    function Coordinate(x, y, z, size, color, shape, id) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
        this.size = size || 20;
        this.color = color || hexToRGBA("#AAAAAAAA");
        this.shape = shape || 0;
        this.id = id || undefined;
    }

    /**
     * Draws shape and text of this object onto a provided context.
     *
     * @param {context} ctx Context to draw pattern.
     * @param {number|undefined} ratio Optional float value to scale drawing size and position on grid.
     */
    Coordinate.prototype.draw = function (ctx, ratio) {
        if (!ratio) {
            ratio = 1;
        }

        // Draw shape
        if (this.shape === 0) {
            drawCircle(
                this.x * ratio,
                this.y * ratio,
                this.size * ratio,
                this.color,
                ctx
            );
        } else {
            drawSquare(
                this.x * ratio,
                this.y * ratio,
                this.size * ratio,
                this.color,
                ctx
            );
        }

        // Draw position identifier
        if (this.id !== undefined) {
            drawText(this.x * ratio, (this.y * ratio) + 5, this.id + 1, ctx);
        }
    };

    /**
     * Verifies if a position is within the borders of this object when drawn.
     *
     * @param {number} x X-Axis position to verify.
     * @param {number} y Y-Axis position to verify.
     * @returns {boolean} True if contained in this object's borders, False otherwise.
     */
    Coordinate.prototype.contains = function (x, y) {
        if (this.shape === 0) {
            return containedInCircle(x, y, this.x, this.y, this.size);
        } else {
            return containedInSquare(x, y, this.x, this.y, this.size);
        }
    };

    /**
     * A canvas based class to group and draw Coordinate objects.
     *
     * @param {Canvas} canvas HTML canvas object to draw coordinates.
     * @class
     */
    function CoordinateCanvas(canvas) {
        var self = this;

        self.canvas = canvas;
        self.ctx = canvas.getContext("2d");
        self.canvasUpdateTimer = null;
        self.canvasUpdateInterval = 1000 / 60;

        self.width = 0;
        self.height = 0;
        self.drawRatio = 1;

        self.valid = false;
        self.coords = [];
        self.dragging = false;
        self.selection = undefined;
        self.dragoffx = 0;
        self.dragoffy = 0;

        self.viewOffsetX = 0;
        self.viewOffsetY = 0;

        self.drawCallBack = undefined;
        self.onDoubleClickListener = undefined;
        self.onSelectListener = undefined;

        self.highlightColor = "#CC0000";
        self.highlightWidth = 2;

        self.lockTouch = false;

        canvas.addEventListener("selectstart", function (event) {
            // Prevent text highlighting
            event.preventDefault();
            return false;
        }, false);

        canvas.addEventListener("mousedown", function (event) {
            if (self.lockTouch) {
                return;
            }

            self.startUpdates();

            // Check if user selected a coordinate
            var pos = self.getMousePos(event);
            self.selection = undefined;

            var selected;
            for (var i = self.coords.length - 1; i >= 0; i--) {
                if (self.coords[i].contains(pos.x / self.drawRatio, pos.y / self.drawRatio)) {
                    self.selection = self.coords[i];

                    self.dragoffx = pos.x / self.drawRatio - self.selection.x;
                    self.dragoffy = pos.y / self.drawRatio - self.selection.y;
                    self.dragging = true;

                    selected = self.selection.id;
                }
            }

            if (self.onSelectListener) {
                self.onSelectListener(selected);
            }

            self.invalidate();
        }, true);

        canvas.addEventListener("mousemove", function (event) {
            if (self.lockTouch) {
                return;
            }

            if (self.dragging) {
                var pos = self.getMousePos(event);
                var ratio = self.drawRatio;

                self.selection.x = Math.round((pos.x / ratio) - self.dragoffx);
                self.selection.y = Math.round((pos.y / ratio) - self.dragoffy);
                self.valid = false;
            }
        }, true);

        canvas.addEventListener("mouseup", function (event) {
            if (self.lockTouch) {
                return;
            }

            self.dragging = false;
            self.stopUpdates();
        }, true);

        canvas.addEventListener("dblclick", function (event) {
            if (self.lockTouch) {
                return;
            }

            if (self.onDoubleClickListener !== null) {
                self.onDoubleClickListener(event);
            }
        }, true);

        // Perform at least one initialization pass
        self.init();
    }

    /**
     * Initializes canvas's drawable area.
     */
    CoordinateCanvas.prototype.init = function () {
        var self = this;
        var canvas = self.canvas;

        this.setDimensions(canvas.width, canvas.height);

        // Account for border or padding
        if (document.defaultView && document.defaultView.getComputedStyle) {
            self.viewOffsetX += parseInt(document.defaultView.getComputedStyle(canvas, null).paddingLeft) || 0;
            self.viewOffsetX += parseInt(document.defaultView.getComputedStyle(canvas, null).borderLeftWidth) || 0;

            self.viewOffsetY += parseInt(document.defaultView.getComputedStyle(canvas, null).paddingTop) || 0;
            self.viewOffsetY += parseInt(document.defaultView.getComputedStyle(canvas, null).borderTopWidth) || 0;
        }

        // Account for fixed position bars
        var html = document.body.parentNode;
        self.viewOffsetX += parseInt(html.offsetLeft) || 0;
        self.viewOffsetY += parseInt(html.offsetTop) || 0;

        self.stopUpdates();
    };

    /**
     * Prevents interaction with canvas's coordinates.
     */
    CoordinateCanvas.prototype.lock = function () {
        this.lockTouch = true;
    };

    /**
     * Enables interaction with canvas's coordinates.
     */
    CoordinateCanvas.prototype.unlock = function () {
        this.lockTouch = false;
    };

    /**
     * Resizes canvas's drawable area.
     *
     * @param {number} width Horizontal size of canvas in pixels.
     * @param {number} height Vertical size of canvas in pixels.
     */
    CoordinateCanvas.prototype.setDimensions = function (width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
    };

    /**
     * Sets a function to act as a listener for each draw pass.
     *
     * @param {function} callback Called function on each draw iteration.
     */
    CoordinateCanvas.prototype.setDrawCallback = function (callback) {
        this.drawCallBack = callback;
    };

    /**
     * Sets a function to act as a double click listener.
     *
     * @param {function} callback Called function when double click event occurs.
     */
    CoordinateCanvas.prototype.setOnDoubleClickListener = function (callback) {
        this.onDoubleClickListener = callback;
    };

    /**
     * Sets a function to act as a coordinate clicked listener.
     *
     * @param {function} callback Called function when click on canvas occurs.
     */
    CoordinateCanvas.prototype.setOnSelectListener = function (callback) {
        this.onSelectListener = callback;
    };

    /**
     * Starts internal timer for canvas to draw at regular interval.
     */
    CoordinateCanvas.prototype.startUpdates = function () {
        var self = this;

        if (self.canvasUpdateTimer === null) {
            self.valid = false;
            self.canvasUpdateTimer = setInterval(function () {
                self.draw();
            }, self.canvasUpdateInterval);
        }
    };

    /**
     * Stops internal timer causing canvas to draw at regular interval.
     */
    CoordinateCanvas.prototype.stopUpdates = function () {
        var self = this;

        if (self.canvasUpdateTimer !== null) {
            // Delay 100ms to account for potential pending draw
            setTimeout(function () {
                clearInterval(self.canvasUpdateTimer);
                self.canvasUpdateTimer = null;
            }, 100);
        }
    };

    /**
     * Updates canvas to indicate if a coordinate is selected or deselected.
     *
     * @param {number} index Identifier of coordinate selected.
     * @param {boolean} ignoreId Use position of coordinate in group rather than unique identifier.
     */
    CoordinateCanvas.prototype.selectCoordinate = function (index, ignoreId) {
        var selected;
        if (ignoreId === true) {
            if (index > -1 && index < this.coords.length) {
                this.selection = this.coords[index];
                selected = index;
            } else {
                this.selection = undefined;
            }
        } else {
            for (var i = 0; i < this.coords.length; i++) {
                var coord = this.coords[i];
                if (coord.id === index) {
                    this.selection = coord;
                    selected = coord.id;
                    break;
                }
            }

            if (selected === undefined) {
                this.selection = undefined;
            }
        }

        if (this.onSelectListener) {
            this.onSelectListener(selected);
        }

        this.invalidate();
    };

    /**
     * Adds a new Coordinate to group.
     *
     * @param {Coordinate} coordinate Coordinate object to add to canvas.
     * @param {number} position Index of postion to add coordinate in group.
     * @param {boolean} strictPositioning Whether to update existing identifiers of objects to new position in group.
     */
    CoordinateCanvas.prototype.addCoordinate = function (coordinate, position, strictPositioning) {
        if (position) {
            var maxCoord = this.coords.length;
            position = position < 0 ? 0 : position;

            if (strictPositioning) {
                position = position > maxCoord ? maxCoord : position;

                for (var i = position; i < maxCoord; i++) {
                    this.coords[i].id = i + 1;
                }
            }
        } else {
            position = this.coords.length;
        }
        coordinate.id = (strictPositioning || coordinate.id === undefined) ? position : coordinate.id;
        this.coords.splice(position, 0, coordinate);
        this.invalidate();
    };

    /**
     * Removes a Coordinate from the group.
     *
     * @param {number} index Identifier of coordinate to remove
     * @param {boolean} ignoreId Whether to use position in group instead of saved identifier.
     * @param {boolean} ignoreDeselect Whether to ignore deselect if selected coordinate is removed.
     */
    CoordinateCanvas.prototype.removeCoordinate = function (index, ignoreId, ignoreDeselect) {
        var selected;
        if (ignoreId === true) {
            if (index > -1 && index < this.coords.length) {
                selected = index;
                this.coords.splice(index, 1);
            }
        } else {
            for (var i = 0; i < this.coords.length; i++) {
                var id = this.coords[i].id;
                if (id === index) {
                    selected = id;
                    this.coords.splice(i, 1);
                    break;
                }
            }
        }

        if (selected !== undefined) {
            this.selection = undefined;

            if (ignoreDeselect !== true) {
                this.selectCoordinate(undefined);
            }
        }

        this.invalidate();
    };

    /**
     * Removes all coordinates and resets selection.
     */
    CoordinateCanvas.prototype.reset = function () {
        this.selectCoordinate(undefined);
        this.coords.length = 0;
        this.invalidate();
    };

    /**
     * Finds grid position where mouse event was generated.
     *
     * @param {event} event Event generated by interaction with element.
     * @returns {{x: number, y: number}} X and Y axis positions of event on grid.
     */
    CoordinateCanvas.prototype.getMousePos = function (event) {
        var canvas = this.canvas;
        var offsetX = 0;
        var offsetY = 0;

        if (canvas.offsetParent !== undefined) {
            while ((canvas = canvas.offsetParent)) {
                offsetX += canvas.offsetLeft;
                offsetY += canvas.offsetTop;
            }
        }

        offsetX += this.viewOffsetX;
        offsetY += this.viewOffsetY;

        return {x: event.pageX - offsetX, y: event.pageY - offsetY};
    };

    /**
     * Forces redraw of canvas.
     */
    CoordinateCanvas.prototype.invalidate = function () {
        this.valid = false;
        this.draw();
    };

    /**
     * Removes all drawings from canvas.
     */
    CoordinateCanvas.prototype.clear = function () {
        this.ctx.clearRect(0, 0, this.width, this.height);
    };

    /**
     * Draws all Coordinates onto canvas if current rendering is invalid.
     *
     * This function draws the selected Coordinate last. All other Coordinates are drawn from beginning to eng.
     */
    CoordinateCanvas.prototype.draw = function () {
        if (!this.valid) {
            var ctx = this.ctx;
            var coords = this.coords;
            var sel = this.selection;
            var ratio = this.drawRatio;

            // Draw coordinates except user selection
            this.clear();
            for (var i = 0; i < coords.length; i++) {
                var coord = coords[i];
                if (sel === undefined || sel !== coord) {
                    // TODO skip out of bounds coordinates
                    coord.draw(ctx, ratio);
                }
            }

            // Draw user selection last to always bring to front with outline
            if (sel !== undefined) {
                sel.draw(ctx, ratio);

                ctx.strokeStyle = this.highlightColor;
                ctx.lineWidth = this.highlightWidth;

                if (sel.shape === 0) {
                    drawOutlineCircle(sel.x * ratio, sel.y * ratio, sel.size * ratio, 2, this.highlightColor, ctx);
                } else {
                    drawOutlineSquare(sel.x * ratio, sel.y * ratio, sel.size * ratio, this.highlightWidth, this.highlightColor, ctx);
                }
            }

            this.valid = true;

            if (this.drawCallBack) {
                this.drawCallBack();
            }
        }
    };

    // Public functions
    Ui.onSelectFiles = onSelectFiles;
    Ui.onDragHover = onDragHover;
    Ui.Coordinate = Coordinate;
    Ui.CoordinateCanvas = CoordinateCanvas;
    Ui.hexToRGBA = hexToRGBA;
    Ui.rgbaToHex = rgbaToHex;
    Ui.rgbaStringToHex = rgbaStringToHex;

    return parent;
}(Solari || {}));
