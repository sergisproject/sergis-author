/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

// Globals: exportEnabled, game, makeCatch, randInt, randID, removeFromString,
// overlay, getOverlay, c, openPage, selectAll,
// checkJSON, swapGotos, decrementGotos, generate, updateAdvancedProperties

// Make sure console.{log,error} exists
if (typeof console == "undefined") console = {};
if (!console.log) console.log = function () {};
if (!console.error) console.error = console.log;

// Polyfill window.location.origin if needed
if (!window.location.origin) {
    window.location.origin = window.location.protocol + "//" +
        window.location.hostname +
        (window.location.port ? ":" + window.location.port: "");
}

/**
 * Whether the "Export" button should be enabled (if base64 and data URIs are
 * supported).
 * Yes, you can shoot me later for the use of browser detection, but IE is the
 * only major browser that *still* doesn't fully support "data:" URIs.
 */
var exportEnabled = (typeof btoa == "function" && navigator.userAgent.indexOf("Trident/") == -1);

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
 * Make a catcher that can catch errors from Promises.
 *
 * @param {String} message - What the Promise was trying to do.
 */
function makeCatch(message) {
    return function (err) {
        if (!err) {
            alert(message);
        } else {
            console.error(err);
            alert(message + ": " + err.name + "\n" + err.message);
        }
    };
}

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
        var stuff, i;
        for (var prop in attributes) {
            if (attributes.hasOwnProperty(prop) && typeof attributes[prop] != "undefined") {
                if (prop == "class" || prop == "className") {
                    elem.className = attributes[prop];
                } else if (prop == "textContent" || prop == "text") {
                    stuff = ("" + attributes[prop]).split("\n");
                    elem.appendChild(document.createTextNode(stuff.shift()));
                    for (i = 0; i < stuff.length; i++) {
                        elem.appendChild(document.createElement("br"));
                        elem.appendChild(document.createTextNode(stuff[i]));
                    }
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
 * Add a "change" event handler to a "number" input element that will only be
 * called after some basic numeric validation is performed.
 *
 * @param {Element} elem - The DOM input element to attach to.
 * @param {Function} handler - The onchange handler. Called with `event` (the
 *        DOM event object) and `value` (the numeric value, or `null` if the
 *        input element is empty). This function is not called if the user
 *        entered something that is not numeric.
 * @param {number} [min] - The minimum numeric value (optional).
 * @param {number} [max] - The maximum numeric value (optional).
 */
function addNumericChangeHandler(elem, handler, min, max) {
    if (!min) min = -Infinity;
    if (!max) max = Infinity;
    elem.addEventListener("change", function (event) {
        this.style.border = "";
        var value = this.value;
        if (typeof value.trim == "function") {
            value = value.trim();
        }
        if (typeof this.checkValidity == "function") {
            if (this.checkValidity() === false) {
                this.style.border = "1px solid red";
                return;
            }
        }
        
        if (!value) {
            handler(event, null);
        } else {
            var num = Number(value);
            if (isNaN(num) || num < min || num > max) {
                this.style.border = "1px solid red";
            } else {
                handler(event, num);
            }
        }
    }, false);
}

/**
 * Open a page.
 * @see http://sergisproject.github.io/docs/author.html
 *
 * @param {Object} pageData - For the properties that this object takes, see
 *        the link above.
 * @param {string} [target=""] - The target (browsing context) to open the
 *        request in.
 */
function openPage(pageData, target) {
    // Make a new form to submit
    var form = c("form", {
        target: target || "",
        action: pageData.url,
        method: pageData.method || "GET",
        enctype: pageData.enctype ||
            (!pageData.method || pageData.method.toLowerCase() == "get" ? "" : "application/x-www-form-urlencoded")
    });
    // Add the form to the page
    document.getElementById("openPageForms").appendChild(form);
    // Add any input elements
    if (pageData.data) {
        for (var paramName in pageData.data) {
            if (pageData.data.hasOwnProperty(paramName)) {
                form.appendChild(c("input", {
                    type: "hidden",
                    name: paramName,
                    value: pageData.data[paramName]
                }));
            }
        }
    }
    // Submit the form
    // (wrapped in a try since some browsers throw when popups are blocked)
    try {
        form.submit();
    } catch (err) {}
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
    
    // Check "layout"
    if (typeof json.layout != "object" || !json.layout) {
        json.layout = {};
    }
    if (!json.layout.defaultSidebarWidthRatio) {
        json.layout.defaultSidebarWidthRatio = 0.3;
    }
    if (!json.layout.defaultPopupMaxWidthRatio) {
        json.layout.defaultPopupMaxWidthRatio = 0.5;
    }
    
    // Check "onJumpBack"
    var onJumpBackValues = [],
        options = document.getElementById("overlay_advancedProperties_general_onJumpBack").getElementsByTagName("option");
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
        
        // Check "prompt.buttons"
        if (!item.prompt.buttons) {
            item.prompt.buttons = {};
        }
        for (j in AUTHOR.JSON.frontendInfo) {
            if (AUTHOR.JSON.frontendInfo.hasOwnProperty(j)) {
                if (!item.prompt.buttons[j]) {
                    item.prompt.buttons[j] = {};
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
    if (exportEnabled) {
        var a = document.getElementById("toolbar_export");
        a.setAttribute("download", AUTHOR.GAMES.getLabel() + ".json");
        a.setAttribute("href", AUTHOR.GAMES.getDataURI());
    }
    
    // Update "Preview Game" link
    // (if we have a clientPreviewURL but not a previewGame function on the backend)
    if (AUTHOR.CONFIG.clientPreviewURL && typeof AUTHOR.BACKEND.previewGame != "function") {
        document.getElementById("toolbar_preview").style.display = "block";
        document.getElementById("toolbar_preview").setAttribute("href",
            AUTHOR.CONFIG.clientPreviewURL + "#jsongamedata::" + encodeURIComponent(AUTHOR.GAMES.getJSON()));
    }
    
    // Save with the backend
    AUTHOR.GAMES.saveGame().then(function () {
        console.log("Saved game: " + game.name);
    }).catch(makeCatch(_("Error saving game")));
    
    // And, update the table (if needed)
    if (updateTable) {
        AUTHOR.TABLE.initTable(newCurrentPromptIndex);
    }
}

/**
 * Update all the items in the "Advanced Properties" overlay based on new JSON
 * data.
 */
function updateAdvancedProperties() {
    var json = game.jsondata;
    
    document.getElementById("overlay_advancedProperties_alwaysReinitializeMap").checked =
        !!json.alwaysReinitializeMap;
    
    // Layout stuff
    document.getElementById("overlay_advancedProperties_layout_disableSidebarResizing").checked =
        !!json.layout.disableSidebarResizing;
    document.getElementById("overlay_advancedProperties_layout_disableTranslucentSidebar").checked =
        !!json.layout.disableTranslucentSidebar;
    document.getElementById("overlay_advancedProperties_layout_showPromptNumber").checked =
        !!json.layout.showPromptNumber;
    document.getElementById("overlay_advancedProperties_layout_hidePromptTitle").checked =
        !!json.layout.hidePromptTitle;
    document.getElementById("overlay_advancedProperties_layout_defaultSidebarWidthRatio").value =
        "" + json.layout.defaultSidebarWidthRatio;
    document.getElementById("overlay_advancedProperties_layout_defaultPopupMaxWidthRatio").value =
        "" + json.layout.defaultPopupMaxWidthRatio;
    
    // Jumping stuff
    document.getElementById("overlay_advancedProperties_general_jumpingBackAllowed").checked =
        !!json.jumpingBackAllowed;
    document.getElementById("overlay_advancedProperties_general_onJumpBack").value =
        json.onJumpBack;
    document.getElementById("overlay_advancedProperties_general_jumpingForwardAllowed").checked =
        !!json.jumpingForwardAllowed;
    document.getElementById("overlay_advancedProperties_general_showActionsInUserOrder").checked =
        !!json.showActionsInUserOrder;
}

(function () {    
    /**
     * Initialize the "Advanced Properties" overlay.
     */
    function initAdvancedProperties() {
        var props, i;
        
        // The checkboxes for some layout properties
        props = ["disableSidebarResizing", "disableTranslucentSidebar", "showPromptNumber", "hidePromptTitle"];
        for (i = 0; i < props.length; i++) {
            (function (layoutProp) {
                document.getElementById("overlay_advancedProperties_layout_" + layoutProp).addEventListener("change", function (event) {
                    game.jsondata.layout[layoutProp] = this.checked;
                    // Save the game and update the Export button
                    generate();
                }, false);
            })(props[i]);
        }
        
        // The number inputs for some layout properties
        props = ["defaultSidebarWidthRatio", "defaultPopupMaxWidthRatio"];
        for (i = 0; i < props.length; i++) {
            (function (layoutProp) {
                addNumericChangeHandler(document.getElementById("overlay_advancedProperties_layout_" + layoutProp), function (event, value) {
                    if (value === null) {
                        // Set it to 0 so it will plug in the default
                        game.jsondata.layout[layoutProp] = 0;
                    } else {
                        game.jsondata.layout[layoutProp] = value;
                    }
                    // Save the game and update the Export button
                    generate();
                }, 0, 1);
            })(props[i]);
        }
        
        // "Always Reinitialize Map" checkbox
        document.getElementById("overlay_advancedProperties_alwaysReinitializeMap").addEventListener("change", function (event) {
            game.jsondata.alwaysReinitializeMap = this.checked;
            // Save the game, update the table, and update the Export button
            generate(true);
        }, false);
        
        // "Jumping Back Allowed" checkbox
        document.getElementById("overlay_advancedProperties_general_jumpingBackAllowed").addEventListener("change", function (event) {
            game.jsondata.jumpingBackAllowed = this.checked;
            // Save the game and update the Export button
            generate();
        }, false);
        
        // "On Jump Back" select
        document.getElementById("overlay_advancedProperties_general_onJumpBack").addEventListener("change", function (event) {
            game.jsondata.onJumpBack = this.value;
            // Save the game and update the Export button
            generate();
        }, false);
        
        // "Jumping Forward Allowed" checkbox
        document.getElementById("overlay_advancedProperties_general_jumpingForwardAllowed").addEventListener("change", function (event) {
            game.jsondata.jumpingForwardAllowed = this.checked;
            // Save the game and update the Export button
            generate();
        }, false);
        
        // "Show Actions In User Order" checkbox
        document.getElementById("overlay_advancedProperties_general_showActionsInUserOrder").addEventListener("change", function (event) {
            game.jsondata.showActionsInUserOrder = this.checked;
            // Save the game and update the Export button
            generate();
        }, false);
    }
    
    /**
     * Initialize everything.
     */
    function init() {
        // Links in header
        if (AUTHOR.CONFIG.links && AUTHOR.CONFIG.links.length) {
            var links = AUTHOR.CONFIG.links,
                linkbar = document.getElementById("links");
            for (var i = 0; i < links.length; i++) {
                linkbar.appendChild(c("a", {
                    text: links[i].name,
                    href: links[i].href
                }));
            }
            linkbar.style.display = "block";
        }
        
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
        if (exportEnabled) {
            document.getElementById("toolbar_export").style.display = "block";
            // Message if <a download="..."> isn't supported
            if (typeof document.createElement("a").download == "undefined") {
                document.getElementById("toolbar_export").addEventListener("click", function (event) {
                    event.preventDefault();
                    alert(_("Right-click this button, select \"Save Link As\" or \"Save Target As\", and name the file something like \"name.json\""));
                }, false);
            }
        }
        
        // "Preview" button
        if (AUTHOR.CONFIG.clientPreviewURL || typeof AUTHOR.BACKEND.previewGame == "function") {
            // Show the button
            document.getElementById("toolbar_preview").style.display = "block";
            // If the backend has `previewGame`, set that up
            if (typeof AUTHOR.BACKEND.previewGame == "function") {
                document.getElementById("toolbar_preview").addEventListener("click", function (event) {
                    event.preventDefault();
                    overlay("overlay_loading");
                    var doPreview = function () {
                        AUTHOR.BACKEND.previewGame(game.name).then(function (pageData) {
                            overlay();
                            openPage(pageData, "_blank");
                        }).catch(makeCatch(_("Error getting preview page")));
                    };
                    // Show alert regarding popups (if necessary)
                    if (document.cookie.indexOf("PREVIEW_POPUP_ALERT_SHOWN=yep") == -1) {
                        askForOK(_("To view the preview, you must allow popups from this site.") + "\n" + _("If your browser blocks the preview popup, configure it to always allow popups from this site and click \"Preview\" again.")).then(function () {
                            // They clicked OK; store this (lolz cookies)
                            document.cookie = "PREVIEW_POPUP_ALERT_SHOWN=yep;expires=Fri, 31 Dec 9999 23:59:59 GMT";
                            doPreview();
                        }).catch(makeCatch(_("Error asking for confirmation (lolz)")));
                    } else {
                        // We already showed them the alert
                        doPreview();
                    }
                }, false);
            }
        }
        
        // "Publish" button
        if (typeof AUTHOR.BACKEND.publishGame == "function") {
            document.getElementById("toolbar_publish").style.display = "block";
            document.getElementById("toolbar_publish").addEventListener("click", function (event) {
                event.preventDefault();
                overlay("overlay_loading");
                AUTHOR.BACKEND.publishGame(game.name).then(function (pageData) {
                    overlay("overlay_publish");
                    openPage(pageData, "overlay_publish_iframe");
                }).catch(makeCatch(_("Error getting publish page")));
            }, false);
        }
        
        // Close button in Publish overlay
        document.getElementById("overlay_publish_close").addEventListener("click", function (event) {
            event.preventDefault();
            overlay();
        }, false);
        
        // "Advanced" button
        document.getElementById("toolbar_view").addEventListener("click", function (event) {
            event.preventDefault();
            overlay("overlay_advancedProperties");
        }, false);
        
        // Close button in Advanced overlay
        document.getElementById("overlay_advancedProperties_close").addEventListener("click", function (event) {
            event.preventDefault();
            overlay();
        }, false);
        
        // Advanced Properties overlay
        initAdvancedProperties();
        
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
        
        
        // "Expand All Prompts" checkbox
        document.getElementById("expandAllPrompts").addEventListener("change", function (event) {
            AUTHOR.TABLE.setExpandAllPrompts(this.checked);
        }, false);
        document.getElementById("expandAllPrompts").checked = false;
        
        // "Add Prompt" button
        document.getElementById("addPrompt").addEventListener("click", function (event) {
            event.preventDefault();
            var newPromptIndex = game.jsondata.promptList.push({}) - 1;
            // Save and regenerate
            generate(true, newPromptIndex);
        }, false);
    }

    window.addEventListener("load", init, false);
})();
