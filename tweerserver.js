// tweetserver.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Configuration
const PORT = process.env.PORT || 5003;
const MONGO_URI = process.env.MONGO_URI;

// Initialize Express
const app = express();
app.use(express.json());
app.use(cors()); // Enable CORS for all requests

// Database Connection
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB', err));

// Define the Tweet Model (Mongoose Schema)
const tweetSchema = new mongoose.Schema({
  content: { type: String, required: true, maxlength: 280 },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  mediaIds: [{ type: mongoose.Schema.Types.ObjectId }],
  isThread: { type: Boolean, default: false },
  parentTweetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tweet' },
  hashtags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

const Tweet = mongoose.model('Tweet', tweetSchema);

// Utility Function to Extract Hashtags
const extractHashtags = (content) => {
  const hashtagRegex = /#\w+/g;
  return content.match(hashtagRegex) || [];
};

// Controller Functions
const createTweet = async (req, res) => {
  try {
    const { content, userId, mediaIds, isThread, parentTweetId } = req.body;

    // Validate content length
    if (!content || content.length > 280) {
      return res.status(400).json({ error: 'Content is required and should not exceed 280 characters.' });
    }
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required.' });
    }

    // Create the tweet
    const tweet = new Tweet({
      content,
      userId,
      mediaIds,
      isThread,
      parentTweetId,
      hashtags: extractHashtags(content),
    });

    // Save the tweet to the database
    await tweet.save();
    res.status(201).json({ message: 'Tweet created successfully', tweet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all tweets
const getTweets = async (req, res) => {
  try {
    const tweets = await Tweet.find().sort({ createdAt: -1 }); // Retrieve tweets in descending order
    res.status(200).json(tweets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Routes
app.post('/api/tweets', createTweet);
app.get('/api/tweets', getTweets);

app.get('/', (req, res) => {
  res.status(200).json({ message: 'twitter-tweet Service is up and running!' });
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Tweet Service is running on port ${PORT}`);
});
