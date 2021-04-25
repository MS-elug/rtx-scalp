require("dotenv").config();
const { remote } = require("webdriverio");

async function bookProduct(productPageUrl) {
	if (!process.env.MATERIEL_NET_PASSWORD || !process.env.MATERIEL_NET_EMAIL) {
		throw new Error(`Missing env variables: MATERIEL_NET_EMAIL or MATERIEL_NET_PASSWORD`);
	}
	let browser;
	try {
		// Open a chrome instance
		browser = await remote({
			capabilities: {
				browserName: "chrome",
			},
		});
		await browser.url(productPageUrl);

		// Accept cookies - to allow page to store product in cart
		const acceptCookieButton = await browser.$("#cookieConsentAccept");
		await acceptCookieButton.click();

		// Wait a bit
		await new Promise((resolve) => {
			setTimeout(() => {
				resolve();
			}, 2000);
		});

		// Add the product to the cart
		const addToCartButton = await browser.$(".c-product__cart-zone .o-btn__add-to-cart");
		await addToCartButton.click();

		// Wait the product to be added in the cart
		const iconCartCount = await browser.$("#header-item-cart .c-access__icon .c-icon__count");
		await iconCartCount.waitUntil(
			async function () {
				try {
					const count = await this.getText();
					console.log(typeof count, count);
					return typeof count === "string" && count.trim() === "1";
				} catch (err) {
					console.error(err);
				}
				return false;
			},
			{
				timeout: 5000,
				timeoutMsg: "expected text to be different after 5s",
			}
		);
		// Open the cart
		const openCarLink = await browser.$("#header-item-cart .c-access__link a");
		await openCarLink.click();

		// Confirm the order
		const orderButton = await browser.$(".o-btn--order");
		await orderButton.waitForDisplayed();
		await orderButton.click();

		// Cancel the insurrance proposal
		const cancelInsurranceLink = await browser.$(".o-btn--thin-cancel");
		await orderButton.waitForDisplayed();
		cancelInsurranceLink.click();

		// Fill the login page
		const emailInput = await browser.$("input[name='Email']");
		await emailInput.waitForDisplayed();
		await emailInput.setValue(process.env.MATERIEL_NET_EMAIL);
		const passwordInput = await browser.$("input[name='Password']");
		await passwordInput.setValue(process.env.MATERIEL_NET_PASSWORD);
		const stayConnectedInput = await browser.$("input[name='LongAuthenticationDuration']");
		await stayConnectedInput.click();
		const submitButton = await browser.$("button[type='submit']");
		await submitButton.click();

		// Stop here an give hand to the user for 15 minutes
		console.warn(`Keep the browser session for the user to interact`);
		await new Promise((resolve) => {
			setTimeout(() => {
				resolve();
			}, 15 * 60000);
		});

		await browser.deleteSession();
	} catch (err) {
		console.error(err);
		if (browser) {
			console.warn(`Keep the browser session for the user to interact`);
			// In case of unexpected issue (UI change for instance) - let the user to recover manually
			await new Promise((resolve) => {
				setTimeout(() => {
					resolve();
				}, 15 * 60000);
			});
			browser.debug();
			await browser.deleteSession();
		}
	}
}

module.exports = { bookProduct };
