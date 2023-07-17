const express = require('express');
const app = express();
const axios = require('axios');
const Parser = require('rss-parser');
const parser = new Parser();
const { WebhookClient } = require('discord.js');
require('dotenv').config();

const webhookUrl = process.env.WEBHOOK_URL;

app.get('/', (req, res) => {
  res.send('Welcome');
});

app.listen(1000, () => {
  console.log('Listening on port 1000');
});

const rssFeeds = [
  { name: 'Gadget360', url: 'https://www.gadgets360.com/rss/feeds' },
  { name: 'nineToFiveMac', url: 'https://9to5mac.com/feed/' },
];

const previousItemGuids = {};

async function fetchRssFeed(rssFeedUrl) {
  try {
    const feed = await parser.parseURL(rssFeedUrl);
    console.log(feed);
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
  for (let i = 0; i < rssFeeds.length; i++) {
    const { name, url } = rssFeeds[i];
    await processRssFeed(name, url);
  }
}

setInterval(main, 5000); 
