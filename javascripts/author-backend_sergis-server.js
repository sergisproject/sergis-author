/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

// This file is a SerGIS Author backend. It handles storage with an instance of sergis-server.

AUTHOR.BACKEND = {
    /* See http://sergisproject.github.io/docs/author.html */
};

(function () {
    var socket, onPromptLock, onGameUpdate;
    
    /** Whether to try to reconnect to the socket server when a connection is lost. */
    var TRY_TO_RECONNECT = true;
    
    /**
     * Initialize a socket by listening on events and emitting `init`.
     *
     * @return {Promise}
     */
    function initSocket() {
        return new Promise(function (resolve, reject) {
            var session = byId("author_backend_script").getAttribute("data-session");

            // Set up socket event handlers
            socket.on("promptLock", function (lockedPrompts) {
                onPromptLock(lockedPrompts);
            });
            socket.on("gameUpdate", function (jsondata, path) {
                onGameUpdate(jsondata, path);
            });

            // Emit the "init" event to make sure the socket connection is good
            socket.emit("init", session, function (isResolved, value) {
                if (isResolved) {
                    resolve(value);
                } else {
                    reject(new Error(value || _("Server Error")));
                }
            });
        });
    }
    
    // Just direct all the normal functions to the server
    var backendFunctions = ["getUserList", "getGameList", "renameGame", "shareGame", "unshareGame", "removeGame", "checkGameName", "loadGame", "saveCurrentGame", "previewCurrentGame", "publishCurrentGame", "lockCurrentPrompt", "unlockCurrentPrompt"];
    backendFunctions.forEach(function (func) {
        // Make AUTHOR.BACKEND.function wyatt says hi
        AUTHOR.BACKEND[func] = function () {
            var args = Array.prototype.slice.call(arguments);
            return new Promise(function (resolve, reject) {
                if (!socket) {
                    reject(new Error(_("No connection to server.")));
                } else {
                    socket.emit(func, args, function (isResolved, value) {
                        if (isResolved) {
                            resolve(value);
                        } else {
                            reject(new Error(value || _("Server Error")));
                        }
                    });
                }
            });
        };
    });
    
    // Handle uploadFile specially
    AUTHOR.BACKEND.uploadFile = function (imagefile) {
        return new Promise(function (resolve, reject) {
            console.log("Uploading file: " + (imagefile.name || "file"));
            if (!socket) {
                reject(new Error(_("No connection to server.")));
            } else {
                var stream = ss.createStream();
                ss(socket).emit("uploadFile", stream, [
                    imagefile.name || "file",
                    imagefile.type,
                    imagefile.size
                ], function (isResolved, value) {
                    if (isResolved) {
                        // Check if the file URL is relative
                        var fileURL = "" + value;
                        if (fileURL.substring(0, 1) == "/") {
                            fileURL = window.location.origin + fileURL;
                        }
                        resolve(fileURL);
                    } else {
                        reject(new Error(value || _("Server Error")));
                    }
                });
                var blobStream = ss.createBlobReadStream(imagefile);
                /*
                // Upload progress:
                var uploadedSize = 0;
                blobStream.on("data", function (chunk) {
                    uploadedSize += chunk.length;
                    console.log(Math.floor(size / imagefile.size * 100) + "%");
                });
                */
                blobStream.pipe(stream);
            }
        });
    };
    
    // Handle init specially
    AUTHOR.BACKEND.init = function (_onPromptLock, _onGameUpdate) {
        onPromptLock = _onPromptLock;
        onGameUpdate = _onGameUpdate;
        return new Promise(function (resolve, reject) {
            // Load socket.io
            var origin = byId("author_backend_script").getAttribute("data-socket-io-origin") || window.location.origin;
            var prefix = byId("author_backend_script").getAttribute("data-socket-io-prefix") || "";
            console.log("Connecting to socket.io at: " + origin + prefix + "/socket.io");
            socket = io.connect(origin + "/author", {
                reconnection: TRY_TO_RECONNECT,
                path: prefix + "/socket.io"
            });
            
            var overlayBeforeDisconnect = null;
            
            // Connection-related events
            socket.on("connecting", function () {
                console.log("Connecting to socket server...");
            });
            socket.on("connect", function () {
                // Hooray, we're connected to the server!
                console.log("Connected to socket server.");
                // Initialize ourself and return back when we're done
                resolve(initSocket());
            });
            
            // Reconnection-related events
            socket.on("reconnecting", function () {
                console.log("Reconnecting to socket server...");
            });
            socket.on("reconnect", function () {
                // Hooray, we're reconnected to the server!
                console.log("Reconnected to socket server.");
                // Re-initialize ourself
                initSocket().then(function () {
                    // Reload the game that we were editing
                    return AUTHOR.GAMES.reloadGame();
                }).then(function () {
                    // All ready!
                    overlay(overlayBeforeDisconnect);
                    overlayBeforeDisconnect = null;
                }).catch(makeCatch(_("Error initializing socket")));
            });
            
            // Disconnection-related events
            socket.on("disconnect", function () {
                console.log("Disconnected from socket server.");
                overlayBeforeDisconnect = getOverlay();
                overlay("overlay_loading");
                if (!TRY_TO_RECONNECT) {
                    // We're not going to try to reconnect
                    askForOK(_("The connection to the socket server was lost.") + "\n" + _("Click OK to reload the page.")).then(function () {
                        location.reload();
                    });
                }
            });
            socket.on("reconnect_failed", function () {
                // We couldn't reconnect; tell the user
                askForOK(_("The connection to the socket server was lost.") + "\n" + _("Click OK to reload the page.")).then(function () {
                    location.reload();
                });
            });
            
            // Error-related events
            socket.on("connect_error", function (err) {
                // Fired whenever there is a connection error, including if we're trying to reconnect
                console.error("Error connecting to socket server: ", err);
            });
            socket.on("error", function (err) {
                console.error("Socket server error: ", err);
            });
            
            socket.on("connect_timeout", function () {
                console.error("Socket server connection timed out.");
            });
        });
    };
})();
