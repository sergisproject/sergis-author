/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
 */

// Globals: AUTHOR_EDITOR

var AUTHOR_EDITOR = {
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
     * @memberof AUTHOR_EDITOR
     *
     * @param {number} promptIndex - The prompt index of the prompt containing
     *        the content to edit.
     * @param {number} contentIndex - The content index to edit.
     * @param {boolean} isAdding - Whether this contentIndex has just been
     *        added (affects the title of the editor).
     */
    AUTHOR_EDITOR.editContent = function (promptIndex, contentIndex, isAdding) {
        editorTitle(isAdding ? "addcontent" : "editcontent");
        
        editor_state.content_json = json.promptList[promptIndex].prompt.contents[contentIndex] || {};
        editor_state.promptIndex = promptIndex;
        editor_state.contentIndex = contentIndex;
        editor_state.choiceIndex = null;
        updateContentEditor();
        // Open the editor
        overlay("overlay_editor");
    };

    /**
     * Open the editor to edit a choice.
     * @memberof AUTHOR_EDITOR
     *
     * @param {number} promptIndex - The prompt index of the prompt containing
     *        the content to edit.
     * @param {number} choiceIndex - The choice index to edit.
     * @param {boolean} isAdding - Whether this choiceIndex has just been added
     *        (affects the title of the editor).
     */
    AUTHOR_EDITOR.editChoice = function (promptIndex, choiceIndex, isAdding) {
        editorTitle(isAdding ? "addchoice" : "editchoice");
        
        editor_state.content_json = json.promptList[promptIndex].prompt.choices[choiceIndex] || {};
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
            json.promptList[editor_state.promptIndex].prompt.contents[editor_state.contentIndex] = editor_state.content_json;
        } else if (editor_state.choiceIndex !== null) {
            // It's a choice
            json.promptList[editor_state.promptIndex].prompt.choices[editor_state.choiceIndex] = editor_state.content_json;
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
        if (AUTHOR_JSON.contentTypes.hasOwnProperty(editor_state.content_json.type)) {
            document.getElementById("overlay_editor_contentType").value = editor_state.content_json.type;
        } else {
            document.getElementById("overlay_editor_contentType").selectedIndex = 0;
            editor_state.content_json.type = select.value;
        }
        
        // Remove the old fields
        var container = document.getElementById("overlay_editor_contentContainer");
        container.innerHTML = "";
        
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
    }

    /**
     * Initialize the editor overlay.
     */
    function initEditor() {
        // Set up Content Type switcher
        var select = document.getElementById("overlay_editor_contentType");
        // Make sure default content type is first
        var defaultContentType;
        if (AUTHOR_JSON.defaultContentType && AUTHOR_JSON.contentTypes.hasOwnProperty(AUTHOR_JSON.defaultContentType)) {
            defaultContentType = AUTHOR_JSON.defaultContentType;
            select.appendChild(c("option", {
                value: defaultContentType,
                text: AUTHOR_JSON.contentTypes[defaultContentType].name
            }));
        }
        // Add the rest of the content types
        for (var type in AUTHOR_JSON.contentTypes) {
            if (AUTHOR_JSON.contentTypes.hasOwnProperty(type) && type != defaultContentType) {
                select.appendChild(c("option", {
                    value: type,
                    text: AUTHOR_JSON.contentTypes[type].name
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
