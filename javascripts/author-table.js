/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

// This file handles the drawing of the main table.
// Globals: AUTHOR_TABLE

var AUTHOR_TABLE = {
    /* initTable */
};

(function () {
    /**
     * The last-used tabindex (resets at the top of initTable).
     */
    var tabindex = 100;
    
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
            if (promptIndex != 0) {
                // Swap with the previous one
                var olditem = json.promptList[promptIndex - 1];
                json.promptList[promptIndex - 1] = json.promptList[promptIndex];
                json.promptList[promptIndex] = olditem;
                // Update any "goto" actions
                swapGotos(promptIndex, promptIndex - 1);
            }
            // Regenerate the table and update the save button
            generate(true);
        },
        
        /**
         * Handler for the "Move Prompt Down" button.
         */
        moveDown: function (event, promptIndex) {
            event.preventDefault();
            if (promptIndex != json.promptList.length - 1) {
                // Swap with the next one
                var olditem = json.promptList[promptIndex + 1];
                json.promptList[promptIndex + 1] = json.promptList[promptIndex];
                json.promptList[promptIndex] = olditem;
                // Update any "goto" actions
                swapGotos(promptIndex, promptIndex + 1);
            }
            // Regenerate the table and update the save button
            generate(true);
        },
        
        /**
         * Handler for the "Delete Prompt" button.
         */
        deletePrompt: function (event, promptIndex) {
            event.preventDefault();
            json.promptList.splice(promptIndex, 1);
            // Update any "goto" actions (and see if there were any pointing to the prompt we just deleted).
            var occurrences = decrementGotos(promptIndex);
            if (occurrences > 0) {
                alert(_("NOTE: There were " + occurrences + " \"goto\" actions that pointed to the prompt that was just deleted.") + "\n" +
                      _("Also, all other \"goto\" actions have been updated to point to the new prompt indexes that resulted from deleting this prompt."));
            }
            // Regenerate the table and update the save button
            generate(true);
        },
        
        /**
         * Handler for the "Title" input.
         */
        updateTitle: function (event, promptIndex) {
            json.promptList[promptIndex].prompt.title = this.value;
            // Update the save button
            generate();
        },
        
        
        /**
         * Handler for any of the inputs in the "Map" column that correspond to
         * properties in a SerGIS JSON Map Object.
         */
        updateMapStuff: function (event, stuff, promptIndex) {
            this.style.border = "";
            var value = this.value;
            if (typeof value.trim == "function") {
                value = value.trim();
            }
            if (!value) {
                delete json.promptList[promptIndex].prompt.map[stuff];
            } else {
                var num = Number(value);
                if (isNaN(num)) {
                    this.style.border = "1px solid red";
                } else {
                    json.promptList[promptIndex].prompt.map[stuff] = num;
                }
            }
            // Update the save button
            generate();
        },
        
        /**
         * Handler for the "Edit Frontend Info" button.
         */
        editFrontendInfo: function (event, promptIndex) {
            event.preventDefault();
            AUTHOR_FRONTEND_INFO_EDITOR.editFrontendInfo(promptIndex);
        },
        
        
        ////////////////////////////////////////////////////////////////////////
        // CONTENT EVENTS
        /**
         * Handler for the "Add Content" button.
         */
        addContent: function (event, promptIndex) {
            event.preventDefault();
            AUTHOR_EDITOR.editContent(promptIndex, json.promptList[promptIndex].prompt.contents.length, true);
        },
        
        /**
         * Handler for the "Move Content Up" button.
         */
        moveContentUp: function (event, promptIndex, contentIndex) {
            event.preventDefault();
            if (contentIndex != 0) {
                var olditem = json.promptList[promptIndex].prompt.contents[contentIndex - 1];
                json.promptList[promptIndex].prompt.contents[contentIndex - 1] = json.promptList[promptIndex].prompt.contents[contentIndex];
                json.promptList[promptIndex].prompt.contents[contentIndex] = olditem;
            }
            // Regenerate the table and update the save button
            generate(true);
        },
        
        /**
         * Handler for the "Move Content Down" button.
         */
        moveContentDown: function (event, promptIndex, contentIndex) {
            event.preventDefault();
            if (contentIndex != json.promptList[promptIndex].prompt.contents.length - 1) {
                var olditem = json.promptList[promptIndex].prompt.contents[contentIndex + 1];
                json.promptList[promptIndex].prompt.contents[contentIndex + 1] = json.promptList[promptIndex].prompt.contents[contentIndex];
                json.promptList[promptIndex].prompt.contents[contentIndex] = olditem;
            }
            // Regenerate the table and update the save button
            generate(true);
        },
        
        /**
         * Handler for the "Edit Content" button.
         */
        editContent: function (event, promptIndex, contentIndex) {
            event.preventDefault();
            AUTHOR_EDITOR.editContent(promptIndex, contentIndex);
        },
        
        /**
         * Handler for the "Delete Content" button.
         */
        deleteContent: function (event, promptIndex, contentIndex) {
            event.preventDefault();
            json.promptList[promptIndex].prompt.contents.splice(contentIndex, 1);
            // Regenerate the table and update the save button
            generate(true);
        },
        
        
        ////////////////////////////////////////////////////////////////////////
        // CHOICE EVENTS
        /**
         * Handler for the "Add Choice" button.
         */
        addChoice: function (event, promptIndex) {
            event.preventDefault();
            AUTHOR_EDITOR.editChoice(promptIndex, json.promptList[promptIndex].prompt.choices.length, true);
        },
        
        /**
         * Handler for the "Randomize Choices" input checkbox.
         */
        updateRandomizeChoices: function (event, promptIndex) {
            json.promptList[promptIndex].prompt.randomizeChoices = this.checked;
            // Update the save button
            generate();
        },
        
        /**
         * Handler for the "Move Choice Up" button.
         */
        moveChoiceUp: function (event, promptIndex, choiceIndex) {
            event.preventDefault();
            if (choiceIndex != 0) {
                // Update "choices"
                var olditem = json.promptList[promptIndex].prompt.choices[choiceIndex - 1];
                json.promptList[promptIndex].prompt.choices[choiceIndex - 1] = json.promptList[promptIndex].prompt.choices[choiceIndex];
                json.promptList[promptIndex].prompt.choices[choiceIndex] = olditem;
                // Update "actionList"
                olditem = json.promptList[promptIndex].actionList[choiceIndex - 1];
                json.promptList[promptIndex].actionList[choiceIndex - 1] = json.promptList[promptIndex].actionList[choiceIndex];
                json.promptList[promptIndex].actionList[choiceIndex] = olditem;
            }
            // Regenerate the table and update the save button
            generate(true);
        },
        
        /**
         * Handler for the "Move Choice Down" button.
         */
        moveChoiceDown: function (event, promptIndex, choiceIndex) {
            event.preventDefault();
            if (choiceIndex != json.promptList[promptIndex].prompt.choices.length - 1) {
                // Update "choices"
                var olditem = json.promptList[promptIndex].prompt.choices[choiceIndex + 1];
                json.promptList[promptIndex].prompt.choices[choiceIndex + 1] = json.promptList[promptIndex].prompt.choices[choiceIndex];
                json.promptList[promptIndex].prompt.choices[choiceIndex] = olditem;
                // Update "actionList"
                olditem = json.promptList[promptIndex].actionList[choiceIndex + 1];
                json.promptList[promptIndex].actionList[choiceIndex + 1] = json.promptList[promptIndex].actionList[choiceIndex];
                json.promptList[promptIndex].actionList[choiceIndex] = olditem;
            }
            // Regenerate the table and update the save button
            generate(true);
        },
        
        /**
         * Handler for the "Edit Choice" button.
         */
        editChoice: function (event, promptIndex, choiceIndex) {
            event.preventDefault();
            AUTHOR_EDITOR.editChoice(promptIndex, choiceIndex);
        },
        
        /**
         * Handler for the "Delete Choice" button.
         */
        deleteChoice: function (event, promptIndex, choiceIndex) {
            event.preventDefault();
            json.promptList[promptIndex].prompt.choices.splice(choiceIndex, 1);
            json.promptList[promptIndex].actionList.splice(choiceIndex, 1);
            // Regenerate the table and update the save button
            generate(true);
        },
        
        /**
         * Handler for the "Point Value" input.
         */
        updatePointValue: function (event, promptIndex, choiceIndex) {
            var num = Number(this.value);
            if (isNaN(num)) {
                this.style.border = "1px solid red";
            } else {
                this.style.border = "";
                json.promptList[promptIndex].actionList[choiceIndex].pointValue = num;
            }
            // Update the save button
            generate();
        },
        
        
        ////////////////////////////////////////////////////////////////////////
        // ACTION EVENTS
        /**
         * Handler for the "Add Action" button.
         */
        addAction: function (event, promptIndex, choiceIndex) {
            event.preventDefault();
            AUTHOR_ACTION_EDITOR.editAction(promptIndex, choiceIndex, json.promptList[promptIndex].actionList[choiceIndex].actions.length, true);
        },
        
        /**
         * Handler for the "Move Action Up" button.
         */
        moveActionUp: function (event, promptIndex, choiceIndex, actionIndex) {
            event.preventDefault();
            if (actionIndex != 0) {
                var olditem = json.promptList[promptIndex].actionList[choiceIndex].actions[actionIndex - 1];
                json.promptList[promptIndex].actionList[choiceIndex].actions[actionIndex - 1] = json.promptList[promptIndex].actionList[choiceIndex].actions[actionIndex];
                json.promptList[promptIndex].actionList[choiceIndex].actions[actionIndex] = olditem;
            }
            // Regenerate the table and update the save button
            generate(true);
        },
        
        /**
         * Handler for the "Move Action Down" button.
         */
        moveActionDown: function (event, promptIndex, choiceIndex, actionIndex) {
            event.preventDefault();
            if (choiceIndex != json.promptList[promptIndex].actionList[choiceIndex].actions.length - 1) {
                var olditem = json.promptList[promptIndex].actionList[choiceIndex].actions[actionIndex + 1];
                json.promptList[promptIndex].actionList[choiceIndex].actions[actionIndex + 1] = json.promptList[promptIndex].actionList[choiceIndex].actions[actionIndex];
                json.promptList[promptIndex].actionList[choiceIndex].actions[actionIndex] = olditem;
            }
            // Regenerate the table and update the save button
            generate(true);
        },
        
        /**
         * Handler for the "Edit Action" button.
         */
        editAction: function (event, promptIndex, choiceIndex, actionIndex) {
            event.preventDefault();
            AUTHOR_ACTION_EDITOR.editAction(promptIndex, choiceIndex, actionIndex);
        },
        
        /**
         * Handler for the "Delete Action" button.
         */
        deleteAction: function (event, promptIndex, choiceIndex, actionIndex) {
            event.preventDefault();
            json.promptList[promptIndex].actionList[choiceIndex].actions.splice(actionIndex, 1);
            // Regenerate the table and update the save button
            generate(true);
        },
    };
    
    
    /**
     * Make the prompt table.
     */
    AUTHOR_TABLE.initTable = function () {
        // Get rid of the old table
        document.getElementById("promptContainer").innerHTML = "";
        // Create the new table; reset the tabindex
        var table = document.createElement("table");
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
        for (i = 0; i < json.promptList.length; i++) {
            // Generate each table row
            generateTableRow(tbody, i);
        }
        
        // Stick it all in there
        table.appendChild(tbody);
        document.getElementById("promptContainer").appendChild(table);
        
        // Make sure scrolling is good
        checkScroll();
    };
    
    /**
     * Make a row for initTable.
     */
    function generateTableRow(tbody, promptIndex) {
        var tr, td, div;
        var i, id;
        var prompt = json.promptList[promptIndex].prompt;
        
        ///////////////////////////////////////////////////////////////////////
        // Make row
        tr = c("tr", {
            className: "toprow"
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
            className: "row_title_buttons_up icon icon_up" + (promptIndex == 0 ? " invisible" : ""),
            href: "#",
            text: " ",
            title: _("Move Prompt Up"),
            tabindex: ++tabindex
        }, tableEvents.moveUp, promptIndex));
        div.appendChild(c("a", {
            className: "row_title_buttons_down icon icon_down" + (promptIndex == json.promptList.length - 1 ? " invisible" : ""),
            href: "#",
            text: " ",
            title: _("Move Prompt Down"),
            tabindex: ++tabindex
        }, tableEvents.moveDown, promptIndex));
        td.appendChild(div);
        
        // Make "Delete Prompt" button
        td.appendChild(c("a", {
            className: "row_title_delete icon icon_delete",
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
        var mapstuff = [
            // ["SerGIS JSON Map Object property name", "label"]
            ["latitude", _("Latitude:")],
            ["longitude", _("Longitude:")],
            ["zoom", _("Zoom:")]
        ];
        // Make inner table to hold the `mapstuff`
        var table_inner = c("table", {className: "noborder"}),
            tbody_inner = c("tbody"),
            tr_inner, td_inner;
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
            td_inner.appendChild(c("input", {
                className: "row_map_" + mapstuff[i][0],
                id: id,
                size: "4",
                type: "number",
                tabindex: ++tabindex,
                value: prompt.map[mapstuff[i][0]] || ""
            }, tableEvents.updateMapStuff, mapstuff[i][0], promptIndex));
            tr_inner.appendChild(td_inner);
            tbody_inner.appendChild(tr_inner);
        }
        table_inner.appendChild(tbody_inner);
        td = c("td", {
            className: "row_map",
            rowspan: prompt.choices.length + 1
        });
        td.appendChild(table_inner);
        
        // Make "Edit Frontend Info" button
        td.appendChild(c("button", {
            className: "row_map_editFrontendInfo",
            text: _("Edit Frontend Info"),
            tabindex: ++tabindex
        }, tableEvents.editFrontendInfo, promptIndex));
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
            
            // Make "Move Content Up/Down" buttons
            div.appendChild(c("a", {
                className: "row_content_up icon icon_up" + (i == 0 ? " invisible" : ""),
                href: "#",
                text: " ",
                title: _("Move Content Up"),
                tabindex: ++tabindex
            }, tableEvents.moveContentUp, promptIndex, i));
            div.appendChild(c("a", {
                className: "row_content_down icon icon_down" + (i == prompt.contents.length - 1 ? " invisible" : ""),
                href: "#",
                text: " ",
                title: _("Move Content Down"),
                tabindex: ++tabindex
            }, tableEvents.moveContentDown, promptIndex, i));
            
            // Make "Edit Content" and "Delete Content" buttons
            div.appendChild(c("a", {
                className: "row_content_delete icon icon_delete",
                href: "#",
                text: " ",
                title: _("Delete Content"),
                tabindex: ++tabindex + 1,
            }, tableEvents.deleteContent, promptIndex, i));
            div.appendChild(c("a", {
                className: "row_content_edit icon icon_edit",
                href: "#",
                text: " ",
                title: _("Edit Content"),
                tabindex: tabindex,
            }, tableEvents.editContent, promptIndex, i));
            
            // Show the actual content
            div.appendChild(c("b", {
                text: AUTHOR_JSON.contentTypes[prompt.contents[i].type].name
            }));
            div.appendChild(document.createTextNode(": "));
            div.appendChild(c("code", {
                text: prompt.contents[i].value,
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
        tbody.appendChild(tr);
        
        // Generate each choice/action row
        for (i = 0; i < prompt.choices.length; i++) {
            generateTableChoice(tbody, promptIndex, i);
        }
    }
    
    /**
     * Make the "choices" and "actions" rows columns for generateTableRow.
     */
    function generateTableChoice(tbody, promptIndex, choiceIndex) {
        var tr, td, div, ul, li;
        var i, id;
        var prompt = json.promptList[promptIndex].prompt,
            choice = prompt.choices[choiceIndex],
            action = json.promptList[promptIndex].actionList[choiceIndex];
        
        // Make row
        tr = c("tr");
        
        // Make choice column
        td = c("td", {
            className: "row_choice"
        });
        div = c("div", {
            className: "row"
        });
        
        // Make "Edit Choice" and "Delete Choice" buttons
        div.appendChild(c("a", {
            className: "row_choice_delete icon icon_delete",
            href: "#",
            text: " ",
            title: _("Delete Choice"),
            tabindex: tabindex + 4
        }, tableEvents.deleteChoice, promptIndex, choiceIndex));
        div.appendChild(c("a", {
            className: "row_choice_edit icon icon_edit",
            href: "#",
            text: " ",
            title: _("Edit Choice"),
            tabindex: tabindex + 3
        }, tableEvents.editChoice, promptIndex, choiceIndex));
        
        // Make "Move Choice Up/Down" buttons
        div.appendChild(c("a", {
            className: "row_choice_up icon icon_up" + (choiceIndex == 0 ? " invisible" : ""),
            href: "#",
            text: " ",
            title: _("Move Choice Up"),
            tabindex: tabindex + 1
        }, tableEvents.moveChoiceUp, promptIndex, choiceIndex));
        div.appendChild(c("a", {
            className: "row_choice_down icon icon_down" + (choiceIndex == prompt.choices.length - 1 ? " invisible" : ""),
            href: "#",
            text: " ",
            title: _("Move Choice Down"),
            tabindex: tabindex + 2
        }, tableEvents.moveChoiceDown, promptIndex, choiceIndex));
        tabindex += 4;
        
        // Make choice content
        div.appendChild(c("b", {
            text: AUTHOR_JSON.contentTypes[choice.type].name
        }));
        div.appendChild(document.createTextNode(": "));
        div.appendChild(c("br"));
        div.appendChild(c("code", {
            text: choice.value,
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
        div.appendChild(c("input", {
            type: "number",
            value: action.pointValue,
            tabindex: ++tabindex
        }, tableEvents.updatePointValue, promptIndex, choiceIndex));
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
                
                // Make "Edit Action" and "Delete Action" buttons
                div.appendChild(c("a", {
                    className: "row_action_delete icon icon_delete",
                    href: "#",
                    text: " ",
                    title: _("Delete Action"),
                    tabindex: tabindex + 4
                }, tableEvents.deleteAction, promptIndex, choiceIndex, i));
                div.appendChild(c("a", {
                    className: "row_action_edit icon icon_edit",
                    href: "#",
                    text: " ",
                    title: _("Edit Action"),
                    tabindex: tabindex + 3
                }, tableEvents.editAction, promptIndex, choiceIndex, i));
                
                // Make "Move Action Up/Down" buttons
                div.appendChild(c("a", {
                    className: "row_action_up icon icon_up" + (i == 0 ? " invisible" : ""),
                    href: "#",
                    text: " ",
                    title: _("Move Action Up"),
                    tabindex: tabindex + 1
                }, tableEvents.moveActionUp, promptIndex, choiceIndex, i));
                div.appendChild(c("a", {
                    className: "row_action_down icon icon_down" + (i == action.actions.length - 1 ? " invisible" : ""),
                    href: "#",
                    text: " ",
                    title: _("Move Action Down"),
                    tabindex: tabindex + 2
                }, tableEvents.moveActionDown, promptIndex, choiceIndex, i));
                tabindex += 4;
                
                if (action.actions[i].frontend) {
                    div.appendChild(c("span", {
                        className: "row_action_frontend",
                        text: action.actions[i].frontend + ": ",
                        title: _("Action Frontend")
                    }));
                }
                div.appendChild(c("b", {
                    className: "row_action_name",
                    text: action.actions[i].name,
                    title: _("Action Name")
                }));
                if (action.actions[i].data.length > 0) {
                    div.appendChild(c("span", {
                        className: "row_action_data_barrier",
                        text: ": "
                    }));
                    div.appendChild(c("code", {
                        className: "row_action_data short",
                        text: JSON.stringify(action.actions[i].data),
                        title: JSON.stringify(action.actions[i].data)
                    }));
                }
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
    
    /**
     * Whether the browser supports "window.pageXOffset" (for checkScroll).
     */
    var supportPageOffset = window.pageXOffset !== undefined;
    /**
     * Whether the browser's in "Standards Mode" (as opposed to "Quirks Mode").
     */
    var isCSS1Compat = ((document.compatMode || "") === "CSS1Compat");
    
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
            var scrollY = supportPageOffset
                ? window.pageYOffset
                : isCSS1Compat
                    ? document.documentElement.scrollTop
                    : document.body.scrollTop;
            
            // Find out how far the table is from the top of the page
            var elem = tbl;
            var offsetY = elem.offsetTop;
            while (elem = elem.offsetParent) {
                offsetY += elem.offsetTop || 0;
            }
            
            // Check if we should be .scrollFixed
            var i = tbl.className.indexOf("scrollFixed");
            if (scrollY >= offsetY) {
                if (i == -1) {
                    // Make sure the header cells stay the same width
                    thead.style.width = thead.offsetWidth + "px";
                    var kids = tbl.getElementsByTagName("th");
                    for (var j = 0; j < kids.length; j++) {
                        kids[j].style.width = kids[j].offsetWidth + "px";
                    }
                    // And, we should be .scrollFixed; let's add the class
                    tbl.className += " scrollFixed";
                }
            } else if (i != -1) {
                // We shouldn't be .scrollFixed; let's remove the class
                tbl.className = tbl.className.substring(0, i) + tbl.className.substring(i + 11);
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
