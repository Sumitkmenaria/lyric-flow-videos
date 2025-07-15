import { Card } from "@/components/ui/card";
import { 
  Smartphone, 
  Monitor, 
  BarChart3, 
  Sparkles, 
  Zap, 
  Download,
  Palette,
  Timer,
  Settings
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Smartphone,
      title: "Vertical Format",
      description: "Perfect 1080x1920 videos for Instagram Reels, TikTok, and YouTube Shorts",
      gradient: "from-pink-500 to-purple-600"
    },
    {
      icon: Monitor,
      title: "Horizontal Format", 
      description: "Standard 1920x1080 videos for YouTube and other platforms",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: BarChart3,
      title: "Audio Visualization",
      description: "Dynamic waveforms and particle effects that react to your music",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      icon: Sparkles,
      title: "Smart Sync",
      description: "AI-powered lyric timing that automatically syncs text with audio",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: Palette,
      title: "Color Extraction",
      description: "Automatically generates beautiful backgrounds from your cover image",
      gradient: "from-purple-500 to-pink-600"
    },
    {
      icon: Zap,
      title: "Instant Processing",
      description: "Fast rendering powered by modern web technologies",
      gradient: "from-indigo-500 to-purple-600"
    },
    {
      icon: Timer,
      title: "Precise Timing",
      description: "Manual timestamp editing for perfect lyric synchronization",
      gradient: "from-red-500 to-pink-500"
    },
    {
      icon: Settings,
      title: "Customizable Effects",
      description: "Adjust zoom, pan, rotate effects and animation styles",
      gradient: "from-slate-500 to-gray-600"
    },
    {
      icon: Download,
      title: "Multiple Formats",
      description: "Export in various quality settings and video formats",
      gradient: "from-teal-500 to-blue-600"
    }
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground via-accent to-primary bg-clip-text text-transparent">
            Powerful Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to create professional music videos that captivate your audience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-gradient-card border-glass p-6 shadow-card hover:shadow-glow transition-all duration-300 group">
              <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* Call to action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-card border-glass rounded-2xl p-8 shadow-card max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4 text-foreground">Ready to create stunning music videos?</h3>
            <p className="text-muted-foreground mb-6">
              Join thousands of creators who are already using LyricMotion to bring their music to life
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">1M+</div>
                <div className="text-sm text-muted-foreground">Videos Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">50K+</div>
                <div className="text-sm text-muted-foreground">Happy Creators</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">Processing</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;