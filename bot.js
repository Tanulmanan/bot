// external library imports
require("dotenv").config();
const puppeteer = require("puppeteer-extra");

// user agent data
const userData = {
  email: process.env.EMAIL,
  password: process.env.PASSWORD,
  cvc: process.env.CVC,
};

// scroll to selector helper function
const scrollToSelector = async (page, selector) => {
  await page.waitForSelector(selector);
  await page.evaluate((selector) => {
    document.querySelector(selector).scrollIntoView();
  }, selector);
};

// main flow
const main = async () => {
  const browser = await puppeteer.launch({
    args: ["--disable-web-security", '--disable-features=IsolateOrigins,site-per-process'],
    ignoreHTTPSErrors: true,
    headless: false,
  });

  const page = await browser.newPage();

  // go to url
  await page.goto(process.env.URL, { waitUntil: "networkidle0" });

  // scoll to size
  await scrollToSelector(page, ".buying-tools-container");

  // click on size
  await async function () {
    await page.evaluate((_size) => {
      const sizes = Array.from(document.querySelectorAll(".size-layout > li"));
      for (const size of sizes) {
        const btn = size.firstElementChild
        if (btn.innerHTML === _size) {
          btn.click();
        }
      }
    }, process.env.SIZE);
  }()

  // scroll to add to cart
  await scrollToSelector(page, "button[data-qa=add-to-cart]");

  // click on add to cart
  await async function () {
    await page.evaluate(() => {
      const btn = document.querySelector("button[data-qa=add-to-cart]")
      btn.click()
    })
  }()

  // wait for pop-up
  await page.waitForSelector("button[data-qa=checkout-link]");

  // click on checkout
  await async function () {
    await page.evaluate(() => {
      const btn = document.querySelector("button[data-qa=checkout-link]")
      btn.click()
    })
  }()

  // wait for sign in form
  await page.waitForSelector(".nike-unite-form");

  // fill sign in form 
  await async function () {
    await page.type("input[data-componentname=emailAddress]", userData.email, { delay: 50 });
    await page.type("input[data-componentname=password]", userData.password, { delay: 50 });
  }()

  // click keep me signed in
  await async function () {
    await page.evaluate(() => {
      const btn = document.querySelector("#keepMeLoggedIn > input")
      btn.click()
    })
  }()

  // click on sign in form
  await async function () {
    await page.evaluate(() => {
      const btn = document.querySelector(".nike-unite-submit-button")
      btn.firstElementChild.click()
    })
  }()

  // SECTION - error message
  // wait for error message
  await page.waitForSelector(".error-code-btn")
  await async function () {
    await page.evaluate(() => {
      const btn = document.querySelector(".error-code-btn")
      btn.click()
    })
  }()
  // !SECTION

  // wait for shipping
  await page.waitForSelector("#shipping");
  await scrollToSelector(page, ".continuePaymentBtn");

  // click on continue payment button
  await async function () {
    await page.evaluate(() => {
      const btn = document.querySelector(".continuePaymentBtn")
      btn.click()
    })
  }()

  // wait for a two seconds
  await page.waitFor(2000)

  // scroll to payment
  await scrollToSelector(page, "#payment")

  // fill in CVC
  await async function () {
    const elementHandle = await page.$("iframe.credit-card-iframe-cvv");
    const frame = await elementHandle.contentFrame();
    await frame.type("form#creditCardForm >div > input", userData.cvc, { delay: 50 })
  }()

  // click review order button
  await async function () {
    await page.evaluate(() => {
      const btn = document.querySelector(".continueOrderReviewBtn")
      btn.click()
    })
  }()

  // wait for place order button
  await page.waitForSelector(".placeOrderBtn")

  // click place order button
  await async function () {
    await page.evaluate((buy) => {
      const btn = document.querySelector(".placeOrderBtn")
      if (buy) {
        btn.click()
      } else {
        btn.innerHTML = "Clicking this will buy the shoe"
      }
    }, process.env.BUY == "YES")
  }()
};

main();
