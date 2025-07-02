
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import DashboardHome from './dashboard/DashboardHome';
import MyFiles from './dashboard/MyFiles';
import ToolPage from './dashboard/ToolPage';
import AdminPanel from './dashboard/AdminPanel';
import { DashboardMergeTool } from '@/components/DashboardMergeTool';
import { Scissors, Shield, RefreshCw, Stamp, Zap, Plus } from 'lucide-react';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/files" element={<MyFiles />} />
        <Route path="/merge" element={<DashboardMergeTool />} />
        <Route 
          path="/split" 
          element={
            <ToolPage 
              title="Split PDFs"
              description="Split large PDF files into smaller documents"
              icon={Scissors}
              features={[
                "Split by page range",
                "Extract specific pages",
                "Split by file size",
                "Bulk splitting options"
              ]}
            />
          } 
        />
        <Route 
          path="/redact" 
          element={
            <ToolPage 
              title="Redact PDFs"
              description="Remove sensitive information from PDF documents"
              icon={Shield}
              features={[
                "Text redaction",
                "Image redaction",
                "Bulk redaction",
                "Secure deletion"
              ]}
            />
          } 
        />
        <Route 
          path="/convert" 
          element={
            <ToolPage 
              title="Convert PDFs"
              description="Convert PDFs to and from various file formats"
              icon={RefreshCw}
              features={[
                "PDF to Word/Excel/PowerPoint",
                "Images to PDF",
                "HTML to PDF",
                "Batch conversion"
              ]}
            />
          } 
        />
        <Route 
          path="/watermark" 
          element={
            <ToolPage 
              title="Watermark PDFs"
              description="Add watermarks and branding to PDF documents"
              icon={Stamp}
              features={[
                "Text watermarks",
                "Image watermarks",
                "Batch watermarking",
                "Custom positioning"
              ]}
            />
          } 
        />
        <Route 
          path="/api" 
          element={
            <ToolPage 
              title="API Access"
              description="Integrate PDF tools into your applications"
              icon={Zap}
              features={[
                "REST API endpoints",
                "SDK libraries",
                "Webhook support",
                "Usage analytics"
              ]}
            />
          } 
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
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </DashboardLayout>
  );
}
