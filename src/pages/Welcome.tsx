import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Car, Mic, Brain, Clock, Upload, ArrowRight } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-orchid-subtle flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          {/* Logo */}
          <div className="mx-auto w-28 h-28 bg-orchid-gradient rounded-3xl flex items-center justify-center shadow-2xl">
            <Car className="w-14 h-14 text-white" />
          </div>

          {/* Title & Tagline */}
          <div className="space-y-6">
            <h1 className="text-6xl md:text-7xl font-bold bg-clip-text text-transparent bg-orchid-gradient tracking-tight">
              DriveLearn
            </h1>
            <p className="text-2xl md:text-3xl text-foreground font-medium">
              Turn your commute into study time
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Voice-first learning for your drive. Upload study materials, get AI-generated questions, and learn hands-free during your commute.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-lg hover:shadow-xl transition-shadow border border-primary/10">
              <div className="w-16 h-16 bg-primary/15 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">Upload & Learn</h3>
              <p className="text-sm text-muted-foreground">
                Upload PDFs, docs, or notes. AI generates custom quiz questions from your materials.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-lg hover:shadow-xl transition-shadow border border-primary/10">
              <div className="w-16 h-16 bg-primary/15 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Mic className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">Voice-First Design</h3>
              <p className="text-sm text-muted-foreground">
                100% hands-free. Questions read aloud, answer by voice. Designed for safe commute learning.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-lg hover:shadow-xl transition-shadow border border-primary/10">
              <div className="w-16 h-16 bg-primary/15 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">Smart Sessions</h3>
              <p className="text-sm text-muted-foreground">
                Set your commute time. AI adapts questions to fit perfectly. Track progress over time.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="pt-12 space-y-4">
            <h2 className="text-2xl font-bold text-foreground">How It Works</h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">1</div>
                <span>Create a class</span>
              </div>
              <ArrowRight className="w-5 h-5 hidden md:block" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">2</div>
                <span>Upload study files</span>
              </div>
              <ArrowRight className="w-5 h-5 hidden md:block" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">3</div>
                <span>Start your drive</span>
              </div>
              <ArrowRight className="w-5 h-5 hidden md:block" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">4</div>
                <span>Learn hands-free</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button
              size="lg"
              className="text-lg px-10 py-6 bg-orchid-gradient hover:opacity-90 shadow-lg"
              onClick={() => navigate('/signup')}
            >
              Start Learning Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-10 py-6 border-2 border-primary hover:bg-primary/10"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </div>

          {/* Stats */}
          <div className="pt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground mt-1">Hands-Free</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                <Clock className="w-8 h-8 inline" />
              </div>
              <div className="text-sm text-muted-foreground mt-1">Save Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">AI</div>
              <div className="text-sm text-muted-foreground mt-1">Powered</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground bg-white/50 backdrop-blur-sm">
        <p className="mb-1">© 2026 DriveLearn. Drive your learning forward.</p>
        <p className="text-xs">Free tier: 2 classes • Paid: Unlimited classes</p>
      </footer>
    </div>
  );
}
