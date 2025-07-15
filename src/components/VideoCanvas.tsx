import { useEffect, useRef, useState } from 'react';
import { LyricLine } from '@/hooks/useLyricSync';
import { ProcessedAudio } from '@/hooks/useAudioProcessor';

interface VideoCanvasProps {
  width: number;
  height: number;
  currentTime: number;
  currentLyric: LyricLine | null;
  upcomingLyrics: LyricLine[];
  coverImage: File;
  processedAudio: ProcessedAudio;
  isPlaying: boolean;
  onFrameRender?: (time: number) => void;
}

export const VideoCanvas = ({
  width,
  height,
  currentTime,
  currentLyric,
  upcomingLyrics,
  coverImage,
  processedAudio,
  isPlaying,
  onFrameRender,
}: VideoCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Load cover image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.src = URL.createObjectURL(coverImage);

    return () => {
      URL.revokeObjectURL(img.src);
    };
  }, [coverImage]);

  // Render frame
  const renderFrame = (time: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const image = imageRef.current;

    if (!canvas || !ctx || !image || !imageLoaded) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Create animated background based on dominant colors
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    const colorIndex = Math.floor((time * 0.5) % processedAudio.dominantColors.length);
    const color1 = processedAudio.dominantColors[colorIndex] || '#8B5CF6';
    const color2 = processedAudio.dominantColors[(colorIndex + 1) % processedAudio.dominantColors.length] || '#EC4899';
    
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add animated particles based on waveform
    renderParticles(ctx, time, processedAudio.waveformData, width, height);

    // Render cover image with zoom/rotation effects
    const imageSize = Math.min(width, height) * 0.6;
    const imageX = (width - imageSize) / 2;
    const imageY = (height - imageSize) / 2 - 100;

    ctx.save();
    ctx.translate(imageX + imageSize / 2, imageY + imageSize / 2);
    
    // Gentle rotation and scale based on audio
    const waveformIndex = Math.floor((time / processedAudio.duration) * processedAudio.waveformData.length);
    const amplitude = processedAudio.waveformData[waveformIndex] || 0;
    const scale = 1 + amplitude * 0.1;
    const rotation = Math.sin(time * 0.5) * 0.05 + amplitude * 0.02;
    
    ctx.scale(scale, scale);
    ctx.rotate(rotation);
    ctx.drawImage(image, -imageSize / 2, -imageSize / 2, imageSize, imageSize);
    ctx.restore();

    // Render lyrics
    renderLyrics(ctx, currentLyric, upcomingLyrics, width, height, time);

    // Render waveform visualization
    renderWaveform(ctx, processedAudio.waveformData, time, processedAudio.duration, width, height);

    onFrameRender?.(time);
  };

  // Render animated particles
  const renderParticles = (
    ctx: CanvasRenderingContext2D,
    time: number,
    waveformData: number[],
    width: number,
    height: number
  ) => {
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
      const waveIndex = Math.floor((i / particleCount) * waveformData.length);
      const amplitude = waveformData[waveIndex] || 0;
      
      if (amplitude < 0.3) continue; // Only show particles on peaks
      
      const x = (i / particleCount) * width;
      const y = height * 0.8 + Math.sin(time * 2 + i) * 20 * amplitude;
      const size = 2 + amplitude * 4;
      const alpha = amplitude * 0.7;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  // Render lyrics with animations
  const renderLyrics = (
    ctx: CanvasRenderingContext2D,
    currentLyric: LyricLine | null,
    upcomingLyrics: LyricLine[],
    width: number,
    height: number,
    time: number
  ) => {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Current lyric
    if (currentLyric) {
      const progress = (time - currentLyric.startTime) / (currentLyric.endTime - currentLyric.startTime);
      const scale = 1 + Math.sin(progress * Math.PI) * 0.1;
      
      ctx.save();
      ctx.font = `bold ${48 * scale}px Arial`;
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      
      const lyricY = height * 0.75;
      ctx.strokeText(currentLyric.text, width / 2, lyricY);
      ctx.fillText(currentLyric.text, width / 2, lyricY);
      ctx.restore();
    }

    // Upcoming lyrics (faded)
    upcomingLyrics.forEach((lyric, index) => {
      if (index >= 2) return; // Only show next 2 lines
      
      ctx.save();
      ctx.font = '32px Arial';
      ctx.fillStyle = `rgba(255, 255, 255, ${0.5 - index * 0.2})`;
      
      const lyricY = height * 0.85 + (index + 1) * 40;
      ctx.fillText(lyric.text, width / 2, lyricY);
      ctx.restore();
    });
  };

  // Render waveform visualization
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
      
      // Color based on playback progress
      const barProgress = index / waveformData.length;
      if (barProgress <= progress) {
        ctx.fillStyle = '#8B5CF6'; // Purple for played
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; // Semi-transparent for unplayed
      }
      
      ctx.fillRect(x, barY, Math.max(1, barWidth - 1), barHeight);
    });
    
    ctx.restore();
  };

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const animate = () => {
      renderFrame(currentTime);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [currentTime, isPlaying, currentLyric, upcomingLyrics, imageLoaded]);

  // Render static frame when not playing
  useEffect(() => {
    if (!isPlaying && imageLoaded) {
      renderFrame(currentTime);
    }
  }, [currentTime, isPlaying, imageLoaded]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-auto border border-glass rounded-lg shadow-card max-w-full"
      style={{ aspectRatio: `${width}/${height}` }}
    />
  );
};