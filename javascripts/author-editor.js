/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

// This file handles adding or editing content or choices through the Content Editor.

AUTHOR.EDITOR = {
    /* editContent */
    /* editChoice */
};

(function () {
    /**
     * The current state of the editor.
     *
     * @property {object} content_json - The current state of the "content"
     *           json (or "choice content" json) that we're editing.
     * @property {number} promptIndex - The promptIndex of the prompt
     *           containing whatever we're editing.
     * @property {number} contentIndex - The contentIndex of the content that
     *           we're editing. If null, then we must be editing a choice.
     * @property {number} choiceIndex - The choiceIndex of the choice that
     *           we're editing. If null, then we must be editing content.
     */
    var editor_state = {
        content_json: {},
        promptIndex: null,
        contentIndex: null,
        coiceIndex: null
    };

    /**
     * Show a certain title for the editor.
     *
     * @param {string} title - The ID of the element with the
     *        "overlay_editor_title" class that we should show. (May include
     *        the "overlay_editor_title" at the front, but doesn't have to.)
     */
    function editorTitle(title) {
        forClass("overlay_editor_title", function (elem) {
            var id = elem.getAttribute("id");
            if (id == title || id.substring(id.lastIndexOf("_") + 1) == title) {
                elem.style.display = "block";
            } else {
                elem.style.display = "none";
            }
        });
    }

    /**
     * Open the editor to edit a content.
     * @memberof AUTHOR.EDITOR
     *
     * @param {number} promptIndex - The prompt index of the prompt containing
     *        the content to edit.
     * @param {number} contentIndex - The content index to edit.
     * @param {boolean} isAdding - Whether this contentIndex has just been
     *        added (affects the title of the editor).
     */
    AUTHOR.EDITOR.editContent = function (promptIndex, contentIndex, isAdding) {
        overlay("overlay_loading");
        // Try to lock the prompt
        AUTHOR.GAMES.lockPrompts(promptIndex).then(function (isSuccessful) {
            if (isSuccessful) {
                // All good!
                editorTitle(isAdding ? "addcontent" : "editcontent");

                editor_state.content_json = game.jsondata.promptList[promptIndex].prompt.contents[contentIndex] || {};
                editor_state.promptIndex = promptIndex;
                editor_state.contentIndex = contentIndex;
                editor_state.choiceIndex = null;
                updateContentEditor();
                // Open the editor
                overlay("overlay_editor");
            } else {
                // Not good :(
                overlay();
            }
        }).catch(makeCatch(_("Error locking prompt")));
    };

    /**
     * Open the editor to edit a choice.
     * @memberof AUTHOR.EDITOR
     *
     * @param {number} promptIndex - The prompt index of the prompt containing
     *        the content to edit.
     * @param {number} choiceIndex - The choice index to edit.
     * @param {boolean} isAdding - Whether this choiceIndex has just been added
     *        (affects the title of the editor).
     */
    AUTHOR.EDITOR.editChoice = function (promptIndex, choiceIndex, isAdding) {
        overlay("overlay_loading");
        // Try to lock the prompt
        AUTHOR.GAMES.lockPrompts(promptIndex).then(function (isSuccessful) {
            if (isSuccessful) {
                // All good!
                editorTitle(isAdding ? "addchoice" : "editchoice");

                editor_state.content_json = game.jsondata.promptList[promptIndex].prompt.choices[choiceIndex] || {};
                editor_state.promptIndex = promptIndex;
                editor_state.contentIndex = null;
                editor_state.choiceIndex = choiceIndex;
                updateContentEditor();
                // Open the editor
                overlay("overlay_editor");
            } else {
                // Not good :(
                overlay();
            }
        }).catch(makeCatch(_("Error locking prompt")));
    };

    /**
     * Save whatever we were editing and close the editor.
     */
    function saveEditor() {
        overlay("overlay_loading");
        var jsonpath;
        if (editor_state.contentIndex !== null) {
            // It's content
            game.jsondata.promptList[editor_state.promptIndex].prompt.contents[editor_state.contentIndex] = editor_state.content_json;
            jsonpath = "promptList." + editor_state.promptIndex + ".prompt.contents." + editor_state.contentIndex;
        } else if (editor_state.choiceIndex !== null) {
            // It's a choice
            game.jsondata.promptList[editor_state.promptIndex].prompt.choices[editor_state.choiceIndex] = editor_state.content_json;
            jsonpath = "promptList." + editor_state.promptIndex + ".prompt.choices." + editor_state.choiceIndex;
        }
        // Save and regenerate
        generateAndSave(true, undefined, jsonpath).then(function () {
            // Try to unlock the prompt
            return AUTHOR.GAMES.unlockPrompts(editor_state.promptIndex);
        }).then(function () {
            // All done; close the editor
            overlay();
        }).catch(makeCatch(_("Error unlocking prompt")));
    }

    /**
     * Close the editor (doesn't also save).
     */
    function closeEditor() {
        overlay("overlay_loading");
        // Try to unlock the prompt
        AUTHOR.GAMES.unlockPrompts(editor_state.promptIndex).then(function () {
            // Close the editor
            overlay();
        }).catch(makeCatch(_("Error unlocking prompt")));
    }

    /**
     * Update the Content editor (including the <select> and any fields
     * associated with its value) based on the value of
     * editor_state.content_json.type.
     */
    function updateContentEditor() {
        var select = byId("overlay_editor_contentType");
        
        // Make sure the proper option in `select` is selected
        if (AUTHOR.JSON_CONTENT.contentTypes.hasOwnProperty(editor_state.content_json.type)) {
            select.value = editor_state.content_json.type;
        } else {
            select.selectedIndex = 0;
            editor_state.content_json.type = select.value;
        }
        
        // Remove the old fields
        var container = byId("overlay_editor_contentContainer");
        container.innerHTML = "";
        
        // Make the fields for this content type (based on AUTHOR.JSON_CONTENT.contentTypes)
        var fields = AUTHOR.JSON_CONTENT.contentTypes[select.value].fields;
        if (!editor_state.content_json._sergis_author_data) editor_state.content_json._sergis_author_data = {};
        fields.forEach(function (field) {
            // Shortcuts for the 4 elements in the array
            var property = field[0];
            var name = field[1];
            var type = field[2];
            var value = typeof editor_state.content_json[property] != "undefined" ? editor_state.content_json[property] : field[3];
            
            if (!editor_state.content_json._sergis_author_data[property]) {
                editor_state.content_json._sergis_author_data[property] = {};
            }
            var data = editor_state.content_json._sergis_author_data[property];
            
            // Create the field editor based on its type
            container.appendChild(AUTHOR.JSON_CONTENT.fieldTypes[type].makeEditor(property, name, value, data, function (property, value) {
                editor_state.content_json[property] = value;
            }));
        });
    }

    /**
     * Initialize the editor overlay.
     */
    function initEditor() {
        // Set up Content Type switcher
        var select = byId("overlay_editor_contentType");
        
        // Make sure default content type is first
        var defaultContentType;
        if (AUTHOR.JSON_CONTENT.DEFAULT_CONTENT_TYPE && AUTHOR.JSON_CONTENT.contentTypes.hasOwnProperty(AUTHOR.JSON_CONTENT.DEFAULT_CONTENT_TYPE)) {
            defaultContentType = AUTHOR.JSON_CONTENT.DEFAULT_CONTENT_TYPE;
            select.appendChild(create("option", {
                value: defaultContentType,
                text: AUTHOR.JSON_CONTENT.contentTypes[defaultContentType].name
            }));
        }
        // Add the rest of the content types
        for (var type in AUTHOR.JSON_CONTENT.contentTypes) {
            if (AUTHOR.JSON_CONTENT.contentTypes.hasOwnProperty(type) && type != defaultContentType) {
                select.appendChild(create("option", {
                    value: type,
                    text: AUTHOR.JSON_CONTENT.contentTypes[type].name
                }));
            }
        }
        
        // Update the Content editor when the type is changed
        select.addEventListener("change", function (event) {
            editor_state.content_json.type = this.value;
            updateContentEditor();
        }, false);
        
        // Update the Content editor based on type
        updateContentEditor();
        
        // Set up Cancel button
        byId("overlay_editor_cancel").addEventListener("click", function (event) {
            event.preventDefault();
            closeEditor();
        }, false);
        
        // Set up Save button
        byId("overlay_editor_save").addEventListener("click", function (event) {
            event.preventDefault();
            saveEditor();
        }, false);
    }
    
    window.addEventListener("load", initEditor, false);
})();
