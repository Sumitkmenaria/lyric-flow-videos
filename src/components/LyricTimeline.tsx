import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Pause, RotateCcw, Sparkles } from 'lucide-react';
import { LyricLine } from '@/hooks/useLyricSync';

interface LyricTimelineProps {
  lyrics: LyricLine[];
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  onUpdateLyric: (id: string, startTime: number, endTime: number) => void;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  onAISync: () => void;
  isAISyncing: boolean;
}

export const LyricTimeline = ({
  lyrics,
  duration,
  currentTime,
  isPlaying,
  onUpdateLyric,
  onSeek,
  onTogglePlay,
  onAISync,
  isAISyncing,
}: LyricTimelineProps) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [draggedLyric, setDraggedLyric] = useState<string | null>(null);
  const [dragType, setDragType] = useState<'start' | 'end' | 'move' | null>(null);
  const [selectedLyric, setSelectedLyric] = useState<string | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const getTimeFromPosition = (clientY: number) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const position = (clientY - rect.top) / rect.height;
    return Math.max(0, Math.min(duration, position * duration));
  };

  const getPositionFromTime = (time: number) => {
    return (time / duration) * 100;
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (draggedLyric) return;
    const time = getTimeFromPosition(e.clientY);
    onSeek(time);
  };

  const handleLyricMouseDown = (e: React.MouseEvent, lyricId: string, type: 'start' | 'end' | 'move') => {
    e.stopPropagation();
    setDraggedLyric(lyricId);
    setDragType(type);
    setSelectedLyric(lyricId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedLyric || !dragType) return;

    const time = getTimeFromPosition(e.clientY);
    const lyric = lyrics.find(l => l.id === draggedLyric);
    if (!lyric) return;

    let newStartTime = lyric.startTime;
    let newEndTime = lyric.endTime;

    switch (dragType) {
      case 'start':
        newStartTime = Math.max(0, Math.min(time, lyric.endTime - 0.1));
        break;
      case 'end':
        newEndTime = Math.max(lyric.startTime + 0.1, Math.min(time, duration));
        break;
      case 'move':
        const lyricDuration = lyric.endTime - lyric.startTime;
        newStartTime = Math.max(0, Math.min(time, duration - lyricDuration));
        newEndTime = newStartTime + lyricDuration;
        break;
    }

    onUpdateLyric(draggedLyric, newStartTime, newEndTime);
  };

  const handleMouseUp = () => {
    setDraggedLyric(null);
    setDragType(null);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => handleMouseUp();
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <Card className="bg-gradient-card border-glass p-3 md:p-6 shadow-card">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Label className="text-sm md:text-lg font-semibold text-foreground">Lyric Timeline</Label>
          <div className="flex flex-col md:flex-row space-y-1 md:space-y-0 md:space-x-2">
            <Button
              size="sm"
              onClick={onAISync}
              disabled={isAISyncing}
              className="bg-gradient-primary text-xs md:text-sm"
            >
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              {isAISyncing ? 'AI Syncing...' : 'AI Auto-Sync'}
            </Button>
            <Button size="sm" variant="outline" onClick={onTogglePlay} className="text-xs md:text-sm">
              {isPlaying ? <Pause className="w-3 h-3 md:w-4 md:h-4" /> : <Play className="w-3 h-3 md:w-4 md:h-4" />}
            </Button>
          </div>
        </div>

        {/* Vertical Timeline */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs md:text-sm text-muted-foreground">
            <span>0:00</span>
            <span>{formatTime(duration)}</span>
          </div>
          
          <div
            ref={timelineRef}
            className="relative w-full h-64 md:h-96 lg:h-[500px] bg-secondary rounded-lg border border-glass cursor-pointer overflow-y-auto overflow-x-hidden"
            onClick={handleTimelineClick}
            onMouseMove={handleMouseMove}
            style={{ 
              minHeight: '250px',
              maxHeight: '80vh',
              scrollbarWidth: 'thin',
              scrollbarColor: 'hsl(var(--primary)) hsl(var(--secondary))'
            }}
          >
            {/* Time markers */}
            {Array.from({ length: Math.ceil(duration / 10) }, (_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 h-px bg-border"
                style={{ top: `${(i * 10 / duration) * 100}%` }}
              >
                <span className="absolute left-1 -top-2 text-xs md:text-sm text-muted-foreground bg-secondary px-1 rounded">
                  {Math.floor(i * 10 / 60)}:{((i * 10) % 60).toString().padStart(2, '0')}
                </span>
              </div>
            ))}

            {/* Current time indicator */}
            <div
              className="absolute left-0 right-0 h-0.5 bg-primary z-20"
              style={{ top: `${getPositionFromTime(currentTime)}%` }}
            >
              <div className="absolute -left-1 -top-1 w-2 h-2 md:w-3 md:h-3 bg-primary rounded-full" />
            </div>

            {/* Lyric blocks */}
            {lyrics.map((lyric, index) => (
              <div
                key={lyric.id}
                className={`absolute left-1 right-1 md:left-2 md:right-2 rounded cursor-move transition-all ${
                  selectedLyric === lyric.id
                    ? 'bg-accent border-2 border-primary'
                    : 'bg-accent/70 border border-accent hover:bg-accent'
                }`}
                style={{
                  top: `${getPositionFromTime(lyric.startTime)}%`,
                  height: `${getPositionFromTime(lyric.endTime - lyric.startTime)}%`,
                  minHeight: '20px',
                }}
                onMouseDown={(e) => handleLyricMouseDown(e, lyric.id, 'move')}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedLyric(lyric.id);
                }}
              >
                {/* Start handle */}
                <div
                  className="absolute left-0 right-0 top-0 h-1 md:h-2 bg-primary cursor-ns-resize opacity-0 hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleLyricMouseDown(e, lyric.id, 'start')}
                />
                
                {/* End handle */}
                <div
                  className="absolute left-0 right-0 bottom-0 h-1 md:h-2 bg-primary cursor-ns-resize opacity-0 hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleLyricMouseDown(e, lyric.id, 'end')}
                />

                {/* Lyric text */}
                <div className="px-1 md:px-2 py-1 text-xs md:text-sm font-medium text-accent-foreground truncate">
                  {lyric.text}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected lyric details */}
        {selectedLyric && (
          <div className="space-y-2">
            {(() => {
              const lyric = lyrics.find(l => l.id === selectedLyric);
              if (!lyric) return null;
              
              return (
                <div className="bg-secondary rounded-lg p-3 md:p-4 space-y-3">
                  <Label className="text-xs md:text-sm font-medium text-foreground">Selected Lyric</Label>
                  <p className="text-xs md:text-sm text-foreground break-words">"{lyric.text}"</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs md:text-sm text-muted-foreground">Start Time</Label>
                      <Input
                        value={formatTime(lyric.startTime)}
                        onChange={(e) => {
                          const time = parseFloat(e.target.value.replace(':', '')) || 0;
                          onUpdateLyric(lyric.id, time, lyric.endTime);
                        }}
                        className="text-xs md:text-sm bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <Label className="text-xs md:text-sm text-muted-foreground">End Time</Label>
                      <Input
                        value={formatTime(lyric.endTime)}
                        onChange={(e) => {
                          const time = parseFloat(e.target.value.replace(':', '')) || 0;
                          onUpdateLyric(lyric.id, lyric.startTime, time);
                        }}
                        className="text-xs md:text-sm bg-background text-foreground"
                      />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs md:text-sm text-muted-foreground space-y-1">
          <p>• Click on timeline to seek</p>
          <p>• Drag lyric blocks to move them</p>
          <p>• Drag edges to adjust timing</p>
          <p>• Use AI Auto-Sync for intelligent timing</p>
        </div>
      </div>
    </Card>
  );
};