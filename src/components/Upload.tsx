import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload as UploadIcon, Music, Image, FileText, X } from "lucide-react";
import { useState } from "react";

const Upload = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [lyrics, setLyrics] = useState("");

  const handleFileUpload = (file: File, type: 'audio' | 'image') => {
    if (type === 'audio') {
      setAudioFile(file);
    } else {
      setImageFile(file);
    }
  };

  const removeFile = (type: 'audio' | 'image') => {
    if (type === 'audio') {
      setAudioFile(null);
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

        {/* Generate Button */}
        <div className="text-center mt-8">
          <Button
            size="lg"
            disabled={!audioFile || !imageFile || !lyrics.trim()}
            className="bg-gradient-primary hover:shadow-glow transition-all duration-300 text-lg px-12 py-6"
          >
            <UploadIcon className="w-5 h-5 mr-2" />
            Generate Music Video
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Upload;