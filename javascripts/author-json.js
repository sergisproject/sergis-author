/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

// This file contains all the details about the SerGIS JSON Game Data format.
// Globals: AUTHOR_JSON

var AUTHOR_JSON = {
    /**
     * Reference for the SerGIS JSON Content Object types used by "Edit
     * Content" and "Edit Choices".
     * Each property is an array of the options that that content type takes.
     * Each array item is another array:
     *     [JSON property, display name, type, default value]
     */
    contentTypes: {
        "text": {
            name: _("Text"),
            fields: [
                ["value", _("Text Content:"), "string_multiline"],
                ["centered", _("Center Text"), "boolean", false],
                ["style", _("CSS style:"), "string"]
            ]
        },
        "html": {
            name: _("HTML"),
            fields: [
                ["value", _("HTML Content:"), "string_multiline"],
                ["style", _("CSS style:"), "string"]
            ]
        },
        "image": {
            name: _("Image"),
            fields: [
                ["value", _("URL of Image:"), "string"],
                ["centered", _("Center Image"), "boolean", true],
                ["style", _("CSS style:"), "string"]
            ]
        },
        "youtube": {
            name: _("YouTube Video"),
            fields: [
                ["value", _("YouTube Video ID:"), "string"],
                ["width", _("Video Width:"), "number", 400],
                ["height", _("Video Height:"), "number", 300],
                ["centered", _("Center Video"), "boolean", true],
                ["style", _("CSS style:"), "string"]
                // NOT SUPPORTED: playerVars
            ]
        }
    },
    
    defaultContentType: "text"
    
    /* actions */
    /* actionsByFrontend */
};

////////////////////////////////////////////////////////////////////////////////
// And, the rest is all for defining actions and their data.
(function () {
    /**
     * A string for some action's data.
     * @constructor
     */
    function SERGIS_JSON_String(label, json) {
        this.label = label;
        this.string = typeof json == "string" ? json : "";
    }
    
    SERGIS_JSON_String.prototype.getJSONValue = function () {
        return this.string;
    };
    
    SERGIS_JSON_String.prototype.getElement = function (onchange) {
        var that = this,
            div = c("div", {className: "inputcontainer"}),
            id = "id_" + Math.random() + Math.random();
        
        div.appendChild(c("label", {
            "for": id,
            text: this.label + " "
        }));
        var span = c("span");
        span.appendChild(c("input", {
            id: id,
            value: this.string
        }, function (event) {
            that.string = this.value;
            onchange();
        }));
        div.appendChild(span);
        return div;
    };
    
    
    /**
     * A number for some action's data.
     * @constructor
     */
    function SERGIS_JSON_Number(label, json, min, max, step) {
        this.label = label;
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
        var that = this,
            div = c("div"),
            id = "id_" + Math.random() + Math.random();
        
        div.appendChild(c("label", {
            "for": id,
            text: this.label + " "
        }));
        div.appendChild(c("input", {
            id: id,
            type: "number",
            min: this.min || undefined,
            max: this.max || undefined,
            step: this.step || undefined
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
        return div;
    };
    
    
    /**
     * A selectable value for some action's data. `items` is an array of
     * objects with these properties: label (string), value (any valid JSON).
     * @constructor
     */
    function SERGIS_JSON_Dropdown(label, json, items) {
        this.label = label;
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
        var that = this,
            div = c("div"),
            id = "id_" + Math.random() + Math.random();
        
        div.appendChild(c("label", {
            "for": id,
            text: this.label + " "
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
        return div;
    };
    
    
    /**
     * A SerGIS_ArcGIS~Layer object for some action's data.
     * @constructor
     */
    function SERGIS_JSON_Layer(label, json) {
        this.label = label;
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
        var that = this,
            div = c("div"),
            id, inner_div, inner_span;
        
        inner_div = c("div");
        inner_div.appendChild(c("b", {
            text: this.label + " "
        }));
        div.appendChild(inner_div);
        
        // Each item is an array: [label, value, change event handler]
        var textfields = [
            [_("Name: "), this.json.name || "", function (event) {
                that.json.name = this.value;
                onchange();
            }],
            [_("Group: "), this.json.group || "", function (event) {
                that.json.group = this.value;
                onchange();
            }],
            [_("URL: "), this.json.urls[0] || "", function (event) {
                that.json.urls[0] = this.value;
                onchange();
            }]
        ];
        for (var i = 0; i < textfields.length; i++) {
            id = "id_" + Math.random();
            inner_div = c("div", {className: "inputcontainer"});
            inner_div.appendChild(c("label", {
                "for": id,
                text: textfields[i][0]
            }));
            inner_span = c("span");
            inner_span.appendChild(c("input", {
                id: id,
                value: textfields[i][1]
            }, textfields[i][2]));
            inner_div.appendChild(inner_span);
            div.appendChild(inner_div);
        }
        
        // Opacity
        id = "id_" + Math.random();
        div.appendChild(c("label", {
            "for": id,
            text: _("Opacity: ")
        }));
        div.appendChild(c("input", {
            id: id,
            type: "number",
            min: 0,
            max: 1,
            step: 0.05,
            value: this.json.opacity
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
        
        return div;
    };
    
    
    /**
     * A SerGIS JSON Content object for some action's data.
     * @constructor
     */
    function SERGIS_JSON_Content(label, json) {
        this.label = label;
        this.json = (typeof json == "object" && json) ? json : {};
        if (!this.json.type) this.json.type = "text";
    }
    
    SERGIS_JSON_Content.prototype.getJSONValue = function () {
        return this.json;
    };
    
    SERGIS_JSON_Content.prototype.getElement = function (onchange) {
        var that = this,
            div = c("div"),
            id = "id_" + Math.random() + Math.random();
        
        div.appendChild(c("label", {
            "for": id,
            text: this.label + " "
        }));
        var select = c("select", {}, function (event) {
            that.json.type = this.value;
            onchange();
        });
        // Make sure default content type is first
        var defaultContentType;
        if (AUTHOR_JSON.defaultContentType && AUTHOR_JSON.contentTypes.hasOwnProperty(defaultContentType)) {
            defaultContentType = AUTHOR_JSON.defaultContentType;
            select.appendChild(c("option", {
                value: defaultContentType,
                text: AUTHOR_JSON.contentTypes[defaultContentType].name
            }));
        }
        // Make the rest of the content types
        for (var type in AUTHOR_JSON.contentTypes) {
            if (AUTHOR_JSON.contentTypes.hasOwnProperty(type) && type != defaultContentType) {
                select.appendChild(c("option", {
                    value: type,
                    text: AUTHOR_JSON.contentTypes[type].name
                }));
            }
        }
        div.appendChild(select);
        div.appendChild(document.createTextNode(": "));
        div.appendChild(c("input", {}, function (event) {
            that.json.value = this.value;
            onchange();
        }));
        return div;
    };
    
    
    /**
     * An array of SerGIS_ArcGIS~Point objects for some action's data.
     * @constructor
     */
    function SERGIS_JSON_PointsArray(label, json) {
        this.label = label;
        this.json = (typeof json == "object" && json && json.length) ? json : [];
    }
    
    SERGIS_JSON_PointsArray.prototype.getJSONValue = function () {
        return this.json;
    };
    
    SERGIS_JSON_PointsArray.prototype.getElement = function (onchange) {
        var that = this,
            div = c("div"),
            id;
        
        return div;
    };
    
    
    
    // Initialize the rest of AUTHOR_JSON
    
    /**
     * The Gameplay Actions in SerGIS (not frontend-specific).
     * Each property is a function that will return an array of SERGIS_...
     * instances representing the "data" params for the action. If there is
     * existing data (i.e. we're editing an action instead of creating a new
     * one), that can be passed in as the `data` argument.
     */
    AUTHOR_JSON.actions = {
        explain: function (data) {
            if (!data) data = [];
            // We need at least 1 slot
            if (data.length < 1) data.length = 1;
            
            var params = [];
            
            // They're all SERGIS_JSON_Content objects
            for (var i = 0; i < data.length; i++) {
                params.push(new SERGIS_JSON_Content(_("Explanation"), data[i]));
            }
            
            // We can repeat the last type
            params.push("repeat");
            
            return params;
        },
        
        "goto": function (data) {
            if (!data) data = [];
            // We need one and only one slot
            if (data.length != 1) data.length = 1;
            
            return [new SERGIS_JSON_Number(_("Prompt Index"), data[0])];
        },
        
        logout: function (data) {
            // No parameters to this one
            return [];
        }
    };
    
    /**
     * The Map Actions in SerGIS (frontend-specific).
     * Each property is an object that represents a frontend. The object
     * follows the same format as AUTHOR_JSON.actions.
     */
    AUTHOR_JSON.actionsByFrontend = {
        arcgis: {
            clearGraphics: function (data) {
                // No parameters to this one
                return [];
            },
            
            showLayers: function (data) {
                if (!data) data = [];
                // We need at least one slot
                if (data.length < 1) data.length = 1;
                
                var params = [];
                
                // They're all SERGIS_JSON_Layer objects
                for (var i = 0; i < data.length; i++) {
                    params.push(new SERGIS_JSON_Layer(_("Layer"), data[i]));
                }
                
                // We can repeat the last type
                params.push("repeat");
                
                return params;
            },
            
            hideLayers: function (data) {
                if (!data) data = [];
                // We need at least one slot
                if (data.length < 1) data.length = 1;
                
                var params = [];
                
                // They're all SERGIS_JSON_String objects
                for (var i = 0; i < data.length; i++) {
                    params.push(new SERGIS_JSON_String(_("Layer Group"), data[i]));
                }
                
                // We can repeat the last type
                params.push("repeat");
                
                return params;
            },
            
            draw: function (data) {
                if (!data) data = [];
                // We need at least 4 slots
                if (data.length < 4) data.length = 4;
                
                var params = [];
                
                // Index 0 is a SERGIS_JSON_String
                params.push(new SERGIS_JSON_String(_("Object Name"), data[0]));
                
                // Index 1 is a SERGIS_JSON_Dropdown
                params.push(new SERGIS_JSON_Dropdown(_("Type"), data[1], [
                    {
                        label: _("Point"),
                        value: "point"
                    },
                    {
                        label: _("Line"),
                        value: "line"
                    },
                    {
                        label: _("Polygon"),
                        value: "polygon"
                    }
                ]));
                
                // Index 2 is a SERGIS_JSON_DrawStyle
                params.push(new SERGIS_JSON_String(_("TODO: Style"), data[2]));
                
                // The rest are SERGIS_JSON_PointsArray objects
                for (var i = 3; i < data.length; i++) {
                    params.push(new SERGIS_JSON_PointsArray(_("Points"), data[i]));
                }
                
                // We can repeat the last type
                params.push("repeat");
                
                return params;
            },
            
            buffer: function (data) {
                if (!data) data = [];
                // We need 4 slots
                if (data.length != 4) data.length = 4;
                
                var params = [];
                
                // Index 0 is a SERGIS_JSON_Number
                params.push(new SERGIS_JSON_Number(_("Distance"), data[0]));
                
                // Index 1 is a SERGIS_JSON_Dropdown
                params.push(new SERGIS_JSON_Dropdown(_("Distance Unit"), data[1], [
                    {label: _("Feet"), value: "foot"},
                    {label: _("Kilometers"), value: "kilometer"},
                    {label: _("Meters"), value: "meter"},
                    {label: _("Statute Miles"), value: "statute_mile"},
                    {label: _("Nautical Miles"), value: "nautical_mile"},
                    {label: _("US Nautical Miles"), value: "us_nautical_mile"}
                ]));
                
                // Index 2 is a SERGIS_JSON_String
                params.push(new SERGIS_JSON_String(_("Object Name"), data[2]));
                
                // Index 3 is a SERGIS_JSON_DrawStyle
                params.push(new SERGIS_JSON_String(_("TODO: Style"), data[3]));
                
                return params;
            }
        }
    };
})();
