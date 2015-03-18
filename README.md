# SerGIS Prompt Author

The SerGIS Prompt Author is a web-based program to create [SerGIS JSON Game Data files](http://sergisproject.github.io/docs/json.html) for [the SerGIS Project](http://sergisproject.github.io/).

Current version: 0.9

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
- For preview, submit a POST to the server with the JSON (instead of in the URL),
  and then the server just throws it in a JS variable that the local.js backend
  can find.
- Move storage from localStorage to indexedDB for more storage.
- When we make a new prompt ("Add Prompt"), scroll to it and open it ("click" on it).

## License

    Copyright (c) 2015, SerGIS Project Contributors. All rights reserved.
    Use of this source code is governed by the MIT License, which can be found
    in the LICENSE.txt file.

For more, see `LICENSE.txt` and `CONTRIBUTORS.txt`.
