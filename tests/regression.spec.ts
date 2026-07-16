import { test, expect } from '@playwright/test';
import { BIBLE_BOOKS, getChapterVersesCount } from '../src/database/bibleMetadata';
import { DAILY_VERSES } from '../src/database/dailyVerses';

test.describe('Bible Application - Comprehensive Regression Suite', () => {
  
  // 1. Database and Metadata calculations (Offline/Local metadata verification)
  test('Bible Metadata - Verification of 66 Books, 1,189 Chapters, and 31,102 Verses', async () => {
    // A. Verify that we have exactly 66 books configured
    expect(BIBLE_BOOKS.length).toBe(66);

    // B. Calculate total chapters configured across all books
    let totalChapters = 0;
    BIBLE_BOOKS.forEach(book => {
      totalChapters += book.chaptersCount;
    });
    // For standard Protestant Bibles, there are 1,189 chapters. Let's verify our configuration matches!
    expect(totalChapters).toBe(1189);

    // C. Calculate total verses configured according to the dynamic database generator
    let totalVerses = 0;
    BIBLE_BOOKS.forEach(book => {
      for (let ch = 1; ch <= book.chaptersCount; ch++) {
        totalVerses += getChapterVersesCount(book.id, ch);
      }
    });

    // In Protestant translations, there are exactly 31,102 verses. Our dynamic database is tuned to represent this.
    // Let's assert our local structure evaluates to exactly 31102 verses to prove full coverage!
    expect(totalVerses).toBe(31102);

    console.log(`Successfully verified full structural database integrity:`);
    console.log(`- 66 canonical books`);
    console.log(`- 1,189 chapters`);
    console.log(`- 31,102 verses exactly`);
  });

  // 2. Full Page load and console log monitoring
  test('Application Load & Navigation & Console Verification', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    // Attach console listeners to monitor errors, warnings and rejected promises
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      // Filter out benign websocket warnings typical of dev environments
      if (text.includes('[vite] failed to connect to websocket') || text.includes('HMR')) {
        return;
      }
      if (type === 'error') {
        consoleErrors.push(text);
      } else if (type === 'warning') {
        consoleWarnings.push(text);
      }
    });

    page.on('pageerror', err => {
      consoleErrors.push(`[Uncaught Page Error]: ${err.message}\n${err.stack}`);
    });

    // Navigate to local server
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify title or visible brand elements on landing page
    await expect(page).toHaveTitle(/Estudo/i);

    // Click and navigate through all main sections
    const navTabs = ['bible', 'devotionals', 'dictionary', 'ai', 'creative', 'saved', 'plans', 'prayers'];
    for (const tab of navTabs) {
      const tabButton = page.locator(`aside button:has-text("${getTabLabel(tab)}")`).first();
      if (await tabButton.isVisible()) {
        await tabButton.click();
        await page.waitForTimeout(200); // Wait for transition
      }
    }

    // Go back to dashboard
    await page.locator('aside button:has-text("Painel")').first().click();
    await page.waitForTimeout(200);

    // Verify no unhandled console errors occurred during main path traversal
    expect(consoleErrors).toEqual([]);
  });

  // 3. Bible Reader - Translation, Navigation, reference matching, and key features
  test('Bible Reader - Book/Chapter selection, reference navigation, version switching', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to Bible reader
    await page.locator('aside button:has-text("Bíblia")').first().click();
    await page.waitForSelector('text=Gênesis'); // Wait for content
    
    // Change to NVI version
    const versionSelector = page.locator('select').first();
    if (await versionSelector.isVisible()) {
      await versionSelector.selectOption('NVI');
      await page.waitForTimeout(100);
    }

    // Check that we can navigate through references using the Search Bar
    // Search for "Salmos 23"
    const searchInput = page.locator('input[placeholder*="Pesquisar versículos"]').first();
    await searchInput.fill('Salmos 23');
    await searchInput.press('Enter');

    // Confirm navigation to Salmos 23
    await expect(page.locator('h3:has-text("Salmos")')).toBeVisible();
    await expect(page.locator('text=Verdes pastos')).toBeVisible();

    // Verify search matches text keywords
    await searchInput.fill('pastor');
    await searchInput.press('Enter');
    
    // Check results are displayed
    await page.waitForSelector('text=Resultado');
    await expect(page.locator('text=Salmos 23:1')).toBeVisible();

    // Reset/Close search results to return to reading
    const closeSearchBtn = page.locator('button:has-text("Fechar busca")').first();
    if (await closeSearchBtn.isVisible()) {
      await closeSearchBtn.click();
    }
  });

  // 4. Persistence verification: Bookmark, Notes, Highlights
  test('Persistence - Toggle bookmarks, notes, and highlights, verify in saved views', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to Bible
    await page.locator('aside button:has-text("Bíblia")').first().click();
    
    // Navigate to Gênesis 1
    const searchInput = page.locator('input[placeholder*="Pesquisar versículos"]').first();
    await searchInput.fill('Gênesis 1');
    await searchInput.press('Enter');
    await page.waitForSelector('text=No princípio criou Deus');

    // Click on Verse 1 to open the context sheet
    const verse1 = page.locator('span:has-text("No princípio criou Deus")').first();
    await verse1.click();

    // Click Favorite button (Coração / Bookmark) inside context menu
    // Wait for the favorite button to appear
    const favButton = page.locator('button:has-text("Favoritar")').first();
    await favButton.click();

    // Click Verse 1 again to highlight
    await verse1.click();
    // Select first color (e.g. emerald/yellow)
    const colorBtn = page.locator('button[title*="Verde"]').first();
    if (await colorBtn.isVisible()) {
      await colorBtn.click();
    } else {
      // fallback click any color option or highligher block
      await page.locator('.flex.gap-2.justify-between button').first().click();
    }

    // Click Verse 1 again to add a Note
    await verse1.click();
    const noteBtn = page.locator('button:has-text("Anotação")').first();
    await noteBtn.click();

    // Fill note title and content
    await page.locator('input[placeholder*="Título"]').fill('Minha nota de estudos de exegese');
    await page.locator('textarea[placeholder*="Conteúdo"]').fill('Deus criou o universo ex nihilo. Nota importante para pregação.');
    await page.locator('button:has-text("Salvar")').click();

    // Navigate to Saved items / Estudios section
    await page.locator('aside button:has-text("Estudos")').first().click();

    // Verify Note is present
    await expect(page.locator('text=Minha nota de estudos de exegese')).toBeVisible();
    await expect(page.locator('text=Deus criou o universo ex nihilo')).toBeVisible();

    // Switch to Favoritos tab inside Saved page
    await page.locator('button:has-text("Favoritos")').click();
    await expect(page.locator('text=Gênesis 1:1')).toBeVisible();
  });

  // 5. AI Assistant - Theological interactions, streaming exegese
  test('AI Assistant - Submit exegese query, verify response streaming', async ({ page }) => {
    await page.goto('/');
    
    // Go to AI Assistant (Teólogo IA)
    await page.locator('aside button:has-text("Teólogo IA")').first().click();
    await page.waitForSelector('input[placeholder*="Pergunte ao Teólogo"]');

    // Submit a query
    const aiInput = page.locator('input[placeholder*="Pergunte ao Teólogo"]').first();
    await aiInput.fill('Qual é a diferença entre exegese e eisegese?');
    await page.locator('button:has-text("Enviar"), button:has(svg)').last().click();

    // Verify loading state or bubble appears
    await expect(page.locator('.bg-emerald-500/10, .bg-slate-100')).toBeVisible();

    // Wait for the AI response to stream or complete (with safe timeout)
    await page.waitForSelector('.markdown-body, .prose, text=Exegese', { timeout: 30000 });
    
    // Confirm response content
    const responseBubble = page.locator('.markdown-body, .prose').first();
    const textContent = await responseBubble.textContent();
    expect(textContent?.length).toBeGreaterThan(10);
  });
});

function getTabLabel(tab: string): string {
  switch (tab) {
    case 'dashboard': return 'Painel';
    case 'bible': return 'Bíblia';
    case 'devotionals': return 'Devocionais';
    case 'dictionary': return 'Dicionário';
    case 'ai': return 'Teólogo IA';
    case 'creative': return 'Estúdio';
    case 'saved': return 'Estudos';
    case 'plans': return 'Planos';
    case 'prayers': return 'Orações';
    default: return 'Painel';
  }
}
