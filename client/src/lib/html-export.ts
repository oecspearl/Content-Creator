import type { 
  H5pContent, 
  InteractiveBookData, 
  QuizData, 
  MemoryGameData, 
  FlashcardData 
} from "@shared/schema";

// Convert base64 data URI to a format suitable for embedding
function ensureDataUri(data: string): string {
  if (!data) return "";
  // If already a data URI, return as is
  if (data.startsWith("data:")) return data;
  // If it's a URL, we'll need to fetch it (but for now, return as is for external URLs)
  if (data.startsWith("http://") || data.startsWith("https://")) return data;
  // Assume it's base64 and add data URI prefix
  return `data:image/png;base64,${data}`;
}

// Generate HTML for a single image
function generateImageHtml(imageUrl: string, alt: string = ""): string {
  const dataUri = ensureDataUri(imageUrl);
  return `<img src="${dataUri}" alt="${alt}" style="max-width: 100%; height: auto; margin: 1rem 0;" />`;
}

// Generate HTML for audio player
function generateAudioHtml(audioUrl: string): string {
  if (!audioUrl) return "";
  const dataUri = ensureDataUri(audioUrl);
  return `
    <div style="margin: 1rem 0; padding: 1rem; background: #f5f5f5; border-radius: 8px;">
      <audio controls style="width: 100%;">
        <source src="${dataUri}" type="audio/webm">
        <source src="${dataUri}" type="audio/mpeg">
        Your browser does not support the audio element.
      </audio>
    </div>
  `;
}

// Generate HTML for YouTube video
function generateVideoHtml(videoId: string, title: string = ""): string {
  return `
    <div style="margin: 1rem 0; position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;">
      <iframe 
        src="https://www.youtube.com/embed/${videoId}" 
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen
        title="${title}"
      ></iframe>
    </div>
  `;
}

// Generate complete HTML document
export function generateHTMLExport(
  content: H5pContent,
  contentData: any
): string {
  const title = content.title || "Exported Content";
  const description = content.description || "";
  
  let bodyContent = "";

  switch (content.type) {
    case "presentation":
      bodyContent = generatePresentationHTML(contentData);
      break;
    case "interactive-book":
      bodyContent = generateInteractiveBookHTML(contentData);
      break;
    case "quiz":
      bodyContent = generateQuizHTML(contentData);
      break;
    case "memory-game":
      bodyContent = generateMemoryGameHTML(contentData);
      break;
    case "flashcard":
      bodyContent = generateFlashcardHTML(contentData);
      break;
    default:
      bodyContent = `<p>Content type "${content.type}" export not yet implemented.</p>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      color: #1a1a1a;
    }
    h2 {
      font-size: 1.5rem;
      margin-top: 2rem;
      margin-bottom: 1rem;
      color: #2a2a2a;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 0.5rem;
    }
    h3 {
      font-size: 1.25rem;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      color: #3a3a3a;
    }
    .description {
      color: #666;
      margin-bottom: 2rem;
      font-style: italic;
    }
    .page {
      margin-bottom: 3rem;
      padding: 1.5rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: #fafafa;
    }
    .slide {
      margin-bottom: 2rem;
      padding: 1.5rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: #fff;
      page-break-after: always;
    }
    .question {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #f9f9f9;
      border-left: 4px solid #4a90e2;
      border-radius: 4px;
    }
    .options {
      margin-left: 1.5rem;
      margin-top: 0.5rem;
    }
    .option {
      padding: 0.5rem;
      margin: 0.25rem 0;
    }
    .correct {
      background: #d4edda;
      border-left: 3px solid #28a745;
    }
    .card {
      margin-bottom: 1rem;
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: #fff;
    }
    .card-front, .card-back {
      padding: 0.75rem;
      margin: 0.5rem 0;
    }
    .card-front {
      background: #e3f2fd;
      border-left: 3px solid #2196f3;
    }
    .card-back {
      background: #f1f8e9;
      border-left: 3px solid #8bc34a;
    }
    .instructions {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 4px;
      padding: 1rem;
      margin: 1rem 0;
    }
    @media print {
      body {
        padding: 1rem;
      }
      .slide {
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${description ? `<div class="description">${escapeHtml(description)}</div>` : ""}
  ${bodyContent}
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function generatePresentationHTML(data: any): string {
  if (!data.slides || !Array.isArray(data.slides)) {
    return "<p>No slides available.</p>";
  }

  let html = "";
  data.slides.forEach((slide: any, index: number) => {
    html += `
      <div class="slide">
        <h2>Slide ${index + 1}</h2>
        ${slide.title ? `<h3>${escapeHtml(slide.title)}</h3>` : ""}
        ${slide.content ? `<div>${slide.content}</div>` : ""}
        ${slide.imageUrl ? generateImageHtml(slide.imageUrl, slide.imageAlt || `Slide ${index + 1} image`) : ""}
      </div>
    `;
  });

  return html;
}

function generateInteractiveBookHTML(data: InteractiveBookData): string {
  if (!data.pages || data.pages.length === 0) {
    return "<p>No pages available.</p>";
  }

  let html = "";
  data.pages.forEach((page, index) => {
    html += `<div class="page">`;
    html += `<h2>${escapeHtml(page.title || `Page ${index + 1}`)}</h2>`;

    // Page content based on type
    if (!page.pageType || page.pageType === "content") {
      if (page.content) {
        html += `<div>${page.content}</div>`;
      }
    } else if (page.pageType === "video" && page.videoData) {
      html += `<h3>Video: ${escapeHtml(page.videoData.title)}</h3>`;
      html += generateVideoHtml(page.videoData.videoId, page.videoData.title);
      if (page.videoData.instructions) {
        html += `<div class="instructions"><strong>Instructions:</strong> ${escapeHtml(page.videoData.instructions)}</div>`;
      }
    } else if (page.pageType === "quiz" && page.quizData) {
      html += generateQuizHTML(page.quizData);
    } else if (page.pageType === "image" && page.imageData) {
      html += generateImageHtml(page.imageData.imageUrl, page.imageData.imageAlt || "Page image");
      if (page.imageData.instructions) {
        html += `<div class="instructions"><strong>Instructions:</strong> ${escapeHtml(page.imageData.instructions)}</div>`;
      }
    }

    // Audio narration
    if (page.audioUrl) {
      html += `<div><strong>Narration:</strong></div>`;
      html += generateAudioHtml(page.audioUrl);
    }

    html += `</div>`;
  });

  return html;
}

function generateQuizHTML(data: QuizData): string {
  if (!data.questions || data.questions.length === 0) {
    return "<p>No questions available.</p>";
  }

  let html = "";
  data.questions.forEach((question, index) => {
    html += `<div class="question">`;
    html += `<h3>Question ${index + 1}</h3>`;
    html += `<p><strong>${escapeHtml(question.question)}</strong></p>`;

    if (question.type === "multiple-choice" && question.options) {
      html += `<div class="options">`;
      question.options.forEach((option, optIndex) => {
        const isCorrect = question.correctAnswer === optIndex;
        html += `<div class="option ${isCorrect ? "correct" : ""}">`;
        html += `${isCorrect ? "✓ " : ""}${escapeHtml(option)}`;
        html += `</div>`;
      });
      html += `</div>`;
    } else if (question.type === "true-false") {
      const isCorrect = String(question.correctAnswer) === "true";
      html += `<div class="options">`;
      html += `<div class="option ${isCorrect ? "correct" : ""}">✓ True</div>`;
      html += `<div class="option ${!isCorrect ? "correct" : ""}">${!isCorrect ? "✓ " : ""}False</div>`;
      html += `</div>`;
    } else if (question.type === "fill-blank") {
      html += `<div class="options">`;
      html += `<div class="option correct">Correct Answer: ${escapeHtml(String(question.correctAnswer))}</div>`;
      html += `</div>`;
    }

    if (question.explanation) {
      html += `<p style="margin-top: 0.5rem; font-style: italic; color: #666;">${escapeHtml(question.explanation)}</p>`;
    }

    html += `</div>`;
  });

  return html;
}

function generateMemoryGameHTML(data: MemoryGameData): string {
  if (!data.cards || data.cards.length === 0) {
    return "<p>No cards available.</p>";
  }

  // Group cards by matchId
  const cardGroups = new Map<string, any[]>();
  data.cards.forEach(card => {
    if (card.matchId) {
      if (!cardGroups.has(card.matchId)) {
        cardGroups.set(card.matchId, []);
      }
      cardGroups.get(card.matchId)!.push(card);
    }
  });

  let html = "<h2>Memory Game Cards</h2>";
  let pairIndex = 1;

  cardGroups.forEach((cards, matchId) => {
    html += `<div class="card">`;
    html += `<h3>Pair ${pairIndex}</h3>`;
    
    cards.forEach((card, index) => {
      html += `<div class="card-${index === 0 ? "front" : "back"}">`;
      if (card.type === "image" && card.imageUrl) {
        html += generateImageHtml(card.imageUrl, card.content || `Card ${index + 1}`);
      } else {
        html += `<p>${escapeHtml(card.content || "")}</p>`;
      }
      html += `</div>`;
    });
    
    html += `</div>`;
    pairIndex++;
  });

  return html;
}

function generateFlashcardHTML(data: FlashcardData): string {
  if (!data.cards || data.cards.length === 0) {
    return "<p>No flashcards available.</p>";
  }

  let html = "";
  data.cards.forEach((card, index) => {
    html += `<div class="card">`;
    html += `<h3>Card ${index + 1}${card.category ? ` - ${escapeHtml(card.category)}` : ""}</h3>`;
    
    html += `<div class="card-front">`;
    html += `<strong>Front:</strong>`;
    if (card.frontImageUrl) {
      html += generateImageHtml(card.frontImageUrl, card.frontImageAlt || "Front image");
    }
    html += `<p>${escapeHtml(card.front)}</p>`;
    html += `</div>`;
    
    html += `<div class="card-back">`;
    html += `<strong>Back:</strong>`;
    if (card.backImageUrl) {
      html += generateImageHtml(card.backImageUrl, card.backImageAlt || "Back image");
    }
    html += `<p>${escapeHtml(card.back)}</p>`;
    html += `</div>`;
    
    html += `</div>`;
  });

  return html;
}

// Download function
export function downloadHTML(html: string, filename: string): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".html") ? filename : `${filename}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

