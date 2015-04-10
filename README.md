# SerGIS Prompt Author

The SerGIS Prompt Author is a web-based program to create [SerGIS JSON Game Data files](http://sergisproject.github.io/docs/json.html) for [the SerGIS Project](http://sergisproject.github.io/).

Current version: 1.0

## Using SerGIS Prompt Author

The SerGIS Prompt Author is hosted at this URL: http://sergisproject.github.io/sergis-author/

Alternatively, you can clone this repository and open `index.html`.

## TODO

Action Editor:

- Issue with "Add More..." for actions and then not being able to delete them
  - "Adding more for add action doesn't work if I hit add after already entering one"

- When creating a buffer action, make sure that the "objectName" that we're buffering has been created!
  - If it hasn't, then the SerGIS Client spews up a "Error: Invalid objectName!" alert


Other:

- Tutorial and help to show basic usage
- Click/dblclick on content/actions/whatever to edit them
- YouTube: take entire URL rather than video ID
- Replace "Prompt Index" with just "Prompt", which consists of a 1-based prompt number and its title.
- Add ability to buffer geodata in layers
- Ability to "sketch" a feature on a map (i.e. if we want to draw something; instead of entering points, allow drawing it on a map)

## License

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.

For more, see `LICENSE.txt` and `CONTRIBUTORS.txt`.
