const request = require('request-promise');
const cheerio = require('cheerio');
const argv = require('yargs')
  .usage('Usage: $0 <command> [options]')
  .number('length')
  .required('tag')
  .default('length', 100)
  .describe('tag', 'What to search for')
  .describe('length', 'Maximum quote length').argv;

const { tag, length } = argv;

const getQuotes = async (tag, page = 1) => {
  const url = `https://www.goodreads.com/quotes/tag/${tag}?page=${page}`;
  const body = await request(url);
  const $ = cheerio.load(body);
  const quoteElements = $('.quoteText');
  return quoteElements
    .map((i, quoteElement) => {
      const text = $(quoteElement).text();
      const match = text.match(/\“(.*)\”/);
      return match ? match[1] : text;
    })
    .get();
};

const getAllQuotes = async (tag, length) => {
  let page = 1;
  let stop = false;
  while (!stop) {
    const quotes = await getQuotes(tag, page);
    const shortQuotes = quotes.filter(q => q.length <= length);
    stop = quotes.length === 0;
    page += 1;
    if (shortQuotes.length) {
      console.log(shortQuotes.join('\n'));
    }
  }
};

getAllQuotes(tag, length);
