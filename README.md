## About

A game cobbled together for the [js13k](http://js13kgames.com/) 2015 competition, very loosely based on the theme of "Reversed".

Runs well on Chrome desktop, and ok on Firefox desktop. Not tested in other browsers. There is some touch event support so might work ok on mobile, but this is untested.

## How to play

You're hunting for _Orbs of Awesomeness_ in the dark.

Tap the lamps to illuminate their surrounding area (or ... ahem ... "reverse" the darkness into light within that area) and find your way to the orb in each level.

There's only so much light in the world though, and the more lamps you activate, the smaller their illuminating circles become. To complete most levels you'll need to turn some lamps off in order to progress.

Be careful not to turn all the lamps off. It's dark out there.

## Level editor

There is a facility when running direct from source (not the compiled version) whereby you can drag lights around and get the coordinates of all lights printed to console. This can be pasted in the appropriate place in the `levels.js` to create/edit a level.

## Build (for submission to js13k)

```
$ npm install -g grunt-cli
$ npm install
$ grunt
```

## TODO

* More levels - there's only 7 playable right now (contributions to the `levels.js` file would be welcomed!)
* SFX/music

## Credits

* Sprites (modified from originals): http://opengameart.org/content/lpc-misc
* Background texture (modified from originals): http://opengameart.org/content/pietextureset
