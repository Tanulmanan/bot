require("dotenv").config();
const puppeteer = require("puppeteer");

// main flow
const main = async () => {
  const browser = await puppeteer.launch({
    args: ["--disable-web-security"],
    ignoreHTTPSErrors: true,
    headless: process.env.BROWSER === "YES" ? false : true,
  });

  const page = await browser.newPage();

  const data = {
    firstName: process.env.FIRST_NAME,
    lastName: process.env.LAST_NAME,
    phone: process.env.PHONE,
    email: process.env.EMAIL,
    address: {
      line: process.env.ADDRESS_LINE,
      city: process.env.CITY,
      postCode: process.env.POSTCODE,
    },
    payment: {
      card: process.env.CARD,
      date: process.env.EXPIRY_DATE,
      cvc: process.env.CVC,
    },
  };

  // go to url
  await gotoURL(page, process.env.URL);

  // scoll to size selector
  await scrollToSelector(page, ".add-to-cart-form");

  // click on size
  await pickSize(page, process.env.SIZE);

  // scroll to add to cart
  await scrollToSelector(page, ".add-to-cart-btn");

  // click on add to cart then checkout
  await addToCart(page);
  page.waitFor(2000);

  // scroll to checkout button
  await scrollToSelector(page, "button[data-automation=go-to-checkout-button]");

  // click on checkout button
  await checkout(page);

  // fill guest form
  await fillForm(page, data);

  // place order
  // NOTE - make sure to debug with BROWSER=YES because might need pre payment approval
  await page.waitForSelector("button.placeOrderBtn");
  if (process.env.BUY === "YES") {
    await page.evaluate(() => {
      document.querySelector("button.placeOrderBtn").click();
    });
  } else {
    await page.evaluate(() => {
      document.querySelector("button.placeOrderBtn").innerHTML =
        "CLICK HERE TO BUY";
    });
  }

  // wait for a minute before closing browser
  await page.waitFor(60 * 1000);
  await browser.close();
};

const gotoURL = async (page, url) => {
  await page.goto(url, { waitUntil: "networkidle0" });
};

const scrollToSelector = async (page, selector) => {
  await page.waitForSelector(selector);
  await page.evaluate((selector) => {
    document.querySelector(selector).scrollIntoView();
  }, selector);
};

const pickSize = async (page, size) => {
  await page.evaluate((size) => {
    const sizes = Array.from(
      document.querySelectorAll("#buyTools > div > fieldset > div > div")
    );
    const desiredSize = sizes.find((s) => {
      return s.children[1].innerHTML === size;
    });
    desiredSize.children[1].click();
  }, size);
};

const addToCart = async (page) => {
  await page.evaluate(() => {
    document.querySelector(".add-to-cart-btn").click();
  });
  const checkoutSelector = "button[data-test=qa-cart-checkout]";
  await page.waitForSelector(checkoutSelector);
  await page.evaluate((selector) => {
    document.querySelector(selector).click();
  }, checkoutSelector);
};

const checkout = async (page) => {
  await page.evaluate(() => {
    document
      .querySelector("button[data-automation=go-to-checkout-button]")
      .click();
  });
  const guestCheckoutSelector = "button[data-automation=guest-checkout-button]";
  await page.waitForSelector(guestCheckoutSelector);
  await page.evaluate((selector) => {
    document.querySelector(selector).click();
  }, guestCheckoutSelector);
};

const fill = async (page, selector, data) => {
  await page.type(selector, data, { delay: 100 });
};

const fillForm = async (
  page,
  { firstName, lastName, email, phone, address, payment }
) => {
  await page.waitForSelector("#shipping");

  // wait for inputs to load up
  await page.waitFor(2000);

  await page.evaluate(() => {
    document.querySelector("a#addressSuggestionOptOut").click();
  });

  await page.waitFor(2000);

  await fill(page, "input#firstName", firstName);
  await fill(page, "input#lastName", lastName);
  await fill(page, "input#email", email);
  await fill(page, "input#phoneNumber", phone);
  // NOTE - make sure nike likes the address
  await fill(page, "input#address1", address.line);
  await fill(page, "input#city", address.city);
  await fill(page, "input#postalCode", address.postCode);

  await page.evaluate(() => {
    document.querySelector("button.saveAddressBtn").click();
  });

  await page.waitFor(2000);

  await page.evaluate(() => {
    document.querySelector("button.continuePaymentBtn").click();
  });

  await page.waitFor(2000);
  await scrollToSelector(page, ".credit-card-iframe");
  const elementHandle = await page.$(".credit-card-iframe");
  const frame = await elementHandle.contentFrame();
  await fill(frame, "input#creditCardNumber", payment.card);
  await fill(frame, "input#expirationDate", payment.date);
  await fill(frame, "input#cvNumber", payment.cvc);

  await page.waitFor(2000);
  await page.evaluate(() => {
    document.querySelector("button.continueOrderReviewBtn").click();
  });
};

main();
