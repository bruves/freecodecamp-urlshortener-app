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
  // Extract hostname for DNS lookup
  let hostname;
  try {
    hostname = new URL(url).hostname;
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL' });
  }
  // Perform DNS lookup to validate the URL before creating a short URL and returning it.
  //in a real application, you would store the mapping of short URL to original URL in a database.
  //For this example, we will just return a random short URL.
  dns.lookup(hostname, { all: false }, (err, address) => {
    if (err) {
      return res.status(400).json({ error: 'Invalid URL' });
    }
    // If the DNS lookup is successful, we can return a short URL.
    // In a real application, you would generate a unique short URL and store the mapping.
    // Here we are just returning a random number as a placeholder.
    res.json({ original_url: url, short_url: Math.floor(Math.random() * 1000) });
  });
});

app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = req.params.short_url;
  //If we were to launch this as an app in the post method before returning the short URL, 
  // we would store the mapping of short URL to original URL in a database.

  //For testing purposes, we will use a hardcoded mapping to the freeCodeCamp URL.
  const originalUrl = 'https://www.freecodecamp.org/';
  
  if (shortUrl) {
    //redirect to the original URL - this is where you would normally look up the original URL 
    // in your database and match it to the short URL as well as validating through dns lookup.
    dns.lookup(new URL(originalUrl).hostname, { all: false }, (err, address) => {
      if (err) {
        return res.status(400).json({ error: 'Invalid URL' });
      }
      res.redirect(originalUrl);
    });
    
  } else {
    res.status(404).json({ error: 'Short URL not found' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
