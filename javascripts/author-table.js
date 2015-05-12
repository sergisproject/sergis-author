/*
    The SerGIS Project - sergis-author

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.
*/

// This file handles the drawing of the main table.

AUTHOR.TABLE = {
    /* generateTable */
    /* setCurrentPrompt */
    /* setExpandAllPrompts */
};

(function () {
    /**
     * The current promptIndex that we have "open" (if expandAllPrompts==false).
     */
    var currentPromptIndex = null;
    
    /**
     * Whether all prompts should be expanded.
     */
    var expandAllPrompts = false;
    
    /**
     * Whether it's our first time auto-scrolling to the prompt we're at (in
     * which case, we don't want to scroll, because the user just opened the
     * Author).
     */
    var firstTimeScrolling = true;
    
    /**
     * The columns of the table.
     * Each column has a title string and a generator function.
     * The generator function is passed 2 arguments:
     * (1) the prompt index, and (2) `game.jsondata.promptList[promptIndex]`.
     * The generator function should return either one td element or an array
     * of td elements.
     */
    var TABLE_COLUMNS = [
        {
            title: "",
            generator: AUTHOR.TABLE_COLUMNS.generateTitleColumn
        },
        {
            title: _("Map"),
            generator: AUTHOR.TABLE_COLUMNS.generateMapColumn
        },
        {
            title: _("Content"),
            generator: AUTHOR.TABLE_COLUMNS.generateContentColumn
        },
        {
            title: _("Choices"),
            generator: AUTHOR.TABLE_COLUMNS.generateChoicesColumn
        },
        {
            title: _("Actions"),
            generator: AUTHOR.TABLE_COLUMNS.generateActionsColumn
        }
    ];
    
    /**
     * Set whether all prompts should be expanded.
     */
    AUTHOR.TABLE.setExpandAllPrompts = function (yesorno) {
        expandAllPrompts = yesorno;
        currentPromptIndex = null;
        checkCurrentPrompt();
    };
    
    /**
     * Set the current prompt.
     */
    AUTHOR.TABLE.setCurrentPrompt = function (promptIndex) {
        currentPromptIndex = promptIndex;
        // Re-draw the table
        AUTHOR.TABLE.generateTable();
    };
    
    /**
     * Update the table based on currentPrompt and/or expandAllRows, then make
     * sure scrolling is all set up well.
     */
    function checkCurrentPrompt() {
        var expandAllPromptsHere = game.jsondata.promptList.length <= 1 ? true : expandAllPrompts;
        forClass("prompt-row-minimal", function (elem) {
            var isCurrentPromptIndex = currentPromptIndex !== null && elem.getAttribute("data-promptIndex") == currentPromptIndex.toString();
            if (expandAllPromptsHere || isCurrentPromptIndex) {
                // The prompt is expanded, so hide the minimal row
                elem.className += " prompt-row-hidden";
            } else {
                // The prompt is minimized, so show the minimal row
                elem.className = removeFromString(elem.className, "prompt-row-hidden");
            }
        });
        var finalElem;
        forClass("prompt-row-full", function (elem) {
            var isCurrentPromptIndex = currentPromptIndex !== null && elem.getAttribute("data-promptIndex") == currentPromptIndex.toString();
            if (expandAllPromptsHere || isCurrentPromptIndex) {
                // The prompt is expanded, so show the full row
                elem.className = removeFromString(elem.className, "prompt-row-hidden");
                // Is it the current prompt index?
                if (elem.className.indexOf("toprow") != -1 && isCurrentPromptIndex) {
                    finalElem = elem;
                }
            } else {
                // The prompt is minimized, so hide the full row
                elem.className += " prompt-row-hidden";
            }
        });
        
        // Check scrolling
        checkScroll();
        
        // Scroll the current prompt into view, if applicable
        if (finalElem) {
            if (firstTimeScrolling) {
                firstTimeScrolling = false;
            } else {
                setTimeout(function () {
                    var bodyRect = document.body.getBoundingClientRect(),
                        elemRect = finalElem.getBoundingClientRect(),
                        offset   = elemRect.top - bodyRect.top;
                    window.scrollTo(0, offset - 60);
                }, 2);
            }
        }
    }
    
    
    /**
     * Make the prompt table.
     *
     * @param {number} [newCurrentPromptIndex] - A new current prompt index.
     * @param {number} [scrollToPromptIndex] - A prompt index to scroll to.
     */
    AUTHOR.TABLE.generateTable = function (newCurrentPromptIndex) {
        // Get rid of the old table
        byId("promptContainer").innerHTML = "";
        
        // Create the new table and the table header with all the column titles
        var table = create("table").create("thead").create("tr", /*Children:*/ TABLE_COLUMNS.map(function (column) {
            return create("th", {
                text: column.title
            });
        }));
        
        // Make the table body
        var tbody = create("tbody");
        
        // Generate table row(s) for each prompt
        game.jsondata.promptList.forEach(function (promptItem, promptIndex) {
            // First, make the minimal row
            tbody.appendChild(AUTHOR.TABLE_COLUMNS.generateMinimalRow(promptIndex, promptItem));
            
            // 2D array: first dimension is rows, second dimension is columns (td elements)
            // This allows for some columns that require multple rows for a prompt
            // (that are still part of this one "row", i.e. prompt)
            var rows = [[]];
            // Generate each table column for this row
            TABLE_COLUMNS.forEach(function (column, column_index) {
                var tds = column.generator(promptIndex, promptItem);
                if (!Array.isArray(tds)) {
                    // It's just one column, so put it in the first row
                    rows[0].push(tds);
                } else {
                    // This column spans multiple rows
                    tds.forEach(function (td, row_index) {
                        // Make the new row if it doesn't exist
                        if (!rows[row_index]) {
                            rows[row_index] = [];
                            // Fill in empty space in the row up to this column
                            // (Fill it in with `null`s so we can recognize it later)
                            for (var i = 0; i < column_index; i++) {
                                rows[row_index].push(null);
                            }
                        }
                        // Add our column to the row
                        rows[row_index].push(td);
                    });
                }
            });
            
            // Add the row(s) to the table
            rows.forEach(function (row, row_index) {
                var tds = [];
                row.forEach(function (td, column_index) {
                    if (td) {
                        // See how many rows after this one in this column are null
                        // For any of those, we must "rowspan" over them
                        var rowspan = 1, rowi = row_index;
                        while (++rowi < rows.length && rows[rowi][column_index] === null) {
                            rowspan++;
                        }
                        // Set the rowspan on our td and add it to the list
                        td.setAttribute("rowspan", "" + rowspan);
                        tds.push(td);
                    }
                });
                // Add this row to the table
                tbody.appendChild(create("tr", {
                    className: "prompt-row-full "  + (row_index === 0 ? "toprow" : "prompt-row-hidden"),
                    "data-promptIndex": promptIndex
                }, tds));
            });
        });
        
        // Make spacer row (based on # of columns, i.e. # of titles)
        tbody.appendChild(create("tr", /*Children:*/ TABLE_COLUMNS.map(function (column) {
            // Make a spacer column for this column
            return create("td", {
                text: " ",
                className: "prompt-container-header-cell-spacer"
            });
        })));
        
        // Stick it all in there
        table.appendChild(tbody);
        byId("promptContainer").appendChild(table);
        
        if (typeof newCurrentPromptIndex == "number") {
            // Select a new current prompt
            currentPromptIndex = newCurrentPromptIndex;
        }
        // Make sure current prompt is selected and scrolling is good
        checkCurrentPrompt();
    };
    
    
    
    /** Whether the browser supports "window.pageXOffset" (for checkScroll). */
    var supportPageOffset = window.pageXOffset !== undefined;
    /** Whether the browser's in "Standards Mode" (opposed to "Quirks Mode"). */
    var isCSS1Compat = ((document.compatMode || "") === "CSS1Compat");
    
    /** Helper function to set the proper width on the table columns. */
    function setHeaderWidths(tbl, thead, auto) {
        // Make sure the header cells stay the same width
        thead.style.width = auto ? "auto" : thead.offsetWidth + "px";
        var kids = tbl.getElementsByTagName("th");
        var kidSpacers = tbl.getElementsByClassName("prompt-container-header-cell-spacer");
        for (var j = 0; j < kids.length; j++) {
            kidSpacers[j].style.minWidth = kids[j].style.width = auto ? "auto" : kids[j].offsetWidth + "px";
        }
    }
    
    /**
     * Check the scrolling and set up the table header accordingly.
     */
    function checkScroll() {
        var tbl = byId("promptContainer").childNodes[0];
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
            var scrollY = supportPageOffset ? window.pageYOffset :
                isCSS1Compat ? document.documentElement.scrollTop : document.body.scrollTop;
            
            // Find out how far the table is from the top of the page
            var elem = tbl;
            var offsetY = elem.offsetTop;
            while ((elem = elem.offsetParent)) {
                offsetY += elem.offsetTop || 0;
            }
            
            // Reset any and all spacing
            tbl.className = removeFromString(tbl.className, "scrollFixed");
            setHeaderWidths(tbl, thead, true);
            
            // Check if we should be .scrollFixed
            if (scrollY >= offsetY) {
                setHeaderWidths(tbl, thead);
                // And, we should be .scrollFixed; let's add the class
                tbl.className += " scrollFixed";
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
