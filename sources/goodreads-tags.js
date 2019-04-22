const goodreads = require('./goodreads');

module.exports = async (tag, page = 1) => {
  const url = `https://www.goodreads.com/quotes/tag/${tag}?page=${page}`;
  const results = await goodreads(url);
  return results;
};
