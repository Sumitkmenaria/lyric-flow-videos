// Gemini AI integration for lyrics processing
// Note: In production, this should be handled by a backend service for security

interface GeminiResponse {
  lyrics: Array<{
    text: string;
    startTime: number;
    endTime: number;
  }>;
}

export class GeminiAIService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async syncLyricsWithAudio(
    lyrics: string,
    audioDuration: number,
    beats: number[]
  ): Promise<GeminiResponse> {
    try {
      const prompt = this.createSyncPrompt(lyrics, audioDuration, beats);
      
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!generatedText) {
        throw new Error('No response from Gemini AI');
      }

      return this.parseGeminiResponse(generatedText);
    } catch (error) {
      console.error('Gemini AI sync error:', error);
      // Return demo sync as fallback
      return createDemoAISync(lyrics, audioDuration, beats);
    }
  }

  private createSyncPrompt(lyrics: string, duration: number, beats: number[]): string {
    return `
You are a professional music synchronization expert. I need you to sync lyrics with audio timing.

Audio Information:
- Duration: ${duration} seconds
- Detected beats at: ${beats.slice(0, 20).map(b => b.toFixed(2)).join(', ')}${beats.length > 20 ? '...' : ''} seconds

Lyrics to sync:
${lyrics}

Instructions:
1. Distribute the lyrics evenly across the audio duration
2. Align lyric lines with the detected beats when possible
3. Each line should have a start and end time
4. Ensure no overlapping times
5. Leave small gaps between lines for natural flow

Return ONLY a JSON object in this exact format:
{
  "lyrics": [
    {
      "text": "First line of lyrics",
      "startTime": 0.5,
      "endTime": 3.2
    },
    {
      "text": "Second line of lyrics", 
      "startTime": 3.5,
      "endTime": 6.8
    }
  ]
}

Make sure the JSON is valid and properly formatted.
    `;
  }

  private parseGeminiResponse(response: string): GeminiResponse {
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate the structure
      if (!parsed.lyrics || !Array.isArray(parsed.lyrics)) {
        throw new Error('Invalid response structure');
      }

      // Validate each lyric entry
      parsed.lyrics.forEach((lyric: any, index: number) => {
        if (!lyric.text || typeof lyric.startTime !== 'number' || typeof lyric.endTime !== 'number') {
          throw new Error(`Invalid lyric entry at index ${index}`);
        }
      });

      return parsed;
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      throw new Error('Failed to parse AI response');
    }
  }
}

// Demo function for when API key is not available
export function createDemoAISync(lyrics: string, duration: number, beats: number[]): GeminiResponse {
  const lines = lyrics.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    return { lyrics: [] };
  }

  // Use beats if available, otherwise distribute evenly
  if (beats.length >= lines.length) {
    return {
      lyrics: lines.map((text, index) => ({
        text: text.trim(),
        startTime: beats[index] || (index * duration / lines.length),
        endTime: beats[index + 1] || ((index + 1) * duration / lines.length) - 0.2
      }))
    };
  } else {
    const timePerLine = duration / lines.length;
    return {
      lyrics: lines.map((text, index) => ({
        text: text.trim(),
        startTime: index * timePerLine,
        endTime: (index + 1) * timePerLine - 0.2
      }))
    };
  }
}