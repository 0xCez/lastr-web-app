import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    console.log('SignWell webhook received:', payload);

    // SignWell sends event_type in webhook
    const { event_type, document_id, metadata } = payload;

    // Only process when document is completed (all signatures done)
    if (event_type !== 'document_completed') {
      console.log('Ignoring event type:', event_type);
      return new Response(
        JSON.stringify({ message: 'Event ignored' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get user_id and contract_type from metadata
    const userId = metadata?.user_id;
    const contractType = metadata?.contract_type;

    if (!userId) {
      console.error('No user_id in metadata');
      throw new Error('No user_id in webhook metadata');
    }

    // Determine which fields to update based on contract type
    // AM contracts have contract_type: 'account_manager' in metadata
    const isAMContract = contractType === 'account_manager';

    let updateError;
    if (isAMContract) {
      // Update AM contract fields
      const { error } = await supabaseClient
        .from('users')
        .update({
          am_contract_signed_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .eq('am_signwell_document_id', document_id);
      updateError = error;
    } else {
      // Update UGC contract fields (default)
      const { error } = await supabaseClient
        .from('users')
        .update({
          contract_signed_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .eq('signwell_document_id', document_id);
      updateError = error;
    }

    if (updateError) {
      console.error('Error updating user:', updateError);
      throw updateError;
    }

    console.log(`${isAMContract ? 'AM ' : ''}Contract signed for user ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Contract status updated'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in signwell-webhook:', error);
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
