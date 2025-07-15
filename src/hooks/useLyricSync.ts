import { useState, useCallback } from 'react';

export interface LyricLine {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  words?: LyricWord[];
}

export interface LyricWord {
  text: string;
  startTime: number;
  endTime: number;
}

export const useLyricSync = () => {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(true);

  /**
   * Parse lyrics text into lines and auto-generate timing
   */
  const parseLyrics = useCallback((lyricsText: string, audioDuration: number) => {
    const lines = lyricsText
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.trim());

    if (lines.length === 0) return [];

    const averageLineTime = audioDuration / lines.length;
    
    const parsedLyrics: LyricLine[] = lines.map((text, index) => ({
      id: `line-${index}`,
      text,
      startTime: index * averageLineTime,
      endTime: (index + 1) * averageLineTime,
    }));

    setLyrics(parsedLyrics);
    return parsedLyrics;
  }, []);

  /**
   * Auto-sync lyrics with beat detection
   */
  const autoSyncWithBeats = useCallback((lyricsText: string, beats: number[]) => {
    const lines = lyricsText
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.trim());

    if (lines.length === 0 || beats.length === 0) return [];

    // Distribute lyrics across available beats
    const beatsPerLine = Math.max(1, Math.floor(beats.length / lines.length));
    
    const syncedLyrics: LyricLine[] = lines.map((text, index) => {
      const startBeatIndex = index * beatsPerLine;
      const endBeatIndex = Math.min(startBeatIndex + beatsPerLine, beats.length - 1);
      
      return {
        id: `line-${index}`,
        text,
        startTime: beats[startBeatIndex] || index * 3, // Fallback to 3-second intervals
        endTime: beats[endBeatIndex] || (index + 1) * 3,
      };
    });

    setLyrics(syncedLyrics);
    return syncedLyrics;
  }, []);

  /**
   * Update timing for a specific lyric line
   */
  const updateLyricTiming = useCallback((id: string, startTime: number, endTime: number) => {
    setLyrics(prev => prev.map(lyric => 
      lyric.id === id 
        ? { ...lyric, startTime, endTime }
        : lyric
    ));
  }, []);

  /**
   * Get current lyric based on playback time
   */
  const getCurrentLyric = useCallback((currentTime: number): LyricLine | null => {
    const current = lyrics.find(lyric => 
      currentTime >= lyric.startTime && currentTime <= lyric.endTime
    );
    
    const currentIndex = current ? lyrics.findIndex(l => l.id === current.id) : -1;
    setCurrentLyricIndex(currentIndex);
    
    return current || null;
  }, [lyrics]);

  /**
   * Get upcoming lyrics for preview
   */
  const getUpcomingLyrics = useCallback((currentTime: number, count = 3): LyricLine[] => {
    return lyrics
      .filter(lyric => lyric.startTime > currentTime)
      .slice(0, count);
  }, [lyrics]);

  /**
   * Export lyrics with timing data
   */
  const exportLyrics = useCallback(() => {
    return lyrics.map(lyric => ({
      text: lyric.text,
      start: lyric.startTime.toFixed(2),
      end: lyric.endTime.toFixed(2),
    }));
  }, [lyrics]);

  return {
    lyrics,
    currentLyricIndex,
    isAutoSyncEnabled,
    setIsAutoSyncEnabled,
    parseLyrics,
    autoSyncWithBeats,
    updateLyricTiming,
    getCurrentLyric,
    getUpcomingLyrics,
    exportLyrics,
  };
};