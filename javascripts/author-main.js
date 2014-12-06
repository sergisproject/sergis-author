/*
    The SerGIS Project - sergis-author

    Copyright (c) 2014, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
 */

// Globals: json, overlay, c, checkJSON, swapGotos, decrementGotos, generate, readJSONFile

/**
 * The current state of the SerGIS JSON Game Data that we're working on.
 */
var json = {
    name: "",
    author: "",
    generator: "",
    jumpingBackAllowed: false,
    onJumpBack: "",
    jumpingForwardAllowed: false,
    showActionsInUserOrder: false,
    promptList: [{}]
};

/**
 * Show/hide a big overlay (see #overlay in index.html).
 *
 * @param {string} [overlayID] - The ID of the overlay to show. If not
 *        provided, hides all overlays.
 */
function overlay(overlayID) {
    // Hide all overlays, but show the one we want (if applicable)
    var overlayShown = false;
    var overlays = document.getElementsByClassName("overlay_inner");
    for (var i = 0; i < overlays.length; i++) {
        if (overlayID && overlays[i].getAttribute("id") == overlayID) {
            overlays[i].style.display = "block";
            overlayShown = true;
        } else {
            overlays[i].style.display = "none";
        }
    }
    // Show/hide overlay container
    document.getElementById("overlay").style.display = overlayShown ? "block" : "none";
}

/**
 * Create a new DOM element.
 *
 * @param {string} elem - The tag name of the element to create.
 * @param {Object.<string, string>} [attributes] - Any DOM attributes for the
 *        element. Also can include some special properties:
 *        "class" or "className" --> CSS class(es) for the element,
 *        "text" or "textContent" --> Text content for the element
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
                } else {
                    elem.setAttribute(prop, "" + attributes[prop]);
                }
            }
        }
    }
    
    // Apply event handler
    if (event) {
        var args = Array.prototype.slice.call(arguments, 3),
            event = NEEDS_ONCHANGE.indexOf(elem.nodeName.toLowerCase()) == -1 ? "click" : "change";
        elem.addEventListener(event, function (event) {
            event.apply(this, [event].concat(args));
        }, false);
    }
    
    // Return the created element
    return elem;
}

/**
 * Checks properties in the SerGIS JSON Game Data, possibly filling in default
 * values to make sure it doesn't lead to errors later.
 */
function checkJSON() {
    var i, item, j, k;
    
    // Check "generator"
    json.generator = "SerGIS Prompt Author v" + SERGIS_PROMPT_AUTHOR_VERSION;
    
    // Check "onJumpBack"
    var onJumpBackValues = [],
        options = document.getElementById("general_onJumpBack").getElementsByTagName("option");
    for (i = 0; i < options.length; i++) {
        onJumpBackValues.push(options[i].getAttribute("value"));
    }
    if (onJumpBackValues.indexOf(json.onJumpBack) == -1) {
        json.onJumpBack = "";
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
            if (!item.prompt.contents[j].type || !AUTHOR_JSON.contentTypes.hasOwnProperty(item.prompt.contents[j].type)) {
                item.prompt.contents[j].type = AUTHOR_JSON.defaultContentType;
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
            if (!item.prompt.choices[j].type || !AUTHOR_JSON.contentTypes.hasOwnProperty(item.prompt.choices[j].type)) {
                item.prompt.choices[j].type = AUTHOR_JSON.defaultContentType;
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
    for (i = 0; i < json.promptList.length; i++) {
        actionList = json.promptList[i].actionList;
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
    var occurrences = 0;
    for (i = 0; i < json.promptList.length; i++) {
        actionList = json.promptList[i].actionList;
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
 * Check the JSON data, then update the save button and (possibly) update the
 * table.
 *
 * @param {boolean} [updateTable] - Whether to update the table.
 */
function generate(updateTable) {
    // Make sure our data is good
    checkJSON();
    // And our save button
    var a = document.getElementById("downloads_save");
    a.setAttribute("download", _("SerGIS Data") + " " + icu.getDateFormat("SHORT").format(new Date()) + ".json");
    a.setAttribute("href", "data:application/json;base64," + btoa(JSON.stringify(json, null, 2)));
    // And, update the table (if needed)
    if (updateTable) AUTHOR_TABLE.initTable();
}

/**
 * Read a JSON file.
 *
 * @param {File} file - The file to attempt to read.
 */
function readJSONFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
        if (reader.result) {
            var result;
            try {
                result = JSON.parse(reader.result);
            } catch (err) {}
            if (result) {
                // Hide instructions; show "Loaded from filename.json"
                document.getElementById("instructions").style.display = "none";
                document.getElementById("loadedFrom_filename").textContent = file.name;
                document.getElementById("loadedFrom").style.display = "block";
                // Store the new JSON
                json = result;
                // Check the new JSON
                checkJSON();
                // Set the values for the General Properties
                document.getElementById("general_name").value = json.name || "";
                document.getElementById("general_author").value = json.author || "";
                document.getElementById("general_jumpingBackAllowed").checked = !!json.jumpingBackAllowed;
                document.getElementById("general_onJumpBack").value = json.onJumpBack;
                document.getElementById("general_jumpingForwardAllowed").checked = !!json.jumpingForwardAllowed;
                document.getElementById("general_showActionsInUserOrder").checked = !!json.showActionsInUserOrder;
                // Regenerate the table and update the save button
                generate(true);
                // Scroll up to the top of the page
                window.scrollTo(0, 0);
            } else {
                alert(_("Error reading file!\nDetails: Could not parse JSON."));
            }
        } else {
            alert(_("Error reading file!\nDetails: File is empty or unreadable."));
        }
    };
    reader.onerror = function () {
        alert(_("Error reading file!\nDetails: " + reader.error));
    };
    reader.readAsText(file);
}

(function () {
    /**
     * Initialize everything.
     */
    function init() {
        // Version number in footer
        document.getElementById("version_inner").appendChild(document.createTextNode("" + SERGIS_PROMPT_AUTHOR_VERSION));
        document.getElementById("version_outer").style.display = "inline";
        
        // "Open" button (if FileReader is supported)
        if (typeof FileReader != "function") {
            document.getElementById("downloads_open").style.visibility = "hidden";
        } else {
            document.getElementById("downloads_open").addEventListener("click", function (event) {
                event.preventDefault();
                document.getElementById("fileinput").click();
            }, false);
            document.getElementById("fileinput").addEventListener("change", function (event) {
                if (event.target.files && event.target.files.length > 0) {
                    var file = event.target.files[0];
                    var ext = file.name.substring(file.name.lastIndexOf(".") + 1).toLowerCase();
                    if (ext != "json") {
                        alert(_("Invalid file!\nPlease select a *.json file."));
                    } else {
                        readJSONFile(file);
                    }
                }
            }, false);
        }
        
        // "Save" button (if <a download="..."> isn't supported)
        if (typeof document.createElement("a").download == "undefined") {
            document.getElementById("downloads_save").addEventListener("click", function (event) {
                alert(_("Right-click this button, select \"Save Link As\" or \"Save Target As\", and name the file something like \"name.json\""));
                event.preventDefault();
            }, false);
        }
        
        // "Add Prompt" button
        document.getElementById("addPrompt").addEventListener("click", function (event) {
            event.preventDefault();
            json.promptList.push({});
            // Regenerate the table and update the save button
            generate(true);
        }, false);
        
        // "Prompt Set Name" textbox
        document.getElementById("general_name").addEventListener("change", function (event) {
            json.name = this.value;
            // Update the save button
            generate();
        }, false);
        
        // "Prompt Set Author" textbox
        document.getElementById("general_author").addEventListener("change", function (event) {
            json.author = this.value;
            // Update the save button
            generate();
        }, false);
        
        // "Jumping Back Allowed" checkbox
        document.getElementById("general_jumpingBackAllowed").addEventListener("change", function (event) {
            json.jumpingBackAllowed = this.checked;
            // Update the save button
            generate();
        }, false);
        
        // "On Jump Back" select
        document.getElementById("general_onJumpBack").addEventListener("change", function (event) {
            json.onJumpBack = this.value;
            // Update the save button
            generate();
        }, false);
        
        // "Jumping Forward Allowed" checkbox
        document.getElementById("general_jumpingForwardAllowed").addEventListener("change", function (event) {
            json.jumpingForwardAllowed = this.checked;
            // Update the save button
            generate();
        }, false);
        
        // "Show Actions In User Order" checkbox
        document.getElementById("general_showActionsInUserOrder").addEventListener("change", function (event) {
            json.showActionsInUserOrder = this.checked;
            // Update the save button
            generate();
        }, false);
        
        // Make our JSON defaults and generate the default table
        generate(true);
        
        // Get rid of loading sign
        overlay();
    }

    window.addEventListener("load", init, false);
    // NOTE: author-table.js and author-editor.js also have "window load" event listeners.
})();
