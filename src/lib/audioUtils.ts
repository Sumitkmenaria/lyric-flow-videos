export interface AudioData {
  audioBuffer: AudioBuffer;
  waveformData: number[];
  duration: number;
  sampleRate: number;
}

export interface WaveformPoint {
  time: number;
  amplitude: number;
}

/**
 * Processes an audio file and extracts waveform data
 */
export const processAudioFile = async (file: File): Promise<AudioData> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const waveformData = generateWaveformData(audioBuffer);
    
    // Close the audio context to free resources
    await audioContext.close();
    
    return {
      audioBuffer,
      waveformData,
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
    };
  } catch (error) {
    console.error('Audio processing error:', error);
    throw new Error(`Failed to process audio file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Generates waveform data from audio buffer
 */
export const generateWaveformData = (audioBuffer: AudioBuffer, points = 1000): number[] => {
  try {
    const channelData = audioBuffer.getChannelData(0); // Use first channel
    const blockSize = Math.floor(channelData.length / points);
    const waveformData: number[] = [];

    for (let i = 0; i < points; i++) {
      const start = i * blockSize;
      const end = Math.min(start + blockSize, channelData.length);
      let sum = 0;

      // Calculate RMS (Root Mean Square) for each block
      for (let j = start; j < end; j++) {
        sum += channelData[j] * channelData[j];
      }

      const rms = Math.sqrt(sum / (end - start));
      waveformData.push(rms);
    }

    // Normalize to 0-1 range
    const maxValue = Math.max(...waveformData);
    if (maxValue === 0) {
      return new Array(points).fill(0);
    }
    
    return waveformData.map(value => value / maxValue);
  } catch (error) {
    console.error('Waveform generation error:', error);
    throw new Error('Failed to generate waveform data');
  }
};

/**
 * Extracts dominant colors from an image for background generation
 */
export const extractColorsFromImage = async (imageFile: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          canvas.width = 100;
          canvas.height = 100;
          ctx?.drawImage(img, 0, 0, 100, 100);

          const imageData = ctx?.getImageData(0, 0, 100, 100);
          if (!imageData) {
            resolve(['#8B5CF6', '#EC4899', '#3B82F6']); // Fallback colors
            return;
          }

          const colorMap = new Map<string, number>();
          
          // Sample pixels and count colors
          for (let i = 0; i < imageData.data.length; i += 4) {
            const r = Math.floor(imageData.data[i] / 32) * 32;
            const g = Math.floor(imageData.data[i + 1] / 32) * 32;
            const b = Math.floor(imageData.data[i + 2] / 32) * 32;
            
            // Skip very dark or very light colors
            const brightness = (r + g + b) / 3;
            if (brightness < 30 || brightness > 225) continue;
            
            const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            colorMap.set(color, (colorMap.get(color) || 0) + 1);
          }

          // Get most frequent colors
          const sortedColors = Array.from(colorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([color]) => color);

          const finalColors = sortedColors.length > 0 ? sortedColors : ['#8B5CF6', '#EC4899', '#3B82F6'];
          resolve(finalColors);
        } catch (error) {
          console.error('Color extraction error:', error);
          resolve(['#8B5CF6', '#EC4899', '#3B82F6']); // Fallback colors
        }
      };

      img.onerror = () => {
        console.error('Failed to load image for color extraction');
        resolve(['#8B5CF6', '#EC4899', '#3B82F6']); // Fallback colors
      };

      img.src = URL.createObjectURL(imageFile);
    } catch (error) {
      console.error('Image processing error:', error);
      resolve(['#8B5CF6', '#EC4899', '#3B82F6']); // Fallback colors
    }
  });
};

/**
 * Analyzes audio for beat detection (simplified)
 */
export const detectBeats = (waveformData: number[], duration: number): number[] => {
  try {
    const beats: number[] = [];
    const threshold = 0.4; // Lower threshold for more beats
    const minInterval = 0.2; // Minimum 200ms between beats
    
    let lastBeat = 0;
    
    for (let i = 1; i < waveformData.length - 1; i++) {
      const current = waveformData[i];
      const prev = waveformData[i - 1];
      const next = waveformData[i + 1];
      
      // Peak detection with threshold
      if (current > threshold && current > prev && current > next) {
        const timePosition = (i / waveformData.length) * duration;
        
        if (timePosition - lastBeat >= minInterval) {
          beats.push(timePosition);
          lastBeat = timePosition;
        }
      }
    }
    
    // If no beats detected, create artificial beats every 2 seconds
    if (beats.length === 0) {
      for (let t = 0; t < duration; t += 2) {
        beats.push(t);
      }
    }
    
    return beats;
  } catch (error) {
    console.error('Beat detection error:', error);
    // Return artificial beats as fallback
    const beats: number[] = [];
    for (let t = 0; t < duration; t += 2) {
      beats.push(t);
    }
    return beats;
  }
};