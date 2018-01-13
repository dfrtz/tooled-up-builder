/**
 * @file Primary Tooled Up - Builder app controller. All additional controllers should be nested inside this controller.
 *
 * @author David Fritz
 * @version 1.0.0
 *
 * @copyright 2015-2017 David Fritz
 * @license MIT
 */
angular.module("tooledUpBuilder").controller("TubCtrl", ["MainData", "$window", "$scope", "$http", "$mdColors", "$mdDialog", "$mdToast", "$mdSidenav", TubCtrl]);

function TubCtrl(MainData, $window, $scope, $http, $mdColors, $mdDialog, $mdToast, $mdSidenav) {
    var self = this;

    self.selections = {
        page: 0
    };
    self.pageShortcuts = [
        {name: "Guild Ball", data: "schema/generic.schema"}
    ];
    self.pages = [
        {title: "Card Packs", icon: "home"},
        {title: "Expansions", icon: "videogame_asset"},
        {title: "All-In-One", icon: "work"}
    ];

    $scope.decorator = "bootstrap-decorator";

    /**
     * Initializes controller by executing first run operations.
     *
     * Must be called at end of assignments.
     */
    function init() {
        if (window.Worker) {
            console.log("Web Worker support detected. Multithreading enabled.");
        } else {
            console.log("Web Workers are not supported by your browser. Try with the latest Google Chrome: <a href=\"https://www.google.com/chrome/\">Google Chrome Download</a>");
        }

        $http({
            //TODO Non request way to load this library into worker pools
            url: "vendor/jszip/3.1.3/jszip.min.js",
            dataType: "json",
            method: "GET",
            data: "",
            headers: {
                "Content-Type": "application/text"
            }
        }).success(function (response) {
            MainData.cpak.imageWorkerPool.setScripts(MainData.ImageWorkerCallbacks.run,
                MainData.ImageWorkerCallbacks.initCache, response);
            MainData.xpak.imageWorkerPool.setScripts(MainData.ImageWorkerCallbacks.run,
                MainData.ImageWorkerCallbacks.initCache, response);
        });
    }

    /**
     * Toggles navigation drawer and calls listening functions.
     *
     * @param {string} side Directional representation of the Drawer that was toggled. Left or Right.
     */
    self.onToggleDrawer = function (side) {
        $mdSidenav(side)
            .toggle()
            .then(function () {
            });
    };

    /**
     * Closes the navigation drawer and selects corresponding tab from shortcut list.
     *
     * @param {number} page Index of the selected page from shortcut menu.
     */
    self.onLoadPage = function (page) {
        self.onToggleDrawer("left");
        $scope.onSelectTab(page);
    };

    /**
     * Creates and displays the About section of the application.
     */
    self.onShowAbout = function () {
        function DialogController($scope, $mdDialog) {
            $scope.hide = function () {
                $mdDialog.hide();
            };

            $scope.cancel = function () {
                $mdDialog.cancel();
            };

            $scope.answer = function (answer) {
                $mdDialog.hide(answer);
            };
        }

        self.onToggleDrawer("left");
        $mdDialog.show({
            controller: DialogController,
            templateUrl: "app/templates/template_dialog_about.html",
            targetEvent: event,
            clickOutsideToClose: true
        });
    };

    /**
     * Updates the selected tab for user navigation feedback.
     *
     * @param {number} page Index of the page to mark as selected.
     */
    $scope.onSelectTab = function (page) {
        page = page < 0 ? 0 : page > self.pages.length - 1 ? self.pages.length - 1 : page;
        self.selections.page = page;
    };

    /**
     * Opens a link in a new window/tab.
     *
     * @param {string} href Hypertext reference to a new web page.
     */
    $scope.onLoadLink = function (href) {
        $window.open(href);
    };

    /**
     * Dumps schema form errors to console.
     *
     * @param {Array} errors Array of angular schema form errors.
     */
    $scope.listErrors = function (errors) {
        var messages = [];

        for (var key in errors) {
            for (var i = 0; i < errors[key].length; i++) {
                messages.push(errors[key][i].$name + " is required.");
            }
        }

        console.log(errors);
        console.log(messages);
    };

    /**
     * Simulates a mouse click on an HTML element by id.
     *
     * @param {string} id Unique identifier of an HTML element.
     */
    $scope.onClick = function (id) {
        document.getElementById(id).dispatchEvent(new MouseEvent("click"));
    };

    /**
     * Displays a quick information popup message on bottom right of the screen.
     *
     * @param {string} message Text to display.
     */
    $scope.simpleToast = function (message) {
        var toast = $mdToast.simple()
            .textContent(message)
            .highlightAction(true)
            .highlightClass("md-accent")
            .position("bottom right")
            .hideDelay(3000);
        $mdToast.show(toast);
    };

    // Expose methods to DOM
    $scope.getThemeColor = $mdColors.getThemeColor;
    $scope.range = function (count) {
        return Solari.utils.range(count);
    };
    $scope.getFileName = function (name) {
        return Solari.file.getName(name);
    };
    $scope.getFileExtension = function (name) {
        return Solari.file.getExtension(name);
    };

    init();
}