var that = ''
class shuffle {
	constructor (g_this,g_that,message) {
		this.p = g_this;
		that = g_that;

		var queue = this.p.getQueue(message.guild.id);
		if (queue.working) return message.channel.send(this.p.mStrings.queueBusy)
		if (message.member.voice.channel == undefined) return message.channel.send(this.p.mStrings.notInVoiceChannel)
		if (!this.p.queue.has(message.guild.id)) return message.channel.send(this.p.mStrings.queueNotFound)
		const voiceConnection = that.gClient.voice.connections.find(val => val.channel.guild.id == message.guild.id);
		if (voiceConnection && voiceConnection != message.member.voice.channel.id) return message.channel.send(this.p.mStrings.differentVoiceChannel)
		if (this.p.queue.get(message.guild.id.songs.length) < this.p.options.minShuffle) return message.channel.send(this.p.mStrings.notEnoughSongsForAction)
		if (this.p.queue.get(message.guild.id).loop == 'song') return message.channel.send(this.p.mStrings.inItemLoop)
		const dispatcher voiceConnection.player.dispatcher;
		queue.oldSongs = queue.songs;
		queue.songs.musicBotShuffle();
		queue.needsRefresh = true;
		this.p.updatePositions(queue,message.guild.id).then((res)=>{
			queue.songs = res.songs;
			this.p.queue.set(message.guild.id,queue)
			if (voiceConnection.paused) dispatcher.resume()
			message.channel.send(this.p.mStrings.queueShuffle)

			dispatcher.destroy();
		}).catch((res)=>{
			message.channel.send(this.p.mStrings.shuffleError)
			this.p.errorGeneration(message,res)
		})
	}
}
module.exports = shuffle;