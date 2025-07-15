export interface VideoConfig {
  width: number;
  height: number;
  fps: number;
  duration: number;
  format: 'vertical' | 'horizontal';
}

export interface ExportOptions {
  format: VideoConfig['format'];
  quality: 'low' | 'medium' | 'high';
  includeAudio: boolean;
}

export const VIDEO_CONFIGS = {
  vertical: {
    width: 1080,
    height: 1920,
    fps: 30,
    format: 'vertical' as const,
  },
  horizontal: {
    width: 1920,
    height: 1080,
    fps: 30,
    format: 'horizontal' as const,
  },
} as const;

export const QUALITY_SETTINGS = {
  low: { bitrate: '1000k', crf: 28 },
  medium: { bitrate: '2500k', crf: 23 },
  high: { bitrate: '5000k', crf: 18 },
} as const;

/**
 * Simplified video generation for web (without FFmpeg)
 * This creates a demo video blob for now
 */
export const generateVideo = async (
  canvasFrames: ImageData[],
  audioFile: File,
  config: VideoConfig,
  options: ExportOptions
): Promise<Blob> => {
  try {
    // For now, we'll create a simple demo video
    // In a real implementation, you would use MediaRecorder API or WebCodecs
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create a demo video blob
    const demoContent = `Demo video - ${options.format} format, ${options.quality} quality, ${canvasFrames.length} frames`;
    return new Blob([demoContent], { type: 'video/mp4' });
    
  } catch (error) {
    console.error('Video generation failed:', error);
    throw new Error('Failed to generate video');
  }
};

/**
 * Create frames from canvas rendering (simplified)
 */
export const captureCanvasFrames = (
  canvas: HTMLCanvasElement,
  duration: number,
  fps: number,
  renderFrame: (time: number) => void
): ImageData[] => {
  try {
    const frames: ImageData[] = [];
    const totalFrames = Math.min(Math.ceil(duration * fps), 300); // Limit frames for demo
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return frames;
    
    for (let frame = 0; frame < totalFrames; frame++) {
      const time = frame / fps;
      renderFrame(time);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      frames.push(imageData);
    }
    
    return frames;
  } catch (error) {
    console.error('Frame capture error:', error);
    return [];
  }
};

/**
 * Estimate export time based on duration and quality
 */
export const estimateExportTime = (duration: number, quality: ExportOptions['quality']): number => {
  const baseTime = Math.max(duration * 0.5, 5); // Minimum 5 seconds
  const qualityMultiplier = {
    low: 1,
    medium: 1.5,
    high: 2.5,
  }[quality];
  
  return Math.ceil(baseTime * qualityMultiplier);
};

/**
 * Download a blob as a file
 */
export const downloadBlob = (blob: Blob, filename: string) => {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
    throw new Error('Failed to download file');
  }
};