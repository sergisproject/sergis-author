/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

// This file contains polyfills

// Use Promise polyfill if needed
if (typeof Promise == "undefined") Promise = ES6Promise.Promise;

// Use Array.isArray polyfill is needed
if (typeof Array.isArray != "function") {
    Array.isArray = function (arr) {
        return Object.prototype.toString.call(arg) === "[object Array]";
    };
}

// Make sure console.{log,error} exists
if (typeof console == "undefined") console = {};
if (!console.log) console.log = function () {};
if (!console.error) console.error = console.log;

// Polyfill window.location.origin if needed
if (!window.location.origin) {
    window.location.origin = window.location.protocol + "//" +
        window.location.hostname +
        (window.location.port ? ":" + window.location.port: "");
}
