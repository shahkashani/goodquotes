const cheerio = require('cheerio');
const request = require('request-promise');

const getUrl = async url => {
  const body = await request(url);
  return body;
};

const getDom = async url => {
  const body = await getUrl(url);
  return cheerio.load(body);
};

module.exports = {
  getDom,
  getUrl
};
