
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import DashboardHome from './dashboard/DashboardHome';
import EnhancedMyFiles from './dashboard/EnhancedMyFiles';
import ToolPage from './dashboard/ToolPage';
import AdminPanel from './dashboard/AdminPanel';
import APIPage from './dashboard/APIPage';
import { DashboardMergeTool } from '@/components/DashboardMergeTool';
import { DashboardSplitTool } from '@/components/DashboardSplitTool';
import RedactTool from '@/components/tools/RedactTool';
import WatermarkTool from '@/components/tools/WatermarkTool';
import ConvertTool from '@/components/tools/ConvertTool';
import { Scissors, Shield, RefreshCw, Stamp, Zap, Plus } from 'lucide-react';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/files" element={<EnhancedMyFiles />} />
        <Route path="/merge" element={<DashboardMergeTool />} />
        <Route path="/split" element={<DashboardSplitTool />} />
        <Route 
          path="/redact" 
          element={
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">Redact PDFs</h1>
                </div>
                <p className="text-lg text-muted-foreground">
                  Remove sensitive information from PDF documents with precision redaction tools
                </p>
              </div>
              <RedactTool />
            </div>
          } 
        />
        <Route 
          path="/convert" 
          element={
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <RefreshCw className="h-6 w-6 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">Convert PDFs</h1>
                </div>
                <p className="text-lg text-muted-foreground">
                  Convert PDF documents to high-quality images in various formats
                </p>
              </div>
              <ConvertTool />
            </div>
          } 
        />
        <Route 
          path="/watermark" 
          element={
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Stamp className="h-6 w-6 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">Watermark PDFs</h1>
                </div>
                <p className="text-lg text-muted-foreground">
                  Add professional watermarks and branding to your PDF documents
                </p>
              </div>
              <WatermarkTool />
            </div>
          } 
        />
        <Route 
          path="/api" 
          element={<APIPage />} 
        />
        <Route 
          path="/feature-requests" 
          element={
            <ToolPage 
              title="Feature Requests"
              description="Request new features and vote on upcoming tools"
              icon={Plus}
              features={[
                "Submit feature requests",
                "Vote on proposals",
                "Track development progress",
                "Community feedback"
              ]}
            />
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminPanel />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </DashboardLayout>
  );
}
