const lngDetector = new (require('languagedetect'))();
const { writeFileSync } = require('fs');
const goodreadsTags = require('./sources/goodreads-tags');
const goodreadsAuthor = require('./sources/goodreads-author');

const argv = require('yargs')
  .usage('Usage: $0 <command> [options]')
  .number('length')
  .number('num')
  .boolean('author')
  .required('search')
  .default('length', 60)
  .default('author', false)
  .alias('length', 'len')
  .alias('search', 's')
  .alias('num', 'n')
  .alias('output', 'o')
  .alias('language', 'lang')
  .describe('search', 'Search phrase')
  .describe('author', 'Search is for an author')
  .describe('output', 'A file path to output the results to')
  .describe('language', 'Language to restrict quotes to (e.g. "french")')
  .describe('num', 'Number of quotes to get (omit to get all available quotes)')
  .describe('length', 'Maximum quote length').argv;

const { search, length, language, num, output, author } = argv;

const { GOODREADS_API_KEY, GOODREADS_API_SECRET } = process.env;

const getLanguage = text => {
  const [result] = lngDetector.detect(text, 1);
  return result.length ? result[0] : null;
};

const getAllQuotes = async ({ search, source, num, filter, onProgress }) => {
  let page = 1;
  let stop = false;
  const result = [];
  while (!stop) {
    const quotes = await source(search, page);
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

(async function() {
  const source = author ? await goodreadsAuthor(search) : goodreadsTags;

  getAllQuotes({
    search,
    num,
    source,
    filter: q =>
      q.length <= length && (!language || getLanguage(q) === language),
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
})();
