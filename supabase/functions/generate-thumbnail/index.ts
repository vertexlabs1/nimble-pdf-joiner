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
      // Use pdf-lib for basic PDF processing to extract first page
      const { PDFDocument } = await import('https://esm.sh/pdf-lib@1.17.1');
      
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();
      
      if (pageCount === 0) {
        throw new Error('PDF has no pages');
      }

      // Create a new PDF with just the first page
      const newPdf = await PDFDocument.create();
      const [firstPage] = await newPdf.copyPages(pdfDoc, [0]);
      newPdf.addPage(firstPage);
      
      const pdfBytes = await newPdf.save();
      
      // For now, create a styled placeholder SVG with actual PDF info
      const placeholderSvg = `
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
          <text x="100" y="220" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="10">${pageCount} pages</text>
        </svg>
      `;

      // Generate thumbnail file path
      const thumbnailPath = `${filePath.replace('.pdf', '_thumb.svg')}`;

      // Upload thumbnail to storage
      const { error: uploadError } = await supabaseClient.storage
        .from('thumbnails')
        .upload(thumbnailPath, new Blob([placeholderSvg], { type: 'image/svg+xml' }), {
          contentType: 'image/svg+xml',
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading thumbnail:', uploadError);
        return new Response(
          JSON.stringify({ error: 'Failed to upload thumbnail' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update database with thumbnail URL
      const { error: updateError } = await supabaseClient
        .from('user_files')
        .update({ thumbnail_url: thumbnailPath })
        .eq('id', fileId);

      if (updateError) {
        console.error('Error updating thumbnail URL:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update database' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get public URL for the thumbnail
      const { data: { publicUrl } } = supabaseClient.storage
        .from('thumbnails')
        .getPublicUrl(thumbnailPath);

      console.log(`Thumbnail generated successfully: ${publicUrl}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          thumbnailUrl: publicUrl,
          thumbnailData: `data:image/svg+xml;base64,${btoa(placeholderSvg)}`,
          pageCount
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (pdfError) {
      console.error('PDF processing error:', pdfError);
      
      // Fallback to generic placeholder if PDF processing fails
      const fallbackSvg = `
        <svg width="200" height="260" viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="260" fill="#f8f9fa" stroke="#e9ecef" stroke-width="2"/>
          <rect x="20" y="40" width="160" height="20" fill="#dee2e6" rx="2"/>
          <rect x="20" y="80" width="120" height="20" fill="#dee2e6" rx="2"/>
          <rect x="20" y="120" width="140" height="20" fill="#dee2e6" rx="2"/>
          <rect x="20" y="160" width="100" height="20" fill="#dee2e6" rx="2"/>
          <text x="100" y="220" text-anchor="middle" fill="#6c757d" font-family="Arial" font-size="14">PDF</text>
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