const Discord  = require('discord.js');
const ytdl     = require("ytdl-core");
const fs 	   = require("fs");
const usercmds = require("./lib/commands.js");

const client = new Discord.Client();

var config = JSON.parse(fs.readFileSync("settings.json", "utf-8"));
const discord_token = config.discord_token;

/* -------------------------------------------------- */

client.login(discord_token);

client.on('message', msg => {

	if (msg.author.bot) return;

	if (msg.channel.type == "dm" || msg.channel.type == "group"){

		let guild = client.guilds.find(guild => {return guild.name == 'GooseHead v2'});
		let textChannel = guild.channels.find(channel => {return channel.name == 'general'});
		
		textChannel.send(msg.content);
		return;

	}
	
	if (msg.channel.name == "mr-meeseeks"){

		if (msg.content.startsWith("http")){
						
			if (ytdl.validateURL(msg.content)){

				let stream = ytdl(msg.content, {filter: 'audioonly'});
				let time = decodeURL(msg.content, "t");
				let seek = time ? {seek: convertTime(time)} : {};
				addActionToQueue({msg: msg, song: {stream: stream, seek: seek}});

			} else {
				console.log('URL non valide : ' + msg.content);
			}

		} else if (msg.content == "help"){

			addActionToQueue({msg: msg, song: "rick/rick06.mp3", text: Object.keys(usercmds).sort().join(" ")});

		} else if (msg.content == "tg"){

			if (msg.guild.voiceConnection){
				msg.guild.voiceConnection.disconnect();
			}

		} else if (msg.content == "random"){

			let randomCommand = Object.keys(usercmds)[Math.floor((Math.random() * Object.keys(usercmds).length) + 1) - 1];
			executeCommand(msg, usercmds[randomCommand]);

		} else {

			let args = msg.content.toLowerCase().split(' ');
			let keywordsUsed = Object.keys(usercmds).filter(cmd => {return args.includes(cmd)});
			if (keywordsUsed.length > 0){
				let randomKeyword = keywordsUsed[Math.floor((Math.random() * keywordsUsed.length) + 1) - 1];
				executeCommand(msg, usercmds[randomKeyword]);
			}

		}
		
	}

});

/* -------------------------------------------------- */

let actionsQueue = [];

function executeAction(){
	if (actionsQueue.length == 0) return;
	let action = actionsQueue[0];
	Promise.all([play(action.msg, action.song), talk(action.msg, action.text)]).then(executeNextAction, executeNextAction);
}

function executeNextAction(log){
	actionsQueue.shift();
	executeAction();
}

function addActionToQueue(action){
	actionsQueue.push(action);
	if (actionsQueue.length == 1) executeAction();
}

function executeCommand(msg, cmd){
	
	if (cmd.folder){
		if (cmd.available > 1){
			let random = Math.floor((Math.random() * cmd.available) + 1) - 1;
			let chosenSong = cmd.choices[random];
			cmd.available--;
			cmd.choices[random] = cmd.choices[cmd.available];
			cmd.choices[cmd.available] = chosenSong;
			cmd.song = cmd.folder + "/" + chosenSong;
		} else {
			cmd.available = cmd.choices.length;
			cmd.song = cmd.folder + "/" + cmd.choices[0];
		}
	}

	if (cmd.userLocked && cmd.userLocked[msg.author.id]) executeCommand(msg, cmd.userLocked[msg.author.id]);
	else addActionToQueue({msg: msg, song: cmd.song, text: cmd.message});

}

/* -------------------------------------------------- */

function play(msg, song){

	return new Promise((resolve, reject) => {

		if (!song) resolve('You need to specify something !');

		if (!msg.guild.voiceConnection){

			if (!msg.member.voiceChannelID) resolve('Join a voicechannel first !');

			const voiceChannel = msg.guild.channels.get(msg.member.voiceChannelID), userID = client.user.id;

			if (!voiceChannel.permissionsFor(userID).has('CONNECT')) resolve('This channel doesn\'t allow me to connect !');

			if (!voiceChannel.permissionsFor(userID).has('SPEAK'))   resolve('This channel doesn\'t allow me to speak !');

			voiceChannel.join().then(connection => {
				play(msg, song).then(() => {resolve();}, () => {resolve();});
			});

		} else if (msg.member.voiceChannelID !== msg.guild.voiceConnection.channel.id) resolve('Join my voicechannel !');
		
		else {
			
			const voiceConnection = msg.guild.voiceConnection;

			if (voiceConnection.speaking) voiceConnection.dispatcher.end();
			
			let dispatcher = null;
			if (typeof song == "object"){
				dispatcher = voiceConnection.playStream(song.stream, song.seek);
			} else {
				console.log(song);
				dispatcher = voiceConnection.playFile('./music/' + song);
			}

			dispatcher.on('end', data => {
				if (data == "stream" || data == "Stream is not generating quickly enough."){
					voiceConnection.on('disconnect', () => {resolve();})
					voiceConnection.disconnect();
				} else {
					resolve();
				}
			});

		}

	});
	
}

function talk(msg, text){
	
	return new Promise((resolve, reject) => {
		if (!text){
			resolve('You need to specify something !');
		} else {
			console.log(text);
			msg.channel.send(text).then(() => {resolve();}, () => {resolve();});
		}
	});

}

/* -------------------------------------------------- */

function decodeURL(url, tag){

	tag = tag.replace(/[\[\]]/g, "\\$&");
	
	let regexp = new RegExp("[?&]" + tag + "(=([^&#]*)|&|#|$)"), results = regexp.exec(url);
	
	if (results === null) return null;
	
	return decodeURIComponent(results[2].replace(/\+/g, " "));

}

function convertTime(time){

	let timeUnits = {s: 1, m: 60, h: 3600};

	let total = 0;
	let regexp = /(\d+)(ms|s|m|h)/g;
	let results;

	while ((results = regexp.exec(time)) !== null){
		total = total + results[1] * timeUnits[results[2]];
	}
	
	return total;
}