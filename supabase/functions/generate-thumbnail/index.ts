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

    // For now, we'll create a simple placeholder thumbnail
    // In a production environment, you would use a PDF processing library
    const placeholderSvg = `
      <svg width="200" height="260" viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="260" fill="#f8f9fa" stroke="#e9ecef" stroke-width="2"/>
        <rect x="20" y="40" width="160" height="20" fill="#dee2e6" rx="2"/>
        <rect x="20" y="80" width="120" height="20" fill="#dee2e6" rx="2"/>
        <rect x="20" y="120" width="140" height="20" fill="#dee2e6" rx="2"/>
        <rect x="20" y="160" width="100" height="20" fill="#dee2e6" rx="2"/>
        <text x="100" y="220" text-anchor="middle" fill="#6c757d" font-family="Arial" font-size="14">PDF</text>
      </svg>
    `;

    // Convert SVG to base64
    const thumbnailData = `data:image/svg+xml;base64,${btoa(placeholderSvg)}`;

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
        thumbnailData 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-thumbnail function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});