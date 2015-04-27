# SerGIS Prompt Author

The SerGIS Prompt Author is a web-based program to create [SerGIS JSON Game Data files](http://sergisproject.github.io/docs/json.html) for [the SerGIS Project](http://sergisproject.github.io/).

Current version: 1.0

## Using SerGIS Prompt Author

The SerGIS Prompt Author is hosted at this URL: http://sergisproject.github.io/sergis-author/

Alternatively, you can clone this repository and open `index.html`.

## TODO

Action Editor:

- Ability to delete action parts that we added using "Add More..."
- When creating a buffer action, make sure that the "objectName" that we're buffering has been created!
  - If it hasn't, then the SerGIS Client spews up a "Error: Invalid objectName!" alert
- When drawing on the map, make sure that the "objectName" is unique!
- When showing layers, make sure that the layer name is unique
- When hiding layers, make sure that the layer group exists
- For either thing involving layers, MAKE SURE that the user provides... 1) a name, and 2) a REST URL
  (otherwise, the SerGIS Client will fail silently)


Other:

- Tutorial and help to show basic usage
- Click/dblclick on content/actions/whatever to edit them
- YouTube: take entire URL rather than video ID
- Replace "Prompt Index" with just "Prompt", which consists of a 1-based prompt number and its title.
- Make `overlay()` (i.e. no parameters to overlay) revert to the last open overlay, instead of none (unless it was previously none).
  - Maybe add parameter to force none, or vice versa, i.e. if we just pass `true`, then go back to the previous prompt.
- With socket to server, when someone sends in a saveGame, see if that game is open anywhere else and send them an update (if multiple people are working on the game at once).
- Support `buttons` in JSON

New Stuff:

- Remove "goto" from the actions that you can do, and add a new dropdown under each choice called "Next Prompt" (which includes an option "end game", that could just add a "endGame" action instead of a "goto" action).
- Add support for conditional `goto`s
  - Have a function in the author to convert a string like `(varName >= 10 && var2 is empty) or var3 equals 0 || (varName is 12 and var5 is less than 18)` into a tree of SerGIS JSON Condition objects
- Checkbox above latitude/longitude/zoom labeled something like "Same as previous prompt", which results in no value being set for `prompt.map` (so sergis-client just uses the value(s) from the previous prompt).
- Add ability to show/hide the map on a per-prompt basis (will also require something new in the JSON Game Data format, and sergis-client)
- Add ability to buffer geodata in layers
- Ability to "sketch" a feature on a map (i.e. if we want to draw something; instead of entering points, allow drawing it on a map)
- Support new frontendInfo stuff ("basemap" array, "layers" stuff, etc.) and new removeLayers action

New "Graph View":

- An alternative to the current "table view"
- Prompts are shown as a directed "graph", where the nodes are the prompts (each is shown with its title and basic content, and the choices)
- Each prompt choice is connected via an arrow to another prompt, indicating where it goes to next
- Make generic function to generate the full table row(s) for a prompt, so we can use it in "table view", and also put it in an overlay to edit prompt details when in "graph view"
  - We would need a param for whether to include the "Next Prompt" select dropdown (in table view)
- Ways to implement the actual view of the graph:
  - d3js:
    - http://d3js.org/
    - http://bl.ocks.org/rkirsling/5001347
  - http://sigmajs.org/
  - 

## License

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.

For more, see `LICENSE.txt` and `CONTRIBUTORS.txt`.
