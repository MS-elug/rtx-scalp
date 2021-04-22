require("dotenv").config();
const axios = require("axios");
const Discord = require("discord.js");
const client = new Discord.Client();
const qs = require("qs");
const cheerio = require("cheerio");
const rtx3080Page = "https://www.materiel.net/carte-graphique/l426/+fv121-19183/";
const rtx3070Page = "https://www.materiel.net/carte-graphique/l426/+fv121-19184/";
const rtx3060Page = "https://www.materiel.net/carte-graphique/l426/+fv121-19509/";

const productAvailability = new Map();

client.once("ready", async () => {
	console.log("Ready!");
	const guild = client.guilds.cache.find((guild) => guild.name === "MillionNftWall");
	const channel = guild.channels.cache.find((channel) => channel.name === "scalp-rtx");
	console.log("Starting the scalp!");
    startMaterielNetScalping(channel);
});

client.on("message", (message) => {
	console.log(message.content);
	if (message.content === "!ping") {
		// send back "Pong." to the channel the message was sent in
		message.channel.send("Pong.");
	}
});

client.login(process.env.DISCORD_BOT_TOKEN);

function startMaterielNetScalping(channel) {
    channel.send("Starting the scalp! for materiel.net - refresh every minute");
	setInterval(() => {
		getMaterielNetStock(channel, rtx3080Page);
		getMaterielNetStock(channel, rtx3070Page);
		getMaterielNetStock(channel, rtx3060Page);
	}, 60000);
	getMaterielNetStock(channel, rtx3080Page);
	getMaterielNetStock(channel, rtx3070Page);
	getMaterielNetStock(channel, rtx3060Page);
}

async function getMaterielNetStock(channel, rtxShoppingPage) {
	try {
		console.log(`Check stock value for: ${rtxShoppingPage}`);
		const defaultHeaders = {
			origin: "https://www.materiel.net",
			"cache-control": "no-cache",
			pragma: "no-cache",
			"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.128 Safari/537.36",
			"x-requested-with": "XMLHttpRequest",
		};
		const avail = (await axios.get(rtxShoppingPage, { responseType: "text", headers: { ...defaultHeaders } })).data;
		// Prepare next call to get stock price
		const matches = avail.match(/dataLayout\.offerListJson[\s]?=[\s]?({.*})/);
		if (matches && matches.length === 2) {
			const offerListJson = JSON.parse(matches[1]);

			const body = {
				json: JSON.stringify({ ...offerListJson, shops: [{ shopId: -1 }] }),
				shopId: -1,
				displayGroups: "Web",
				shopsAvailability: JSON.stringify(
					offerListJson.offers.reduce((acc, offer) => {
						acc[offer.offerId] = "0";
						return acc;
					}, {})
				),
			};

			const stockPrice = (
				await axios.post("https://www.materiel.net/product-listing/stock-price/", qs.stringify(body), {
					responseType: "json",
					headers: {
						...defaultHeaders,
						referer: rtxShoppingPage,
						"content-type": "application/x-www-form-urlencoded; charset=UTF-8",
					},
				})
			).data;

			const articleKeys = Object.keys(stockPrice.stock);
			for (const articleKey of articleKeys) {
				const previousAvailability = productAvailability.get(articleKey);
				const newAvailability = stockPrice.stock[articleKey].indexOf("Rupture") === -1;
				productAvailability.set(articleKey, newAvailability);
				if (previousAvailability !== newAvailability) {
					const articleRawId = articleKey.split("AR")[1];
					const price = cheerio.load(stockPrice.price[articleKey]).text();
					if(newAvailability === true){
						channel.send(`Graphic card is in stock: https://www.materiel.net/produit/${articleRawId}.html at price ${price}`);
					}else{
						channel.send(`Graphic card is out of stock: https://www.materiel.net/produit/${articleRawId}.html at price ${price}`);
					}
				}
			}
		}
	} catch (err) {
		console.log(err);
	} finally{
		console.log(`Completed stock check for: ${rtxShoppingPage}`);
	}
}
