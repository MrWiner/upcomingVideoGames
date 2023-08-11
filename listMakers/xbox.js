const cheerio = require('cheerio');
const axios = require('axios');

class Xbox {
  static async getUpcomingGames(url) {
    try {
      const response = await axios.get(url);
      const $list = cheerio.load(response.data);

      const items = $list('li.col');

      for (const item of items) {
        const link = $list(item).find('a');
        const itemUrl = link.attr('href');

        const itemResponse = await axios.get(itemUrl);
        const $item = cheerio.load(itemResponse.data);
        const detailsRows = $item('.Description-module__details___34Tnw');

        let publisher, releaseDate;

        for (const row of detailsRows) {
          const $row = $item(row);
          const detailsText = $row.html();
          const $ = cheerio.load(detailsText);
          $('h3').each((index, element) => {
            const headerText = $(element).text().trim();
            const contentText = $(element)
              .next('.typography-module__xdsBody2___RNdGY')
              .text()
              .trim();

            if (headerText === 'Published by') {
              publisher = contentText;
            } else if (headerText === 'Release date') {
              releaseDate = contentText;
            }
          });
        }
        const releaseDateText = releaseDate.split('\n')[0].trim();
        const releaseDateObj = new Date(releaseDateText);
        const timeDiff = releaseDateObj - new Date();
        const daysUntilRelease = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        if (daysUntilRelease <= 10) {
          const priceElement = $item(
            '.ProductDetailsHeader-module__price___-NaHV .Price-module__boldText___vmNHu'
          );

          const price = priceElement.text();

          const itemNameElement = $item('.ProductDetailsHeaderProductTitle');
          const itemName = itemNameElement.text();

          console.log(`Item Name: ${itemName}`);
          console.log(`Publisher: ${publisher}`);
          console.log(`Price: ${price}`);
          console.log(`Release Date: ${releaseDateText}\n`);
        } else {
          console.log('rldate issue');
          break;
        }
      }

      await browser.close();
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
}

module.exports = Xbox;
