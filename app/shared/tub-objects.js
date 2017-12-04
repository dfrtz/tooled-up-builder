/**
 * @file Tooled Up - Builder app shared libraries and objects.
 *
 * @author David Fritz
 * @version 1.0.0
 *
 * @copyright 2015-2017 David Fritz
 * @license MIT
 */

function Card() {
    this.idGroup = {
        id: 0,
        revision: 0
    };
    this.id = 0;
    this.title = undefined;
    this.subtitle = undefined;
    this.legacy = undefined;
    this.groups = undefined;
    this.private = undefined;
    this.landscape = false;
    this.content = [];
    this.versions = [];
}

Card.prototype.readObject = function(object) {
    this.idGroup = object.idGroup || {};
    this.id = object.id;
    this.title = object.title;
    this.subtitle = object.subtitle;
    this.legacy = object.legacy;
    this.groups = object.groups;
    this.private = object.private;
    this.landscape = object.landscape;
    this.content = object.content || [];
    this.versions = object.versions || [];

    for (var i = 0; i < this.versions.length; i++) {
        if (!this.versions[i].hitboxes) {
            this.versions[i].hitboxes = [];
        }
    }
};

Card.prototype.splitId = function() {
    if (this.id === undefined) {
        return;
    }

    var state = this;
    this.idGroup = {
        id: Math.floor(state.id / 10000),
        revision: state.id % 10000
    };
};

Card.prototype.mergeId = function(cards) {
    if (!this.idGroup || (this.idGroup.id === undefined && this.idGroup.revision === undefined)) {
        return;
    }

    this.id = parseInt((this.idGroup.id || 0) + '' + this.padRevision(this.idGroup.revision));
};

Card.prototype.padRevision = function(revision) {
    var s = "0000" + (revision || '');
    return s.substr(s.length - 4);
};

Card.prototype.splitVersionValues = function(categories) {
    if (!categories || categories.length === 0) {
        return;
    }

    for (var i = 0; i < this.versions.length; i++) {
        var version = this.versions[i];
        if (!version.values) {
            continue;
        }
        var values = version.values.split(',');

        version.valuesGroup = {};
        for (var ii = 0; ii < categories.length; ii++) {
            var xpakValue = categories[ii];
            var value = values[ii];

            if (value) {
                value = xpakValue.type === "Text" ? value.toString() : (isNaN(parseInt(value)) ? 0 : parseInt(value));
                version.valuesGroup[xpakValue.title] = value;
            } else {
                version.valuesGroup[xpakValue.title] = '';
            }
        }
    }
};

Card.prototype.mergeVersionValues = function(categories) {
    if (!categories || categories.length === 0) {
        return;
    }

    for (var i = 0; i < this.versions.length; i++) {
        var version = this.versions[i];

        if (!version.valuesGroup) {
            continue;
        }

        var values = "";
        for (var ii = 0; ii < categories.length; ii++) {
            var xpakValue = categories[ii];
            var value = version.valuesGroup[xpakValue.title];

            if (value !== undefined) {
                values += ('' + value);
            }
            if (ii < categories.length - 1) {
                values += ',';
            }
        }

        if (values !== "") {
            version.values = values.replace(/(^\s*)|(,*\s*$)/g, '');
        } else {
            delete version.values;
        }
    }
};

Card.prototype.organizeVariables = function() {
    var oldCard = this;

    // Recreate card with new order
    var newCard = new Card();
    newCard.readObject(oldCard);

    // Versions need to be sorted
    if (newCard.versions) {
        for (var ii = 0; ii < newCard.versions.length; ii++) {
            var oldVersion = newCard.versions[ii];
            var newVersion = {
                title: oldVersion.title,
                values: oldVersion.values,
                hitboxes: oldVersion.hitboxes
            };

            // Hitboxes need to be sorted
            if (newVersion.hitboxes) {
                for (var iii = 0; iii < newVersion.hitboxes.length; iii++) {
                    var oldHitbox = newVersion.hitboxes[iii];
                    var newHitBox = {
                        title: oldHitbox.title,
                        color: oldHitbox.color,
                        defaultX: oldHitbox.defaultX,
                        defaultY: oldHitbox.defaultY,
                        defaultZ: oldHitbox.defaultZ,
                        defaultSize: oldHitbox.defaultSize,
                        values: oldHitbox.values
                    };

                    // Push new version into place of old version
                    newVersion.hitboxes[iii] = newHitBox;
                }
            }

            // Push new version into place of old version
            newCard.versions[ii] = newVersion;
        }
    }

    return newCard;
};


function CardPack() {
    this.set = undefined;
    this.title = undefined;
    this.version = 0;
    this.group = undefined;
    this.description = undefined;
    this.compatibility = undefined;
    this.theme = {};
    this.cards = [];
}

CardPack.prototype.readObject = function(object) {
    var newPack = Solari.json.duplicate(object, this.reviver);

    this.set = newPack.set;
    this.title = newPack.title;
    this.version = newPack.version || 0;
    this.group = newPack.group;
    this.description = newPack.description;
    this.compatibility = newPack.compatibility;
    this.theme = newPack.theme || {};
    this.cards = newPack.cards || [];
};

CardPack.prototype.reviver = function(key, value) {
    if (key === 'cards') {
        var cards = [];
        for (var i = 0; i < value.length; i++) {
            var card = new Card();

            card.readObject(value[i]);
            cards.push(card);
        }

        return cards;
    }

    return value;
};

CardPack.prototype.duplicate = function() {
    var newPack = new CardPack();
    newPack.readObject(this);
    return newPack;
};

CardPack.prototype.splitCardIds = function() {
    for (var i = 0; i < this.cards.length; i++) {
        this.cards[i].splitId();
    }
};

CardPack.prototype.mergeCardIds = function() {
    for (var i = 0; i < this.cards.length; i++) {
        this.cards[i].mergeId();
    }
};

CardPack.prototype.sortCards = function() {
    this.mergeCardIds();
    Solari.utils.sortArray(this.cards, "id");
    this.splitCardIds();
};

CardPack.prototype.splitCardValues = function(categories) {
    for (var i = 0; i < this.cards.length; i++) {
        this.cards[i].splitVersionValues(categories);
    }
};

CardPack.prototype.mergeCardValues = function(categories) {
    for (var i = 0; i < this.cards.length; i++) {
        this.cards[i].mergeVersionValues(categories);
    }
};

CardPack.prototype.organizeVariables = function(json) {
    //TODO
};

CardPack.prototype.organizeCardVariables = function() {
    for (var i = 0; i < this.cards.length; i++) {
        // Push new card into place of old card
        this.cards[i] = this.cards[i].organizeVariables();
    }
};

CardPack.prototype.validate = function() {
    // TODO Check for duplicate IDs
    // TODO Check for missing Images
    // TODO Any other checks that should be performed oustide standard schema

    return true;
};

function ExpansionPack() {
    this.set = undefined;
    this.title = undefined;
    this.version = 0;
    this.description = undefined;
    this.categories = [];
    this.cardValues = [];
    this.titles = {
        cardStacks: []
    };
    this.subtitles = {
        card: undefined,
        cardShort: undefined,
        cardStack: undefined,
        deck: undefined
    };
    this.clocks = [];
    this.scores = [];
    this.actions = [];
}

ExpansionPack.prototype.readObject = function(object) {
    var newPack = Solari.json.duplicate(object, this.reviver);

    this.set = newPack.set;
    this.title = newPack.title;
    this.version = newPack.version || 0;
    this.description = newPack.description;
    this.categories = newPack.categories || [];
    this.cardValues = newPack.cardValues || [];
    this.titles = newPack.titles || {
        cardStacks: []
    };
    this.subtitles = newPack.subtitles || {
        card: undefined,
        cardShort: undefined,
        cardStack: undefined,
        deck: undefined
    };
    this.clocks = newPack.clocks || [];
    this.scores = newPack.scores || [];
    this.actions = newPack.actions || [];
};

ExpansionPack.prototype.reviver = function(key, value) {
    //TODO Check required objects

    return value;
};

ExpansionPack.prototype.duplicate = function() {
    var newPack = new ExpansionPack();
    newPack.readObject(this);
    return newPack;
};

ExpansionPack.prototype.organizeVariables = function() {
    //TODO
};

ExpansionPack.prototype.validate = function() {
    // TODO Check for missing Images
    // TODO Any other checks that should be performed oustide standard schema

    return true;
};

ExpansionPack.prototype.parseValueGroupForm = function() {
    function Row() {
        this.type = "section";
        this.htmlClass = "row";
        this.items = [];
    }

    function Item() {
        this.key = "versions[].valuesGroup.";
        this.title = "";
        this.htmlClass = "col-xs-3";
    }

    var rows = [];
    var row = new Row();

    for (var i = 0; i < this.cardValues.length; i++) {
        var item = new Item();
        item.key += this.cardValues[i].title;
        item.title = this.cardValues[i].title;

        row.items.push(item);

        if (row.items.length === 4 || i === this.cardValues.length - 1) {
            rows.push(row);
            row = new Row();
        }
    }

    return rows;
};

ExpansionPack.prototype.parseValueGroupSchema = function() {
    var properties = {};

    for (var i = 0; i < this.cardValues.length; i++) {
        var property = {};

        property.type = this.cardValues[i].type === "Text" ? "string" : "integer";

        properties[this.cardValues[i].title] = property;
    }

    return properties;
};

function CardValue() {
    this.title = undefined;
    this.type = "Text";
    this.default = undefined;
}

function Clock() {
    this.title = "";
    this.seconds = 0;
    this.overtime = [];
    this.autoOvertime = false;
    this.icon = "";
    this.buzzer = "";
}

function Score() {
    this.title = "";
    this.subtitle = "";
    this.min = 0;
    this.max = 0;
    this.default = 0;
    this.multiplier = 0;
    this.addToTotal = false;
    this.icon = "";
}

function Action() {
    this.type = "";
    this.title = "";
    this.link = "";
    this.icon = "";
    this.actions = [];
}

function AllInOnePack() {
    this.title = undefined;
    this.manifest = [];
}

AllInOnePack.prototype.readObject = function (object) {
    var newPack = Solari.json.duplicate(object, this.reviver);

    this.title = newPack.title;
    this.manifest = newPack.manifest || [];
};

AllInOnePack.prototype.reviver = function (key, value) {
    //TODO Check required objects

    return value;
};

AllInOnePack.prototype.validate = function () {
    // TODO Check for invalid values

    return true;
};

AllInOnePack.prototype.contains = function (path) {
    var duplicateFound = false;

    for (var i = 0; i < this.manifest.length; i++) {
        if (this.manifest[i].path == path) {
            duplicateFound = true;
            break;
        }
    }

    return duplicateFound;
};

function ManifestEntry() {
    this.path = "";
    this.checksum = "";
}

function Image(path, data) {
    this.path = path || "";
    this.data = data || undefined;
}