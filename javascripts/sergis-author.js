// Main JavaScript file for the SerGIS Prompt Author

/**
 * The current state of the SerGIS JSON Game Data that we're working on.
 */
var json = {promptList: [{}]};

/**
 * The last-used tabindex (resets at the top of generateTable).
 */
var tabindex = 100;

/**
 * Shortcut to create an element.
 */
function c(elem, attributes, onclick_or_change /*, [onclick parameter, [onclick parameter, [...]]] */) {
    var NEEDS_ONCHANGE = ["input", "select", "textarea"];
    
    elem = document.createElement(elem);
    if (attributes) {
        for (var prop in attributes) {
            if (attributes.hasOwnProperty(prop)) {
                if (prop == "class" || prop == "className") {
                    elem.className = attributes[prop];
                } else if (prop == "textContent" || prop == "text") {
                    elem.appendChild(document.createTextNode(attributes[prop]));
                } else {
                    elem.setAttribute(prop, "" + attributes[prop]);
                }
            }
        }
    }
    if (onclick_or_change) {
        var args = Array.prototype.slice.call(arguments, 3),
            event = NEEDS_ONCHANGE.indexOf(elem.nodeName.toLowerCase()) == -1 ? "click" : "change";
        elem.addEventListener(event, function (event) {
            onclick_or_change.apply(this, [event].concat(args));
        }, false);
    }
    return elem;
}

/**
 * Fill in default values in the SerGIS JSON Game Data to make sure it doesn't
 * lead to errors later.
 */
function checkJSON() {
    var i, item, j, k;
    // Make sure promptList is an array
    if (!json.promptList || !json.promptList.length) {
        json.promptList = [];
    }
    // Make sure each item in promptList has a good "prompt" and "actionList"
    i = 0;
    item = json.promptList[0];
    for (; i < json.promptList.length; item = json.promptList[++i]) {
        // Check "prompt"
        if (!item.prompt) {
            item.prompt = {};
        }
        if (typeof item.prompt.title != "string") {
            item.prompt.title = "";
        }
        if (!item.prompt.map) {
            item.prompt.map = {};
        }
        if (!item.prompt.contents || !item.prompt.contents.length) {
            item.prompt.contents = [];
        }
        if (!item.prompt.choices || !item.prompt.choices.length) {
            item.prompt.choices = [];
        }
        
        // Check "actionList"
        if (!item.actionList || !item.actionList.length) {
            item.actionList = [];
        }
        for (j = 0; j < item.prompt.choices.length; j++) {
            if (!item.actionList[j]) {
                item.actionList[j] = {};
            }
            
            // Check "actionList[j].actions"
            if (!item.actionList[j].actions || !item.actionList[j].actions.length) {
                item.actionList[j].actions = [];
            }
            // Check each one (starting from the end, in case we have to splice some out)
            for (k = item.actionList[j].actions.length - 1; k >= 0; k--) {
                if (!item.actionList[j].actions[k].name) {
                    item.actionList[j].splice(k, 1);
                } else {
                    // Check "actionList[j].actions[k].data"
                    if (!item.actionList[j].actions[k].data || !item.actionList[j].actions[k].data.length) {
                        item.actionList[j].actions[k].data = [];
                    }
                }
            }
            
            // Check "actionList[j].pointValue"
            if (!item.actionList[j].pointValue) {
                item.actionList[j].pointValue = 0;
            }
        }
    }
}

/**
 * Swap 2 promptIndexes in any "goto" actions.
 */
function swapGotos(goto1, goto2) {
    var i, j, k, actionList, actions, action;
    for (i = 0; i < json.promptList.length; i++) {
        actionList = json.promptList[i].actionList;
        for (j = 0; j < actionList.length; j++) {
            actions = actionList[j].actions;
            for (k = 0; k < actions.length; k++) {
                action = actions[k];
                if (action.name == "goto" && action.data && action.data.length) {
                    if (action.data[0] == goto1) {
                        action.data[0] = goto2;
                    } else if (action.data[0] == goto2) {
                        action.data[0] = goto1;
                    }
                }
            }
        }
    }
}

/**
 * Decrement all promptIndexes in any "goto" actions above a certain value.
 *
 * @param {number} leastIndex - Any promptIndexes that are less than OR EQUAL
 *        TO this value will NOT be decremented.
 *
 * @returns {number} The number of occurrences of leastIndex (which, FYI, were
 *          NOT decremented).
 */
function decrementGotos(leastIndex) {
    var i, j, k, actionList, actions, action;
    var occurrences = 0;
    for (i = 0; i < json.promptList.length; i++) {
        actionList = json.promptList[i].actionList;
        for (j = 0; j < actionList.length; j++) {
            actions = actionList[j].actions;
            for (k = 0; k < actions.length; k++) {
                action = actions[k];
                if (action.name == "goto" && action.data && action.data.length) {
                    if (action.data[0] == leastIndex) {
                        occurrences += 1;
                    } else if (action.data[0] > leastIndex) {
                        action.data[0] -= 1;
                    }
                }
            }
        }
    }
    return occurrences;
}

/**
 * Event handlers for things in the table.
 * @namespace
 */
var tableEvents = {
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
        generateTable();
    },
    
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
        generateTable();
    },
    
    deletePrompt: function (event, promptIndex) {
        event.preventDefault();
        json.promptList.splice(promptIndex, 1);
        // Update any "goto" actions (and see if there were any pointing to the prompt we just deleted).
        var occurrences = decrementGotos(promptIndex);
        if (occurrences > 0) {
            alert("NOTE: There were " + occurrences + " \"goto\" actions that pointed to the prompt that was just deleted.\n" +
                  "Also, all other \"goto\" actions have been updated to point to the new prompt indexes that resulted from deleting this prompt.");
        }
        // Regenerate the table and update the save button
        generateTable();
    },
    
    updateTitle: function (event, promptIndex) {
        json.promptList[promptIndex].prompt.title = this.value;
        // Update the save button
        updateSaveLink();
    },
    
    
    updateMapStuff: function (event, stuff, promptIndex) {
        this.style.border = "";
        if (typeof this.value.trim == "function") {
            this.value = this.value.trim();
        }
        if (!this.value) {
            delete json.promptList[promptIndex].prompt.map[stuff];
        } else {
            var num = Number(this.value);
            if (isNaN(num)) {
                this.style.border = "1px solid red";
            } else {
                json.promptList[promptIndex].prompt.map[stuff] = num;
            }
        }
        // Update the save button
        updateSaveLink();
    },
    
    editFrontendInfo: function (event, promptIndex) {
        event.preventDefault();
        alert("Editing frontend info for " + promptIndex + "!");
    },
    
    
    addContent: function (event, promptIndex) {
        event.preventDefault();
        alert("Adding content for " + promptIndex + "!");
    },
    
    moveContentUp: function (event, promptIndex, contentIndex) {
        event.preventDefault();
        if (contentIndex != 0) {
            var olditem = json.promptList[promptIndex].prompt.contents[contentIndex - 1];
            json.promptList[promptIndex].prompt.contents[contentIndex - 1] = json.promptList[promptIndex].prompt.contents[contentIndex];
            json.promptList[promptIndex].prompt.contents[contentIndex] = olditem;
        }
        // Regenerate the table and update the save button
        generateTable();
    },
    
    moveContentDown: function (event, promptIndex, contentIndex) {
        event.preventDefault();
        if (contentIndex != json.promptList[promptIndex].prompt.contents.length - 1) {
            var olditem = json.promptList[promptIndex].prompt.contents[contentIndex + 1];
            json.promptList[promptIndex].prompt.contents[contentIndex + 1] = json.promptList[promptIndex].prompt.contents[contentIndex];
            json.promptList[promptIndex].prompt.contents[contentIndex] = olditem;
        }
        // Regenerate the table and update the save button
        generateTable();
    },
    
    editContent: function (event, promptIndex, contentIndex) {
        event.preventDefault();
        alert("Editing content #" + contentIndex + " for " + promptIndex + "!");
    },
    
    deleteContent: function (event, promptIndex, contentIndex) {
        event.preventDefault();
        json.promptList[promptIndex].prompt.contents.splice(contentIndex, 1);
        // Regenerate the table and update the save button
        generateTable();
    },
    
    
    addChoice: function (event, promptIndex) {
        event.preventDefault();
        alert("Adding choice for " + promptIndex + "!");
    },
    
    updateRandomizeChoices: function (event, promptIndex) {
        json.promptList[promptIndex].prompt.randomizeChoices = this.value;
        // Update the save button
        updateSaveLink();
    },
    
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
        generateTable();
    },
    
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
        generateTable();
    },
    
    editChoice: function (event, promptIndex, choiceIndex) {
        event.preventDefault();
        alert("Editing choice #" + choiceIndex + " for " + promptIndex + "!");
    },
    
    deleteChoice: function (event, promptIndex, choiceIndex) {
        event.preventDefault();
        alert("Deleting choice #" + choiceIndex + " for " + promptIndex + "!");
    },
    
    updatePointValue: function (event, promptIndex, choiceIndex) {
        var num = Number(this.value);
        if (isNaN(num)) {
            this.style.border = "1px solid red";
        } else {
            this.style.border = "";
            json.promptList[promptIndex].actionList[choiceIndex].pointValue = num;
        }
        // Update the save button
        updateSaveLink();
    }
};

/**
 * Make the prompt table.
 */
function generateTable() {
    // Make sure our data is good
    checkJSON();
    // And our save button
    updateSaveLink();
    
    // Get rid of the old
    document.getElementById("promptContainer").innerHTML = "";
    var table = document.createElement("table");
    tabindex = 100;
    
    // Make header
    var thead = c("thead");
    var tr = c("tr");
    var titles = ["", "Map", "Content", "Choices", "Actions"];
    for (var i = 0; i < titles.length; i++) {
        tr.appendChild(c("th", {
            text: titles[i]
        }));
    }
    thead.appendChild(tr);
    table.appendChild(thead);
    
    // Make body
    var tbody = c("tbody");
    for (i = 0; i < json.promptList.length; i++) {
        generateTableRow(tbody, i);
    }
    
    // Stick it in there
    table.appendChild(tbody);
    document.getElementById("promptContainer").appendChild(table);
    
    // Make sure scrolling is good
    checkScroll();
}

/**
 * Make a row for generateTable.
 */
function generateTableRow(tbody, promptIndex) {
    var tr, td, div;
    var i, id;
    var prompt = json.promptList[promptIndex].prompt;
    
    // Make row
    tr = c("tr", {
        className: "toprow"
    });
    
    // Make title column
    td = c("td", {
        className: "row_title",
        rowspan: prompt.choices.length + 1
    });
    div = c("div", {
        className: "row_title_buttons"
    });
    
    div.appendChild(c("a", {
        className: "row_title_buttons_up icon icon_up" + (promptIndex == 0 ? " invisible" : ""),
        href: "#",
        text: " ",
        tabindex: ++tabindex
    }, tableEvents.moveUp, promptIndex));
    div.appendChild(c("a", {
        className: "row_title_buttons_down icon icon_down" + (promptIndex == json.promptList.length - 1 ? " invisible" : ""),
        href: "#",
        text: " ",
        tabindex: ++tabindex
    }, tableEvents.moveDown, promptIndex));
    td.appendChild(div);
    
    td.appendChild(c("a", {
        className: "row_title_delete icon icon_delete",
        href: "#",
        text: " ",
        tabindex: ++tabindex
    }, tableEvents.deletePrompt, promptIndex));
    
    td.appendChild(c("span", {
        className: "row_title_index",
        text: "Prompt " + promptIndex,
    }));
    td.appendChild(c("br"));
    td.appendChild(c("br"));
    
    td.appendChild(c("input", {
        className: "row_title_input",
        placeholder: "Prompt Title",
        value: prompt.title,
        tabindex: ++tabindex
    }, tableEvents.updateTitle, promptIndex));
    
    tr.appendChild(td);
    
    // Make map column
    var mapstuff = ["Latitude", "Longitude", "Zoom"];
    var table_inner = c("table", {className: "noborder"}),
        tbody_inner = c("tbody"),
        tr_inner, td_inner;
    for (i = 0; i < mapstuff.length; i++) {
        tr_inner = c("tr");
        id = "row_map_" + mapstuff[i].toLowerCase() + "_" + Math.random();
        td_inner = c("td");
        td_inner.appendChild(c("label", {
            text: mapstuff[i] + ": ",
            "for": id
        }));
        tr_inner.appendChild(td_inner);
        td_inner = c("td");
        td_inner.appendChild(c("input", {
            className: "row_map_" + mapstuff[i].toLowerCase(),
            id: id,
            size: "4",
            tabindex: ++tabindex,
            value: prompt.map[mapstuff[i].toLowerCase()] || ""
        }, tableEvents.updateMapStuff, mapstuff[i].toLowerCase(), promptIndex));
        tr_inner.appendChild(td_inner);
        tbody_inner.appendChild(tr_inner);
    }
    table_inner.appendChild(tbody_inner);
    td = c("td", {
        className: "row_map",
        rowspan: prompt.choices.length + 1
    });
    td.appendChild(table_inner);
    td.appendChild(c("button", {
        className: "row_map_editFrontendInfo",
        text: "Edit Frontend Info",
        tabindex: ++tabindex
    }, tableEvents.editFrontendInfo, promptIndex));
    tr.appendChild(td);
    
    // Make content column
    td = c("td", {
        className: "row_content",
        rowspan: prompt.choices.length + 1
    });
    for (i = 0; i < prompt.contents.length; i++) {
        div = c("div", {
            className: "row_content_text minirow"
        });
        // up/down buttons
        div.appendChild(c("a", {
            className: "row_content_up icon icon_up" + (i == 0 ? " invisible" : ""),
            href: "#",
            text: " ",
            tabindex: ++tabindex
        }, tableEvents.moveChoiceUp, promptIndex, i));
        div.appendChild(c("a", {
            className: "row_content_down icon icon_down" + (i == prompt.contents.length - 1 ? " invisible" : ""),
            href: "#",
            text: " ",
            tabindex: ++tabindex
        }, tableEvents.moveChoiceDown, promptIndex, i));
        // edit/delete buttons
        div.appendChild(c("a", {
            className: "row_content_delete icon icon_delete",
            href: "#",
            text: " ",
            tabindex: ++tabindex + 1,
        }, tableEvents.deleteContent, promptIndex, i));
        div.appendChild(c("a", {
            className: "row_content_edit icon icon_edit",
            href: "#",
            text: " ",
            tabindex: tabindex,
        }, tableEvents.editContent, promptIndex, i));
        // content
        div.appendChild(c("b", {
            text: prompt.contents[i].type
        }));
        div.appendChild(document.createTextNode(": "));
        div.appendChild(c("code", {
            text: prompt.contents[i].value,
            title: prompt.contents[i].value
        }));
        td.appendChild(div);
    }
    td.appendChild(c("button", {
        className: "row_content_add",
        text: "Add Content",
        tabindex: ++tabindex
    }, tableEvents.addContent, promptIndex));
    tr.appendChild(td);
    
    // Make choices and actions columns
    td = c("td", {
        className: "row_randomizeChoices",
        colspan: "2"
    });
    div = c("div");
    div.style.cssFloat = "right";
    id = "row_randomizeChoices_cbox_" + Math.random();
    div.appendChild(c("input", {
        className: "row_randomizeChoices_cbox",
        type: "checkbox",
        id: id,
        tabindex: ++tabindex + 1,
        checked: prompt.randomizeChoices
    }, tableEvents.updateRandomizeChoices, promptIndex));
    div.appendChild(c("label", {
        text: " Randomize Choices",
        "for": id
    }));
    td.appendChild(div);
    td.appendChild(c("button", {
        className: "row_addChoice_btn",
        text: "Add Choice",
        tabindex: tabindex
    }, tableEvents.addChoice, promptIndex));
    tr.appendChild(td);
    tbody.appendChild(tr);
    
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
    // edit/delete buttons
    div.appendChild(c("a", {
        className: "row_choice_delete icon icon_delete",
        href: "#",
        text: " ",
        tabindex: tabindex + 4
    }, tableEvents.deleteChoice, promptIndex, choiceIndex));
    div.appendChild(c("a", {
        className: "row_choice_edit icon icon_edit",
        href: "#",
        text: " ",
        tabindex: tabindex + 3
    }, tableEvents.editChoice, promptIndex, choiceIndex));
    // up/down buttons
    div.appendChild(c("a", {
        className: "row_choice_up icon icon_up" + (choiceIndex == 0 ? " invisible" : ""),
        href: "#",
        text: " ",
        tabindex: tabindex + 1
    }, tableEvents.moveChoiceUp, promptIndex, choiceIndex));
    div.appendChild(c("a", {
        className: "row_choice_down icon icon_down" + (choiceIndex == prompt.choices.length - 1 ? " invisible" : ""),
        href: "#",
        text: " ",
        tabindex: tabindex + 2
    }, tableEvents.moveChoiceDown, promptIndex, choiceIndex));
    tabindex += 4;
    // content
    div.appendChild(c("b", {
        text: choice.type
    }));
    div.appendChild(document.createTextNode(": "));
    div.appendChild(c("br"));
    div.appendChild(c("code", {
        text: choice.value,
        title: choice.value
    }));
    td.appendChild(div);
    
    id = "row_choice_pointValue_" + Math.random();
    div = c("div");
    div.style.clear = "both";
    div.appendChild(c("label", {
        "for": id,
        text: "Point Value: "
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
        ul = c("ul", {
            className: "row_action_ul"
        });
        for (i = 0; i < action.actions.length; i++) {
            li = c("li", {
                className: "row_action_li"
            });
            if (action.actions[i].frontend) {
                li.appendChild(c("span", {
                    className: "row_action_frontend",
                    text: action.actions[i].frontend + ": ",
                    title: "Action Frontend"
                }));
            }
            li.appendChild(c("b", {
                className: "row_action_name",
                text: action.actions[i].name,
                title: "Action Name"
            }));
            if (action.actions[i].data.length > 0) {
                li.appendChild(c("span", {
                    className: "row_action_data_barrier",
                    text: ": "
                }));
                li.appendChild(c("code", {
                    className: "row_action_data short",
                    text: JSON.stringify(action.actions[i].data),
                    title: JSON.stringify(action.actions[i].data)
                }));
            }
            ul.appendChild(li);
        }
        td.appendChild(ul);
    } else {
        td.appendChild(c("span", {
            className: "row_action_noActions",
            text: "No actions!"
        }));
    }
    tr.appendChild(td);
    
    tbody.appendChild(tr);
}

/**
 * Read a JSON file.
 */
function readJSONFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
        if (reader.result) {
            var result;
            try {
                result = JSON.parse(reader.result);
            } catch (err) {}
            if (result) {
                document.getElementById("instructions").style.display = "none";
                document.getElementById("loadedFrom_filename").textContent = file.name;
                document.getElementById("loadedFrom").style.display = "block";
                json = result;
                generateTable();
                window.scrollTo(0, 0);
            } else {
                alert("Error reading file!\nDetails: Could not parse JSON.");
            }
        } else {
            alert("Error reading file!\nDetails: File is empty or unreadable.");
        }
    };
    reader.onerror = function () {
        alert("Error reading file!\nDetails: " + reader.error);
    };
    reader.readAsText(file);
}

/**
 * Update the link to download the JSON file.
 */
function updateSaveLink() {
    var a = document.getElementById("downloads_save");
    var d = new Date();
    a.setAttribute("download", "SerGIS Data " + d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + ".json");
    a.setAttribute("href", "data:application/json;base64," + btoa(JSON.stringify(json)));
}

var supportPageOffset = window.pageXOffset !== undefined;
var isCSS1Compat = ((document.compatMode || "") === "CSS1Compat");

/**
 * Check the scrolling.
 */
function checkScroll() {
    var tbl = document.getElementById("promptContainer").childNodes[0];
    if (tbl) {
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
        // Find out how far the table is from the top
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
                tbl.className += " scrollFixed";
            }
        } else if (i != -1) {
            // We shouldn't be; let's remove the class
            tbl.className = tbl.className.substring(0, i) + tbl.className.substring(i + 11);
        }
    }
}

/**
 * Initialize everything.
 */
function init() {
    // "Open" button
    document.getElementById("downloads_open").addEventListener("click", function (event) {
        event.preventDefault();
        document.getElementById("fileinput").click();
    }, false);
    document.getElementById("fileinput").addEventListener("change", function (event) {
        if (event.target.files && event.target.files.length > 0) {
            var file = event.target.files[0];
            var ext = file.name.substring(file.name.lastIndexOf(".") + 1).toLowerCase();
            if (ext != "json") {
                alert("Invalid file!\nPlease select a *.json file.");
            } else {
                readJSONFile(file);
            }
        }
    }, false);
    
    // "Save" button (if <a download="..."> isn't supported)
    if (typeof document.createElement("a").download == "undefined") {
        document.getElementById("downloads_save").addEventListener("click", function (event) {
            alert("Right-click this button, select \"Save Link As\" or \"Save Target As\", and name the file something like \"name.json\"");
            event.preventDefault();
        }, false);
    }
    
    // "Add Prompt" button
    document.getElementById("addPrompt").addEventListener("click", function (event) {
        event.preventDefault();
        json.promptList.push({});
        // Regenerate the table and update the save button
        generateTable();
    }, false);
    
    // "Prompt Set Name" textbox
    document.getElementById("general_name").addEventListener("change", function (event) {
        json.name = this.value;
        // Update the save button
        updateSaveLink();
    }, false);
    
    // "Prompt Set Author" textbox
    document.getElementById("general_author").addEventListener("change", function (event) {
        json.author = this.value;
        // Update the save button
        updateSaveLink();
    }, false);
    
    // "Jumping Back Allowed" checkbox
    document.getElementById("general_jumpingBackAllowed").addEventListener("change", function (event) {
        json.jumpingBackAllowed = this.checked;
        // Update the save button
        updateSaveLink();
    }, false);
    
    // "On Jump Back" select
    document.getElementById("general_onJumpBack").addEventListener("change", function (event) {
        json.onJumpBack = this.value;
        // Update the save button
        updateSaveLink();
    }, false);
    
    // "Jumping Forward Allowed" checkbox
    document.getElementById("general_jumpingForwardAllowed").addEventListener("change", function (event) {
        json.jumpingForwardAllowed = this.checked;
        // Update the save button
        updateSaveLink();
    }, false);
    
    // "Show Actions In User Order" checkbox
    document.getElementById("general_showActionsInUserOrder").addEventListener("change", function (event) {
        json.showActionsInUserOrder = this.checked;
        // Update the save button
        updateSaveLink();
    }, false);
    
    // Set up table header for scrolling
    window.addEventListener("scroll", function (event) {
        checkScroll();
    }, false);
    checkScroll();
    
    // Make our JSON defaults and generate the default table
    generateTable();
}

window.addEventListener("load", init, false);
