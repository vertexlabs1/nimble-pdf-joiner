
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
  Mail,
  Cloud
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
    },
    {
      icon: Cloud,
      title: 'Advanced OCR & AI',
      description: 'Extract text from scanned documents with AI-powered recognition'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
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
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-4">
              Pro Features Are Coming 🔥
            </h1>
            
            <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-2">
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
                <Card key={index} className="p-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-150 group cursor-pointer bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 p-3 rounded-lg group-hover:shadow-md transition-shadow border border-green-500/30">
                      <feature.icon className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 text-gray-100 group-hover:text-green-400 transition-colors">{feature.title}</h3>
                      <p className="text-sm text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Email Signup Section */}
          <Card className="max-w-md mx-auto p-8 bg-slate-800/60 border-slate-700 shadow-2xl backdrop-blur-sm">
            {!isSubmitted ? (
              <>
                <div className="text-center mb-6">
                  <Mail className="h-8 w-8 text-green-400 mx-auto mb-3" />
                  <h3 className="text-xl font-semibold text-gray-100 mb-2">
                    Be the first to know
                  </h3>
                  <p className="text-gray-400 text-sm">
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
                      className="w-full px-4 py-3 border-2 border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-700/80 backdrop-blur-sm transition-all duration-200 hover:shadow-md text-gray-100 placeholder-gray-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <Textarea
                      value={featureRequest}
                      onChange={(e) => setFeatureRequest(e.target.value)}
                      placeholder="Request a feature (optional)"
                      className="w-full px-4 py-3 border-2 border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-700/80 backdrop-blur-sm transition-all duration-200 hover:shadow-md resize-none text-gray-100 placeholder-gray-400"
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
                
                <div className="text-center mt-6 pt-4 border-t border-slate-600">
                  <p className="text-xs text-gray-500 mb-2">
                    No spam, just product updates. Unsubscribe anytime.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <span>Built by <span className="font-medium text-gray-300">VertexLabs</span></span>
                    <span>•</span>
                    <span className="text-green-400 font-medium">100% Private by Design</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="bg-green-500/20 p-3 rounded-full w-fit mx-auto mb-4 animate-pulse-glow border border-green-500/30">
                  <Check className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-100 mb-2">
                  You're on the list! 🎉
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  We'll notify you as soon as pro features are available.
                </p>
                <Link to="/">
                  <Button variant="outline" className="border-green-500/30 text-green-400 hover:bg-green-500/10 hover:scale-105 transition-all duration-200 bg-transparent">
                    Back to PDF Merger
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Footer */}
          <div className="mt-16 pt-8">
            <Separator className="mb-6 bg-slate-700" />
            <div className="text-center text-sm text-gray-500">
              <p>© 2025 MergePDFSecurely.com - Built by <span className="font-medium text-gray-400">VertexLabs</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Waitlist;
