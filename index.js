require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URL);
const urlSchema = mongoose.Schema({
  original_url: String,
  short_url: String
});

const Url = mongoose.model("Url", urlSchema);
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post("/api/shorturl", function (req, res) {
  const { url } = req.body;
  let isUrlValid = /^(http(s):\/\/.)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/gi.test(url);
  if (!isUrlValid) return res.json({ error: "invalid url" });
  let short_url = generateShortCode(url);
  Url.create({ short_url, original_url: url })
    .then(urlObj => {
      let { original_url, short_url } = urlObj
      res.json({ original_url, short_url });
    })
    .catch(err => {
      console.log(err);
      res.json({ error: "Something went wrong" })
    });

});

// Your first API endpoint
app.get('/api/shorturl/:shortUrl', function (req, res) {
  Url.findOne({ short_url: req.params.shortUrl }).exec().then(url => {
    if (!url) return res.json({ error: "URL was not found" });
    res.redirect(url.original_url)
  }).catch(err => {
    res.json({ error: "Something went wrong" })
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

function generateShortCode(originalUrl) {
  const hash = crypto.createHash('sha256').update(originalUrl).digest('hex');
  const shortCode = hash.slice(0, 8);
  return shortCode;
}
