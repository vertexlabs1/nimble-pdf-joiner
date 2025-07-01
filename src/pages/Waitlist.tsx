
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-full">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-4">
              Pro Features Are Coming 🔥
            </h1>
            
            <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-2">
              Join the waitlist to get early access and bonus perks when we launch our premium tools.
            </p>
            
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
              <Sparkles className="h-3 w-3 mr-1" />
              Early Bird Discount Available
            </Badge>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-r from-green-100 to-blue-100 p-3 rounded-lg">
                    <feature.icon className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-gray-900">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Email Signup Section */}
          <Card className="max-w-md mx-auto p-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isLoading || !email}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3"
                  >
                    {isLoading ? 'Joining...' : 'Join the Waitlist'}
                  </Button>
                </form>
                
                <p className="text-xs text-gray-500 text-center mt-4">
                  No spam, just product updates. Unsubscribe anytime.
                </p>
              </>
            ) : (
              <div className="text-center">
                <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  You're on the list! 🎉
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  We'll notify you as soon as pro features are available.
                </p>
                <Link to="/">
                  <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
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
