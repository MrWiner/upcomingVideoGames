const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const axios = require('axios');
const moment = require('moment');
require('dotenv').config();
const EventEmitter = require('events');

process.setMaxListeners(100);

class nintendoSwitch {
  static async nintendoWebsite(title) {
    const browser = await puppeteer.launch({
      headless: 'new',
    });
    let nintendoData = {};
    try {
      const page = await browser.newPage();
      await page.goto('https://www.nintendo.com');
      const buttonElement = await page.waitForSelector(
        '[class^="SearchInputstyles__Button-sc-"]'
      );
      await page.evaluate((element) => {
        element.click();
      }, buttonElement);
      await page.waitForSelector(
        '.AutoCompleteInputstyles__ActiveInput-sc-ax1lsj-1'
      );

      await page.type(
        '.AutoCompleteInputstyles__ActiveInput-sc-ax1lsj-1',
        title
      );
      await page.keyboard.press('Enter');

      await page.waitForNavigation({ waitUntil: 'networkidle0' });

      // Get the current URL after search
      const seachPageUrl = page.url();

      await page.goto(seachPageUrl);

      const nintendoURL = await page.evaluate((title) => {
        const anchorElements = document.querySelectorAll(
          'a.BasicTilestyles__Tile-sc-1bsju6x-1.XVRAb'
        );

        for (const anchor of anchorElements) {
          const gameName = anchor.getAttribute('aria-label');
          if (gameName === title) {
            return anchor.href;
          }
        }

        return 'Not Found';
      }, title);

      if (nintendoURL != 'Not Found') {
        nintendoData.url = nintendoURL;
        await page.goto(nintendoURL);

        const monthInput = await page.$('input[name="month"]');
        const dayInput = await page.$('input[name="day"]');
        const yearInput = await page.$('input[name="year"]');
        const submitButton = await page.$('button[name="submit"]');

        if (monthInput && dayInput && yearInput && submitButton) {
          //Handle Age Verification
          await monthInput.type('12');
          await dayInput.type('15');
          await yearInput.type('1999');
          await submitButton.click();
        }

        const price = await page.waitForSelector(
          '[class^="Pricestyles__MSRP-sc-"]'
        );

        const priceText = await price.evaluate((element) => {
          return element.textContent
            .trim()
            .replace('Regular Price:', '')
            .trim();
        });

        if (priceText) {
          nintendoData.price = priceText;
        } else {
          nintendoData.price = 'No Price Found';
        }
      } else {
        nintendoData.url = nintendoURL;
      }
    } catch (err) {
      console.log(err);
      nintendoData.price = 'error';
      nintendoData.url = 'error';
    }
    await browser.close();
    return nintendoData;
  }

  static async getNintendoGames(nextDays) {
    try {
      const metacriticURL =
        'https://www.metacritic.com/browse/games/release-date/coming-soon/switch/date';
      const response = await axios.get(metacriticURL);
      const $ = cheerio.load(response.data);
      const gameTitles = [];
      const nowDate = moment();

      for (const element of $('.clamp-list .title')) {
        const title = $(element).find('h3').text().trim();
        const releaseDateStr = $(element)
          .next('.clamp-details')
          .find('span:not(.label)')
          .last()
          .text()
          .trim();
        const releaseDate = moment(releaseDateStr, 'MMMM D, YYYY');
        const clickLink = $(element).attr('href');

        if (
          releaseDate.isSameOrAfter(nowDate) &&
          releaseDate.isBefore(nowDate.clone().add(nextDays, 'days'))
        ) {
          const productMetacriticURL =
            'https://www.metacritic.com/' + clickLink;

          const productResponse = await axios.get(productMetacriticURL);
          const product$ = cheerio.load(productResponse.data);

          const publisher = product$('.summary_detail.publisher .data a')
            .text()
            .trim();

          const alsoOnPlatforms = product$(
            '.summary_detail.product_platforms .data a'
          )
            .map((i, el) => product$(el).text().trim())
            .get();

          const nintendoData = await this.nintendoWebsite(title);
          const nintendoLink = nintendoData.url;
          const regularPrice = nintendoData.price;

          gameTitles.push({
            title: title,
            releaseDate: releaseDate.format('MMMM D, YYYY'),
            metacriticLink: clickLink,
            publisher: publisher,
            alsoOnPlatforms: alsoOnPlatforms,
            nintendoLink: nintendoLink,
            regularPrice: regularPrice,
          });
        }
      }

      return gameTitles;
    } catch (err) {
      console.log(err);
      return err;
    }
  }
}

module.exports = nintendoSwitch;
