/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

// This file is a SerGIS Author backend. It handles storage with an instance of sergis-server.

AUTHOR.BACKEND = {
    /* See http://sergisproject.github.io/legacy-docs/author.html */
};

(function () {
    var socket;
    var token;
    
    // Just direct all the normal functions to the server
    var backendFunctions = ["getGameList", "loadGame", "saveGame", "renameGame", "removeGame", "checkGameName", "previewGame", "publishGame"];
    backendFunctions.forEach(function (func) {
        AUTHOR.BACKEND[func] = function () {
            var args = Array.prototype.slice.call(arguments);
            return new Promise(function (resolve, reject) {
                if (!socket) {
                    reject("No connection to server.");
                } else {
                    socket.emit(func, token, args, function (isResolved, data) {
                        (isResolved ? resolve : reject)(data);
                    });
                }
            });
        };
    });
    
    AUTHOR.BACKEND.init = function () {
        return new Promise(function (resolve, reject) {
            // Load socket.io
            var origin = document.getElementById("author_backend_script").getAttribute("data-socket-io-origin") || window.location.origin;
            var prefix = document.getElementById("author_backend_script").getAttribute("data-socket-io-prefix") || "";
            console.log("Connecting to socket.io at: " + origin + prefix + "/socket.io");
            socket = io.connect(origin + "/author", {
                path: prefix + "/socket.io"
            });
            socket.on("connecting", function () {
                console.log("Connecting to socket server...");
            });
            socket.on("connect", function () {
                console.log("Connected to socket server");
                var session = document.getElementById("author_backend_script").getAttribute("data-session");
                if (!session) {
                    reject();
                    return;
                }

                socket.emit("init", session, function (_token) {
                    if (!_token) {
                        reject();
                    } else {
                        token = _token;
                        resolve();
                    }
                });
            });

            socket.on("connect_failed", function () {
                console.error("Connection to socket server failed.");
            });

            socket.on("disconnect", function () {
                console.log("Disconnected from socket server");
            });
            socket.on("error", function (err) {
                console.log("Error connecting to socket server: ", err);
            });
            socket.on("reconnect", function () {
                console.log("Reconnected to socket server");
            });
            socket.on("reconnecting", function (num) {
                console.log("Reconnecting to socket server... (attempt " + num + ")");
            });
            socket.on("reconnect_error", function (err) {
                console.log("Error reconnecting to socket server: ", err);
            });
            socket.on("reconnect_failed", function () {
                console.log("Failed to reconnect to socket server");
            });
        });
    };
})();
