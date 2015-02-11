/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
 */

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

(function () {
    /**
     * A string for some action's data.
     * @constructor
     */
    function SERGIS_JSON_String(label, defaultValue) {
        this.label = label;
        this.defaultValue = defaultValue || "";
        this.reset();
    }
    
    SERGIS_JSON_String.prototype.reset = function () {
        this.string = this.defaultValue;
    };
    
    SERGIS_JSON_String.prototype.getJSONValue = function () {
        return this.string;
    };
    
    SERGIS_JSON_String.prototype.getElement = function () {
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
        }));
        div.appendChild(span);
        return div;
    };
    
    
    /**
     * A number for some action's data.
     * @constructor
     */
    function SERGIS_JSON_Number(label, defaultValue, min, max, step) {
        this.label = label;
        this.defaultValue = defaultValue || 0;
        this.min = min;
        this.max = max;
        this.step = step;
        this.reset();
    }
    
    SERGIS_JSON_Number.prototype.reset = function () {
        this.number = this.defaultValue;
    };
    
    SERGIS_JSON_Number.prototype.getJSONValue = function () {
        return this.number;
    };
    
    SERGIS_JSON_Number.prototype.getElement = function () {
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
            }
        }));
        return div;
    };
    
    
    /**
     * A selectable value for some action's data. `items` is an array of
     * objects with these properties: label (string), value (any valid JSON).
     * @constructor
     */
    function SERGIS_JSON_Dropdown(label, items, defaultIndex) {
        this.label = label;
        this.items = items;
        this.defaultIndex = defaultIndex;
    }
    
    SERGIS_JSON_Dropdown.prototype.reset = function () {
        this.index = this.defaultIndex;
    };
    
    SERGIS_JSON_Dropdown.prototype.getJSONValue = function () {
        return this.items[this.index].json;
    };
    
    SERGIS_JSON_Dropdown.prototype.getElement = function () {
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
    function SERGIS_JSON_Layer(label, defaultName, defaultGroup, defaultURLs, defaultOpacity) {
        this.label = label;
        this.defaultName = defaultName || "";
        this.defaultGroup = defaultGroup || "";
        this.defaultURLs = defaultURLs || [];
        this.defaultOpacity = typeof defaultOpacity == "number" ? defaultOpacity : 1;
        this.reset();
    }
    
    SERGIS_JSON_Layer.prototype.reset = function () {
        this.json = {
            name: this.defaultName,
            group: this.defaultGroup,
            urls: this.defaultURLs,
            opacity: this.defaultOpacity
        };
    };
    
    SERGIS_JSON_Layer.prototype.getJSONValue = function () {
        return this.json;
    };
    
    SERGIS_JSON_Layer.prototype.getElement = function () {
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
            }],
            [_("Group: "), this.json.group || "", function (event) {
                that.json.group = this.value;
            }],
            [_("URL: "), this.json.urls[0] || "", function (event) {
                that.json.urls[0] = this.value;
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
            }
        }));
        
        return div;
    };
    
    
    /**
     * A SerGIS JSON Content object for some action's data.
     * @constructor
     */
    function SERGIS_JSON_Content(label) {
        this.label = label;
        this.reset();
    }
    
    SERGIS_JSON_Content.prototype.reset = function () {
        this.json = {
            type: "text"
        };
    };
    
    SERGIS_JSON_Content.prototype.getJSONValue = function () {
        return this.json;
    };
    
    SERGIS_JSON_Content.prototype.getElement = function () {
        var that = this,
            div = c("div"),
            id = "id_" + Math.random() + Math.random();
        
        div.appendChild(c("label", {
            "for": id,
            text: this.label + " "
        }));
        var select = c("select", {}, function (event) {
            that.json.type = this.value;
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
        }));
        return div;
    };
    
    
    /**
     * An array of SerGIS_ArcGIS~Point objects for some action's data.
     * @constructor
     */
    function SERGIS_JSON_PointsArray(label) {
        this.label = label;
        this.reset();
    };
    
    SERGIS_JSON_PointsArray.prototype.reset = function () {
        this.json = [];
    };
    
    SERGIS_JSON_PointsArray.prototype.getJSONValue = function () {
        return this.json;
    };
    
    SERGIS_JSON_PointsArray.prototype.getElement = function () {
        var that = this,
            div = c("div"),
            id;
    };
    
    
    // Initialize the rest of AUTHOR_JSON
    
    /**
     * The Gameplay Actions in SerGIS (not frontend-specific).
     * Each property is an array of the "data" params for the action, each
     * represented by a SERGIS_... instance. The last element in the array can
     * be a string whose value is "repeat", which indicates that the last
     * parameter (before "repeat") can be repeated multiple times.
     */
    AUTHOR_JSON.actions = {
        explain: [
            new SERGIS_JSON_Content(_("Explanation")),
            "repeat"
        ],
        "goto": [
            new SERGIS_JSON_Number(_("Prompt Index"))
        ],
        logout: []
    };
    
    /**
     * The Map Actions in SerGIS (frontend-specific).
     * Each property is an object that represents a frontend. The object
     * follows the same format as AUTHOR_JSON.actions.
     */
    AUTHOR_JSON.actionsByFrontend = {
        arcgis: {
            clearGraphics: [],
            showLayers: [
                new SERGIS_JSON_Layer(_("Layer")),
                "repeat"
            ],
            hideLayers: [
                new SERGIS_JSON_String(_("Layer Group")),
                "repeat"
            ],
            draw: [
                new SERGIS_JSON_String(_("Object Name")),
                new SERGIS_JSON_Dropdown(_("Type"), [
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
                ]),
                //new SERGIS_JSON_DrawStyle(_("Style")),
                new SERGIS_JSON_PointsArray(_("Points")),
                "repeat"
            ],
            buffer: [
                new SERGIS_JSON_Number(_("Distance")),
                new SERGIS_JSON_String(_("Distance Unit")),
                new SERGIS_JSON_String(_("Object Name"))
                //new SERGIS_JSON_DrawStyle(_("Style"))
            ]
        }
    };
})();
