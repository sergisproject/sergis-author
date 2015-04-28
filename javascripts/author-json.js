/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

// This file contains all the details about the SerGIS JSON Game Data format,
// excluding Content objects, which is handled by author-json-content.js.

AUTHOR.JSON = {
    /* actions */
    /* frontendNames */
    /* actionsByFrontend */
    /* frontendInfo */
    /* frontendButtons */
};

(function () {
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
     * Make a string text field (i.e. an inputcontainer).
     *
     * @param {string} label - The label for the text field.
     * @param {string} [description] - A longer description for the text field.
     * @param {string} [value] - The current value of the text field.
     * @param {Function} onchange - A function to call with the input's `change`
     *        event.
     * @param {boolean} [required] - Whether the text field is required.
     * @param {string} [pattern] - A regular expression that the text field
     *        contents must match.
     * @param {string} [divClassName] - A CSS class for the container DIV.
     * @param {string} [labelClassName] - A CSS class for the label.
     */
    function makeStringField(label, description, value, onchange, required, pattern,
                             divClassName, labelClassName) {
        var id = "id_" + randID();
        var bigdiv = c("div", {className: divClassName || undefined});
        
        var div = c("div", {className: "inputcontainer"});
        div.appendChild(c("label", {
            "for": id,
            text: label + ": ",
            className: labelClassName || undefined
        }));
        
        var span = c("span");
        span.appendChild(c("input", {
            id: id,
            value: value || "",
            required: required ? "required" : undefined,
            pattern: pattern || undefined
        }, onchange));
        div.appendChild(span);
        
        bigdiv.appendChild(div);
        
        if (description) {
            bigdiv.appendChild(c("div", {
                className: "action-description",
                text: description
            }));
        }
        
        return bigdiv;
    }
    
    /**
     * Make a checkbox and label.
     */
    function makeCheckBox(label, description, checked, onchange,
                          divClassName, labelClassName) {
        var div = c("div", {className: divClassName || undefined}),
            id = "id_" + randID();

        div.appendChild(c("input", {
            id: id,
            type: "checkbox",
            checked: checked ? "checked" : undefined
        }, onchange));
        div.appendChild(c("label", {
            "for": id,
            text: " " + label,
            className: labelClassName || undefined
        }));
        
        if (description) {
            div.appendChild(c("div", {
                className: "action-description",
                text: description
            }));
        }
        
        return div;
    }
    
    /**
     * Make a string dropdown field (i.e. a select element).
     *
     * @param {string} label - The label for the dropdown.
     * @param {string} [description] - A longer description for the dropdown.
     * @param {Array} items - The items in the dropdown. Each item should be an
     *        object with a "label" property.
     * @param {number} [index] - The selected index in the items array.
     * @param {Function} onchange - A function to call with the select's
     *        `change` event. (Use `this.selectedIndex` in this function to get
     *        the currently selected item as an index in the `items` array.)
     * @param {string} [divClassName] - A CSS class for the container DIV.
     * @param {string} [labelClassName] - A CSS class for the label.
     */
    function makeDropDown(label, description, items, index, onchange,
                          divClassName, labelClassName) {
        var div = c("div", {className: divClassName || undefined}),
            id = "id_" + randID();
        
        div.appendChild(c("label", {
            "for": id,
            text: label + ": ",
            className: labelClassName || undefined
        }));
        var select = c("select", {
            id: id
        }, onchange);
        for (var i = 0; i < items.length; i++) {
            select.appendChild(c("option", {
                value: i,
                text: items[i].label,
                selected: index === i ? "selected" : undefined
            }));
        }
        div.appendChild(select);
        
        if (description) {
            div.appendChild(c("div", {
                className: "action-description",
                text: description
            }));
        }
        
        return div;
    }
    
    
    /***************************************************************************
     * What follows here is a lot of constructors for SERGIS_JSON_... objects. *
     * These represent data fields for actions and frontend info.              *
     * The usage of these constructors and classes can be seen below, where    *
     * "AUTHOR.JSON.actions", "AUTHOR.JSON.actionsByFrontend", and             *
     * "AUTHOR.JSON.frontendInfo" are defined.                                 *
     ***************************************************************************/
    
    
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
        
        var that = this;
        return makeStringField(this.label, this.description, this.string, function (event) {
            that.string = this.value;
            onchange();
        }, this.required, this.pattern, "action-item", "action-label");
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
            input,
            id = "id_" + randID();
        
        div.appendChild(c("label", {
            "for": id,
            text: this.label + ": ",
            className: "action-label"
        }));
        input = c("input", {
            id: id,
            type: "number",
            min: this.min || undefined,
            max: this.max || undefined,
            step: this.step || "any",
            value: this.number,
            required: "required"
        });
        addNumericChangeHandler(input, function (event, value) {
            that.number = value || Math.max(this.min || -Infinity, 0);
            onchange();
        }, this.min || undefined, this.max || undefined);
        div.appendChild(input);
        
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
        
        var that = this;
        return makeDropDown(this.label, this.description, this.items, this.index, function (event) {
            that.index = this.selectedIndex;
            onchange();
        }, "action-item", "action-label");
    };
    
    
    /**
     * A SerGIS_ArcGIS~Layer object for some action's data.
     * @see https://github.com/sergisproject/sergis-client/blob/master/lib/frontends/arcgis.js
     * @constructor
     */
    function SERGIS_JSON_Layer(label, description, json, defaultToggleable, groupExtraDescription) {
        this.label = label;
        this.description = description;
        this.groupExtraDescription = groupExtraDescription;
        
        this.json = (typeof json == "object" && json) ? json : {};
        if (typeof this.json.name != "string") this.json.name = "";
        if (typeof this.json.group != "string") this.json.group = "";
        if (typeof this.json.toggleable != "boolean") this.json.toggleable = !!defaultToggleable;
        if (typeof this.json.type != "string") this.json.type = "";
        if (!this.json.urls || !this.json.urls.length) this.json.urls = [];
        if (typeof this.json.opacity != "number") this.json.opacity = 1;
        if (typeof this.json.hasLegend != "boolean") this.json.hasLegend = false;
    }
    
    SERGIS_JSON_Layer.prototype.getJSONValue = function () {
        return this.json;
    };
    
    SERGIS_JSON_Layer.prototype.getElement = function (onchange) {
        // Propogate initial changes
        onchange();
        
        var that = this,
            div = c("div", {className: "action-item"}),
            id, inner_div, input;
        
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
        
        // Name
        div.appendChild(makeStringField(_("Name"),
                                        _("The name of the layer (must be unique)."),
                                        this.json.name || "",
                                        function (event) {
            that.json.name = this.value;
            onchange();
        }, true, undefined, "action-subitem"));
        
        // Group
        div.appendChild(makeStringField(_("Group (optional)"),
                                        _("A group name that this layer is part of. If this layer is toggleable and there are other toggleable layers with the same group, the user can only select one at once.") + (this.groupExtraDescription ? "\n" + this.groupExtraDescription : ""),
                                        this.json.group || "",
                                        function (event) {
            that.json.group = this.value;
            onchange();
        }, false, undefined, "action-subitem"));
        
        // Toggleable
        div.appendChild(makeCheckBox(_("Toggleable"),
                                     _("Whether the user is able to show or hide this layer. If the layer is toggleable, it is hidden by default."),
                                     this.json.toggleable,
                                     function (event) {
            that.json.toggleable = this.checked;
            onchange();
        }, "action-subitem"));
        
        // Type
        var types = [
            {label: _("Dynamic Map Service"), value: "dynamic"},
            {label: _("Tiled Map Service"), value: "tiled"},
            {label: _("Image Service"), value: "image"},
            {label: _("Feature Layer"), value: "feature"}
        ];
        var defaultTypeIndex = 0;
        for (var i = 0; i < types.length; i++) {
            if (this.json.type == types[i].value) {
                defaultTypeIndex = i;
                break;
            }
        }
        div.appendChild(makeDropDown(_("Type"),
                                     _("The type of the map service on an ArcGIS Server."),
                                     types,
                                     defaultTypeIndex,
                                     function (event) {
            that.json.type = types[this.selectedIndex].value;
            onchange();
        }, "action-subitem"));
        
        // URL
        div.appendChild(makeStringField(_("URL"),
                                        _("The REST URL to this layer on an ArcGIS Server."),
                                        this.json.urls[0] || "",
                                        function (event) {
            that.json.urls[0] = this.value;
        }, true, undefined, "action-subitem"));
        
        // Opacity
        id = "id_" + randID();
        inner_div = c("div", {className: "action-subitem"});
        inner_div.appendChild(c("label", {
            "for": id,
            text: _("Opacity") + ": "
        }));
        input = c("input", {
            id: id,
            type: "number",
            min: 0,
            max: 1,
            step: 0.01,
            value: this.json.opacity,
            required: "required"
        });
        addNumericChangeHandler(input, function (event, value) {
            that.json.opacity = value === null ? 1 : value;
            onchange();
        }, 0, 1);
        inner_div.appendChild(input);
        div.appendChild(inner_div);
        
        // Has Legend
        div.appendChild(makeCheckBox(_("Has Legend"),
                                     _("Whether the ArcGIS Server Map Service has a legend published with it."),
                                     this.json.hasLegend,
                                     function (event) {
            that.json.hasLegend = this.checked;
            onchange();
        }, "action-subitem"));
        
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
        if (!this.json.type || !AUTHOR.JSON_CONTENT.contentTypes.hasOwnProperty(this.json.type)) {
            this.json.type = AUTHOR.JSON_CONTENT.DEFAULT_CONTENT_TYPE;
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
        
        // Make the item list for the content type dropdown
        var items = [], selectedIndex = 0;
        // Make sure default content type is first
        var defaultContentType;
        if (AUTHOR.JSON_CONTENT.DEFAULT_CONTENT_TYPE && AUTHOR.JSON_CONTENT.contentTypes.hasOwnProperty(defaultContentType)) {
            defaultContentType = AUTHOR.JSON_CONTENT.DEFAULT_CONTENT_TYPE;
            items.push({
                label: AUTHOR.JSON_CONTENT.contentTypes[defaultContentType].name,
                value: defaultContentType
            });
        }
        // Make the rest of the content types
        for (var type in AUTHOR.JSON_CONTENT.contentTypes) {
            if (AUTHOR.JSON_CONTENT.contentTypes.hasOwnProperty(type) && type != defaultContentType) {
                items.push({
                    label: AUTHOR.JSON_CONTENT.contentTypes[type].name,
                    value: type
                });
                if (this.json.type == type) selectedIndex = items.length - 1;
            }
        }
        
        // Function to make the editor for the current content type
        function makeEditor() {
            // Clear out the old editor
            editor_div.innerHTML = "";
            
            // Get info on "value" field (which is the only one that we care about here)
            var field = AUTHOR.JSON_CONTENT.contentTypes[that.json.type || defaultContentType].fields[0];
            var name = field[1], type = field[2], value = that.json.value || field[3];
            
            editor_div.appendChild(AUTHOR.JSON_CONTENT.fieldTypes[type].makeEditor(null, name, value, that.json._sergis_author_data, function (property, value) {
                that.json.value = value;
                onchange();
            }));
        }
        // Make the content type dropdown
        bigdiv.appendChild(makeDropDown(this.label, null, items, selectedIndex, function (event) {
            that.json.type = items[this.selectedIndex].value;
            // Clear data
            that.json.value = "";
            that.json._sergis_author_data = {};
            // Update the editor
            makeEditor();
            // Propogate changes to whoever's storing them
            onchange();
        }, undefined, "action-label"));
        
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
            var inner_tr, inner_td, input, id;
            
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
            input = c("input", {
                type: "number",
                step: "any",
                value: that.json[i].latitude || 0,
                required: "required"
            });
            addNumericChangeHandler(input, function (event, value) {
                that.json[i].latitude = value || 0;
                onchange();
            });
            inner_td.appendChild(input);
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
            input = c("input", {
                type: "number",
                step: "any",
                value: that.json[i].longitude || 0,
                required: "required"
            });
            addNumericChangeHandler(input, function (event, value) {
                that.json[i].longitude = value || 0;
                onchange();
            });
            inner_td.appendChild(input);
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
                // It must be a positive integer
                input = c("input", {
                    id: id,
                    type: "number",
                    value: this.json[prop],
                    min: 1,
                    step: 1
                });
                addNumericChangeHandler(input, (function (that, prop) {
                    return function (event, value) {
                        that.json[prop] = value || 1;
                        onchange();
                    };
                })(this, prop), 1);
                td.appendChild(input);
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
                    params.push(new SERGIS_JSON_Content(_("Explanation"), null, data[i]));
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
                            html: AUTHOR.JSON_CONTENT.contentTypes[data[i].type || AUTHOR.JSON_CONTENT.DEFAULT_CONTENT_TYPE].toHTML(data[i])
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
                        params.push(new SERGIS_JSON_Layer(_("Layer"), null, data[i], false,
                                                          _("This can also be used later in the \"hideLayers\" action to hide the layer.")));
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
                            text: data[i].name +
                                  (data[i].group ? " (" + data[i].group + ")" : "") +
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
                        params.push(new SERGIS_JSON_Layer(_("Layer"), _("A map layer that the user can choose to enable while looking at the map."), data[i], true));
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
    
    /**
     * The frontend buttons for a SerGIS Prompt.
     * Property names are the frontends. Values are another array of objects
     * where each object has the following properties:
     *   - "id" (the button's frontend-specific ID),
     *   - "label" (a human-readable name for the button),
     *   - "tooltip" (a tooltip for the button, same as in the client)
     */
    AUTHOR.JSON.frontendButtons = {
        arcgis: [
            {
                id: "drawPoint",
                label: _("Find Lat/Long"),
                tooltip: _("Draw a point on the map and get its latitude and longitude coordinates")
            },
            /*
            {
                id: "drawLine",
                label: _("Measure Distance"),
                tooltip: _("Draw a line on the map and get its distance")
            },
            */
            {
                id: "drawPolyline",
                label: _("Measure Distance"),
                tooltip: _("Draw one or more lines on the map and get the total distance")
            },
            {
                id: "drawPolygon",
                label: _("Measure Area"),
                tooltip: _("Draw a polygon on the map and get its total area")
            },
            {
                id: "findPath",
                label: _("Find Path"),
                tooltip: _("Find the shortest path between 2 points using the currently selected layer.")
            },
            {
                id: "resetMap",
                label: _("Reset Map"),
                tooltip: _("Remove all custom drawings from the map")
            }
        ]
    };
})();
