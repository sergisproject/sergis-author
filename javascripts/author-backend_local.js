/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

// This file is a SerGIS Author backend. It handles storage locally in the browser.

AUTHOR.BACKEND = {
    /* See http://sergisproject.github.io/docs/author.html */
};

(function () {
    // The name of the current game
    var currentGame;
    
    AUTHOR.BACKEND.init = function (onPromptLock, onGameUpdate) {
        return new Promise(function (resolve, reject) {
            // Set up localforage
            localforage.config({
                name        : "sergis-author",
                version     : 2,
                size        : 20 * 1024 * 1024, // Size of database, in bytes (WebSQL-only, for now)
                storeName   : "sergis_author_games", // Should be alphanumeric, with underscores.
                description : "SerGIS Author Games"
            });
            resolve();
        });
    };
    
    AUTHOR.BACKEND.getGameList = function () {
        return localforage.getItem("gameList").then(function (gameList) {
            if (!gameList) gameList = {};
            return Object.keys(gameList).map(function (gameName) {
                return {
                    name: gameName,
                    lastModified: gameList[gameName]
                };
            });
        });
    };
    
    AUTHOR.BACKEND.renameGame = function (gameName, newGameName) {
        var jsondata;
        return localforage.getItem("gameList").then(function (gameList) {
            if (!gameList) gameList = {};
            if (gameList.hasOwnProperty(newGameName)) {
                return Promise.reject(_("Invalid new game name."));
            } else if (!gameList.hasOwnProperty(gameName)) {
                return Promise.reject(_("Invalid game name."));
            }
            // The old and new game names are valid, so let's continue
            gameList[newGameName] = gameList[gameName];
            delete gameList[gameName];
            return localforage.setItem("gameList", gameList);
        }).then(function () {
            // The updated gameList has been set
            // Get the jsondata for the game
            return localforage.getItem("game_" + gameName);
        }).then(function (_jsondata) {
            // Store the jsondata in memory for now
            jsondata = _jsondata;
            // Remove the jsondata under the old name
            // (we're doing this before re-adding it to try to keep the DB size down)
            return localforage.removeItem("game_" + gameName);
        }).then(function () {
            // Save the jsondata under the new name
            return localforage.setItem("game_" + newGameName, jsondata);
        });
    };
    
    AUTHOR.BACKEND.removeGame = function (gameName) {
        return localforage.getItem("gameList").then(function (gameList) {
            if (!gameList) gameList = {};
            if (gameList.hasOwnProperty(gameName)) delete gameList[gameName];
            return localforage.setItem("gameList", gameList);
        }).then(function () {
            // The new gameList has been set
            // Now, delete the game data
            return localforage.removeItem("game_" + gameName);
        });
    };
    
    AUTHOR.BACKEND.checkGameName = function (gameName) {
        // Make sure gameName is valid before we check its existance
        var gameNameRegex = /^[A-Za-z0-9~$"':;,.\-_]+$/;
        if (!gameName || !gameNameRegex.test(gameName)) return Promise.resolve(-1);
        return localforage.getItem("gameList").then(function (gameList) {
            if (!gameList) gameList = {};
            return gameList.hasOwnProperty(gameName) ? 0 : 1;
        });
    };
    
    AUTHOR.BACKEND.loadGame = function (gameName, ownerUsername) {
        var isNewGame = false;
        return localforage.getItem("gameList").then(function (gameList) {
            if (!gameList) gameList = {};
            // Add the game, if needed
            if (!gameList.hasOwnProperty(gameName)) {
                gameList[gameName] = new Date();
                isNewGame = true;
                // Store the game list
                return localforage.setItem("gameList", gameList);
            }
        }).then(function () {
            // The updated gameList has been set
            if (isNewGame) {
                // Add an empty object for it into the storage
                return localforage.setItem("game_" + gameName, {});
            } else {
                // It must exist, let's get it
                return localforage.getItem("game_" + gameName);
            }
        }).then(function (jsondata) {
            // We're all good!
            currentGame = gameName;
            return {
                jsondata: jsondata || {}
            };
        });
    };
    
    AUTHOR.BACKEND.saveCurrentGame = function (jsondata, path) {
        if (!currentGame) {
            return Promise.reject("No current game.");
        }
        return localforage.getItem("gameList").then(function (gameList) {
            if (!gameList) gameList = {};
            gameList[currentGame] = new Date();
            return localforage.setItem("gameList", gameList);
        }).then(function () {
            // The updated gameList has been set
            // Now, if we have a path, we have to get the old jsondata
            if (path) {
                return localforage.getItem("game_" + currentGame);
            }
        }).then(function (oldjsondata) {
            // Check if we have a path to parse and use
            if (path) {
                var parts = path.split("."),
                    ref_parent = oldjsondata || {},
                    ref = parts.pop();
                parts.forEach(function (part) {
                    // Make sure this part of the path exists
                    if (!ref_parent.hasOwnProperty(part) || typeof ref_parent[part] != "object") {
                        ref_parent[part] = {};
                    }
                    ref_parent = ref_parent[part];
                });
                // Set the jsondata at this path
                ref_parent[ref] = jsondata;
                // Set the game data
                return localforage.setItem("game_" + currentGame, oldjsondata);
            } else {
                // Just set all the jsondata to this
                return localforage.setItem("game_" + currentGame, jsondata);
            }
        });
    };
})();
