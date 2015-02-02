/*
    The SerGIS Project - sergis-author

    Copyright (c) 2014, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

/*
 * This is the main JavaScript file for the SerGIS Prompt Author.
 */

// Make sure we have array.forEach
if (typeof Array.prototype.forEach != "function") {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach#Polyfill
    Array.prototype.forEach = function (callback, thisArg) {
        var T, k;
        if (this == null) {
            throw new TypeError('This is null or not defined');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        if (typeof callback !== "function") {
            throw new TypeError(callback + ' is not a function');
        }
        if (arguments.length > 1) {
            T = thisArg;
        }
        k = 0;
        while (k < len) {
            var kValue;
            if (k in O) {
                kValue = O[k];
                callback.call(T, kValue, k, O);
            }
            k++;
        }
    };
}

/**
 * All the main SerGIS Prompt Author functions.
 * @namespace
 */
var AUTHOR = AUTHOR || {};

(function () {
    // The current section(s) that are opened.
    var openSections = [];
    
    // The last group of section(s) that were opened.
    var lastOpenSections = [];
    
    /**
     * Show a specific section element while possibly hiding all the others.
     *
     * @param {string} [sectionId] - The "data-section" of the section to show.
     *        If not provided, shows the lastOpenSections.
     */
    AUTHOR.section = function (sectionId) {
        if (sectionId) {
            // Was this section the last one opened? And the only one opened?
            if (openSections.length == 1 &&
                sectionId == openSections[openSections.length - 1]) {
                // We don't gotst to do nutin'!
                return;
            }
            
            // Move openSections to lastOpenSections and organize it
            lastOpenSections = openSections;
            if (lastOpenSections.indexOf(sectionId) != -1) {
                lastOpenSections.splice(lastOpenSections.indexOf(sectionId), 1);
            }
            lastOpenSections.push(sectionId);
            
            // Create the new openSections
            openSections = [sectionId];
        } else {
            // Show the lastOpenSections
            openSections = lastOpenSections;
        }
        
        // Hide all sections, but show the one(s) we want
        var sectionShown = null, index;
        AUTHOR.DOM.forTag("section", function (section) {
            index = openSections.indexOf(section.getAttribute("data-section"));
            if (index != -1) {
                section.style.order = "" + (index + 1);
                section.style.display = "block";
                if (section.getAttribute("data-section") == sectionId) {
                    // It's the one that we're just showing
                    sectionShown = section;
                }
            } else {
                section.style.display = "none";
                section.style.order = "";
            }
        });
        
        // Trigger a content re-flow (for a WebKit bug that sometimes rears its ugly head)
        document.getElementById("section-wrap").style.visibility = "hidden";
        setTimeout(function () {
            document.getElementById("section-wrap").style.visibility = "visible";
        }, 1);
        
        // Make sure we're scrolled to the top of the section we just opened
        if (sectionShown) sectionShown.scrollTop = 0;
    }
    
    /**
     * Initialize the stuff in this file.
     */
    function init() {
        // Handle clicks on any and all nav sidebar buttons, now and in the future
        AUTHOR.DOM.byId("nav").addEventListener("click", function (event) {
            var current = event.target;
            while (current.nodeName.toLowerCase() != "li" && current.nodeName.toLowerCase() != "nav") {
                current = current.parentNode;
            }
            if (current.nodeName.toLowerCase() == "li" && current.hasAttribute("data-section")) {
                // The user clicked on a nav bar button!
                event.preventDefault();
                AUTHOR.section(current.getAttribute("data-section"));
            }
        }, false);
        
        // Handle double-click anywhere on the nav sidebar (usually a button)
        AUTHOR.DOM.byId("nav").addEventListener("dblclick", function (event) {
            event.preventDefault();
            AUTHOR.section();
        }, false);
        
        // Show "Instructions" section
        AUTHOR.section("instructions");
    }
    
    // NOTE: There are other "load" listeners in the other JS files
    window.addEventListener("load", init, false);
})();