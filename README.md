# Please read the entire README before doing anything.

## A Little Notice:
This package was originally created by [Darko Pendragon](https://github.com/darkopendragon) and the code contributors on the original repo. All changes/optimisations from here on out is made by the developers from [DARiOX](https://dariox.club)

If you have any problems with up please [send an email](mailto:contact@dariox.club) or [send us a tweet](https://twitter.com/darioxdotclub)

<div align="center">
  <p>
    <a href="https://nodei.co/npm/sbpkg_music
/"><img src="https://nodei.co/npm/sbpkg_music.png?downloads=true&stars=true" alt="NPM info" /></a>
  </p>
</div> 

# Discord MusicBot Addon
***  
This module is a *somewhat* simple Node.js based music extension/bot for Discord.js projects using YouTube. This was originally an update of an older addon for newer versions of Discord.js but not serves as it's own module.   

__The commands available are: (default names)__  
* `musichelp [command]`: Displays help text for commands by this addon, or help for a specific command.
* `play <url>|<search string>`: Play audio from YouTube.
* `search <search string>`: Search's for up to 10 videos from YT.
* `skip [number]`: Skip a song or multi songs with skip [some number].
* `queue [position]`: Display the current queue.
* `pause`: Pause music playback.
* `resume`: Resume music playback.
* `remove [position]`: Remove a song from the queue by position.
* `volume`: Adjust the playback volume between 1 and 200.
* `leave`: Clears the song queue and leaves the channel.
* `clearqueue`: Clears the song queue.
* `np`: Show the current playing song.  

__Permissions:__  
* If `anyoneCanSkip` is true, anyone can skip songs in the queue.
* If `anyoneCanAdjust` is true, anyone can adjust the volume.
* If `ownerOverMember` is true, the set ID of the user (`ownerID`) will over-ride permissions from the bot.

__Misc Options:__
* When `errorChannel` is set and when an error occurs a message is sent to that channel with the error and information about the message (Guild ID, Message ID, Channel ID, User Info, and Message Content)

***
# Installation
***  
__Pre-installation:__  
1. `npm install discord.js@12`  
Jokes on you Darko it works on D.JS v12

2. `ffmpeg installed` __correctly__ for your OS/env.  
Allows the bot to join voice as well as speak.  

3. `npm install node-opus` or `npm install opusscript`  
Required for voice. Discord.js _prefers_ node-opus, but `opusscript` is much more easy.  

__Installation:__  
* `npm i sbpkg_music@latest`  
If you have troubles installing [join the SeedBot Discord Server](https://seedbot.xyz?p=discord)
Note that the NPM version will be *slightly behind* the GitHub version.

# Examples
***  
See [this page](https://github.com/discordseedbot/botpackage_music/blob/master/examples/examples.md) on the repo for examples.

# Options & Config.
***
__Most options are optional and thus not needed.__  
The options you can pass in `music.start(client, {options})` and their types is as followed:  

## Basic Options.
| Option | Type | Description | Default |  
| --- | --- | --- | --- |
| youtubeKey | String | A YouTube Data API3 key. Required to run. | undefined |
| botPrefix | String | The prefix of the bot. Defaults to "!". Can also be a Map of prefix's. | ! |
| messageNewSong | Boolean | Whether or not to send a message when a new song starts playing. | true |
| bigPicture | Boolean | Whether to use a large (true) image or small (false) for embeds. | false |
| maxQueueSize | Number | Max queue size allowed. Defaults 100. Set to 0 for unlimited. | 250 |
| defVolume | Number | The default volume of music. 1 - 200. | 50 |
| errorChannel (in development) | Number | The discord channel of where you want bot errors to go. Make sure the discord bot is in that server and has permission to send messages there. | undefined |
| anyoneCanSkip | Boolean | Whether or not anyone can skip. | false |
| messageHelp | Boolean | Whether to message the user on help command usage. If it can't, it will send it in the channel like normal. | false |
| botAdmins | Object/Array | An array of Discord user ID's to be admins as the bot. They will ignore permissions for the bot. | undefined |
| anyoneCanAdjust | Boolean | Whether anyone can adjust volume. | false |
| ownerOverMember | Boolean | Whether the owner over-rides `CanAdjust` and `CanSkip`. | false |
| anyoneCanLeave | Boolean | Whether anyone can make the bot leave the currently connected channel. | false |
| ownerID | String | The ID of the Discord user to be seen as the owner. Required if using `ownerOverMember`. | undefined |
| logging | Boolean | Some extra none needed logging (such as caught errors that didn't crash the bot, etc). | true |
| requesterName | Boolean | Whether or not to display the username of the song requester. | true |
| inlineEmbeds | Boolean | Whether or not to make embed fields inline (help command and some fields are excluded). | false |
| musicPresence | Boolean | Whether or not to make the bot set its presence to currently playing music. | false |
| clearPresence | Boolean | Whether or not to clear the presence instead of setting it to "nothing" | false |
| insertMusic | Boolean | Whether or not to insert the music bot data into `<Client>.music` on start. | false |
| channelWhitelist | Object/Array | Sets a list of ID's allow when running messages. | undefined |
| channelBlacklist | Object/Array | Sets a list of ID's ignore when running messages. | undefined |
| bitRate | String | Sets the preferred bitRate for the Discord.js stream to use. | "96000" |
| nextPresence | [PresenceData](https://discord.js.org/#/docs/main/stable/typedef/PresenceData) | PresenceData to set after instead of clearing it (clearPresence). | undefined |

## Multi-Prefix Option Example
```js
<Music>.start(<Client>, {
  youtubeKey: "Data Key",
  botPrefix: <MapObject>
});

// Exmaple Map Structure
{serverID: { prefix: "!" } }
```
See [examples](https://github.com/discordseedbot/botpackage_music/blob/master/examples/examples.md) for more info.
## Cooldown
| Option | Type | Description | Default |  
| --- | --- | --- | --- |
| cooldown | Object | The main cooldown object | |
| cooldown.enabled | Boolean | Whether or not cooldowns are enabled. | true |
| cooldown.timer | Number | Time in MS that cooldowns last. | 10000 |
| cooldown.exclude | Object/Array | Array of command names to exclude. Uses default names, not set names | ["volume","queue","pause","resume","np"] |  

## Command Options.  
Commands pass a bit different. Each command follows the same format as below. Valid <command> entries are `play`, `remove`, `help`, `np`, `queue`, `volume`, `pause`, `resume`, `skip`, `clearqueue`, `loop`, `leave`, `shuffle`, `deletequeue`.
```js
music.start(client, {
  <command>: {
    enabled: false,                    // True/False statement.
    alt: ["name1","name2","name3"],    // Array of alt names (aliases).
    help: "Help text.",                // String of help text.
    name: "play"                       // Name of the command.
    usage: "{{prefix}}play bad memes", // Usage text. {{prefix}} will insert the bots prefix.
    exclude: false                     // Excludes the command from the help command.
  }
});
```
