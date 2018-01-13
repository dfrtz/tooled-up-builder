/**
 * @file Tooled Up - Builder app shared libraries and objects.
 *
 * @author David Fritz
 * @version 1.0.0
 *
 * @copyright 2015-2017 David Fritz
 * @license MIT
 */

/**
 * A Class used to store and manipulate the values representing a Tabletop Gaming Card.
 *
 * @class
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

/**
 * Parses a generic object into a Card.
 *
 * @param {object|undefined} config Data object representing Card.
 * @param {object} config.idGroup Group of values that makeup a combined id value.
 * @param {number} config.id Single value representing a combined idGroup.
 * @param {String} config.title Value representing the primary name.
 * @param {String} config.subtitle Value representing the secondary name.
 * @param {String} config.legacy Value representing the tertiary name if deprecated.
 * @param {String} config.groups Text list of groups that a Card belongs to.
 * @param {number} config.private Side of card to show if it is considered only owner visible.
 * @param {boolean} config.landscape Whether images are oriented in landscape mode.
 * @param {String[]} config.content Array of canonical paths to images within CardPack.
 * @param {String[]} config.versions Array of data objects representing different versions.
 */
Card.prototype.readObject = function (config) {
    this.idGroup = config.idGroup || {
        id: 0,
        revision: 0
    };
    this.id = config.id;
    this.title = config.title;
    this.subtitle = config.subtitle;
    this.legacy = config.legacy;
    this.groups = config.groups;
    this.private = config.private;
    this.landscape = config.landscape;
    this.content = config.content || [];
    this.versions = config.versions || [];

    for (var i = 0; i < this.versions.length; i++) {
        if (!this.versions[i].hitboxes) {
            this.versions[i].hitboxes = [];
        }
    }
};

/**
 * Converts the id into an idGroup for display in forms.
 */
Card.prototype.splitId = function () {
    var self = this;
    if (self.id === undefined) {
        return;
    }

    this.idGroup = {
        id: Math.floor(self.id / 10000),
        revision: self.id % 10000
    };
};

/**
 * Converts the idGroup into an id which can be read by Tooled Up app.
 */
Card.prototype.mergeId = function () {
    if (!this.idGroup || (this.idGroup.id === undefined && this.idGroup.revision === undefined)) {
        return;
    }

    this.id = parseInt((this.idGroup.id || 0) + '' + this.padRevision(this.idGroup.revision));
};

/**
 * Pads the revision of a card with leading zeros to be merged with a primary Card id.
 *
 * @param {number} revision Value representing the revision portion of a Card's id.
 * @returns {string|*} Revision with leading zeros added.
 */
Card.prototype.padRevision = function (revision) {
    return Solari.utils.padZeros(revision || '', 4);
};

/**
 * Splits all value sets from the versions of the card and pairs with named categories for use in forms.
 *
 * @param {CardValue[]} categories Array of CardValues to use while splitting and pairing value sets.
 */
Card.prototype.splitVersionValues = function (categories) {
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

/**
 * Merges all values of a card in a single value set that can be read by Tooled Up app.
 *
 * @param {CardValue[]} categories Array of CardValues to use to ensure order or final combined value set.
 */
Card.prototype.mergeVersionValues = function (categories) {
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

/**
 * Sorts the variables into predetermined order before conversion to text.
 *
 * @returns {Card} New card with variables organized for output.
 */
Card.prototype.organizeVariables = function () {
    var oldCard = this;

    // Recreate card with new main variable order
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

                    // Push new version into place of old version
                    newVersion.hitboxes[iii] = {
                        title: oldHitbox.title,
                        color: oldHitbox.color,
                        defaultX: oldHitbox.defaultX,
                        defaultY: oldHitbox.defaultY,
                        defaultZ: oldHitbox.defaultZ,
                        defaultSize: oldHitbox.defaultSize,
                        values: oldHitbox.values
                    };
                }
            }

            newCard.versions[ii] = newVersion;
        }
    }

    return newCard;
};

/**
 * A Class used to store and manipulate a set of Cards and their group summary information.
 *
 * @class
 */
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

/**
 * Parses a generic object into a CardPack.
 *
 * @param {object} config Data object representing CardPack.
 * @param {String} config.set Text representing the Game that Card will be shared across.
 * @param {String} config.title Text representing the group of Cards.
 * @param {number} config.version Whole or decimal value representing version.
 * @param {String} config.group Text tag that will be applied to all Cards for cross pack sharing.
 * @param {String} config.description Summary of all cards contained in pack.
 * @param {String} config.compatibility Text tag representing a Game set if card should be shared between Games.
 * @param {object} config.theme Data object containing values for colors and themed backgrounds.
 * @param {object[]} config.cards Array of Cards or Objects that can be converted to Cards.
 */
CardPack.prototype.readObject = function (config) {
    var newPack = Solari.json.duplicate(config, this.reviver);

    this.set = newPack.set;
    this.title = newPack.title;
    this.version = newPack.version || 0;
    this.group = newPack.group;
    this.description = newPack.description;
    this.compatibility = newPack.compatibility;
    this.theme = newPack.theme || {};
    this.cards = newPack.cards || [];
};

/**
 * Performs JSON revival operations when converting from text to objects when used with JSON parser.
 *
 * @param {object} key The key of the pair to check for special JSON revival actions.
 * @param {object} value The value of the pair to check for special JSON revival actions.
 * @returns {object} Updated value or existing value if no change.
 */
CardPack.prototype.reviver = function (key, value) {
    // Convert array of generic Card data into array of Cards
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

/**
 * Duplicates existing CardPack while maintaining special object classes.
 *
 * @returns {CardPack} New CardPack without any links to existing pack.
 */
CardPack.prototype.duplicate = function () {
    var newPack = new CardPack();
    newPack.readObject(this);
    return newPack;
};

/**
 * Splits all Card ids into idGroups for use in forms.
 */
CardPack.prototype.splitCardIds = function () {
    for (var i = 0; i < this.cards.length; i++) {
        this.cards[i].splitId();
    }
};

/**
 * Combines all Card idGroups into single id value which can be saved and read by Tooled Up app.
 */
CardPack.prototype.mergeCardIds = function () {
    for (var i = 0; i < this.cards.length; i++) {
        this.cards[i].mergeId();
    }
};

/**
 * Organizes Cards into predetermined order.
 */
CardPack.prototype.sortCards = function () {
    this.mergeCardIds();
    Solari.utils.sortArray(this.cards, "id");
    this.splitCardIds();
};

/**
 * Converts all Card value sets into key/value pairs to be used by forms.
 *
 * @param {CardValue[]} categories List of CardValues to use in the value split and pair process.
 */
CardPack.prototype.splitCardValues = function (categories) {
    for (var i = 0; i < this.cards.length; i++) {
        this.cards[i].splitVersionValues(categories);
    }
};

/**
 * Combines all card value pairs into single value sets that can be read by Tooled Up app.
 *
 * @param {CardValue[]} categories List of CardValues to use in the value merge/ordering process.
 */
CardPack.prototype.mergeCardValues = function (categories) {
    for (var i = 0; i < this.cards.length; i++) {
        this.cards[i].mergeVersionValues(categories);
    }
};

/**
 * Sorts the variables into predetermined order before conversion to text.
 *
 * @returns {CardPack} New CardPack with variables organized for output.
 */
CardPack.prototype.organizeVariables = function () {
    var newPack = this.duplicate();
    //TODO
    return newPack;
};

/**
 * Sorts all Card variables into predetermined order before conversion to output.
 */
CardPack.prototype.organizeCardVariables = function () {
    for (var i = 0; i < this.cards.length; i++) {
        this.cards[i] = this.cards[i].organizeVariables();
    }
};

/**
 * Verifies all Cards and pack attributes meet requirements to prevent conflicts and to be read in Tooled Up app.
 *
 * @returns {boolean} Whether or not all checks passed.
 */
CardPack.prototype.validate = function () {
    // TODO Check for duplicate IDs
    // TODO Check for missing Images
    // TODO Any other checks that should be performed oustide standard schema

    return true;
};

/**
 * A Class used to store and manipulate Expansion Pack items and the summary information.
 *
 * @class
 */
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

/**
 * Parses a generic object into a ExpansionPack.
 *
 * @param {object} config Data object representing ExpansionPack.
 * @param {String} config.set Text representing the Game that data will be shared across.
 * @param {String} config.title Text representing the group of Cards.
 * @param {number} config.version Whole or decimal value representing version.
 * @param {String} config.description Summary of all cards contained in pack.
 * @param {String[]} config.categories Array of text labels representing predefined Card categories.
 * @param {CardValue[]} config.cardValues Array of CardValues that will be used to split Card value sets.
 * @param {object} config.titles Set of text arrays representing title format strings in various app locations.
 * @param {object} config.subtitles Set of text arrays representing subtitle format strings in various app locations.
 * @param {Clock[]} config.clocks Array of Clocks that can be used by Tooled Up chess clock.
 * @param {Score[]} config.scores Array of Scores which will be used in Tooled Up Matches.
 * @param {Action[]} config.actions Array of Actions that will be displayed as shortcuts to users.
 */
ExpansionPack.prototype.readObject = function (config) {
    var newPack = Solari.json.duplicate(config, this.reviver);

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

/**
 * Performs JSON revival operations when converting from text to objects when used with JSON parser.
 *
 * @param {object} key The key of the pair to check for special JSON revival actions.
 * @param {object} value The value of the pair to check for special JSON revival actions.
 * @returns {object} Updated value or existing value if no change.
 */
ExpansionPack.prototype.reviver = function (key, value) {
    //TODO Check required objects

    return value;
};

/**
 * Duplicates existing ExpansionPack while maintaining special object classes.
 *
 * @returns {ExpansionPack} New ExpansionPack without any links to existing pack.
 */
ExpansionPack.prototype.duplicate = function () {
    var newPack = new ExpansionPack();
    newPack.readObject(this);
    return newPack;
};

/**
 * Sorts the variables into predetermined order before conversion to text.
 *
 * @returns {ExpansionPack} New ExpansionPack with variables organized for output.
 */
ExpansionPack.prototype.organizeVariables = function () {
    var newPack = this.duplicate();
    //TODO
    return newPack;
};

/**
 * Verifies all Expansion items and pack attributes meet requirements to prevent conflicts and to be read in Tooled Up.
 *
 * @returns {boolean} Whether or not all checks passed.
 */
ExpansionPack.prototype.validate = function () {
    // TODO Check for missing Images
    // TODO Any other checks that should be performed oustide standard schema

    return true;
};

/**
 * Generate form information from CardValues for display in DOM.
 *
 * @returns {object[]} Array of form sections.
 */
ExpansionPack.prototype.parseValueGroupForm = function () {
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

/**
 * Generate schema information from CardValues for display in DOM.
 *
 * @returns {object} Set of schema value types stored by CardValue type.
 */
ExpansionPack.prototype.parseValueGroupSchema = function () {
    var properties = {};

    for (var i = 0; i < this.cardValues.length; i++) {
        var property = {};

        property.type = this.cardValues[i].type === "Text" ? "string" : "integer";

        properties[this.cardValues[i].title] = property;
    }

    return properties;
};

/**
 * A Class used to store the information about a Tabletop Gaming Card value.
 *
 * @param {object|undefined} cardValue Data object representing CardValue.
 * @param {String} cardValue.title Text representing summary of a Card value.
 * @param {String} cardValue.type Text representing the way to parse a value as "Text", "Number", or "TrueFalse".
 * @param {object} cardValue.default Value that should be used if no named value is found in a Card.
 * @class
 */
function CardValue(cardValue) {
    var newValue = Solari.json.duplicate(cardValue);

    this.title = newValue.title || undefined;
    this.type = newValue.type || "Text";
    this.default = newValue.default || undefined;
}

/**
 * A Class used to store the information representing a chess clock.
 *
 * @param {object|undefined} clock Data object representing Clock.
 * @param {String} clock.title Text summary.
 * @param {number} clock.seconds Length of time in seconds for the main countdown.
 * @param {number[]} clock.overtime List of lengths in seconds for each allowed overtime period.
 * @param {boolean} clock.autoOvertime Whether overtime counters should start automatically instead of wait.
 * @param {String} clock.icon Canonical filesystem path, or relative path within zip, to image file.
 * @param {String} clock.buzzer Canonical filesystem path, or relative path within zip, to sound file..
 * @class
 */
function Clock(clock) {
    var newClock = Solari.json.duplicate(clock);

    this.title = newClock.title || "";
    this.seconds = newClock.seconds || 0;
    this.overtime = newClock.overtime || [];
    this.autoOvertime = newClock.autoOvertime || false;
    this.icon = newClock.icon || "";
    this.buzzer = newClock.buzzer || "";
}

/**
 * A Class used to store the information representing a game tracking value.
 *
 * @param {object|undefined} score Data object representing Score.
 * @param {String} score.title Text summary.
 * @param {String} score.subtitle Text representing summary shorthand.
 * @param {number} score.min Minimum allowed value.
 * @param {number} score.max Maximum allowed value.
 * @param {number} score.default Starting value.
 * @param {number} score.multiplier Additional multiplier when showing displayed score.
 * @param {boolean} score.addToTotal Whether this score contributes to total player score, rather than tracking only.
 * @param {String} score.icon Canonical filesystem path, or relative path within zip, to image file.
 * @class
 */
function Score(score) {
    var newScore = Solari.json.duplicate(score);

    this.title = newScore.title || "";
    this.subtitle = newScore.subtitle || "";
    this.min = newScore.min || 0;
    this.max = newScore.max || 0;
    this.default = newScore.default || 0;
    this.multiplier = newScore.multiplier || 0;
    this.addToTotal = newScore.addToTotal || false;
    this.icon = newScore.icon || "";
}

/**
 * A Class used to store the information representing dynamically built menu actions.
 *
 * @param {object|undefined} action Data object representing Score.
 * @param {String} action.type Text representing type of action as "action" or "group".
 * @param {String} action.title Text summary.
 * @param {String} action.link URI action will launch.
 * @param {String} action.icon Relative path within zip to image file.
 * @param {Action[]} action.actions Array of additional Actions if this is a of type "group".
 * @class
 */
function Action(action) {
    var newAction = Solari.json.duplicate(action);

    this.type = newAction.type || "";
    this.title = newAction.title || "";
    this.link = newAction.link || "";
    this.icon = newAction.icon || "";
    this.actions = newAction.actions || [];
}

/**
 * A Class used to store and manipulate All In One Pack items and manifest information.
 *
 * @class
 */
function AllInOnePack() {
    this.title = undefined;
    this.manifest = [];
}

/**
 * Parses an generic object into a AllInOnePack.
 *
 * @param {object} config Data object representing AllInOnePack.
 * @param {String} config.title Text representing the summary of included packs.
 * @param {ManifestEntry[]} config.manifest Array of ManifestEntry data representing files in zip.
 */
AllInOnePack.prototype.readObject = function (config) {
    var newPack = Solari.json.duplicate(config, this.reviver);

    this.title = newPack.title;
    this.manifest = newPack.manifest || [];
};

/**
 * Performs JSON revival operations when converting from text to object used with JSON parser.
 *
 * @param {object} key The key of the pair to check for special JSON revival actions.
 * @param {object} value The value of the pair to check for special JSON revival actions.
 * @returns {object} Updated value or existing value if no change.
 */
AllInOnePack.prototype.reviver = function (key, value) {
    //TODO Check required objects
    return value;
};

/**
 * Verifies all data meets requirements to prevent conflicts and to be read in Tooled Up app.
 *
 * @returns {boolean} Whether or not all checks passed.
 */
AllInOnePack.prototype.validate = function () {
    // TODO Check for invalid values

    return true;
};

/**
 * Verifies if a pack already exists in the manifest.
 *
 * @param {String} path Pathname to the file within the zip and manifest.
 * @returns {boolean} Whether the path exists.
 */
AllInOnePack.prototype.contains = function (path) {
    var duplicateFound = false;

    for (var i = 0; i < this.manifest.length; i++) {
        if (this.manifest[i].path === path) {
            duplicateFound = true;
            break;
        }
    }

    return duplicateFound;
};

/**
 * A Class used to store an entry in the AIO pack manifest.
 *
 * @class
 */
function ManifestEntry() {
    this.path = "";
    this.checksum = "";
}

/**
 * A Class used to store an images data and description.
 *
 * @class
 */
function Image(path, data) {
    this.path = path || "";
    this.data = data || undefined;
}