const { getDom } = require('./utils');

module.exports = async url => {
  const $ = await getDom(url);
  const quoteElements = $('.quoteText');
  return quoteElements
    .map((_i, quoteElement) => {
      const text = $(quoteElement).text();
      const match = text.match(/\“(.*)\”/);
      return match ? match[1] : text;
    })
    .get();
};
