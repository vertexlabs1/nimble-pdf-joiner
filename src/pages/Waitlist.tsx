
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  ArrowLeft, 
  Check, 
  Database, 
  Eye, 
  FolderOpen, 
  Zap, 
  History,
  Sparkles,
  Mail
} from 'lucide-react';

const Waitlist = () => {
  const [email, setEmail] = useState('');
  const [featureRequest, setFeatureRequest] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitted(true);
    setIsLoading(false);
  };

  const features = [
    {
      icon: Database,
      title: 'PDF to CSV conversion',
      description: 'Extract tables and data from PDFs into CSV format'
    },
    {
      icon: Eye,
      title: 'Redact sensitive text',
      description: 'Automatically detect and remove sensitive information'
    },
    {
      icon: FolderOpen,
      title: 'Batch upload & processing',
      description: 'Process hundreds of PDFs at once with drag & drop folders'
    },
    {
      icon: Zap,
      title: 'Zapier & API access',
      description: 'Integrate with your workflow and automate document processing'
    },
    {
      icon: History,
      title: 'Save & access file history',
      description: 'Keep track of all your merged documents with cloud storage'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Merger
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-full animate-glow-ring">
                <Sparkles className="h-8 w-8 text-white animate-sparkle" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-4">
              Pro Features Are Coming 🔥
            </h1>
            
            <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-2">
              Join the waitlist to get early access and bonus perks when we launch our premium tools.
            </p>
            
            <div className="flex justify-center mb-4">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 animate-pulse-glow">
                <Sparkles className="h-3 w-3 mr-1" />
                Early Bird Discount Available
              </Badge>
            </div>
          </div>

          {/* Features Grid - Centered */}
          <div className="flex justify-center mb-12">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
              {features.map((feature, index) => (
                <Card key={index} className="p-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-150 group cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-r from-green-100 to-blue-100 p-3 rounded-lg group-hover:shadow-md transition-shadow">
                      <feature.icon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 text-gray-900 group-hover:text-green-700 transition-colors">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Email Signup Section */}
          <Card className="max-w-md mx-auto p-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200 shadow-lg">
            {!isSubmitted ? (
              <>
                <div className="text-center mb-6">
                  <Mail className="h-8 w-8 text-green-600 mx-auto mb-3" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Be the first to know
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Get notified when pro features launch
                  </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:shadow-md"
                      required
                    />
                  </div>
                  
                  <div>
                    <Textarea
                      value={featureRequest}
                      onChange={(e) => setFeatureRequest(e.target.value)}
                      placeholder="Request a feature (optional)"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:shadow-md resize-none"
                      rows={3}
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isLoading || !email}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                  >
                    {isLoading ? 'Joining...' : 'Join the Waitlist'}
                  </Button>
                </form>
                
                <div className="text-center mt-6 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">
                    No spam, just product updates. Unsubscribe anytime.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                    <span>Built by <span className="font-medium text-gray-700">VertexLabs</span></span>
                    <span>•</span>
                    <span className="text-green-600 font-medium">100% Private by Design</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4 animate-pulse-glow">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  You're on the list! 🎉
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  We'll notify you as soon as pro features are available.
                </p>
                <Link to="/">
                  <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50 hover:scale-105 transition-all duration-200">
                    Back to PDF Merger
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Footer */}
          <div className="mt-16 pt-8">
            <Separator className="mb-6" />
            <div className="text-center text-sm text-gray-600">
              <p>© 2025 MergePDFSecurely.com - Built by <span className="font-medium text-gray-700">VertexLabs</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Waitlist;
