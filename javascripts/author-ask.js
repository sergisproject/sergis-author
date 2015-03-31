/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

// Globals: ask, askForOK, askForConfirmation, askForFile (if supported)

(function () {
    var askHandler, askForOKHandler, askForConfirmationHander;
    
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
            document.getElementById("overlay_prompt_text").textContent = texts.pop();
            // Set the rest of promptText
            document.getElementById("overlay_prompt_error").innerHTML = "";
            texts.forEach(function (text, index) {
                if (index > 0) document.getElementById("overlay_prompt_error").appendChild(c("br"));
                document.getElementById("overlay_prompt_error").appendChild(document.createTextNode(text));
            });
            // Set the default value
            document.getElementById("overlay_prompt_input").value = defaultValue || "";
            // Set up the handler for the user's choice
            askHandler = function (value) {
                overlay(previousOverlay || undefined);
                resolve(value);
            };
            // Show the overlay
            overlay("overlay_prompt");
            // Highlight the input box
            document.getElementById("overlay_prompt_input").focus();
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
            document.getElementById("overlay_alert_text").innerHTML = "";
            texts.forEach(function (text, index) {
                if (index > 0) document.getElementById("overlay_alert_text").appendChild(c("br"));
                document.getElementById("overlay_alert_text").appendChild(document.createTextNode(text));
            });
            // Set up the handler for the user's choice
            askForOKHander = function () {
                overlay(previousOverlay || undefined);
                resolve();
            };
            // Show the overlay
            overlay("overlay_alert");
            // Focus the "OK" button
            document.getElementById("overlay_alert_ok").focus();
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
            document.getElementById("overlay_confirm_text").innerHTML = "";
            texts.forEach(function (text, index) {
                if (index > 0) document.getElementById("overlay_confirm_text").appendChild(c("br"));
                document.getElementById("overlay_confirm_text").appendChild(document.createTextNode(text));
            });
            // Set up the buttons
            document.getElementById("overlay_confirm_yes").className = focusNoButton ? "sub-button" : "main-button";
            document.getElementById("overlay_confirm_no").className = focusNoButton ? "main-button" : "sub-button";
            // Set up the handler for the user's choice
            askForConfirmationHander = function (value) {
                overlay(previousOverlay || undefined);
                resolve(value);
            };
            // Show the overlay
            overlay("overlay_confirm");
            // Focus the "Yes" or "No" button
            document.getElementById(focusNoButton ? "overlay_confirm_no" : "overlay_confirm_yes").focus();
        });
    };
    
    // "askForFile" function (if FileReader is supported)
    if (typeof FileReader != "undefined") {
        /**
         * Prompt the user to select a file.
         *
         * @return {Promise.<File>} The file selected by the user. If the user
         *         does not select a file, the promise is never resolved.
         */
        window.askForFile = function () {
            return new Promise(function (resolve, reject) {
                var fileinput = c("input", {
                    type: "file"
                }, function (event) {
                    if (event.target.files && event.target.files.length > 0) {
                        resolve(event.target.files[0]);
                    }
                });
                document.getElementById("fileinputs").appendChild(fileinput);
                fileinput.click();
            });
        };
    }
    
    /**
     * Initialize ask functions.
     */
    function initAsk() {
        // Set up form and button for prompt ("ask")
        document.getElementById("overlay_prompt_form").addEventListener("submit", function (event) {
            event.preventDefault();
            if (typeof askHandler == "function") {
                askHandler(document.getElementById("overlay_prompt_input").value);
            }
            askHandler = null;
        }, false);
        document.getElementById("overlay_prompt_cancel").addEventListener("click", function (event) {
            event.preventDefault();
            if (typeof askHandler == "function") askHandler(null);
            askHandler = null;
        }, false);
        
        // Set up button for alert ("askForOK")
        document.getElementById("overlay_alert_ok").addEventListener("click", function (event) {
            event.preventDefault();
            if (typeof askForOKHander == "function") askForOKHander();
            askForOKHander = null;
        }, false);
        
        // Set up buttons for confirm ("askForConfirmation")
        document.getElementById("overlay_confirm_yes").addEventListener("click", function (event) {
            event.preventDefault();
            if (typeof askForConfirmationHander == "function") askForConfirmationHander(true);
            askForConfirmationHander = null;
        }, false);
        document.getElementById("overlay_confirm_no").addEventListener("click", function (event) {
            event.preventDefault();
            if (typeof askForConfirmationHander == "function") askForConfirmationHander(false);
            askForConfirmationHander = null;
        }, false);
    }
    
    window.addEventListener("load", initAsk, false);
})();
