var logger = require("winston");
var express = require("express");
var request = require("request");
var Fuse = require("fuse.js");
var fs = require('fs');

var vodJSON = null;
var esaVodJSON = null
var fuzzyset = null;
var f = null;
var esaFuzzy = null;

var list = ['!help', '!sgdqvod', '!esavod', '!twitch', '!bettergdq', '!list'];

request('https://gist.githubusercontent.com/theoriginalcamper/30bddc447895b64988412671cfc12898/raw/sgdq2016-vod.json', function (error, response, body) {
  if (!error && response.statusCode == 200) {
    vodJSON = JSON.parse(body);
    if (Object.keys(vodJSON).length > 0) {
      logger.info('Loaded SGDQ VOD JSON');
      logger.info(Object.keys(vodJSON).length);
    }
    var titleArray = [];
    Object.keys(vodJSON).forEach(function (element, index) {
      titleArray.push({'id': index, 'title': element});
    });
    var options = {
      keys: ['title'],   // keys to search in
      id: 'title',
      threshold: 0.16                    // return a list of identifiers only
    }
    f = new Fuse(titleArray, options)
  }
});

setInterval(function(){
  request('https://gist.githubusercontent.com/theoriginalcamper/30bddc447895b64988412671cfc12898/raw/sgdq2016-vod.json', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      vodJSON = JSON.parse(body);
      if (Object.keys(vodJSON).length > 0) {
      	logger.info('Loaded SGDQ VOD JSON');
      	logger.info(Object.keys(vodJSON).length);
      }
      var titleArray = [];
      Object.keys(vodJSON).forEach(function (element, index) {
      	titleArray.push({'id': index, 'title': element});
      });
      var options = {
    	  keys: ['title'],   // keys to search in
    	  id: 'title',
    	  threshold: 0.16                    // return a list of identifiers only
    	}
  	  f = new Fuse(titleArray, options)
    }
  });

  logger.info("Reloaded script");
}, 300000)

// Add colorize to debug console
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize : true
});
logger.level = 'debug';


// EXPRESS START
var app = express();

app.get('/:game', function(req, res) {
  var gameTitle = req.params["game"];
	var searchArray = f.search(gameTitle);
	var titlesString = getTitlesString(searchArray, 5);

  res.type('text/plain');

  if (typeof vodJSON[gameTitle] == 'undefined') {
    res.send("**No exact match found. Did you mean: **" + titlesString);
  } else {
    var vodLink = vodJSON[gameTitle]["youtube"];
    res.send("**Requested a VOD for " + gameTitle + ":** " + vodLink)
  }
})

app.listen(3000);

function getTitlesString(arr, num) {
	var arraySlice = arr.slice(0, num + 1);
	var lastGame = arraySlice.pop();
	var str = '\n';
	arraySlice.forEach(function(element, index) {
		str += element + '\n';
	});

	str = str + lastGame;
	return str;
}

if (process.platform === "win32") {
	var rl = require("readline").createInterface({
		input: process.stdin,
		output: process.stdout
	});

	rl.on("SIGINT", function () {
		process.emit("SIGINT");
	});
}

process.on("SIGINT", function () {
  	//graceful shutdown
		logger.info("Shutting Down.");
  	process.exit();
});
