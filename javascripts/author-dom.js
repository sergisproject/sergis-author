/*
    The SerGIS Project - sergis-author

    Copyright (c) 2014, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

var AUTHOR = AUTHOR || {};
AUTHOR.DOM = AUTHOR.DOM || {};

(function () {
    /** Shortcut for document.getElementById(...) */
    AUTHOR.DOM.byId = function (id) {
        return document.getElementById(id);
    };
    
    /** Shortcut for document.getElementsByClassName(,,,) */
    AUTHOR.DOM.byClass = function (className) {
        return document.getElementsByClassName(className);
    };
    
    /**
     * Loop over all the elements of a certain className.
     *
     * @param {string} className - The class of the elements.
     * @param {Function} callback - A function to execute for each element.
     * @param [thisArg] - Value to use as `this` when executing `callback`.
     */
    AUTHOR.DOM.forClass = function (className, callback, thisArg) {
        Array.prototype.forEach.call(AUTHOR.DOM.byClass(className), callback, thisArg);
    };
    
    /** Shortcut for document.getElementsByTagName(...) */
    AUTHOR.DOM.byTag = function (tagName) {
        return document.getElementsByTagName(tagName);
    };
    
    /**
     * Loop over all the elements of a certain tagName.
     *
     * @param {string} tagName - The tag of the elements.
     * @param {Function} callback - A function to execute for each element.
     * @param [thisArg] - Value to use as `this` when executing `callback`.
     */
    AUTHOR.DOM.forTag = function (tagName, callback, thisArg) {
        Array.prototype.forEach.call(AUTHOR.DOM.byTag(tagName), callback, thisArg);
    };
    
    /**
     * Create a new DOM element. Can be chained to add children, like so:
     *   var new_ul = AUTHOR.DOM.create("ul").create("li", {className: "item"})
     *       .create("a", null, handleOnClick).create("span", {text: "Hello"});
     *
     * NOTE: When chaining, each function in the chain returns a reference to
     * the topmost element (the first one created). Calling `create` at any
     * level in the chain will append at the end of the chain. The chaining
     * mechanism is meant to ease the creation of strictly linear DOM trees; it
     * is not meant for the creation of more complex trees. For this case, use
     * traditional DOM methods for creating the tree.
     *
     * @param {string} elem - The tag name of the element to create.
     * @param {Object.<string, string>} [attributes] - Any DOM attributes for
     *        the element. Also can include some special properties:
     *        "class" or "className" --> CSS class(es) for the element,
     *        "text" or "textContent" --> Text content for the element
     * @param {Function} [handler] - A function to call when there is either a
     *        "change" event on the element (in the case of <input>, <select>,
     *        and <textarea>) or a "click" event (in any other case).
     * @param {...*} [parameter] - Any parameters to pass to `handler` when
     *        calling it (after the first parameter, which is always the DOM
     *        `event` object).
     *
     * @return {Element} The newly created DOM element.
     */
    AUTHOR.DOM.create = function (elem, attributes, handler /*, [parameter, [parameter, [...]]] */) {
        var NEEDS_ONCHANGE = ["input", "select", "textarea"];
        
        // Make the element
        elem = document.createElement(elem);
        
        // Apply any attributes
        if (attributes) {
            for (var prop in attributes) {
                if (attributes.hasOwnProperty(prop) && typeof attributes[prop] != "undefined") {
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
        
        // Apply event handler
        if (handler) {
            var args = Array.prototype.slice.call(arguments, 3),
                eventName = NEEDS_ONCHANGE.indexOf(elem.nodeName.toLowerCase()) == -1 ? "click" : "change";
            elem.addEventListener(eventName, function (event) {
                handler.apply(this, [event].concat(args));
            }, false);
        }
        
        // See if it's chained
        if (this && this._AUTHOR_PARENT) {
            // `elem` is the element we're inserting
            // `this` is the parent right above, that we're appending `elem` to
            // `parent` is the top-level parent (could be the same as `this`)
            var parent = this._AUTHOR_PARENT;
            
            // Apply our special properties
            elem._AUTHOR_PARENT = parent;
            parent.create = AUTHOR.DOM.create.bind(elem);
            
            // Append the new element to the parent
            this.appendChild(elem);
            
            // Return the overall parent
            return parent;
        } else {
            // Apply our special properties
            elem._AUTHOR_PARENT = elem;
            elem.create = AUTHOR.DOM.create.bind(elem);
            
            // Return the created element
            return elem;
        }
    };
    
    /**
     * Create a row with a label and an input.
     *
     * @param {string} labelText - The text for the input label.
     * @param {Object.<string, string>} [inputAttributes] - The attributes for
     *        the input (see the "attributes" parameter for AUTHOR.DOM.create).
     * @param {Function} [onchange] - A function to call for the "change" event
     *        on the input tag.
     * @param {boolean} [returnTableRow] - Whether to return everything in a
     *        2-column "tr" element (instead of just a "div").
     *
     * @return {Element} The newly created "tr" or "div".
     */
    AUTHOR.DOM.createInput = function (labelText, inputAttributes, onchange, returnTableRow) {
        var container, inputcontainer, id = inputAttributes.id;
        if (!id || document.getElementById(id)) {
            do {
                id = "input-checkbox-" + Math.random();
            } while (document.getElementById(id));
        }
        inputAttributes.id = id;
        
        if (returnTableRow) {
            container = AUTHOR.DOM.create("tr").create("td").create("label", {
                text: labelText,
                "for": id
            });
            container.appendChild(inputcontainer = AUTHOR.DOM.create("td"));
        } else {
            container = AUTHOR.DOM.create("div", {
                className: "inputcontainer"
            }).create("label", {
                text: labelText,
                "for": id
            });
            container.appendChild(inputcontainer = AUTHOR.DOM.create("span"));
        }
        
        inputcontainer.appendChild(AUTHOR.DOM.create("input", inputAttributes, onchange));
        return container;
    };
    
    /**
     * Create a row with a checkbox and a label.
     *
     * @param {string} labelText - The text for the checkbox label.
     * @param {boolean} [checked] - Whether the checkbox is checked by default.
     * @param {Function} [onchange] - A function to call for the "change" event
     *        on the checkbox.
     * @param {boolean} [returnTableRow] - Whether to return everything in a
     *        2-column "tr" element (instead of just a "div").
     *
     * @return {Element} The newly created "tr" or "div".
     */
    AUTHOR.DOM.createCheckbox = function (labelText, checked, onchange, returnTableRow) {
        var container, inputcontainer, id;
        do {
            id = "input-checkbox-" + Math.random();
        } while (document.getElementById(id));
        
        if (returnTableRow) {
            container = AUTHOR.DOM.create("tr");
            container.appendChild(inputcontainer = AUTHOR.DOM.create("td", {colspan: "2"}));
        } else {
            container = inputcontainer = AUTHOR.DOM.create("div");
        }
        
        inputcontainer.appendChild(AUTHOR.DOM.create("input", {
            type: "checkbox",
            id: id,
            checked: checked ? "checked" : undefined
        }, onchange));
        inputcontainer.appendChild(AUTHOR.DOM.create("label", {
            text: " " + labelText,
            "for": id
        }));
        return container;
    };
})();
