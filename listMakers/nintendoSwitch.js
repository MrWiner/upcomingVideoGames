const cheerio = require('cheerio');
const axios = require('axios');
const moment = require('moment');

class nintendoSwitch {
  static async getNintendoGamesTitles(nextDays) {
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

          gameTitles.push({
            title,
            releaseDate: releaseDate.format('MMMM D, YYYY'),
            link: clickLink,
            publisher: publisher,
            alsoOnPlatforms: alsoOnPlatforms,
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
