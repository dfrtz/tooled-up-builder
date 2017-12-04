angular.module('tooledUpBuilder').factory('MainData', function() {
    var self = this;

    function init() {
        self.cpak.imageWorkerPool.cacheEnabled = true;
        self.xpak.imageWorkerPool.cacheEnabled = true;
    }

    self.cpak = {
        zipFile: new JSZip(),
        packData: new CardPack(),
        prettyPrintSave: true,

        originalName: undefined,
        imageCache: [],
        imageWorkerPool: new Solari.utils.WorkerPool({threads: 1}),
        bannerData: "./images/promo.jpg",
        formPack: undefined,
        formCards: undefined,

        lastXpakSplitValues: []
    };

    self.xpak = {
        zipFile: new JSZip(),
        packData: new ExpansionPack(),
        prettyPrintSave: true,

        originalName: undefined,
        imageCache: [],
        imageWorkerPool: new Solari.utils.WorkerPool({threads: 1}),
        bannerData: "./images/promo.jpg",
        formPack: undefined
    };

    self.apak = {
        zipFile: new JSZip(),
        packData: new AllInOnePack(),
        prettyPrintSave: true,

        originalName: undefined,
        bannerData: "./images/promo.jpg",
        formPack: undefined
    };

    self.getPack = function(type) {
        switch(type) {
            case 'cpak': {
                return self.cpak;
            }
            case 'xpak': {
                return self.xpak;
            }
            case 'apak': {
                return self.apak;
            }
        }
    };

    self.preprocessCpak = function(pack, cardValues) {
        // Duplicate input JSON to prevent modification of original
        var newPack = new CardPack();
        newPack.readObject(pack);

        // Split id into ID and Revision
        Solari.utils.sortArray(newPack.cards, "id");
        newPack.splitCardIds();

        // Split Version "values" to "valuesGroup", do not remove in case of re-processing
        newPack.splitCardValues(cardValues);

        // Cleanup and add defaults
        for (var i = 0; i < newPack.cards.length; i++) {
            var card = newPack.cards[i];

            // Remove id, it should be split into idGroup
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

    self.postprocessCpak = function(pack, cardValues) {
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

    self.preprocessXpak = function(pack) {
        // Duplicate input JSON to prevent modification of original
        var newPack = new ExpansionPack();
        newPack.readObject(pack);

        //TODO Add default values

        return newPack;
    };

    self.postprocessXpak = function(pack) {
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

    self.preprocessApak = function(pack) {
        // Duplicate input JSON to prevent modification of original
        var newPack = new AllInOnePack();
        newPack.readObject(pack);

        //TODO Add default values

        return newPack;
    };

    self.postprocessApak = function(pack) {
        // Duplicate input JSON to prevent modification of original
        var newPack = new AllInOnePack();
        newPack.readObject(pack);

        //TODO Remove default values

        // Remove all empty values
        Solari.json.clean(newPack);

        return newPack;
    };

    self.getImageByIndex = function(pack, index, $scope) {
        var image = pack.imageCache[index];

        if (image && !image.data) {
            // Lazy load image data, it was not found in cache or pending load
            if (image.data === undefined || image.data === null) {
                if (pack.imageWorkerPool.cacheData === undefined && !pack.imageWorkerPool.cacheInitializing) {
                    // Manually set initialization flag before async work starts
                    pack.imageWorkerPool.cacheInitializing = true;
                    pack.imageWorkerPool.setCallback(function onMessage(event) {
                        var cmd = event.data.cmdResult;

                        var image = self.getImageByName(pack, event.data.name, $scope);
                        image.data = event.data.data;
                        $scope.$apply();
                    });

                    pack.zipFile.generateAsync({type: "arraybuffer"})
                    .then(function(content) {
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

    self.getImageByName = function(pack, name, $scope) {
        var index;

        for (var i = 0; i < pack.imageCache.length; i++) {
            if (pack.imageCache[i].path === name) {
                index = i;
                break;
            }
        }

        return self.getImageByIndex(pack, index, $scope);
    };

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
                self.postMessage({cmdResult: 'initCache'});
            }, function error(e){});
            return;
        }
    };

    init();

    return self;
});