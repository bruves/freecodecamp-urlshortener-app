require('dotenv').config();
let dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', express.urlencoded({ extended: false }), function(req, res) {
  const url = req.body.url;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  //validate URL through dns
  dns.lookup(url, { all: false }, (err, address) => {
    if (err) {
      return res.status(400).json({ error: 'Invalid URL' });
    }
    console.log(`DNS lookup successful for ${url}: ${address}`);
  });

  res.json({ original_url: url, short_url: Math.floor(Math.random() * 1000) });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
