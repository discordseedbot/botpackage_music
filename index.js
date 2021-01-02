var jStrings = require("./strings.json")
const ytdl = require('ytdl-core');
const {YTSearcher} = require('ytsearcher');
const ytpl = require('ytpl');
const Discord = require('discord.js');
class musicBot {

	// Unique IDentifiyer GENeration
	_UIDGen(g_length) {
		var length = g_length || 6;
		var charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
		var retVal = "";
		for (var i = 0, n = charset.length; i < length; ++i) {
			retVal += charset.charAt(Math.floor(Math.random() * n));
		}
		return retVal;
	}

	// Custom Debug Logging
	_log(g_content,g_scope) {
		if (this.jLog == undefined) {
			this.jLog = {
				history: [],
				timestamp: Date.now(),
			};
			this._log(this.cStrings.createdLogHistory)
		}
		var validScopes = {
			ERROR: [
				'e',
				'error',
				'err'
			],
			INFO: [
				'i',
				'info',
				'inf',
			],
			DEBG: [
				'debug',
				'dbg',
				'debg',
				'db',
				'd'
			],
			ALERT: [
				'alert',
				'alrt',
				'rlt',
				'a'
			],
			WARN: [
				'warning',
				'warnin',
				'warn',
				'wrng',
				'wrn',
				'w'
			]
		};
		var t_scope = this.sDefaultScope || 'INFO';
		Object.entries(validScopes).forEach((scope)=>{
			scope[1].forEach((innerScope)=>{
				if (g_scope != undefined && innerScope == g_scope.toLowerCase()) {
					t_scope = scope[0].toUpperCase();
				}
			})
		})
		var content_console = `[${t_scope} ${this.sBranding || 'MusicBot'}_${this.sUID || '00000'}] ${g_content}`
		var content_JSON = {data:g_content,timestamp: Date.now(),UID:this.sUID,scope:t_scope}
		this.jLog.history.push(content_JSON)
		var b_printLog = false;

		var scopePrintLookup = {
			ERROR: ['error'],
			INFO: ['info','error'],
			DEBUG: ['error','info','warn','debug'],
			ALERT: ['alert'],
			WARN: ['warn'],
		}

		// Check if the config given allows the scope we
		//		want to print, if it is then we set
		//		'b_printLog' to true. This codde is
		//		scuffed as fuck but it works, I think.
		Object.entries(scopePrintLookup).forEach((scope)=>{
			scope[1].forEach((innerScope)=>{
				if (innerScope == t_scope.toLowerCase().trim()) {
					b_printLog = true;
				}
			})
		})

		if (this.bForceLog || b_printLog || t_scope.toLowerCase() == 'alert') {
			console.log(content_console);
		}
		this._runCallback('debug',content_JSON);
		return;
	}

	// Initalize function, called when config is given and valid.
	_init() {
		this.bForceLog = this.jGivenConfig.log || false;
		this.sDefaultScope = this.jGivenConfig.defaultScope || 'INFO';
		this.sScope = (this.jGivenConfig.scope || 'NONE').trim();
		this.sBranding = this.jGivenConfig.name || 'MusicBot';
		this.jStrings = require("./strings.json");
		if (this.jLog == undefined) {
			this.jLog = {
				history: [],
				timestamp: Date.now(),
			};
			this._log(this.cStrings.createdLogHistory,'d')
		}
		this.jClasses = {
			music: require("./classes/music/index.js")
		}
		this._log(this.cStrings.doneInit,'d')
	}

	// Add Callback to Memory
	_addCallback(g_type,g_callback) {
		if (this.jCallbacks == undefined) {
			this.jCallbacks = {
				data: [],
				timestamp: Date.now()
			}
			this._log(this.cStrings.createdCallbacks,'d')
		}
		if (this.jCallbacks.data.length < 1) {
			this.jCallbacks.data.push({
				callback: g_callback,
				type: g_type,
				timestamp: Date.now()
			})
			this._log(this.cStrings.callbackAdded,'d')
		} else {
			var t_callbackArray = [];
			this.jCallbacks.data.forEach((d)=>{
				if (d.type == g_type && g_callback == d.callback) {
					// Callback Exists Already.
					this._log(this.cStrings.callbackExists,'w')
					t_callbackArray.push(d)
				} else {
					t_callbackArray.push({
						callback: g_callback,
						type: g_type,
						timestamp: Date.now()
					})
					this._log(this.cStrings.callbackAdded,'d')
				}
			})
			this.jCallbacks.data = t_callbackArray;
		}
		this._log(this.cStrings.callbacksUpdated,'d')
	}

	// Run Callback
	_runCallback(g_type,g_data) {
		if (this.jCallbacks != undefined) {
			this.jCallbacks.data.forEach((d)=>{
				if (d.type.toLowerCase() == g_type.toLowerCase()) {
					//this._log(`${this.cStrings.callbackRan.replace("%type%",g_type)}`,'d');
					d.callback(g_data || {log:this.jLog,client:this.gClient});
				}
			})
		}
	}

	// Called when a new instance is created.
	constructor (g_client,g_config) {
		this.cStrings = require("./strings.json");
		this.bAllowStart = true;
		if (g_config == undefined) {
			// Config was not given
			this.bAllowStart = false;
			this._log(this.cStrings.undefinedConfig,'e');
			throw this.cStrings.undefinedConfig;
		} else {
			this.jGivenConfig = g_config;
			this.queue = require("./queue.js")
			this.sUID = this._UIDGen(this.jGivenConfig.UIDLength || 5);
			this._log(this.cStrings.calledInit,'d')
			this._init();

			// Save the client to hand over to functions that need it.
			this.gClient = g_client;
			this._log(this.cStrings.clientSaved,'d');
			this.djsClient();
			return;
		}
	}

	djsClient(){
		this.gClient.on('ready',async (cl_data)=>{
			this._log(this.cStrings.clientReady);
			new this.jClasses.music(this);
			this._runCallback('clientready',cl_data);
		})
		this.gClient.on('debug',(cl_data)=>{
			this._runCallback('debug',cl_data)
		})
	}

	// Callback Listener, mainly used for debugging.
	on (g_type,g_callback) {
		if (this.bAllowStart) {
			if (this.gClient == undefined) {
				// Client was not given
				this._log(this.cStrings.undefinedClient,'e')
				throw this.cStrings.undefinedClient;
			}
			g_type = g_type.toLowerCase().trim()
			if (g_callback != undefined) {
				this._addCallback(g_type,g_callback)
			}
		} else {
			this._log(this.cStrings.undefinedConfig,'w');
			callback(this.cStrings.undefinedConfig,this.jLog)
			throw this.cStrings.undefinedConfig;
		}
	}
}

module.exports = musicBot;