// Phase 5: Newell AI Vision Service
// Image analysis for smart scanning using newell-ai skill
import { AI } from '@/lib/groq';

export interface ScannedTask {
  title: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  tag?: string;
  priority?: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface VisionAnalysisResult {
  tasks: ScannedTask[];
  rawText: string;
  confidence: number;
}

export class NewellVisionService {
  /**
   * Analyze an image containing tasks (handwritten lists, whiteboards, flyers)
   * Uses Newell AI vision capabilities to extract structured task data
   */
  static async analyzeTaskImage(imageUri: string): Promise<VisionAnalysisResult> {
    try {
      // Use Newell AI to analyze the image
      const prompt = `Analyze this image and extract all tasks, to-dos, or action items you can find.

For each task found, provide:
- Title: A clear, concise description of the task
- Description: Any additional details or context (optional)
- Due date: If a date is mentioned, format as YYYY-MM-DD (optional)
- Due time: If a time is mentioned, format as HH:MM in 24-hour format (optional)
- Category/Tag: Infer the category (work, personal, errands, etc.) (optional)
- Priority: Infer priority based on urgency words (high, medium, or low)
- Confidence: Your confidence in this task extraction (0-1)

Return a JSON array of tasks. Example:
[
  {
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "dueDate": "2025-02-10",
    "dueTime": "17:00",
    "tag": "errands",
    "priority": "medium",
    "confidence": 0.95
  }
]

If you can't find any clear tasks, return an empty array.`;

      const result = await AI.analyzeImage({
        imageUri,
        prompt,
      });

      // Parse the AI response
      const response = result.text || '[]';

      // Try to extract JSON from the response
      let tasks: ScannedTask[] = [];
      try {
        // Look for JSON array in the response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          tasks = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        // Fallback: try to extract tasks from plain text
        tasks = this.extractTasksFromText(response);
      }

      return {
        tasks,
        rawText: response,
        confidence: tasks.length > 0 ? Math.min(...tasks.map(t => t.confidence)) : 0,
      };
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw new Error('Failed to analyze image');
    }
  }

  /**
   * Fallback: Extract tasks from plain text response
   */
  private static extractTasksFromText(text: string): ScannedTask[] {
    const tasks: ScannedTask[] = [];

    // Split by common delimiters
    const lines = text.split(/[\n\r•\-\*]/);

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and very short lines
      if (trimmed.length < 3) continue;

      // Skip lines that look like instructions or headers
      if (trimmed.toLowerCase().includes('task') && trimmed.length < 20) continue;

      // This looks like a task
      tasks.push({
        title: trimmed,
        confidence: 0.6, // Lower confidence for text extraction
        priority: 'medium',
        tag: 'personal',
      });
    }

    return tasks.slice(0, 10); // Limit to 10 tasks max
  }

  /**
   * Extract text from an image using OCR
   */
  static async extractText(imageUri: string): Promise<string> {
    try {
      const result = await AI.analyzeImage({
        imageUri,
        prompt: 'Extract all visible text from this image. Return only the text, nothing else.',
      });

      return result.text || '';
    } catch (error) {
      console.error('Error extracting text:', error);
      throw new Error('Failed to extract text from image');
    }
  }
}
