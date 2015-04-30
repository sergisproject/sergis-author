/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

// Globals: randInt, randID, byId, byClass, forClass, makeNumberHandler,
// create, parseOptionalArgs

/** Make a quick and dirty random integer with `d` digits. */
function randInt(d) {
    return Math.floor((Math.random() * 9 + 1) * Math.pow(10, d-1));
}

/** Make a unique random ID. */
function randID() {
    return Number(randInt(10) + "" + (new Date()).getTime() + "" + randInt(10)).toString(36);
}

/** Shortcut for getElementById. */
function byId(id) {
    return document.getElementById(id);
}

/** Shortcut for getElementsByClassName. */
function byClass(className, container) {
    return (container || document).getElementsByClassName(className);
}

/**
 * Loop over all the elements of a certain className.
 *
 * @param {string} className - The class of the elements.
 * @param {Function} callback - A function to execute for each element.
 * @param [thisArg] - Value to use as `this` when executing `callback`.
 */
function forClass(className, callback, thisArg) {
    Array.prototype.forEach.call(byClass(className), callback, thisArg);
}

/**
 * Make a "change" event handler for a "number" input element that only calls
 * another handler after some basic numeric validation has been performed.
 *
 * @param {Array.<number>} [range] - The optional minimum and maximum numeric
 *        values, specified as an array: [min, max]
 * @param {Function} handler - The onchange handler. Called with `event` (the
 *        DOM event object) and `value` (the numeric value, or `null` if the
 *        input element is empty). This function is not called if the user
 *        entered something that is not numeric.
 */
function makeNumberHandler(range, handler) {
    var min = -Infinity, max = Infinity;
    if (typeof range == "function") {
        // It's actually the handler
        handler = range;
    } else if (range && Array.isArray(range)) {
        if (typeof range[0] == "number") min = range[0];
        if (typeof range[1] == "number") max = range[1];
    }
    
    return function (event) {
        this.style.border = "";
        var value = this.value;
        if (typeof value.trim == "function") {
            value = value.trim();
        }
        if (typeof this.checkValidity == "function") {
            if (this.checkValidity() === false) {
                this.style.border = "1px solid red";
                return;
            }
        }
        
        if (!value) {
            handler(event, null);
        } else {
            var num = Number(value);
            if (isNaN(num) || num < min || num > max) {
                this.style.border = "1px solid red";
            } else {
                handler(event, num);
            }
        }
    };
}

/**
 * Create a new DOM element. Can be chained to add children, like so:
 *   var new_ul = create("ul").create("li", {className: "item"})
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
 * @param {Object.<string, string>} [attributes] - Any DOM attributes for the
 *        element. Also can include some special properties:
 *        "class" or "className" --> CSS class(es) for the element,
 *        "text" or "textContent" --> Text content for the element,
 *        "html" or "innerHTML" --> HTML content for the element
 * @param {Array.<Element>} [children] - Any children to append to the element.
 *        NOTE: You can also use chaining (see above) to add children.
 * @param {Function} [handler] - A function to call when there is either a
 *        "change" event on the element (in the case of <input>, <select>, and
 *        <textarea>) or a "click" event (in any other case).
 * @param {...*} [parameter] - A parameter to pass to `event` when calling it
 *        (after the first parameter, which is always the DOM `event` object).
 *
 * @return {Element} The newly created DOM element.
 */
function create(elem /*, [attributes], [children], [handler, [parameter, [parameter, [...]]]] */) {
    var NEEDS_ONCHANGE = ["input", "select", "textarea"];
    
    function isAttributesArg(arg) {
        return arg && typeof arg == "object" && !Array.isArray(arg);
    }
    function isChildrenArg(arg) {
        return arg && Array.isArray(arg);
    }
    function isHandlerArg(arg) {
        return arg && typeof arg == "function";
    }
    
    var args = parseOptionalArgs(arguments, [isAttributesArg, isChildrenArg, isHandlerArg], 1);
    var attributes = args.shift(),
        children = args.shift(),
        handler = args.shift();
    
    // Make the element
    elem = document.createElement(elem);
    
    // Apply any attributes
    if (attributes) {
        for (var prop in attributes) {
            if (attributes.hasOwnProperty(prop) && typeof attributes[prop] != "undefined") {
                if (prop == "class" || prop == "className") {
                    elem.className = attributes[prop];
                } else if (prop == "textContent" || prop == "text") {
                    ("" + attributes[prop]).split("\n").forEach(function (line, index) {
                        if (index > 0) {
                            elem.appendChild(document.createElement("br"));
                        }
                        elem.appendChild(document.createTextNode(line));
                    });
                } else if (prop == "html" || prop == "innerHTML") {
                    elem.innerHTML = attributes[prop];
                } else {
                    elem.setAttribute(prop, "" + attributes[prop]);
                }
            }
        }
    }
    
    // Append any children
    if (children) {
        children.forEach(function (child) {
            if (child) elem.appendChild(child);
        });
    }
    
    // Apply event handler
    if (handler) {
        // If children 
        var eventName = NEEDS_ONCHANGE.indexOf(elem.nodeName.toLowerCase()) == -1 ? "click" : "change";
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
        parent.create = create.bind(elem);

        // Append the new element to the parent
        this.appendChild(elem);

        // Return the top-level parent
        return parent;
    } else {
        // Apply our special properties
        elem._AUTHOR_PARENT = elem;
        elem.create = create.bind(elem);

        // Return the created element
        return elem;
    }
}

/**
 * Parse from optional arguments, based on "signatures" that represent any of
 * the arguments.
 *
 * @param {Object|Array} args - The arguments to the function.
 * @param {Array.<Function>} sigs - The signatures for each of the arguments
 *        (each is passed a possible argument and should return `true` if the
 *        argument is the proper type for that position).
 * @param {number} [start=0] - Where to start looking for arguments. If this is
 *        greater than 0, then arguments below this index will not be included
 *        in the processing or the returned array.
 *
 * @return {Array} The arguments, with "undefined"s filled in for missing
 *         optional arguments.
 */
function parseOptionalArgs(args, sigs, start) {
    var newArgs = [];
    args = Array.prototype.slice.call(args, start || 0);
    
    // Go through each argument that we're expecting
    sigs.forEach(function (sig) {
        if (args[0] === null || args[0] === undefined) {
            // The user put in a placeholder
            args.shift();
            newArgs.push(undefined);
        } else {
            newArgs.push(sig(args[0]) ? args.shift() : undefined);
        }
    });
    return newArgs.concat(args);
}
