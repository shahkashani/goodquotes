const request = require('request-promise');
const cheerio = require('cheerio');
const lngDetector = new (require('languagedetect'))();

const argv = require('yargs')
  .usage('Usage: $0 <command> [options]')
  .number('length')
  .required('tag')
  .default('length', 100)
  .describe('tag', 'Tag to search for')
  .describe('language', 'Language to restrict quotes to (e.g. "french")')
  .describe('length', 'Maximum quote length').argv;

const { tag, length, language } = argv;

const getLanguage = text => {
  const [result] = lngDetector.detect(text, 1);
  return result.length ? result[0] : null;
};

const getQuotes = async (tag, page = 1) => {
  const url = `https://www.goodreads.com/quotes/tag/${tag}?page=${page}`;
  const body = await request(url);
  const $ = cheerio.load(body);
  const quoteElements = $('.quoteText');
  return quoteElements
    .map((_i, quoteElement) => {
      const text = $(quoteElement).text();
      const match = text.match(/\“(.*)\”/);
      return match ? match[1] : text;
    })
    .get();
};

const getAllQuotes = async ({ tag, filter, onProgress }) => {
  let page = 1;
  let stop = false;
  while (!stop) {
    const quotes = await getQuotes(tag, page);
    const filteredQuotes = filter ? quotes.filter(filter) : quotes;
    stop = quotes.length === 0;
    page += 1;
    if (filteredQuotes.length) {
      onProgress(filteredQuotes);
    }
  }
};

getAllQuotes({
  tag,
  filter: q => q.length <= length && (!language || getLanguage(q) === language),
  onProgress: quotes => {
    if (quotes.length) {
      console.log(quotes.join('\n'));
    }
  }
});
