import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { filePath, fileId } = await req.json();
    
    if (!filePath || !fileId) {
      return new Response(
        JSON.stringify({ error: 'Missing filePath or fileId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating thumbnail for file: ${filePath}`);

    // Download the PDF file from storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('user_files')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('Error downloading file:', downloadError);
      return new Response(
        JSON.stringify({ error: 'Failed to download file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert blob to arrayBuffer for processing
    const arrayBuffer = await fileData.arrayBuffer();
    console.log(`File downloaded successfully, size: ${arrayBuffer.byteLength} bytes`);

    try {
      // Use PDF.js for rendering PDF to canvas
      const pdfjsLib = await import('https://esm.sh/pdfjs-dist@4.0.379/build/pdf.min.mjs');
      
      // Set up PDF.js worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';
      
      const pdfDocument = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0
      }).promise;
      
      const pageCount = pdfDocument.numPages;
      console.log(`PDF loaded with ${pageCount} pages`);
      
      if (pageCount === 0) {
        throw new Error('PDF has no pages');
      }

      // Get the first page
      const page = await pdfDocument.getPage(1);
      const viewport = page.getViewport({ scale: 1.5 });
      
      // Create a canvas for rendering
      const canvas = new OffscreenCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Failed to get canvas context');
      }

      // Render the page
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Convert canvas to blob
      const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
      
      // Generate thumbnail file path
      const thumbnailPath = `${filePath.replace('.pdf', '_thumb.jpg')}`;

      // Upload thumbnail to storage
      const { error: uploadError } = await supabaseClient.storage
        .from('thumbnails')
        .upload(thumbnailPath, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading thumbnail:', uploadError);
        throw new Error('Failed to upload thumbnail');
      }

      // Update database with thumbnail URL
      const { error: updateError } = await supabaseClient
        .from('user_files')
        .update({ thumbnail_url: thumbnailPath })
        .eq('id', fileId);

      if (updateError) {
        console.error('Error updating thumbnail URL:', updateError);
        throw new Error('Failed to update database');
      }

      // Get public URL for the thumbnail
      const { data: { publicUrl } } = supabaseClient.storage
        .from('thumbnails')
        .getPublicUrl(thumbnailPath);

      console.log(`Thumbnail generated successfully: ${publicUrl}`);

      // Convert blob to base64 for immediate use
      const buffer = await blob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

      return new Response(
        JSON.stringify({ 
          success: true, 
          thumbnailUrl: publicUrl,
          thumbnailData: `data:image/jpeg;base64,${base64}`,
          pageCount
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (pdfError) {
      console.error('PDF processing error:', pdfError);
      
      // Fallback to styled SVG placeholder if PDF processing fails
      const fallbackSvg = `
        <svg width="200" height="260" viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#f8fafc"/>
              <stop offset="100%" style="stop-color:#e2e8f0"/>
            </linearGradient>
            <linearGradient id="content" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#cbd5e1"/>
              <stop offset="100%" style="stop-color:#94a3b8"/>
            </linearGradient>
          </defs>
          <rect width="200" height="260" fill="url(#bg)" stroke="#cbd5e1" stroke-width="1"/>
          <rect x="20" y="30" width="160" height="12" fill="url(#content)" rx="2"/>
          <rect x="20" y="50" width="120" height="8" fill="url(#content)" rx="1"/>
          <rect x="20" y="65" width="140" height="8" fill="url(#content)" rx="1"/>
          <rect x="20" y="80" width="100" height="8" fill="url(#content)" rx="1"/>
          <rect x="20" y="100" width="130" height="8" fill="url(#content)" rx="1"/>
          <rect x="20" y="115" width="90" height="8" fill="url(#content)" rx="1"/>
          <circle cx="100" cy="180" r="25" fill="#3b82f6" opacity="0.1"/>
          <text x="100" y="185" text-anchor="middle" fill="#3b82f6" font-family="Arial" font-size="12" font-weight="bold">PDF</text>
          <text x="100" y="220" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="10">Document</text>
        </svg>
      `;

      const thumbnailPath = `${filePath.replace('.pdf', '_thumb.svg')}`;
      
      await supabaseClient.storage
        .from('thumbnails')
        .upload(thumbnailPath, new Blob([fallbackSvg], { type: 'image/svg+xml' }), {
          contentType: 'image/svg+xml',
          upsert: true
        });

      await supabaseClient
        .from('user_files')
        .update({ thumbnail_url: thumbnailPath })
        .eq('id', fileId);

      const { data: { publicUrl } } = supabaseClient.storage
        .from('thumbnails')
        .getPublicUrl(thumbnailPath);

      return new Response(
        JSON.stringify({ 
          success: true, 
          thumbnailUrl: publicUrl,
          thumbnailData: `data:image/svg+xml;base64,${btoa(fallbackSvg)}`,
          fallback: true
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Error in generate-thumbnail function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});