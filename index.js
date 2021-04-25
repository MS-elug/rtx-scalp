require("dotenv").config();

const { merge } = require("rxjs");

const startMaterielNetScalping = require("./scalp-runner/materiel-net").startScalping;
const bookMaterielNetProduct = require("./scalp-order/materiel-net").bookProduct;
const startSmidistriScalping = require("./scalp-runner/smidistri").startScalping;

const Discord = require("discord.js");
const client = new Discord.Client();

if (!process.env.DISCORD_BOT_TOKEN || !process.env.DISCORD_GUILD || !process.env.DISCORD_CHANNEL) {
	console.error(new Error(`Missing environement variables: one of DISCORD_BOT_TOKEN | DISCORD_GUILD | DISCORD_CHANNEL`));
	process.exit(0);
}
try {
	client.once("ready", async () => {
		try {
			console.log("Ready!");
			const guild = client.guilds.cache.find((guild) => guild.name === process.env.DISCORD_GUILD);
			const channel = guild.channels.cache.find((channel) => channel.name === process.env.DISCORD_CHANNEL);
			const members = await guild.members.fetch();
			const totalOnline = members.filter((member) => member.presence.status === "online");
			const usersToNotify = members
				.filter((member) => {
					return member.user.username === "makidomaki";
				})
				.map((member) => member.user.id);

			merge(startMaterielNetScalping(), startSmidistriScalping()).subscribe((scalp) => {
				channel.send(scalp.message + `<@${usersToNotify[0]}>`);
				console.log(scalp);
				if (
					typeof scalp.productTile === "string" &&
					typeof scalp.url === "string" &&
					(scalp.productTile.toLowerCase().indexOf("msi") !== -1 || scalp.productTile.toLowerCase().indexOf("asus") !== -1) &&
					process.env.MATERIEL_NET_PASSWORD &&
					process.env.MATERIEL_NET_EMAIL
				) {
					if (scalp.src === "materiel.net") {
						console.log(`Starting a browser session to prepare the order`);
						bookMaterielNetProduct(scalp.url);
					}
				}
			});
		} catch (err) {
			console.error(err);
			process.exit(1);
		}
	});

	client.on("message", (message) => {
		if (message.content === "!ping") {
			// send back "Pong." to the channel the message was sent in
			message.channel.send("Pong.");
		}
	});

	client.login(process.env.DISCORD_BOT_TOKEN);
} catch (err) {
	console.error(err);
	process.exit(1);
}
