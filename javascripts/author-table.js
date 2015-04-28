/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

// This file handles the drawing of the main table.

AUTHOR.TABLE = {
    /* initTable */
    /* setExpandAllPrompts */
};

(function () {
    /**
     * The last-used tabindex (resets at the top of initTable).
     */
    var tabindex = 100;
    
    /**
     * The current promptIndex that we have "open" (if expandAllPrompts==false).
     */
    var currentPromptIndex = null;
    
    /**
     * Whether all prompts should be expanded.
     */
    var expandAllPrompts = false;
    
    /**
     * Whether it's our first time auto-scrolling to the prompt we're at (in
     * which case, we don't want to scroll, because the user just opened the
     * Author).
     */
    var firstTimeScrolling = true;
    
    /**
     * Event handlers for buttons and inputs in the prompt table.
     * @namespace
     */
    var tableEvents = {
        ////////////////////////////////////////////////////////////////////////
        // PROMPT EVENTS
        /**
         * Handler for the "Move Prompt Up" button.
         */
        moveUp: function (event, promptIndex) {
            event.preventDefault();
            event.stopPropagation();
            var promptList = game.jsondata.promptList;
            if (promptIndex !== 0) {
                // No more current prompt index
                currentPromptIndex = null;
                // Swap with the previous one
                var olditem = promptList[promptIndex - 1];
                promptList[promptIndex - 1] = promptList[promptIndex];
                promptList[promptIndex] = olditem;
                // Update any "goto" actions
                swapGotos(promptIndex, promptIndex - 1);
            }
            // Save and regenerate
            generate(true);
        },
        
        /**
         * Handler for the "Move Prompt Down" button.
         */
        moveDown: function (event, promptIndex) {
            event.preventDefault();
            event.stopPropagation();
            var promptList = game.jsondata.promptList;
            if (promptIndex != promptList.length - 1) {
                // No more current prompt index
                currentPromptIndex = null;
                // Swap with the next one
                var olditem = promptList[promptIndex + 1];
                promptList[promptIndex + 1] = promptList[promptIndex];
                promptList[promptIndex] = olditem;
                // Update any "goto" actions
                swapGotos(promptIndex, promptIndex + 1);
            }
            // Save and regenerate
            generate(true);
        },
        
        /**
         * Handler for the "Delete Prompt" button.
         */
        deletePrompt: function (event, promptIndex) {
            event.preventDefault();
            event.stopPropagation();
            var promptList = game.jsondata.promptList;
            // No more current prompt index
            currentPromptIndex = null;
            promptList.splice(promptIndex, 1);
            // Update any "goto" actions (and see if there were any pointing to the prompt we just deleted).
            var occurrences = decrementGotos(promptIndex);
            if (occurrences > 0) {
                alert(_("NOTE: There were " + occurrences + " \"goto\" actions that pointed to the prompt that was just deleted.") + "\n" +
                      _("Also, all other \"goto\" actions have been updated to point to the new prompt indexes that resulted from deleting this prompt."));
            }
            // Save and regenerate
            generate(true);
        },
        
        /**
         * Handler for the "Title" input.
         */
        updateTitle: function (event, promptIndex) {
            game.jsondata.promptList[promptIndex].prompt.title = this.value;
            // Save the game
            generate();
        },
        
        
        /**
         * Handler for any of the inputs in the "Map" column that correspond to
         * properties in a SerGIS JSON Map Object.
         */
        updateMapStuff: function (event, value, stuff, promptIndex) {
            var promptList = game.jsondata.promptList;
            if (value === null) {
                delete promptList[promptIndex].prompt.map[stuff];
            } else {
                promptList[promptIndex].prompt.map[stuff] = value;
            }
            // Save the game
            generate();
        },
        
        /**
         * Handler for the map reinitialization dropdown.
         */
        updateMapReinitialization: function (event, promptIndex) {
            game.jsondata.promptList[promptIndex].map.reinitialize = this.value;
            // Save the game
            generate();
        },
        
        /**
         * Handler for the "Edit Map Properties" button.
         */
        editMapProperties: function (event, promptIndex) {
            event.preventDefault();
            AUTHOR.MAP_PROPERTIES_EDITOR.editMapProperties(promptIndex);
        },
        
        
        ////////////////////////////////////////////////////////////////////////
        // CONTENT EVENTS
        /**
         * Handler for the "Add Content" button.
         */
        addContent: function (event, promptIndex) {
            event.preventDefault();
            AUTHOR.EDITOR.editContent(promptIndex, game.jsondata.promptList[promptIndex].prompt.contents.length, true);
        },
        
        /**
         * Handler for the "Move Content Up" button.
         */
        moveContentUp: function (event, promptIndex, contentIndex) {
            event.preventDefault();
            var promptList = game.jsondata.promptList;
            if (contentIndex !== 0) {
                var olditem = promptList[promptIndex].prompt.contents[contentIndex - 1];
                promptList[promptIndex].prompt.contents[contentIndex - 1] = promptList[promptIndex].prompt.contents[contentIndex];
                promptList[promptIndex].prompt.contents[contentIndex] = olditem;
            }
            // Save and regenerate
            generate(true);
        },
        
        /**
         * Handler for the "Move Content Down" button.
         */
        moveContentDown: function (event, promptIndex, contentIndex) {
            event.preventDefault();
            var promptList = game.jsondata.promptList;
            if (contentIndex != promptList[promptIndex].prompt.contents.length - 1) {
                var olditem = promptList[promptIndex].prompt.contents[contentIndex + 1];
                promptList[promptIndex].prompt.contents[contentIndex + 1] = promptList[promptIndex].prompt.contents[contentIndex];
                promptList[promptIndex].prompt.contents[contentIndex] = olditem;
            }
            // Save and regenerate
            generate(true);
        },
        
        /**
         * Handler for the "Edit Content" button.
         */
        editContent: function (event, promptIndex, contentIndex) {
            event.preventDefault();
            AUTHOR.EDITOR.editContent(promptIndex, contentIndex);
        },
        
        /**
         * Handler for the "Delete Content" button.
         */
        deleteContent: function (event, promptIndex, contentIndex) {
            event.preventDefault();
            game.jsondata.promptList[promptIndex].prompt.contents.splice(contentIndex, 1);
            // Save and regenerate
            generate(true);
        },
        
        
        ////////////////////////////////////////////////////////////////////////
        // CHOICE EVENTS
        /**
         * Handler for the "Add Choice" button.
         */
        addChoice: function (event, promptIndex) {
            event.preventDefault();
            AUTHOR.EDITOR.editChoice(promptIndex, game.jsondata.promptList[promptIndex].prompt.choices.length, true);
        },
        
        /**
         * Handler for the "Randomize Choices" input checkbox.
         */
        updateRandomizeChoices: function (event, promptIndex) {
            game.jsondata.promptList[promptIndex].prompt.randomizeChoices = this.checked;
            // Save the game
            generate();
        },
        
        /**
         * Handler for the "Move Choice Up" button.
         */
        moveChoiceUp: function (event, promptIndex, choiceIndex) {
            event.preventDefault();
            var promptList = game.jsondata.promptList;
            if (choiceIndex !== 0) {
                // Update "choices"
                var olditem = promptList[promptIndex].prompt.choices[choiceIndex - 1];
                promptList[promptIndex].prompt.choices[choiceIndex - 1] = promptList[promptIndex].prompt.choices[choiceIndex];
                promptList[promptIndex].prompt.choices[choiceIndex] = olditem;
                // Update "actionList"
                olditem = promptList[promptIndex].actionList[choiceIndex - 1];
                promptList[promptIndex].actionList[choiceIndex - 1] = promptList[promptIndex].actionList[choiceIndex];
                promptList[promptIndex].actionList[choiceIndex] = olditem;
            }
            // Save and regenerate
            generate(true);
        },
        
        /**
         * Handler for the "Move Choice Down" button.
         */
        moveChoiceDown: function (event, promptIndex, choiceIndex) {
            event.preventDefault();
            var promptList = game.jsondata.promptList;
            if (choiceIndex != promptList[promptIndex].prompt.choices.length - 1) {
                // Update "choices"
                var olditem = promptList[promptIndex].prompt.choices[choiceIndex + 1];
                promptList[promptIndex].prompt.choices[choiceIndex + 1] = promptList[promptIndex].prompt.choices[choiceIndex];
                promptList[promptIndex].prompt.choices[choiceIndex] = olditem;
                // Update "actionList"
                olditem = promptList[promptIndex].actionList[choiceIndex + 1];
                promptList[promptIndex].actionList[choiceIndex + 1] = promptList[promptIndex].actionList[choiceIndex];
                promptList[promptIndex].actionList[choiceIndex] = olditem;
            }
            // Save and regenerate
            generate(true);
        },
        
        /**
         * Handler for the "Edit Choice" button.
         */
        editChoice: function (event, promptIndex, choiceIndex) {
            event.preventDefault();
            AUTHOR.EDITOR.editChoice(promptIndex, choiceIndex);
        },
        
        /**
         * Handler for the "Delete Choice" button.
         */
        deleteChoice: function (event, promptIndex, choiceIndex) {
            event.preventDefault();
            var promptList = game.jsondata.promptList;
            promptList[promptIndex].prompt.choices.splice(choiceIndex, 1);
            promptList[promptIndex].actionList.splice(choiceIndex, 1);
            // Save and regenerate
            generate(true);
        },
        
        /**
         * Handler for the "Point Value" input.
         */
        updatePointValue: function (event, value, promptIndex, choiceIndex) {
            var promptList = game.jsondata.promptList;
            promptList[promptIndex].actionList[choiceIndex].pointValue = value || 0;
            // Save the game
            generate();
        },
        
        
        ////////////////////////////////////////////////////////////////////////
        // ACTION EVENTS
        /**
         * Handler for the "Add Action" button.
         */
        addAction: function (event, promptIndex, choiceIndex) {
            event.preventDefault();
            var promptList = game.jsondata.promptList;
            AUTHOR.ACTION_EDITOR.editAction(promptIndex, choiceIndex, promptList[promptIndex].actionList[choiceIndex].actions.length, true);
        },
        
        /**
         * Handler for the "Move Action Up" button.
         */
        moveActionUp: function (event, promptIndex, choiceIndex, actionIndex) {
            event.preventDefault();
            var promptList = game.jsondata.promptList;
            if (actionIndex !== 0) {
                var olditem = promptList[promptIndex].actionList[choiceIndex].actions[actionIndex - 1];
                promptList[promptIndex].actionList[choiceIndex].actions[actionIndex - 1] = promptList[promptIndex].actionList[choiceIndex].actions[actionIndex];
                promptList[promptIndex].actionList[choiceIndex].actions[actionIndex] = olditem;
            }
            // Save and regenerate
            generate(true);
        },
        
        /**
         * Handler for the "Move Action Down" button.
         */
        moveActionDown: function (event, promptIndex, choiceIndex, actionIndex) {
            event.preventDefault();
            var promptList = game.jsondata.promptList;
            if (choiceIndex != promptList[promptIndex].actionList[choiceIndex].actions.length - 1) {
                var olditem = promptList[promptIndex].actionList[choiceIndex].actions[actionIndex + 1];
                promptList[promptIndex].actionList[choiceIndex].actions[actionIndex + 1] = promptList[promptIndex].actionList[choiceIndex].actions[actionIndex];
                promptList[promptIndex].actionList[choiceIndex].actions[actionIndex] = olditem;
            }
            // Save and regenerate
            generate(true);
        },
        
        /**
         * Handler for the "Edit Action" button.
         */
        editAction: function (event, promptIndex, choiceIndex, actionIndex) {
            event.preventDefault();
            AUTHOR.ACTION_EDITOR.editAction(promptIndex, choiceIndex, actionIndex);
        },
        
        /**
         * Handler for the "Delete Action" button.
         */
        deleteAction: function (event, promptIndex, choiceIndex, actionIndex) {
            event.preventDefault();
            game.jsondata.promptList[promptIndex].actionList[choiceIndex].actions.splice(actionIndex, 1);
            // Save and regenerate
            generate(true);
        },
    };
    
    
    /**
     * Set whether all prompts should be expanded.
     */
    AUTHOR.TABLE.setExpandAllPrompts = function (yesorno) {
        expandAllPrompts = yesorno;
        currentPromptIndex = null;
        checkCurrentPrompt();
    };
    
    /**
     * Set the current prompt.
     */
    function setCurrentPrompt(promptIndex) {
        currentPromptIndex = promptIndex;
        // Re-draw the table
        AUTHOR.TABLE.initTable();
    }
    
    /**
     * Update the table based on currentPrompt and/or expandAllRows, then make
     * sure scrolling is all set up well.
     */
    function checkCurrentPrompt() {
        var elems = document.getElementsByClassName("prompt-row-minimal");
        var expandAllPromptsHere = game.jsondata.promptList.length <= 1 ? true : expandAllPrompts;
        for (var i = 0; i < elems.length; i++) {
            if (!expandAllPromptsHere && (currentPromptIndex === null || elems[i].getAttribute("data-promptIndex") != currentPromptIndex.toString())) {
                elems[i].className = removeFromString(elems[i].className, "prompt-row-hidden");
            } else {
                elems[i].className += " prompt-row-hidden";
            }
        }
        elems = document.getElementsByClassName("prompt-row-full");
        var finalElem;
        for (i = 0; i < elems.length; i++) {
            if (expandAllPromptsHere || (currentPromptIndex !== null && elems[i].getAttribute("data-promptIndex") == currentPromptIndex.toString())) {
                elems[i].className = removeFromString(elems[i].className, "prompt-row-hidden");
                if (elems[i].className.indexOf("toprow") != -1) {
                    finalElem = elems[i];
                }
            } else {
                elems[i].className += " prompt-row-hidden";
            }
        }
        
        // Check scrolling
        checkScroll();
        
        // Scroll the current prompt into view
        if (finalElem) {
            var bodyRect = document.body.getBoundingClientRect(),
                elemRect = finalElem.getBoundingClientRect(),
                offset   = elemRect.top - bodyRect.top;
            if (firstTimeScrolling) {
                firstTimeScrolling = false;
            } else {
                window.scrollTo(0, offset - 60);
            }
        }
    }
    
    
    /**
     * Make the prompt table.
     *
     * @param {number} [newCurrentPromptIndex] - A new current prompt index.
     */
    AUTHOR.TABLE.initTable = function (newCurrentPromptIndex) {
        // Get rid of the old table
        document.getElementById("promptContainer").innerHTML = "";
        // Create the new table; reset the tabindex
        var table = c("table");
        tabindex = 100;
        
        // Make the table header
        var thead = c("thead");
        var tr = c("tr");
        var titles = ["", _("Map"), _("Content"), _("Choices"), _("Actions")];
        for (var i = 0; i < titles.length; i++) {
            tr.appendChild(c("th", {
                text: titles[i]
            }));
        }
        thead.appendChild(tr);
        table.appendChild(thead);
        
        // Make the table body
        var tbody = c("tbody");
        for (i = 0; i < game.jsondata.promptList.length; i++) {
            // Generate each table row
            generateTableRow(tbody, i);
        }
        
        // Make spacer row
        tr = c("tr");
        for (i = 0; i < titles.length; i++) {
            tr.appendChild(c("td", {
                text: " ",
                className: "prompt-container-header-cell-spacer"
            }));
        }
        tbody.appendChild(tr);
        
        // Stick it all in there
        table.appendChild(tbody);
        document.getElementById("promptContainer").appendChild(table);
        
        if (typeof newCurrentPromptIndex == "number") {
            // Select a new current prompt
            currentPromptIndex = newCurrentPromptIndex;
        }
        // Make sure current prompt is selected and scrolling is good
        checkCurrentPrompt();
    };
    
    /**
     * Make a row for initTable.
     *
     * @param {Element} tbody - The tbody that we're working with (that we
     *        should append the new row(s) to).
     * @param {number} promptIndex - The promptIndex of the prompt to add to the
     *        table.
     */
    function generateTableRow(tbody, promptIndex) {
        var tr, td, div, iconRow;
        var table_inner, tbody_inner, tr_inner, td_inner, input;
        var i, id;
        var prompt = game.jsondata.promptList[promptIndex].prompt;
        var mapstuff = [
            // ["SerGIS JSON Map Object property name", "label"]
            ["latitude", _("Latitude:")],
            ["longitude", _("Longitude:")],
            ["zoom", _("Zoom:")]
        ];
        
        ///////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////
        // Make "minimal" row
        tr = c("tr", {
            className: "toprow prompt-row-minimal",
            "data-promptIndex": promptIndex
        });
        
        tr.addEventListener("click", function (event) {
            setCurrentPrompt(promptIndex);
        }, false);

        ///////////////////////////////////////////////////////////////////////
        // Make title column
        td = c("td", {
            className: "row_title"
        });
        div = c("div", {
            className: "row_title_buttons"
        });

        var iconbtns = [],
            iconbtn;

        // Make "Move Prompt Up/Down" buttons
        div.appendChild(iconbtn = c("a", {
            className: "row_title_buttons_up icon side icon_up" + (promptIndex === 0 ? " invisible" : ""),
            href: "#",
            text: " ",
            title: _("Move Prompt Up"),
            tabindex: ++tabindex
        }, tableEvents.moveUp, promptIndex));
        iconbtns.push(iconbtn);

        div.appendChild(iconbtn = c("a", {
            className: "row_title_buttons_down icon side icon_down" + (promptIndex == game.jsondata.promptList.length - 1 ? " invisible" : ""),
            href: "#",
            text: " ",
            title: _("Move Prompt Down"),
            tabindex: ++tabindex
        }, tableEvents.moveDown, promptIndex));
        iconbtns.push(iconbtn);
        td.appendChild(div);

        // Make "Delete Prompt" button
        td.appendChild(iconbtn = c("a", {
            className: "row_title_delete icon side icon_delete",
            href: "#",
            text: " ",
            title: _("Delete Prompt"),
            tabindex: ++tabindex
        }, tableEvents.deletePrompt, promptIndex));
        iconbtns.push(iconbtn);

        // Set up hover for buttons (to make tr background back to normal)
        for (i = 0; i < iconbtns.length; i++) {
            var myTR = tr;
            iconbtns[i].addEventListener("mouseover", function (event) {
                myTR.className += " origcolors";
            }, false);
            iconbtns[i].addEventListener("mouseout", function (event) {
                if (myTR.className.indexOf("origcolors") != -1) {
                    myTR.className = removeFromString(myTR.className, "origcolors");
                }
            }, false);
        }

        // Add "Prompt #" and title
        td.appendChild(c("span", {
            className: "row_minimal_index",
            text: _("Prompt {0}", promptIndex)
        }));
        if (prompt.title) {
            td.appendChild(c("div", {
                className: "row_minimal_title",
                text: prompt.title
            }));
        }

        tr.appendChild(td);

        ///////////////////////////////////////////////////////////////////////
        // Make map column
        // Make inner table to hold the `mapstuff`
        table_inner = c("table", {className: "noborder"});
        tbody_inner = c("tbody");
        // Add basic map properties (`mapstuff`)
        for (i = 0; i < mapstuff.length; i++) {
            tr_inner = c("tr");
            tr_inner.appendChild(c("td", {
                className: "smaller",
                text: mapstuff[i][1] + " "
            }));
            tr_inner.appendChild(c("td", {
                className: "smaller",
                text: prompt.map[mapstuff[i][0]]
            }));
            tbody_inner.appendChild(tr_inner);
        }
        // TODO: Add frontend properties
        table_inner.appendChild(tbody_inner);
        td = c("td");
        td.appendChild(table_inner);
        tr.appendChild(td);

        ///////////////////////////////////////////////////////////////////////
        // Make content column
        td = c("td", {
            colspan: 3
        });
        // Make a "minirow" for each content
        for (i = 0; i < prompt.contents.length; i++) {
            div = c("div", {
                className: "row_content_text minirow"
            });
            // The actual content
            div.appendChild(c("span", {
                className: "box wide",
                html: AUTHOR.JSON_CONTENT.contentTypes[prompt.contents[i].type].toHTML(prompt.contents[i]),
                title: prompt.contents[i].value
            }));
            td.appendChild(div);
        }
        // Show the number of choices
        td.appendChild(c("div", {
            text: _("{0} choices", prompt.choices.length),
            style: "text-align: right;"
        }));
        tr.appendChild(td);

        // Add minimal row to table
        tbody.appendChild(tr);
        
        
        ///////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////
        // Make "full" row
        tr = c("tr", {
            className: "toprow prompt-row-full",
            "data-promptIndex": promptIndex
        });
        
        ///////////////////////////////////////////////////////////////////////
        // Make title column
        td = c("td", {
            className: "row_title",
            rowspan: prompt.choices.length + 1
        });
        div = c("div", {
            className: "row_title_buttons"
        });
        
        // Make "Move Prompt Up/Down" buttons
        div.appendChild(c("a", {
            className: "row_title_buttons_up icon side icon_up" + (promptIndex === 0 ? " invisible" : ""),
            href: "#",
            text: " ",
            title: _("Move Prompt Up"),
            tabindex: ++tabindex
        }, tableEvents.moveUp, promptIndex));
        div.appendChild(c("a", {
            className: "row_title_buttons_down icon side icon_down" + (promptIndex == game.jsondata.promptList.length - 1 ? " invisible" : ""),
            href: "#",
            text: " ",
            title: _("Move Prompt Down"),
            tabindex: ++tabindex
        }, tableEvents.moveDown, promptIndex));
        td.appendChild(div);
        
        // Make "Delete Prompt" button
        td.appendChild(c("a", {
            className: "row_title_delete icon side icon_delete",
            href: "#",
            text: " ",
            title: _("Delete Prompt"),
            tabindex: ++tabindex
        }, tableEvents.deletePrompt, promptIndex));
        
        // Add "Prompt #"
        td.appendChild(c("span", {
            className: "row_title_index",
            text: _("Prompt {0}", promptIndex)
        }));
        td.appendChild(c("br"));
        td.appendChild(c("br"));
        
        // Make title input
        td.appendChild(c("input", {
            className: "row_title_input",
            placeholder: _("Prompt Title"),
            value: prompt.title,
            tabindex: ++tabindex
        }, tableEvents.updateTitle, promptIndex));
        
        tr.appendChild(td);
        
        ///////////////////////////////////////////////////////////////////////
        // Make map column
        // Make inner table to hold the `mapstuff`
        table_inner = c("table", {className: "noborder"});
        tbody_inner = c("tbody");
        for (i = 0; i < mapstuff.length; i++) {
            tr_inner = c("tr");
            id = "row_map_" + mapstuff[i][0] + "_" + randID();
            td_inner = c("td");
            td_inner.appendChild(c("label", {
                text: mapstuff[i][1] + " ",
                "for": id
            }));
            tr_inner.appendChild(td_inner);
            td_inner = c("td");
            input = c("input", {
                className: "row_map_" + mapstuff[i][0],
                id: id,
                size: "9",
                type: "number",
                step: "any",
                tabindex: ++tabindex,
                value: prompt.map[mapstuff[i][0]]
            });
            addNumericChangeHandler(input, (function (stuff, promptIndex) {
                return function (event, value) {
                    tableEvents.updateMapStuff(event, value, stuff, promptIndex);
                };
            })(mapstuff[i][0], promptIndex));
            td_inner.appendChild(input);
            tr_inner.appendChild(td_inner);
            tbody_inner.appendChild(tr_inner);
        }
        table_inner.appendChild(tbody_inner);
        td = c("td", {
            className: "row_map",
            rowspan: prompt.choices.length + 1
        });
        td.appendChild(table_inner);
        
        // Make reinitialization dropdown, if applicable
        if (!game.jsondata.alwaysReinitializeMap) {
            input = c("select", {
                tabindex: ++tabindex,
                title: _("Resetting the map removes all user drawings and other drawn objects on the map.")
            }, tableEvents.updateMapReinitialization, promptIndex);
            input.appendChild(c("option", {
                value: "",
                text: _("Don't reset map"),
                selected: (prompt.map.reinitialize != "before" && prompt.map.reinitialize != "after") ? "selected" : undefined
            }));
            input.appendChild(c("option", {
                value: "before",
                text: _("Reset before prompt"),
                title: _("Reset the map before showing this prompt"),
                selected: prompt.map.reinitialize == "before" ? "selected" : undefined
            }));
            input.appendChild(c("option", {
                value: "after",
                text: _("Reset after prompt"),
                title: _("Reset the map after showing this prompt, before showing the next one"),
                selected: prompt.map.reinitialize == "after" ? "selected" : undefined
            }));
            div = c("div", {
                className: "marginLikeTable"
            });
            div.appendChild(input);
            td.appendChild(div);
        }
        
        // Make "Edit Map Properties" button
        td.appendChild(c("button", {
            text: _("Edit Map Properties"),
            tabindex: ++tabindex
        }, tableEvents.editMapProperties, promptIndex));
        tr.appendChild(td);
        
        ///////////////////////////////////////////////////////////////////////
        // Make content column
        td = c("td", {
            className: "row_content",
            rowspan: prompt.choices.length + 1
        });
        // Make a "minirow" for each content
        for (i = 0; i < prompt.contents.length; i++) {
            div = c("div", {
                className: "row_content_text minirow"
            });
            
            // Make icons/buttons
            iconRow = c("div", {
                className: "icon-row"
            });
            // Make "Move Content Up/Down" buttons
            iconRow.appendChild(c("a", {
                className: "row_content_up icon icon_up" + (i === 0 ? " invisible" : ""),
                href: "#",
                text: " ",
                title: _("Move Content Up"),
                tabindex: ++tabindex
            }, tableEvents.moveContentUp, promptIndex, i));
            iconRow.appendChild(c("a", {
                className: "row_content_down icon icon_down" + (i == prompt.contents.length - 1 ? " invisible" : ""),
                href: "#",
                text: " ",
                title: _("Move Content Down"),
                tabindex: ++tabindex
            }, tableEvents.moveContentDown, promptIndex, i));
            
            // Make "Edit Content" and "Delete Content" buttons
            iconRow.appendChild(c("a", {
                className: "row_content_edit icon icon_edit",
                href: "#",
                text: " ",
                title: _("Edit Content"),
                tabindex: ++tabindex,
            }, tableEvents.editContent, promptIndex, i));
            iconRow.appendChild(c("a", {
                className: "row_content_delete icon icon_delete",
                href: "#",
                text: " ",
                title: _("Delete Content"),
                tabindex: ++tabindex,
            }, tableEvents.deleteContent, promptIndex, i));
            
            div.appendChild(iconRow);
            
            // Show the actual content
            div.appendChild(c("span", {
                className: "box",
                html: AUTHOR.JSON_CONTENT.contentTypes[prompt.contents[i].type].toHTML(prompt.contents[i]),
                title: prompt.contents[i].value
            }));
            td.appendChild(div);
        }
        
        // Make "Add Content" button
        td.appendChild(c("button", {
            className: "row_content_add",
            text: _("Add Content"),
            tabindex: ++tabindex
        }, tableEvents.addContent, promptIndex));
        tr.appendChild(td);
        
        ///////////////////////////////////////////////////////////////////////
        // Make choices and actions columns
        td = c("td", {
            className: "row_randomizeChoices",
            colspan: "2"
        });
        
        // Make "Randomize Choices" input checkbox
        div = c("div");
        div.style.cssFloat = "right";
        id = "row_randomizeChoices_cbox_" + randID();
        div.appendChild(c("input", {
            className: "row_randomizeChoices_cbox",
            type: "checkbox",
            id: id,
            tabindex: ++tabindex + 1,
            checked: prompt.randomizeChoices
        }, tableEvents.updateRandomizeChoices, promptIndex));
        div.appendChild(c("label", {
            text: " " + _("Randomize Choices"),
            "for": id
        }));
        td.appendChild(div);
        
        // Make "Add Choice" button
        td.appendChild(c("button", {
            className: "row_addChoice_btn",
            text: _("Add Choice"),
            tabindex: tabindex
        }, tableEvents.addChoice, promptIndex));
        tr.appendChild(td);
        
        // Add full row to table
        tbody.appendChild(tr);
        
        // Generate each choice/action row
        for (i = 0; i < prompt.choices.length; i++) {
            generateTableChoice(tbody, promptIndex, i);
        }
    }
    
    /**
     * Make the "choices" and "actions" rows columns for generateTableRow.
     *
     * @param {Element} tbody - The tbody that we're working with (that we
     *        should append the new row(s) to).
     * @param {number} promptIndex - The promptIndex of the prompt that we're in
     *        the process of adding to the table.
     * @param {number} choiceIndex - The choiceIndex of the choice within the
     *        current prompt that we're adding to the table.
     */
    function generateTableChoice(tbody, promptIndex, choiceIndex) {
        var tr, td, div, input, ul, li, iconRow;
        var i, id, dataContent;
        var prompt = game.jsondata.promptList[promptIndex].prompt,
            choice = prompt.choices[choiceIndex],
            action = game.jsondata.promptList[promptIndex].actionList[choiceIndex];
        
        // Make row
        tr = c("tr", {
            className: "prompt-row-full prompt-row-hidden",
            "data-promptIndex": promptIndex
        });
        
        // Make choice column
        td = c("td", {
            className: "row_choice"
        });
        div = c("div", {
            className: "row"
        });
        
        // Make icons/buttons
        iconRow = c("div", {
            className: "icon-row"
        });
        
        // Make "Move Choice Up/Down" buttons
        iconRow.appendChild(c("a", {
            className: "row_choice_up icon icon_up" + (choiceIndex === 0 ? " invisible" : ""),
            href: "#",
            text: " ",
            title: _("Move Choice Up"),
            tabindex: ++tabindex
        }, tableEvents.moveChoiceUp, promptIndex, choiceIndex));
        iconRow.appendChild(c("a", {
            className: "row_choice_down icon icon_down" + (choiceIndex == prompt.choices.length - 1 ? " invisible" : ""),
            href: "#",
            text: " ",
            title: _("Move Choice Down"),
            tabindex: ++tabindex
        }, tableEvents.moveChoiceDown, promptIndex, choiceIndex));
        
        // Make "Edit Choice" and "Delete Choice" buttons
        iconRow.appendChild(c("a", {
            className: "row_choice_edit icon icon_edit",
            href: "#",
            text: " ",
            title: _("Edit Choice"),
            tabindex: ++tabindex
        }, tableEvents.editChoice, promptIndex, choiceIndex));
        iconRow.appendChild(c("a", {
            className: "row_choice_delete icon icon_delete",
            href: "#",
            text: " ",
            title: _("Delete Choice"),
            tabindex: ++tabindex
        }, tableEvents.deleteChoice, promptIndex, choiceIndex));
        
        div.appendChild(iconRow);
        
        // Make choice content
        div.appendChild(c("span", {
            className: "box",
            html: AUTHOR.JSON_CONTENT.contentTypes[choice.type].toHTML(choice),
            title: choice.value
        }));
        td.appendChild(div);
        
        // Make "Point Value" input
        id = "row_choice_pointValue_" + randID();
        div = c("div");
        div.style.clear = "both";
        div.appendChild(c("label", {
            "for": id,
            text: _("Point Value:") + " "
        }));
        input = c("input", {
            type: "number",
            step: "1",
            value: action.pointValue,
            tabindex: ++tabindex
        });
        addNumericChangeHandler(input, function (event, value) {
            tableEvents.updatePointValue(event, value, promptIndex, choiceIndex);
        });
        div.appendChild(input);
        td.appendChild(div);
        tr.appendChild(td);
        
        // Make actions column
        td = c("td", {
            className: "row_action"
        });
        if (action.actions.length > 0) {
            for (i = 0; i < action.actions.length; i++) {
                div = c("div", {
                    className: "row_action_div minirow"
                });
                
                // Make icons/buttons
                iconRow = c("div", {
                    className: "icon-row"
                });
                
                // Make "Move Action Up/Down" buttons
                iconRow.appendChild(c("a", {
                    className: "row_action_up icon icon_up" + (i === 0 ? " invisible" : ""),
                    href: "#",
                    text: " ",
                    title: _("Move Action Up"),
                    tabindex: ++tabindex
                }, tableEvents.moveActionUp, promptIndex, choiceIndex, i));
                iconRow.appendChild(c("a", {
                    className: "row_action_down icon icon_down" + (i == action.actions.length - 1 ? " invisible" : ""),
                    href: "#",
                    text: " ",
                    title: _("Move Action Down"),
                    tabindex: ++tabindex
                }, tableEvents.moveActionDown, promptIndex, choiceIndex, i));
                
                // Make "Edit Action" and "Delete Action" buttons
                iconRow.appendChild(c("a", {
                    className: "row_action_edit icon icon_edit",
                    href: "#",
                    text: " ",
                    title: _("Edit Action"),
                    tabindex: ++tabindex
                }, tableEvents.editAction, promptIndex, choiceIndex, i));
                iconRow.appendChild(c("a", {
                    className: "row_action_delete icon icon_delete",
                    href: "#",
                    text: " ",
                    title: _("Delete Action"),
                    tabindex: ++tabindex
                }, tableEvents.deleteAction, promptIndex, choiceIndex, i));

                div.appendChild(iconRow);
                
                if (action.actions[i].frontend) {
                    dataContent = AUTHOR.JSON.actionsByFrontend[action.actions[i].frontend][action.actions[i].name];
                } else {
                    dataContent = AUTHOR.JSON.actions[action.actions[i].name];
                }
                div.appendChild(c("span", {
                    className: "row_action_data box",
                    html: dataContent ? dataContent.toHTML(action.actions[i].data) : undefined,
                    text: dataContent ? undefined : action.actions[i].name,
                    title: JSON.stringify(action.actions[i].data)
                }));
                td.appendChild(div);
            }
        } else {
            td.appendChild(c("span", {
                className: "row_action_noActions",
                text: _("No actions.")
            }));
        }
        
        // Make "Add Action" button
        var p = c("p");
        p.appendChild(c("button", {
            text: _("Add Action"),
            tabindex: ++tabindex
        }, tableEvents.addAction, promptIndex, choiceIndex));
        td.appendChild(p);
        
        tr.appendChild(td);
        
        tbody.appendChild(tr);
    }
    
    /** Whether the browser supports "window.pageXOffset" (for checkScroll). */
    var supportPageOffset = window.pageXOffset !== undefined;
    /** Whether the browser's in "Standards Mode" (opposed to "Quirks Mode"). */
    var isCSS1Compat = ((document.compatMode || "") === "CSS1Compat");
    
    /** Helper function to set the proper width on the table columns. */
    function setHeaderWidths(tbl, thead, auto) {
        // Make sure the header cells stay the same width
        thead.style.width = auto ? "auto" : thead.offsetWidth + "px";
        var kids = tbl.getElementsByTagName("th");
        var kidSpacers = tbl.getElementsByClassName("prompt-container-header-cell-spacer");
        for (var j = 0; j < kids.length; j++) {
            kidSpacers[j].style.minWidth = kids[j].style.width = auto ? "auto" : kids[j].offsetWidth + "px";
        }
    }
    
    /**
     * Check the scrolling and set up the table header accordingly.
     */
    function checkScroll() {
        var tbl = document.getElementById("promptContainer").childNodes[0];
        if (tbl) {
            // Find the <thead>
            var thead;
            for (var i = 0; i < tbl.childNodes.length; i++) {
                if (tbl.childNodes[i].nodeName.toLowerCase() == "thead") {
                    thead = tbl.childNodes[i];
                    break;
                }
            }
            
            // Find the amount that the window is scrolled
            var scrollY = supportPageOffset ? window.pageYOffset :
                isCSS1Compat ? document.documentElement.scrollTop : document.body.scrollTop;
            
            // Find out how far the table is from the top of the page
            var elem = tbl;
            var offsetY = elem.offsetTop;
            while ((elem = elem.offsetParent)) {
                offsetY += elem.offsetTop || 0;
            }
            
            // Reset any and all spacing
            tbl.className = removeFromString(tbl.className, "scrollFixed");
            setHeaderWidths(tbl, thead, true);
            
            // Check if we should be .scrollFixed
            if (scrollY >= offsetY) {
                setHeaderWidths(tbl, thead);
                // And, we should be .scrollFixed; let's add the class
                tbl.className += " scrollFixed";
            }
        }
    }

    // Set up the scrolling
    window.addEventListener("load", function (event) {
        window.addEventListener("scroll", function (event) {
            checkScroll();
        }, false);
        checkScroll();
    }, false);
})();
