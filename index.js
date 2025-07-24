require('dotenv').config();
let dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
let mongoose = require('mongoose');

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

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define a simple schema for URL mapping
const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number, required: true, unique: true }
});
const Url = mongoose.model('Url', urlSchema);

app.post('/api/shorturl', express.urlencoded({ extended: false }), async function(req, res) {
  const url = req.body.url;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  // Validate the URL format
  let hostname;
  try {
    hostname = new URL(url).hostname;
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL' });
  }
  // Check if the URL is DNS resolvable
  dns.lookup(hostname, { all: false }, async (err) => {
    if (err) {
      return res.status(400).json({ error: 'Invalid URL' });
    }
    try {
      // If valid, check db for existing URL
      let foundUrl = await Url.findOne({ original_url: url });
      if (foundUrl) {
        return res.json({ original_url: foundUrl.original_url, short_url: foundUrl.short_url });
      } else {
        // If not found, create a new short URL
        let count = await Url.countDocuments({});
        const newUrl = new Url({
          original_url: url,
          short_url: count + 1 // Incrementing the count for unique short URL
        });
        let savedUrl = await newUrl.save();
        return res.json({ original_url: savedUrl.original_url, short_url: savedUrl.short_url });
      }
    } catch (dbErr) {
      return res.status(500).json({ error: 'Database error' });
    }
  });
});


app.get('/api/shorturl/:short_url', async function(req, res) {
  const shortUrl = req.params.short_url;
  try {
    const foundUrl = await Url.findOne({ short_url: shortUrl });
    if (!foundUrl) {
      return res.status(404).json({ error: 'Short URL not found' });
    }
    // Redirect to the original URL
    res.redirect(foundUrl.original_url);
  } catch (err) {
    return res.status(500).json({ error: 'Database error' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
