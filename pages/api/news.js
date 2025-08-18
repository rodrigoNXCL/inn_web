const Parser = require('rss-parser');
const parser = new Parser();

module.exports = async function handler(req, res) {
  const { fuente } = req.query;

  // URLs para las búsquedas de Google News
  const urls = {
    chilevalora: 'https://news.google.com/rss/search?q=chilevalora&hl=es-419&gl=CL&ceid=CL:es-419',
    inn: 'https://news.google.com/rss/search?q=INN+normas&hl=es-419&gl=CL&ceid=CL:es-419',
    ciencia: 'https://news.google.com/rss/search?q=ciencia+tecnologia+chile&hl=es-419&gl=CL&ceid=CL:es-419'
  };

  const url = urls[fuente] || urls.chilevalora;

  try {
    const feed = await parser.parseURL(url);
    const noticias = feed.items.slice(0, 6).map(item => ({
      titulo: item.title,
      link: item.link,
      resumen: item.contentSnippet
    }));
    res.status(200).json(noticias);
  } catch (e) {
    res.status(200).json([]);
  }
}
