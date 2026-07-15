import { BIBLE_BOOKS, getChapterVersesCount, getGeneratedVerseText } from '../src/database/bibleMetadata';

export default async function handler(req: any, res: any) {
  const { bookId, chapter, version } = req.query;

  if (!bookId || !chapter) {
    return res.status(400).json({ error: 'Parâmetros "bookId" e "chapter" são obrigatórios.' });
  }

  const book = BIBLE_BOOKS.find(b => b.id === bookId.toUpperCase());
  if (!book) {
    return res.status(404).json({ error: 'Livro não encontrado.' });
  }

  const chNum = parseInt(chapter, 10);
  if (isNaN(chNum) || chNum < 1 || chNum > book.chaptersCount) {
    return res.status(400).json({ error: `Capítulo inválido. O livro ${book.name} possui ${book.chaptersCount} capítulos.` });
  }

  const activeVersion = version || 'ARA';
  const verseCount = getChapterVersesCount(book.id, chNum);
  const verses = [];

  for (let v = 1; v <= verseCount; v++) {
    verses.push({
      verse: v,
      text: getGeneratedVerseText(book.id, chNum, v, activeVersion)
    });
  }

  return res.status(200).json({
    bookId: book.id,
    bookName: book.name,
    chapter: chNum,
    version: activeVersion,
    verses
  });
}
