require("dotenv").config();
const startMaterielNetScalping = require("./scalp-runner/materiel-net").startScalping;
const startSmidistriScalping = require("./scalp-runner/smidistri").startScalping;
const Discord = require("discord.js");
const client = new Discord.Client();


if(!process.env.DISCORD_BOT_TOKEN || !process.env.DISCORD_GUILD || !process.env.DISCORD_CHANNEL){
	console.error(new Error(`Missing environement variables: one of DISCORD_BOT_TOKEN | DISCORD_GUILD | DISCORD_CHANNEL`));
	process.exit(0);
}

client.once("ready", async () => {
	console.log("Ready!");
	const guild = client.guilds.cache.find((guild) => guild.name === process.env.DISCORD_GUILD);
	const channel = guild.channels.cache.find((channel) => channel.name === process.env.DISCORD_CHANNEL);
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
