import OpenAI from "openai";
import type { AIGenerationRequest, QuizQuestion, FlashcardData, VideoHotspot, ImageHotspot } from "@shared/schema";

// This is using OpenAI's API, which points to OpenAI's API servers and requires your own API key.
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateQuizQuestions(request: AIGenerationRequest): Promise<QuizQuestion[]> {
  const prompt = `Generate ${request.numberOfItems} quiz questions about "${request.topic}" at ${request.difficulty} difficulty level${request.gradeLevel ? ` for ${request.gradeLevel}` : ""}.

Requirements:
- Mix of multiple-choice (with 4 options), true/false, and fill-in-the-blank questions
- Each question should have a correct answer and an explanation
- Make questions educational and engaging
${request.additionalContext ? `\nAdditional context: ${request.additionalContext}` : ""}

Respond in JSON format with an array of questions following this structure:
{
  "questions": [
    {
      "id": "unique-id",
      "type": "multiple-choice" | "true-false" | "fill-blank",
      "question": "question text",
      "options": ["option1", "option2", "option3", "option4"], // only for multiple-choice
      "correctAnswer": 0 | "true" | "false" | "answer text",
      "explanation": "why this is the correct answer"
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      { role: "system", content: "You are an expert educator creating quiz questions. Always respond with valid JSON." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 4096,
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  return result.questions || [];
}

export async function generateFlashcards(request: AIGenerationRequest): Promise<FlashcardData["cards"]> {
  const prompt = `Generate ${request.numberOfItems} flashcard pairs about "${request.topic}" at ${request.difficulty} difficulty level${request.gradeLevel ? ` for ${request.gradeLevel}` : ""}.

Requirements:
- Front: term, concept, or question
- Back: definition, explanation, or answer
- Include a category for each card
- Make them educational and memorable
${request.additionalContext ? `\nAdditional context: ${request.additionalContext}` : ""}

Respond in JSON format:
{
  "cards": [
    {
      "id": "unique-id",
      "front": "term or question",
      "back": "definition or answer",
      "category": "category name"
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      { role: "system", content: "You are an expert educator creating flashcards. Always respond with valid JSON." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 4096,
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  return result.cards || [];
}

export async function generateVideoHotspots(request: AIGenerationRequest): Promise<VideoHotspot[]> {
  const prompt = `Generate ${request.numberOfItems} interactive hotspots for a video about "${request.topic}" at ${request.difficulty} difficulty level${request.gradeLevel ? ` for ${request.gradeLevel}` : ""}.

Requirements:
- Mix of question, information, and navigation hotspots
- Each hotspot should have a timestamp (in seconds), title, and content
- Question hotspots should include options and correct answer
- Distribute timestamps evenly throughout a typical educational video (assume 10-15 minutes)
${request.additionalContext ? `\nAdditional context: ${request.additionalContext}` : ""}

Respond in JSON format:
{
  "hotspots": [
    {
      "id": "unique-id",
      "timestamp": 60,
      "type": "question" | "info" | "navigation",
      "title": "hotspot title",
      "content": "description or question",
      "options": ["option1", "option2", "option3"], // only for questions
      "correctAnswer": 0 // only for questions
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      { role: "system", content: "You are an expert educator creating interactive video content. Always respond with valid JSON." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 4096,
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  return result.hotspots || [];
}

export async function generateImageHotspots(request: AIGenerationRequest): Promise<ImageHotspot[]> {
  const prompt = `Generate ${request.numberOfItems} image hotspot descriptions for "${request.topic}" at ${request.difficulty} difficulty level${request.gradeLevel ? ` for ${request.gradeLevel}` : ""}.

Requirements:
- Each hotspot represents a point of interest on an image
- Include x,y coordinates (as percentages 0-100) that would make sense for a typical educational diagram
- Provide title and detailed description
- Make them educational and informative
${request.additionalContext ? `\nAdditional context: ${request.additionalContext}` : ""}

Respond in JSON format:
{
  "hotspots": [
    {
      "id": "unique-id",
      "x": 25,
      "y": 30,
      "title": "hotspot title",
      "description": "detailed description"
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      { role: "system", content: "You are an expert educator creating interactive image content. Always respond with valid JSON." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 4096,
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  return result.hotspots || [];
}
