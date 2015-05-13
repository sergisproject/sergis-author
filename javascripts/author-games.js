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
    /* lockPrompts */
    /* unlockPrompts */
    /* withLockedPrompts */
    /* reloadGame */
};

// Let's get some typedefs out of the way (for the JSDoc)

/**
 * @typedef {Object} AuthorGame
 * @see {@link http://sergisproject.github.io/docs/author.html#sergis-author-game-object-authorgame}
 */

/**
 * @typedef {Object} AuthorRequest
 * @see {@link http://sergisproject.github.io/docs/author.html#sergis-author-request-object-authorrequest}
 */

/**
 * @typedef {Object} AuthorUser
 * @see {@link http://sergisproject.github.io/docs/author.html#sergis-author-user-object-authoruser}
 */

(function () {
    /** The tabs in overlay_games */
    var TAB_NAMES = ["create", "open", "import"];
    
    /** Whether the backend supports prompt locking */
    var LOCKING_SUPPORTED;
    
    /** Whether the backend supports sharing */
    var SHARING_SUPPORTED;
    
    /** The current game name in the Share overlay */
    var sharingGameItem;
    
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
     * @param {string} [path] - An optional JSON path for the JSON data.
     *        (See http://sergisproject.github.io/docs/author.html)
     *
     * @return {Promise}
     */
    AUTHOR.GAMES.saveGame = function (path) {
        var json = game.jsondata;
        if (path) {
            path.split(".").forEach(function (part) {
                json = json[part];
            });
        }
        return AUTHOR.BACKEND.saveCurrentGame(json, path).then(function () {
            // Woohoo, all good!
            console.log("Saved game" + (path ? " (" + path + ")" : ""));
        });
    };
    
    /**
     * Lock one or more prompts so that we can safely edit them.
     * Prompt indexes are provided in a single array of numbers, or a series of
     * number arguments.
     *
     * @param {Array.<number>} [promptIndexes] - An array of prompt indexes to
     *        lock.
     * @param {...number} [promptIndex] - A prompt index to lock.
     *
     * @return {Promise.<boolean>} Whether the prompt locking was successful.
     */
    AUTHOR.GAMES.lockPrompts = function (/* [promptIndexes], [promptIndex, [promptIndex, [...]]] */) {
        var promptIndexes = Array.prototype.slice.call(arguments, 0);
        if (Array.isArray(promptIndexes[0])) {
            // The first item is an array; remove it and add all its contents to the array
            promptIndexes.unshift.apply(promptIndexes, promptIndexes.shift());
        }
        if (promptIndexes.length === 0) {
            // No prompt indexes; fake success
            return Promise.resolve(true);
        }
        
        console.log("Locking prompts " + promptIndexes.join(", ") + "...");
        
        if (typeof AUTHOR.BACKEND.lockCurrentPrompt != "function") {
            // We can't lock prompts with this backend; fake success
            return Promise.resolve(true);
        }
        
        // Lock the prompts, one-by-one
        // (This function locks promptIndexes[i], and returns a Promise)
        function lockPromptIndex(i) {
            // Are we done yet?
            if (i == promptIndexes.length) {
                // Yup, all done successfully!
                // Base case: we made it through all the prompts; return true
                return Promise.resolve(true);
            }
            
            // Try to lock the "current" prompt index, i.e. promptIndexes[i]
            return AUTHOR.BACKEND.lockCurrentPrompt(promptIndexes[i]).then(function () {
                // Woohoo, this guy's locked!
                // Lock the next guy (and return its Promise)
                return lockPromptIndex(i + 1);
            }, function (err) {
                // Nope, we had an issue locking this prompt
                // First, unlock any prompts that we've already locked
                return AUTHOR.GAMES.unlockPrompts(promptIndexes.slice(0, i)).then(function () {
                    // Okay, now present the user with an error message
                    var msg = err ? "\n" + (err.message || err.name || err) : "";
                    return askForOK(_("Error locking prompt {0} for editing.", promptIndexes[i]) + msg).then(function () {
                        // Now, send `false` back to our caller
                        return false;
                    });
                });
            });
        }
        
        // Start the process
        return lockPromptIndex(0).then(function (success) {
            // All done!
            if (success) {
                console.log("Prompts locked.");
                // Mark the prompts as locked by us
                promptIndexes.forEach(function (promptIndex) {
                    game.ourLockedPrompts[promptIndex] = true;
                });
            } else {
                console.log("Prompts not locked");
            }
            // Pass on whether we were successful
            return success;
        });
    };
    
    /**
     * Unlock one or more prompts that we had locked so that other users can
     * edit them.
     * Prompt indexes are provided in a single array of numbers, or a series of
     * number arguments.
     *
     * @param {Array.<number>} [promptIndexes] - An array of prompt indexes to
     *        lock.
     * @param {...number} promptIndex - A prompt index to unlock.
     *
     * @return {Promise} Resolved when all the unlocking is complete.
     */
    AUTHOR.GAMES.unlockPrompts = function (/* [promptIndexes], [promptIndex, [promptIndex, [...]]] */) {
        var promptIndexes = Array.prototype.slice.call(arguments, 0);
        if (Array.isArray(promptIndexes[0])) {
            // The first item is an array; remove it and add all its contents to the array
            promptIndexes.unshift.apply(promptIndexes, promptIndexes.shift());
        }
        if (promptIndexes.length === 0) {
            // No prompt indexes; fake success
            return Promise.resolve(true);
        }
        
        console.log("Unlocking prompts " + promptIndexes.join(", ") + "...");
        
        if (typeof AUTHOR.BACKEND.unlockCurrentPrompt != "function") {
            // We can't lock prompts with this backend
            return Promise.resolve();
        }
        
        // Call unlockCurrentPrompt for each prompt index and return a Promise
        // that is resolved if all the calls are resolved.
        return Promise.all(promptIndexes.map(function (promptIndex) {
            return AUTHOR.BACKEND.unlockCurrentPrompt(promptIndex);
        })).then(function () {
            // All done!
            console.log("Prompts unlocked.");
            // Mark the prompts as unlocked in our own record-keeping
            promptIndexes.forEach(function (promptIndex) {
                delete game.ourLockedPrompts[promptIndex];
            });
        });
    };
    
    /**
     * Lock some prompts, do something, and then unlock the prompts.
     *
     * @param {Array.<number>} promptIndexes - The prompt indexes to lock.
     * @param {Function} callback - The function to call after the prompts have
     *        been locked. May optionally return a Promise if operating async.
     *
     * @return {Promise}
     */
    AUTHOR.GAMES.withLockedPrompts = function (promptIndexes, callback) {
        var previousOverlay = getOverlay(),
            changedOverlay = false,
            isDone = false;
        // Change the overlay only after a bit of time, if we're still not done
        // (since this might only take a few ms)
        setTimeout(function () {
            if (!isDone) {
                changedOverlay = true;
                overlay("overlay_loading");
            }
        }, 125);
        // Function to put the overlay back when we're done
        function done() {
            isDone = true;
            if (changedOverlay) {
                overlay(previousOverlay || undefined);
            }
        }
        
        // Lock the prompt indexes that we'll be modifying
        return AUTHOR.GAMES.lockPrompts(promptIndexes).then(function (success) {
            // If we're successful, do the thing that we have to do
            if (success) {
                // A place to store callback()'s error if it is rejected
                var rejected_error = null;
                
                // Alrighty, "Zhu Li, do the thing!"
                // (And, if it returns a Promise, wait for it)
                return Promise.resolve(callback()).then(null, function (err) {
                    // 'Twas rejected!
                    // Store the error so we can "re-reject" it after unlocking the prompts
                    rejected_error = err;
                }).then(function () {
                    // Next, unlock the prompts that we had locked
                    return AUTHOR.GAMES.unlockPrompts(promptIndexes);
                }).then(function () {
                    // All done! Take away the loading overlay
                    done();
                    // And, if the original callback rejected, propogate that
                    if (rejected_error !== null) {
                        return Promise.reject(rejected_error);
                    }
                });
            } else {
                // We weren't successful; take away the loading overlay
                done();
            }
        });
    };
    
    /**
     * Reload the game with the backend, and re-lock any prompts that we had
     * locked.
     *
     * @return {Promise}
     */
    AUTHOR.GAMES.reloadGame = function () {
        // Do we have a current game?
        if (!game.name) {
            // Nope!
            return Promise.resolve();
        }
        
        // Store our current locked prompts list for later
        var ourLockedPrompts = game.ourLockedPrompts;
        
        // Reload the current game
        return loadGame(game.name, game.owner).then(function () {
            // Re-lock our previous locked prompts
            return AUTHOR.GAMES.lockPrompts(Object.keys(ourLockedPrompts));
        });
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
        byId("overlay_games_create_invalid").style.display = "none";
        byId("overlay_games_create_taken").style.display = "none";
        // Check the game name
        var gameName = byId("overlay_games_create_name").value;
        AUTHOR.BACKEND.checkGameName(gameName).then(function (status) {
            if (status == -1) {
                // Game name is invalid
                byId("overlay_games_create_invalid").style.display = "block";
                overlay("overlay_games");
            } else if (status === 0) {
                // Game name is taken
                byId("overlay_games_create_taken").style.display = "block";
                overlay("overlay_games");
            } else {
                // All good! Fake load the JSON so it gets created
                loadGame(gameName).then(function () {
                    // Show the instructions
                    byId("instructions").style.display = "block";
                });
            }
        }).catch(makeCatch(_("Error checking game name")));
    }
    
    /**
     * Load a game based on its game name and, possibly, an owner.
     *
     * @param {string} gameName - The name of the game to load.
     * @param {Object} [owner] - The owner of the game, if applicable,
     *        identified by `username` and `displayName`.
     *
     * @return {Promise}
     */
    function loadGame(gameName, owner) {
        return AUTHOR.BACKEND.loadGame(gameName, owner ? owner.username : null).then(function (gamedata) {
            // Update our current game data
            game.name = gameName;
            game.owner = owner || null;
            game.jsondata = gamedata.jsondata;
            game.lockedPrompts = gamedata.lockedPrompts || {};
            game.ourLockedPrompts = {};
            // Check the new JSON, generate the table, and set other inputs
            loadJSON();
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
                    if (!gameName) {
                        // No game :(
                        // Just go back to Create Game overlay
                        switchTab("create");
                        overlay("overlay_games");
                    } else {
                        // Yay, we have a game name!
                        // "Load" the game (i.e. create it) so we have a "current" game
                        return AUTHOR.BACKEND.loadGame(gameName).then(function (gamedata) {
                            // Update our current game data (based on the file, not the "loaded" game)
                            game.name = gameName;
                            game.owner = null;
                            game.jsondata = jsondata;
                            game.lockedPrompts = {};
                            game.ourLockedPrompts = {};
                            // Check the new JSON, generate the table, and set other inputs
                            // (This also saves the game so far)
                            loadJSON();
                        });
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
     * Reload the game list and open up the Sharing dialog for a game.
     *
     * @return {Promise}
     */
    function shareGameWithUpdate(gameName) {
        // Reload game list
        return updateGameList().then(function (gameList) {
            // Find the game in the list
            var gameItem;
            for (var i = 0; i < gameList.length; i++) {
                if (gameList[i].gameName == gameName) {
                    gameItem = gameList[i];
                    break;
                }
            }
            if (gameItem) {
                // Reload sharing overlay
                shareGame(gameItem);
            } else {
                // The game doesn't exist anymore; just go back to other overlay
                overlay("overlay_games");
            }
        });
    }
    
    /**
     * Open up the Sharing dialog for a game.
     *
     * @param {string} gameItem - The game details to share.
     */
    function shareGame(gameItem) {
        sharingGameItem = gameItem;
        
        // Set up sharing overlay
        var container = byId("overlay_sharing_sharedWithContainer");
        while (container.lastChild) {
            container.removeChild(container.lastChild);
        }
        
        var sharedWith = Array.isArray(gameItem.sharedWith) ? gameItem.sharedWith : [];
        sharedWith.forEach(function (user) {
            container.appendChild(create("tr", [
                // Children...
                
                // User display name
                create("td", {
                    text: user.displayName
                }),
                
                // "Unshare" button
                create("td").create("a", {
                    href: "#",
                    text: _("Remove")
                }, function (event) {
                    event.preventDefault();
                    // "Unshare" that user
                    shareGame_unshare(user.username);
                })
            ]));
        });
        
        byId("overlay_sharing_nobody").style.display = sharedWith.length ? "none" : "block";
        byId("overlay_sharing_somebody").style.display = sharedWith.length ? "block" : "none";
        
        // Show sharing overlay
        overlay("overlay_sharing");
    }
    
    /**
     * Share a game with a user.
     *
     * @param {string} username - The username to share with.
     */
    function shareGame_share(username) {
        overlay("overlay_loading");
        AUTHOR.BACKEND.shareGame(sharingGameItem.name, username).then(function () {
            // Shared successfully!
        }, function (err) {
            var msg = err ? "\n" + (err.message || err.name || err) : "";
            return askForOK(_("Error sharing game with {0}:", username) + msg);
        }).then(function () {
            // Reload the game list and sharing overlay
            return shareGameWithUpdate(sharingGameItem.name);
        }).catch(makeCatch(_("Error sharing game")));
    }
    
    /**
     * Unshare a game from a user.
     *
     * @param {string} username - The username to unshare from.
     */
    function shareGame_unshare(username) {
        overlay("overlay_loading");
        AUTHOR.BACKEND.unshareGame(sharingGameItem.name, username).then(function () {
            // Unshared successfully
        }, function (err) {
            var msg = err ? "\n" + (err.message || err.name || err) : "";
            return askForOK(_("Error unsharing game with {0}:", username) + msg);
        }).then(function () {
            // Reload the game list and sharing overlay
            return shareGameWithUpdate(sharingGameItem.name);
        }).catch(makeCatch(_("Error sharing game")));
    }
    
    /**
     * Delete a game after prompting the user for confirmation.
     *
     * @param {string} gameName - The name of the game to delete.
     */
    function deleteGame(gameName) {
        askForConfirmation(
            _("Are you sure that you want to delete {0}?", gameName) +
            (SHARING_SUPPORTED ? "\n" + _("This game will also be unavailable to anyone with whom it is shared.") : "")
        ).then(function (theyAreSure) {
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
     * @return {Promise.<Array.<Object>>} The array of games that we just threw
     *         into the dialog.
     */
    function updateGameList() {
        var gameList;
        return AUTHOR.BACKEND.getGameList().then(function (_gameList) {
            gameList = _gameList;
            if (typeof AUTHOR.BACKEND.getUserList == "function") {
                return AUTHOR.BACKEND.getUserList();
            }
        }).then(function (userList) {
            var hasUsers = false;
            if (userList) {
                // Clear out the old user list
                var userselect = byId("overlay_sharing_orgusers"),
                    optgroups = userselect.getElementsByTagName("optgroup"),
                    optionOther = byId("overlay_sharing_orgusers_other");
                while (optgroups.length) {
                    userselect.removeChild(optgroups[0]);
                }
                
                // Make sure "Other" is selected
                byId("overlay_sharing_orgusers_container").selectedIndex = 0;
                
                // Update the user list
                var usersByGroup = {};
                var groupOrder = [];
                userList.slice(0).forEach(function (user) {
                    hasUsers = true;
                    
                    var group = "" + (user.groupName ? user.groupName : "");
                    if (!usersByGroup[group]) {
                        usersByGroup[group] = [];
                        if (group) {
                            groupOrder.push(group);
                        } else {
                            groupOrder.unshift(group);
                        }
                    }
                    
                    usersByGroup[group].push(user);
                });
                groupOrder.forEach(function (group) {
                    // Make an optgroup for it
                    userselect.appendChild(create("optgroup", {
                        label: group
                    }, usersByGroup[group].map(function (user) {
                        return create("option", {
                            value: user.username,
                            text: user.displayName
                        });
                    })));
                });
            }
            byId("overlay_sharing_orgusers_container").style.display = hasUsers ? "block" : "none";
            byId("overlay_sharing_username").removeAttribute("disabled");
            
            // Clear out the old game lists
            var container = byId("overlay_games_open_gamescontainer");
            while (container.lastChild) {
                container.removeChild(container.lastChild);
            }
            var sharedcontainer = byId("overlay_games_open_shared_gamescontainer");
            while (sharedcontainer.lastChild) {
                sharedcontainer.removeChild(sharedcontainer.lastChild);
            }
            
            // Get some statistics on the games in the game list
                // Whether the user has any of its own games
            var hasOwnGames = false,
                // Whether the user has any games shared with it
                hasSharedGames = false,
                // Whether anyone is editing any of the user's own games
                hasOwnGamesEditing = false,
                // Whether anyone is editing any games shared with the user
                hasSharedGamesEditing = false,
                // Whether any of the user's own games are shared
                hasOwnGamesShared = false;
            
            gameList.forEach(function (gameItem) {
                if (gameItem.owner) {
                    hasSharedGames = true;
                } else {
                    hasOwnGames = true;
                }
                
                if (!gameItem.owner && gameItem.sharedWith && Object.keys(gameItem.sharedWith).length) {
                    hasOwnGamesShared = true;
                }
                if (gameItem.currentlyEditing && gameItem.currentlyEditing.length) {
                    if (gameItem.owner) {
                        hasSharedGamesEditing = true;
                    } else {
                        hasOwnGamesEditing = true;
                    }
                }
            });
            
            // Show appropriate messages if there are no games
            byId("overlay_games_open_nogames").style.display = hasOwnGames ? "none" : "block";
            byId("overlay_games_open_gamescontainercontainer").style.display = hasOwnGames ? "table" : "none";
            byId("overlay_games_open_shared").style.display = hasSharedGames ? "block" : "none";
            
            // Show/hide certain things based on whether anything is shared or being edited
            byId("overlay_games_open_games_sharedWith").style.display = hasOwnGamesShared ? "table-cell" : "none";
            byId("overlay_games_open_games_currentlyEditing").style.display = hasOwnGamesEditing ? "table-cell" : "none";
            byId("overlay_games_open_shared_currentlyEditing").style.display = hasOwnGamesEditing ? "table-cell" : "none";
            
            // Sort the games by last modified date
            gameList.sort(function (a, b) {
                return (new Date(b.lastModified)).getTime() - (new Date(a.lastModified)).getTime();
            }).forEach(function (gameItem) {
                // Make a table row for this game
                var tr = create("tr");
                
                // Make button to load game (with game name)
                tr.appendChild(create("td").create("a", {
                    href: "#",
                    text: gameItem.name
                }, function (event) {
                    event.preventDefault();
                    // Show "loading"
                    overlay("overlay_loading");
                    // Load the game
                    loadGame(gameItem.name, gameItem.owner || undefined);
                }));
                
                // If the game has been shared with us, make "Owner" cell
                if (gameItem.owner) {
                    tr.appendChild(create("td", {
                        text: gameItem.owner.displayName || gameItem.owner.username
                    }));
                }
                
                // Make "Last Modified" cell
                tr.appendChild(create("td", {
                    text: representDate(new Date(gameItem.lastModified))
                }));
                
                // Make "Shared With" cell (if applicable)
                if (hasOwnGamesShared && !gameItem.owner) {
                    var usersSharedWith = !Array.isArray(gameItem.sharedWith) ? [] : gameItem.sharedWith.map(function (user) {
                        return user.displayName;
                    });
                    tr.appendChild(create("td", {
                        text: usersSharedWith.length ? usersSharedWith.join(", \n") : " "
                    }));
                }
                
                // Make "Users Editing" cell (if applicable)
                if ((hasOwnGamesEditing && !gameItem.owner) || (hasSharedGamesEditing && gameItem.owner)) {
                    var usersCurrentlyEditing = !Array.isArray(gameItem.currentlyEditing) ? [] : gameItem.currentlyEditing.map(function (user) {
                        return user.displayName;
                    });
                    tr.appendChild(create("td", {
                        text: usersCurrentlyEditing ? usersCurrentlyEditing.join(", \n") : " "
                    }));
                }
                
                // Make other buttons (if we're the owner)
                if (!gameItem.owner) {
                    // Make "Rename" button
                    tr.appendChild(create("td").create("a", {
                        href: "#",
                        text: _("Rename")
                    }, function (event) {
                        event.preventDefault();
                        renameGame(gameItem.name);
                    }));

                    // Make "Share" button (if sharing is supported and allowed)
                    if (SHARING_SUPPORTED && gameItem.allowSharing) {
                        tr.appendChild(create("td").create("a", {
                            href: "#",
                            text: _("Share")
                        }, function (event) {
                            event.preventDefault();
                            shareGame(gameItem);
                        }));
                    }

                    // Make "Delete" button
                    tr.appendChild(create("td").create("a", {
                        href: "#",
                        text: _("Delete")
                    }, function (event) {
                        event.preventDefault();
                        deleteGame(gameItem.name);
                    }));
                }
                
                // If it's our game, append it to the first table
                // If it's shared with us, append it to the next table
                if (!gameItem.owner) {
                    container.appendChild(tr);
                } else {
                    sharedcontainer.appendChild(tr);
                }
            });
        }).then(function () {
            // And, finally, return the game list
            return gameList;
        });
    }
    
    /**
     * Update the page based on new JSON data.
     */
    function loadJSON() {
        // Check the JSON
        checkJSON();
        // Set the values for the Advanced Properties
        updateAdvancedProperties();
        // Regenerate the table and update the Export button
        generateAndSave(true);
        // Hide all overlays
        overlay();
        // Scroll up to the top of the page
        window.scrollTo(0, 0);
        // Set the page title
        byId("project_title").textContent = game.name;
        // The user is a natural; hide the instructions
        byId("instructions").style.display = "none";
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
        byId("overlay_games_create_invalid").style.display = "none";
        byId("overlay_games_create_taken").style.display = "none";
        // "Deselect" all the tabs except ours and hide all content except
        // the one for the new tab
        TAB_NAMES.forEach(function (curTabName) {
            // Check tab
            var elem = byId("overlay_games_tab_" + curTabName);
            if (curTabName == tabName) {
                // Add "selected"
                elem.className += " selected";
            } else {
                // Remove "selected"
                elem.className = removeFromString(elem.className, "selected");
            }
            
            // Check content divs
            elem = byId("overlay_games_" + curTabName);
            elem.style.display = curTabName == tabName ? "block" : "none";
        });
    }
    
    /**
     * Called when the prompt locks are changed.
     *
     * @param {Object.<number,string>} newLockedPrompts - An object where the
     *        keys represent prompt indexes and the values represent users who
     *        have locked that prompt.
     */
    function onPromptLock(newLockedPrompts) {
        game.lockedPrompts = newLockedPrompts;
        // TODO: Regenerate the table
        // (which we should do if we show locked status in the table)
        //generate(true);
    }
    
    /**
     * Called when another user changes something.
     *
     * @param {*} jsondata - The updated JSON data.
     * @param {string} [path] - The path to where the JSON data is.
     */
    function onGameUpdate(jsondata, path) {
        console.log("Game update from server" + (path ? " (" + path + ")" : ""));
        // Find where to update the JSON
        var ref_parent, ref;
        if (path) {
            var parts = path.split(".");
            ref_parent = game.jsondata || {};
            ref = parts.pop();
            parts.forEach(function (part) {
                // Make sure this part of the path exists
                if (!ref_parent.hasOwnProperty(part) || typeof ref_parent[part] != "object") {
                    ref_parent[part] = {};
                }
                ref_parent = ref_parent[part];
            });
        } else {
            ref_parent = game;
            ref = "jsondata";
        }
        
        // Update our JSON
        ref_parent[ref] = jsondata;
        
        // Update the table, etc.
        generate(true);
        updateAdvancedProperties();
    }
    
    /**
     * Initialize the game storage system.
     */
    function initGames() {
        // Set up LOCKING_SUPPORTED and SHARING_SUPPORTED based on the backend
        LOCKING_SUPPORTED = typeof AUTHOR.BACKEND.lockCurrentPrompt == "function" &&
                            typeof AUTHOR.BACKEND.unlockCurrentPrompt == "function";
        
        SHARING_SUPPORTED = LOCKING_SUPPORTED &&
                            typeof AUTHOR.BACKEND.shareGame == "function" &&
                            typeof AUTHOR.BACKEND.unshareGame == "function";
        
        
        // Set up tabs for create/open overlay
        TAB_NAMES.forEach(function (tabName) {
            byId("overlay_games_tab_" + tabName).addEventListener("click", function (event) {
                event.preventDefault();
                switchTab(tabName);
            }, false);
        });
        
        // Handler for "Create Game" form
        byId("overlay_games_create_form").addEventListener("submit", function (event) {
            event.preventDefault();
            createGame();
        }, false);
        
        // Handler for "Import Game" (if supported)
        if (typeof window.askForFile == "function") {
            byId("overlay_games_import_open").addEventListener("click", function (event) {
                event.preventDefault();
                importGame();
            }, false);
        } else {
            // Permanently disable "Import" tab
            TAB_NAMES.splice(TAB_NAMES.indexOf("import"), 1);
            byId("overlay_games_tab_import").style.display = "none";
        }
        
        // Handler for "Cancel" button
        byId("overlay_games_cancel").addEventListener("click", function (event) {
            event.preventDefault();
            overlay();
        }, false);
        
        // Handler for "Create/Open" toolbar button
        byId("toolbar_open").addEventListener("click", function (event) {
            event.preventDefault();
            overlay("overlay_loading");
            updateGameList().then(function () {
                // Make sure the Cancel button is visible
                // (it's hidden by default so that when we first start the user has to create or open something)
                byId("overlay_games_buttons").style.display = "block";
                // Show the Create/Open overlay
                overlay("overlay_games");
            }).catch(makeCatch(_("Error loading game list")));
        }, false);
        
        // Set up <select> in Sharing overlay
        byId("overlay_sharing_orgusers").addEventListener("change", function (event) {
            if (this.value) {
                // Disable the input box
                byId("overlay_sharing_username").setAttribute("disabled", "disabled");
                // Set the username in the input box
                byId("overlay_sharing_username").value = this.value;
            } else {
                // Enable the input box
                byId("overlay_sharing_username").removeAttribute("disabled");
            }
        }, false);
        
        // Set up <input> in Sharing overlay
        byId("overlay_sharing_username").addEventListener("change", function (event) {
            // Select our value in the select box if it exists
            byId("overlay_sharing_orgusers").value = this.value;
            // See if that hit anything...
            if (!byId("overlay_sharing_orgusers").value) {
                // Set it to the default
                byId("overlay_sharing_orgusers").value = "";
            }
        }, false);
        
        // Set up Share button in Sharing overlay
        byId("overlay_sharing_share").addEventListener("click", function (event) {
            event.preventDefault();
            // Share the game with the identified user
            shareGame_share(byId("overlay_sharing_username").value);
        }, false);
        
        // Handler for "Close" button in Sharing overlay
        byId("overlay_sharing_close").addEventListener("click", function (event) {
            event.preventDefault();
            // Go back to the Create/Open overlay
            overlay("overlay_games");
        }, false);
        
        // Load the backend
        AUTHOR.BACKEND.init(onPromptLock, onGameUpdate).then(function () {
            console.log("Backend initialized");
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
