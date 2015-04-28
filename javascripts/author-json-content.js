/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

// This file contains all the details about the content types for the SerGIS
// JSON Game Data format.

// Globals: AUTHOR_JSON_MAX_FILE_SIZE, AUTHOR_JSON_MAX_FILE_SIZE_HUMAN_READABLE

// Max file size, in bytes
var AUTHOR_JSON_MAX_FILE_SIZE = 1024 * 1024; // 1 MB
var AUTHOR_JSON_MAX_FILE_SIZE_HUMAN_READABLE = "1 MB";

AUTHOR.JSON_CONTENT = {
    DEFAULT_CONTENT_TYPE: "text",
    
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
                    input,
                    id = "id_" + randID();
                p.appendChild(c("label", {
                    "for": id,
                    text: name + " "
                }));
                input = c("input", {
                    id: id,
                    type: "number",
                    value: value.toString()
                });
                addNumericChangeHandler(input, function (event, value) {
                    onchange(property, value || 0);
                });
                p.appendChild(input);
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
        
        // String type for YouTube URL or ID (textbox)
        string_youtube: {
            makeEditor: function (property, name, value, data, onchange) {
                var descrip = _("Enter either a video ID or a video URL. If you enter a video URL, it will be converted to a video ID.");
                
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
                    text: name + " ",
                    title: descrip
                }));
                var inner_container = c("span");
                inner_container.appendChild(c("input", {
                    id: id,
                    value: value,
                    title: descrip
                }, function (event) {
                    var value = this.value;
                    if (value) {
                        // Check for URL
                        var urlRegex = /^(?:https?:\/\/)?[a-z]*\.?youtube\.[a-z]+\/watch\?(.*)/i.exec(value);
                        if (urlRegex !== null) {
                            var search = (urlRegex[1] || "").split("&");
                            for (var i = 0; i < search.length; i++) {
                                if (search[i].substring(0, 2) == "v=") {
                                    // Found it!
                                    value = decodeURIComponent(search[i].substring(2));
                                    break;
                                }
                            }
                        }
                    }
                    // Set & propogate any changes
                    this.value = value;
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
                ["value", _("YouTube Video URL or ID:"), "string_youtube"],
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
    }
};
