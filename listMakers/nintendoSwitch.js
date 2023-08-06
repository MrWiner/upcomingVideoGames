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

      $('.clamp-list .title').each((index, element) => {
        const title = $(element).find('h3').text().trim();
        const releaseDateStr = $(element)
          .next('.clamp-details')
          .find('span:not(.label)')
          .last()
          .text()
          .trim();
        const releaseDate = moment(releaseDateStr, 'MMMM D, YYYY');

        if (
          releaseDate.isSameOrAfter(nowDate) &&
          releaseDate.isBefore(nowDate.clone().add(nextDays, 'days'))
        ) {
          gameTitles.push({
            title,
            releaseDate: releaseDate.format('MMMM D, YYYY'),
          });
        }
      });

      return gameTitles;
    } catch (err) {
      console.log(err);
      return err;
    }
  }
}

module.exports = nintendoSwitch;
