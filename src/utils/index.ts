// Utility functions for Estudo Bíblico e Teológico PRO

// Format a date in Brazilian Portuguese
export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (e) {
    return isoString;
  }
}

// Convert JSON notes to downloadable markdown files
export function exportToMarkdown(title: string, content: string, category: string, reference?: string): void {
  const markdownContent = `# ${title}
*Categoria: ${category}*
${reference ? `*Referência: ${reference}*\n` : ''}
---

${content}

---
*Gerado via Estudo Bíblico e Teológico PRO*
*Data de Exportação: ${new Date().toLocaleDateString('pt-BR')}*
`;

  const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Generate an elegant sharing template
export function formatShareText(verseRef: string, text: string, version: string): string {
  return `📖 "${text}" — ${verseRef} (${version})\n\nEstudado no aplicativo Estudo Bíblico e Teológico PRO 🕊️`;
}

// Client-side real PNG exporter utilizing HTML5 Canvas with support for multiple formats
export function exportCanvasAsPNG(
  title: string,
  verseText: string | undefined,
  verseRef: string | undefined,
  bgType: 'color' | 'image',
  bgValue: string,
  textColor: string,
  fontFamily: string,
  textAlign: 'left' | 'center' | 'right',
  designType: 'slide' | 'cover' | 'illustrated_verse' | 'instagram_post' | 'instagram_story' | 'instagram_sticker' = 'slide'
): Promise<void> {
  return new Promise((resolve, reject) => {
    // 1. Determine canvas dimensions based on design type
    let width = 1200;
    let height = 675; // Default 16:9 slide

    if (designType === 'instagram_post') {
      width = 1080;
      height = 1080; // 1:1 Square
    } else if (designType === 'instagram_story') {
      width = 1080;
      height = 1920; // 9:16 Vertical
    } else if (designType === 'instagram_sticker') {
      width = 1000;
      height = 1000; // 1:1 Transparent sticker container
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Não foi possível obter o contexto 2D do Canvas.'));
      return;
    }

    // Helper to draw rounded rectangle (useful for sticker and frames)
    const drawRoundedRect = (c: CanvasRenderingContext2D, rx: number, ry: number, rw: number, rh: number, radius: number) => {
      c.beginPath();
      c.moveTo(rx + radius, ry);
      c.lineTo(rx + rw - radius, ry);
      c.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
      c.lineTo(rx + rw, ry + rh - radius);
      c.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
      c.lineTo(rx + radius, ry + rh);
      c.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
      c.lineTo(rx, ry + radius);
      c.quadraticCurveTo(rx, ry, rx + radius, ry);
      c.closePath();
    };

    // Function to perform the actual render after image/background load
    const draw = () => {
      // For standard slides, posts, and stories
      if (designType !== 'instagram_sticker') {
        // 1. Draw Background
        if (bgType === 'color') {
          ctx.fillStyle = bgValue || '#0F172A';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          afterBgLoaded();
        } else {
          // If it is a base64 string or an image URL
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            // Draw image covering the whole canvas with correct aspect ratio
            const canvasRatio = canvas.width / canvas.height;
            const imgRatio = img.width / img.height;
            let drawW = canvas.width;
            let drawH = canvas.height;
            let drawX = 0;
            let drawY = 0;

            if (imgRatio > canvasRatio) {
              // Image is wider than canvas
              drawW = img.height * canvasRatio;
              drawX = (img.width - drawW) / 2;
              ctx.drawImage(img, drawX, 0, drawW, img.height, 0, 0, canvas.width, canvas.height);
            } else {
              // Image is taller than canvas
              drawH = img.width / canvasRatio;
              drawY = (img.height - drawH) / 2;
              ctx.drawImage(img, 0, drawY, img.width, drawH, 0, 0, canvas.width, canvas.height);
            }

            // Dark overlay for readability
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            afterBgLoaded();
          };
          img.onerror = () => {
            // Fallback if image fails to load
            ctx.fillStyle = '#0F172A';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            afterBgLoaded();
          };
          img.src = bgValue;
        }
      } else {
        // For Instagram STICKER (transparent background)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Let's draw an elegant physical-looking die-cut sticker
        const stickX = 120;
        const stickY = 160;
        const stickW = 760;
        const stickH = 680;

        // 1. Draw sticker shadow for depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 12;

        // Determine sticker background (dark slate if text is light, or white/cream if text is dark)
        const isBgDark = bgType === 'color' && (bgValue.toLowerCase() === '#ffffff' || bgValue.toLowerCase() === '#f8fafc' || bgValue.toLowerCase() === '#f1f5f9');
        ctx.fillStyle = bgType === 'color' ? bgValue : '#1E293B';
        
        // Draw the main sticker fill with shadow active
        drawRoundedRect(ctx, stickX, stickY, stickW, stickH, 36);
        ctx.fill();

        // 2. Reset shadow so it doesn't affect the outline and text
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // 3. Draw a thick white/light die-cut sticker border
        ctx.strokeStyle = isBgDark ? '#0F172A' : '#FFFFFF';
        ctx.lineWidth = 12;
        ctx.stroke();

        // Add a thin inner border line for extra luxury
        ctx.strokeStyle = isBgDark ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        drawRoundedRect(ctx, stickX + 16, stickY + 16, stickW - 32, stickH - 32, 24);
        ctx.stroke();

        // Render contents inside the sticker
        afterStickerBgLoaded(stickX, stickY, stickW, stickH, isBgDark);
      }
    };

    // Rendering routine for slide, instagram_post and instagram_story
    const afterBgLoaded = () => {
      // 1. Draw Decorative Borders
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = designType === 'instagram_story' ? 3 : 2;
      const borderPadding = designType === 'instagram_story' ? 50 : 30;
      ctx.strokeRect(borderPadding, borderPadding, canvas.width - borderPadding * 2, canvas.height - borderPadding * 2);

      // 2. Draw Watermark Footer
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = designType === 'instagram_story' 
        ? 'bold 15px "JetBrains Mono", monospace' 
        : '14px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      
      const watermarkY = designType === 'instagram_story' ? canvas.height - 110 : canvas.height - 50;
      ctx.fillText('ESTUDO BÍBLICO E TEOLÓGICO PRO 🕊️', canvas.width / 2, watermarkY);

      // 3. Draw Slide/Post/Story Title
      ctx.fillStyle = textColor;
      const titleY = designType === 'instagram_story' ? 240 : designType === 'instagram_post' ? 140 : 85;
      const titleSize = designType === 'instagram_story' ? 26 : designType === 'instagram_post' ? 24 : 24;
      ctx.font = `bold ${titleSize}px "${fontFamily}", sans-serif`;
      ctx.fillText(title.toUpperCase(), canvas.width / 2, titleY);

      // 4. Draw Scripture Text with Word Wrapping
      if (verseText) {
        ctx.fillStyle = textColor;
        
        let fontSizePx = 36;
        let lineHeight = 48;
        if (designType === 'instagram_post') {
          fontSizePx = 40;
          lineHeight = 56;
        } else if (designType === 'instagram_story') {
          fontSizePx = 44;
          lineHeight = 62;
        }
        
        ctx.font = `italic ${fontSizePx}px "${fontFamily}", serif`;
        ctx.textAlign = textAlign;
        
        const textPadding = designType === 'instagram_story' ? 120 : 100;
        let startX = canvas.width / 2;
        if (textAlign === 'left') startX = textPadding;
        if (textAlign === 'right') startX = canvas.width - textPadding;

        const words = verseText.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        const maxWidth = canvas.width - textPadding * 2;

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        lines.push(currentLine);

        // Center lines vertically
        const totalHeight = lines.length * lineHeight;
        let centerYShift = 20;
        if (designType === 'instagram_story') {
          centerYShift = 50;
        }
        let startY = (canvas.height / 2) - (totalHeight / 2) + centerYShift;

        for (const line of lines) {
          ctx.fillText(line, startX, startY);
          startY += lineHeight;
        }

        // 5. Draw Scripture Reference
        if (verseRef) {
          ctx.fillStyle = textColor;
          const refSize = designType === 'instagram_story' ? 32 : designType === 'instagram_post' ? 30 : 28;
          ctx.font = `bold ${refSize}px "${fontFamily}", sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(verseRef, canvas.width / 2, startY + 50);
        }
      }

      finishCanvas();
    };

    // Rendering routine for STICKER inside the sticker bubble
    const afterStickerBgLoaded = (sx: number, sy: number, sw: number, sh: number, isDark: boolean) => {
      // Text color inside sticker (use user's selected textColor, or white/charcoal depending on dark/light sticker bg)
      const currentTextColor = textColor || (isDark ? '#0F172A' : '#FFFFFF');

      // 1. Draw Sticker Title (Academic Header)
      ctx.fillStyle = currentTextColor;
      ctx.font = `bold 22px "${fontFamily}", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(title.toUpperCase(), canvas.width / 2, sy + 75);

      // Simple divider
      ctx.strokeStyle = isDark ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 120, sy + 105);
      ctx.lineTo(canvas.width / 2 + 120, sy + 105);
      ctx.stroke();

      // 2. Draw Verse/Theology text
      if (verseText) {
        ctx.fillStyle = currentTextColor;
        ctx.font = `italic 34px "${fontFamily}", serif`;
        ctx.textAlign = 'center';

        const words = verseText.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        const maxWidth = sw - 140; // paddings inside sticker

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        lines.push(currentLine);

        // Center lines vertically inside the sticker content area
        const lineHeight = 46;
        const totalHeight = lines.length * lineHeight;
        let startY = sy + (sh / 2) - (totalHeight / 2) + 15;

        for (const line of lines) {
          ctx.fillText(line, canvas.width / 2, startY);
          startY += lineHeight;
        }

        // 3. Draw reference below the quote
        if (verseRef) {
          ctx.fillStyle = currentTextColor;
          ctx.font = `bold 26px "${fontFamily}", sans-serif`;
          ctx.fillText(verseRef, canvas.width / 2, startY + 45);
        }
      }

      // Small elegant watermark inside the sticker itself
      ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.35)';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillText('ESTUDO BÍBLICO PRO 🕊️ ADESIVO', canvas.width / 2, sy + sh - 40);

      finishCanvas();
    };

    const finishCanvas = () => {
      // Convert Canvas to download
      try {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        
        let filenameSuffix = 'slide';
        if (designType === 'instagram_post') filenameSuffix = 'insta_post';
        if (designType === 'instagram_story') filenameSuffix = 'insta_story';
        if (designType === 'instagram_sticker') filenameSuffix = 'insta_sticker';

        link.setAttribute('download', `${filenameSuffix}_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        resolve();
      } catch (err) {
        reject(err);
      }
    };

    draw();
  });
}
