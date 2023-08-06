const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const nintendoSwitch = require('./listMakers/nintendoSwitch');

app.use(bodyParser.json());
app.use(cors());

const port = process.env.PORT || 4000;

app.listen(port, () => console.log(`server started on port ${port}`));

const list = require('./routes/api/list');

app.use('/api/list', list);

async function main() {
  const a = await nintendoSwitch.getNintendoGamesTitles(4);
  console.log(a);
}
main();
