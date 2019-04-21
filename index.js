const request = require('request-promise');
const cheerio = require('cheerio');
const lngDetector = new (require('languagedetect'))();
const { writeFileSync } = require('fs');

const argv = require('yargs')
  .usage('Usage: $0 <command> [options]')
  .number('length')
  .number('num')
  .required('tag')
  .default('length', 60)
  .alias('length', 'len')
  .alias('tag', 't')
  .alias('num', 'n')
  .alias('output', 'o')
  .alias('language', 'lang')
  .describe('tag', 'Tag to search for')
  .describe('output', 'A file path to output the results to')
  .describe('language', 'Language to restrict quotes to (e.g. "french")')
  .describe('num', 'Number of quotes to get (omit to get all available quotes)')
  .describe('length', 'Maximum quote length').argv;

const { tag, length, language, num, output } = argv;

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

const getAllQuotes = async ({ tag, num, filter, onProgress }) => {
  let page = 1;
  let stop = false;
  const result = [];
  while (!stop) {
    const quotes = await getQuotes(tag, page);
    const filteredQuotes = filter ? quotes.filter(filter) : quotes;
    page += 1;
    stop = quotes.length === 0 || (num && result.length >= num);
    if (filteredQuotes.length) {
      onProgress(filteredQuotes);
      result.push.apply(result, filteredQuotes);
    }
  }
  return result;
};

getAllQuotes({
  tag,
  num,
  filter: q => q.length <= length && (!language || getLanguage(q) === language),
  onProgress: quotes => {
    if (quotes.length) {
      console.log(quotes.join('\n'));
    }
  }
}).then(quotes => {
  console.log(`🎉 Done, grabbed ${quotes.length} quotes!`);
  if (output) {
    writeFileSync(output, quotes.join('\n'));
  }
});
