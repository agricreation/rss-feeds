const express = require('express');
const app = express();
const axios = require('axios');
const Parser = require('rss-parser');
const parser = new Parser();
const { WebhookClient } = require('discord.js');
require('dotenv').config();

const webhookUrl = process.env.WEBHOOK_URL;
const timerTimeout =process.env.TIMER_TIMEOUT;
app.get('/', (req, res) => {
  res.send('Welcome');
});

const rssFeeds = [
  { name: 'Gadget 360', url: 'https://www.gadgets360.com/rss/feeds' },
  { name: '9 to 5 mac', url: 'https://9to5mac.com/feed/' },
  { name: '9 to 5 google', url: 'https://9to5google.com/feed/' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
  { name: 'The economic time', url: 'https://economictimes.indiatimes.com/rssfeeds/13357270.cms' },
  { name: 'News 18 tech', url: 'https://www.news18.com/rss/tech.xml' },
  { name: 'Business today', url: 'https://www.businesstoday.in/rssfeeds/?id=home' },
  { name: 'Beembom tech', url: 'https://beebom.com/category/tech//feed' },
  { name: 'Tech news world', url: 'https://www.technewsworld.com/feed/' },
  { name: 'Tech Crunch', url: 'https://techcrunch.com/feed/' },
  { name: 'Gizmod', url: 'https://gizmodo.com/rss' },
  { name: 'Gizmo china', url: 'https://www.gizmochina.com/feed/' },
  { name: 'Venruter beat', url: 'https://feeds.feedburner.com/venturebeat/SZYF' },
  { name: 'Digital trend', url: 'https://www.digitaltrends.com/feed/' },
  { name: 'Mashable', url: 'https://in.mashable.com/tech.xml' },
  { name: 'The information', url: 'https://www.theinformation.com/feed' },
  { name: 'Engadget', url: 'https://www.engadget.com/rss.xml' },
  { name: 'Arstechnica', url: 'https://arstechnica.com/gadgets/feed/' },
  // { name: 'Engadget', url: 'news' },
  // Add more websites and RSS feed URLs as needed
];

const previousItemGuids = {};

async function fetchRssFeed(rssFeedUrl) {
  try {
    const feed = await parser.parseURL(rssFeedUrl);
    return feed;
  } catch (error) {
    console.error(`Error fetching RSS feed for ${rssFeedUrl}:`, error);
  }
}

async function sendMessageToDiscord(message) {
  try {
    const webhookClient = new WebhookClient({ url: webhookUrl });

    await webhookClient.send(message);

    console.log('Message sent to Discord successfully!');
  } catch (error) {
    console.error('Error sending message to Discord:', error);
  }
}

async function checkAndSendMessage(webhookName, feed) {
  const firstItem = feed.items[0];
  const itemGuid = firstItem.guid;

  if (itemGuid !== previousItemGuids[webhookName]) {
    previousItemGuids[webhookName] = itemGuid;
    const title = firstItem.title;
    const link = firstItem.link;
    const message = `👇${webhookName}\n**${title}**\nLink: ${link}`;
    await sendMessageToDiscord(message);
  } else {
    console.log(`Duplicate item for ${webhookName}, skipping sending message.`);
  }
}

async function processRssFeed(webhookName, rssFeedUrl) {
  const feed = await fetchRssFeed(rssFeedUrl);
  if (feed) {
    await checkAndSendMessage(webhookName, feed);
  }
}

async function main() {
  try {
    for (let i = 0; i < rssFeeds.length; i++) {
      const { name, url } = rssFeeds[i];
      await processRssFeed(name, url);
    }
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    setTimeout(main, timerTimeout || 300000); // Time shedule timer
  }
}

const port = process.env.PORT || 1000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
  main();
});
