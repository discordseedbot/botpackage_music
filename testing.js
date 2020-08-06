// Require the Discord.js library.
const Discord = require('discord.js');

// Start a new Client from Discord.js. You can name this to whatever you like.
const client = new Discord.Client();

// Put the Music module in the new Client object.
// This allows for easy access to all the modules
// functions and data.
client.music = require("./index.js");

console.log(require("./package.json").dependencies)

// Now we start the music module.
client.music.start(client, {
  // Set the api key used for YouTube.
  // This is required to run the bot.
  youtubeKey: require("./../token.json").youtube,
  botPrefix: "++",
  errorChannel: "715887123378470962"
});

// Connect the bot with your Discord applications bot token.
client.login(require("./../token.json").discord);
