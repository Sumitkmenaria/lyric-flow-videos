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
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext();
  
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const waveformData = generateWaveformData(audioBuffer);
    
    return {
      audioBuffer,
      waveformData,
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
    };
  } finally {
    audioContext.close();
  }
};

/**
 * Generates waveform data from audio buffer
 */
export const generateWaveformData = (audioBuffer: AudioBuffer, points = 1000): number[] => {
  const channelData = audioBuffer.getChannelData(0); // Use first channel
  const blockSize = Math.floor(channelData.length / points);
  const waveformData: number[] = [];

  for (let i = 0; i < points; i++) {
    const start = i * blockSize;
    const end = start + blockSize;
    let sum = 0;

    // Calculate RMS (Root Mean Square) for each block
    for (let j = start; j < end && j < channelData.length; j++) {
      sum += channelData[j] * channelData[j];
    }

    const rms = Math.sqrt(sum / blockSize);
    waveformData.push(rms);
  }

  // Normalize to 0-1 range
  const maxValue = Math.max(...waveformData);
  return waveformData.map(value => value / maxValue);
};

/**
 * Extracts dominant colors from an image for background generation
 */
export const extractColorsFromImage = async (imageFile: File): Promise<string[]> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 100;
      canvas.height = 100;
      ctx?.drawImage(img, 0, 0, 100, 100);

      const imageData = ctx?.getImageData(0, 0, 100, 100);
      if (!imageData) {
        resolve(['#8B5CF6', '#EC4899']); // Fallback colors
        return;
      }

      const colorMap = new Map<string, number>();
      
      // Sample pixels and count colors
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = Math.floor(imageData.data[i] / 32) * 32;
        const g = Math.floor(imageData.data[i + 1] / 32) * 32;
        const b = Math.floor(imageData.data[i + 2] / 32) * 32;
        
        const color = `rgb(${r},${g},${b})`;
        colorMap.set(color, (colorMap.get(color) || 0) + 1);
      }

      // Get most frequent colors
      const sortedColors = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([color]) => color);

      resolve(sortedColors.length > 0 ? sortedColors : ['#8B5CF6', '#EC4899']);
    };

    img.src = URL.createObjectURL(imageFile);
  });
};

/**
 * Analyzes audio for beat detection (simplified)
 */
export const detectBeats = (waveformData: number[], duration: number): number[] => {
  const beats: number[] = [];
  const threshold = 0.6;
  const minInterval = 0.3; // Minimum 300ms between beats
  
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
  
  return beats;
};