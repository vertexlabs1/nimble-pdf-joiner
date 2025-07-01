import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Link, useLocation } from 'react-router-dom';
import { useWaitlist } from '@/hooks/useWaitlist';
import { useToast } from '@/hooks/use-toast';
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
  Cloud,
  Loader2,
  AlertCircle
} from 'lucide-react';

const Waitlist = () => {
  const [email, setEmail] = useState('');
  const [featureRequest, setFeatureRequest] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const location = useLocation();
  const { submitToWaitlist, checkPreviousSubmission, isLoading, error } = useWaitlist();
  const { toast } = useToast();

  // Detect if user came from Go Pro button
  const joinedFrom = location.state?.from === 'pro' ? 'pro_btn' : 'home';

  useEffect(() => {
    // Check if user has already joined
    const { hasJoined, email: savedEmail } = checkPreviousSubmission();
    if (hasJoined) {
      setIsSubmitted(true);
      setEmail(savedEmail || '');
    }
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    if (featureRequest.length > 300) {
      toast({
        title: "Feature request too long",
        description: "Please keep your feature request under 300 characters",
        variant: "destructive"
      });
      return;
    }

    try {
      await submitToWaitlist({
        email: trimmedEmail,
        feature_request: featureRequest || undefined,
        joined_from: joinedFrom
      });
      
      setIsSubmitted(true);
      toast({
        title: "Success! 🎉",
        description: "You're now on the waitlist. We'll notify you when pro features launch!",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 animate-page-enter">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors hover:scale-105 transform duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Merger
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Enhanced Hero Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-full animate-button-halo">
                <Sparkles className="h-8 w-8 text-white animate-icon-glow" />
              </div>
            </div>
            
            <h1 className="text-5xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 bg-clip-text text-transparent mb-4 animate-pulse-glow">
              Pro Features Are Coming 🔥
            </h1>
            
            <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-2">
              Join the waitlist to get early access and bonus perks when we launch our premium tools.
            </p>
            
            <div className="flex justify-center mb-4">
              <Badge 
                variant="secondary" 
                className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 hover:from-yellow-200 hover:to-orange-200 animate-bounce-attention relative overflow-hidden"
                style={{
                  backgroundImage: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 3s ease-in-out infinite, bounce-attention 4s ease-in-out infinite'
                }}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Early Bird Discount Available
              </Badge>
            </div>
          </div>

          {/* Features Grid - Centered */}
          <div className="flex justify-center mb-12">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className="p-6 hover:shadow-xl hover:scale-[1.03] transition-all duration-300 group cursor-pointer bg-slate-800/50 border-slate-600 backdrop-blur-sm hover:border-green-500/50"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 p-3 rounded-lg group-hover:shadow-lg group-hover:from-green-500/30 group-hover:to-blue-500/30 transition-all duration-300 border border-green-500/30">
                      <feature.icon className="h-6 w-6 text-green-400 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 text-gray-100 group-hover:text-green-400 transition-colors duration-300">{feature.title}</h3>
                      <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Enhanced Email Signup Section */}
          <Card className="max-w-md mx-auto p-8 bg-slate-800/60 border-slate-600 shadow-2xl backdrop-blur-sm hover:shadow-3xl transition-shadow duration-300">
            {!isSubmitted ? (
              <>
                <div className="text-center mb-6">
                  <Mail className="h-8 w-8 text-green-400 mx-auto mb-3 animate-pulse" />
                  <h3 className="text-xl font-bold text-gray-100 mb-2">
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
                      className="w-full px-4 py-3 border-2 border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-700/80 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:border-slate-500 text-gray-100 placeholder-gray-400"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <Textarea
                      value={featureRequest}
                      onChange={(e) => setFeatureRequest(e.target.value)}
                      placeholder="Request a feature (optional)"
                      className="w-full px-4 py-3 border-2 border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-700/80 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:border-slate-500 resize-none text-gray-100 placeholder-gray-400"
                      rows={3}
                      maxLength={300}
                      disabled={isLoading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {featureRequest.length}/300 characters
                    </p>
                  </div>
                  
                  {error && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  )}
                  
                  <Button
                    type="submit"
                    disabled={isLoading || !email.trim()}
                    className="w-full bg-gradient-to-r from-green-600 via-green-500 to-blue-600 hover:from-green-700 hover:via-green-600 hover:to-blue-700 text-white font-bold py-3 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 relative overflow-hidden group"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      'Join the Waitlist'
                    )}
                    
                    {/* Shimmer effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity duration-300" />
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
                  <Button variant="outline" className="border-green-500/30 text-green-400 hover:bg-green-500/10 hover:scale-105 transition-all duration-300 bg-transparent">
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
