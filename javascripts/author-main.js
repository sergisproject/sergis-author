/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

// Globals: game, randInt, randID, removeFromString, overlay, getOverlay, c,
// selectAll, checkJSON, swapGotos, decrementGotos, generate

// Make sure console... exists
if (!console) console = {};
if (!console.log) console.log = function () {};
if (!console.error) console.error = console.log;

// Polyfill window.location.origin if needed
if (!window.location.origin) {
    window.location.origin = window.location.protocol + "//" +
        window.location.hostname +
        (window.location.port ? ":" + window.location.port: "");
}

// The current game
var game = {
    name: null,
    jsondata: {
        /*
        // Metadata:
        generator: "",
        // "created" and "modified" are stored as Date objects, which are converted to ISO strings by JSON.stringify
        created: null,
        modified: null,

        // Game Data:
        jumpingBackAllowed: false,
        onJumpBack: "",
        jumpingForwardAllowed: false,
        showActionsInUserOrder: false,
        promptList: [{}]
        */
    }
};

/**
 * Make a quick and dirty random integer.
 *
 * @param {number} d - The number of digits in the number.
 */
function randInt(d) {
    return Math.floor((Math.random() * 9 + 1) * Math.pow(10, d-1));
}

/**
 * Make a unique random ID.
 */
function randID() {
    return Number(randInt(10) + "" + (new Date()).getTime() + "" + randInt(10)).toString(36);
}

/**
 * Remove something from a string.
 *
 * @param {string} str - The string to remove stuff from.
 * @param {string} toRemove - The substring to remove.
 * @param {string} [separator=" "] - The separator between the "words" in str.
 */
function removeFromString(str, toRemove, separator) {
    if (!toRemove) return str;
    
    if (typeof separator != "string" || !separator) separator = " ";
    str = separator + str + separator;
    toRemove = separator + toRemove + separator;
    
    var beforeStr, afterStr;
    while (str.indexOf(toRemove) != -1) {
        beforeStr = str.substring(0, str.indexOf(toRemove));
        afterStr = str.substring(str.indexOf(toRemove) + toRemove.length);
        str = beforeStr + separator + afterStr;
    }
    
    str = str.slice(separator.length, -separator.length);
    return str;
}

/**
 * Show/hide a big overlay (see #overlay in index.html).
 *
 * @param {string} [overlayID] - The ID of the overlay to show. If not
 *        provided, hides all overlays.
 */
function overlay(overlayID) {
    // Hide all overlays, but show the one we want (if applicable)
    var overlayShown = -1;
    var overlays = document.getElementsByClassName("overlay_inner");
    for (var i = 0; i < overlays.length; i++) {
        if (overlayID && overlays[i].getAttribute("id") == overlayID) {
            overlays[i].style.display = "block";
            overlayShown = i;
        } else {
            overlays[i].style.display = "none";
        }
    }
    // Show/hide overlay container
    var className = removeFromString(document.getElementById("overlay").className, "hidden");
    if (overlayShown == -1) className += " hidden";
    document.getElementById("overlay").className = className;
    if (overlayShown > -1) overlays[overlayShown].scrollTop = 0;
}

/**
 * Get the currently shown overlay.
 *
 * @return {?string} The ID of the currently visible overlay.
 */
function getOverlay() {
    var overlayID = null;
    var overlays = document.getElementsByClassName("overlay_inner");
    for (var i = 0; i < overlays.length; i++) {
        if (overlays[i].style.display != "none") overlayID = overlays[i].getAttribute("id");
    }
    return overlayID;
}

/**
 * Create a new DOM element.
 *
 * @param {string} elem - The tag name of the element to create.
 * @param {Object.<string, string>} [attributes] - Any DOM attributes for the
 *        element. Also can include some special properties:
 *        "class" or "className" --> CSS class(es) for the element,
 *        "text" or "textContent" --> Text content for the element,
 *        "html" or "innerHTML" --> HTML content for the element
 * @param {Function} [event] - A function to call when there is either a
 *        "change" event on the element (in the case of <input>, <select>, and
 *        <textarea>) or a "click" event (in any other case).
 * @param {...*} [parameter] - A parameter to pass to `event` when calling it
 *        (after the first parameter, which is always the DOM `event` object).
 *
 * @return {Element} The newly created DOM element.
 */
function c(elem, attributes, event /*, [parameter, [parameter, [...]]] */) {
    var NEEDS_ONCHANGE = ["input", "select", "textarea"];
    
    // Make the element
    elem = document.createElement(elem);
    
    // Apply any attributes
    if (attributes) {
        for (var prop in attributes) {
            if (attributes.hasOwnProperty(prop) && typeof attributes[prop] != "undefined") {
                if (prop == "class" || prop == "className") {
                    elem.className = attributes[prop];
                } else if (prop == "textContent" || prop == "text") {
                    elem.appendChild(document.createTextNode(attributes[prop]));
                } else if (prop == "html" || prop == "innerHTML") {
                    elem.innerHTML = attributes[prop];
                } else {
                    elem.setAttribute(prop, "" + attributes[prop]);
                }
            }
        }
    }
    
    // Apply event handler
    if (event) {
        var args = Array.prototype.slice.call(arguments, 3),
            eventName = NEEDS_ONCHANGE.indexOf(elem.nodeName.toLowerCase()) == -1 ? "click" : "change";
        elem.addEventListener(eventName, function (_event) {
            event.apply(this, [_event].concat(args));
        }, false);
    }
    
    // Return the created element
    return elem;
}

/**
 * Select all the text in an element.
 * Adapted from http://stackoverflow.com/a/987376
 *
 * @param {Element} element - The DOM element to select all the text of.
 */
function selectAll(elem) {
    var range, selection;
    if (typeof document.body.createTextRange == "function") {
        range = document.body.createTextRange();
        range.moveToElementText(elem);
        range.select();
    } else if (typeof window.getSelection == "function") {
        selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(elem);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

/**
 * Checks properties in the SerGIS JSON Game Data, possibly filling in default
 * values to make sure it doesn't lead to errors later.
 */
function checkJSON() {
    var i, item, j, k;
    var json = game.jsondata;
    
    // Check "generator"
    json.generator = "SerGIS Prompt Author v" + SERGIS_PROMPT_AUTHOR_VERSION;
    
    // Check "created"
    if (!json.created) {
        json.created = new Date();
    }
    
    // Check "modified"
    json.modified = new Date();
    
    // Check "onJumpBack"
    var onJumpBackValues = [],
        options = document.getElementById("general_onJumpBack").getElementsByTagName("option");
    for (i = 0; i < options.length; i++) {
        onJumpBackValues.push(options[i].getAttribute("value"));
    }
    if (onJumpBackValues.indexOf(json.onJumpBack) == -1) {
        // A sensible default
        json.onJumpBack = "reset";
    }
    
    // Make sure promptList is an array
    if (!json.promptList || !json.promptList.length) {
        json.promptList = [];
    }
    
    // Make sure each item in promptList has a good "prompt" and "actionList"
    i = 0;
    item = json.promptList[0];
    for (; i < json.promptList.length; item = json.promptList[++i]) {
        // Check "prompt"
        if (!item.prompt) {
            item.prompt = {};
        }
        
        // Check "prompt.title"
        if (typeof item.prompt.title != "string") {
            item.prompt.title = "";
        }
        
        // Check "prompt.map"
        if (!item.prompt.map) {
            item.prompt.map = {};
        }
        
        // Check "prompt.map.{latitude,longitude,zoom}"
        if (typeof item.prompt.map.latitude != "number") {
            item.prompt.map.latitude = 0;
        }
        if (typeof item.prompt.map.longitude != "number") {
            item.prompt.map.longitude = 0;
        }
        if (typeof item.prompt.map.zoom != "number") {
            item.prompt.map.zoom = 3;
        }
        
        // Check "prompt.map.frontendInfo"
        if (!item.prompt.map.frontendInfo) {
            item.prompt.map.frontendInfo = {};
        }
        
        // Check "prompt.map.frontendInfo.*"
        for (j in AUTHOR.JSON.frontendInfo) {
            if (AUTHOR.JSON.frontendInfo.hasOwnProperty(j)) {
                if (!item.prompt.map.frontendInfo[j]) {
                    item.prompt.map.frontendInfo[j] = {};
                }
            }
        }
        
        // Check "prompt.contents"
        if (!item.prompt.contents || !item.prompt.contents.length) {
            item.prompt.contents = [];
        }
        for (j = 0; j < item.prompt.contents.length; j++) {
            // Check "prompt.contents[j]"
            if (typeof item.prompt.contents[j] != "object") {
                item.prompt.contents[j] = {};
            }
            
            // Check "prompt.contents[j].type"
            if (!item.prompt.contents[j].type || !AUTHOR.JSON.contentTypes.hasOwnProperty(item.prompt.contents[j].type)) {
                item.prompt.contents[j].type = AUTHOR.JSON.defaultContentType;
            }
        }
        
        // Check "prompt.choices"
        if (!item.prompt.choices || !item.prompt.choices.length) {
            item.prompt.choices = [];
        }
        for (j = 0; j < item.prompt.choices.length; j++) {
            // Check "prompt.choices[j]"
            if (typeof item.prompt.choices[j] != "object") {
                item.prompt.choices[j] = {};
            }
            
            // Check "prompt.choices[j].type"
            if (!item.prompt.choices[j].type || !AUTHOR.JSON.contentTypes.hasOwnProperty(item.prompt.choices[j].type)) {
                item.prompt.choices[j].type = AUTHOR.JSON.defaultContentType;
            }
        }
        
        // Check "actionList"
        if (!item.actionList || !item.actionList.length) {
            item.actionList = [];
        }
        for (j = 0; j < item.prompt.choices.length; j++) {
            if (!item.actionList[j]) {
                item.actionList[j] = {};
            }
            
            // Check "actionList[j].actions"
            if (!item.actionList[j].actions || !item.actionList[j].actions.length) {
                item.actionList[j].actions = [];
            }
            // Check each one (starting from the end, in case we have to splice some out)
            for (k = item.actionList[j].actions.length - 1; k >= 0; k--) {
                if (!item.actionList[j].actions[k].name) {
                    item.actionList[j].splice(k, 1);
                } else {
                    // Check "actionList[j].actions[k].data"
                    if (!item.actionList[j].actions[k].data || !item.actionList[j].actions[k].data.length) {
                        item.actionList[j].actions[k].data = [];
                    }
                }
            }
            
            // Check "actionList[j].pointValue"
            if (!item.actionList[j].pointValue) {
                item.actionList[j].pointValue = 0;
            }
        }
    }
}

/**
 * Swap 2 promptIndexes in any "goto" actions.
 *
 * @param {number} goto1 - The first promptIndex; swapped with `goto2`.
 * @param {number} goto2 - The second promptIndex; swapped with `goto1`.
 */
function swapGotos(goto1, goto2) {
    var i, j, k, actionList, actions, action;
    var promptList = game.jsondata.promptList;
    for (i = 0; i < promptList.length; i++) {
        actionList = promptList[i].actionList;
        for (j = 0; j < actionList.length; j++) {
            actions = actionList[j].actions;
            for (k = 0; k < actions.length; k++) {
                action = actions[k];
                if (action.name == "goto" && action.data && action.data.length) {
                    if (action.data[0] == goto1) {
                        action.data[0] = goto2;
                    } else if (action.data[0] == goto2) {
                        action.data[0] = goto1;
                    }
                }
            }
        }
    }
}

/**
 * Decrement all promptIndexes in any "goto" actions above a certain value.
 *
 * @param {number} leastIndex - Any promptIndexes that are less than OR EQUAL
 *        TO this value will NOT be decremented.
 *
 * @returns {number} The number of occurrences of leastIndex (which, FYI, were
 *          NOT decremented).
 */
function decrementGotos(leastIndex) {
    var i, j, k, actionList, actions, action;
    var promptList = game.jsondata.promptList;
    var occurrences = 0;
    for (i = 0; i < promptList.length; i++) {
        actionList = promptList[i].actionList;
        for (j = 0; j < actionList.length; j++) {
            actions = actionList[j].actions;
            for (k = 0; k < actions.length; k++) {
                action = actions[k];
                if (action.name == "goto" && action.data && action.data.length) {
                    if (action.data[0] == leastIndex) {
                        occurrences += 1;
                    } else if (action.data[0] > leastIndex) {
                        action.data[0] -= 1;
                    }
                }
            }
        }
    }
    return occurrences;
}

/**
 * Check the JSON data, then update the export button and (possibly) update the
 * table.
 *
 * @param {boolean} [updateTable] - Whether to update the table.
 * @param {number} [newCurrentPromptIndex] - A new current prompt index.
 */
function generate(updateTable, newCurrentPromptIndex) {
    // Make sure our data is good
    checkJSON();
    
    // Update our export button
    if (typeof btoa == "function") {
        var a = document.getElementById("toolbar_export");
        a.setAttribute("download", AUTHOR.GAMES.getLabel() + ".json");
        a.setAttribute("href", AUTHOR.GAMES.getDataURI());
    }
    
    // Update "Preview Game" link (if applicable)
    if (AUTHOR.CONFIG.clientPreviewURL) {
        document.getElementById("toolbar_preview").style.display = "block";
        document.getElementById("toolbar_preview").setAttribute("href",
            AUTHOR.CONFIG.clientPreviewURL + "#jsongamedata::" + encodeURIComponent(AUTHOR.GAMES.getJSON()));
    }
    
    // Save with the backend
    AUTHOR.GAMES.saveGame().then(function () {
        console.log("Saved game: " + game.name);
    }).catch(function (err) {
        console.error(err);
        alert(_("Error saving game: ") + err.name + "\n" + err.message);
    });
    
    // And, update the table (if needed)
    if (updateTable) {
        AUTHOR.TABLE.initTable(newCurrentPromptIndex);
    }
}

(function () {    
    /**
     * Initialize everything.
     */
    function init() {
        // Version number in footer
        document.getElementById("version_inner").appendChild(document.createTextNode("" + SERGIS_PROMPT_AUTHOR_VERSION));
        document.getElementById("version_outer").style.display = "inline";
        
        // "View JSON" button
        document.getElementById("viewjson").addEventListener("click", function (event) {
            event.preventDefault();
            document.getElementById("overlay_viewjson_content").innerHTML = "";
            document.getElementById("overlay_viewjson_content").appendChild(document.createTextNode(AUTHOR.GAMES.getJSON(2)));
            overlay("overlay_viewjson");
        }, false);
        
        // "Export" button (if base64 and data URIs are supported)
        /* Yes, you can shoot me later for the use of browser detection, but IE
         * is the only major browser that *still* doesn't fully support "data:"
         * URIs.
         */
        if (typeof btoa == "function" && navigator.userAgent.indexOf("Trident/") == -1) {
            document.getElementById("toolbar_export").style.display = "block";
            // Message if <a download="..."> isn't supported
            if (typeof document.createElement("a").download == "undefined") {
                document.getElementById("toolbar_export").addEventListener("click", function (event) {
                    event.preventDefault();
                    alert(_("Right-click this button, select \"Save Link As\" or \"Save Target As\", and name the file something like \"name.json\""));
                }, false);
            }
        }
        
        // "Publish" button
        if (typeof AUTHOR.BACKEND.publishGame == "function") {
            document.getElementById("toolbar_publish").style.display = "block";
            document.getElementById("toolbar_publish").addEventListener("click", function (event) {
                event.preventDefault();
                alert("publishing...");
                return;
                AUTHOR.BACKEND.publishGame("game name").then(function (iframeUrl) {
                    
                });
            }, false);
        }
        
        // "Add Prompt" button
        document.getElementById("addPrompt").addEventListener("click", function (event) {
            event.preventDefault();
            var newPromptIndex = game.jsondata.promptList.push({}) - 1;
            // Save and regenerate
            generate(true, newPromptIndex);
        }, false);
        
        // "Expand All Prompts" checkbox
        document.getElementById("expandAllPrompts").addEventListener("change", function (event) {
            AUTHOR.TABLE.setExpandAllPrompts(this.checked);
        }, false);
        document.getElementById("expandAllPrompts").checked = false;
        
        // "Jumping Back Allowed" checkbox
        document.getElementById("general_jumpingBackAllowed").addEventListener("change", function (event) {
            game.jsondata.jumpingBackAllowed = this.checked;
            // Save the game and update the Export button
            generate();
        }, false);
        
        // "On Jump Back" select
        document.getElementById("general_onJumpBack").addEventListener("change", function (event) {
            game.jsondata.onJumpBack = this.value;
            // Save the game and update the Export button
            generate();
        }, false);
        
        // "Jumping Forward Allowed" checkbox
        document.getElementById("general_jumpingForwardAllowed").addEventListener("change", function (event) {
            game.jsondata.jumpingForwardAllowed = this.checked;
            // Save the game and update the Export button
            generate();
        }, false);
        
        // "Show Actions In User Order" checkbox
        document.getElementById("general_showActionsInUserOrder").addEventListener("change", function (event) {
            game.jsondata.showActionsInUserOrder = this.checked;
            // Save the game and update the Export button
            generate();
        }, false);
        
        // "View JSON" overlay:
        // "Select All" button
        if (typeof document.body.createTextRange == "function" || typeof window.getSelection == "function") {
            document.getElementById("overlay_viewjson_selectall").style.display = "block";
            document.getElementById("overlay_viewjson_selectall_link").addEventListener("click", function (event) {
                event.preventDefault();
                selectAll(document.getElementById("overlay_viewjson_content"));
            }, false);
        }
        // "Close" button
        document.getElementById("overlay_viewjson_close").addEventListener("click", function (event) {
            event.preventDefault();
            overlay();
        }, false);
    }

    window.addEventListener("load", init, false);
})();
