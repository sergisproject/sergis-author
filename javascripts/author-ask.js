/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

// Globals: ask, askForOK, askForConfirmation, askForFile (if supported),
// askForFileThroughBackend (if supported; available after window load),
// AUTHOR_MAX_FILE_SIZE, AUTHOR_MAX_FILE_SIZE_HUMAN_READABLE, AUTHOR_MIN_UPLOAD_SIZE

// Max file size, in bytes
var AUTHOR_MAX_FILE_SIZE = 1024 * 1024; // 1 MB
var AUTHOR_MAX_FILE_SIZE_HUMAN_READABLE = "1 MB";

// Minimum file size to not store in JSON if possible
var AUTHOR_MIN_UPLOAD_SIZE = 512; // 0.5 KB

(function () {
    var askHandler, askForOKHandler, askForConfirmationHandler;
    
    /**
     * Prompt the user for something.
     *
     * @param {string} promptText - The text to prompt the user with.
     * @param {string} [defaultValue=""] - The default value for the prompt.
     *
     * @return {Promise.<?string>} The text that the user entered, or null if
     *         the user hit Cancel.
     */
    window.ask = function (promptText, defaultValue) {
        return new Promise(function (resolve, reject) {
            var previousOverlay = getOverlay();
            // Set the prompt text (last line of promptText)
            var texts = promptText.split("\n");
            byId("overlay_prompt_text").textContent = texts.pop();
            // Set the rest of promptText
            byId("overlay_prompt_error").innerHTML = "";
            texts.forEach(function (text, index) {
                if (index > 0) byId("overlay_prompt_error").appendChild(create("br"));
                byId("overlay_prompt_error").appendChild(document.createTextNode(text));
            });
            // Set the default value
            byId("overlay_prompt_input").value = defaultValue || "";
            // Set up the handler for the user's choice
            askHandler = function (value) {
                overlay(previousOverlay || undefined);
                resolve(value);
            };
            // Show the overlay
            overlay("overlay_prompt");
            // Highlight the input box
            byId("overlay_prompt_input").focus();
        });
    };
    
    /**
     * Show an alert to the user.
     *
     * @param {string} promptText - The text to show to the user.
     *
     * @return {Promise} Resolved when the user clicks "OK".
     */
    window.askForOK = function (promptText) {
        return new Promise(function (resolve, reject) {
            var previousOverlay = getOverlay();
            // Set the prompt text
            var texts = promptText.split("\n");
            byId("overlay_alert_text").innerHTML = "";
            texts.forEach(function (text, index) {
                if (index > 0) byId("overlay_alert_text").appendChild(create("br"));
                byId("overlay_alert_text").appendChild(document.createTextNode(text));
            });
            // Set up the handler for the user's choice
            askForOKHandler = function () {
                overlay(previousOverlay || undefined);
                resolve();
            };
            // Show the overlay
            overlay("overlay_alert");
            // Focus the "OK" button
            byId("overlay_alert_ok").focus();
        });
    };
    
    /**
     * Prompt the user for confirmation about something.
     *
     * @param {string} promptText - The text to prompt the user with.
     * @param {boolean} [focusNoButton=false] - Whether to focus the "No" button
     *        by default instead of the "Yes" button.
     *
     * @return {Promise.<boolean>} True if the user chose "Yes", or false if
     *         they chose "No".
     */
    window.askForConfirmation = function (promptText, focusNoButton) {
        return new Promise(function (resolve, reject) {
            var previousOverlay = getOverlay();
            // Set the prompt text
            var texts = promptText.split("\n");
            byId("overlay_confirm_text").innerHTML = "";
            texts.forEach(function (text, index) {
                if (index > 0) byId("overlay_confirm_text").appendChild(create("br"));
                byId("overlay_confirm_text").appendChild(document.createTextNode(text));
            });
            // Set up the buttons
            byId("overlay_confirm_yes").className = focusNoButton ? "sub-button" : "main-button";
            byId("overlay_confirm_no").className = focusNoButton ? "main-button" : "sub-button";
            // Set up the handler for the user's choice
            askForConfirmationHandler = function (value) {
                overlay(previousOverlay || undefined);
                resolve(value);
            };
            // Show the overlay
            overlay("overlay_confirm");
            // Focus the "Yes" or "No" button
            byId(focusNoButton ? "overlay_confirm_no" : "overlay_confirm_yes").focus();
        });
    };
    
    /**
     * Prompt the user to select a file.
     *
     * @return {Promise.<File>} The file selected by the user. If the user
     *         does not select a file, the promise is never resolved.
     */
    function promptForFile() {
        return new Promise(function (resolve, reject) {
            var fileinput = create("input", {
                type: "file"
            }, function (event) {
                if (event.target.files && event.target.files.length > 0) {
                    resolve(event.target.files[0]);
                }
            });
            byId("fileinputs").appendChild(fileinput);
            fileinput.click();
        });
    }
    
    /**
     * Prompt the user to select a file, then uploading it through the backend
     * or getting JSON data.
     *
     * @return {Promise.<Object>} The file selected by the user. If the user
     *         does not select a file, the promise is never resolved. The object
     *         contains either the properties `fileName` and `fileData` or the
     *         property `fileURL`.
     */
    function promptForFileThroughBackend() {
        var file,
            overlayChanged = false,
            previousOverlay,
            wasRejected = false,
            rejectedError;
        return promptForFile().then(function (_file) {
            file = _file;
            // We only have to worry about the file size if we're storing it in the JSON
            if (typeof AUTHOR.BACKEND.uploadFile != "function" && file.size > AUTHOR_MAX_FILE_SIZE) {
                // AHH! Huge file!
                return askForConfirmation(
                    _("The file that you have chosen is larger than {0}, which is the recommended maximum file size. It is recommended that you upload the file elsewhere and just link to it here.", AUTHOR_MAX_FILE_SIZE_HUMAN_READABLE) +
                    "\n\n" +
                    _("Would you like to add the file anyway? (This may cause unexpected issues.)"),
                true);
            }
            // The file wasn't too big
            return true;
        }).then(function (shouldContinue) {
            if (!shouldContinue) return;

            previousOverlay = getOverlay();
            overlayChanged = true;
            overlay("overlay_loading");

            // If the backend can upload files, do that
            // (if the file is larger enough)
            if (typeof AUTHOR.BACKEND.uploadFile == "function" && file.size > AUTHOR_MIN_UPLOAD_SIZE) {
                // Upload through the backend
                return AUTHOR.BACKEND.uploadFile(file).then(function (fileURL) {
                    // Check if the file URL is relative
                    if (fileURL.substring(0, 1) == "/") {
                        fileURL = window.location.origin + fileURL;
                    }
                    return {
                        fileURL: fileURL
                    };
                });
            } else {
                return new Promise(function (resolve, reject) {
                    var reader = new FileReader();
                    reader.onload = function () {
                        if (reader.result) {
                            // We're done!
                            resolve({
                                fileName: file.name,
                                fileData: reader.result
                            });
                        } else {
                            reject(new Error(_("Error reading file! File is empty or unreadable.")));
                        }
                    };
                    reader.onerror = function () {
                        reject(reader.error);
                    };
                    reader.readAsDataURL(file);
                });
            }
        }).catch(function (err) {
            wasRejected = true;
            rejectedError = err;
        }).then(function (fileData) {
            // Reset the overlay
            if (overlayChanged) {
                overlay(previousOverlay || undefined);
            }
            // Send the result on back
            if (wasRejected) {
                return Promise.reject(rejectedError);
            } else {
                return fileData;
            }
        });
    }
    
    /**
     * Initialize ask functions.
     */
    function initAsk() {
        // "askForFile" function (if FileReader is supported)
        if (typeof FileReader != "undefined") {
            window.askForFile = promptForFile;
        }
        
        // "askForFileThroughBackend" function (if either the backend or the browser supports it)
        if (typeof AUTHOR.BACKEND.uploadFile == "function" || typeof FileReader != "undefined") {
            window.askForFileThroughBackend = promptForFileThroughBackend;
        }
        
        
        // Set up form and button for prompt ("ask")
        byId("overlay_prompt_form").addEventListener("submit", function (event) {
            event.preventDefault();
            if (typeof askHandler == "function") {
                askHandler(byId("overlay_prompt_input").value);
            }
            askHandler = null;
        }, false);
        byId("overlay_prompt_cancel").addEventListener("click", function (event) {
            event.preventDefault();
            if (typeof askHandler == "function") askHandler(null);
            askHandler = null;
        }, false);
        
        // Set up button for alert ("askForOK")
        byId("overlay_alert_ok").addEventListener("click", function (event) {
            event.preventDefault();
            if (typeof askForOKHandler == "function") askForOKHandler();
            askForOKHandler = null;
        }, false);
        
        // Set up buttons for confirm ("askForConfirmation")
        byId("overlay_confirm_yes").addEventListener("click", function (event) {
            event.preventDefault();
            if (typeof askForConfirmationHandler == "function") askForConfirmationHandler(true);
            askForConfirmationHandler = null;
        }, false);
        byId("overlay_confirm_no").addEventListener("click", function (event) {
            event.preventDefault();
            if (typeof askForConfirmationHandler == "function") askForConfirmationHandler(false);
            askForConfirmationHandler = null;
        }, false);
    }
    
    window.addEventListener("load", initAsk, false);
})();
