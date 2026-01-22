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
    if (!SIGNWELL_API_KEY) {
      throw new Error('SIGNWELL_API_KEY not configured');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Fetch all users with signwell_document_id but no contract_signed_at (UGC contracts)
    const { data: ugcUsers, error: ugcFetchError } = await supabaseClient
      .from('users')
      .select('id, full_name, email, signwell_document_id, contract_signed_at')
      .not('signwell_document_id', 'is', null)
      .is('contract_signed_at', null);

    if (ugcFetchError) {
      throw ugcFetchError;
    }

    // Fetch all users with am_signwell_document_id but no am_contract_signed_at (AM contracts)
    const { data: amUsers, error: amFetchError } = await supabaseClient
      .from('users')
      .select('id, full_name, email, am_signwell_document_id, am_contract_signed_at')
      .not('am_signwell_document_id', 'is', null)
      .is('am_contract_signed_at', null);

    if (amFetchError) {
      throw amFetchError;
    }

    // Combine both lists, marking contract type
    const users = [
      ...(ugcUsers || []).map(u => ({ ...u, contractType: 'ugc' as const })),
      ...(amUsers || []).map(u => ({
        ...u,
        signwell_document_id: u.am_signwell_document_id,
        contractType: 'am' as const
      })),
    ];

    console.log(`Found ${ugcUsers?.length || 0} UGC users and ${amUsers?.length || 0} AM users to sync`);

    const results = {
      total: users?.length || 0,
      updated: 0,
      pending: 0,
      errors: [] as string[],
    };

    for (const user of users || []) {
      try {
        // Fetch document status from SignWell
        const response = await fetch(`${SIGNWELL_API_URL}/documents/${user.signwell_document_id}/`, {
          method: 'GET',
          headers: {
            'X-Api-Key': SIGNWELL_API_KEY,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error fetching document ${user.signwell_document_id}:`, errorText);
          results.errors.push(`${user.full_name}: ${errorText}`);
          continue;
        }

        const doc = await response.json();
        console.log(`Document ${user.signwell_document_id} for ${user.full_name}:`, JSON.stringify(doc, null, 2));

        // Check if document is completed - case insensitive check
        const status = (doc.status || '').toLowerCase();
        const isCompleted = status === 'completed';

        // Try multiple possible date fields
        const completedAt = doc.completed_at || doc.signed_at || doc.finalized_at || doc.updated_at;

        console.log(`Status check for ${user.full_name}: status="${doc.status}", isCompleted=${isCompleted}, completedAt=${completedAt}`);

        if (isCompleted) {
          // Use the computed completedAt which falls back through multiple possible fields
          const signedTimestamp = completedAt || new Date().toISOString();

          // Update user with signed timestamp - use appropriate field based on contract type
          const isAMContract = (user as any).contractType === 'am';
          const updateFields = isAMContract
            ? { am_contract_signed_at: signedTimestamp }
            : { contract_signed_at: signedTimestamp };

          const { data: updateData, error: updateError, count } = await supabaseClient
            .from('users')
            .update(updateFields)
            .eq('id', user.id)
            .select('id');

          console.log(`Update result for ${user.full_name} (${isAMContract ? 'AM' : 'UGC'}): data=${JSON.stringify(updateData)}, error=${updateError}, count=${count}`);

          if (updateError) {
            console.error(`Error updating user ${user.id}:`, updateError);
            results.errors.push(`${user.full_name}: ${updateError.message}`);
          } else if (!updateData || updateData.length === 0) {
            console.error(`No rows updated for user ${user.id} - possible RLS issue`);
            results.errors.push(`${user.full_name}: No rows updated`);
          } else {
            console.log(`Updated ${user.full_name} (${isAMContract ? 'AM' : 'UGC'}) with signed_at: ${signedTimestamp}`);
            results.updated++;
          }
        } else {
          console.log(`Document for ${user.full_name} not yet completed (status: "${doc.status}")`);
          results.pending++;
        }

        console.log(`--- Finished processing ${user.full_name} ---`);

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error: any) {
        console.error(`Error processing user ${user.id}:`, error);
        results.errors.push(`${user.full_name}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${results.updated} contracts, ${results.pending} pending`,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in signwell-sync-status:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
