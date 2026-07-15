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

// Client-side real PNG exporter utilizing HTML5 Canvas
export function exportCanvasAsPNG(
  title: string,
  verseText: string | undefined,
  verseRef: string | undefined,
  bgType: 'color' | 'image',
  bgValue: string,
  textColor: string,
  fontFamily: string,
  textAlign: 'left' | 'center' | 'right'
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Standard high-definition slide resolution: 1200 x 675 (16:9 aspect ratio)
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 675;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Não foi possível obter o contexto 2D do Canvas.'));
      return;
    }

    // Function to perform the actual render after image/background load
    const draw = () => {
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
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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
    };

    const afterBgLoaded = () => {
      // 2. Draw Decorative Borders
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

      // 3. Draw Watermark
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '14px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ESTUDO BÍBLICO E TEOLÓGICO PRO 🕊️', canvas.width / 2, canvas.height - 50);

      // 4. Draw Slide Title
      ctx.fillStyle = textColor;
      ctx.font = `bold 24px "${fontFamily}", sans-serif`;
      ctx.fillText(title.toUpperCase(), canvas.width / 2, 85);

      // 5. Draw Scripture Text with Word Wrapping
      if (verseText) {
        ctx.fillStyle = textColor;
        ctx.font = `italic 36px "${fontFamily}", serif`;
        
        // Alignment setups
        ctx.textAlign = textAlign;
        let startX = canvas.width / 2;
        if (textAlign === 'left') startX = 100;
        if (textAlign === 'right') startX = canvas.width - 100;

        const words = verseText.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        const maxWidth = canvas.width - 200;

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
        const lineHeight = 48;
        const totalHeight = lines.length * lineHeight;
        let startY = (canvas.height / 2) - (totalHeight / 2) + 20;

        for (const line of lines) {
          ctx.fillText(line, startX, startY);
          startY += lineHeight;
        }

        // 6. Draw Scripture Reference
        if (verseRef) {
          ctx.fillStyle = textColor;
          ctx.font = `bold 28px "${fontFamily}", sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(verseRef, canvas.width / 2, startY + 40);
        }
      }

      // Convert Canvas to download
      try {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.setAttribute('download', `slide_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`);
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
