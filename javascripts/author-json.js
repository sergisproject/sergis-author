/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

// This file contains all the details about the SerGIS JSON Game Data format.
// Globals: AUTHOR_JSON_MAX_FILE_SIZE, AUTHOR_JSON_MAX_FILE_SIZE_HUMAN_READABLE

// Max file size, in bytes
var AUTHOR_JSON_MAX_FILE_SIZE = 1024 * 1024; // 1 MB
var AUTHOR_JSON_MAX_FILE_SIZE_HUMAN_READABLE = "1 MB";

AUTHOR.JSON = {
    /**
     * Reference for the different types that the SerGIS JSON Content Object
     * fields can be.
     * Each has a makeEditor function that takes these parameters:
     *   `property`: The name of the property (passed as the first argument to
     *       onchange).
     *   `name`: The name or label of the field.
     *   `value`: The current value of the field.
     *   `data`: An object in which we can store arbitrary metadata about the
     *       value or property.
     *   `onchange`: A function to call after the value changes. Called with:
     *       onchange(property, value)
     */
    fieldTypes: {
        // Boolean type (checkbox)
        boolean: {
            makeEditor: function (property, name, value, data, onchange) {
                // Initial value
                value = !!value;
                // Propogate initial value
                onchange(property, value);
                
                var p = c("p"),
                    id = "id_" + randID();
                p.appendChild(c("input", {
                    id: id,
                    type: "checkbox",
                    checked: value ? "checked" : undefined
                }, function (event) {
                    onchange(property, this.checked);
                }));
                p.appendChild(c("label", {
                    "for": id,
                    text: " " + name
                }));
                return p;
            }
        },
        
        // Number type (spinbox)
        number: {
            makeEditor: function (property, name, value, data, onchange) {
                // Initial value
                value = Number(value || 0);
                // Propogate initial value
                onchange(property, value);
                
                var p = c("p"),
                    id = "id_" + randID();
                p.appendChild(c("label", {
                    "for": id,
                    text: name + " "
                }));
                p.appendChild(c("input", {
                    id: id,
                    type: "number",
                    value: value.toString()
                }, function (event) {
                    onchange(property, Number(this.value));
                }));
                return p;
            }
        },
        
        // String type (textbox)
        string: {
            makeEditor: function (property, name, value, data, onchange) {
                // Initial value
                value = (value || "").toString();
                // Propogate initial value
                onchange(property, value);
                
                var p = c("p", {
                    className: "inputcontainer"
                });
                var id = "id_" + randID();
                p.appendChild(c("label", {
                    "for": id,
                    text: name + " "
                }));
                var inner_container = c("span");
                inner_container.appendChild(c("input", {
                    id: id,
                    value: value
                }, function (event) {
                    onchange(property, this.value);
                }));
                p.appendChild(inner_container);
                return p;
            }
        },
        
        // Multiline string type (textarea)
        string_multiline: {
            makeEditor: function (property, name, value, data, onchange) {
                // Initial value
                value = (value || "").toString();
                // Propogate initial value
                onchange(property, value);
                
                var p = c("p"),
                    id = "id_" + randID();
                p.appendChild(c("label", {
                    "for": id,
                    text: name + " "
                }));
                p.appendChild(c("textarea", {
                    id: id,
                    rows: 3,
                    text: value
                }, function (event) {
                    onchange(property, this.value);
                }));
                return p;
            }
        },
        
        // A string (URL) or file (data URL)
        string_file: {
            makeEditor: function (property, name, value, data, onchange) {
                // Initial value
                value = (value || "").toString();
                // Propogate initial value
                onchange(property, value);
                
                var p = c("p", {
                    className: "inputcontainer"
                });
                var id = "id_" + randID();
                p.appendChild(c("label", {
                    "for": id,
                    text: name + " "
                }));
                
                var input = c("input", {
                    id: id,
                    value: data.filename || value || "",
                    placeholder: "http://"
                }, function (event) {
                    onchange(property, this.value);
                });
                if (data.filename) input.disabled = true;
                
                var inner_container = c("span");
                inner_container.appendChild(input);
                p.appendChild(inner_container);
                
                // Make button container
                inner_container = c("span");
                inner_container.style.width = "1px";
                inner_container.style.whiteSpace = "nowrap";

                // Make clear button
                var clearButton = c("button", {
                    text: _("Clear")
                }, function (event) {
                    event.preventDefault();
                    // Clear stored file value
                    data.filename = undefined;
                    onchange(property, input.value = "");
                    // Reset looks
                    this.style.display = "none";
                    input.disabled = false;
                });
                if (!data.filename) clearButton.style.display = "none";
                inner_container.appendChild(clearButton);
                
                if (window.askForFile) {
                    // Make browse button
                    var browseButton = c("button", {
                        text: _("Browse for file...")
                    }, function (event) {
                        event.preventDefault();
                        var file;
                        askForFile().then(function (_file) {
                            file = _file;
                            if (file.size > AUTHOR_JSON_MAX_FILE_SIZE) {
                                // AHH! Huge file!
                                return askForConfirmation(
                                    _("The file that you have chosen is larger than {0}, which is the recommended maximum file size. It is recommended that you upload the file elsewhere and just link to it here.", AUTHOR_JSON_MAX_FILE_SIZE_HUMAN_READABLE) +
                                    "\n\n" +
                                    _("Would you like to add the file anyway? (This may cause unexpected issues.)"),
                                true);
                            }
                            // The file wasn't too big
                            return true;
                        }).then(function (shouldContinue) {
                            if (!shouldContinue) return;
                            var reader = new FileReader();
                            reader.onload = function () {
                                if (reader.result) {
                                    // Store file name
                                    input.value = data.filename = file.name;
                                    // Set looks
                                    input.disabled = true;
                                    clearButton.style.display = "inline";
                                    // Store file value
                                    onchange(property, reader.result);
                                } else {
                                    alert(_("Error reading file! File is empty or unreadable."));
                                }
                            };
                            reader.onerror = function () {
                                console.error(reader.error);
                                alert(_("Error reading file: ") + reader.error.name + "\n" + reader.error.message);
                            };
                            reader.readAsDataURL(file);
                        });
                    });
                    browseButton.style.marginLeft = "5px";
                    inner_container.appendChild(browseButton);
                    p.appendChild(inner_container);
                }
                
                return p;
            }
        }
    },
    
    /**
     * Reference for the SerGIS JSON Content Object types used by "Edit
     * Content" and "Edit Choices".
     *
     * Each `fields` property is an array of the options that that content type
     * takes. Each array item is another array:
     *     [JSON property, display name, type, default value]
     * The first element in `fields` must be the one for the `value` property.
     *
     * Each content type also has a "toHTML" that is passed an object of this
     * content type and should return a simple rendering of the content.
     */
    contentTypes: {
        "text": {
            name: _("Text"),
            fields: [
                ["value", _("Text Content:"), "string_multiline"],
                ["centered", _("Center Text"), "boolean", false],
                ["style", _("CSS style:"), "string"]
            ],
            toHTML: function (content) {
                var span = c("span");
                span.appendChild(c("span", {
                    text: content.value || "",
                    style: content.style || undefined
                }));
                return span.innerHTML;
            }
        },
        
        "html": {
            name: _("HTML"),
            fields: [
                ["value", _("HTML Content:"), "string_multiline"],
                ["style", _("CSS style:"), "string"]
            ],
            toHTML: function (content) {
                var span = c("span");
                span.appendChild(c("span", {
                    html: content.value || "",
                    style: content.style || undefined
                }));
                return span.innerHTML;
            }
        },
        
        "image": {
            name: _("Image"),
            fields: [
                ["value", _("Image URL/File:"), "string_file"],
                ["centered", _("Center Image"), "boolean", true],
                ["style", _("CSS style:"), "string"]
            ],
            toHTML: function (content) {
                var span = c("span");
                span.appendChild(c("img", {
                    src: content.value || "",
                    style: content.style || undefined
                }));
                return span.innerHTML;
            }
        },
        
        "youtube": {
            name: _("YouTube Video"),
            fields: [
                ["value", _("YouTube Video ID:"), "string"],
                ["width", _("Video Width:"), "number", 400],
                ["height", _("Video Height:"), "number", 300],
                ["centered", _("Center Video"), "boolean", true],
                ["style", _("CSS style:"), "string"]
                // TODO: NOT SUPPORTED: playerVars
            ],
            toHTML: function (content) {
                var span = c("span", {
                    text: _("YouTube Video") + ": "
                });
                span.appendChild(c("a", {
                    href: "http://www.youtube.com/watch?v=" + encodeURIComponent(content.value),
                    text: content.value,
                    target: "_blank"
                }));
                return span.innerHTML;
            }
        }
    },
    
    defaultContentType: "text"
    
    /* actions */
    /* frontendNames */
    /* actionsByFrontend */
    /* frontendInfo */
};

////////////////////////////////////////////////////////////////////////////////
// And, the rest is all for defining the remaining properties of AUTHOR.JSON.
(function () {
    /*
    What follows here is a lot of constructors for SERGIS_JSON_... objects.
    These represent data fields for actions and frontend info.
    The usage of these constructors and classes can be seen below, where
    "AUTHOR.JSON.actions", "AUTHOR.JSON.actionsByFrontend", and
    "AUTHOR.JSON.frontendInfo" are defined.
    */
    
    /**
     * Convert an array of [red, green, blue] to a color hex.
     */
    function rgbToHex(arr) {
        var hex = "#";
        for (var i = 0; i <= 2; i++) {
            hex += ("0" + (arr[i] || 0).toString(16)).slice(-2);
        }
        return hex;
    }
    window.rgbToHex = rgbToHex;
    
    /**
     * Convert a color hex to [red, green, blue].
     */
    function hexToRgb(hex) {
        if (hex[0] == "#") hex = hex.substring(1);
        var arr = [];
        for (var i = 0; i <= 2; i++) {
            arr[i] = parseInt(hex.substring(i*2, i*2+2), 16);
        }
        return arr;
    }
    window.hexToRgb = hexToRgb;
    
    
    /**
     * A string for some action's data.
     * @constructor
     */
    function SERGIS_JSON_String(label, description, json, required, pattern) {
        this.label = label;
        this.description = description;
        this.string = typeof json == "string" ? json : "";
        this.required = required;
        this.pattern = pattern;
    }
    
    SERGIS_JSON_String.prototype.getJSONValue = function () {
        return this.string;
    };
    
    SERGIS_JSON_String.prototype.getElement = function (onchange) {
        // Propogate initial changes
        onchange();
        
        var that = this,
            bigdiv = c("div", {className: "action-item"}),
            div = c("div", {className: "inputcontainer"}),
            id = "id_" + randID();
        
        div.appendChild(c("label", {
            "for": id,
            text: this.label + ": ",
            className: "action-label"
        }));
        var span = c("span");
        span.appendChild(c("input", {
            id: id,
            value: this.string,
            required: this.required ? "required" : undefined,
            pattern: this.pattern || undefined
        }, function (event) {
            that.string = this.value;
            onchange();
        }));
        div.appendChild(span);
        bigdiv.appendChild(div);
        
        if (this.description) {
            bigdiv.appendChild(c("div", {
                className: "action-description",
                text: this.description
            }));
        }
        
        return bigdiv;
    };
    
    
    /**
     * A number for some action's data.
     * @constructor
     */
    function SERGIS_JSON_Number(label, description, json, min, max, step) {
        this.label = label;
        this.description = description;
        this.number = Number(json);
        if (isNaN(this.number)) this.number = 0;
        
        this.min = min;
        this.max = max;
        this.step = step;
    }
    
    SERGIS_JSON_Number.prototype.getJSONValue = function () {
        return this.number;
    };
    
    SERGIS_JSON_Number.prototype.getElement = function (onchange) {
        // Propogate initial changes
        onchange();
        
        var that = this,
            div = c("div", {className: "action-item"}),
            id = "id_" + randID();
        
        div.appendChild(c("label", {
            "for": id,
            text: this.label + ": ",
            className: "action-label"
        }));
        div.appendChild(c("input", {
            id: id,
            type: "number",
            min: this.min || undefined,
            max: this.max || undefined,
            step: this.step || undefined,
            value: this.number,
            required: "required"
        }, function (event) {
            var num = Number(this.value);
            if (isNaN(num)) {
                this.style.border = "1px solid red";
            } else {
                this.style.border = "";
                that.number = num;
                onchange();
            }
        }));
        
        if (this.description) {
            div.appendChild(c("div", {
                className: "action-description",
                text: this.description
            }));
        }
        
        return div;
    };
    
    
    /**
     * A selectable value for some action's data. `items` is an array of
     * objects with these properties: label (string), value (any valid JSON).
     * @constructor
     */
    function SERGIS_JSON_Dropdown(label, description, json, items) {
        this.label = label;
        this.description = description;
        this.items = items;
        this.index = 0;
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i].value == json) {
                this.index = i;
                break;
            }
        }
    }
    
    SERGIS_JSON_Dropdown.prototype.getJSONValue = function () {
        return this.items[this.index].value;
    };
    
    SERGIS_JSON_Dropdown.prototype.getElement = function (onchange) {
        // Propogate initial changes
        onchange();
        
        var that = this,
            div = c("div", {className: "action-item"}),
            id = "id_" + randID();
        
        div.appendChild(c("label", {
            "for": id,
            text: this.label + ": ",
            className: "action-label"
        }));
        var select = c("select", {
            id: id
        }, function (event) {
            that.index = this.selectedIndex;
            onchange();
        });
        for (var i = 0; i < this.items.length; i++) {
            select.appendChild(c("option", {
                value: i,
                text: this.items[i].label,
                selected: this.index == i ? "selected" : undefined
            }));
        }
        div.appendChild(select);
        
        if (this.description) {
            div.appendChild(c("div", {
                className: "action-description",
                text: this.description
            }));
        }
        
        return div;
    };
    
    
    /**
     * A SerGIS_ArcGIS~Layer object for some action's data.
     * @see https://github.com/sergisproject/sergis-client/blob/master/lib/frontends/arcgis.js
     * @constructor
     */
    function SERGIS_JSON_Layer(label, description, json) {
        this.label = label;
        this.description = description;
        this.json = (typeof json == "object" && json) ? json : {};
        if (typeof this.json.name != "string") this.json.name = "";
        if (typeof this.json.group != "string") this.json.group = "";
        if (!this.json.urls || !this.json.urls.length) this.json.urls = [];
        if (typeof this.json.opacity != "number") this.json.opacity = 1;
    }
    
    SERGIS_JSON_Layer.prototype.getJSONValue = function () {
        return this.json;
    };
    
    SERGIS_JSON_Layer.prototype.getElement = function (onchange) {
        // Propogate initial changes
        onchange();
        
        var that = this,
            div = c("div", {className: "action-item"}),
            id, inner_div, inner_bigdiv, inner_span;
        
        inner_div = c("div");
        inner_div.appendChild(c("label", {
            text: this.label,
            className: "action-label"
        }));
        div.appendChild(inner_div);
        
        if (this.description) {
            div.appendChild(c("div", {
                className: "action-description",
                text: this.description
            }));
        }
        
        // Each item is an array: [label, description, value, required, change event handler]
        var textfields = [
            [_("Name"), _("The name of the layer (must be unique)."), this.json.name || "", true, function (event) {
                that.json.name = this.value;
                onchange();
            }],
            [_("Group (optional)"), _("A group name that this layer is part of (used in the \"hideLayers\" action)."), this.json.group || "", false, function (event) {
                that.json.group = this.value;
                onchange();
            }],
            [_("URL"), _("The URL to this layer on an ArcGIS Server."), this.json.urls[0] || "", true, function (event) {
                that.json.urls[0] = this.value;
                onchange();
            }]
        ];
        for (var i = 0; i < textfields.length; i++) {
            id = "id_" + randID();
            inner_bigdiv = c("div", {className: "action-subitem"});
            inner_div = c("div", {className: "inputcontainer"});
            inner_div.appendChild(c("label", {
                "for": id,
                text: textfields[i][0] + ": "
            }));
            inner_span = c("span");
            inner_span.appendChild(c("input", {
                id: id,
                value: textfields[i][2],
                required: textfields[i][3] ? "required" : undefined
            }, textfields[i][4]));
            inner_div.appendChild(inner_span);
            inner_bigdiv.appendChild(inner_div);
            inner_bigdiv.appendChild(c("div", {
                className: "action-description",
                text: textfields[i][1]
            }));
            div.appendChild(inner_bigdiv);
        }
        
        // Opacity
        id = "id_" + randID();
        inner_div = c("div", {className: "action-subitem"});
        inner_div.appendChild(c("label", {
            "for": id,
            text: _("Opacity") + ": "
        }));
        inner_div.appendChild(c("input", {
            id: id,
            type: "number",
            min: 0,
            max: 1,
            step: 0.01,
            value: this.json.opacity,
            required: "required"
        }, function (event) {
            var num = Number(this.value);
            if (isNaN(num) || num < 0 || num > 1) {
                this.style.border = "1px solid red";
            } else {
                this.style.border = "";
                that.json.opacity = num;
                onchange();
            }
        }));
        div.appendChild(inner_div);
        
        return div;
    };
    
    
    /**
     * A SerGIS JSON Content object for some action's data.
     * @constructor
     */
    function SERGIS_JSON_Content(label, description, json) {
        this.label = label;
        this.description = description;
        this.json = (typeof json == "object" && json) ? json : {};
        if (!this.json.type || !AUTHOR.JSON.contentTypes.hasOwnProperty(this.json.type)) {
            this.json.type = AUTHOR.JSON.defaultContentType;
        }
        if (typeof this.json.value != "string") this.json.value = "";
    }
    
    SERGIS_JSON_Content.prototype.getJSONValue = function () {
        return this.json;
    };
    
    SERGIS_JSON_Content.prototype.getElement = function (onchange) {
        // Propogate initial changes
        onchange();
        
        var that = this,
            bigdiv = c("div", {className: "action-item"}),
            div = c("div"),
            editor_div = c("div");
        
        if (!that.json._sergis_author_data) that.json._sergis_author_data = {};
        
        // Function to make the editor for the current content type
        function makeEditor() {
            // Clear out the old editor
            editor_div.innerHTML = "";
            
            // Get info on "value" field (which is the only one that we care about here)
            var field = AUTHOR.JSON.contentTypes[that.json.type].fields[0];
            var name = field[1], type = field[2], value = that.json.value || field[3];
            
            editor_div.appendChild(AUTHOR.JSON.fieldTypes[type].makeEditor(null, name, value, that.json._sergis_author_data, function (property, value) {
                that.json.value = value;
                onchange();
            }));
        }
        
        div.appendChild(c("label", {
            text: this.label + ": ",
            className: "action-label"
        }));
        
        var select = c("select", {}, function (event) {
            that.json.type = this.value;
            // Clear data
            that.json.value = "";
            that.json._sergis_author_data = {};
            // Update the editor
            makeEditor();
            // Propogate changes to whoever's storing them
            onchange();
        });
        // Make sure default content type is first
        var defaultContentType;
        if (AUTHOR.JSON.defaultContentType && AUTHOR.JSON.contentTypes.hasOwnProperty(defaultContentType)) {
            defaultContentType = AUTHOR.JSON.defaultContentType;
            select.appendChild(c("option", {
                value: defaultContentType,
                text: AUTHOR.JSON.contentTypes[defaultContentType].name,
                selected: this.json.type == defaultContentType ? "selected" : undefined
            }));
        }
        // Make the rest of the content types
        for (var type in AUTHOR.JSON.contentTypes) {
            if (AUTHOR.JSON.contentTypes.hasOwnProperty(type) && type != defaultContentType) {
                select.appendChild(c("option", {
                    value: type,
                    text: AUTHOR.JSON.contentTypes[type].name,
                    selected: this.json.type == type ? "selected" : undefined
                }));
            }
        }
        div.appendChild(select);
        bigdiv.appendChild(div);
        
        // Append the div that holds the editor
        bigdiv.appendChild(editor_div);
        
        // Make the initial editor
        makeEditor();

        // Add the description, if needed
        if (that.description) {
            bigdiv.appendChild(c("div", {
                className: "action-description",
                text: that.description
            }));
        }
        
        return bigdiv;
    };
    
    
    /**
     * An array of SerGIS_ArcGIS~Point objects for some action's data.
     * @see https://github.com/sergisproject/sergis-client/blob/master/lib/frontends/arcgis.js
     * @constructor
     */
    function SERGIS_JSON_PointsArray(label, description, json) {
        this.label = label;
        this.description = description;
        this.json = (typeof json == "object" && json && json.length) ? json : [];
    }
    
    SERGIS_JSON_PointsArray.prototype.getJSONValue = function () {
        return this.json.filter(function (item) {
            return !!item;
        });
    };
    
    SERGIS_JSON_PointsArray.prototype.getElement = function (onchange) {
        // Propogate initial changes
        onchange();
        
        var that = this,
            div = c("div", {className: "action-item"}),
            table = c("table"), tr = c("tr"), td;
        
        div.appendChild(c("label", {
            text: this.label + ": ",
            className: "action-label"
        }));
        
        if (this.description) {
            div.appendChild(c("div", {
                className: "action-description",
                text: this.description
            }));
        }
        
        function makeInnerTable(i) {
            var inner_table = c("table", {
                className: "noborder"
            });
            inner_table.style.margin = "0";
            var inner_tr, inner_td, id;
            
            // Latitude
            inner_tr = c("tr");
            inner_td = c("td");
            id = "id_" + randID();
            inner_td.appendChild(c("label", {
                "for": id,
                text: _("Latitude:") + " "
            }));
            inner_tr.appendChild(inner_td);
            inner_td = c("td");
            inner_td.appendChild(c("input", {
                type: "number",
                step: 0.001,
                value: that.json[i].latitude || 0,
                required: "required"
            }, function (event) {
                var num = Number(this.value);
                if (isNaN(num)) {
                    this.style.border = "1px solid red";
                } else {
                    this.style.border = "";
                    that.json[i].latitude = num;
                    onchange();
                }
            }));
            inner_tr.appendChild(inner_td);
            inner_table.appendChild(inner_tr);
            
            // Longitude
            inner_tr = c("tr");
            inner_td = c("td");
            id = "id_" + randID();
            inner_td.appendChild(c("label", {
                "for": id,
                text: _("Longitude:") + " "
            }));
            inner_tr.appendChild(inner_td);
            inner_td = c("td");
            inner_td.appendChild(c("input", {
                type: "number",
                step: 0.001,
                value: that.json[i].longitude || 0,
                required: "required"
            }, function (event) {
                var num = Number(this.value);
                if (isNaN(num)) {
                    this.style.border = "1px solid red";
                } else {
                    this.style.border = "";
                    that.json[i].longitude = num;
                    onchange();
                }
            }));
            inner_tr.appendChild(inner_td);
            inner_table.appendChild(inner_tr);
            
            // "Remove" button
            inner_tr = c("tr");
            inner_td = c("td", {
                colspan: "2"
            });
            inner_td.style.textAlign = "center";
            inner_td.appendChild(c("button", {
                text: "Remove Point"
            }, function (event) {
                that.json[i] = undefined;
                onchange();
                var td = inner_table.parentNode;
                if (td && td.parentNode) {
                    td.parentNode.removeChild(td);
                }
            }));
            inner_tr.appendChild(inner_td);
            inner_table.appendChild(inner_tr);
            
            return inner_table;
        }
        
        for (var i = 0; i < this.json.length; i++) {
            //if (!this.json[i]) this.json[i] = {latitude: 0, longitude: 0};
            if (this.json[i]) {
                td = c("td");
                td.appendChild(makeInnerTable(i));
                tr.appendChild(td);
            }
        }
        
        // Add "Add Point" button
        var button = c("button", {
            text: "Add Point"
        }, function (event) {
            var new_td = c("td");
            new_td.appendChild(makeInnerTable(that.json.push({latitude: 0, longitude: 0}) - 1));
            onchange();
            tr.insertBefore(new_td, td);
        });
        td = c("td");
        td.style.verticalAlign = "middle";
        td.appendChild(button);
        tr.appendChild(td);
        
        table.appendChild(tr);
        div.appendChild(table);
        
        return div;
    };
    
    
    /**
     * A SerGIS_ArcGIS~DrawStyle object for some action's data.
     * @see https://github.com/sergisproject/sergis-client/blob/master/lib/frontends/arcgis.js
     * @constructor
     */
    function SERGIS_JSON_DrawStyle(label, description, json) {
        this.properties = [
            ["dotStyle", _("Dot Style")],
            ["dotColor", _("Dot Color")],
            ["lineStyle", _("Line Style")],
            ["lineColor", _("Line Color")],
            ["lineWidth", _("Line Width")],
            ["fillStyle", _("Fill Style")],
            ["fillColor", _("Fill Color")]
        ];
        this.possibilities = {
            dotStyle: [
                ["circle", _("Circle")],
                ["cross", _("Cross")],
                ["diamond", _("Diamond")],
                ["square", _("Square")],
                ["x", "X"]
            ],
            dotColor: "color",
            lineStyle: [
                ["Solid", _("Solid")],
                ["Dash", _("Dash")],
                ["DashDot", _("Dash-Dot")],
                ["DashDotDot", _("Dash-Dot-Dot")],
                ["LongDash", _("Long Dash")],
                ["LongDashDot", _("Long Dash-Dot")],
                ["ShortDash", _("Short Dash")],
                ["ShortDashDot", _("Short Dash-Dot")],
                ["ShortDashDotDot", _("Short Dash-Dot-Dot")],
                ["ShortDot", _("Short Dot")],
                ["Null", _("None")]
            ],
            lineColor: "color",
            lineWidth: "number",
            fillStyle: [
                ["solid", _("Solid")],
                ["horizontal", _("Horizontal Lines")],
                ["vertical", _("Vertical Lines")],
                ["cross", _("Cross")],
                ["diagonal_cross", _("Diagonal Cross")],
                ["forward_diagonal", _("Forward Diagonal")],
                ["backward_diagonal", _("Backward Diagonal")],
                ["null", _("None")]
            ],
            fillColor: "color"
        };
        this.defaults = {
            dotStyle: "circle",
            dotColor: [0, 255, 0, 0.5],
            lineStyle: "solid",
            lineColor: [255, 0, 0],
            lineWidth: 2,
            fillStyle: "solid",
            fillColor: [255, 0, 0, 0.25]
        };
        
        this.checkJSON = function () {
            // Set defaults if nonexistent
            for (var item in this.defaults) {
                if (this.defaults.hasOwnProperty(item)) {
                    // Switch by the type of this item
                    if (this.possibilities[item] == "number") {
                        // It must be a positive number
                        if (typeof this.json[item] != "number" || this.json[item] < 1) {
                            this.json[item] = this.defaults[item];
                        }
                        // Make sure it's an integer
                        this.json[item] = Math.floor(this.json[item]);
                    } else if (this.possibilities[item] == "color") {
                        // It must be an array of 3-4 values: [r, g, b, a]
                        if (!this.json[item] || !this.json[item].length) this.json[item] = this.defaults[item];
                        // Check r, g, and b
                        for (var i = 0; i <= 2; i++) {
                            if (typeof this.json[item][i] != "number" || this.json[item][i] < 0 || this.json[item][i] > 255) {
                                this.json[item][i] = 0;
                            }
                        }
                        // Check a
                        if (typeof this.json[item][3] != "number" || this.json[item][3] < 0 || this.json[item][3] > 1) {
                            this.json[item][3] = 1;
                        }
                    } else {
                        // It must be a string that's a member of the list
                        var possibilities = this.possibilities[item].map(function (it) {
                            return it[0];
                        });
                        if (!this.json[item] || possibilities.indexOf(this.json[item]) == -1) {
                            this.json[item] = this.defaults[item];
                        }
                    }
                }
            }
        };
        
        this.label = label;
        this.description = description;
        this.json = json || {};
        this.checkJSON();
    }
    
    SERGIS_JSON_DrawStyle.prototype.getJSONValue = function () {
        return this.json;
    };
    
    SERGIS_JSON_DrawStyle.prototype.getElement = function (onchange) {
        // Propogate initial changes
        onchange();
        
        var that = this,
            div = c("div", {className: "action-item"}),
            table = c("table", {className: "noborder"}),
            tr, td, input, select,
            id, i, j;
        
        div.appendChild(c("label", {
            text: this.label + ": ",
            className: "action-label"
        }));
        
        if (this.description) {
            div.appendChild(c("div", {
                className: "action-description",
                text: this.description
            }));
        }
        
        var pre = "";
        var rows = [];
        var columns, prop;
        for (i = 0; i < this.properties.length; i++) {
            prop = this.properties[i][0];
            
            if (pre != prop.substring(0, 3)) {
                // Make a new row
                if (columns) rows.push(columns);
                columns = [];
                pre = prop.substring(0, 3);
            }
            
            id = "id_" + randID();
            td = c("td");
            td.appendChild(c("label", {
                "for": id,
                text: this.properties[i][1] + ": "
            }));
            columns.push(td);
            
            td = c("td");
            if (this.possibilities[prop] == "number") {
                // It must be a positive number
                td.appendChild(c("input", {
                    id: id,
                    type: "number",
                    value: this.json[prop],
                    min: 1
                }, function (event, that, prop) {
                    that.json[prop] = Number(this.value);
                    onchange();
                }, this, prop));
            } else if (this.possibilities[prop] == "color") {
                // It must be a color
                input = c("input", {
                    id: id,
                    type: "color",
                    //value: rgbToHex(this.json[prop]),
                    // (above doesn't do it for chrome)
                    size: "7",
                    maxlength: "7"
                }, function (event, that, prop) {
                    that.json[prop] = hexToRgb(this.value).concat(that.json[prop][3]);
                }, this, prop);
                td.appendChild(input);
                input.value = rgbToHex(this.json[prop]);
            } else {
                // It must be a select option
                select = c("select", {
                    id: id
                }, function (event, that, prop) {
                    that.json[prop] = this.value;
                });
                for (j = 0; j < this.possibilities[prop].length; j++) {
                    select.appendChild(c("option", {
                        value: this.possibilities[prop][j][0],
                        text: this.possibilities[prop][j][1],
                        selected: this.json[prop] == this.possibilities[prop][j][0] ? "selected" : undefined
                    }));
                }
                td.appendChild(select);
            }
            columns.push(td);
            // Spacing
            columns.push(c("td"));
        }
        // Finish up the last row
        rows.push(columns);
        
        // Add table contents
        for (i = 0; i < rows.length; i++) {
            tr = c("tr");
            for (j = 0; j < rows[i].length; j++) {
                tr.appendChild(rows[i][j]);
            }
            table.appendChild(tr);
        }
        div.appendChild(table);
        
        return div;
    };
    
    
    
    // Initialize the rest of AUTHOR.JSON
    
    /**
     * The Gameplay Actions in SerGIS (not frontend-specific).
     * Each property is an object with 3 properties:
     *   "name": a string representing a localized name for the action.
     *   "description": a string with a localized description for the action.
     *   "getFields": a function that will return an array of SERGIS_...
     *     instances representing the "data" params for the action. If there is
     *     existing data (i.e. we're editing an action instead of creating a new
     *     one), that can be passed in as the `data` argument.
     *   "toHTML": a function that takes an action of that type and returns an
     *     HTML representation of the object.
     */
    AUTHOR.JSON.actions = {
        explain: {
            name: _("Explanation"),
            description: _("Show an explanation to the user to offer feedback on their choice or give them more information."),
            
            getFields: function (data) {
                if (!data) data = [];
                // We need at least 1 slot
                if (data.length < 1) data.length = 1;

                var params = [];

                // They're all SERGIS_JSON_Content objects
                for (var i = 0; i < data.length; i++) {
                    params.push(new SERGIS_JSON_Content(_("Explanation"), _("This explanation will be shown to the user."), data[i]));
                }

                // We can repeat the last type
                params.push("repeat");

                return params;
            },
            
            toHTML: function (data) {
                var span = c("span");
                span.appendChild(c("b", {
                    text: this.name + ": "
                }));
                for (var i = 0; i < data.length; i++) {
                    if (data[i]) {
                        span.appendChild(c("br"));
                        span.appendChild(c("span", {
                            html: AUTHOR.JSON.contentTypes[data[i].type || AUTHOR.JSON.defaultContentType].toHTML(data[i])
                        }));
                    }
                }
                return span.innerHTML;
            }
        },
        
        endGame: {
            name: _("End Game"),
            description: _("End the user's game and take them to the Game Over screen."),
            
            getFields: function (data) {
                // No parameters to this one
                return [];
            },
            
            toHTML: function (data) {
                return c("span", {
                    text: this.name
                }).innerHTML;
            }
        },
        
        "goto": {
            name: _("Go To Prompt Index"),
            description: _("Go to a different prompt instead of the next one in the sequence."),
            
            getFields: function (data) {
                if (!data) data = [];
                // We need one and only one slot
                if (data.length != 1) data.length = 1;

                return [new SERGIS_JSON_Number(_("Prompt Index"), _("Instead of advancing to the next sequential prompt, the game will advance to this prompt index."), data[0])];
            },
            
            toHTML: function (data) {
                var span = c("span");
                span.appendChild(c("b", {
                    text: this.name + ": "
                }));
                span.appendChild(c("span", {
                    text: data[0]
                }));
                return span.innerHTML;
            }
        }
    };
    
    /**
     * Human-readable names for the frontends.
     */
    AUTHOR.JSON.frontendNames = {
        arcgis: "ArcGIS"
    };
    
    /**
     * The Map Actions in SerGIS (frontend-specific).
     * Each property is an object that represents a frontend. The object
     * follows the same format as AUTHOR.JSON.actions.
     */
    AUTHOR.JSON.actionsByFrontend = {
        /**
         * @see https://github.com/sergisproject/sergis-client/blob/master/lib/frontends/arcgis.js
         */
        arcgis: {
            clearGraphics: {
                name: _("Clear Graphics"),
                description: _("Clear all graphics on the map, such as drawn objects (\"draw\" action) and buffers (\"buffer\" action)."),
                
                getFields: function (data) {
                    // No parameters to this one
                    return [];
                },
                
                toHTML: function (data) {
                    var span = c("span");
                    span.appendChild(c("b", {
                        text: "ArcGIS: " + this.name
                    }));
                    return span.innerHTML;
                }
            },
            
            showLayers: {
                //name: _("Show Layers"),
                name: _("Show Layer"),
                description: _("Add a new ArcGIS Server map layer to the map."),
                
                getFields: function (data) {
                    if (!data) data = [];
                    // We need at least one slot
                    if (data.length < 1) data.length = 1;

                    var params = [];

                    // They're all SERGIS_JSON_Layer objects
                    for (var i = 0; i < data.length; i++) {
                        params.push(new SERGIS_JSON_Layer(_("Layer"), null, data[i]));
                    }

                    // We can repeat the last type
                    // Except, that's rather confusing, so we're not going to.
                    //params.push("repeat");

                    return params;
                },
                
                toHTML: function (data) {
                    var span = c("span");
                    span.appendChild(c("b", {
                        text: "ArcGIS: " + this.name + ": "
                    }));
                    for (var i = 0; i < data.length; i++) {
                        span.appendChild(c("br"));
                        span.appendChild(c("span", {
                            text: data[i].name + (data[i].group
                                                  ? " (" + data[i].group + ")"
                                                  : "") +
                                  ": " + data[i].urls.join(", ")
                        }));
                    }
                    return span.innerHTML;
                }
            },
            
            hideLayers: {
                //name: _("Hide Layers"),
                name: _("Hide Layer"),
                description: _("Hide a map layer that was previously added with the \"showLayer\" action."),
                
                getFields: function (data) {
                    if (!data) data = [];
                    // We need at least one slot
                    if (data.length < 1) data.length = 1;

                    var params = [];

                    // They're all SERGIS_JSON_String objects
                    for (var i = 0; i < data.length; i++) {
                        params.push(new SERGIS_JSON_String(_("Layer Group"), _("The \"group\" name of the layer(s) to hide, specified in the \"Group\" attribute of the layers (in a previous \"showLayers\" action)."), data[i], true));
                    }

                    // We can repeat the last type
                    // Except, that's rather confusing, so we're not going to.
                    //params.push("repeat");

                    return params;
                },
                
                toHTML: function (data) {
                    var span = c("span");
                    span.appendChild(c("b", {
                        text: "ArcGIS: " + this.name + ": "
                    }));
                    for (var i = 0; i < data.length; i++) {
                        span.appendChild(c("br"));
                        span.appendChild(c("span", {
                            text: data[i]
                        }));
                    }
                    return span.innerHTML;
                }
            },
            
            draw: {
                name: _("Draw"),
                description: _("Draw predetermined points, lines, and polygons on the map."),
                
                drawTypes: {
                    point: _("Point"),
                    line: _("Line"),
                    polygon: _("Polygon")
                },
                
                getFields: function (data) {
                    if (!data) data = [];
                    // We need at least 4 slots
                    if (data.length < 4) data.length = 4;

                    var params = [];

                    // Index 0 is a SERGIS_JSON_String
                    params.push(new SERGIS_JSON_String(_("Object Name"), _("A unique name for the object being drawn."), data[0], true, "^(?!(userDrawing)).*$"));

                    // Index 1 is a SERGIS_JSON_Dropdown
                    params.push(new SERGIS_JSON_Dropdown(_("Type"), _("The type of object to draw."), data[1], [
                        {
                            label: this.drawTypes.point,
                            value: "point"
                        },
                        {
                            label: this.drawTypes.line,
                            value: "line"
                        },
                        {
                            label: this.drawTypes.polygon,
                            value: "polygon"
                        }
                    ]));

                    // Index 2 is a SERGIS_JSON_DrawStyle
                    params.push(new SERGIS_JSON_DrawStyle(_("Style"), _("The style of the visual representation of the object on the map."), data[2]));

                    // The rest are SERGIS_JSON_PointsArray objects
                    for (var i = 3; i < data.length; i++) {
                        params.push(new SERGIS_JSON_PointsArray(_("Points"), _("The points that make up the object to draw."), data[i]));
                    }

                    // We can repeat the last type
                    // Except, that's rather confusing, so we're not gonna play that game
                    //params.push("repeat");

                    return params;
                },
                
                toHTML: function (data) {
                    var span = c("span");
                    span.appendChild(c("b", {
                        text: "ArcGIS: " + this.name + ": "
                    }));
                    span.appendChild(c("span", {
                        text: (this.drawTypes[data[1]] || data[1]) + " "
                    }));
                    span.appendChild(c("i", {
                        text: "(" + data[0] + ")"
                    }));
                    return span.innerHTML;
                }
            },
            
            buffer: {
                name: _("Buffer"),
                description: _("Create a buffer on the map around a point, line, or polygon previously drawn with the \"draw\" action."),
                
                distanceUnits: {
                    foot: _("Feet"),
                    kilometer: _("Kilometers"),
                    meter: _("Meters"),
                    statute_mile: _("Statute Miles"),
                    nautical_mile: _("Nautical Miles"),
                    us_nautical_mile: _("US Nautical Miles")
                },
                
                getFields: function (data) {
                    if (!data) data = [];
                    // We need 4 slots
                    if (data.length != 4) data.length = 4;

                    var params = [];

                    // Index 0 is a SERGIS_JSON_Number
                    params.push(new SERGIS_JSON_Number(_("Distance"), _("The numerical distance of the buffer."), data[0]));

                    // Index 1 is a SERGIS_JSON_Dropdown
                    params.push(new SERGIS_JSON_Dropdown(_("Distance Unit"), _("The unit for the numerical distance specified above."), data[1], [
                        {label: this.distanceUnits.foot, value: "foot"},
                        {label: this.distanceUnits.kilometer, value: "kilometer"},
                        {label: this.distanceUnits.meter, value: "meter"},
                        {label: this.distanceUnits.statute_mile, value: "statute_mile"},
                        {label: this.distanceUnits.nautical_mile, value: "nautical_mile"},
                        {label: this.distanceUnits.us_nautical_mile, value: "us_nautical_mile"}
                    ]));

                    // Index 2 is a SERGIS_JSON_String
                    params.push(new SERGIS_JSON_String(_("Object Name"), _("An object name (corresponding to an object previously created using the \"draw\" action) to buffer.") + "\n" + _("If the object name specified here has not already been drawn on the map via a \"draw\" option, then the SerGIS Client will show an \"Invalid objectName\" error."), data[2], true));

                    // Index 3 is a SERGIS_JSON_DrawStyle
                    params.push(new SERGIS_JSON_DrawStyle(_("Style"), _("The style of the visual representation of the buffer on the map."), data[3]));

                    return params;
                },
                
                toHTML: function (data) {
                    var span = c("span");
                    span.appendChild(c("b", {
                        text: "ArcGIS: " + this.name + ": "
                    }));
                    span.appendChild(c("span", {
                        text: data[0] + " " + (this.distanceUnits[data[1]] || data[1]) + " "
                    }));
                    span.appendChild(c("i", {
                        text: "(" + data[2] + ")"
                    }));
                    return span.innerHTML;
                }
            }
        }
    };
    
    /**
     * The Frontend Info for a SerGIS Prompt.
     * Property names are the frontends. Values are another object, where...
     *     Property names are frontend info properties;
     *     values are yet another object, with 2 properties:
     *       "getFields": a function that is passed the current value and
     *         returns an array of SerGIS_... instances (or just one instance).
     *       "toHTML": a function that is passed a value and returns an HTML
     *         representation of the frontend.
     */
    AUTHOR.JSON.frontendInfo = {
        arcgis: {
            basemap: {
                getFields: function (data) {
                    return new SERGIS_JSON_Dropdown(_("Basemap"), _("The basemap of the map for this prompt."), data || "streets", [
                        {label: _("Streets"), value: "streets"},
                        {label: _("Satellite"), value: "satellite"},
                        {label: _("Street/Satellite Hybrid"), value: "hybrid"},
                        {label: _("Topographic"), value: "topo"},
                        {label: _("Gray Canvas"), value: "gray"},
                        {label: _("Oceans"), value: "oceans"},
                        {label: _("OSM"), value: "osm"},
                        {label: _("National Geographic"), value: "national-geographic"}
                    ]);
                },
                
                toHTML: function (data) {
                    var span = c("span", {
                        text: data
                    });
                    return span.innerHTML;
                }
            },
            
            layers: {
                getFields: function (data) {
                    if (!data) data = [];
                    // We need at least 1 slot
                    if (data.length < 1) data.length = 1;

                    var params = [];
                    for (var i = 0; i < data.length; i++) {
                        params.push(new SERGIS_JSON_Layer(_("Layer"), _("A map layer that the user can choose to enable while looking at the map."), data[i]));
                    }
                    // We can repeat these
                    params.push("repeat");
                    return params;
                },
                
                toHTML: function (data) {
                    var span = c("span", {
                        text: data.map(function (item) {
                            return item && item.name;
                        }).join(", ")
                    });
                    return span.innerHTML;
                }
            }
        }
    };
})();
