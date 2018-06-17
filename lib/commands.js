const fs = require("fs");

var commands = {

	master       : {userLocked: {"152129533317873664": {song: "user/chaos.mp3", message: "vous êtes mon maître bien aimé !"}}, song: "user/bouh.mp3", message: "Bouh !"},

	pomme        : {song: "user/sparta.mp3",   message: "This is Sparta !"},
	anatole      : {song: "user/anatole.mp3",  message: "sa mère la pute"},
	camille      : {song: "user/marcia.mp3",   message: "quelqu'un a parlé de greed ?"},
	tangoku      : {song: "user/chiantos.mp3", message: "ferme la et prends un chiantos"},
	missdior     : {song: "user/troll.mp3",    message: "J’ai l’impression qu’il y a des haltères qui sortent de sa bouche car tout ce qui sort, c’est lourd."},
	imnotafraid  : {song: "user/solitude.mp3", message: "Il y a quelqu'un ?"},
	"#love"      : {song: "user/love.mp3",     message: "Il y a le Grand Canyon entre elles en terme d'amitié."},

	ping         : {song: "user/ping.mp3", message: "pong !"},
	pong         : {song: "user/ping.mp3", message: "ping !"},
	
	cthulhu      : {message: "Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn"},
	necronomicon : {message: "N'est pas mort ce qui à jamais dort et au long des ères étranges peut mourir même la Mort"},

	team         : {message: "ON S'EN BRANLE DE TES CONSEILS !! Si on veut jouer un champion c que l'on sait comment le jouer !!! S non on demanderait des conseils !!"}

};

fs.readdirSync('./music/', (err, files) => {
	files.forEach(file => {
		if (file.endsWith(".mp3")){
			var fileName = file.split('.')[0]
			commands[fileName] = {song: file};
		} else {
			var dir = (file != "user" ? file : "");
			fs.readdirSync('./music/' + dir, (err, dirFiles) => {commands[dir] = {folder: dir, choices: dirFiles, available: dirFiles.length};});
		}
	});
});

module.exports = commands;