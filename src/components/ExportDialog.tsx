import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Smartphone, Monitor, Zap, Gauge, Crown } from 'lucide-react';
import { ExportOptions, estimateExportTime } from '@/lib/videoProcessor';
import { ProcessedAudio } from '@/hooks/useAudioProcessor';
import { createVideoBlob, renderVideoFrames, downloadVideoBlob, VideoExportData } from '@/lib/videoExporter';
import { LyricLine } from '@/hooks/useLyricSync';
import { VIDEO_CONFIGS } from '@/lib/videoProcessor';

interface ExportDialogProps {
  audioFile: File;
  coverImage: File;
  processedAudio: ProcessedAudio;
  lyrics: LyricLine[];
  onExport: (options: ExportOptions) => Promise<void>;
  isExporting: boolean;
  exportProgress: number;
}

export const ExportDialog = ({
  audioFile,
  coverImage,
  processedAudio,
  lyrics,
  onExport,
  isExporting,
  exportProgress,
}: ExportDialogProps) => {
  const [format, setFormat] = useState<'vertical' | 'horizontal'>('vertical');
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [includeAudio, setIncludeAudio] = useState(true);

  const handleExport = async () => {
    const options: ExportOptions = {
      format,
      quality,
      includeAudio,
    };

    await exportVideo(options);
  };

  const exportVideo = async (options: ExportOptions) => {
    try {
      const config = VIDEO_CONFIGS[format];
      
      // Create off-screen canvas for rendering
      const canvas = document.createElement('canvas');
      canvas.width = config.width;
      canvas.height = config.height;
      
      const videoData: VideoExportData = {
        audioFile,
        coverImage,
        processedAudio,
        lyrics,
        options,
      };

      // Start the export process
      await onExport(options);
      
      // Render frames and create video
      await renderVideoFrames(canvas, videoData, (progress) => {
        // Progress is handled by parent component
      });
      
      const videoBlob = await createVideoBlob(
        canvas,
        audioFile,
        processedAudio.duration,
        options
      );
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `lyricmotion-${format}-${quality}-${timestamp}.webm`;
      
      // Download the video
      downloadVideoBlob(videoBlob, filename);
      
    } catch (error) {
      console.error('Video export failed:', error);
      throw error;
    }
  };

  const estimatedTime = estimateExportTime(processedAudio.duration, quality);
  const fileSize = {
    low: Math.round(processedAudio.duration * 0.5), // ~0.5MB per second
    medium: Math.round(processedAudio.duration * 1.2), // ~1.2MB per second
    high: Math.round(processedAudio.duration * 2.5), // ~2.5MB per second
  }[quality];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-gradient-primary hover:shadow-glow transition-all duration-300">
          <Download className="w-5 h-5 mr-2" />
          Export Video
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-gradient-card border-glass max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-foreground">
            Export Your Music Video
          </DialogTitle>
        </DialogHeader>

        {!isExporting ? (
          <div className="space-y-6 p-2">
            {/* Format Selection */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold">Video Format</Label>
              <RadioGroup value={format} onValueChange={setFormat as any}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-secondary border-glass p-4 hover:border-primary transition-colors">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <RadioGroupItem value="vertical" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Smartphone className="w-5 h-5 text-primary" />
                          <span className="font-medium">Vertical</span>
                        </div>
                        <p className="text-sm text-muted-foreground">1080×1920</p>
                        <p className="text-xs text-muted-foreground">Perfect for Instagram Reels, TikTok</p>
                      </div>
                    </label>
                  </Card>

                  <Card className="bg-secondary border-glass p-4 hover:border-primary transition-colors">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <RadioGroupItem value="horizontal" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Monitor className="w-5 h-5 text-primary" />
                          <span className="font-medium">Horizontal</span>
                        </div>
                        <p className="text-sm text-muted-foreground">1920×1080</p>
                        <p className="text-xs text-muted-foreground">Perfect for YouTube, Desktop</p>
                      </div>
                    </label>
                  </Card>
                </div>
              </RadioGroup>
            </div>

            {/* Quality Selection */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold">Export Quality</Label>
              <RadioGroup value={quality} onValueChange={setQuality as any}>
                <div className="space-y-3">
                  <Card className="bg-secondary border-glass p-4 hover:border-primary transition-colors">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="low" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <Zap className="w-4 h-4 text-green-500" />
                            <span className="font-medium">Fast</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Quick export, smaller file size</p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>~{Math.round(estimatedTime * 0.7)}s</div>
                        <div>~{Math.round(fileSize * 0.4)}MB</div>
                      </div>
                    </label>
                  </Card>

                  <Card className="bg-secondary border-glass p-4 hover:border-primary transition-colors">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="medium" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <Gauge className="w-4 h-4 text-yellow-500" />
                            <span className="font-medium">Balanced</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Good quality and reasonable file size</p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>~{estimatedTime}s</div>
                        <div>~{fileSize}MB</div>
                      </div>
                    </label>
                  </Card>

                  <Card className="bg-secondary border-glass p-4 hover:border-primary transition-colors">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="high" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <Crown className="w-4 h-4 text-purple-500" />
                            <span className="font-medium">Premium</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Best quality, larger file size</p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>~{Math.round(estimatedTime * 1.5)}s</div>
                        <div>~{Math.round(fileSize * 2)}MB</div>
                      </div>
                    </label>
                  </Card>
                </div>
              </RadioGroup>
            </div>

            {/* Export Options */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold">Options</Label>
              <Card className="bg-secondary border-glass p-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAudio}
                    onChange={(e) => setIncludeAudio(e.target.checked)}
                    className="rounded border-glass"
                  />
                  <div>
                    <span className="font-medium">Include Audio</span>
                    <p className="text-sm text-muted-foreground">
                      Export with synchronized audio track
                    </p>
                  </div>
                </label>
              </Card>
            </div>

            {/* Export Button */}
            <Button
              onClick={handleExport}
              size="lg"
              className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              <Download className="w-5 h-5 mr-2" />
              Start Export
            </Button>
          </div>
        ) : (
          /* Export Progress */
          <div className="space-y-6 text-center p-6">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">
                Generating Your Video...
              </h3>
              <p className="text-muted-foreground">
                This may take a few minutes depending on the video length and quality
              </p>
            </div>

            <div className="space-y-3">
              <Progress value={exportProgress} className="w-full h-3" />
              <p className="text-sm text-muted-foreground">
                {Math.round(exportProgress)}% Complete
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Format</p>
                <p className="font-medium capitalize">{format}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Quality</p>
                <p className="font-medium capitalize">{quality}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Please keep this tab open while exporting...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};