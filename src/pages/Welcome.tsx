import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Car, BookOpen, Trophy, ArrowRight } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center max-w-2xl mx-auto space-y-8">
          {/* Logo */}
          <div className="mx-auto w-24 h-24 bg-primary rounded-3xl flex items-center justify-center shadow-lg">
            <Car className="w-12 h-12 text-primary-foreground" />
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-foreground tracking-tight">
              DriveLearn
            </h1>
            <p className="text-xl text-muted-foreground max-w-md mx-auto">
              Master the road with interactive lessons, quizzes, and personalized progress tracking.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            <div className="bg-card p-6 rounded-2xl shadow-md">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Interactive Lessons</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Learn at your own pace with engaging content
              </p>
            </div>

            <div className="bg-card p-6 rounded-2xl shadow-md">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Track Progress</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Monitor your learning journey with detailed stats
              </p>
            </div>

            <div className="bg-card p-6 rounded-2xl shadow-md">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Car className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Pass Your Test</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Be fully prepared for your driving exam
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button
              size="lg"
              className="text-lg px-8"
              onClick={() => navigate('/signup')}
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground">
        © 2024 DriveLearn. All rights reserved.
      </footer>
    </div>
  );
}
