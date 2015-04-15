/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

// This file handles adding or editing actions through the Action Editor.

AUTHOR.ACTION_EDITOR = {
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
        action_json: {
            data: []
        },
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
     * Open the editor to edit an action.
     * @memberof AUTHOR.ACTION_EDITOR
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
    AUTHOR.ACTION_EDITOR.editAction = function (promptIndex, choiceIndex, actionIndex, isAdding) {
        editorTitle(isAdding ? "addaction" : "editaction");
        
        editor_state.action_json = game.jsondata.promptList[promptIndex].actionList[choiceIndex].actions[actionIndex] || {};
        if (!editor_state.action_json.data) editor_state.action_json.data = [];
        
        editor_state.promptIndex = promptIndex;
        editor_state.choiceIndex = choiceIndex;
        editor_state.actionIndex = actionIndex;
        updateActionEditor();
        overlay("overlay_actionEditor");
    };

    /**
     * Save whatever we were editing and close the editor.
     */
    function saveEditor() {
        // Check validation
        var form = document.getElementById("overlay_actionEditor_contentContainer");
        if (form && typeof form.reportValidity == "function") {
            if (!form.reportValidity()) {
                return;
            }
        }
        // Store it
        game.jsondata.promptList[editor_state.promptIndex].actionList[editor_state.choiceIndex].actions[editor_state.actionIndex] = editor_state.action_json;
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
        if (AUTHOR.JSON.actions.hasOwnProperty(editor_state.action_json.name)) {
            select.value = JSON.stringify({name: editor_state.action_json.name, frontend: null});
        } else if (editor_state.action_json.frontend && AUTHOR.JSON.actionsByFrontend.hasOwnProperty(editor_state.action_json.frontend) &&
                   AUTHOR.JSON.actionsByFrontend[editor_state.action_json.frontend].hasOwnProperty(editor_state.action_json.name)) {
            select.value = JSON.stringify({name: editor_state.action_json.name, frontend: editor_state.action_json.frontend});
        } else {
            select.selectedIndex = 0;
            editor_state.action_json.name = data.name;
            editor_state.action_json.frontend = data.frontend;
            editor_state.action_json.data = [];
        }
        
        // Get the action data description
        var data = JSON.parse(select.value),
            actionsDataList;
        if (data.frontend) {
            actionsDataList = AUTHOR.JSON.actionsByFrontend[data.frontend];
        } else {
            actionsDataList = AUTHOR.JSON.actions;
        }
        
        // Set the description
        document.getElementById("overlay_actionEditor_description").innerHTML = "";
        if (actionsDataList[data.name].description) {
            document.getElementById("overlay_actionEditor_description").appendChild(document.createTextNode(actionsDataList[data.name].description));
        }
        
        // Remove the old fields
        var container = document.getElementById("overlay_actionEditor_contentContainer");
        container.innerHTML = "";
        
        // Make the fields for this action name (and possibly frontend)
        var fields = actionsDataList[data.name].getFields(editor_state.action_json.data);
        for (var i = 0; i < fields.length; i++) {
            if (fields[i] == "repeat") continue;
            (function (i) {
                container.appendChild(fields[i].getElement(function () {
                    editor_state.action_json.data[i] = fields[i].getJSONValue();
                }));
            })(i);
        }
        
        // If we ended in a repeatable field, take care of that
        if (fields.length && fields[fields.length - 1] == "repeat") {
            var p = c("p");
            p.appendChild(c("button", {
                text: "Add More..."
            }, function (event) {
                editor_state.action_json.data.push(null);
                updateActionEditor();
            }));
            container.appendChild(p);
        }
    }

    /**
     * Initialize the action editor overlay.
     */
    function initActionEditor() {
        // Set up the Action Name switcher
        var select = document.getElementById("overlay_actionEditor_name");
        
        for (var actionName in AUTHOR.JSON.actions) {
            if (AUTHOR.JSON.actions.hasOwnProperty(actionName)) {
                select.appendChild(c("option", {
                    value: JSON.stringify({name: actionName, frontend: null}),
                    text: AUTHOR.JSON.actions[actionName].name
                }));
            }
        }
        
        for (var frontendName in AUTHOR.JSON.actionsByFrontend) {
            if (AUTHOR.JSON.actionsByFrontend.hasOwnProperty(frontendName)) {
                for (actionName in AUTHOR.JSON.actionsByFrontend[frontendName]) {
                    if (AUTHOR.JSON.actionsByFrontend[frontendName].hasOwnProperty(actionName)) {
                        select.appendChild(c("option", {
                            value: JSON.stringify({name: actionName, frontend: frontendName}),
                            text: (AUTHOR.JSON.frontendNames[frontendName] || frontendName) +
                                  ": " + AUTHOR.JSON.actionsByFrontend[frontendName][actionName].name
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
            editor_state.action_json.data = [];
            updateActionEditor();
        }, false);
        
        // Update the Action editor based on type
        updateActionEditor();
        
        // Set up form to not submit
        document.getElementById("overlay_actionEditor_contentContainer").addEventListener("submit", function (event) {
            event.preventDefault();
        }, false);
        
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
