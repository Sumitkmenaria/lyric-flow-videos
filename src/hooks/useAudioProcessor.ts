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

  const processFiles = useCallback(async (audioFile: File, imageFile: File): Promise<ProcessedAudio> => {
    setIsProcessing(true);
    setError(null);

    try {
      // Validate file types
      if (!audioFile.type.startsWith('audio/')) {
        throw new Error('Invalid audio file type');
      }
      
      if (!imageFile.type.startsWith('image/')) {
        throw new Error('Invalid image file type');
      }

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
      setError(null);
      return processedData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process files';
      setError(errorMessage);
      console.error('Audio processing error:', err);
      throw new Error(errorMessage);
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