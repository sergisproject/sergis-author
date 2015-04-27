/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

// This file handles games and storage.

AUTHOR.GAMES = {
    /* getJSON */
    /* getDataURI */
    /* getLabel */
    /* saveGame */
};

(function () {
    /** The tabs in overlay_games */
    var TAB_NAMES = ["create", "open", "import"];
    
    AUTHOR.GAMES.getJSON = function (spacing) {
        return JSON.stringify(game.jsondata, function (key, value) {
            return key == "id" ? undefined : value;
        }, spacing);
    };
    
    AUTHOR.GAMES.getDataURI = function (spacing) {
        // Get the JSON and escape odd characters that throw off btoa
        var download = AUTHOR.GAMES.getJSON(spacing).replace(/[\u007f-\uffff]/g, function (char) {
            return "\\u" + ("0000" + char.charCodeAt(0).toString(16)).slice(-4);
        });
        return "data:application/json;base64," + btoa(download);
    };
    
    /**
     * Make a label for some JSON data.
     *
     * @param {object} [data] - The JSON data to use (if not `game.jsondata`).
     *
     * @return {string} The label for the JSON data.
     */
    AUTHOR.GAMES.getLabel = function (data) {
        var label;
        if (data) {
            label = data.name || data.id || "";
        } else {
            data = game.jsondata;
            label = game.name;
        }
        if (label) label += " - ";
        label += representDate(new Date(data.modified));
        return label;
    };

    /**
     * Create or save the current game.
     *
     * @return {Promise}
     */
    AUTHOR.GAMES.saveGame = function () {
        return AUTHOR.BACKEND.saveGame(game.name, game.jsondata);
    };
    
    /**
     * Make a decent representation of a date.
     *
     * @param {Date} date - The Date to represent.
     *
     * @return {string} A localized representation of the date.
     */
    function representDate(date) {
        var now = new Date();
        var label;
        if (now.getTime() - date.getTime() <= 7*24*60*60*1000) {
            // It was within the past week
            label = icu.getDateFormat("MEDIUM_WEEKDAY_NOYEAR").format(date);
            // Add the time, too, if it was wihin the past week
            label += " - " + date.getHours() + ":" + ("0" + date.getMinutes()).substr(-2);
        } else if (now.getFullYear() == date.getFullYear()) {
            // It was within the same year that we're in now
            label = icu.getDateFormat("MEDIUM_WEEKDAY_NOYEAR").format(date);
        } else {
            // It was in a previous year
            label = icu.getDateFormat("MEDIUM").format(date);
        }
        return label;
    }
    
    /**
     * Prompt the user for a game name and make sure that it is valid.
     *
     * @param {string} promptText - The text to prompt the user with.
     * @param {string} [defaultGameName=""] - The default game name.
     * @param {string} [errorMsg=""] - An error message to show.
     *
     * @return {Promise.<?string>} The game name.
     */
    function askForGameName(promptText, defaultGameName, errorMsg) {
        return ask(
            (errorMsg ? errorMsg + "\n" : "") + promptText,
            defaultGameName || ""
        ).then(function (gameName) {
            if (!gameName) return null;
            return AUTHOR.BACKEND.checkGameName(gameName).then(function (status) {
                if (status == -1) {
                    // Game name is invalid
                    return askForGameName(promptText, gameName, _("Invalid game name."));
                } else if (status === 0) {
                    // Game name is taken
                    return askForGameName(promptText, gameName, _("Game name is already taken."));
                } else {
                    // All good!
                    return gameName;
                }
            });
        });
    }
    
    /**
     * Create a new game based on what's entered in the overlay_games_create
     * form.
     */
    function createGame() {
        overlay("overlay_loading");
        // Hide any old error messages
        document.getElementById("overlay_games_create_invalid").style.display = "none";
        document.getElementById("overlay_games_create_taken").style.display = "none";
        // Check the game name
        var gameName = document.getElementById("overlay_games_create_name").value;
        AUTHOR.BACKEND.checkGameName(gameName).then(function (status) {
            if (status == -1) {
                // Game name is invalid
                document.getElementById("overlay_games_create_invalid").style.display = "block";
                overlay("overlay_games");
            } else if (status === 0) {
                // Game name is taken
                document.getElementById("overlay_games_create_taken").style.display = "block";
                overlay("overlay_games");
            } else {
                // All good!
                document.getElementById("project_title").textContent = gameName;
                game.name = gameName;
                game.jsondata = {};
                // Make our JSON defaults and generate the default table
                generate(true);
                // Hide all overlays
                overlay();
                // Show the instructions
                document.getElementById("instructions").style.display = "block";
            }
        }).catch(makeCatch(_("Error checking game name")));
    }
    
    /**
     * Load a game based on its game name.
     *
     * @param {string} gameName - The name of the game to load.
     */
    function loadGame(gameName) {
        AUTHOR.BACKEND.loadGame(gameName).then(function (jsondata) {
            document.getElementById("project_title").textContent = gameName;
            game.name = gameName;
            game.jsondata = jsondata;
            // Check the new JSON, generate the table, and set other inputs
            loadJSON();
            // Hide any overlay
            overlay();
            // The user is experienced; hide the instructions
            document.getElementById("instructions").style.display = "none";
        }).catch(makeCatch(_("Error loading game {0}", gameName)));
    }
    
    /**
     * Prompt the user for a JSON file and import the game.
     */
    function importGame() {
        overlay("overlay_loading");
        askForFile().then(function (file) {
            var ext = file.name.substring(file.name.lastIndexOf(".") + 1).toLowerCase();
            if (ext != "json") {
                alert(_("Invalid file!\nPlease select a *.json file."));
            } else {
                var jsondata;
                readJSONFile(file).then(function (_jsondata) {
                    jsondata = _jsondata;
                    // Create default name
                    var filename = file.name || "";
                    if (filename.substring(filename.length - 5) == ".json") {
                        filename = filename.substring(0, filename.length - 5);
                    }

                    // Make a name
                    return askForGameName(_("Imported Game Name:"), filename);
                }).then(function (gameName) {
                    if (gameName) {
                        // Yay, we have a game name!
                        // Update our current game data
                        document.getElementById("project_title").textContent = gameName;
                        game.name = gameName;
                        game.jsondata = jsondata;
                        // Check the new JSON, generate the table, and set other inputs
                        loadJSON();
                        // Hide all overlays
                        overlay();
                        // The user is a natural; hide the instructions
                        document.getElementById("instructions").style.display = "none";
                    } else {
                        // No game :(
                        // Just go back to Create Game overlay
                        switchTab("create");
                        overlay("overlay_games");
                    }
                }).catch(makeCatch(_("Error reading file")));
            }
        });
    }
    
    /**
     * Rename a game by prompting the user for the new name.
     *
     * @param {string} gameName - The name of the game to rename.
     */
    function renameGame(gameName) {
        askForGameName(_("New game name:"), gameName).then(function (newGameName) {
            // If they ended up choosing a new game name, then use it
            if (newGameName) {
                return AUTHOR.BACKEND.renameGame(gameName, newGameName);
            }
        }).then(function () {
            // All done, update the game list
            return updateGameList();
        }).then(function () {
            // Show the Create/Open overlay again
            overlay("overlay_games");
        }).catch(makeCatch(_("Error renaming game")));
    }
    
    /**
     * Delete a game after prompting the user for confirmation.
     *
     * @param {string} gameName - The name of the game to delete.
     */
    function deleteGame(gameName) {
        askForConfirmation(_("Are you sure that you want to delete {0}?", gameName)).then(function (theyAreSure) {
            if (!theyAreSure) {
                // They said no
                overlay("overlay_games");
            } else {
                return AUTHOR.BACKEND.removeGame(gameName).then(function () {
                    // All done, update the game list
                    return updateGameList();
                }).then(function () {
                    // Show the Create/Open overlay again
                    overlay("overlay_games");
                });
            }
        }).catch(makeCatch(_("Error removing game")));
    }
    
    /**
     * Update the list of games.
     *
     * @return {Promise}
     */
    function updateGameList() {
        return AUTHOR.BACKEND.getGameList().then(function (gameList) {
            var container = document.getElementById("overlay_games_open_gamescontainer");
            while (container.lastChild) {
                container.removeChild(container.lastChild);
            }
            
            Object.keys(gameList).sort(function (a, b) {
                return (new Date(gameList[b])).getTime() - (new Date(gameList[a])).getTime();
            }).forEach(function (gameName) {
                var tr = c("tr");
                var td, a;
                
                // Make button to load game (with game name)
                a = c("a", {
                    href: "#",
                    text: gameName
                }, function (event) {
                    event.preventDefault();
                    // Show "loading"
                    overlay("overlay_loading");
                    // Load the game
                    loadGame(gameName);
                });
                td = c("td");
                td.appendChild(a);
                tr.appendChild(td);
                
                // Make "Last Modified" cell
                td = c("td", {
                    text: representDate(new Date(gameList[gameName]))
                });
                tr.appendChild(td);
                
                // Make "Rename" button
                a = c("a", {
                    href: "#",
                    text: _("Rename")
                }, function (event) {
                    event.preventDefault();
                    renameGame(gameName);
                });
                td = c("td");
                td.appendChild(a);
                tr.appendChild(td);
                
                // Make "Delete" button
                a = c("a", {
                    href: "#",
                    text: _("Delete")
                }, function (event) {
                    event.preventDefault();
                    deleteGame(gameName);
                });
                td = c("td");
                td.appendChild(a);
                tr.appendChild(td);
                
                container.appendChild(tr);
            });
        });
    }
    
    /**
     * Update the page based on new JSON data.
     */
    function loadJSON() {
        // Check the JSON
        checkJSON();

        // Set the values for the Advanced Properties
        var json = game.jsondata;
        updateAdvancedProperties();

        // Regenerate the table and update the Export button
        generate(true);

        // Scroll up to the top of the page
        window.scrollTo(0, 0);
    }
    
    /**
     * Read a JSON file.
     *
     * @param {File} file - The file to attempt to read.
     *
     * @return {Promise.<object>} The JSON contents of the file.
     */
    function readJSONFile(file) {
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onload = function () {
                if (reader.result) {
                    var result;
                    try {
                        result = JSON.parse(reader.result);
                    } catch (err) {}
                    if (result) {
                        resolve(result);
                    } else {
                        reject(new Error(_("Could not parse JSON.")));
                    }
                } else {
                    reject(new Error(_("File is empty or unreachable.")));
                }
            };
            reader.onerror = function () {
                reject(reader.error);
            };
            reader.readAsText(file);
        });
    }
    
    /**
     * Switch to a specific tab in the overlay.
     *
     * @param {string} tabName - The single-word name of the tab (not including
     *        "overlay_games_tab_" or "overlay_games_").
     */
    function switchTab(tabName) {
        // Hide any old error messages
        document.getElementById("overlay_games_create_invalid").style.display = "none";
        document.getElementById("overlay_games_create_taken").style.display = "none";
        // "Deselect" all the tabs except ours and hide all content except
        // the one for the new tab
        TAB_NAMES.forEach(function (curTabName) {
            // Check tab
            var elem = document.getElementById("overlay_games_tab_" + curTabName);
            if (curTabName == tabName) {
                // Add "selected"
                elem.className += " selected";
            } else {
                // Remove "selected"
                elem.className = removeFromString(elem.className, "selected");
            }
            
            // Check content divs
            elem = document.getElementById("overlay_games_" + curTabName);
            elem.style.display = curTabName == tabName ? "block" : "none";
        });
    }
    
    /**
     * Initialize the game storage system.
     */
    function initGames() {
        // Set up tabs for create/open overlay
        TAB_NAMES.forEach(function (tabName) {
            document.getElementById("overlay_games_tab_" + tabName).addEventListener("click", function (event) {
                event.preventDefault();
                switchTab(tabName);
            }, false);
        });
        
        // Handler for "Create Game" form
        document.getElementById("overlay_games_create_form").addEventListener("submit", function (event) {
            event.preventDefault();
            createGame();
        }, false);
        
        // Handler for "Import Game" (if supported)
        if (typeof window.askForFile == "function") {
            document.getElementById("overlay_games_import_open").addEventListener("click", function (event) {
                event.preventDefault();
                importGame();
            }, false);
        } else {
            // Permanently disable "Import" tab
            TAB_NAMES.splice(TAB_NAMES.indexOf("import"), 1);
            document.getElementById("overlay_games_tab_import").style.display = "none";
        }
        
        // Handler for "Cancel" button
        document.getElementById("overlay_games_cancel").addEventListener("click", function (event) {
            event.preventDefault();
            overlay();
        }, false);
        
        // Handler for "Create/Open" toolbar button
        document.getElementById("toolbar_open").addEventListener("click", function (event) {
            event.preventDefault();
            overlay("overlay_loading");
            updateGameList().then(function () {
                // Make sure the Cancel button is visible
                // (it's hidden by default so that when we first start the user has to create or open something)
                document.getElementById("overlay_games_buttons").style.display = "block";
                // Show the Create/Open overlay
                overlay("overlay_games");
            }).catch(makeCatch(_("Error loading game list")));
        }, false);
        
        // Load the backend
        AUTHOR.BACKEND.init().then(function () {
            // Update the game list
            return updateGameList();
        }).then(function () {
            // Everything's all set up!
            // Switch from loading sign to Create/Open Game overlay
            overlay("overlay_games");
        }).catch(makeCatch(_("Error loading game list")));
    }
    
    window.addEventListener("load", initGames, false);
})();
