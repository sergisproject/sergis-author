/*
    The SerGIS Project - sergis-author

    Copyright (c) 2014, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
 */

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
 * Shortcut to create an element.
 */
function c(elem, attributes, onclick_or_change /*, [onclick parameter, [onclick parameter, [...]]] */) {
    var NEEDS_ONCHANGE = ["input", "select", "textarea"];
    
    elem = document.createElement(elem);
    if (attributes) {
        for (var prop in attributes) {
            if (attributes.hasOwnProperty(prop)) {
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
    if (onclick_or_change) {
        var args = Array.prototype.slice.call(arguments, 3),
            event = NEEDS_ONCHANGE.indexOf(elem.nodeName.toLowerCase()) == -1 ? "click" : "change";
        elem.addEventListener(event, function (event) {
            onclick_or_change.apply(this, [event].concat(args));
        }, false);
    }
    return elem;
}

/**
 * Fill in default values in the SerGIS JSON Game Data to make sure it doesn't
 * lead to errors later.
 */
function checkJSON() {
    var i, item, j, k;
    // Check "generator"
    if (!json.generator) {
        json.generator = "SerGIS Prompt Author v" + SERGIS_PROMPT_AUTHOR_VERSION;
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
        if (typeof item.prompt.title != "string") {
            item.prompt.title = "";
        }
        if (!item.prompt.map) {
            item.prompt.map = {};
        }
        if (!item.prompt.contents || !item.prompt.contents.length) {
            item.prompt.contents = [];
        }
        if (!item.prompt.choices || !item.prompt.choices.length) {
            item.prompt.choices = [];
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
 * Re-generate or save the JSON data.
 */
function generate(updateTable) {
    // Make sure our data is good
    checkJSON();
    // And our save button
    updateSaveLink();
    // Update the table (if needed)
    if (updateTable) initTable();
}

/**
 * Read a JSON file.
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
                document.getElementById("instructions").style.display = "none";
                document.getElementById("loadedFrom_filename").textContent = file.name;
                document.getElementById("loadedFrom").style.display = "block";
                json = result;
                generate(true);
                window.scrollTo(0, 0);
            } else {
                alert("Error reading file!\nDetails: Could not parse JSON.");
            }
        } else {
            alert("Error reading file!\nDetails: File is empty or unreadable.");
        }
    };
    reader.onerror = function () {
        alert("Error reading file!\nDetails: " + reader.error);
    };
    reader.readAsText(file);
}

/**
 * Update the link to download the JSON file.
 */
function updateSaveLink() {
    var a = document.getElementById("downloads_save");
    var d = new Date();
    a.setAttribute("download", "SerGIS Data " + d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + ".json");
    a.setAttribute("href", "data:application/json;base64," + btoa(JSON.stringify(json, null, 2)));
}

var supportPageOffset = window.pageXOffset !== undefined;
var isCSS1Compat = ((document.compatMode || "") === "CSS1Compat");

/**
 * Check the scrolling.
 */
function checkScroll() {
    var tbl = document.getElementById("promptContainer").childNodes[0];
    if (tbl) {
        var thead;
        for (var i = 0; i < tbl.childNodes.length; i++) {
            if (tbl.childNodes[i].nodeName.toLowerCase() == "thead") {
                thead = tbl.childNodes[i];
                break;
            }
        }
        // Find the amount that the window is scrolled
        var scrollY = supportPageOffset
            ? window.pageYOffset
            : isCSS1Compat
                ? document.documentElement.scrollTop
                : document.body.scrollTop;
        // Find out how far the table is from the top
        var elem = tbl;
        var offsetY = elem.offsetTop;
        while (elem = elem.offsetParent) {
            offsetY += elem.offsetTop || 0;
        }
        // Check if we should be .scrollFixed
        var i = tbl.className.indexOf("scrollFixed");
        if (scrollY >= offsetY) {
            if (i == -1) {
                // Make sure the header cells stay the same width
                thead.style.width = thead.offsetWidth + "px";
                var kids = tbl.getElementsByTagName("th");
                for (var j = 0; j < kids.length; j++) {
                    kids[j].style.width = kids[j].offsetWidth + "px";
                }
                tbl.className += " scrollFixed";
            }
        } else if (i != -1) {
            // We shouldn't be; let's remove the class
            tbl.className = tbl.className.substring(0, i) + tbl.className.substring(i + 11);
        }
    }
}

/**
 * Initialize everything.
 */
function init() {
    // "Open" button
    document.getElementById("downloads_open").addEventListener("click", function (event) {
        event.preventDefault();
        document.getElementById("fileinput").click();
    }, false);
    document.getElementById("fileinput").addEventListener("change", function (event) {
        if (event.target.files && event.target.files.length > 0) {
            var file = event.target.files[0];
            var ext = file.name.substring(file.name.lastIndexOf(".") + 1).toLowerCase();
            if (ext != "json") {
                alert("Invalid file!\nPlease select a *.json file.");
            } else {
                readJSONFile(file);
            }
        }
    }, false);
    
    // "Save" button (if <a download="..."> isn't supported)
    if (typeof document.createElement("a").download == "undefined") {
        document.getElementById("downloads_save").addEventListener("click", function (event) {
            alert("Right-click this button, select \"Save Link As\" or \"Save Target As\", and name the file something like \"name.json\"");
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
    
    // Set up table header for scrolling
    window.addEventListener("scroll", function (event) {
        checkScroll();
    }, false);
    checkScroll();
    
    // Make our JSON defaults and generate the default table
    generate(true);
}

window.addEventListener("load", init, false);
