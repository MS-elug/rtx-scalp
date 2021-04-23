const axios = require("axios");
const { Subject } = require("rxjs");
const cheerio = require("cheerio");

const rtx3080Page = "https://www.smidistri.com/131-cartes-graphiques-nvidia/price-199-3480/chipset_graphique-geforce_rtx_3080";
const rtx3070Page = "https://www.smidistri.com/131-cartes-graphiques-nvidia/price-199-3480/chipset_graphique-geforce_rtx_3070";
const rtx3060Page = "https://www.smidistri.com/131-cartes-graphiques-nvidia/price-199-3480/chipset_graphique-geforce_rtx_3060";

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
			origin: "https://www.smidistri.com",
			"cache-control": "no-cache",
			pragma: "no-cache",
			"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.128 Safari/537.36",
		};
		const avail = (await axios.get(rtxShoppingPage, { responseType: "text", headers: { ...defaultHeaders } })).data;
		const $ = cheerio.load(avail);
		$(".ajax_block_product.item").each(function (i, elem) {
			const link = $("a.product_img_link", elem).attr("href");
			const articleKey = link;
			const stockStatus = $(".stocks #dispolettres", elem).text();
			let price = $(".prices .prix-avecReduc", elem).text();
			if (!price) {
				price = $(".prices .price#avecAvis", elem).text();
			}

			const previousStockStatus = productStockStatus.get(articleKey);
			const available = stockStatus.indexOf("En arrivage") === -1;
			productStockStatus.set(articleKey, stockStatus);
			if (typeof previousStockStatus === "string" && previousStockStatus !== stockStatus) {
				let message = `Graphic card is out of stock: ${link} at price ${price} | status: ${stockStatus}`;
				if (available) {
					message = `Graphic card is in stock: ${link} at price ${price} | status: ${stockStatus}`;
				}
				subject.next(message);
			}
		});
	} catch (err) {
		console.log(err);
	} finally {
		console.log(`Completed stock check for: ${rtxShoppingPage}`);
	}
}

module.exports = { startScalping };
