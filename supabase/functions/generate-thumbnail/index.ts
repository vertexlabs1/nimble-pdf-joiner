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

    const { filePath, fileId, fileData, filename, width = 200, height = 260, quality = 0.8 } = await req.json();
    
    console.log('Thumbnail generation request:', { filePath, fileId, filename, width, height });

    // Generate a styled SVG placeholder immediately
    const fallbackSvg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg-${width}-${height}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f8fafc"/>
            <stop offset="100%" style="stop-color:#e2e8f0"/>
          </linearGradient>
          <linearGradient id="content-${width}-${height}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#cbd5e1"/>
            <stop offset="100%" style="stop-color:#94a3b8"/>
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#bg-${width}-${height})" stroke="#cbd5e1" stroke-width="1" rx="8"/>
        <rect x="${width * 0.1}" y="${height * 0.15}" width="${width * 0.8}" height="${height * 0.08}" fill="url(#content-${width}-${height})" rx="2"/>
        <rect x="${width * 0.1}" y="${height * 0.28}" width="${width * 0.6}" height="${height * 0.06}" fill="url(#content-${width}-${height})" opacity="0.7" rx="1"/>
        <rect x="${width * 0.1}" y="${height * 0.4}" width="${width * 0.7}" height="${height * 0.06}" fill="url(#content-${width}-${height})" opacity="0.7" rx="1"/>
        <rect x="${width * 0.1}" y="${height * 0.52}" width="${width * 0.5}" height="${height * 0.06}" fill="url(#content-${width}-${height})" opacity="0.7" rx="1"/>
        <circle cx="${width / 2}" cy="${height * 0.75}" r="${width * 0.08}" fill="#3b82f6" opacity="0.2"/>
        <text x="${width / 2}" y="${height * 0.78}" text-anchor="middle" fill="#3b82f6" font-family="Arial" font-size="${width * 0.06}" font-weight="600">PDF</text>
        <text x="${width / 2}" y="${height * 0.88}" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="${width * 0.04}">Document</text>
      </svg>
    `;

    const thumbnailData = `data:image/svg+xml;base64,${btoa(fallbackSvg)}`;

    // For stored files, cache the SVG placeholder
    if (filePath && fileId) {
      try {
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

        console.log('SVG placeholder stored successfully:', publicUrl);

        return new Response(
          JSON.stringify({ 
            success: true, 
            thumbnailUrl: publicUrl,
            thumbnailData: thumbnailData,
            fallback: true
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

    // Return the SVG placeholder immediately
    return new Response(
      JSON.stringify({ 
        success: true, 
        thumbnailData: thumbnailData,
        fallback: true
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-thumbnail function:', error);
    
    // Return a basic fallback even on error
    const basicSvg = `
      <svg width="200" height="260" viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="260" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1" rx="8"/>
        <text x="100" y="130" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="12" font-weight="600">PDF</text>
      </svg>
    `;
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        thumbnailData: `data:image/svg+xml;base64,${btoa(basicSvg)}`,
        fallback: true
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});