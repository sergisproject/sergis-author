/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

// This file handles adding or editing actions through the Action Editor.
// Globals: AUTHOR_ACTION_EDITOR

var AUTHOR_ACTION_EDITOR = {
    /* editAction */
};

(function () {
    /**
     * The current state of the action editor.
     *
     * @property {object} action_json - The current state of the "action" json
     *           that we're editing.
     * @property {number} promptIndex - The promptIndex of the prompt containing
     *           the action that we're editing.
     * @property {number} contentIndex - The contentIndex of the content
     *           containing the action that we're editing.
     * @property {number} actionIndex - The actionIndex of the action that we're
     *           editing.
     */
    var editor_state = {
        action_json: {},
        promptIndex: null,
        choiceIndex: null,
        actionIndex: null
    };

    /**
     * Show a certain title for the action editor.
     *
     * @param {string} title - The ID of the element with the
     *        "overlay_editor_title" class that we should show. (May include
     *        the "overlay_actionEditor_title" at the front, but not required.)
     */
    function editorTitle(title) {
        var elems = document.getElementsByClassName("overlay_actionEditor_title"), id;
        for (var i = 0; i < elems.length; i++) {
            id = elems[i].getAttribute("id");
            if (id == title || id.substring(id.lastIndexOf("_") + 1) == title) {
                elems[i].style.display = "block";
            } else {
                elems[i].style.display = "none";
            }
        }
    }
    
    /**
     * Open the editor to edit a content.
     * @memberof AUTHOR_ACTION_EDITOR
     *
     * @param {number} promptIndex - The prompt index of the prompt containing
     *        the action to edit.
     * @param {number} choiceIndex - The choice index of the choice containing
     *        the action to edit.
     * @param {number} actionIndex - The action index to edit (within the
     *        choice).
     * @param {boolean} isAdding - Whether this actionIndex has just been added
     *        (affects the title of the editor).
     */
    AUTHOR_ACTION_EDITOR.editAction = function (promptIndex, choiceIndex, actionIndex, isAdding) {
        editorTitle(isAdding ? "addaction" : "editaction");
        overlay("overlay_actionEditor");
    };

    /**
     * Save whatever we were editing and close the editor.
     */
    function saveEditor() {
        // TODO: save stuff
        
        // Close the editor
        closeEditor();
    }

    /**
     * Close the editor (doesn't also save).
     */
    function closeEditor() {
        // Close the editor
        overlay();
        // Regenerate the table and update the save button
        generate(true);
    }
    
    /**
     * Update the Action editor (including the <select> and any fields
     * associated with its value) based on the value of
     * editor_state.action_json.name.
     */
    function updateActionEditor() {
        var select = document.getElementById("overlay_actionEditor_name");
        
        // Make sure the proper option in `select` is selected
        if (AUTHOR_JSON.actions.hasOwnProperty(editor_state.action_json.name)) {
            select.value = JSON.stringify({name: editor_state.action_json.name, frontend: null});
        } else if (editor_state.action_json.frontend && AUTHOR_JSON.actionsByFrontend.hasOwnProperty(editor_state.action_json.frontend) &&
                   AUTHOR_JSON.actionsByFrontend[editor_state.action_json.frontend].hasOwnProperty(editor_state.action_json.name)) {
            select.value = JSON.stringify({name: editor_state.action_json.name, frontend: editor_state.action_json.frontend});
        } else {
            select.selectedIndex = 0;
            var data = JSON.parse(select.value);
            editor_state.action_json.name = data.name;
            editor_state.action_json.frontend = data.frontend;
        }
        
        // Remove the old fields
        var container = document.getElementById("overlay_actionEditor_contentContainer");
        container.innerHTML = "";
        
        /*
        // Make the fields for this content type (based on AUTHOR_JSON.contentTypes)
        var fields = AUTHOR_JSON.contentTypes[select.value].fields;
        var property, name, type, value;
        var p, id, inner_container;
        for (var i = 0; i < fields.length; i++) {
            // Shortcuts for the 4 elements in the array
            property = fields[i][0];
            name = fields[i][1];
            type = fields[i][2];
            value = typeof editor_state.content_json[property] != "undefined" ? editor_state.content_json[property] : fields[i][3];
            
            p = c("p");
            id = "id_contenteditor_" + Math.random();
            // Create the field editor based on its type
            if (type == "boolean") {
                // Boolean type (checkbox)
                p.appendChild(c("input", {
                    id: id,
                    type: "checkbox",
                    checked: value ? "checked" : undefined
                }, function (event, property) {
                    editor_state.content_json[property] = this.checked;
                }, property));
                p.appendChild(c("label", {
                    "for": id,
                    text: " " + name
                }));
            } else {
                // Not a boolean type (checkbox), so label comes first
                p.appendChild(c("label", {
                    "for": id,
                    text: name + " "
                }));
                if (type == "string_multiline") {
                    // Multiline string type (textarea)
                    p.appendChild(c("textarea", {
                        id: id,
                        rows: 3,
                        text: value || ""
                    }, function (event, property) {
                        editor_state.content_json[property] = this.value;
                    }, property));
                } else {
                    if (type == "number") {
                        inner_container = p;
                    } else {
                        p.className += " inputcontainer";
                        p.appendChild(inner_container = c("span"));
                    }
                    // String or number (input)
                    inner_container.appendChild(c("input", {
                        id: id,
                        type: type == "number" ? "number" : "",
                        value: value || ""
                    }, function (event, property, type) {
                        editor_state.content_json[property] = type == "number" ? Number(this.value) : this.value;
                    }, property, type));
                }
            }
            container.appendChild(p);
        }
        */
    }

    /**
     * Initialize the action editor overlay.
     */
    function initActionEditor() {
        // Set up the Action Name switcher
        var select = document.getElementById("overlay_actionEditor_name");
        
        for (var actionName in AUTHOR_JSON.actions) {
            if (AUTHOR_JSON.actions.hasOwnProperty(actionName)) {
                select.appendChild(c("option", {
                    value: JSON.stringify({name: actionName, frontend: null}),
                    text: actionName
                }));
            }
        }
        
        for (var frontendName in AUTHOR_JSON.actionsByFrontend) {
            if (AUTHOR_JSON.actionsByFrontend.hasOwnProperty(frontendName)) {
                for (actionName in AUTHOR_JSON.actionsByFrontend[frontendName]) {
                    if (AUTHOR_JSON.actionsByFrontend[frontendName].hasOwnProperty(actionName)) {
                        select.appendChild(c("option", {
                            value: JSON.stringify({name: actionName, frontend: frontendName}),
                            text: frontendName + ": " + actionName
                        }));
                    }
                }
            }
        }
        
        // Update the Action editor when the type is changed
        select.addEventListener("change", function (event) {
            var data = JSON.parse(this.value);
            editor_state.action_json.name = data.name;
            editor_state.action_json.frontend = data.frontend;
            updateActionEditor();
        }, false);
        
        // Update the Action editor based on type
        updateActionEditor();
        
        // Set up Cancel button
        document.getElementById("overlay_actionEditor_cancel").addEventListener("click", function (event) {
            event.preventDefault();
            closeEditor();
        }, false);
        
        // Set up Save button
        document.getElementById("overlay_actionEditor_save").addEventListener("click", function (event) {
            event.preventDefault();
            saveEditor();
        }, false);
    }
    
    window.addEventListener("load", initActionEditor, false);
})();
