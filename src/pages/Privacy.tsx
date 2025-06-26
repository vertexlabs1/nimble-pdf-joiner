
import { Shield, Lock, Eye, Server, Monitor, Mail } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-3 rounded-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-700">
            Last updated: December 2024
          </p>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 mb-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-700 mb-6">
                At <strong>Merge PDF Securely</strong>, your privacy is our top priority.
              </p>
              <p className="text-gray-700 mb-8">
                This tool is designed from the ground up to be 100% private. Your files are <strong>never uploaded</strong>, <strong>never stored</strong>, and <strong>never shared</strong> — all processing happens directly in your browser.
              </p>

              <hr className="my-8 border-gray-200" />

              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3 text-green-800">
                <Lock className="h-6 w-6" />
                How It Works
              </h2>

              <div className="space-y-4 mb-8">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Local-only processing</h3>
                  <p className="text-gray-700">
                    When you upload PDF files to merge, all work is performed in your browser using local memory. No files are ever transmitted to a server. Your documents stay on your device at all times.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">No uploads. No tracking. No storage.</h3>
                  <p className="text-gray-700">
                    We do not upload, store, log, or analyze any content from your files. Unlike traditional online PDF tools, <strong>Merge PDF Securely</strong> is a purely front-end application.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">No cookies. No analytics. No accounts.</h3>
                  <p className="text-gray-700">
                    We do not use cookies, analytics scripts, user tracking, or require account sign-up. You are anonymous, and your use of the tool remains completely private.
                  </p>
                </div>
              </div>

              <hr className="my-8 border-gray-200" />

              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3 text-green-800">
                <Eye className="h-6 w-6" />
                Why This Matters
              </h2>

              <p className="text-gray-700 mb-4">
                Most online PDF merging tools use server-side processing, which temporarily stores your files in the cloud — even if they claim to delete them later. That introduces potential security risks.
              </p>

              <p className="text-gray-700 mb-4">
                <strong>Merge PDF Securely</strong> is ideal for anyone working with:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-6 text-gray-700">
                <li>Legal or financial documents</li>
                <li>Medical or academic records</li>
                <li>Business contracts and internal PDFs</li>
                <li>Personal documents with sensitive data</li>
              </ul>

              <p className="text-gray-700 mb-8">
                With our tool, you're protected by design — no file ever leaves your computer.
              </p>

              <hr className="my-8 border-gray-200" />

              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3 text-green-800">
                <Monitor className="h-6 w-6" />
                Built With Privacy-First Technology
              </h2>

              <ul className="list-disc list-inside space-y-2 mb-8 text-gray-700">
                <li>Runs entirely on modern front-end code using <strong>JavaScript</strong> and <strong>WebAssembly</strong></li>
                <li>No server-side components or file storage systems</li>
                <li>Engineered for speed and simplicity by <strong>VertexLabs</strong>, a business systems and automation firm</li>
              </ul>

              <hr className="my-8 border-gray-200" />

              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3 text-green-800">
                <Server className="h-6 w-6" />
                Usage Guidelines
              </h2>

              <p className="text-gray-700 mb-4">To ensure a smooth experience:</p>
              <ul className="list-disc list-inside space-y-2 mb-8 text-gray-700">
                <li>Each individual file can be up to <strong>50MB</strong></li>
                <li>You can merge as many PDFs as you like, depending on your device's memory</li>
                <li>If a merge hangs or fails, try reducing file sizes or splitting into smaller batches</li>
              </ul>

              <hr className="my-8 border-gray-200" />

              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3 text-green-800">
                <Mail className="h-6 w-6" />
                Contact Us
              </h2>

              <p className="text-gray-700 mb-4">
                If you have any questions about how your data is handled or suggestions to improve privacy and performance, reach out to:
              </p>

              <div className="bg-blue-50 p-4 rounded-lg mb-8">
                <p className="text-blue-800 font-medium">
                  <strong>apps@vxlabs.co</strong>
                </p>
              </div>

              <p className="text-gray-700 mb-8">
                We welcome feedback and are committed to improving the tool while keeping it lightweight, private, and efficient.
              </p>

              <hr className="my-8 border-gray-200" />

              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3 text-green-800">
                <Shield className="h-6 w-6" />
                Summary
              </h2>

              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">✅</Badge>
                    <span className="text-gray-700">No uploads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">✅</Badge>
                    <span className="text-gray-700">No tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">✅</Badge>
                    <span className="text-gray-700">No analytics</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">✅</Badge>
                    <span className="text-gray-700">No file storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">✅</Badge>
                    <span className="text-gray-700">No account required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">✅</Badge>
                    <span className="text-gray-700">100% browser-based processing</span>
                  </div>
                </div>
              </div>

              <p className="text-lg font-semibold text-center text-green-800 mb-8">
                <strong>Merge PDF Securely</strong> is a fast, free, and private way to merge your PDF files online — without sacrificing your data privacy.
              </p>

              <hr className="my-8 border-gray-200" />

              <div className="text-center text-gray-600">
                <p className="mb-2">
                  <strong>© 2025 MergePDFSecurely.com</strong>
                </p>
                <p>
                  A privacy-first utility built by <strong>VertexLabs</strong>
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
