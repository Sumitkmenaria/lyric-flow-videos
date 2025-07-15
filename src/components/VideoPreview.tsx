import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { VideoCanvas } from './VideoCanvas';
import { LyricLine } from '@/hooks/useLyricSync';
import { ProcessedAudio } from '@/hooks/useAudioProcessor';
import { VIDEO_CONFIGS } from '@/lib/videoProcessor';

interface VideoPreviewProps {
  audioFile: File;
  coverImage: File;
  processedAudio: ProcessedAudio;
  lyrics: LyricLine[];
  getCurrentLyric: (time: number) => LyricLine | null;
  getUpcomingLyrics: (time: number) => LyricLine[];
  format: 'vertical' | 'horizontal';
  currentTime: number;
  isPlaying: boolean;
  onSeek: (value: number[]) => void;
  onTogglePlay: () => void;
}

export const VideoPreview = ({
  audioFile,
  coverImage,
  processedAudio,
  lyrics,
  getCurrentLyric,
  getUpcomingLyrics,
  format,
  currentTime,
  isPlaying,
  onSeek,
  onTogglePlay,
}: VideoPreviewProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState(1);
  const [audioUrl, setAudioUrl] = useState<string>('');

  const config = VIDEO_CONFIGS[format];
  const currentLyric = getCurrentLyric(currentTime);
  const upcomingLyrics = getUpcomingLyrics(currentTime);

  // Initialize audio
  useEffect(() => {
    const url = URL.createObjectURL(audioFile);
    setAudioUrl(url);

    const audio = new Audio(url);
    audio.volume = volume;
    audioRef.current = audio;

    return () => {
      URL.revokeObjectURL(url);
      audio.pause();
    };
  }, [audioFile, volume]);

  const handleSeek = (value: number[]) => {
    onSeek(value);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const skipBackward = () => {
    const newTime = Math.max(0, currentTime - 10);
    onSeek([newTime]);
  };

  const skipForward = () => {
    const newTime = Math.min(processedAudio.duration, currentTime + 10);
    onSeek([newTime]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Video Preview */}
      <Card className="bg-gradient-card border-glass p-6 shadow-card">
        <div className="text-center mb-4">
          <h3 className="text-xl font-semibold text-foreground">
            Preview - {format === 'vertical' ? 'Vertical' : 'Horizontal'} Format
          </h3>
          <p className="text-muted-foreground">
            {config.width} × {config.height} pixels
          </p>
        </div>

        <div className="flex justify-center">
          <div className="relative">
            <div className="max-w-full overflow-hidden">
            <VideoCanvas
              width={config.width}
              height={config.height}
              currentTime={currentTime}
              currentLyric={currentLyric}
              upcomingLyrics={upcomingLyrics}
              coverImage={coverImage}
              processedAudio={processedAudio}
              isPlaying={isPlaying}
            />
            </div>
            
            {/* Play overlay for when paused */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
                <Button
                  size="lg"
                  onClick={onTogglePlay}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-16 h-16"
                >
                  <Play className="w-8 h-8 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Playback Controls */}
      <Card className="bg-gradient-card border-glass p-6 shadow-card">
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(processedAudio.duration)}</span>
            </div>
            <Slider
              value={[currentTime]}
              onValueChange={handleSeek}
              max={processedAudio.duration}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center space-x-4">
            <Button variant="ghost" size="sm" onClick={skipBackward}>
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button onClick={onTogglePlay} size="lg" className="rounded-full">
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-1" />
              )}
            </Button>
            
            <Button variant="ghost" size="sm" onClick={skipForward}>
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-3 max-w-xs mx-auto">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              max={1}
              step={0.01}
              className="flex-1"
            />
          </div>
        </div>
      </Card>

      {/* Current Lyric Display */}
      {currentLyric && (
        <Card className="bg-gradient-card border-glass p-4 shadow-card text-center">
          <p className="text-lg font-medium text-foreground">
            Current Lyric:
          </p>
          <p className="text-xl text-accent mt-2">
            "{currentLyric.text}"
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {formatTime(currentLyric.startTime)} - {formatTime(currentLyric.endTime)}
          </p>
        </Card>
      )}
    </div>
  );
};