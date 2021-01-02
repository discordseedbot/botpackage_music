var that = ''
class play{
	constructor(g_this,g_that,message){
		this.p = g_this;
		that = g_that

		if (message.member.voice.channel == undefined) {
			// Not in voice channel
			message.channel.send(this.p.mStrings.notInVoiceChannel)
			return;
		}
		var args = message.content.slice(this.p.options.prefix.length).trim().split(/ +/g);
		if (args[1] == undefined) {
			// Not enough arguments
		}
		var searchString = args[1].trim();
		var contentPlatform = "unknown";
		if (searchString.includes("https://youtu.be") || searchString.includes("https://www.youtube.com")) {
			if (searchString.includes("&")) {
				searchString = searchString.split("&")[0];
			}
			contentPlatform = "youtube";
		}

		switch(contentPlatform) {
			case "youtube":
				this.youtubePlay(searchString,message);
				break;
			default:
				message.channel.send(this.p.mStrings.linkError)
				// Unknown Platform or Invalid Link
				break;
		}
	}
	youtubePlay(searchString,message,ignore) {
		if (searchString.startsWith('http') && searchString.includes("list=")) {
			message.channel.startTyping()
			message.channel.send(this.p.mStrings.searchingPlaylistItems)

			var playID = searchString.toString().split('list=')[1];
			if (playID.toString().includes('?')) {
				playID = playID.split('?')[0]
			}
			if (playID.toString().includes('&t=')) {
				playID = playID.split('&t=')[0];
			}
			try {
				this.p.ytpl(`https://www.youtube.com/playlist?list=${playID}`, {limit: this.p.options.maxQueueSize}).then((playlist)=>{
					if (playlist.items.length <=0) {
						message.channel.send(this.p.mStrings.searchPlaylistNoItems)
						return;
					}
					if(playlist.total_items >= this.p.options.maxQueueSize && this.p.options.maxQueueSize != 0) {
						message.channel.send(this.p.mStrings.playlistTooLarge.replace("%limit%",this.p.options.maxQueueSize))
						return;
					}

					var index = 0;
					var ran = 0;
					var queue = this.p.getQueue(message.guild.id);
					playlist.items.forEach((video)=>{
						ran++;
						if(queue.songs.length == (this.p.options.maxQueueSize + 1) && this.p.options.maxQueueSize != 0 || !video) return;
						video.url = video.url_simple ? video.url_simple : `https://www.youtube.com/watch?v=${video.id}`;
						this.youtubePlay(video.url,message,true)
						index++;
						if (ran >= playlist.items.length) {
							console.debug(queue)
							if (queue.songs.length >= 1) {
								// Run queue
								this.p.runQueue(message,queue)
							}
							if (index == 0) {
								message.channel.send(this.p.mStrings.searchPlaylistNoItems)
							} else if (index >= 1) {
								message.channel.send(this.p.mStrings.playlistQueueAdded.replace("%count%",index))
							}
						}
					})
				}).catch((err)=>{
					this.p.errorGeneration(message,err)
					message.channel.send(this.p.mStrings.searchPlaylistItemsError)
					return;
				})
				message.channel.stopTyping()
			} catch (err) {
				console.error(err)
				this.p.errorGeneration(message,err)
			}
		} else {
			message.channel.startTyping()
			if (!ignore) {
				message.channel.send(this.p.mStrings.searching.replace("%string%",searchString))
			}
			new Promise(async (resolve,reject)=> {
				var result = await this.p.searcher.search(searchString, {type: 'video'}).catch((err)=>{
					var errorMsg = err.message;
					if (errorMsg.includes("dailyLimitExceeded")) {
						errorMsg = errorMsg.slice(errorMsg.indexOf('Daily Limit Exceeded. '));
						errorMsg = errorMsg.slice(0, errprMsg.indexOf('\",'));
						if (!ignore) {
							message.channel.send(this.p.mStrings.dailyLimitExceeded.replace("%msg",errorMsg));
						}
						return;
					} else if (errorMsg.includes("quotaExceeded")) {
						if (!ignore) {
							message.channel.send(this.p.mStrings.quotaExceeded.replace("%msg",errorMsg))
						}
						return;
					} else {
						if (!ignore) {
							message.channel.send(this.p.mStrings.genericSearchError)
						}
						this.p.errorGeneration(message,err)
					}
				})
				if (result == undefined) return;
				resolve(result.first)
			}).then((res)=>{
				if (!res) {
					return message.channel.send(this.p.mStrings.genericError)
				}
				res.requester = message.author.id
				if (searchString.startsWith("https://www.youtube.com/") || searchString.startsWith("https://youtu.be")) {
					res.url = searchString;
				}
				res.channelURL = `https://www.youtube.com/channel/${res.channelId}`;
				res.queuedOn = new Date().toLocaleDateString(this.p.options.dateLocal, {weekday: 'long', hour: 'numeric'});
				res.requesterAvatarURL = message.author.displayAvatarURL()
				const queue = this.p.getQueue(message.guild.id)
				res.position = queue.songs.length ? queue.songs.length : 0;
				queue.songs.push(res)

				if (!ignore) {
					if (message.channel.permissionsFor(message.guild.me).has('EMBED_LINKS')) {
						const embed = new this.p.Discord.MessageEmbed()
						try {
							embed.setAuthor('Adding To Queue', that.gClient.user.avatarURL())
							var songTitle = res.title.replace(/\\/g, '\\\\')
								.replace(/\`/g,'\\`')
								.replace(/\*/g,'\\*')
								.replace(/_/g, '\\_')
								.replace(/~/g, '\\~')
								.replace(/`/g, '\\`')
							embed.setColor(this.p.options.embedColor);
							embed.addField(res.channelTitle, `[${songTitle}](${res.url})`,this.p.options.inlineEmbeds)
							embed.addField("Queued On", res.queuedOn, this.p.options.inlineEmbeds)
							if (!this.p.options.bigPicture) embed.setThumbnail(`https://img.youtube.com/vi/${res.id}/maxresdefault.jpg`);
							if (this.p.options.bigPicture) embed.setImage(`https://img.youtube.com/vi/${res.id}/maxresdefault.jpg`);
							const resMem = that.gClient.users.cache.get(res.requester)
							if (this.p.options.requesterName && resMem) embed.setFooter(`Requested by ${that.gClient.users.cache.get(res.requester).username}`, res.requesterAvatarURL)
							if (this.p.options.requesterName && !resMem) embed.setFooter(`Requested by \`UnknownUser (ID: ${res.requester})\``, res.requesterAvatarURL)
							message.channel.send(embed)
						} catch (err) {
							this.p.errorGeneration(message,err)
						}
					} else {
						try {
							var songTitle = res.title.replace(/\\/g, '\\\\')
								.replace(/\`/g,'\\`')
								.replace(/\*/g,'\\*')
								.replace(/_/g, '\\_')
								.replace(/~/g, '\\~')
								.replace(/`/g, '\\`')
							message.channel.send(`Now Playing: **${songTitle}**\nRequested By: ${that.gClient.users.cache.get(res.requester).username}\nQueued On: ${res.queuedOn}`)
						} catch (err) {
							this.p.errorGeneration(message,err)
						}
					}
				}
				if (queue.songs.length == 1 || that.gClient.voice.connections.find(val => val.channel.guild.id == message.guild.id)) this.p.runQueue(message,queue)
			}).catch((res)=>{
				console.log(res)
			})
			message.channel.stopTyping()
		}
	}
}

module.exports = play;