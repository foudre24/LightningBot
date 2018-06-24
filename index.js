const Discord  = require('discord.js');
const ytdl     = require("ytdl-core");
const fs 	   = require("fs");
const tools    = require("./lib/tools.js");
const usercmds = require("./lib/commands.js");

var config = JSON.parse(fs.readFileSync("settings.json", "utf-8"));

const client = new Discord.Client();

/* -------------------------------------------------- */

client.login(config.token);

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
				let time = tools.decodeURL(msg.content, "t");
				let seek = time ? {seek: tools.convertTime(time)} : {};
				pushAction({msg: msg, song: {stream: stream, seek: seek}});

			} else {
				console.log('URL non valide : ' + msg.content);
			}

		} else if (msg.content == "help"){

			pushAction({msg: msg, song: "rick/rick06.mp3", text: Object.keys(usercmds).sort().join(" ")});

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

async function executeAction(){
	if (actionsQueue.length == 0) return;
	let action = actionsQueue[0];
	try {
		await Promise.all([talk(action.msg, action.text), play(action.msg, action.song)]);
	} catch(error) {
		console.log(error);
	}
	actionsQueue.shift();
	executeAction();
}

function pushAction(action){
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
	else pushAction({msg: msg, song: cmd.song, text: cmd.message});

}

/* -------------------------------------------------- */

async function connect(msg){

	if (!msg.guild.voiceConnection){

		if (!msg.member.voiceChannelID) throw new Error("Join a voicechannel first !");

			const voiceChannel = msg.guild.channels.get(msg.member.voiceChannelID), userID = client.user.id;

			if (!voiceChannel.permissionsFor(userID).has('CONNECT')) throw new Error("This channel doesn't allow me to connect !");

			if (!voiceChannel.permissionsFor(userID).has('SPEAK'))   throw new Error("This channel doesn't allow me to speak !");

			await voiceChannel.join();

	 } else if (msg.member.voiceChannelID !== msg.guild.voiceConnection.channel.id) throw new Error("Join my voicechannel !");

}

async function play(msg, song){

	if (!song) throw new Error("You need to specify something !");

	await connect(msg);

	const voiceConnection = msg.guild.voiceConnection;
		
	if (voiceConnection.speaking) voiceConnection.dispatcher.end();
			
	let dispatcher = typeof song == "object" ? voiceConnection.playStream(song.stream, song.seek) : voiceConnection.playFile('./music/' + song);

	await disconnect(msg);
	
}

async function disconnect(msg){

	return new Promise((resolve, reject) => {
		const voiceConnection = msg.guild.voiceConnection;
		voiceConnection.dispatcher.on('end', data => {
			if (data == "stream" || data == "Stream is not generating quickly enough."){
				voiceConnection.on('disconnect', () => {resolve();})
				voiceConnection.disconnect();
			} else {
				resolve();
			}
		});
	});

}

async function talk(msg, text){
	
	if (!text) return;
	msg.channel.send(text);

}