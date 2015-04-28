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
        editor_state.promptIndex = promptIndex;
        updateMapPropertiesEditor();
        overlay("overlay_editMapProperties");
    };
    
    /**
     * Close the editor.
     */
    function closeEditor() {
        // Close the editor
        overlay();
        // Save and regenerate
        generate(true);
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
        AUTHOR.MAP_PROPERTIES_EDITOR.editMapProperties(editor_state.promptIndex);
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
        var isArray = (typeof Array.isArray == "function") ? Array.isArray
                      : function (arr) { return typeof arr.length == "number"; };
        var frontendBase = game.jsondata.promptList[editor_state.promptIndex].prompt.map.frontendInfo[frontendName];
        
        fields = fields.getFields(frontendBase[frontendInfoName]);
        if (!isArray(fields)) {
            // Let's assume that it's not an array
            var field = fields;
            container.appendChild(field.getElement(function () {
                frontendBase[frontendInfoName] = field.getJSONValue();
            }));
        } else {
            // Let's assume that it's an array
            if (!frontendBase[frontendInfoName]) frontendBase[frontendInfoName] = [];
            if (frontendBase[frontendInfoName].length === 0) frontendBase[frontendInfoName].push(null);
            
            for (var i = 0; i < fields.length; i++) {
                if (fields[i] == "repeat") continue;
                (function (i) {
                    container.appendChild(fields[i].getElement(function () {
                        frontendBase[frontendInfoName][i] = fields[i].getJSONValue();
                    }));
                })(i);
            }

            // If we ended in a repeatable field, take care of that
            if (fields.length && fields[fields.length - 1] == "repeat") {
                var p = c("p");
                p.appendChild(c("button", {
                    text: "Add More..."
                }, function (event) {
                    frontendBase[frontendInfoName].push(null);
                    updateMapPropertiesEditor();
                }));
                container.appendChild(p);
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
        var tr = c("tr"),
            td;
        
        td = c("td");
        td.appendChild(c("label", {
            "for": id,
            text: buttonInfo.label,
            title: buttonInfo.tooltip || undefined
        }));
        tr.appendChild(td);
        
        var buttonsObj = game.jsondata.promptList[editor_state.promptIndex].prompt.buttons[frontendName];
        if (!buttonsObj[buttonInfo.id]) {
            buttonsObj[buttonInfo.id] = {};
        }
        
        var select = c("select", {
            id: id,
            title: buttonInfo.tooltip || undefined
        }, function (event) {
            buttonsObj[buttonInfo.id] = {
                disabled: this.value == "disabled",
                hidden: this.value == "hidden"
            };
        });
        select.appendChild(c("option", {
            value: "",
            text: "Enabled",
            selected: (!buttonsObj[buttonInfo.id].disabled && !buttonsObj[buttonInfo.id].hidden) ? "selected" : undefined
        }));
        select.appendChild(c("option", {
            value: "disabled",
            text: "Disabled",
            selected: buttonsObj[buttonInfo.id].disabled ? "selected" : undefined
        }));
        select.appendChild(c("option", {
            value: "hidden",
            text: "Disabled and Hidden",
            selected: buttonsObj[buttonInfo.id].hidden ? "selected" : undefined
        }));
        
        td = c("td");
        td.appendChild(select);
        tr.appendChild(td);
        tbody.appendChild(tr);
    }
    
    /**
     * Update the Map Properties editor.
     */
    function updateMapPropertiesEditor() {
        // Remove the old fields
        var container = document.getElementById("overlay_editMapProperties_contentContainer");
        container.innerHTML = "";
        
        var localFrontendName, frontendInfoName, i, bigdiv, div, littlediv, table, tbody;
        
        // Make the frontend info and button visibility fields
        for (var frontendName in AUTHOR.JSON.frontendInfo) {
            if (AUTHOR.JSON.frontendInfo.hasOwnProperty(frontendName)) {
                // Get the localized name for the frontend
                localFrontendName = AUTHOR.JSON.frontendNames[frontendName] || frontendName;
                
                // Make a title for the frontend
                container.appendChild(c("h3", {
                    text: localFrontendName
                }));
                
                // Make a container for this frontend's stuff
                bigdiv = c("div", {
                    className: "columns"
                });
                
                // Make the frontend info fields
                div = c("div", {
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
                    littlediv = c("div", {
                        className: "box"
                    });
                    
                    littlediv.appendChild(c("h4", {
                        text: _("Toolbar Buttons")
                    }));
                    
                    tbody = c("tbody");
                    for (i = 0; i < AUTHOR.JSON.frontendButtons[frontendName].length; i++) {
                        makeButtonProperty(AUTHOR.JSON.frontendButtons[frontendName][i], tbody,
                                           frontendName);
                    }
                    table = c("table", {
                        className: "noborder"
                    });
                    table.appendChild(tbody);
                    littlediv.appendChild(table);
                    
                    div = c("div", {
                        className: "column-right"
                    });
                    div.appendChild(littlediv);
                    
                    bigdiv.appendChild(div);
                }
                
                // Append the stuff for this frontend to the overall container
                container.appendChild(bigdiv);
                
                // Make a divider
                container.appendChild(c("hr"));
            }
        }
    }
    
    /**
     * Initialize the Map Properties editor overlay.
     */
    function initMapPropertiesEditor() {
        // Set up Reset button
        document.getElementById("overlay_editMapProperties_reset").addEventListener("click", function (event) {
            event.preventDefault();
            resetEditor();
        }, false);
        
        // Set up Close button
        document.getElementById("overlay_editMapProperties_close").addEventListener("click", function (event) {
            event.preventDefault();
            closeEditor();
        }, false);
    }
    
    window.addEventListener("load", initMapPropertiesEditor, false);
})();
