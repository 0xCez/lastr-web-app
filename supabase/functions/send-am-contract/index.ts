import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SIGNWELL_API_KEY = Deno.env.get('SIGNWELL_API_KEY');
const SIGNWELL_API_URL = 'https://www.signwell.com/api/v1';

// AM/Slideshow contract template ID
const AM_TEMPLATE_ID = 'c740a2ca-a869-4405-9ada-b07ffefcf05e';

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

    // Create contract via SignWell API using AM template
    const response = await fetch(`${SIGNWELL_API_URL}/document_templates/documents/`, {
      method: 'POST',
      headers: {
        'X-Api-Key': SIGNWELL_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_id: AM_TEMPLATE_ID,
        recipients: [
          {
            id: 1,
            email: email,
            name: fullName,
            placeholder_name: 'account managers'
          },
          {
            id: 2,
            email: 'Contact@lastr.app',
            name: 'Standard Consumer Software FZCO',
            placeholder_name: 'me'
          }
        ],
        // Include user_id and contract_type in metadata so webhook knows which user and type to update
        metadata: {
          user_id: userId,
          contract_type: 'account_manager',
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

    // Update user record with AM contract info
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({
        am_contract_sent_at: new Date().toISOString(),
        am_signwell_document_id: data.id,
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
        message: 'AM contract sent successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in send-am-contract:', error);
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
