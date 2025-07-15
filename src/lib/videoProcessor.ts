import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

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
 * Initialize FFmpeg instance
 */
export const initializeFFmpeg = async (): Promise<FFmpeg> => {
  const ffmpeg = new FFmpeg();
  
  if (!ffmpeg.loaded) {
    await ffmpeg.load({
      coreURL: '/ffmpeg-core.js',
      wasmURL: '/ffmpeg-core.wasm',
    });
  }
  
  return ffmpeg;
};

/**
 * Generate video frames from canvas and combine with audio
 */
export const generateVideo = async (
  canvasFrames: ImageData[],
  audioFile: File,
  config: VideoConfig,
  options: ExportOptions
): Promise<Blob> => {
  const ffmpeg = await initializeFFmpeg();
  
  try {
    // Write audio file
    if (options.includeAudio) {
      await ffmpeg.writeFile('input_audio.mp3', await fetchFile(audioFile));
    }
    
    // Write video frames as images
    for (let i = 0; i < canvasFrames.length; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = config.width;
      canvas.height = config.height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.putImageData(canvasFrames[i], 0, 0);
        
        // Convert canvas to blob then to Uint8Array
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), 'image/png');
        });
        
        await ffmpeg.writeFile(`frame_${i.toString().padStart(6, '0')}.png`, await fetchFile(blob));
      }
    }
    
    const quality = QUALITY_SETTINGS[options.quality];
    const framerate = config.fps;
    
    // FFmpeg command to create video
    const ffmpegArgs = [
      '-framerate', framerate.toString(),
      '-i', 'frame_%06d.png',
      ...(options.includeAudio ? ['-i', 'input_audio.mp3'] : []),
      '-c:v', 'libx264',
      '-crf', quality.crf.toString(),
      '-pix_fmt', 'yuv420p',
      ...(options.includeAudio ? ['-c:a', 'aac', '-b:a', '128k'] : []),
      '-r', framerate.toString(),
      'output.mp4'
    ];
    
    await ffmpeg.exec(ffmpegArgs);
    
    // Read the output file
    const data = await ffmpeg.readFile('output.mp4');
    return new Blob([data], { type: 'video/mp4' });
    
  } catch (error) {
    console.error('Video generation failed:', error);
    throw new Error('Failed to generate video');
  }
};

/**
 * Create frames from canvas rendering
 */
export const captureCanvasFrames = (
  canvas: HTMLCanvasElement,
  duration: number,
  fps: number,
  renderFrame: (time: number) => void
): ImageData[] => {
  const frames: ImageData[] = [];
  const totalFrames = Math.ceil(duration * fps);
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return frames;
  
  for (let frame = 0; frame < totalFrames; frame++) {
    const time = frame / fps;
    renderFrame(time);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    frames.push(imageData);
  }
  
  return frames;
};

/**
 * Estimate export time based on duration and quality
 */
export const estimateExportTime = (duration: number, quality: ExportOptions['quality']): number => {
  const baseTime = duration * 2; // Base: 2x real-time
  const qualityMultiplier = {
    low: 1,
    medium: 1.5,
    high: 2.5,
  }[quality];
  
  return Math.ceil(baseTime * qualityMultiplier);
};