const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');
const pw = require('playwright');

class NintendoSwitch {
  static async nintendoWebsite(title) {
    const browser = await pw.chromium.connectOverCDP(
      'wss://chrome.browserless.io?token=' + process.env.TOKEN
    );

    let nintendoData = {};
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(
        'https://www.nintendo.com/search/#q=' +
          title +
          '&p=1&cat=gme&sort=df&f=corePlatforms&corePlatforms=Nintendo+Switch'
      );

      await page.waitForSelector('[class^="BasicTilestyles__Tile-sc-"]');

      const nintendoLink = await page.evaluate((title) => {
        const anchors = Array.from(
          document.querySelectorAll('[class^="BasicTilestyles__Tile-sc-"]')
        );
        const anchor = anchors.find(
          (a) =>
            a.getAttribute('aria-label').toLowerCase() === title.toLowerCase()
        );
        return anchor ? anchor.href : 'Not Found';
      }, title);

      if (nintendoLink !== 'Not Found') {
        await page.goto(nintendoLink);

        await page.waitForTimeout(500);

        const monthInput = await page.$('input[name="month"]');
        const dayInput = await page.$('input[name="day"]');
        const yearInput = await page.$('input[name="year"]');
        const submitButton = await page.$('button[name="submit"]');

        if (monthInput && dayInput && yearInput && submitButton) {
          // Handle Age Verification
          await monthInput.type('12');
          await dayInput.type('15');
          await yearInput.type('1999');
          await submitButton.click();
        }

        const price = await page.waitForSelector(
          '[class^="Pricestyles__MSRP-sc-"]'
        );
        const priceText = await price.evaluate((element) =>
          element.textContent.trim().replace('Regular Price:', '').trim()
        );

        if (priceText) {
          nintendoData.price = priceText;
        } else {
          nintendoData.price = 'No Price Found';
        }
        nintendoData.url = nintendoLink;
      } else {
        nintendoData.url = 'Not Found';
      }
    } catch (err) {
      console.log(err);
      nintendoData.price = 'error';
      nintendoData.url = 'error';
    } finally {
      await browser.close();
    }
    return nintendoData;
  }

  static async getUpcomingGames(nextDays) {
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
            .map((i, el) => $(el).text().trim())
            .get();

          gameTitles.push({
            title: title,
            releaseDate: releaseDate.format('MMMM D, YYYY'),
            metacriticLink: clickLink,
            publisher: publisher,
            alsoOnPlatforms: alsoOnPlatforms,
            // nintendoLink: nintendoLink,
            // regularPrice: regularPrice,
          });
        }
      }

      const batches = this.createBatches(gameTitles, 10);

      const processedTitleBatches = await Promise.all(
        batches.map(async (batch) => {
          return await this.processBatchOfTitles(batch);
        })
      );

      for (let i = 0; i < processedTitleBatches.length; i++) {
        const nintendoDataBatch = processedTitleBatches[i];
        const batch = batches[i];

        for (let j = 0; j < nintendoDataBatch.length; j++) {
          const nintendoData = nintendoDataBatch[j];
          const index = i * 10 + j;

          batch[j].nintendoLink = nintendoData.nintendoLink;
          batch[j].regularPrice = nintendoData.regularPrice;
        }
      }

      return this.mergeBatches(batches);
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  static createBatches(inputArray, batchSize) {
    const batches = [];
    const totalItems = inputArray.length;

    for (let i = 0; i < totalItems; i += batchSize) {
      batches.push(inputArray.slice(i, i + batchSize));
    }

    return batches;
  }

  static mergeBatches(batches) {
    const mergedArray = [].concat(...batches);
    return mergedArray;
  }

  static async processBatchOfTitles(titles) {
    const promises = titles.map(async (title) => {
      const nintendoData = await this.nintendoWebsite(title.title);
      const nintendoLink = nintendoData.url;
      const regularPrice = nintendoData.price;
      return {
        nintendoLink: nintendoLink,
        regularPrice: regularPrice,
      };
    });

    return await Promise.all(promises);
  }
}

module.exports = NintendoSwitch;
