/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

// This file handles the Map Properties (i.e. frontend info) overlay.

AUTHOR.FRONTEND_INFO_EDITOR = {
    /* editFrontendInfo */
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
    
    AUTHOR.FRONTEND_INFO_EDITOR.editFrontendInfo = function (promptIndex) {
        editor_state.promptIndex = promptIndex;
        updateFrontendInfoEditor();
        overlay("overlay_editFrontendInfo");
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
        checkJSON();
        // Re-open the editor
        AUTHOR.FRONTEND_INFO_EDITOR.editFrontendInfo(editor_state.promptIndex);
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
                    updateFrontendInfoEditor();
                }));
                container.appendChild(p);
            }
        }
    }
    
    /**
     * Update the Map Properties editor.
     */
    function updateFrontendInfoEditor() {
        // Remove the old fields
        var container = document.getElementById("overlay_editFrontendInfo_contentContainer");
        container.innerHTML = "";
        
        // Make the frontend info fields again
        for (var frontendName in AUTHOR.JSON.frontendInfo) {
            if (AUTHOR.JSON.frontendInfo.hasOwnProperty(frontendName)) {
                container.appendChild(c("h3", {
                    text: frontendName
                }));
                for (var frontendInfoName in AUTHOR.JSON.frontendInfo[frontendName]) {
                    if (AUTHOR.JSON.frontendInfo[frontendName].hasOwnProperty(frontendInfoName)) {
                        makeProperty(AUTHOR.JSON.frontendInfo[frontendName][frontendInfoName], container,
                                    frontendName, frontendInfoName);
                    }
                }
            }
        }
    }
    
    /**
     * Initialize the Map Properties editor overlay.
     */
    function initFrontendInfoEditor() {
        // Set up Reset button
        document.getElementById("overlay_editFrontendInfo_reset").addEventListener("click", function (event) {
            event.preventDefault();
            resetEditor();
        }, false);
        
        // Set up Close button
        document.getElementById("overlay_editFrontendInfo_close").addEventListener("click", function (event) {
            event.preventDefault();
            closeEditor();
        }, false);
    }
    
    window.addEventListener("load", initFrontendInfoEditor, false);
})();
