const axios = require("axios");
const { Subject } = require("rxjs");
const qs = require("qs");
const cheerio = require("cheerio");
const rtx3080Page = "https://www.materiel.net/carte-graphique/l426/+fv121-19183/";
const rtx3070Page = "https://www.materiel.net/carte-graphique/l426/+fv121-19184/";
const rtx3060Page = "https://www.materiel.net/carte-graphique/l426/+fv121-19509/";

const productStockStatus = new Map();

function startScalping() {
	const subject = new Subject();

	// channel.send("Starting the scalp! for materiel.net - refresh every minute");
	function runScalping() {
		getStock(subject, rtx3080Page);
		//getStock(subject, rtx3070Page);
		//getStock(subject, rtx3060Page);
		setTimeout(() => {
			runScalping();
		}, 60000 + Math.floor(Math.random() * 10000));
	}
	runScalping();

	return subject;
}

async function getStock(subject, rtxShoppingPage) {
	try {
		console.log(`Check stock value for: ${rtxShoppingPage}`);
		const defaultHeaders = {
			origin: "https://www.materiel.net",
			"cache-control": "no-cache",
			pragma: "no-cache",
			"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.128 Safari/537.36",
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
						"x-requested-with": "XMLHttpRequest",
					},
				})
			).data;

			const articleKeys = Object.keys(stockPrice.stock);
			for (const articleKey of articleKeys) {
				const previousStockStatus = productStockStatus.get(articleKey);
				const stockStatus = cheerio.load(stockPrice.stock[articleKey]).text();
				const available = stockStatus.indexOf("Rupture") === -1;
				productStockStatus.set(articleKey, stockStatus);
				if (typeof previousStockStatus === "string" && previousStockStatus !== stockStatus) {
					const articleRawId = articleKey.split("AR")[1];
					const price = cheerio.load(stockPrice.price[articleKey]).text();
					let message = `Graphic card is out of stock: https://www.materiel.net/produit/${articleRawId}.html at price ${price} | status: ${stockStatus}`;
					if (available) {
						message = `Graphic card is in stock: https://www.materiel.net/produit/${articleRawId}.html at price ${price} | status: ${stockStatus}`;
					}
					subject.next(message);
				}
			}
		}
	} catch (err) {
		console.log(err);
	} finally {
		console.log(`Completed stock check for: ${rtxShoppingPage}`);
	}
}

module.exports = { startScalping };
