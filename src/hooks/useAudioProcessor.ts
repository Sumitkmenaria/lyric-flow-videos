import { useState, useCallback } from 'react';
import { processAudioFile, extractColorsFromImage, detectBeats, AudioData } from '@/lib/audioUtils';

export interface ProcessedAudio extends AudioData {
  beats: number[];
  dominantColors: string[];
}

export const useAudioProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedAudio, setProcessedAudio] = useState<ProcessedAudio | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(async (audioFile: File, imageFile: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Process audio and image in parallel
      const [audioData, dominantColors] = await Promise.all([
        processAudioFile(audioFile),
        extractColorsFromImage(imageFile),
      ]);

      // Detect beats from waveform
      const beats = detectBeats(audioData.waveformData, audioData.duration);

      const processedData: ProcessedAudio = {
        ...audioData,
        beats,
        dominantColors,
      };

      setProcessedAudio(processedData);
      return processedData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process files';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProcessedAudio(null);
    setError(null);
    setIsProcessing(false);
  }, []);

  return {
    processFiles,
    processedAudio,
    isProcessing,
    error,
    reset,
  };
};