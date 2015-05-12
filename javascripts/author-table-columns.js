/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

// This file handles generating the content for the table columns.
// Each public function follows the spec in author-table.js (see the TABLE_COLUMNS docstring).

AUTHOR.TABLE_COLUMNS = {
    /* generateMinimalRow */
    /* generateTitleColumn */
    /* generateMapColumn */
    /* generateContentColumn */
    /* generateChoicesColumn */
    /* generateActionsColumn */
};

(function () {
    /**
     * The different map properties.
     */
    var mapstuff = [
        // ["SerGIS JSON Map Object property name", "label", default]
        ["latitude", _("Latitude:"), 0],
        ["longitude", _("Longitude:"), 0],
        ["zoom", _("Zoom:"), 3]
    ];
    
    /**
     * Event handlers for buttons and inputs in the prompt table.
     * @namespace
     */
    var TABLE_EVENTS = {
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
                // All the prompt indexes that will be affected
                var promptIndexes = [promptIndex, promptIndex - 1];
                // Update the promptIndexes array with any other prompts affected by the ones we already have
                findRelatedPromptIndexes(promptIndexes);
                
                // Lock the prompts we need so that we can safely edit them
                // Also handles unlocking and saving afterwards
                AUTHOR.GAMES.withLockedPrompts(promptIndexes, function () {
                    // Prompts locked successfully; swap the prompt with the previous one
                    var olditem = promptList[promptIndex - 1];
                    promptList[promptIndex - 1] = promptList[promptIndex];
                    promptList[promptIndex] = olditem;
                    // Update any "goto" actions
                    swapGotos(promptIndex, promptIndex - 1);
                    // Save and regenerate
                    return generateAndSave(true, promptIndex - 1);
                }).catch(makeCatch(_("Error moving prompt up")));
            }
        },
        
        /**
         * Handler for the "Move Prompt Down" button.
         */
        moveDown: function (event, promptIndex) {
            event.preventDefault();
            event.stopPropagation();
            var promptList = game.jsondata.promptList;
            if (promptIndex != promptList.length - 1) {
                // All the prompt indexes that will be affected
                var promptIndexes = [promptIndex, promptIndex + 1];
                // Update the promptIndexes array with any other prompts affected by the ones we already have
                findRelatedPromptIndexes(promptIndexes);
                
                // Lock the prompts we need so that we can safely edit them
                // Also handles unlocking and saving afterwards
                AUTHOR.GAMES.withLockedPrompts(promptIndexes, function () {
                    // Prompts locked successfully; swap with the next one
                    var olditem = promptList[promptIndex + 1];
                    promptList[promptIndex + 1] = promptList[promptIndex];
                    promptList[promptIndex] = olditem;
                    // Update any "goto" actions
                    swapGotos(promptIndex, promptIndex + 1);
                    // Save and regenerate
                    return generateAndSave(true, promptIndex + 1);
                }).catch(makeCatch(_("Error moving prompt down")));
            }
        },
        
        /**
         * Handler for the "Delete Prompt" button.
         */
        deletePrompt: function (event, promptIndex) {
            event.preventDefault();
            event.stopPropagation();
            var promptList = game.jsondata.promptList;
            
            // All the prompts that will be affected by removing this one
            var promptIndexes = [];
            for (var i = promptIndex; i < promptList.length; i++) {
                promptIndex.push(i);
            }
            // Update the promptIndexes array with any other prompts affected by the ones we already have
            findRelatedPromptIndexes(promptIndexes);
            
            var occurrences;
            // Lock the prompts we need so that we can safely edit them
            // Also handles unlocking and saving afterwards
            AUTHOR.GAMES.withLockedPrompts(promptIndexes, function () {
                // Prompts locked successfully; now we can do the things
                promptList.splice(promptIndex, 1);
                // Update any "goto" actions (and see if there were any pointing to the prompt we just deleted)
                occurrences = decrementGotos(promptIndex);
                // Save and regenerate
                return generateAndSave(true, Math.min(promptIndex, game.jsondata.promptList.length - 1));
            }).then(function () {
                // Tell the user if this screws up their goto actions
                if (occurrences) {
                    return askForOK(
                        _("NOTE: There were " + occurrences + " \"goto\" actions that pointed to the prompt that was just deleted.") + "\n" +
                        _("Also, all other \"goto\" actions have been updated to point to the new prompt indexes that resulted from deleting this prompt.")
                    );
                }
            }).catch(makeCatch(_("Error deleting prompt")));
        },
        
        /**
         * Handler for the "Title" input.
         */
        updateTitle: function (event, promptIndex) {
            game.jsondata.promptList[promptIndex].prompt.title = this.value;
            // Save the game
            generateAndSave(undefined, undefined, "promptList." + promptIndex + ".prompt.title");
        },
        
        
        /**
         * Handler for the map "Same as previous prompt" checkbox.
         */
        updateMapSameCheckbox: function (event, promptIndex, tableID, prevMapstuffValues) {
            var promptItem = game.jsondata.promptList[promptIndex];
            var sameAsPreviousPrompt = this.checked;
            byId(tableID).style.display = sameAsPreviousPrompt ? "none" : "table";
            mapstuff.forEach(function (mapitem, index) {
                var property = mapitem[0],
                    label = mapitem[1],
                    defaultValue = mapitem[2];
                if (sameAsPreviousPrompt) {
                    // Set it to null (indicating same as previous)
                    prevMapstuffValues[index] = promptItem.prompt.map[property];
                    promptItem.prompt.map[property] = null;
                } else {
                    // Restore to the previous value, if available
                    promptItem.prompt.map[property] = prevMapstuffValues[index] || defaultValue;
                }
            });
            // Same the game
            generateAndSave(undefined, undefined, "promptList." + promptIndex + ".prompt.map");
        },
        
        /**
         * Handler for any of the inputs in the "Map" column that correspond to
         * properties in a SerGIS JSON Map Object.
         */
        updateMapStuff: function (event, value, mapitem, promptIndex) {
            var promptList = game.jsondata.promptList;
            var property = mapitem[0],
                label = mapitem[1],
                defaultValue = mapitem[2];
            if (value === null) {
                value = this.value = defaultValue;
            }
            promptList[promptIndex].prompt.map[property] = value;
            // Save the game
            generateAndSave(undefined, undefined, "promptList." + promptIndex + ".prompt.map");
        },
        
        /**
         * Handler for the map reinitialization dropdown.
         */
        updateMapReinitialization: function (event, promptIndex) {
            game.jsondata.promptList[promptIndex].prompt.map.reinitialize = this.value;
            // Save the game
            generateAndSave(undefined, undefined, "promptList." + promptIndex + ".prompt.map");
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
                // Lock this prompt so we can safely edit it
                // Also handles unlocking and saving afterwards
                AUTHOR.GAMES.withLockedPrompts([promptIndex], function () {
                    // Prompt locked successfully
                    var olditem = promptList[promptIndex].prompt.contents[contentIndex - 1];
                    promptList[promptIndex].prompt.contents[contentIndex - 1] = promptList[promptIndex].prompt.contents[contentIndex];
                    promptList[promptIndex].prompt.contents[contentIndex] = olditem;
                    // Save and regenerate
                    return generateAndSave(true, undefined, "promptList." + promptIndex + ".prompt.contents");
                }).catch(makeCatch(_("Error moving content up")));
            }
        },
        
        /**
         * Handler for the "Move Content Down" button.
         */
        moveContentDown: function (event, promptIndex, contentIndex) {
            event.preventDefault();
            var promptList = game.jsondata.promptList;
            if (contentIndex != promptList[promptIndex].prompt.contents.length - 1) {
                // Lock this prompt so we can safely edit it
                // Also handles unlocking and saving afterwards
                AUTHOR.GAMES.withLockedPrompts([promptIndex], function () {
                    // Prompt locked successfully
                    var olditem = promptList[promptIndex].prompt.contents[contentIndex + 1];
                    promptList[promptIndex].prompt.contents[contentIndex + 1] = promptList[promptIndex].prompt.contents[contentIndex];
                    promptList[promptIndex].prompt.contents[contentIndex] = olditem;
                    // Save and regenerate
                    return generateAndSave(true, undefined, "promptList." + promptIndex + ".prompt.contents");
                }).catch(makeCatch(_("Error moving content down")));
            }
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
            // Lock this prompt so we can safely edit it
            // Also handles unlocking and saving afterwards
            AUTHOR.GAMES.withLockedPrompts([promptIndex], function () {
                // Prompt locked successfully
                game.jsondata.promptList[promptIndex].prompt.contents.splice(contentIndex, 1);
                // Save and regenerate
                return generateAndSave(true, undefined, "promptList." + promptIndex + ".prompt.contents");
            }).catch(makeCatch(_("Error deleting content")));
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
            generateAndSave(undefined, undefined, "promptList." + promptIndex + ".prompt.randomizeChoices");
        },
        
        /**
         * Handler for the "Move Choice Up" button.
         */
        moveChoiceUp: function (event, promptIndex, choiceIndex) {
            event.preventDefault();
            var promptList = game.jsondata.promptList;
            if (choiceIndex !== 0) {
                // Lock this prompt so we can safely edit it
                // Also handles unlocking and saving afterwards
                AUTHOR.GAMES.withLockedPrompts([promptIndex], function () {
                    // Prompt locked successfully
                    
                    // Update "choices"
                    var olditem = promptList[promptIndex].prompt.choices[choiceIndex - 1];
                    promptList[promptIndex].prompt.choices[choiceIndex - 1] = promptList[promptIndex].prompt.choices[choiceIndex];
                    promptList[promptIndex].prompt.choices[choiceIndex] = olditem;
                    
                    // Update "actionList"
                    olditem = promptList[promptIndex].actionList[choiceIndex - 1];
                    promptList[promptIndex].actionList[choiceIndex - 1] = promptList[promptIndex].actionList[choiceIndex];
                    promptList[promptIndex].actionList[choiceIndex] = olditem;
                    
                    // Save and regenerate
                    return generateAndSave(true, undefined, "promptList." + promptIndex);
                }).catch(makeCatch(_("Error moving choice up")));
            }
        },
        
        /**
         * Handler for the "Move Choice Down" button.
         */
        moveChoiceDown: function (event, promptIndex, choiceIndex) {
            event.preventDefault();
            var promptList = game.jsondata.promptList;
            if (choiceIndex != promptList[promptIndex].prompt.choices.length - 1) {
                // Lock this prompt so we can safely edit it
                // Also handles unlocking and saving afterwards
                AUTHOR.GAMES.withLockedPrompts([promptIndex], function () {
                    // Prompt locked successfully
                    
                    // Update "choices"
                    var olditem = promptList[promptIndex].prompt.choices[choiceIndex + 1];
                    promptList[promptIndex].prompt.choices[choiceIndex + 1] = promptList[promptIndex].prompt.choices[choiceIndex];
                    promptList[promptIndex].prompt.choices[choiceIndex] = olditem;
                    
                    // Update "actionList"
                    olditem = promptList[promptIndex].actionList[choiceIndex + 1];
                    promptList[promptIndex].actionList[choiceIndex + 1] = promptList[promptIndex].actionList[choiceIndex];
                    promptList[promptIndex].actionList[choiceIndex] = olditem;
                    
                    // Save and regenerate
                    return generateAndSave(true, undefined, "promptList." + promptIndex);
                }).catch(makeCatch(_("Error moving choice down")));
            }
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
            // Lock this prompt so we can safely edit it
            // Also handles unlocking and saving afterwards
            AUTHOR.GAMES.withLockedPrompts([promptIndex], function () {
                // Prompt locked successfully
                promptList[promptIndex].prompt.choices.splice(choiceIndex, 1);
                promptList[promptIndex].actionList.splice(choiceIndex, 1);
                // Save and regenerate
                return generateAndSave(true, undefined, "promptList." + promptIndex);
            }).catch(makeCatch(_("Error deleting choice")));
        },
        
        /**
         * Handler for the "Point Value" input.
         */
        updatePointValue: function (event, value, promptIndex, choiceIndex) {
            var promptList = game.jsondata.promptList;
            promptList[promptIndex].actionList[choiceIndex].pointValue = value || 0;
            // Save the game
            generateAndSave(undefined, undefined, "promptList." + promptIndex + ".actionList." + choiceIndex + ".pointValue");
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
                // Lock this prompt so we can safely edit it
                // Also handles unlocking and saving afterwards
                AUTHOR.GAMES.withLockedPrompts([promptIndex], function () {
                    // Prompt locked successfully
                    var olditem = promptList[promptIndex].actionList[choiceIndex].actions[actionIndex - 1];
                    promptList[promptIndex].actionList[choiceIndex].actions[actionIndex - 1] = promptList[promptIndex].actionList[choiceIndex].actions[actionIndex];
                    promptList[promptIndex].actionList[choiceIndex].actions[actionIndex] = olditem;
                    // Save and regenerate
                    return generateAndSave(true, undefined, "promptList." + promptIndex + ".actionList." + choiceIndex + ".actions");
                }).catch(makeCatch(_("Error moving action up")));
            }
        },
        
        /**
         * Handler for the "Move Action Down" button.
         */
        moveActionDown: function (event, promptIndex, choiceIndex, actionIndex) {
            event.preventDefault();
            var promptList = game.jsondata.promptList;
            if (choiceIndex != promptList[promptIndex].actionList[choiceIndex].actions.length - 1) {
                // Lock this prompt so we can safely edit it
                // Also handles unlocking and saving afterwards
                AUTHOR.GAMES.withLockedPrompts([promptIndex], function () {
                    // Prompt locked successfully
                    var olditem = promptList[promptIndex].actionList[choiceIndex].actions[actionIndex + 1];
                    promptList[promptIndex].actionList[choiceIndex].actions[actionIndex + 1] = promptList[promptIndex].actionList[choiceIndex].actions[actionIndex];
                    promptList[promptIndex].actionList[choiceIndex].actions[actionIndex] = olditem;
                    // Save and regenerate
                    return generateAndSave(true, undefined, "promptList." + promptIndex + ".actionList." + choiceIndex + ".actions");
                }).catch(makeCatch(_("Error moving action down")));
            }
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
            // Lock this prompt so we can safely edit it
            // Also handles unlocking and saving afterwards
            AUTHOR.GAMES.withLockedPrompts([promptIndex], function () {
                // Prompt locked successfully
                game.jsondata.promptList[promptIndex].actionList[choiceIndex].actions.splice(actionIndex, 1);
                // Save and regenerate
                return generateAndSave(true, undefined, "promptList." + promptIndex + ".actionList." + choiceIndex + ".actions");
            }).catch(makeCatch(_("Error deleting action")));
        },
    };
    
    
    /**
     * Generate a "minimal" row for a prompt.
     * Unlike the other public functions in this file, this function returns a
     * `tr` element.
     */
    AUTHOR.TABLE_COLUMNS.generateMinimalRow = function (promptIndex, promptItem) {
        var td, div, tbody_inner, tr_inner, td_inner;
        var i;
        
        var tr = create("tr", {
            className: "toprow prompt-row-minimal",
            "data-promptIndex": promptIndex
        });
        
        tr.addEventListener("click", function (event) {
            AUTHOR.TABLE.setCurrentPrompt(promptIndex);
        }, false);
        
        ///////////////////////////////////////////////////////////////////////
        // Make title column
        td = create("td", {
            className: "row_title"
        });
        div = create("div", {
            className: "row_title_buttons"
        });

        var iconbtns = [],
            iconbtn;

        // Make "Move Prompt Up/Down" buttons
        div.appendChild(iconbtn = create("a", {
            className: "row_title_buttons_up icon side icon_up" + (promptIndex === 0 ? " invisible" : ""),
            href: "#",
            text: " ",
            title: _("Move Prompt Up")
        }, TABLE_EVENTS.moveUp, promptIndex));
        iconbtns.push(iconbtn);

        div.appendChild(iconbtn = create("a", {
            className: "row_title_buttons_down icon side icon_down" + (promptIndex == game.jsondata.promptList.length - 1 ? " invisible" : ""),
            href: "#",
            text: " ",
            title: _("Move Prompt Down")
        }, TABLE_EVENTS.moveDown, promptIndex));
        iconbtns.push(iconbtn);
        td.appendChild(div);

        // Make "Delete Prompt" button
        td.appendChild(iconbtn = create("a", {
            className: "row_title_delete icon side icon_delete",
            href: "#",
            text: " ",
            title: _("Delete Prompt")
        }, TABLE_EVENTS.deletePrompt, promptIndex));
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
        td.appendChild(create("span", {
            className: "row_minimal_index",
            text: _("Prompt {0}", promptIndex)
        }));
        if (promptItem.prompt.title) {
            td.appendChild(create("div", {
                className: "row_minimal_title",
                text: promptItem.prompt.title
            }));
        }

        tr.appendChild(td);

        ///////////////////////////////////////////////////////////////////////
        // Make map column
        // Make inner table to hold the `mapstuff`
        tbody_inner = create("tbody");
        // Add basic map properties (`mapstuff`)
        mapstuff.forEach(function (mapitem) {
            var property = mapitem[0],
                label = mapitem[1];
            var value = promptItem.prompt.map[property];
            if (value === null) value = _("Same as previous prompt");
            tbody_inner.appendChild(create("tr", [
                // Children...
                
                // Label
                create("td", {
                    className: "smaller",
                    text: label + " "
                }),
                
                // Value
                create("td", {
                    className: "smaller",
                    text: value
                })
            ]));
        });
        // TODO: Add frontend properties
        td = create("td").create("table", {
            className: "noborder"
        }, [tbody_inner]);
        tr.appendChild(td);

        ///////////////////////////////////////////////////////////////////////
        // Make content column
        td = create("td", {
            colspan: 3
        });
        // Make a "minirow" for each content
        for (i = 0; i < promptItem.prompt.contents.length; i++) {
            div = create("div", {
                className: "row_content_text minirow"
            });
            // The actual content
            div.appendChild(create("span", {
                className: "box wide",
                html: AUTHOR.JSON_CONTENT.contentTypes[promptItem.prompt.contents[i].type].toHTML(promptItem.prompt.contents[i]),
                title: promptItem.prompt.contents[i].value
            }));
            td.appendChild(div);
        }
        // Show the number of choices
        td.appendChild(create("div", {
            text: _("{0} choices", promptItem.prompt.choices.length),
            style: "text-align: right;"
        }));
        tr.appendChild(td);
        
        ///////////////////////////////////////////////////////////////////////
        // Return the final table row
        return tr;
    };
    
    
    /**
     * Generate a title column (i.e. the first column).
     */
    AUTHOR.TABLE_COLUMNS.generateTitleColumn = function (promptIndex, promptItem) {
        var td = create("td", {
            className: "row_title"
        });
        
        // Make "Move Prompt Up/Down" buttons
        var div = create("div", {
            className: "row_title_buttons"
        });
        div.appendChild(create("a", {
            className: "row_title_buttons_up icon side icon_up" + (promptIndex === 0 ? " invisible" : ""),
            href: "#",
            text: " ",
            title: _("Move Prompt Up")
        }, TABLE_EVENTS.moveUp, promptIndex));
        div.appendChild(create("a", {
            className: "row_title_buttons_down icon side icon_down" + (promptIndex == game.jsondata.promptList.length - 1 ? " invisible" : ""),
            href: "#",
            text: " ",
            title: _("Move Prompt Down")
        }, TABLE_EVENTS.moveDown, promptIndex));
        td.appendChild(div);
        
        // Make "Delete Prompt" button
        td.appendChild(create("a", {
            className: "row_title_delete icon side icon_delete",
            href: "#",
            text: " ",
            title: _("Delete Prompt")
        }, TABLE_EVENTS.deletePrompt, promptIndex));
        
        // Add "Prompt #"
        td.appendChild(create("span", {
            className: "row_title_index",
            text: _("Prompt {0}", promptIndex)
        }));
        td.appendChild(create("br"));
        td.appendChild(create("br"));
        
        // Make title input
        td.appendChild(create("input", {
            className: "row_title_input",
            placeholder: _("Prompt Title"),
            value: promptItem.prompt.title
        }, TABLE_EVENTS.updateTitle, promptIndex));
        
        // Return the column
        return td;
    };
    
    
    /**
     * Generate a map column.
     */
    AUTHOR.TABLE_COLUMNS.generateMapColumn = function (promptIndex, promptItem) {
        // A nice new table column
        var td = create("td", {
            className: "row_map"
        });
        
        var sameAsPreviousPrompt = promptItem.prompt.map.latitude === null &&
                                   promptItem.prompt.map.longitude === null &&
                                   promptItem.prompt.map.zoom === null &&
                                   promptIndex !== 0;
        
        var prevMapstuffValues = [];
        
        var checkboxID = "id_sameasprev_checkbox_" + randID();
        var tableID = "id_sameasprev_table_" + randID();
        
        // Make checkbox for "Same as previous prompt"
        if (promptIndex !== 0) {
            td.appendChild(create("div", [
                // Children...

                // Input (checkbox)
                create("input", {
                    id: checkboxID,
                    type: "checkbox",
                    title: _("Keeps the map the same as it was for the previous prompt that the user was on"),
                    checked: sameAsPreviousPrompt ? "checked" : undefined
                }, TABLE_EVENTS.updateMapSameCheckbox, promptIndex, tableID, prevMapstuffValues),

                // Label
                create("label", {
                    "for": checkboxID,
                    text: " " + _("Same as previous prompt"),
                    title: _("Keeps the map the same as it was for the previous prompt that the user was on")
                })
            ]));
        }
        
        // Make inner table to hold the `mapstuff`
        var tbody_inner = create("tbody");
        mapstuff.forEach(function (mapitem) {
            var property = mapitem[0],
                label = mapitem[1],
                defaultValue = mapitem[2];
            var value = promptItem.prompt.map[property];
            
            var id = "row_map_" + property + "_" + randID();
            var tr_inner = create("tr", [
                // Children...
                
                // Label column
                create("td").create("label", {
                    text: label + " ",
                    "for": id
                }),
                
                // Input column
                create("td").create("input", {
                    className: "row_map_" + property,
                    id: id,
                    type: "number",
                    step: "any",
                    value: value === null ? defaultValue : value
                }, makeNumberHandler(function (event, value) {
                    TABLE_EVENTS.updateMapStuff(event, value, mapitem, promptIndex);
                }))
            ]);
            tbody_inner.appendChild(tr_inner);
        });
        
        // Make our map column to return, and append the inner table that we just made
        td.appendChild(create("table", {
            id: tableID,
            className: "noborder",
            style: sameAsPreviousPrompt ? "display: none" : ""
        }, [tbody_inner]));
        
        // Make reinitialization dropdown, if applicable
        if (!game.jsondata.alwaysReinitializeMap) {
            // Make a <div> containing a <select>, which contains 3 <option>s
            var div = create("div", {
                className: "marginLikeTable"
            }).create("select", {
                title: _("Resetting the map removes all user drawings and other drawn objects on the map.")
            }, [ // Children...
                create("option", {
                    value: "",
                    text: _("Don't reset map"),
                    selected: (promptItem.prompt.map.reinitialize != "before" && promptItem.prompt.map.reinitialize != "after") ? "selected" : undefined
                }),
                
                create("option", {
                    value: "before",
                    text: _("Reset before prompt"),
                    title: _("Reset the map before showing this prompt"),
                    selected: promptItem.prompt.map.reinitialize == "before" ? "selected" : undefined
                }),
                
                create("option", {
                    value: "after",
                    text: _("Reset after prompt"),
                    title: _("Reset the map after showing this prompt, before showing the next one"),
                    selected: promptItem.prompt.map.reinitialize == "after" ? "selected" : undefined
                })
            ], TABLE_EVENTS.updateMapReinitialization, promptIndex);
            td.appendChild(div);
        }
        
        // Make "Edit Map Properties" button
        td.appendChild(create("button", {
            text: _("Edit Map Properties")
        }, TABLE_EVENTS.editMapProperties, promptIndex));
        
        // Return our created table column
        return td;
    };
    
    
    /**
     * Generate a Content column.
     */
    AUTHOR.TABLE_COLUMNS.generateContentColumn = function (promptIndex, promptItem) {
        var td = create("td", {
            className: "row_content"
        });
        
        // Make a "minirow" for each content
        promptItem.prompt.contents.forEach(function (content, index, allContents) {
            var div = create("div", {
                className: "row_content_text minirow"
            });
            
            // Make icons/buttons
            var iconRow = create("div", {
                className: "icon-row"
            });
            
            // Make "Move Content Up/Down" buttons
            iconRow.appendChild(create("a", {
                className: "row_content_up icon icon_up" + (index === 0 ? " invisible" : ""),
                href: "#",
                text: " ",
                title: _("Move Content Up")
            }, TABLE_EVENTS.moveContentUp, promptIndex, index));
            iconRow.appendChild(create("a", {
                className: "row_content_down icon icon_down" + (index == allContents.length - 1 ? " invisible" : ""),
                href: "#",
                text: " ",
                title: _("Move Content Down")
            }, TABLE_EVENTS.moveContentDown, promptIndex, index));
            
            // Make "Edit Content" and "Delete Content" buttons
            iconRow.appendChild(create("a", {
                className: "row_content_edit icon icon_edit",
                href: "#",
                text: " ",
                title: _("Edit Content")
            }, TABLE_EVENTS.editContent, promptIndex, index));
            iconRow.appendChild(create("a", {
                className: "row_content_delete icon icon_delete",
                href: "#",
                text: " ",
                title: _("Delete Content")
            }, TABLE_EVENTS.deleteContent, promptIndex, index));
            
            div.appendChild(iconRow);
            
            // Show the actual content
            div.appendChild(create("span", {
                className: "box",
                html: AUTHOR.JSON_CONTENT.contentTypes[content.type].toHTML(content),
                title: content.value
            }));
            td.appendChild(div);
        });
        
        // Make "Add Content" button
        td.appendChild(create("button", {
            className: "row_content_add",
            text: _("Add Content")
        }, TABLE_EVENTS.addContent, promptIndex));
        
        // Return our newly created table column
        return td;
    };
    
    
    /**
     * Generate a choices column.
     */
    AUTHOR.TABLE_COLUMNS.generateChoicesColumn = function (promptIndex, promptItem) {
        var tds = [];
        
        // Make row for "Add Choice" and "Randomize Choices"
        var id = "row_randomizeChoices_cbox_" + randID();
        var td = create("td", {
            className: "row_randomizeChoices",
            colspan: "2"
        });
        
        // Make "Randomize Choices" input checkbox
        var div = create("div", [
            // Children...
            
            // Input (checkbox)
            create("input", {
                className: "row_randomizeChoices_cbox",
                type: "checkbox",
                id: id,
                checked: promptItem.prompt.randomizeChoices ? "checked" : undefined
            }, TABLE_EVENTS.updateRandomizeChoices, promptIndex),
            
            // Label
            create("label", {
                text: " " + _("Randomize Choices"),
                "for": id
            })
        ]);
        div.style.cssFloat = "right";
        td.appendChild(div);
        
        // Make "Add Choice" button
        td.appendChild(create("button", {
            className: "row_addChoice_btn",
            text: _("Add Choice")
        }, TABLE_EVENTS.addChoice, promptIndex));
        
        // First row is complete!
        tds.push(td);
        
        // Generate a row for each choice
        for (var i = 0; i < promptItem.prompt.choices.length; i++) {
            tds.push(generateChoiceRow(promptIndex, promptItem, i));
        }
        
        // Return our nice new set of rows
        return tds;
    };
    
    
    /**
     * Generate an actions column.
     */
    AUTHOR.TABLE_COLUMNS.generateActionsColumn = function (promptIndex, promptItem) {
        // Start off our list of rows for this column with `null`
        // (since the Choices column's first row has a colspan of 2)
        var tds = [null];
        
        // Generate a row for each choice
        for (var i = 0; i < promptItem.prompt.choices.length; i++) {
            tds.push(generateActionRow(promptIndex, promptItem, i));
        }
        
        // Return our nice new set of rows
        return tds;
    };
    
    
    /**
     * Generate a row for a specific choice in a choices column.
     */
    function generateChoiceRow(promptIndex, promptItem, choiceIndex) {
        var prompt = promptItem.prompt,
            choice = prompt.choices[choiceIndex],
            actionItem = promptItem.actionList[choiceIndex];
        
        // Make choice row in column
        var td = create("td", {
            className: "row_choice"
        });
        var div = create("div", {
            className: "row"
        });
        
        // Make icons/buttons
        var iconRow = create("div", {
            className: "icon-row"
        });
        
        // Make "Move Choice Up/Down" buttons
        iconRow.appendChild(create("a", {
            className: "row_choice_up icon icon_up" + (choiceIndex === 0 ? " invisible" : ""),
            href: "#",
            text: " ",
            title: _("Move Choice Up")
        }, TABLE_EVENTS.moveChoiceUp, promptIndex, choiceIndex));
        iconRow.appendChild(create("a", {
            className: "row_choice_down icon icon_down" + (choiceIndex == prompt.choices.length - 1 ? " invisible" : ""),
            href: "#",
            text: " ",
            title: _("Move Choice Down")
        }, TABLE_EVENTS.moveChoiceDown, promptIndex, choiceIndex));
        
        // Make "Edit Choice" and "Delete Choice" buttons
        iconRow.appendChild(create("a", {
            className: "row_choice_edit icon icon_edit",
            href: "#",
            text: " ",
            title: _("Edit Choice")
        }, TABLE_EVENTS.editChoice, promptIndex, choiceIndex));
        iconRow.appendChild(create("a", {
            className: "row_choice_delete icon icon_delete",
            href: "#",
            text: " ",
            title: _("Delete Choice")
        }, TABLE_EVENTS.deleteChoice, promptIndex, choiceIndex));
        
        div.appendChild(iconRow);
        
        // Make choice content
        div.appendChild(create("span", {
            className: "box",
            html: AUTHOR.JSON_CONTENT.contentTypes[choice.type].toHTML(choice),
            title: choice.value
        }));
        
        td.appendChild(div);
        
        // Make "Point Value" input
        var id = "row_choice_pointValue_" + randID();
        div = create("div", [
            // Children...
            
            // Label
            create("label", {
                "for": id,
                text: _("Point Value:") + " "
            }),
            
            // Input
            create("input", {
                type: "number",
                step: "1",
                value: actionItem.pointValue
            }, makeNumberHandler(function (event, value) {
                TABLE_EVENTS.updatePointValue(event, value, promptIndex, choiceIndex);
            }))
        ]);
        div.style.clear = "both";
        td.appendChild(div);
        
        // Return our nice new dandy choice row
        return td;
    }
    
    
    /**
     * Generate a row for a specific action in an actions column.
     */
    function generateActionRow(promptIndex, promptItem, choiceIndex) {
        var prompt = promptItem.prompt,
            choice = prompt.choices[choiceIndex],
            actionItem = promptItem.actionList[choiceIndex];
        
        // Make actions row in column
        var td = create("td", {
            className: "row_action"
        });
        if (actionItem.actions.length > 0) {
            actionItem.actions.forEach(function (action, index) {
                var div = create("div", {
                    className: "row_action_div minirow"
                });
                
                // Make icons/buttons
                var iconRow = create("div", {
                    className: "icon-row"
                });
                
                // Make "Move Action Up/Down" buttons
                iconRow.appendChild(create("a", {
                    className: "row_action_up icon icon_up" + (index === 0 ? " invisible" : ""),
                    href: "#",
                    text: " ",
                    title: _("Move Action Up")
                }, TABLE_EVENTS.moveActionUp, promptIndex, choiceIndex, index));
                iconRow.appendChild(create("a", {
                    className: "row_action_down icon icon_down" + (index == actionItem.actions.length - 1 ? " invisible" : ""),
                    href: "#",
                    text: " ",
                    title: _("Move Action Down")
                }, TABLE_EVENTS.moveActionDown, promptIndex, choiceIndex, index));
                
                // Make "Edit Action" and "Delete Action" buttons
                iconRow.appendChild(create("a", {
                    className: "row_action_edit icon icon_edit",
                    href: "#",
                    text: " ",
                    title: _("Edit Action")
                }, TABLE_EVENTS.editAction, promptIndex, choiceIndex, index));
                iconRow.appendChild(create("a", {
                    className: "row_action_delete icon icon_delete",
                    href: "#",
                    text: " ",
                    title: _("Delete Action")
                }, TABLE_EVENTS.deleteAction, promptIndex, choiceIndex, index));

                div.appendChild(iconRow);
                
                var dataContent;
                if (action.frontend) {
                    dataContent = AUTHOR.JSON.actionsByFrontend[action.frontend][action.name];
                } else {
                    dataContent = AUTHOR.JSON.actions[action.name];
                }
                div.appendChild(create("span", {
                    className: "row_action_data box",
                    html: dataContent ? dataContent.toHTML(action.data) : undefined,
                    text: dataContent ? undefined : action.name,
                    title: JSON.stringify(action.data)
                }));
                td.appendChild(div);
            });
        } else {
            td.appendChild(create("span", {
                className: "row_action_noActions",
                text: _("No actions.")
            }));
        }
        
        // Make "Add Action" button
        var p = create("p");
        p.appendChild(create("button", {
            text: _("Add Action")
        }, TABLE_EVENTS.addAction, promptIndex, choiceIndex));
        td.appendChild(p);
        
        // Return our nice new dandy action row
        return td;
    }
})();
