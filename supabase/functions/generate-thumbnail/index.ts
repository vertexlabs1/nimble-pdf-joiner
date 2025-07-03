import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

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

    const { pdfUrl, filePath, fileId, filename, pageNumber = 1, width = 300, height = 400, quality = 0.8 } = await req.json();
    
    console.log('PDF thumbnail generation request:', { pdfUrl, filePath, fileId, filename, pageNumber, width, height });

    let pdfDataUrl = pdfUrl;

    // If we have filePath, get the signed URL
    if (filePath) {
      console.log('Getting signed URL for filePath:', filePath);
      const { data: { signedUrl }, error: urlError } = await supabaseClient.storage
        .from('user_files')
        .createSignedUrl(filePath, 3600); // 1 hour expiry
      
      if (urlError || !signedUrl) {
        console.error('Could not get signed URL:', urlError);
        throw new Error(`Could not get signed URL for PDF: ${urlError?.message || 'Unknown error'}`);
      }
      
      console.log('Got signed URL:', signedUrl);
      pdfDataUrl = signedUrl;
    }

    if (!pdfDataUrl) {
      throw new Error('No PDF URL provided');
    }

    // Validate URL accessibility
    console.log('Testing PDF URL accessibility:', pdfDataUrl);
    const testResponse = await fetch(pdfDataUrl, { method: 'HEAD' });
    if (!testResponse.ok) {
      throw new Error(`PDF URL not accessible: ${testResponse.status} ${testResponse.statusText}`);
    }
    console.log('PDF URL is accessible, proceeding with thumbnail generation');

    // Generate actual PDF thumbnail using Puppeteer
    console.log('Launching Puppeteer browser');
    const browser = await puppeteer.launch({
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ],
      headless: true
    });

    try {
      console.log('Creating new page');
      const page = await browser.newPage();
      
      // Set viewport size
      console.log('Setting viewport size:', { width: width * 2, height: height * 2 });
      await page.setViewport({ width: width * 2, height: height * 2 });
      
      // Navigate to PDF with specific page
      const pdfPageUrl = `${pdfDataUrl}#page=${pageNumber}`;
      console.log('Navigating to PDF page:', pdfPageUrl);
      
      await page.goto(pdfPageUrl, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      console.log('Waiting for PDF to render');
      // Wait a bit for PDF to fully render
      await page.waitForTimeout(3000);

      // Take screenshot
      console.log('Taking screenshot');
      const screenshot = await page.screenshot({
        type: 'png',
        quality: Math.round(quality * 100),
        fullPage: false,
        clip: {
          x: 0,
          y: 0,
          width: width * 2,
          height: height * 2
        }
      });

      console.log('Screenshot taken, closing browser');
      await browser.close();

      // Convert to base64
      const base64Image = btoa(String.fromCharCode(...new Uint8Array(screenshot)));
      const thumbnailData = `data:image/png;base64,${base64Image}`;

      // For stored files, cache the thumbnail
      if (filePath && fileId) {
        try {
          const thumbnailPath = `${filePath.replace('.pdf', `_thumb_p${pageNumber}.png`)}`;
          
          await supabaseClient.storage
            .from('thumbnails')
            .upload(thumbnailPath, screenshot, {
              contentType: 'image/png',
              upsert: true
            });

          // Update the user_files table with thumbnail URL for page 1
          if (pageNumber === 1) {
            await supabaseClient
              .from('user_files')
              .update({ thumbnail_url: thumbnailPath })
              .eq('id', fileId);
          }

          const { data: { publicUrl } } = supabaseClient.storage
            .from('thumbnails')
            .getPublicUrl(thumbnailPath);

          console.log('PNG thumbnail stored successfully:', publicUrl);

          return new Response(
            JSON.stringify({ 
              success: true, 
              thumbnailUrl: publicUrl,
              thumbnailData: thumbnailData,
              pageNumber: pageNumber
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } catch (storageError) {
          console.error('Storage error:', storageError);
          // Continue with in-memory response
        }
      }

      // Return the PNG thumbnail
      return new Response(
        JSON.stringify({ 
          success: true, 
          thumbnailData: thumbnailData,
          pageNumber: pageNumber
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (puppeteerError) {
      console.error('Puppeteer error:', puppeteerError);
      await browser.close();
      throw puppeteerError;
    }

  } catch (error) {
    console.error('Error in generate-thumbnail function:', error);
    
    // Return a styled SVG fallback on error
    const { width = 300, height = 400, pageNumber = 1 } = await req.json().catch(() => ({}));
    
    const fallbackSvg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f8fafc"/>
            <stop offset="100%" style="stop-color:#e2e8f0"/>
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#bg)" stroke="#cbd5e1" stroke-width="1" rx="8"/>
        <circle cx="${width / 2}" cy="${height * 0.4}" r="${width * 0.08}" fill="#ef4444" opacity="0.1"/>
        <text x="${width / 2}" y="${height * 0.45}" text-anchor="middle" fill="#ef4444" font-family="Arial" font-size="${width * 0.04}" font-weight="600">Error</text>
        <text x="${width / 2}" y="${height * 0.55}" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="${width * 0.03}">Page ${pageNumber}</text>
        <text x="${width / 2}" y="${height * 0.7}" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="${width * 0.03}">Could not generate</text>
        <text x="${width / 2}" y="${height * 0.78}" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="${width * 0.03}">thumbnail</text>
      </svg>
    `;
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        thumbnailData: `data:image/svg+xml;base64,${btoa(fallbackSvg)}`,
        fallback: true
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});