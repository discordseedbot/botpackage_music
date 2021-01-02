const ytdl = require("ytdl-core")
const {YTSearcher} = require("ytsearcher")
const ytpl = require("ytpl")
const Discord = require("discord.js")

var requiredModules = [
	"ytdl-core",
	"ytpl",
	"ytsearcher",
	"discord.js"
]
function moduleAvailable(name) {
	try {
		require.resolve(name);
		return true;
	} catch(e){
		// ERROR
	}
	return false;
}
var that = {};
class bot {
	errorGeneration(message,error) {
		console.error(error)
		if (this.options.errorChannel != undefined && that.gClient.channels.cache.get(this.options.errorChannel).has()) {
			let channelSend = new Discord.MessageEmbed()
				.setColor('#ff0000')
				.setTitle(`${error.name}; ${error.message}`)
				.setFooter(message.content)
				.setDescription(`${error.lineNumber}:${error.columnNumber} in ${error.fileName}\n${error.stack}`)
				.setTimestamp()
			that.gClient.channels.cache.get(this.options.errorChannel).send(channelSend)
		}
		let messageSend = new Discord.MessageEmbed()
			.setTitle("An Error Occurred")
			.setDescription(`**${error.name}; ${error.message}**\n${error.lineNumber}:${error.columnNumber} in ${error.fileName}\n${error.stack}`)
			.setFooter(message.content)
		message.channel.send(messageSend)

		return;
	}

	isAdmin(member) {
		if (member.roles.cache.find(r => r.name == this.options.DJRole)) return true;
		if (this.options.ownerOverMember && this.options.botOwners.includes(member.id)) return true;
		if (this.options.botAdmins.includes(member.id)) return true;
		return member.hasPermission("ADMINISTRATOR");
	}
	canSkip(member,queue) {
		if (this.options.anyoneCanSkip) return true;
		else if (this.options.botAdmins.includes(member.id)) return true;
		else if (this.options.ownerOverMember && this.options.botOwners.includes(member.id)) return true;
		else if (this.queue.last === null) return true;
		else if (this.queue.last.requester === undefined) return true;
		else if (this.queue.last.requester === member.id) return true;
		else if (this.isAdmin(member)) return true;
		else return false;
	}
	canAdjust(member, queue) {
		if (this.options.anyoneCanAdjust) return true;
		else if (this.options.botAdmins.includes(member.id)) return true;
		else if (this.options.ownerOverMember && this.options.botOwners.includes(member.id)) return true;
		else if (this.queue.last.requester === undefined) return true;
		else if (this.queue.last.requester === member.id) return true;
		else if (this.isAdmin(member)) return true;
		else return false;
	}
	getQueue(server) {
		if (!this.queue.has(server)) {
			this.queue.set(server, {songs: [], last: null, loop: "none", id: server,volume: this.options.defaultVolume, oldSongs: [],working: false, needsRefresh: false});
		};
		return this.queue.get(server);
	}
	setLast(server, last) {
		return new Promise((resolve, reject) => {
			if (this.queue.has(server)) {
				let q = this.queue.get(server);
				q.last = last;
				this.queue.set(server, q);
				resolve(this.queue.get(server));
			} else {
				reject("no server queue");
			};
		});
	}
	clearQueue(server) {
		return new Promise((resolve, reject) => {
			if (!server || typeof server != "string") reject("no server id passed or passed obj was no a string @emptyQueue")
			this.queue.set(server, {songs: [], last: null, loop: "none", id: server, volume: that.defVolume, oldSongs: [],working: false, needsRefresh: false});
			resolve(this.queue.get(server));
		});
	}
	updatePrefix(server,prefix) {
		if (typeof prefix == undefined) prefix = this.options.defaultPrefix;
		if (typeof this.options.botPrefix != "object") this.options.botPrefix = new Map();
		this.options.botPrefix.set(server, {prefix: prefix});
	}
	changeKey(key) {
		return new Promise((resolve, reject) => {
			if (!key || typeof key !== "string") reject("key must be a string");
			this.options.youtubeToken = key;
			this.searcher.key = key;
			resolve(this);
		});
	}

	_populateCommands(){
		this.mCommands = new Map()
		this.mCommands.set('play',{
			enabled: (this.options.play == undefined ? true : (this.options.play && typeof this.options.play.enabled !== 'undefined' ? this.options.play && this.options.play.enabled : true)),
			run: "play",
			alt: (this.options && this.options.play && this.options.play.alt) || [],
			help: (this.options && this.options.play && this.options.play.help) || "Queue a song/playlist by URL or name.",
			name: (this.options && this.options.play && this.options.play.name) || "play",
			usage: (this.options && this.options.play && this.options.play.usage) || null,
			exclude: Boolean((this.options && this.options.play && this.options.play.exclude)),
			masked: "play"
		})
		this.mCommands.set('help',{
			enabled: (this.options.help == undefined ? true : (this.options.help && typeof this.options.help.enabled !== 'undefined' ? this.options.help && this.options.help.enabled : true)),
			run: "help",
			alt: (this.options && this.options.help && this.options.help.alt) || [],
			help: (this.options && this.options.help && this.options.help.help) || "Help for commands.",
			name: (this.options && this.options.help && this.options.help.name) || "help",
			usage: (this.options && this.options.help && this.options.help.usage) || null,
			exclude: Boolean((this.options && this.options.help && this.options.help.exclude)),
			masked: "help"
		})
		this.mCommands.set('pause',{
			enabled: (this.options.pause == undefined ? true : (this.options.pause && typeof this.options.pause.enabled !== 'undefined' ? this.options.pause && this.options.pause.enabled : true)),
			run: "pause",
			alt: (this.options && this.options.pause && this.options.pause.alt) || [],
			help: (this.options && this.options.pause && this.options.pause.help) || "Pauses playing music.",
			name: (this.options && this.options.pause && this.options.pause.name) || "pause",
			usage: (this.options && this.options.pause && this.options.pause.usage) || null,
			exclude: Boolean((this.options && this.options.pause && this.options.pause.exclude)),
			masked: "pause"
		})
		this.mCommands.set('resume',{
			enabled: (this.options.resume == undefined ? true : (this.options.resume && typeof this.options.resume.enabled !== 'undefined' ? this.options.resume && this.options.resume.enabled : true)),
			run: "resume",
			alt: (this.options && this.options.resume && this.options.resume.alt) || [],
			help: (this.options && this.options.resume && this.options.resume.help) || "Resumes a paused queue.",
			name: (this.options && this.options.resume && this.options.resume.name) || "resume",
			usage: (this.options && this.options.resume && this.options.resume.usage) || null,
			exclude: Boolean((this.options && this.options.resume && this.options.resume.exclude)),
			masked: "resume"
		})
		this.mCommands.set('leave',{
			enabled: (this.options.leave == undefined ? true : (this.options.leave && typeof this.options.leave.enabled !== 'undefined' ? this.options.leave && this.options.leave.enabled : true)),
			run: "leave",
			alt: (this.options && this.options.leave && this.options.leave.alt) || [],
			help: (this.options && this.options.leave && this.options.leave.help) || "Leaves the voice channel.",
			name: (this.options && this.options.leave && this.options.leave.name) || "leave",
			usage: (this.options && this.options.leave && this.options.leave.usage) || null,
			exclude: Boolean((this.options && this.options.leave && this.options.leave.exclude)),
			masked: "leave"
		})
		this.mCommands.set('queue',{
			enabled: (this.options.queue == undefined ? true : (this.options.queue && typeof this.options.queue.enabled !== 'undefined' ? this.options.queue && this.options.queue.enabled : true)),
			run: "queue",
			alt: (this.options && this.options.queue && this.options.queue.alt) || [],
			help: (this.options && this.options.queue && this.options.queue.help) || "View the current queue.",
			name: (this.options && this.options.queue && this.options.queue.name) || "queue",
			usage: (this.options && this.options.queue && this.options.queue.usage) || null,
			exclude: Boolean((this.options && this.options.queue && this.options.queue.exclude)),
			masked: "queue"
		})
		this.mCommands.set('np',{
			enabled: (this.options.np == undefined ? true : (this.options.np && typeof this.options.np.enabled !== 'undefined' ? this.options.np && this.options.np.enabled : true)),
			run: "np",
			alt: (this.options && this.options.np && this.options.np.alt) || [],
			help: (this.options && this.options.np && this.options.np.help) || "Shows the now playing text.",
			name: (this.options && this.options.np && this.options.np.name) || "np",
			usage: (this.options && this.options.np && this.options.np.usage) || null,
			exclude: Boolean((this.options && this.options.np && this.options.np.exclude)),
			masked: "np"
		})
		this.mCommands.set('loop',{
			enabled: (this.options.loop == undefined ? true : (this.options.loop && typeof this.options.loop.enabled !== 'undefined' ? this.options.loop && this.options.loop.enabled : true)),
			run: "loop",
			alt: (this.options && this.options.loop && this.options.loop.alt) || [],
			help: (this.options && this.options.loop && this.options.loop.help) || "Sets the loop state for the queue.",
			name: (this.options && this.options.loop && this.options.loop.name) || "loop",
			usage: (this.options && this.options.loop && this.options.loop.usage) || null,
			exclude: Boolean((this.options && this.options.loop && this.options.loop.exclude)),
			masked: "loop"
		})
		this.mCommands.set('search',{
			enabled: (this.options.search == undefined ? true : (this.options.search && typeof this.options.search.enabled !== 'undefined' ? this.options.search && this.options.search.enabled : true)),
			run: "search",
			alt: (this.options && this.options.search && this.options.search.alt) || [],
			help: (this.options && this.options.search && this.options.search.help) || "Searchs for up to 10 videos from YouTube.",
			name: (this.options && this.options.search && this.options.search.name) || "search",
			usage: (this.options && this.options.search && this.options.search.usage) || null,
			exclude: Boolean((this.options && this.options.search && this.options.search.exclude)),
			masked: "search"
		})
		this.mCommands.set('clearqueue',{
			enabled: (this.options.clearqueue == undefined ? true : (this.options.clearqueue && typeof this.options.clearqueue.enabled !== 'undefined' ? this.options.clearqueue && this.options.clearqueue.enabled : true)),
			run: "clear",
			alt: (this.options && this.options.clear && this.options.clear.alt) || [],
			help: (this.options && this.options.clear && this.options.clear.help) || "Clears the entire queue.",
			name: (this.options && this.options.clear && this.options.clear.name) || "clear",
			usage: (this.options && this.options.clear && this.options.clear.usage) || null,
			exclude: Boolean((this.options && this.options.clearqueue && this.options.clearqueue.exclude)),
			masked: "clearqueue"
		})
		this.mCommands.set('volume',{
			enabled: (this.options.volume == undefined ? true : (this.options.volume && typeof this.options.volume.enabled !== 'undefined' ? this.options.volume && this.options.volume.enabled : true)),
			run: "volume",
			alt: (this.options && this.options.volume && this.options.volume.alt) || [],
			help: (this.options && this.options.volume && this.options.volume.help) || "Changes the volume output of the bot.",
			name: (this.options && this.options.volume && this.options.volume.name) || "volume",
			usage: (this.options && this.options.volume && this.options.volume.usage) || null,
			exclude: Boolean((this.options && this.options.volume && this.options.volume.exclude)),
			masked: "volume"
		})
		this.mCommands.set('remove',{
			enabled: (this.options.remove == undefined ? true : (this.options.remove && typeof this.options.remove.enabled !== 'undefined' ? this.options.remove && this.options.remove.enabled : true)),
			run: "remove",
			alt: (this.options && this.options.remove && this.options.remove.alt) || [],
			help: (this.options && this.options.remove && this.options.remove.help) || "Remove a song from the queue by position in the queue.",
			name: (this.options && this.options.remove && this.options.remove.name) || "remove",
			usage: (this.options && this.options.remove && this.options.remove.usage) || "{{prefix}}remove [position]",
			exclude: Boolean((this.options && this.options.remove && this.options.remove.exclude)),
			masked: "remove"
		})
		this.mCommands.set('skip',{
			enabled: (this.options.skip == undefined ? true : (this.options.skip && typeof this.options.skip.enabled !== 'undefined' ? this.options.skip && this.options.skip.enabled : true)),
			run: "skip",
			alt: (this.options && this.options.skip && this.options.skip.alt) || [],
			help: (this.options && this.options.skip && this.options.skip.help) || "Skip a song or songs with `skip [number]`",
			name: (this.options && this.options.skip && this.options.skip.name) || "skip",
			usage: (this.options && this.options.skip && this.options.skip.usage) || null,
			exclude: Boolean((this.options && this.options.skip && this.options.skip.exclude)),
			masked: "skip"
		})
		this.mCommands.set('shuffle',{
			enabled: (this.options.shuffle == undefined ? true : (this.options.shuffle && typeof this.options.shuffle.enabled !== 'undefined' ? this.options.shuffle && this.options.shuffle.enabled : true)),
			run: "shuffle",
			alt: (this.options && this.options.shuffle && this.options.shuffle.alt) || [],
			help: (this.options && this.options.shuffle && this.options.shuffle.help) || "Shuffle the queue",
			name: (this.options && this.options.shuffle && this.options.shuffle.name) || "shuffle",
			usage: (this.options && this.options.shuffle && this.options.shuffle.usage) || null,
			exclude: Boolean((this.options && this.options.shuffle && this.options.shuffle.exclude)),
			masked: "shuffle"
		})
		this.mCommands.set('deleteQueue',{
			enabled: (this.options.deleteQueue == undefined ? true : (this.options.deleteQueue && typeof this.options.deleteQueue.enabled !== 'undefined' ? this.options.deleteQueue && this.options.deleteQueue.enabled : true)),
			run: "deleteQueue",
			alt: (this.options && this.options.deleteQueue && this.options.deleteQueue.alt) || [],
			help: (this.options && this.options.deleteQueue && this.options.deleteQueue.help) || "Delete and re-make an ongoing queue",
			name: (this.options && this.options.deleteQueue && this.options.deleteQueue.name) || "deletequeue",
			usage: (this.options && this.options.deleteQueue && this.options.deleteQueue.usage) || null,
			exclude: Boolean((this.options && this.options.deleteQueue && this.options.deleteQueue.exclude)),
			masked: "deletequeue"
		})

		return;
	}

	commandManage(fileName,message) {
		var tempFunction = require(`./${fileName}.js`)
		new tempFunction(this,that,message)
		return;
	}

	runQueue(message,queue) {
		this.queue.set(queue.id,queue);
		if (queue.songs.length == 0) {
			// Playback Done
			message.channel.send(this.mStrings.playbackComplete);
			const voiceConnection = that.gClient.voice.connections.find(val => val.channel.guild.id == message.guild.id);
			if (voiceConnection != null) return voiceConnection.disconnect();
		}

		new Promise(async (resolve,reject)=>{
			const voiceConnection = that.gClient.voice.connections.find(val => val.channel.guild.is == message.guild.id);
			if (message.member.voice.channel && message.member.voice.channel.joinable) {
				message.member.voice.channel.join().then((conn)=>{
					resolve(conn);
				}).catch((error)=>{
					this.errorGeneration(message,error)
					return;
				})
			}
			else if (!message.member.voice.channel.joinable) {
				message.channel.send(this.mStrings.voiceChannelNotJoinable);
				reject();
			}
			else if (message.member.voice.channel.full) {
				message.channel.send(this.mStrings.voiceChannelFull)
				reject()
			}
			else {
				this.clearQueue(message.guild.id).then(()=>{
					reject();
				})
			}
		}).then(async (connection)=>{
			var video = '';
			if (!queue.last) {
				video = queue.songs[0];
			} else {
				switch(queue.loop) {
					case 'queue':
						video = queue.songs.find(s => s.position == queue.last.position + 1);
						if (!video || video && !video.url) {
							video = queue.songs[0]
						}
						break;
					case 'single':
						video = queue.last;
						break;
					default:
						video = queue.songs.find(s => s.position == queue.last.position);
						break;
				}
			}
			if (!video) {
				video = queue.songs ? queue.songs[0] : false;
				if (!video) {
					message.channel.send(this.mStrings.playbackComplete);
					this.clearQueue(message.guild.id)
					const voiceConnection = that.gClient.voice.connections.find(val => val.channel.guild.id == message.guild.id);
					if (voiceConnection != null) {
						return voiceConnection.disconnect();
					}
				}
			}

			try {
				this.setLast(message.guild.id,video)
				
				var dispatcher = await connection.play(this.ytdl(video.url,{
					filter: 'audioonly',
					quality: 'highestaudio'
				}), {
					bitrate: this.options.bitRate,
					volume: (queue.volume / 100)
				})

				connection.on('error',(error)=>{
					this.errorGeneration(message,error);
					if (message && message.channel) {
						message.channel.send(this.mStrings.connectionError);
					}
					that.runQueue(message,queue);
				})
				dispatcher.on('error',(error)=>{
					this.errorGeneration(message,error);
					if (message && message.channel) {
						message.channel.send(this.mStrings.connectionError);
					}
					this.runQueue(message,queue);
				})
				dispatcher.on('debug',(dmsg)=>{
					that._log(dmsg,'d')
				})
				dispatcher.on('finish',()=>{
					setTimeout(()=>{
						if (this.queue.get(queue.id).needsRefresh) {
							queue = this.queue.get(queue.id)
							queue.needsRefresh = false;
							this.queue.set(queue.id,queue)
						}
						let loop = queue.loop;
						const voiceConnection = that.gClient.voiceConnections.find(val => val.channel.guild.id == message.guild.id)
						if (voiceConnection != null && voiceConnection.channel.members.size <= 1) {
							message.channel.send(this.mStrings.noOtherMembersInChahannel)
							this.clearQueue(message.guild.id)
							return voiceConnection.disconnect();
						}
						if (queue.songs.length > 0) {
							if (loop == "none" || loop == null) {
								that.updatePositions(queue,message ? message.guild.id : 0).then((res)=>{
									queue.songs = typeof res.songs == "object" ? Array.from(res.songs) : [];
									this.runQueue(message,queue)
								}).catch((err)=>{
									this.errorGeneration(message,err)
								})
							}
							else if (loop == "queue" || loop == "song") {
								this.runQueue(message,queue)
							}
						}
						else if (queue.songs.length <= 0) {
							if (message && message.channel) {
								message.channel.send(this.mStrings.playbackComplete)
							}
							this.clearQueue(message.guild.id)
							const voiceConnection = that.gClient.voice.connections.find(val => val.channel.guild.id == message.guild.id)
							if (voiceConnection != null) return voiceConnection.disconnect();
						}
					},1250)
				})
			} catch (err) {
				this.errorGeneration(message,err)
			}
		})
	}

	clearQueue(guildID) {
		this.queue.set(guildID,{
			songs: [], 
			last: null, 
			loop: 'none', 
			id: message.guild.id, 
			volume: this.options.defaultVolume, 
			oldSongs: [], 
			working: false, 
			needsRefresh: false
		})
		return;
	}

	start() {
		that.gClient.on("message",(message)=>{
			if (message.author.bot) return;
			if (this.options.channelBlacklist.length > 0 && this.options.channelBlacklist.includes(message.channel.id)) return;
			if (this.options.channelWhitelist.length > 0 && !this.options.channelWhitelist.includes(message.channel.id)) return;

			if (this.options.serverBlacklist.length > 0 && this.options.serverBlacklist.includes(message.guild.id)) return;
			if (this.options.serverWhitelist.length > 0 && !this.options.serverWhitelist.includes(message.guild.id)) return;

			if (message.channel.type != 'text') return;
			if (!message.content.startsWith(this.options.prefix)) return;
			var args = message.content.slice(this.options.prefix.length).trim().split(/ +/g);
			const command = args[0].trim().toLowerCase();

			if (this.mCommands.has(command)) {
				let tmp_Command = this.mCommands.get(command)
				if (!tmp_Command.enabled) return;
				if (!this.cooldown.enabled && !this.cooldown.exclude.includes(tmp_Command.masked)) {
					if(this.recentTalk.has(message.author.id)) {
						if (this.cooldown.enabled && !this.cooldown.exclude.includes(tmp_Command.masked)) {
							return message.reply(this.mStrings.cooldownTooFast);
						}
					}
					this.recentTalk.add(message.author.id)
					setTimeout(()=>{this.recentTalk.delete(message.author.id)},this.cooldown.timer)
				}
				return this.commandManage(tmp_Command.run,message);
			}
		})
	}
	constructor (g_this) {
		that = g_this;
		this.mStrings = require("./strings.json")
		var allowStart = true;

		if (process.version.slice(1).split('.')[0] < 10) {
			// Node.JS is older than v10
			allowStart = false;
			that._log(this.mStrings.nodejsTooOld,'a')
		}
		requiredModules.forEach((mod)=>{
			if (!moduleAvailable(mod)) {
				// Module not available
				that._log(this.mStrings.moduleNotFound.replace("%module%",mod),'e')
				allowStart = false;
			}
		})
		if (that.jGivenConfig.token == undefined) {
			// Token Undefined
			that._log(this.mStrings.tokenUndefined,'a')
			allowStart = false;
		}

		if (!allowStart) return;
		this.ytdl = ytdl;
		this.YTSearcher = YTSearcher
		this.ytpl = ytpl
		this.Discord = Discord;
		this.queue = new Map();
		this.recentTalk = new Set();
		this.options = {
			embedColor: that.jGivenConfig.embedColor || 'GREEN',
			anyoneCanSkip: that.jGivenConfig.anyoneCanSkip || false,
			anyoneCanLeave: that.jGivenConfig.anyCanLeave || false,
			DJRoleName: that.jGivenConfig.DJRoleName || 'DJ',
			anyoneCanPause: that.jGivenConfig.anyoneCanPause || false,
			anyoneCanAdjust: that.jGivenConfig.anyoneCanAdjust || false,
			youtubeToken: that.jGivenConfig.token,
			errorChannel: that.jGivenConfig.errorChannel,
			extendedLogging: that.jGivenConfig.extraLog,
			extendedLoggingChannel: that.jGivenConfig.extraLogChannel,
			prefix: that.jGivenConfig.prefix || '!',
			defaultVolume: that.jGivenConfig.defaultVolume || 50,
			maxQueueSize: that.jGivenConfig.maxQueueSize || 250,
			ownerOverMember: that.jGivenConfig.ownerOverMember || true,
			botAdmins: that.jGivenConfig.botAdmins || [],
			botOwners: that.jGivenConfig.botOwners || [],
			inlineEmbeds: that.jGivenConfig.inlineEmbeds,
			clearQueueOnLeave: that.jGivenConfig.clearOnLeave || true,
			dateLocal: that.jGivenConfig.dateLocal || 'en-AU',
			channelWhitelist: that.jGivenConfig.channelWhitelist || [],
			channelBlacklist: that.jGivenConfig.channelBlacklist || [],
			serverWhitelist: that.jGivenConfig.serverWhitelist || [],
			serverBlacklist: that.jGivenConfig.serverBlacklist || [],
			bitRate: that.jGivenConfig.bitRate || '96000',
		}
		this.cooldown = {
			enabled: (this.options && this.options.cooldown ? this.options && this.options.cooldown.enabled : true),
			timer: parseInt((this.options && this.options.cooldown && this.options.cooldown.timer) || 10000),
			exclude: (this.options && this.options.cooldown && this.options.cooldown.exclude) || ["volume","queue","pause","resume","np"]
		}
		this._populateCommands();
		this.searcher = new YTSearcher(this.options.youtubeToken)
		this.start();
	}
}

module.exports = bot;