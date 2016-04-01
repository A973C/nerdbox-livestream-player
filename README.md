# Nerdbox livestream player

http://nerdbox.fr/player

Live audio player with simple music visualisation for Nerdbox.fr.

`js/NerdboxPlayer.js` contains all the Nerdbox-specific code (metadata display etc..)

`js/livestreamPlayer.js` is designed to be used (with adaptations) in *any* project, even though it uses the
materialize css framework for the elements (but it mostly affects the "builders" object).

## Install

Requires NodeJs and Ruby because this project uses:

* Sass
* Bower
* Grunt

`sudo gem install sass`

`sudo npm install -g bower`

`sudo npm install -g grunt`

`bower install`

`grunt compile`
