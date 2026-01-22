import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SIGNWELL_API_KEY = Deno.env.get('SIGNWELL_API_KEY');
const SIGNWELL_API_URL = 'https://www.signwell.com/api/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, fullName, userId } = await req.json();

    if (!SIGNWELL_API_KEY) {
      throw new Error('SIGNWELL_API_KEY not configured');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Create contract via SignWell API using template
    const response = await fetch(`${SIGNWELL_API_URL}/document_templates/documents/`, {
      method: 'POST',
      headers: {
        'X-Api-Key': SIGNWELL_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_id: 'cfbe02e1-50a5-4e58-b81a-eb360192cad6',
        recipients: [
          {
            id: 1,
            email: email,
            name: fullName,
            placeholder_name: 'Ugc Creator'
          },
          {
            id: 2,
            email: 'Contact@lastr.app',
            name: 'Standard Consumer Software FZCO',
            placeholder_name: 'Document Sender'
          }
        ],
        // Include user_id in metadata so webhook knows which user to update
        metadata: {
          user_id: userId,
        },
        draft: false,
        test_mode: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SignWell API error:', errorText);
      throw new Error(`SignWell API error: ${errorText}`);
    }

    const data = await response.json();

    // Update user record with contract info
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({
        contract_sent_at: new Date().toISOString(),
        signwell_document_id: data.id,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        documentId: data.id,
        message: 'Contract sent successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in send-contract:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
