import { LyricLine } from '@/hooks/useLyricSync';
import { ProcessedAudio } from '@/hooks/useAudioProcessor';
import { ExportOptions } from '@/lib/videoProcessor';

export interface VideoExportData {
  audioFile: File;
  coverImage: File;
  processedAudio: ProcessedAudio;
  lyrics: LyricLine[];
  options: ExportOptions;
}

/**
 * Creates a video blob using MediaRecorder API and Canvas
 */
export const createVideoBlob = async (
  canvas: HTMLCanvasElement,
  audioFile: File,
  duration: number,
  options: ExportOptions
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const stream = canvas.captureStream(30); // 30 FPS
      
      // Add audio track if requested
      if (options.includeAudio) {
        const audioContext = new AudioContext();
        const audioElement = new Audio(URL.createObjectURL(audioFile));
        const source = audioContext.createMediaElementSource(audioElement);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        
        // Add audio tracks to video stream
        destination.stream.getAudioTracks().forEach(track => {
          stream.addTrack(track);
        });
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: getVideoBitrate(options.quality),
      });

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };

      mediaRecorder.onerror = (event) => {
        reject(new Error('MediaRecorder error: ' + event.error));
      };

      mediaRecorder.start();

      // Stop recording after duration
      setTimeout(() => {
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
      }, duration * 1000);

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Renders video frames to canvas for recording
 */
export const renderVideoFrames = (
  canvas: HTMLCanvasElement,
  videoData: VideoExportData,
  onProgress: (progress: number) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      const { processedAudio, lyrics, coverImage, options } = videoData;
      const fps = 30;
      const totalFrames = Math.ceil(processedAudio.duration * fps);
      let currentFrame = 0;

      // Load cover image
      const img = new Image();
      img.onload = () => {
        const renderFrame = () => {
          if (currentFrame >= totalFrames) {
            resolve();
            return;
          }

          const currentTime = currentFrame / fps;
          
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Render background gradient
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          const colorIndex = Math.floor((currentTime * 0.5) % processedAudio.dominantColors.length);
          const color1 = processedAudio.dominantColors[colorIndex] || '#8B5CF6';
          const color2 = processedAudio.dominantColors[(colorIndex + 1) % processedAudio.dominantColors.length] || '#EC4899';
          
          gradient.addColorStop(0, color1);
          gradient.addColorStop(1, color2);
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Render cover image
          const imageSize = Math.min(canvas.width, canvas.height) * 0.6;
          const imageX = (canvas.width - imageSize) / 2;
          const imageY = (canvas.height - imageSize) / 2 - 100;

          ctx.save();
          ctx.translate(imageX + imageSize / 2, imageY + imageSize / 2);
          
          const waveformIndex = Math.floor((currentTime / processedAudio.duration) * processedAudio.waveformData.length);
          const amplitude = processedAudio.waveformData[waveformIndex] || 0;
          const scale = 1 + amplitude * 0.1;
          const rotation = Math.sin(currentTime * 0.5) * 0.05 + amplitude * 0.02;
          
          ctx.scale(scale, scale);
          ctx.rotate(rotation);
          ctx.drawImage(img, -imageSize / 2, -imageSize / 2, imageSize, imageSize);
          ctx.restore();

          // Render current lyric
          const currentLyric = lyrics.find(lyric => 
            currentTime >= lyric.startTime && currentTime <= lyric.endTime
          );

          if (currentLyric) {
            const progress = (currentTime - currentLyric.startTime) / (currentLyric.endTime - currentLyric.startTime);
            const scale = 1 + Math.sin(progress * Math.PI) * 0.1;
            
            ctx.save();
            ctx.font = `bold ${48 * scale}px Arial`;
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const lyricY = canvas.height * 0.75;
            ctx.strokeText(currentLyric.text, canvas.width / 2, lyricY);
            ctx.fillText(currentLyric.text, canvas.width / 2, lyricY);
            ctx.restore();
          }

          // Render waveform
          renderWaveform(ctx, processedAudio.waveformData, currentTime, processedAudio.duration, canvas.width, canvas.height);

          currentFrame++;
          onProgress((currentFrame / totalFrames) * 100);

          // Continue to next frame
          requestAnimationFrame(renderFrame);
        };

        renderFrame();
      };

      img.onerror = () => reject(new Error('Failed to load cover image'));
      img.src = URL.createObjectURL(coverImage);

    } catch (error) {
      reject(error);
    }
  });
};

const renderWaveform = (
  ctx: CanvasRenderingContext2D,
  waveformData: number[],
  currentTime: number,
  duration: number,
  width: number,
  height: number
) => {
  const waveformHeight = 60;
  const waveformY = height - waveformHeight - 20;
  const barWidth = width / waveformData.length;
  const progress = currentTime / duration;

  ctx.save();
  
  waveformData.forEach((amplitude, index) => {
    const x = index * barWidth;
    const barHeight = amplitude * waveformHeight;
    const barY = waveformY + (waveformHeight - barHeight) / 2;
    
    const barProgress = index / waveformData.length;
    if (barProgress <= progress) {
      ctx.fillStyle = '#8B5CF6';
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    }
    
    ctx.fillRect(x, barY, Math.max(1, barWidth - 1), barHeight);
  });
  
  ctx.restore();
};

const getVideoBitrate = (quality: ExportOptions['quality']): number => {
  switch (quality) {
    case 'low': return 1000000; // 1 Mbps
    case 'medium': return 2500000; // 2.5 Mbps
    case 'high': return 5000000; // 5 Mbps
    default: return 2500000;
  }
};

/**
 * Downloads a blob as a file
 */
export const downloadVideoBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};