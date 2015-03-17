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
     *
     * Each `fields` property is an array of the options that that content type
     * takes. Each array item is another array:
     *     [JSON property, display name, type, default value]
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
                ["value", _("URL of Image:"), "string"],
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
// And, the rest is all for defining the remaining properties of AUTHOR_JSON.
(function () {
    /*
    What follows here is a lot of constructors for SERGIS_JSON_... objects.
    These represent data fields for actions and frontend info.
    The usage of these constructors and classes can be seen below, where
    "AUTHOR_JSON.actions", "AUTHOR_JSON.actionsByFrontend", and
    "AUTHOR_JSON.frontendInfo" are defined.
    */
    
    
    /**
     * A string for some action's data.
     * @constructor
     */
    function SERGIS_JSON_String(label, description, json) {
        this.label = label;
        this.description = description;
        this.string = typeof json == "string" ? json : "";
    }
    
    SERGIS_JSON_String.prototype.getJSONValue = function () {
        return this.string;
    };
    
    SERGIS_JSON_String.prototype.getElement = function (onchange) {
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
            value: this.string
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
            value: this.number
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
        
        // Each item is an array: [label, description, value, change event handler]
        var textfields = [
            [_("Name"), _("The name of the layer (must be unique)."), this.json.name || "", function (event) {
                that.json.name = this.value;
                onchange();
            }],
            [_("Group (optional)"), _("A group name that this layer is part of (used in the \"hideLayers\" action)."), this.json.group || "", function (event) {
                that.json.group = this.value;
                onchange();
            }],
            [_("URL"), _("The URL to this layer on an ArcGIS Server."), this.json.urls[0] || "", function (event) {
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
                value: textfields[i][2]
            }, textfields[i][3]));
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
        if (!this.json.type) this.json.type = AUTHOR_JSON.defaultContentType;
        if (typeof this.json.value != "string") this.json.value = "";
    }
    
    SERGIS_JSON_Content.prototype.getJSONValue = function () {
        return this.json;
    };
    
    SERGIS_JSON_Content.prototype.getElement = function (onchange) {
        var that = this,
            bigdiv = c("div", {className: "action-item"}),
            div = c("div", {
                className: "inputcontainer"
            });
        
        div.appendChild(c("label", {
            text: this.label + ": ",
            className: "action-label"
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
                text: AUTHOR_JSON.contentTypes[defaultContentType].name,
                selected: this.json.type == defaultContentType ? "selected" : undefined
            }));
        }
        // Make the rest of the content types
        for (var type in AUTHOR_JSON.contentTypes) {
            if (AUTHOR_JSON.contentTypes.hasOwnProperty(type) && type != defaultContentType) {
                select.appendChild(c("option", {
                    value: type,
                    text: AUTHOR_JSON.contentTypes[type].name,
                    selected: this.json.type == type ? "selected" : undefined
                }));
            }
        }
        
        var span = c("span", {
            className: "label"
        });
        span.appendChild(select);
        span.appendChild(document.createTextNode(": "));
        div.appendChild(span);
        
        span = c("span");
        span.appendChild(c("input", {
            value: this.json.value || undefined
        }, function (event) {
            that.json.value = this.value;
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
        return this.json;
    };
    
    SERGIS_JSON_PointsArray.prototype.getElement = function (onchange) {
        var that = this,
            div = c("div", {className: "action-item"}),
            id;
        
        if (this.description) {
            div.appendChild(c("div", {
                className: "action-description",
                text: this.description
            }));
        }
        
        return div;
    };
    
    
    
    // Initialize the rest of AUTHOR_JSON
    
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
    AUTHOR_JSON.actions = {
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
                            html: AUTHOR_JSON.contentTypes[data[i].type || AUTHOR_JSON.defaultContentType].toHTML(data[i])
                        }));
                    }
                }
                return span.innerHTML;
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
        },
        
        logout: {
            name: _("Log Out"),
            description: _("End the user's game session and log them out."),
            
            getFields: function (data) {
                // No parameters to this one
                return [];
            },
            
            toHTML: function (data) {
                return c("span", {
                    text: this.name
                }).innerHTML;
            }
        }
    };
    
    /**
     * Human-readable names for the frontends.
     */
    AUTHOR_JSON.frontendNames = {
        arcgis: "ArcGIS"
    };
    
    /**
     * The Map Actions in SerGIS (frontend-specific).
     * Each property is an object that represents a frontend. The object
     * follows the same format as AUTHOR_JSON.actions.
     */
    AUTHOR_JSON.actionsByFrontend = {
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
                        params.push(new SERGIS_JSON_String(_("Layer Group"), _("The \"group\" name of the layer(s) to hide, specified in the \"Group\" attribute of the layers (in a previous \"showLayers\" action)."), data[i]));
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
                    params.push(new SERGIS_JSON_String(_("Object Name"), _("A unique name for the object being drawn."), data[0]));

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
                    params.push(new SERGIS_JSON_String(_("TODO: Style"), _("The style of the visual representation of the object on the map."), data[2]));

                    // The rest are SERGIS_JSON_PointsArray objects
                    for (var i = 3; i < data.length; i++) {
                        params.push(new SERGIS_JSON_PointsArray(_("Points"), _("The points that make up the object to draw. If multiple sets of points are created, then multiple objects are drawn."), data[i]));
                    }

                    // We can repeat the last type
                    params.push("repeat");

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
                    params.push(new SERGIS_JSON_String(_("Object Name"), _("An object name (corresponding to an object previously created using the \"draw\" action) to buffer."), data[2]));

                    // Index 3 is a SERGIS_JSON_DrawStyle
                    params.push(new SERGIS_JSON_String(_("TODO: Style"), _("The style of the visual representation of the buffer on the map."), data[3]));

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
    AUTHOR_JSON.frontendInfo = {
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
                    
                }
            }
        }
    };
})();
