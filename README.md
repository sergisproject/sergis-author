# SerGIS Prompt Author

The SerGIS Prompt Author is a web-based program to create [SerGIS JSON Game Data files](http://sergisproject.github.io/docs/json.html) for [the SerGIS Project](http://sergisproject.github.io/).

Current version: 0.9

## Using SerGIS Prompt Author

The SerGIS Prompt Author is hosted at this URL: http://sergisproject.github.io/sergis-author/

Alternatively, you can clone this repository and open `index.html`.

## TODO

Action Editor:

- `SERGIS_JSON_PointsArray` in javascripts/author-json.js

- `SERGIS_JSON_Style` in javascripts/author-json.js

- Issue with "Add More..." for actions and then not being able to delete them
  (Also, we need to find actions that are still "null" and get rid of them)
  - "Adding more for add action doesn't work if I hit add after already entering one"

- Make sure that required fields for an action are filled out

- When creating a buffer action, make sure that the "objectName" that we're buffering has been created!
  - If it hasn't, then the SerGIS Client spews up a "Error: Invalid objectName!" alert


Other:

- SerGIS Client: if title for a prompt spans multiple lines, weird things happen
- Tutorial and help to show basic usage
- Click/dblclick on content/actions/whatever to edit them
- Ability to insert images from local computer (store them in JSON as data: URIs)
- YouTube: take entire URL rather than video ID
- Force text/content inputs to store a blank value instead of nothing for the "value" for the content
  (otherwise the client stringifies the object and shows that instead).

## License

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.

For more, see `LICENSE.txt` and `CONTRIBUTORS.txt`.
