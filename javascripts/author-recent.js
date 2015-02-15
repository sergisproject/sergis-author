/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

// This file handles recent files.
// Globals: AUTHOR_RECENT

var AUTHOR_RECENT = {
    /* saveRecentFile */
};

(function () {
    /**
     * The recent files.
     */
    var recent = [];
    
    /**
     * Whether we're showing all the recent files in the dropdown.
     */
    var showAllRecent = false;
    
    /**
     * The number of recent files to show in the dropdown
     * (if showAllRecent == false).
     */
    var dropdownListLength = 10;
    
    /**
     * Load recent files from storage.
     */
    function loadRecentFilesStorage() {
        var recentStr = window.localStorage && window.localStorage.getItem("sergis_author_recent_files");
        if (recentStr) {
            try {
                recent = JSON.parse(recentStr);
            } catch (err) {
                recent = null;
            }
        }
        
        if (!recent || !recent.length) recent = [];
    }
    
    /**
     * Update the "Recent Files" dropdown.
     *
     * @return {boolean} True if there are recent files, false otherwise.
     */
    function updateRecentFiles() {
        if (recent && recent.length) {
            var select = document.getElementById("downloads_recent_select");
            while (select.firstChild) select.removeChild(select.firstChild);
            
            select.appendChild(c("option", {
                text: _("Recent Files"),
                value: "_"
            }));
            var optgroup = c("optgroup");
            for (var i = 0; i < Math.min(recent.length, dropdownListLength); i++) {
                // Add option to select
                optgroup.appendChild(c("option", {
                    text: makeLabel(recent[i]),
                    value: recent[i].id,
                    selected: recent[i].id == json.id ? "selected" : undefined
                }));
            }
            select.appendChild(optgroup);
            if (!showAllRecent && recent.length > dropdownListLength) {
                select.appendChild(c("option", {
                    text: _("Show All Recent Files"),
                    value: "_showAll"
                }));
            }
            
            document.getElementById("downloads_recent").style.display = "block";
            return true;
        } else {
            document.getElementById("downloads_recent").style.display = "none";
            return false;
        }
    };

    /**
     * Add the current JSON as a recent file.
     */
    AUTHOR_RECENT.saveRecentFile = function () {
        // Update the recent file list
        loadRecentFilesStorage();
        
        // See if there are any other files in the list that match ours
        for (var i = recent.length - 1; i >= 0; i--) {
            if (recent[i].id == json.id) {
                // Splice it out
                recent.splice(i, 1);
            }
        }
        
        // Add ourselves at the beginning and save the new recent list
        recent.unshift(json);
        window.localStorage.setItem("sergis_author_recent_files", JSON.stringify(recent));
        
        // Update the recent file dropdown
        updateRecentFiles();
    };
    
    /**
     * Load a recent file.
     *
     * @param {string} id - The id of the recent file to load.
     */
    function loadRecentFile(id) {
        console.log("Loading file: ", id);
        for (var i = 0; i < recent.length; i++) {
            if (recent[i].id == id) {
                // Found it!
                json = recent[i];
                loadJSON();
                return;
            }
        }
        
        // If we're still here, then we didn't find it
        alert(_("Error loading recent file!"));
    }
    
    /**
     * Initialize the recent files.
     */
    function initRecent() {
        // Load "Recent Files" dropdown (if supported and available)
        loadRecentFilesStorage();
        if (updateRecentFiles()) {
            // Show "Recent Files" instructions
            document.getElementById("instructions_recent").style.display = "block";
        }
        
        // For when something is selected
        document.getElementById("downloads_recent_select").addEventListener("change", function (event) {
            if (this.value == "_showAll") {
                showAllRecent = true;
                updateRecentFiles();
            } else if (this.value && this.value != "_") {
                loadRecentFile(this.value);
            }
        }, false);
    }
    
    window.addEventListener("load", initRecent, false);
})();
