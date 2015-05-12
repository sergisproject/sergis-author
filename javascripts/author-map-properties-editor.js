/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

// This file handles the Map Properties (i.e. frontend info) overlay.

AUTHOR.MAP_PROPERTIES_EDITOR = {
    /* editMapProperties */
};

(function () {
    /**
     * The current state of the Map Properties Editor.
     *
     * @property {number} promptIndex - The promptIndex of the prompt whose
     *           frontend info we're editing.
     */
    var editor_state = {
        promptIndex: null
    };
    
    AUTHOR.MAP_PROPERTIES_EDITOR.editMapProperties = function (promptIndex) {
        overlay("overlay_loading");
        // Try to lock the prompt
        AUTHOR.GAMES.lockPrompts(promptIndex).then(function (isSuccessful) {
            if (isSuccessful) {
                // All good!
                openEditor(promptIndex);
            } else {
                // Not good :(
                overlay();
            }
        }).catch(makeCatch(_("Error locking prompt")));
    };
    
    /**
     * Load and open the editor.
     */
    function openEditor(promptIndex) {
        editor_state.promptIndex = promptIndex;
        updateMapPropertiesEditor();
        overlay("overlay_editMapProperties");
    }
    
    /**
     * Close the editor.
     */
    function closeEditor() {
        overlay("overlay_loading");
        // Save and regenerate
        generateAndSave(true, "promptList." + editor_state.promptIndex + ".prompt").then(function () {
            // Try to unlock the prompt
            return AUTHOR.GAMES.unlockPrompts(editor_state.promptIndex);
        }).then(function () {
            // All done; close the editor
            overlay();
        }).catch(makeCatch(_("Error unlocking prompt")));
    }
    
    /**
     * Reset the editor.
     */
    function resetEditor() {
        // Reset our target frontend info
        game.jsondata.promptList[editor_state.promptIndex].prompt.map.frontendInfo = {};
        game.jsondata.promptList[editor_state.promptIndex].prompt.buttons = {};
        checkJSON();
        // Re-open the editor
        openEditor(editor_state.promptIndex);
    }
    
    /**
     * Make fields for a particular frontend info property.
     *
     * @param {Array|Object} fields - Either an array of SERGIS_JSON_... objects
     *        or a single one. (See author-json.js)
     * @param {Element} container - The HTML container element.
     * @param {string} frontendName - The name of the frontend that this
     *        property belongs to.
     * @param {string} frontendInfoName - The name of this specific property.
     */
    function makeProperty(fields, container, frontendName, frontendInfoName) {
        var frontendBase = game.jsondata.promptList[editor_state.promptIndex].prompt.map.frontendInfo[frontendName];
        
        fields = fields.getFields(frontendBase[frontendInfoName]);
        if (!Array.isArray(fields)) {
            // Let's assume that it's not an array
            var field = fields;
            container.appendChild(field.getElement(function () {
                frontendBase[frontendInfoName] = field.getJSONValue();
            }));
        } else {
            // Let's assume that it's an array
            if (!frontendBase[frontendInfoName]) frontendBase[frontendInfoName] = [];
            if (frontendBase[frontendInfoName].length === 0) frontendBase[frontendInfoName].push(null);
            
            fields.forEach(function (field, index) {
                if (field == "repeat") return;
                container.appendChild(field.getElement(function () {
                    frontendBase[frontendInfoName][index] = field.getJSONValue();
                }));
            });

            // If we ended in a repeatable field, take care of that
            if (fields.length && fields[fields.length - 1] == "repeat") {
                // Create a <p> with a <button> inside
                container.appendChild(create("p").create("button", {
                    text: "Add More..."
                }, function (event) {
                    frontendBase[frontendInfoName].push(null);
                    updateMapPropertiesEditor();
                }));
            }
        }
    }
    
    /**
     * Make fields for a particular frontend button.
     *
     * @param {Object} buttonInfo - An object with "id", "label", and
     *        optionally "tooltip".
     * @param {Element} tbody - The HTML tbody container element.
     * @param {string} frontendName - The name of the frontend that this
     *        property belongs to.
     */
    function makeButtonProperty(buttonInfo, tbody, frontendName) {
        var id = "id_" + randID();
        var tr = create("tr");
        
        // Make label column
        tr.appendChild(create("td").create("label", {
            "for": id,
            text: buttonInfo.label,
            title: buttonInfo.tooltip || undefined
        }));
        
        var buttonsObj = game.jsondata.promptList[editor_state.promptIndex].prompt.buttons[frontendName];
        if (!buttonsObj[buttonInfo.id]) {
            buttonsObj[buttonInfo.id] = {};
        }
        
        // Make select dropdown
        var select = create("select", {
            id: id,
            title: buttonInfo.tooltip || undefined
        }, function (event) {
            var isUndefined = !this.value;
            if (!this.value) {
                // They both need to be undefined
                buttonsObj[buttonInfo.id].disabled = undefined;
                buttonsObj[buttonInfo.id].hidden = undefined;
            } else {
                // Set "disabled" and "hidden"
                buttonsObj[buttonInfo.id].disabled = this.value == "disabled";
                buttonsObj[buttonInfo.id].hidden = this.value == "hidden";
            }
        });
        
        // Create the options for the select
        var curDisabled = buttonsObj[buttonInfo.id].disabled,
            curHidden   = buttonsObj[buttonInfo.id].hidden,
            curUndefined = curDisabled === undefined && curHidden === undefined;
        select.appendChild(create("option", {
            value: "",
            text: "Same as previous prompt",
            selected: curUndefined ? "selected" : undefined
        }));
        select.appendChild(create("option", {
            value: "enabled",
            text: "Enabled",
            selected: (!curUndefined && !curDisabled && !curHidden) ? "selected" : undefined
        }));
        select.appendChild(create("option", {
            value: "disabled",
            text: "Disabled",
            selected: curDisabled ? "selected" : undefined
        }));
        select.appendChild(create("option", {
            value: "hidden",
            text: "Disabled and Hidden",
            selected: curHidden ? "selected" : undefined
        }));
        
        // Add select in another table column
        tr.appendChild(create("td", [select]));
        tbody.appendChild(tr);
    }
    
    /**
     * Update the Map Properties editor.
     */
    function updateMapPropertiesEditor() {
        // Remove the old fields
        var container = byId("overlay_editMapProperties_contentContainer");
        container.innerHTML = "";
        
        var localFrontendName, frontendInfoName, i, bigdiv, div, littlediv, table, tbody;
        
        // Make the frontend info and button visibility fields
        for (var frontendName in AUTHOR.JSON.frontendInfo) {
            if (AUTHOR.JSON.frontendInfo.hasOwnProperty(frontendName)) {
                // Get the localized name for the frontend
                localFrontendName = AUTHOR.JSON.frontendNames[frontendName] || frontendName;
                
                // Make a title for the frontend
                container.appendChild(create("h3", {
                    text: localFrontendName
                }));
                
                // Make a container for this frontend's stuff
                bigdiv = create("div", {
                    className: "columns"
                });
                
                // Make the frontend info fields
                div = create("div", {
                    className: "column-left"
                });
                for (frontendInfoName in AUTHOR.JSON.frontendInfo[frontendName]) {
                    if (AUTHOR.JSON.frontendInfo[frontendName].hasOwnProperty(frontendInfoName)) {
                        makeProperty(AUTHOR.JSON.frontendInfo[frontendName][frontendInfoName], div,
                                    frontendName, frontendInfoName);
                    }
                }
                bigdiv.appendChild(div);
                
                // Make the button visibility fields (if applicable)
                if (AUTHOR.JSON.frontendButtons.hasOwnProperty(frontendName) &&
                    AUTHOR.JSON.frontendButtons[frontendName].length) {
                    tbody = create("tbody");
                    for (i = 0; i < AUTHOR.JSON.frontendButtons[frontendName].length; i++) {
                        makeButtonProperty(AUTHOR.JSON.frontendButtons[frontendName][i], tbody,
                                           frontendName);
                    }
                    
                    // div.column-right > div.box > (h4,table.noborder)
                    bigdiv.appendChild(create("div", {
                        className: "column-right"
                    }).create("div", {
                        className: "box"
                    }, [// Children...

                        // Title
                        create("h4", {
                            text: _("Toolbar Buttons")
                        }),

                        // Table
                        create("table", {
                            className: "noborder"
                        }, [tbody])
                    ]));
                }
                
                // Append the stuff for this frontend to the overall container
                container.appendChild(bigdiv);
                
                // Make a divider
                container.appendChild(create("hr"));
            }
        }
    }
    
    /**
     * Initialize the Map Properties editor overlay.
     */
    function initMapPropertiesEditor() {
        // Set up Reset button
        byId("overlay_editMapProperties_reset").addEventListener("click", function (event) {
            event.preventDefault();
            resetEditor();
        }, false);
        
        // Set up Close button
        byId("overlay_editMapProperties_close").addEventListener("click", function (event) {
            event.preventDefault();
            closeEditor();
        }, false);
    }
    
    window.addEventListener("load", initMapPropertiesEditor, false);
})();
