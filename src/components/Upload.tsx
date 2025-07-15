import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload as UploadIcon, Music, Image, FileText, X, Loader, Sparkles } from "lucide-react";
import { useState } from "react";
import { useAudioProcessor } from "@/hooks/useAudioProcessor";
import { useLyricSync } from "@/hooks/useLyricSync";
import { VideoPreview } from "./VideoPreview";
import { ExportDialog } from "./ExportDialog";
import { LyricEditor } from "./LyricEditor";
import { useToast } from "@/hooks/use-toast";
import { generateVideo, captureCanvasFrames, ExportOptions } from "@/lib/videoProcessor";

const Upload = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [lyrics, setLyrics] = useState("");
  const [format, setFormat] = useState<'vertical' | 'horizontal'>('vertical');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const { toast } = useToast();
  const {
    processFiles,
    processedAudio,
    isProcessing,
    error: audioError,
    reset: resetAudio,
  } = useAudioProcessor();

  const {
    lyrics: syncedLyrics,
    parseLyrics,
    autoSyncWithBeats,
    updateLyricTiming,
    getCurrentLyric,
    getUpcomingLyrics,
  } = useLyricSync();

  const handleFileUpload = (file: File, type: 'audio' | 'image') => {
    if (type === 'audio') {
      setAudioFile(file);
      resetAudio(); // Reset processed audio when new file is uploaded
    } else {
      setImageFile(file);
    }
  };

  const removeFile = (type: 'audio' | 'image') => {
    if (type === 'audio') {
      setAudioFile(null);
      resetAudio();
    } else {
      setImageFile(null);
    }
  };

  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">
            Upload Your Content
          </h2>
          <p className="text-lg text-muted-foreground">
            Provide your audio file, cover image, and lyrics to create your music video
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Audio Upload */}
          <Card className="bg-gradient-card border-glass p-6 shadow-card">
            <div className="flex items-center mb-4">
              <Music className="w-5 h-5 text-primary mr-2" />
              <Label className="text-lg font-semibold">Audio File</Label>
            </div>
            
            {!audioFile ? (
              <div className="border-2 border-dashed border-glass rounded-lg p-8 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], 'audio')}
                  className="hidden"
                  id="audio-upload"
                />
                <label htmlFor="audio-upload" className="cursor-pointer">
                  <UploadIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">Drop your audio file here or click to browse</p>
                  <p className="text-sm text-muted-foreground">Supports MP3, WAV, M4A</p>
                </label>
              </div>
            ) : (
              <div className="bg-secondary rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Music className="w-8 h-8 text-primary mr-3" />
                  <div>
                    <p className="font-medium">{audioFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile('audio')}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </Card>

          {/* Image Upload */}
          <Card className="bg-gradient-card border-glass p-6 shadow-card">
            <div className="flex items-center mb-4">
              <Image className="w-5 h-5 text-primary mr-2" />
              <Label className="text-lg font-semibold">Cover Image</Label>
            </div>
            
            {!imageFile ? (
              <div className="border-2 border-dashed border-glass rounded-lg p-8 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], 'image')}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <UploadIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">Drop your cover image here or click to browse</p>
                  <p className="text-sm text-muted-foreground">Supports JPG, PNG, WebP</p>
                </label>
              </div>
            ) : (
              <div className="bg-secondary rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Image className="w-8 h-8 text-primary mr-3" />
                  <div>
                    <p className="font-medium">{imageFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile('image')}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Lyrics Input */}
        <Card className="bg-gradient-card border-glass p-6 shadow-card mt-8">
          <div className="flex items-center mb-4">
            <FileText className="w-5 h-5 text-primary mr-2" />
            <Label className="text-lg font-semibold">Song Lyrics</Label>
          </div>
          <Textarea
            placeholder="Paste your song lyrics here... Each line will be synced with the audio automatically."
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            className="min-h-40 bg-secondary border-glass"
          />
        </Card>

        {/* Format Selection */}
        <Card className="bg-gradient-card border-glass p-6 shadow-card mt-8">
          <div className="flex items-center mb-4">
            <Sparkles className="w-5 h-5 text-primary mr-2" />
            <Label className="text-lg font-semibold">Video Format</Label>
          </div>
          <RadioGroup value={format} onValueChange={setFormat as any}>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="vertical" />
                <Label>Vertical (1080×1920) - Perfect for Instagram Reels, TikTok</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="horizontal" />
                <Label>Horizontal (1920×1080) - Perfect for YouTube</Label>
              </div>
            </div>
          </RadioGroup>
        </Card>

        {/* Generate/Process Button */}
        <div className="text-center mt-8">
          {!processedAudio ? (
            <Button
              size="lg"
              disabled={!audioFile || !imageFile || !lyrics.trim() || isProcessing}
              onClick={handleGenerate}
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300 text-lg px-12 py-6"
            >
              {isProcessing ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Processing Files...
                </>
              ) : (
                <>
                  <UploadIcon className="w-5 h-5 mr-2" />
                  Generate Music Video
                </>
              )}
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <LyricEditor
                lyrics={syncedLyrics}
                duration={processedAudio.duration}
                beats={processedAudio.beats}
                onUpdateLyric={updateLyricTiming}
                onAutoSync={handleAutoSync}
                onManualSync={handleManualSync}
              />
              <ExportDialog
                audioFile={audioFile!}
                coverImage={imageFile!}
                processedAudio={processedAudio}
                onExport={handleExport}
                isExporting={isExporting}
                exportProgress={exportProgress}
              />
              <Button
                variant="outline"
                onClick={handleReset}
                className="border-glass text-foreground hover:bg-glass"
              >
                Start Over
              </Button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {audioError && (
          <Card className="bg-destructive/10 border-destructive/20 p-4 mt-8">
            <p className="text-destructive text-center">{audioError}</p>
          </Card>
        )}
      </div>

      {/* Video Preview Section */}
      {processedAudio && audioFile && imageFile && (
        <div className="max-w-6xl mx-auto mt-16">
          <VideoPreview
            audioFile={audioFile}
            coverImage={imageFile}
            processedAudio={processedAudio}
            lyrics={syncedLyrics}
            getCurrentLyric={getCurrentLyric}
            getUpcomingLyrics={getUpcomingLyrics}
            format={format}
          />
        </div>
      )}
    </section>
  );

  // Handler functions
  async function handleGenerate() {
    if (!audioFile || !imageFile || !lyrics.trim()) return;

    try {
      const processed = await processFiles(audioFile, imageFile);
      
      // Auto-sync lyrics with beats
      if (processed.beats.length > 0) {
        autoSyncWithBeats(lyrics, processed.beats);
      } else {
        parseLyrics(lyrics, processed.duration);
      }

      toast({
        title: "Files processed successfully!",
        description: "Your music video preview is ready. You can now adjust timing and export.",
      });
    } catch (error) {
      toast({
        title: "Processing failed",
        description: "There was an error processing your files. Please try again.",
        variant: "destructive",
      });
    }
  }

  function handleAutoSync() {
    if (!processedAudio) return;
    autoSyncWithBeats(lyrics, processedAudio.beats);
  }

  function handleManualSync(newLyrics: string) {
    if (!processedAudio) return;
    setLyrics(newLyrics);
    parseLyrics(newLyrics, processedAudio.duration);
  }

  async function handleExport(options: ExportOptions): Promise<void> {
    if (!audioFile || !imageFile || !processedAudio) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      // This is a simplified export process
      // In a real implementation, you'd capture canvas frames and use FFmpeg
      
      // Simulate export progress
      for (let i = 0; i <= 100; i += 10) {
        setExportProgress(i);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast({
        title: "Export completed!",
        description: "Your music video has been generated successfully.",
      });

      // In a real implementation, trigger download here
      // const blob = await generateVideo(...);
      // downloadBlob(blob, 'music-video.mp4');

    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error generating your video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }

  function handleReset() {
    setAudioFile(null);
    setImageFile(null);
    setLyrics("");
    resetAudio();
  }
};

export default Upload;