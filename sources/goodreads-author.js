require('dotenv').config();

const { GOODREADS_API_KEY } = process.env;
const { getUrl } = require('./utils');
const xmlParser = require('fast-xml-parser');
const { get } = require('lodash');
const goodreads = require('./goodreads');

const checkApiKey = () => {
  if (!GOODREADS_API_KEY) {
    console.log('Goodreads author search requires an API key.');
    console.log('Create an .env file with the following:');
    console.log('GOODREADS_API_KEY=<your api key>');
    process.exit(1);
  }
};

const getAuthorId = async author => {
  const qAuthor = encodeURIComponent(author);
  const url = `https://www.goodreads.com/api/author_url/${qAuthor}?key=${GOODREADS_API_KEY}`;
  const xmlData = await getUrl(url);
  if (!xmlData) {
    return null;
  }
  const data = xmlParser.parse(xmlData, { ignoreAttributes: false });
  return get(data, 'GoodreadsResponse.author.@_id', null);
};

const getQuotes = async (authorId, page) => {
  const url = `https://www.goodreads.com/author/quotes/${authorId}?page=${page}`;
  const results = await goodreads(url);
  return results;
};

module.exports = async author => {
  checkApiKey();
  const authorId = await getAuthorId(author);
  if (!authorId) {
    console.log('Could not find author:', author);
    process.exit(1);
  }
  return async (_search, page) => {
    return await getQuotes(authorId, page);
  };
};
