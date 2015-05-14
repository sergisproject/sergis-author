/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

// Globals: exportEnabled, game, makeCatch, removeFromString, parsePath,
// overlay, getOverlay, openPage, selectAll,
// checkJSON, swapGotos, decrementGotos, findRelatedPromptIndexes,
// generate, generateAndSave, updateAdvancedProperties

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
    owner: null,
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
    },
    lockedPrompts: {},
    ourLockedPrompts: {}
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
 * Remove a word from a string.
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
    var overlays;
    forClass("overlay_inner", function (overlay, index, overlays_array) {
        if (!overlays) overlays = overlays_array;
        if (overlayID && overlay.getAttribute("id") == overlayID) {
            overlay.style.display = "block";
            overlayShown = index;
        } else {
            overlay.style.display = "none";
        }
    });
    // Show/hide overlay container
    var className = removeFromString(byId("overlay").className, "hidden");
    if (overlayShown == -1) className += " hidden";
    byId("overlay").className = className;
    if (overlayShown > -1) overlays[overlayShown].scrollTop = 0;
}

/**
 * Get the currently shown overlay.
 *
 * @return {?string} The ID of the currently visible overlay.
 */
function getOverlay() {
    var overlayID = null;
    forClass("overlay_inner", function (overlay) {
        if (overlay.style.display != "none") overlayID = overlay.getAttribute("id");
    });
    return overlayID;
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
    var form = create("form", {
        target: target || "",
        action: pageData.url,
        method: pageData.method || "GET",
        enctype: pageData.enctype ||
            (!pageData.method || pageData.method.toLowerCase() == "get" ? "" : "application/x-www-form-urlencoded")
    });
    // Add the form to the page
    byId("openPageForms").appendChild(form);
    // Add any input elements
    if (pageData.data) {
        for (var paramName in pageData.data) {
            if (pageData.data.hasOwnProperty(paramName)) {
                form.appendChild(create("input", {
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
        options = byId("overlay_advancedProperties_general_onJumpBack").getElementsByTagName("option");
    for (var i = 0; i < options.length; i++) {
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
    json.promptList.forEach(function (item, promptIndex) {
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
        // If all aren't set and it's not the first prompt, set them to null
        // (indicating to use the values from the previous prompt)
        if (typeof item.prompt.map.latitude != "number" &&
            typeof item.prompt.map.longitude != "number" &&
            typeof item.prompt.map.zoom != "number" &&
            promptIndex !== 0) {
            
            // "Same as previous prompt"
            item.prompt.map.latitude = null;
            item.prompt.map.longitude = null;
            item.prompt.map.zoom = null;
        } else {
            if (typeof item.prompt.map.latitude != "number") {
                item.prompt.map.latitude = 0;
            }
            if (typeof item.prompt.map.longitude != "number") {
                item.prompt.map.longitude = 0;
            }
            if (typeof item.prompt.map.zoom != "number") {
                item.prompt.map.zoom = 3;
            }
        }
        
        // Check "prompt.map.frontendInfo"
        if (!item.prompt.map.frontendInfo) {
            item.prompt.map.frontendInfo = {};
        }
        
        // Check "prompt.buttons"
        if (!item.prompt.buttons) {
            item.prompt.buttons = {};
        }
        
        // Check "prompt.map.frontendInfo.*" and "prompt.map.buttons.*"
        for (var frontendName in AUTHOR.JSON.frontendInfo) {
            if (AUTHOR.JSON.frontendInfo.hasOwnProperty(frontendName)) {
                if (!item.prompt.map.frontendInfo[frontendName]) {
                    item.prompt.map.frontendInfo[frontendName] = {};
                }
                
                if (!item.prompt.buttons[frontendName]) {
                    item.prompt.buttons[frontendName] = {};
                }
            }
        }
        
        // Check "prompt.contents"
        if (!item.prompt.contents || !item.prompt.contents.length) {
            item.prompt.contents = [];
        }
        item.prompt.contents.forEach(function (content, index) {
            if (typeof content != "object") {
                content = item.prompt.contents[index] = {};
            }
            
            // Check "content.type"
            if (!content.type || !AUTHOR.JSON_CONTENT.contentTypes.hasOwnProperty(content.type)) {
                content.type = AUTHOR.JSON_CONTENT.DEFAULT_CONTENT_TYPE;
            }
        });
        
        // Check "prompt.choices" and "actionList"
        if (!item.prompt.choices || !item.prompt.choices.length) {
            item.prompt.choices = [];
        }
        if (!item.actionList || !item.actionList.length) {
            item.actionList = [];
        }
        // Choices and action list must have the same number of values
        var numChoices = Math.max(item.prompt.choices.length, item.actionList.length);
        var choice, actionListItem, i, j;
        for (i = 0; i < numChoices; i++) {
            choice = item.prompt.choices[i];
            if (typeof choice != "object" || !choice) {
                choice = item.prompt.choices[i] = {};
            }
            
            actionListItem = item.actionList[i];
            if (typeof actionListItem != "object" || !actionListItem) {
                actionListItem = item.actionList[i] = {};
            }
            
            // Check "choice.type"
            if (!choice.type || !AUTHOR.JSON_CONTENT.contentTypes.hasOwnProperty(choice.type)) {
                choice.type = AUTHOR.JSON_CONTENT.DEFAULT_CONTENT_TYPE;
            }
            
            // Check "actionListItem.actions"
            if (!actionListItem.actions || !actionListItem.actions.length) {
                actionListItem.actions = [];
            }
            // Check each one (starting from the end, in case we have to splice some out)
            for (j = actionListItem.actions.length - 1; j >= 0; j--) {
                if (!actionListItem.actions[j] || !actionListItem.actions[j].name) {
                    actionListItem.actions.splice(j, 1);
                } else {
                    // TODO: Migrate deprecated `goto` and `endGame` actions here
                    // Check "actionListItem.actions[j].data"
                    if (!actionListItem.actions[j].data || !actionListItem.actions[j].data.length) {
                        actionListItem.actions[j].data = [];
                    }
                }
            }
            
            // Check "actionListItem.pointValue"
            if (!actionListItem.pointValue) {
                actionListItem.pointValue = 0;
            }
        }
    });
}

/**
 * Swap 2 promptIndexes in any "goto" actions.
 *
 * @param {number} goto1 - The first promptIndex; swapped with `goto2`.
 * @param {number} goto2 - The second promptIndex; swapped with `goto1`.
 */
function swapGotos(goto1, goto2) {
    game.jsondata.promptList.forEach(function (promptItem) {
        promptItem.actionList.forEach(function (actionItem) {
            actionItem.actions.forEach(function (action) {
                if (action.name == "goto" && action.data && action.data.length) {
                    if (action.data[0] == goto1) {
                        action.data[0] = goto2;
                    } else if (action.data[0] == goto2) {
                        action.data[0] = goto1;
                    }
                }
            });
        });
    });
}

/**
 * Decrement all promptIndexes in any "goto" actions above a certain value.
 *
 * @param {number} leastIndex - Any promptIndexes that are less than OR EQUAL
 *        TO this value will NOT be decremented.
 *
 * @return {number} The number of occurrences of leastIndex (which, FYI, were
 *         NOT decremented).
 */
function decrementGotos(leastIndex) {
    var occurrences = 0;
    game.jsondata.promptList.forEach(function (promptItem) {
        promptItem.actionList.forEach(function (actionItem) {
            actionItem.actions.forEach(function (action) {
                if (action.name == "goto" && action.data && action.data.length) {
                    if (action.data[0] == leastIndex) {
                        occurrences += 1;
                    } else if (action.data[0] > leastIndex) {
                        action.data[0] -= 1;
                    }
                }
            });
        });
    });
    return occurrences;
}

/**
 * Enhance an array of prompt indexes by adding to it any prompt indexes that
 * are affected by any of the provided prompt indexes in the array.
 *
 * @param {Array.<number>} promptIndexes - The prompt indexes to find related
 *        ones for (this array is mutated by adding any other prompt indexes
 *        affected by the ones already in the array, then sorting the array).
 * @param {boolean} [repeatRecursively=false] - If the array is changed,
 *        continue performing the process until the array is not changed. (This
 *        means that if Prompt A is in the original list and it references
 *        Prompt B, then Prompt B is added to the list and any of its
 *        references; then, this is repeated until nothing new is added to the
 *        list.)
 */
function findRelatedPromptIndexes(promptIndexes, repeatRecursively) {
    var addedRelatedPromptIndexes = false;
    do {
        // Look through a copy of the original array
        promptIndexes.slice(0).forEach(function (promptIndex) {
            // Look through each choice for this prompt
            game.jsondata.promptList[promptIndex].actionList.forEach(function (actionItem) {
                // Look through each action for this choice
                actionItem.actions.forEach(function (action) {
                    // If this is a goto action, check its data
                    if (action.name == "goto" && action.data && action.data.length) {
                        // Found a goto action from a prompt in our list!
                        if (promptIndexes.indexOf(action.data[0]) == -1) {
                            // Add it to our list
                            promptIndexes.push(promptIndex);
                            if (repeatRecursively) {
                                // Mark that we changed the list so that we do all this again
                                addedRelatedPromptIndexes = true;
                            }
                        }
                    }
                });
            });
        });
    } while (addedRelatedPromptIndexes);
    // All done; sort the list
    promptIndexes.sort();
}

/**
 * Check the JSON data, update the export button and possibly update the table.
 *
 * @param {boolean} [updateTable] - Whether to update the table.
 * @param {number} [newCurrentPromptIndex] - A new current prompt index.
 */
function generate(updateTable, newCurrentPromptIndex) {
    // Make sure our data is good
    checkJSON();
    
    // Update our export button
    if (exportEnabled) {
        var a = byId("toolbar_export");
        a.setAttribute("download", AUTHOR.GAMES.getLabel() + ".json");
        a.setAttribute("href", AUTHOR.GAMES.getDataURI());
    }
    
    // Update "Preview Game" link
    // (if we have a clientPreviewURL but not a previewCurrentGame function on the backend)
    if (AUTHOR.CONFIG.clientPreviewURL && typeof AUTHOR.BACKEND.previewCurrentGame != "function") {
        byId("toolbar_preview").style.display = "block";
        byId("toolbar_preview").setAttribute("href",
            AUTHOR.CONFIG.clientPreviewURL + "#jsongamedata::" + encodeURIComponent(AUTHOR.GAMES.getJSON()));
    }
    
    // And, update the table (if needed)
    if (updateTable) {
        AUTHOR.TABLE.generateTable(newCurrentPromptIndex);
    }
}

/**
 * Check and save the JSON data, update the export button and (possibly) update
 * the table.
 *
 * @param {boolean} [updateTable] - Whether to update the table.
 * @param {number} [newCurrentPromptIndex] - A new current prompt index.
 * @param {string} [path] - An optional JSON path for the JSON data.
 *        (See http://sergisproject.github.io/docs/author.html)
 *
 * @return {Promise} Resolved when the game is saved.
 */
function generateAndSave(updateTable, newCurrentPromptIndex, path) {
    generate(updateTable, newCurrentPromptIndex);
    
    // Save with the backend
    // (Even though we're returning it, we're catching errors
    //  since most calls to this function ignore the return value)
    return AUTHOR.GAMES.saveGame(path).then(function () {
        // All good!
    }).catch(makeCatch(_("Error saving game")));
}

/**
 * Update all the items in the "Advanced Properties" overlay based on new JSON
 * data.
 */
function updateAdvancedProperties() {
    var json = game.jsondata;
    
    byId("overlay_advancedProperties_alwaysReinitializeMap").checked =
        !!json.alwaysReinitializeMap;
    
    // Layout stuff
    byId("overlay_advancedProperties_layout_disableSidebarResizing").checked =
        !!json.layout.disableSidebarResizing;
    byId("overlay_advancedProperties_layout_disableTranslucentSidebar").checked =
        !!json.layout.disableTranslucentSidebar;
    byId("overlay_advancedProperties_layout_showPromptNumber").checked =
        !!json.layout.showPromptNumber;
    byId("overlay_advancedProperties_layout_hidePromptTitle").checked =
        !!json.layout.hidePromptTitle;
    byId("overlay_advancedProperties_layout_hideScoringBreakdown").checked =
        !!json.layout.hideScoringBreakdown;
    
    byId("overlay_advancedProperties_layout_defaultSidebarWidthRatio").value =
        "" + json.layout.defaultSidebarWidthRatio;
    byId("overlay_advancedProperties_layout_defaultPopupMaxWidthRatio").value =
        "" + json.layout.defaultPopupMaxWidthRatio;
    
    // Jumping stuff
    byId("overlay_advancedProperties_general_jumpingBackAllowed").checked =
        !!json.jumpingBackAllowed;
    byId("overlay_advancedProperties_general_onJumpBack").value =
        json.onJumpBack;
    byId("overlay_advancedProperties_general_jumpingForwardAllowed").checked =
        !!json.jumpingForwardAllowed;
    byId("overlay_advancedProperties_general_showActionsInUserOrder").checked =
        !!json.showActionsInUserOrder;
    
    // Data URI conversion
    var canDoDataURIs = typeof Uint8Array != "undefined" && typeof Blob != "undefined" &&
        typeof AUTHOR.BACKEND.uploadFile == "function";
    byId("overlay_advancedProperties_convertDataURIs").style.display = canDoDataURIs ? "block" : "none";
}

(function () {
    /**
     * Convert any data URIs in the JSON to files on the server, then generate
     * and save.
     *
     * @return {Promise}
     */
    function convertFromDataURIs() {
        // Make sure we can
        var canDoDataURIs = typeof Uint8Array != "undefined" && typeof Blob != "undefined" &&
            typeof AUTHOR.BACKEND.uploadFile == "function";
        if (!canDoDataURIs) return;

        var previousOverlay = getOverlay();
        overlay("overlay_loading");
        
        // We need to lock actually ALL THE PROMPTS
        var promptIndexes = [];
        for (var i = 0; i < game.jsondata.promptList.length; i++) {
            promptIndexes.push(i);
        }
        
        var promises = [];
        return AUTHOR.GAMES.withLockedPrompts(promptIndexes, function () {
            console.log("Starting search for data URIs...");
            // Find all the properties with data URIs and upload them
            game.jsondata.promptList.forEach(function (promptItem, promptIndex) {
                // Check prompt contents
                promptItem.prompt.contents.forEach(function (contentItem, contentIndex) {
                    convertContentFromDataURI(promises, contentItem, promptIndex, "content" + contentIndex);
                });

                // Check prompt choices
                promptItem.prompt.choices.forEach(function (choiceItem, choiceIndex) {
                    convertContentFromDataURI(promises, choiceItem, promptIndex, "choice" + choiceIndex);
                });

                // Check prompt actions
                promptItem.actionList.forEach(function (actionItem, actionItemIndex) {
                    // Check all the actions in this action set
                    actionItem.actions.filter(function (action, actionIndex) {
                        return action && action.name == "explain" && action.data && action.data.length;
                    }).forEach(function (action, actionIndex) {
                        action.data.forEach(function (contentItem, contentItemIndex) {
                            convertContentFromDataURI(promises, contentItem, promptIndex, "action" + actionItemIndex + "." + actionIndex + "." + contentItemIndex);
                        });
                    });
                });
            });

            return Promise.all(promises).catch(makeCatch(_("Error converting data URIs")));
        }).then(function () {
            console.log("Done converting data URIs.");
            return generateAndSave(true);
        }).then(function () {
            // Restore overlay
            overlay(previousOverlay || undefined);
            // Tell the user what we did
            return askForOK(_("Converted {0} data URIs to files on the server.", promises.length));
        });
    }
    
    /**
     * Convert any data URIs in an individual content item.
     *
     * @param {Array} promises - An array to put the new Promises into that
     *        will be resolved after conversions are done.
     * @param {Object} contentItem - The SerGIS JSON Content Object to look in.
     * @param {number} promptIndex - The prompt index (for logging).
     * @param {string} subItemLabel - A sub-label below the prompt index (for
     *        logging).
     */
    function convertContentFromDataURI(promises, contentItem, promptIndex, subItemLabel) {
        var contentType = AUTHOR.JSON_CONTENT.contentTypes.hasOwnProperty(contentItem.type) ? contentItem.type :
            AUTHOR.JSON_CONTENT.DEFAULT_CONTENT_TYPE;
        
        // Get all the fields for this content type
        AUTHOR.JSON_CONTENT.contentTypes[contentType].fields.forEach(function (field) {
            var name = field[0], label = field[1], fieldType = field[2];
            if (fieldType == "string_file") {
                // Found a file!
                // Does it contain a data URI?
                if (contentItem[name] && typeof contentItem[name] == "string" &&
                    contentItem[name].substring(0, 5) == "data:") {
                    // Yes, it does!
                    console.log("Found data URI at prompt " + promptIndex + " (" + subItemLabel + ").");
                    // Wipe the filename, if present
                    if (contentItem._sergis_author_data && contentItem._sergis_author_data.filename) {
                        delete contentItem._sergis_author_data.filename;
                    }
                    // Convert this shit
                    promises.push(AUTHOR.BACKEND.uploadFile(convertDataURIToBlob(contentItem[name])).then(function (fileURL) {
                        console.log("Successfully converted data URI for prompt " + promptIndex + " (" + subItemLabel + ").");
                        // Store this new info in the content item
                        contentItem[name] = fileURL;
                    }));
                }
            }
        });
    }

    /**
     * Convert a data URI (either base64 encoded or URL encoded) to a Blob.
     * base64 = data:mime/type;base64,bytes
     * URL encoded = data:mime/type,bytes
     *
     * @param {string} dataURI - The complete data URI to convert.
     *
     * @return {Blob} A Blob representing this data URI.
     */
    function convertDataURIToBlob(dataURI) {
        if (dataURI.substring(0, 5) == "data:") {
            dataURI = dataURI.substring(5);
        }
        
        var mimeString = dataURI.substring(0, dataURI.indexOf(","));
        var byteString = dataURI.substring(dataURI.indexOf(",") + 1);
        if (mimeString.slice(-7) == ";base64") {
            mimeString = mimeString.slice(0, -7);
            byteString = atob(byteString);
        } else {
            byteString = unescape(byteString);
        }
        
        // Write the bytes to a typed array
        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        
        // Make a new Blob
        return new Blob([ia], {
            type: mimeString
        });
    }

    /**
     * Initialize the "Advanced Properties" overlay.
     */
    function initAdvancedProperties() {
        // The checkboxes for some layout properties
        ["disableSidebarResizing", "disableTranslucentSidebar", "showPromptNumber", "hidePromptTitle", "hideScoringBreakdown"].forEach(function (layoutProp) {
            byId("overlay_advancedProperties_layout_" + layoutProp).addEventListener("change", function (event) {
                game.jsondata.layout[layoutProp] = this.checked;
                // Save the game
                generateAndSave(undefined, undefined, "layout");
            }, false);
        });
        
        // The number inputs for some layout properties
        ["defaultSidebarWidthRatio", "defaultPopupMaxWidthRatio"].forEach(function (layoutProp) {
            byId("overlay_advancedProperties_layout_" + layoutProp).addEventListener("change", makeNumberHandler([0, 1], function (event, value) {
                if (value === null) {
                    // Set it to 0 so it will plug in the default
                    game.jsondata.layout[layoutProp] = 0;
                } else {
                    game.jsondata.layout[layoutProp] = value;
                }
                // Save the game
                generateAndSave(undefined, undefined, "layout");
            }), false);
        });
        
        // "Always Reinitialize Map" checkbox
        byId("overlay_advancedProperties_alwaysReinitializeMap").addEventListener("change", function (event) {
            game.jsondata.alwaysReinitializeMap = this.checked;
            // Save the game and update the table
            generateAndSave(true, undefined, "alwaysReinitializeMap");
        }, false);
        
        // "Jumping Back Allowed" checkbox
        byId("overlay_advancedProperties_general_jumpingBackAllowed").addEventListener("change", function (event) {
            game.jsondata.jumpingBackAllowed = this.checked;
            // Save the game
            generateAndSave(undefined, undefined, "jumpingBackAllowed");
        }, false);
        
        // "On Jump Back" select
        byId("overlay_advancedProperties_general_onJumpBack").addEventListener("change", function (event) {
            game.jsondata.onJumpBack = this.value;
            // Save the game
            generateAndSave(undefined, undefined, "onJumpBack");
        }, false);
        
        // "Jumping Forward Allowed" checkbox
        byId("overlay_advancedProperties_general_jumpingForwardAllowed").addEventListener("change", function (event) {
            game.jsondata.jumpingForwardAllowed = this.checked;
            // Save the game
            generateAndSave(undefined, undefined, "jumpingForwardAllowed");
        }, false);
        
        // "Show Actions In User Order" checkbox
        byId("overlay_advancedProperties_general_showActionsInUserOrder").addEventListener("change", function (event) {
            game.jsondata.showActionsInUserOrder = this.checked;
            // Save the game
            generateAndSave(undefined, undefined, "showActionsInUserOrder");
        }, false);
        
        
        // "Convert JSON data URIs to files on server" button
        byId("overlay_advancedProperties_convertDataURIs_to").addEventListener("click", function (event) {
            convertFromDataURIs().catch(makeCatch(_("Error converting data URIs to files")));
        }, false);
    }
    
    /**
     * Initialize everything.
     */
    function init() {
        // Links in header
        if (AUTHOR.CONFIG.links && AUTHOR.CONFIG.links.length) {
            var linkbar = byId("links");
            AUTHOR.CONFIG.links.forEach(function (link) {
                linkbar.appendChild(create("a", {
                    text: link.name,
                    href: link.href
                }));
            });
            linkbar.style.display = "block";
        }
        
        // Version number in footer
        byId("version_inner").appendChild(document.createTextNode("" + SERGIS_PROMPT_AUTHOR_VERSION));
        byId("version_outer").style.display = "inline";
        
        // "View JSON" button
        byId("viewjson").addEventListener("click", function (event) {
            event.preventDefault();
            byId("overlay_viewjson_content").innerHTML = "";
            byId("overlay_viewjson_content").appendChild(document.createTextNode(AUTHOR.GAMES.getJSON(2)));
            overlay("overlay_viewjson");
        }, false);
        
        // "Export" button (if base64 and data URIs are supported)
        if (exportEnabled) {
            byId("toolbar_export").style.display = "block";
            // Message if <a download="..."> isn't supported
            if (typeof document.createElement("a").download == "undefined") {
                byId("toolbar_export").addEventListener("click", function (event) {
                    event.preventDefault();
                    alert(_("Right-click this button, select \"Save Link As\" or \"Save Target As\", and name the file something like \"name.json\""));
                }, false);
            }
        }
        
        // "Preview" button
        if (AUTHOR.CONFIG.clientPreviewURL || typeof AUTHOR.BACKEND.previewCurrentGame == "function") {
            // Show the button
            byId("toolbar_preview").style.display = "block";
            // If the backend has `previewCurrentGame`, set that up
            if (typeof AUTHOR.BACKEND.previewCurrentGame == "function") {
                byId("toolbar_preview").addEventListener("click", function (event) {
                    event.preventDefault();
                    overlay("overlay_loading");
                    var doPreview = function () {
                        AUTHOR.BACKEND.previewCurrentGame().then(function (pageData) {
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
        if (typeof AUTHOR.BACKEND.publishCurrentGame == "function") {
            byId("toolbar_publish").style.display = "block";
            byId("toolbar_publish").addEventListener("click", function (event) {
                event.preventDefault();
                overlay("overlay_loading");
                AUTHOR.BACKEND.publishCurrentGame().then(function (pageData) {
                    overlay("overlay_publish");
                    openPage(pageData, "overlay_publish_iframe");
                }).catch(makeCatch(_("Error getting publish page")));
            }, false);
        }
        
        // Close button in Publish overlay
        byId("overlay_publish_close").addEventListener("click", function (event) {
            event.preventDefault();
            overlay();
        }, false);
        
        // "Advanced" button
        byId("toolbar_view").addEventListener("click", function (event) {
            event.preventDefault();
            overlay("overlay_advancedProperties");
        }, false);
        
        // Close button in Advanced overlay
        byId("overlay_advancedProperties_close").addEventListener("click", function (event) {
            event.preventDefault();
            overlay();
        }, false);
        
        // Advanced Properties overlay
        initAdvancedProperties();
        
        // "View JSON" overlay:
        // "Select All" button
        if (typeof document.body.createTextRange == "function" || typeof window.getSelection == "function") {
            byId("overlay_viewjson_selectall").style.display = "block";
            byId("overlay_viewjson_selectall_link").addEventListener("click", function (event) {
                event.preventDefault();
                selectAll(byId("overlay_viewjson_content"));
            }, false);
        }
        // "Close" button
        byId("overlay_viewjson_close").addEventListener("click", function (event) {
            event.preventDefault();
            overlay();
        }, false);
        
        
        // "Expand All Prompts" checkbox
        byId("expandAllPrompts").addEventListener("change", function (event) {
            AUTHOR.TABLE.setExpandAllPrompts(this.checked);
        }, false);
        byId("expandAllPrompts").checked = false;
        
        // "Add Prompt" button
        byId("addPrompt").addEventListener("click", function (event) {
            event.preventDefault();
            var newPromptIndex = game.jsondata.promptList.push({}) - 1;
            // Save and regenerate
            generateAndSave(true, newPromptIndex, "promptList." + newPromptIndex);
        }, false);
    }

    window.addEventListener("load", init, false);
})();
