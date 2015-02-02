/*
    The SerGIS Project - sergis-author

    Copyright (c) 2014, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

var AUTHOR = AUTHOR || {};
AUTHOR.PROMPTS = AUTHOR.PROMPTS || {};

(function () {
    // The current promptList in question
    AUTHOR.PROMPTS.promptList = [];
    
    
    /**
     * Create an object representing a prompt.
     * @constructor
     * @param {number} promptIndex - The promptIndex of the prompt.
     * @param {object} json - The current promptList item, following the
     *        structure of an item in "promptList" from the SerGIS JSON Game
     *        Data.
     */
    function Prompt(promptIndex, json) {
        this.promptIndex = promptIndex;
        this.json = json;
        
        // Make a section ID
        var sectionId;
        do {
            sectionId = "section-prompt-" + Math.random();
        } while (AUTHOR.DOM.byId(sectionId));
        
        // Make a nav item (<li>) and append it
        this.navItem = AUTHOR.DOM.create("li", {
            "data-section": sectionId,
            "data-promptIndex": promptIndex,
            className: "nav-prompt-item"
        }).create("a", {
            href: "#",
            text: _("Prompt {0}", this.promptIndex)
        });
        // Append it before the "Add Prompt" button
        AUTHOR.DOM.byId("nav-wrap-prompts").insertBefore(this.navItem, AUTHOR.DOM.byId("nav-wrap-addprompt"));
        
        // Make a <section> and append it
        this.section = AUTHOR.DOM.create("section", {
            "data-section": sectionId,
            className: "section-prompt-item",
            style: "display: none"
        }).create("h2", {
            id: sectionId + "-title"
        });
        // Append it (its order in the whole scheme of things doesn't matter due to CSS flex box ordering)
        AUTHOR.DOM.byId("section-wrap").appendChild(this.section);
        
        // Function to update the content of the <section>
        this.updateSection = function () {
            // Update the title
            var h2 = AUTHOR.DOM.byId(sectionId + "-title");
            h2.textContent = _("Prompt {0}", this.promptIndex);
        };
        
        // And, let's update it
        this.updateSection();
    }
    
    // Called by JSON.stringify
    Prompt.prototype.toJSON = function () {
        return this.json;
    };
    
    
    /**
     * Create everything (nav items, sections for each prompt, etc.) based on
     * an existing promptList (of SerGIS JSON Prompt Objects).
     *
     * @param {Array} promptList - A list of items, following the "promptList"
     *        structure from the SerGIS JSON Game Data.
     */
    AUTHOR.PROMPTS.initPromptList = function (promptList) {
        AUTHOR.PROMPTS.promptList = [];
        
        // Clear out all old prompt nav items (<li>s)
        AUTHOR.DOM.forClass("nav-prompt-item", function (elem) {
            elem.parentNode.removeChild(elem);
        });
        
        // Clear out all old prompt <section>s
        AUTHOR.DOM.forClass("section-prompt-item", function (elem) {
            elem.parentNode.removeChild(elem);
        });
        
        for (var i = 0; i < promptList.length; i++) {
            AUTHOR.PROMPTS.promptList.push(new Prompt(i, promptList[i]));
        }
    };
})();
