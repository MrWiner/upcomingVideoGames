const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const nintendoSwitch = require('./listMakers/nintendoSwitch');
const ExcelJS = require('exceljs');

app.use(bodyParser.json());
app.use(cors());

const port = process.env.PORT || 4000;

app.listen(port, () => console.log(`server started on port ${port}`));

const list = require('./routes/api/list');

app.use('/api/list', list);

async function main() {
  const a = await nintendoSwitch.nintendoWebsite('World War: Combat Guardian');
  console.log(a);
  // const workbook = new ExcelJS.Workbook();
  // const worksheet = workbook.addWorksheet('Sheet1');
  // const columns = [
  //   { header: 'Title', key: 'title', width: 15 },
  //   { header: 'Release Date', key: 'releaseDate', width: 15 },
  //   { header: 'Metacritic Link', key: 'metacriticLink', width: 20 },
  //   { header: 'Publisher', key: 'publisher', width: 25 },
  //   { header: 'also on', key: 'alsoOnPlatforms', width: 30 },
  //   { header: 'Nintendo Link', key: 'nintendoLink', width: 20 },
  //   { header: 'Price', key: 'regularPrice', width: 5 },
  // ];
  // worksheet.columns = columns;

  // a.forEach((rowData) => {
  //   worksheet.addRow(rowData);
  // });

  // const excelFilePath =
  //   '/Users/moeinzavar/Desktop/upcomingVideoGames/excel/data2.xlsx';
  // workbook.xlsx
  //   .writeFile(excelFilePath)
  //   .then(() => {
  //     console.log(`Excel file "${excelFilePath}" created successfully.`);
  //   })
  //   .catch((error) => {
  //     console.error('Error creating Excel file:', error);
  //   });
}
main();
