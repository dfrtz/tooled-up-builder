/**
 * @file Tooled Up - Builder app factory containing shared objects between controllers.
 *
 * @author David Fritz
 * @version 1.0.0
 *
 * @copyright 2015-2017 David Fritz
 * @license MIT
 */
angular.module("tooledUpBuilder").factory("MainData", MainData);

function MainData() {
    var self = this;

    /**
     * @type {object} cpak Set of Cpak related data.
     * {JSZip} cpak.zipFile Zip file containing packaged information that can be saved to host.
     * {CardPack} cpak.packData Data object containing information that can be converted to text config file.
     * {boolean} cpak.prettyPrintSave Whether to save the JSON files with pretty print.
     * {String} cpak.originalName Most recent name of pack to track changes.
     * {Image[]} cpak.imageCache Array of Images that can be reused.
     * {WorkerPool} cpak.imageWorkerPool Multi-threaded WorkerPool used to load images into cache.
     * {String} cpak.bannerData Path or data that can be loading into DOM backgrounds.
     * {object} cpak.formPack Schema information to build dynamic form for pack summary fields.
     * {object} cpak.formCards Schema information to build dynamic form for Card fields.
     * {CardValues[]} cpak.lastXpakSplitValues Array of CardValues that were last used to split every Card's values
     */
    self.cpak = {
        zipFile: new JSZip(),
        packData: new CardPack(),
        prettyPrintSave: true,

        originalName: undefined,
        imageCache: [],
        imageWorkerPool: new Solari.utils.WorkerPool({threads: 1}),
        bannerData: "images/promo.jpg",
        formPack: undefined,
        formCards: undefined,

        lastXpakSplitValues: []
    };

    /**
     * @type {object} xpak Set of Xpak related data.
     * {JSZip} xpak.zipFile Zip file containing packaged information that can be saved to host.
     * {ExpansionPack} xpak.packData Data object containing information that can be converted to text config file.
     * {boolean} xpak.prettyPrintSave Whether to save the JSON files with pretty print.
     * {String} xpak.originalName Most recent name of pack to track changes.
     * {Image[]} xpak.imageCache Array of Images that can be reused.
     * {WorkerPool} xpak.imageWorkerPool Multi-threaded WorkerPool used to load images into cache.
     * {String} xpak.bannerData Path or data that can be loading into DOM backgrounds.
     * {object} xpak.formPack Schema information to build dynamic form for pack summary fields.
     */
    self.xpak = {
        zipFile: new JSZip(),
        packData: new ExpansionPack(),
        prettyPrintSave: true,

        originalName: undefined,
        imageCache: [],
        imageWorkerPool: new Solari.utils.WorkerPool({threads: 1}),
        bannerData: "images/promo.jpg",
        formPack: undefined
    };

    /**
     * @type {object} apak Set of Apak related data.
     * {JSZip} apak.zipFile Zip file containing packaged information that can be saved to host.
     * {AllInOnePack} apak.packData Data object containing information that can be converted to text config file.
     * {boolean} apak.prettyPrintSave Whether to save the JSON files with pretty print.
     * {String} apak.originalName Most recent name of pack to track changes.
     * {String} apak.bannerData Path or data that can be loading into DOM backgrounds.
     * {object} apak.formPack Schema information to build dynamic form for pack summary fields.
     */
    self.apak = {
        zipFile: new JSZip(),
        packData: new AllInOnePack(),
        prettyPrintSave: true,

        originalName: undefined,
        bannerData: "images/promo.jpg",
        formPack: undefined
    };

    /**
     * @type {object} ImageWorkerCallbacks Set of callback methods for image workers in a pool.
     * {method} ImageWorkerCallbacks.run Method to be used by all image work threads,
     * {method} ImageWorkerCallbacks.initCache Method to be used by WorkerPool on cache initialization
     */
    self.ImageWorkerCallbacks = {
        run: function run(data) {
            var path = data.path;

            if (self.cache !== undefined) {
                self.cache.file(path)
                    .async("base64")
                    .then(function (content) {
                        self.postMessage({cmdResult: data.cmd, name: path, data: content});
                    });
            }
        },
        initCache: function initCache(cache) {
            JSZip.loadAsync(cache)
                .then(function succcess(zip) {
                    self.cache = zip;
                    self.postMessage({cmdResult: "initCache"});
                }, function error(error) {
                });
        }
    };

    /**
     * Initializes factory by executing first run operations.
     *
     * Must be called at end of assignments.
     */
    function init() {
        self.cpak.imageWorkerPool.cacheEnabled = true;
        self.xpak.imageWorkerPool.cacheEnabled = true;
    }

    /**
     * Returns a requested pack type for direct access by controllers.
     *
     * @param {string} type Name of pack to return.
     * @returns {(CardPack|ExpansionPack|AllInOnePack)} Requested data pack.
     */
    self.getPack = function (type) {
        switch (type) {
            case "cpak": {
                return self.cpak;
            }
            case "xpak": {
                return self.xpak;
            }
            case "apak": {
                return self.apak;
            }
        }
    };

    /**
     * Performs evaluation processes on a CardPack's json data to convert fields into form formats.
     *
     * @param {object} pack Data object representing a CardPack which can be read by Tooled Up.
     * @param {CardValue[]} cardValues Array of CardValues to use when splitting card value groups.
     * @returns {CardPack} Formatted CardPack to display in forms.
     */
    self.preprocessCpak = function (pack, cardValues) {
        // Duplicate input JSON to prevent modification of original
        var newPack = new CardPack();
        newPack.readObject(pack);

        Solari.utils.sortArray(newPack.cards, "id");
        newPack.splitCardIds();
        newPack.splitCardValues(cardValues);

        // Cleanup and add defaults to Cards
        for (var i = 0; i < newPack.cards.length; i++) {
            var card = newPack.cards[i];

            // Remove id, it should have been split into idGroup
            if (card.id !== undefined) {
                delete card.id;
            }

            // Set defaults that should populate form
            if (card.landscape === undefined) {
                card.landscape = false;
            }
        }

        return newPack;
    };

    /**
     * Formats CardPack data into suitable format that can be saved as a text file to be read by Tooled Up app.
     *
     * @param {CardPack} pack CardPack that has been preprocessed.
     * @param {CardValue[]} cardValues CardValues to use when merging card idGroups.
     * @returns {CardPack} Formatted CardPack which can be saved and read by Tooled Up app.
     */
    self.postprocessCpak = function (pack, cardValues) {
        // Duplicate input JSON to prevent modification of original
        var newPack = new CardPack();
        newPack.readObject(pack);

        // Merge ID and Revision into id, and update order
        // Note: CardPack.sortCards is not used since it re-splits ids
        newPack.mergeCardIds();
        Solari.utils.sortArray(newPack.cards, "id");

        // Merge Versions "valuesGroup" to "values"
        newPack.mergeCardValues(cardValues);

        // Reorganize variables to ensure prioritized loading order
        newPack.organizeVariables();
        newPack.organizeCardVariables();

        // Iterate over every card to perform final cleanup
        for (var i = 0; i < newPack.cards.length; i++) {
            var card = newPack.cards[i];

            // TODO Remove all default and temporary values from card base
            if (card.idGroup) {
                delete card.idGroup;
            }
            if (!card.landscape) {
                delete card.landscape;
            }

            // Remove all default and temporary values from each version
            if (card.versions) {
                for (var ii = 0; ii < card.length; ii++) {
                    var version = card.versions[ii];

                    if (version.valuesGroup) {
                        delete version.valuesGroup;
                    }
                }
            }
        }

        // Remove all empty values
        Solari.json.clean(newPack);

        return newPack;
    };

    /**
     * Performs evaluation processes on an ExpansionPack's json data to convert fields into form formats.
     *
     * @param {object} pack Data object representing an ExpansionPack which can be read by Tooled Up.
     * @returns {ExpansionPack} Formatted ExpansionPack to display in forms.
     */
    self.preprocessXpak = function (pack) {
        // Duplicate input JSON to prevent modification of original
        var newPack = new ExpansionPack();
        newPack.readObject(pack);

        //TODO Add default values

        return newPack;
    };

    /**
     * Formats ExpansionPack data into suitable format that can be saved as a text file to be read by Tooled Up app.
     *
     * @param {ExpansionPack} pack ExpansionPack that has been preprocessed.
     * @returns {ExpansionPack} Formatted ExpansionPack which can be saved and read by Tooled Up app.
     */
    self.postprocessXpak = function (pack) {
        // Duplicate input JSON to prevent modification of original
        var newPack = new ExpansionPack();
        newPack.readObject(pack);

        // Reorganize variables to ensure prioritized loading order
        newPack.organizeVariables();

        //TODO Remove default values

        // Remove all empty values
        Solari.json.clean(newPack);

        return newPack;
    };

    /**
     * Performs evaluation processes on an AllInOnePack's json data to convert fields into form formats.
     *
     * @param {object} pack Data object representing an AllInOnePack which can be read by Tooled Up.
     * @returns {ExpansionPack} Formatted ExpansionPack to display in forms.
     */
    self.preprocessApak = function (pack) {
        // Duplicate input JSON to prevent modification of original
        var newPack = new AllInOnePack();
        newPack.readObject(pack);

        //TODO Add default values

        return newPack;
    };

    /**
     * Formats AllInOnePack data into suitable format that can be saved as a text file to be read by Tooled Up app.
     *
     * @param {AllInOnePack} pack AllInOnePack that has been preprocessed.
     * @returns {AllInOnePack} Formatted AllInOnePack which can be saved and read by Tooled Up app.
     */
    self.postprocessApak = function (pack) {
        // Duplicate input JSON to prevent modification of original
        var newPack = new AllInOnePack();
        newPack.readObject(pack);

        //TODO Remove default values

        // Remove all empty values
        Solari.json.clean(newPack);

        return newPack;
    };

    /**
     * Retrieves image from a data pack image cache and notifies controller's scope on completion.
     *
     * This method will lazy load images as they are requested. First request will always load image, and subsequent
     * loads will retrieve from cache.
     *
     * @param {(CardPack|ExpansionPack)} pack Data pack with imageCache.
     * @param {number} index Position of image in data pack's imageCache.
     * @param {object} $scope Controller scope to notify on successful load.
     * @returns {Image} Data representing an image.
     */
    self.getImageByIndex = function (pack, index, $scope) {
        var image = pack.imageCache[index];

        if (image && !image.data) {
            // Lazy load image data, it was not found in cache or pending load
            if (image.data === undefined || image.data === null) {
                if (pack.imageWorkerPool.cacheData === undefined && !pack.imageWorkerPool.cacheInitializing) {
                    // Manually set initialization flag before async work starts
                    pack.imageWorkerPool.cacheInitializing = true;
                    pack.imageWorkerPool.setCallback(function onMessage(event) {
                        var image = self.getImageByName(pack, event.data.name, $scope);
                        image.data = event.data.data;
                        $scope.$apply();
                    });

                    pack.zipFile.generateAsync({type: "arraybuffer"})
                        .then(function (content) {
                            pack.imageWorkerPool.initCache(content);
                            self.getImageByIndex(pack, index, $scope);
                        });
                } else {
                    if (image.data !== "#") {
                        image.data = "#";
                        pack.imageWorkerPool.run({path: image.path});
                    }
                }
            }
        }

        return image;
    };

    /**
     * Retrieves image from a data pack image cache and notifies controller's scope on completion.
     *
     * @param {(CardPack|ExpansionPack)} pack Data pack with imageCache.
     * @param {String} name Absolute path representing image in cache.
     * @param {object} $scope Controller scope to notify on successful load.
     * @returns {Image} Data representing an image.
     */
    self.getImageByName = function (pack, name, $scope) {
        var index;

        for (var i = 0; i < pack.imageCache.length; i++) {
            if (pack.imageCache[i].path === name) {
                index = i;
                break;
            }
        }

        return self.getImageByIndex(pack, index, $scope);
    };

    init();

    return self;
}