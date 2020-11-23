// Create required consts for discord.js
const Discord = require('discord.js');
const client = new Discord.Client();

music = require("./index.js");

// Start the music bot.
music.start(client, {
	//Set API Key, this is for the search command
	//  and is required for the bot.
  youtubeKey: require("./../canaryToken.json").youtube,
  botPrefix: "++",
  
	//Experimental, use with caution
  errorChannel: "715887123378470962"
});

// Login to the DiscordAPI with our token
client.login(require("./../canaryToken.json").discord);
