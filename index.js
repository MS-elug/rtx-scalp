require("dotenv").config();
const startMaterielNetScalping = require("./scalp-runner/materiel-net").startScalping;
const startSmidistriScalping = require("./scalp-runner/smidistri").startScalping;
const Discord = require("discord.js");
const client = new Discord.Client();

client.once("ready", async () => {
	console.log("Ready!");
	const guild = client.guilds.cache.find((guild) => guild.name === "MillionNftWall");
	const channel = guild.channels.cache.find((channel) => channel.name === "scalp-rtx");
	console.log("Starting the scalp!");
	startMaterielNetScalping().subscribe((message) => {
		channel.send(message);
		console.log(message);
	});

	startSmidistriScalping().subscribe((message) => {
		channel.send(message);
		console.log(message);
	});
});

client.on("message", (message) => {
	if (message.content === "!ping") {
		// send back "Pong." to the channel the message was sent in
		message.channel.send("Pong.");
	}
});

client.login(process.env.DISCORD_BOT_TOKEN);
