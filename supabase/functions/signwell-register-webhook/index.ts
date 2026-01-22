import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SIGNWELL_API_KEY = Deno.env.get('SIGNWELL_API_KEY');
const SIGNWELL_API_URL = 'https://www.signwell.com/api/v1';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!SIGNWELL_API_KEY) {
      throw new Error('SIGNWELL_API_KEY not configured');
    }

    // The callback URL for our webhook handler
    const callbackUrl = `${SUPABASE_URL}/functions/v1/signwell-webhook`;

    console.log('Registering webhook with callback URL:', callbackUrl);

    // First, list existing webhooks to avoid duplicates
    const listResponse = await fetch(`${SIGNWELL_API_URL}/hooks/`, {
      method: 'GET',
      headers: {
        'X-Api-Key': SIGNWELL_API_KEY,
      },
    });

    if (listResponse.ok) {
      const existingHooks = await listResponse.json();
      console.log('Existing webhooks:', existingHooks);

      // Check if our webhook already exists
      const existingHook = existingHooks.find((hook: any) =>
        hook.callback_url === callbackUrl
      );

      if (existingHook) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Webhook already registered',
            webhook: existingHook,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    }

    // Register webhook for document_completed event
    const response = await fetch(`${SIGNWELL_API_URL}/hooks/`, {
      method: 'POST',
      headers: {
        'X-Api-Key': SIGNWELL_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callback_url: callbackUrl,
        event_name: 'document_completed',
      }),
    });

    const responseText = await response.text();
    console.log('SignWell webhook registration response:', response.status, responseText);

    if (!response.ok) {
      throw new Error(`SignWell API error: ${responseText}`);
    }

    const data = JSON.parse(responseText);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook registered successfully',
        webhook: data,
        callbackUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error registering webhook:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
