import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Plus, Trash2, Play, Wand2 } from 'lucide-react';
import { LyricLine } from '@/hooks/useLyricSync';
import { LyricTimeline } from './LyricTimeline';
import { GeminiAIService, createDemoAISync } from '@/lib/geminiAI';

interface LyricEditorProps {
  lyrics: LyricLine[];
  duration: number;
  beats: number[];
  onUpdateLyric: (id: string, startTime: number, endTime: number) => void;
  onAutoSync: () => void;
  onManualSync: (lyricsText: string) => void;
  currentTime?: number;
  isPlaying?: boolean;
  onSeek?: (time: number) => void;
  onTogglePlay?: () => void;
}

export const LyricEditor = ({
  lyrics,
  duration,
  beats,
  onUpdateLyric,
  onAutoSync,
  onManualSync,
  currentTime = 0,
  isPlaying = false,
  onSeek = () => {},
  onTogglePlay = () => {},
}: LyricEditorProps) => {
  const [editingLyric, setEditingLyric] = useState<LyricLine | null>(null);
  const [lyricsText, setLyricsText] = useState(lyrics.map(l => l.text).join('\n'));
  const [isAISyncing, setIsAISyncing] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const parseTime = (timeStr: string): number => {
    const [time, ms] = timeStr.split('.');
    const [mins, secs] = time.split(':').map(Number);
    return mins * 60 + secs + (ms ? Number(ms) / 100 : 0);
  };

  const handleEditLyric = (lyric: LyricLine) => {
    setEditingLyric(lyric);
  };

  const handleSaveLyric = () => {
    if (!editingLyric) return;

    onUpdateLyric(editingLyric.id, editingLyric.startTime, editingLyric.endTime);
    setEditingLyric(null);
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    if (!editingLyric) return;

    const time = parseTime(value);
    setEditingLyric({
      ...editingLyric,
      [field]: Math.max(0, Math.min(duration, time)),
    });
  };

  const handleBulkUpdate = () => {
    onManualSync(lyricsText);
  };

  const handleAISync = async () => {
    setIsAISyncing(true);
    try {
      if (geminiApiKey.trim()) {
        // Use real Gemini AI
        const geminiService = new GeminiAIService(geminiApiKey);
        const result = await geminiService.syncLyricsWithAudio(lyricsText, duration, beats);
        
        // Update lyrics with AI results
        result.lyrics.forEach((aiLyric, index) => {
          const existingLyric = lyrics[index];
          if (existingLyric) {
            onUpdateLyric(existingLyric.id, aiLyric.startTime, aiLyric.endTime);
          }
        });
      } else {
        // Use demo AI sync
        const result = createDemoAISync(lyricsText, duration, beats);
        result.lyrics.forEach((aiLyric, index) => {
          const existingLyric = lyrics[index];
          if (existingLyric) {
            onUpdateLyric(existingLyric.id, aiLyric.startTime, aiLyric.endTime);
          }
        });
      }
    } catch (error) {
      console.error('AI sync failed:', error);
      // Fallback to regular auto-sync
      onAutoSync();
    } finally {
      setIsAISyncing(false);
    }
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="border-glass text-foreground hover:bg-glass">
          <Edit className="w-5 h-5 mr-2" />
          Edit Timing
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-gradient-card border-glass max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-foreground">
            Lyric Timing Editor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[70vh]">
          {/* AI Configuration */}
          <Card className="bg-secondary border-glass p-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">AI-Powered Sync (Optional)</Label>
              <div className="flex space-x-2">
                <Input
                  type="password"
                  placeholder="Enter Gemini API Key for AI sync (optional)"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  className="flex-1 text-xs"
                />
                <Button size="sm" onClick={handleAISync} disabled={isAISyncing}>
                  <Wand2 className="w-4 h-4 mr-1" />
                  {isAISyncing ? 'AI Syncing...' : 'AI Sync'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your free API key from Google AI Studio. Leave empty to use demo sync.
              </p>
            </div>
          </Card>

          {/* Timeline Editor */}
          <LyricTimeline
            lyrics={lyrics}
            duration={duration}
            currentTime={currentTime}
            isPlaying={isPlaying}
            onUpdateLyric={onUpdateLyric}
            onSeek={onSeek}
            onTogglePlay={onTogglePlay}
            onAISync={handleAISync}
            isAISyncing={isAISyncing}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bulk Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Lyrics Text</Label>
              <div className="flex space-x-2">
                <Button size="sm" onClick={onAutoSync} variant="outline">
                  <Wand2 className="w-4 h-4 mr-1" />
                  Beat Sync
                </Button>
                <Button size="sm" onClick={handleBulkUpdate}>
                  <Plus className="w-4 h-4 mr-1" />
                  Apply
                </Button>
              </div>
            </div>

            <Textarea
              value={lyricsText}
              onChange={(e) => setLyricsText(e.target.value)}
              placeholder="Enter lyrics, one line per line..."
              className="min-h-64 bg-secondary border-glass"
            />

            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Each line will become a separate lyric segment</p>
              <p>• Use Beat Sync to distribute lyrics across detected beats</p>
              <p>• Manual timing adjustments available in the timing panel</p>
            </div>
          </div>

          {/* Individual Timing Editor */}
          <div className="space-y-4 overflow-y-auto max-h-96">
            <Label className="text-lg font-semibold">Individual Timing</Label>
            
            <div className="space-y-3">
              {lyrics.map((lyric, index) => (
                <Card key={lyric.id} className="bg-secondary border-glass p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Line {index + 1}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditLyric(lyric)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>

                    <p className="text-sm text-foreground font-medium">
                      "{lyric.text}"
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <Label className="text-xs text-muted-foreground">Start</Label>
                        <p className="font-mono">{formatTime(lyric.startTime)}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">End</Label>
                        <p className="font-mono">{formatTime(lyric.endTime)}</p>
                      </div>
                    </div>

                    <div className="w-full bg-border rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${((lyric.endTime - lyric.startTime) / duration) * 100}%`,
                          marginLeft: `${(lyric.startTime / duration) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
        </div>

        {/* Beat Information */}
        <Card className="bg-secondary border-glass p-4">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-muted-foreground">Detected Beats: </span>
              <span className="font-medium text-foreground">{beats.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Duration: </span>
              <span className="font-medium text-foreground">{formatTime(duration)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Lyrics Lines: </span>
              <span className="font-medium text-foreground">{lyrics.length}</span>
            </div>
          </div>
        </Card>

        {/* Edit Dialog */}
        {editingLyric && (
          <Dialog open={!!editingLyric} onOpenChange={() => setEditingLyric(null)}>
            <DialogContent className="bg-gradient-card border-glass">
              <DialogHeader>
                <DialogTitle>Edit Lyric Timing</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Lyric Text</Label>
                  <p className="text-sm text-foreground bg-secondary p-2 rounded border border-glass">
                    "{editingLyric.text}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time (mm:ss.ms)</Label>
                    <Input
                      id="startTime"
                      value={formatTime(editingLyric.startTime)}
                      onChange={(e) => handleTimeChange('startTime', e.target.value)}
                      className="bg-secondary border-glass"
                    />
                  </div>

                  <div>
                    <Label htmlFor="endTime">End Time (mm:ss.ms)</Label>
                    <Input
                      id="endTime"
                      value={formatTime(editingLyric.endTime)}
                      onChange={(e) => handleTimeChange('endTime', e.target.value)}
                      className="bg-secondary border-glass"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setEditingLyric(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveLyric}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};