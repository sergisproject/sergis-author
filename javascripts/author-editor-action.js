/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
 */

// Globals: AUTHOR_EDITOR_ACTION

var AUTHOR_EDITOR_ACTION = {
    /* addAction */
};

(function () {
    /**
     * Add a new action.
     */
    AUTHOR_EDITOR_ACTION.addAction = function (promptIndex, choiceIndex) {
        alert("Adding action...");
    };

    /**
     * Initialize the action editor overlay.
     */
    function initEditorAction() {
        // Set up Cancel button
        document.getElementById("overlay_addAction_cancel").addEventListener("click", function (event) {
            event.preventDefault();
            closeEditor();
        }, false);
        
        // Set up Save button
        document.getElementById("overlay_addAction_save").addEventListener("click", function (event) {
            event.preventDefault();
            saveEditor();
        }, false);
    }
    
    window.addEventListener("load", initEditorAction, false);
})();
