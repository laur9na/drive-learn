import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, Play, FileText, Brain, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClass } from '@/hooks/useClasses';
import { useMaterials } from '@/hooks/useMaterials';
import { FileUpload } from '@/components/materials/FileUpload';
import { MaterialCard } from '@/components/materials/MaterialCard';

export default function ClassDetail() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { data: classData, isLoading } = useClass(classId);
  const { data: materials, isLoading: materialsLoading } = useMaterials(classId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orchid-subtle to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading class...</p>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orchid-subtle to-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Class not found</h2>
          <p className="text-muted-foreground mb-6">
            The class you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate('/classes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Classes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orchid-subtle to-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/classes')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Classes
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div
                className="w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center"
                style={{ backgroundColor: classData.color }}
              >
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  {classData.name}
                </h1>
                {classData.description && (
                  <p className="text-muted-foreground max-w-2xl">
                    {classData.description}
                  </p>
                )}
              </div>
            </div>

            <Button
              size="lg"
              className="bg-orchid-gradient hover:opacity-90 shadow-lg"
              onClick={() => navigate(`/commute/${classId}`)}
            >
              <Play className="mr-2 h-5 w-5" />
              Start Session
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Study Materials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {materials?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {materials?.length === 0
                  ? 'No materials uploaded yet'
                  : `File${materials?.length === 1 ? '' : 's'} uploaded`}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Generated Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                Upload materials to generate questions
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">-</div>
              <p className="text-xs text-muted-foreground mt-1">
                Complete sessions to see stats
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="materials" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="mt-6 space-y-6">
            {/* File Upload */}
            {classId && <FileUpload classId={classId} />}

            {/* Materials List */}
            {materialsLoading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading materials...</p>
              </div>
            ) : materials && materials.length > 0 ? (
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground mb-3">
                  Uploaded Materials ({materials.length})
                </h3>
                {materials.map((material) => (
                  <MaterialCard key={material.id} material={material} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No materials uploaded yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload your first study material to get started
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="questions" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-12 h-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No questions yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Questions will appear here after you upload study materials.
                    AI will generate custom quiz questions based on your content.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="w-12 h-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No sessions yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Your commute learning sessions will appear here with stats
                    and progress tracking.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="mt-8 p-6 bg-white/60 backdrop-blur-sm rounded-lg border-2 border-primary/10">
          <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/demo" className="block">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <Play className="mr-2 h-5 w-5" />
                Try Voice Quiz Demo
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full justify-start"
              size="lg"
              disabled
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload Study Materials (Coming Soon)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
