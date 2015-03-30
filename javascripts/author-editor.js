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
        var elems = document.getElementsByClassName("overlay_editor_title"), id;
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
     * @memberof AUTHOR.EDITOR
     *
     * @param {number} promptIndex - The prompt index of the prompt containing
     *        the content to edit.
     * @param {number} contentIndex - The content index to edit.
     * @param {boolean} isAdding - Whether this contentIndex has just been
     *        added (affects the title of the editor).
     */
    AUTHOR.EDITOR.editContent = function (promptIndex, contentIndex, isAdding) {
        editorTitle(isAdding ? "addcontent" : "editcontent");
        
        editor_state.content_json = game.jsondata.promptList[promptIndex].prompt.contents[contentIndex] || {};
        editor_state.promptIndex = promptIndex;
        editor_state.contentIndex = contentIndex;
        editor_state.choiceIndex = null;
        updateContentEditor();
        // Open the editor
        overlay("overlay_editor");
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
        editorTitle(isAdding ? "addchoice" : "editchoice");
        
        editor_state.content_json = game.jsondata.promptList[promptIndex].prompt.choices[choiceIndex] || {};
        editor_state.promptIndex = promptIndex;
        editor_state.contentIndex = null;
        editor_state.choiceIndex = choiceIndex;
        updateContentEditor();
        // Open the editor
        overlay("overlay_editor");
    };

    /**
     * Save whatever we were editing and close the editor.
     */
    function saveEditor() {
        if (editor_state.contentIndex !== null) {
            // It's content
            game.jsondata.promptList[editor_state.promptIndex].prompt.contents[editor_state.contentIndex] = editor_state.content_json;
        } else if (editor_state.choiceIndex !== null) {
            // It's a choice
            game.jsondata.promptList[editor_state.promptIndex].prompt.choices[editor_state.choiceIndex] = editor_state.content_json;
        }
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
     * Update the Content editor (including the <select> and any fields
     * associated with its value) based on the value of
     * editor_state.content_json.type.
     */
    function updateContentEditor() {
        var select = document.getElementById("overlay_editor_contentType");
        
        // Make sure the proper option in `select` is selected
        if (AUTHOR.JSON.contentTypes.hasOwnProperty(editor_state.content_json.type)) {
            document.getElementById("overlay_editor_contentType").value = editor_state.content_json.type;
        } else {
            document.getElementById("overlay_editor_contentType").selectedIndex = 0;
            editor_state.content_json.type = select.value;
        }
        
        // Remove the old fields
        var container = document.getElementById("overlay_editor_contentContainer");
        container.innerHTML = "";
        
        // Make the fields for this content type (based on AUTHOR.JSON.contentTypes)
        var fields = AUTHOR.JSON.contentTypes[select.value].fields;
        var property, name, type, value, data;
        var p, id, inner_container;
        if (!editor_state.content_json._sergis_author_data) editor_state.content_json._sergis_author_data = {};
        for (var i = 0; i < fields.length; i++) {
            // Shortcuts for the 4 elements in the array
            property = fields[i][0];
            name = fields[i][1];
            type = fields[i][2];
            value = typeof editor_state.content_json[property] != "undefined" ? editor_state.content_json[property] : fields[i][3];
            if (!editor_state.content_json._sergis_author_data[property]) editor_state.content_json._sergis_author_data[property] = {};
            data = editor_state.content_json._sergis_author_data[property];
            
            // Create the field editor based on its type
            container.appendChild(AUTHOR.JSON.fieldTypes[type].makeEditor(property, name, value, data, function (property, value) {
                editor_state.content_json[property] = value;
            }));
        }
    }

    /**
     * Initialize the editor overlay.
     */
    function initEditor() {
        // Set up Content Type switcher
        var select = document.getElementById("overlay_editor_contentType");
        // Make sure default content type is first
        var defaultContentType;
        if (AUTHOR.JSON.defaultContentType && AUTHOR.JSON.contentTypes.hasOwnProperty(AUTHOR.JSON.defaultContentType)) {
            defaultContentType = AUTHOR.JSON.defaultContentType;
            select.appendChild(c("option", {
                value: defaultContentType,
                text: AUTHOR.JSON.contentTypes[defaultContentType].name
            }));
        }
        // Add the rest of the content types
        for (var type in AUTHOR.JSON.contentTypes) {
            if (AUTHOR.JSON.contentTypes.hasOwnProperty(type) && type != defaultContentType) {
                select.appendChild(c("option", {
                    value: type,
                    text: AUTHOR.JSON.contentTypes[type].name
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
        document.getElementById("overlay_editor_cancel").addEventListener("click", function (event) {
            event.preventDefault();
            closeEditor();
        }, false);
        
        // Set up Save button
        document.getElementById("overlay_editor_save").addEventListener("click", function (event) {
            event.preventDefault();
            saveEditor();
        }, false);
    }
    
    window.addEventListener("load", initEditor, false);
})();
