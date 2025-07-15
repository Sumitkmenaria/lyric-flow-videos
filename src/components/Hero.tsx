import { Button } from "@/components/ui/button";
import { Play, Upload, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-hero animate-gradient-shift bg-[size:200%_200%]" />
      
      {/* Background image overlay */}
      <div 
        className="absolute inset-0 opacity-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Floating elements */}
      <div className="absolute top-20 left-20 w-4 h-4 bg-accent rounded-full animate-float opacity-60" />
      <div className="absolute top-40 right-32 w-6 h-6 bg-primary rounded-full animate-float opacity-40" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-32 left-32 w-3 h-3 bg-accent rounded-full animate-float opacity-80" style={{ animationDelay: '2s' }} />
      
      {/* Main content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <div className="flex items-center justify-center mb-6">
          <Sparkles className="w-8 h-8 text-accent mr-3 animate-pulse-glow" />
          <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-foreground via-accent to-primary bg-clip-text text-transparent">
            LyricMotion
          </h1>
          <Sparkles className="w-8 h-8 text-primary ml-3 animate-pulse-glow" />
        </div>
        
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
          Create stunning music videos from a song, lyrics, and a cover image – instantly.
          <br />
          <span className="text-accent font-medium">Perfect for Instagram Reels, YouTube Shorts, and full-length videos.</span>
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button size="lg" className="bg-gradient-primary hover:shadow-glow transition-all duration-300 text-lg px-8 py-6">
            <Upload className="w-5 h-5 mr-2" />
            Start Creating
          </Button>
          <Button variant="outline" size="lg" className="border-glass text-foreground hover:bg-glass text-lg px-8 py-6">
            <Play className="w-5 h-5 mr-2" />
            Watch Demo
          </Button>
        </div>
        
        {/* Feature highlights */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-gradient-card backdrop-blur-sm border border-glass rounded-2xl p-6 shadow-card">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Upload className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Easy Upload</h3>
            <p className="text-muted-foreground">Drop your audio, image, and lyrics to get started in seconds</p>
          </div>
          
          <div className="bg-gradient-card backdrop-blur-sm border border-glass rounded-2xl p-6 shadow-card">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI-Powered</h3>
            <p className="text-muted-foreground">Smart sync timing and beautiful visual effects automatically</p>
          </div>
          
          <div className="bg-gradient-card backdrop-blur-sm border border-glass rounded-2xl p-6 shadow-card">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Play className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Export Ready</h3>
            <p className="text-muted-foreground">Perfect formats for all social media platforms</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;