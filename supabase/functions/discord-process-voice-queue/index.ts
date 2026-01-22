/**
 * Discord Process Message Queue
 * Called every minute by pg_cron
 * Finds scheduled messages (voice or text) that are due and sends them
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Find messages that are due (scheduled_for <= now) and not yet sent
    const { data: pendingMessages, error: fetchError } = await supabase
      .from('scheduled_voice_notes')
      .select('id, channel_id, user_name, discord_user_id, message_type')
      .lte('scheduled_for', new Date().toISOString())
      .is('sent_at', null)
      .order('scheduled_for', { ascending: true })
      .limit(10)

    if (fetchError) {
      throw new Error(`Failed to fetch pending messages: ${fetchError.message}`)
    }

    if (!pendingMessages || pendingMessages.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No pending messages', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📨 Processing ${pendingMessages.length} pending messages...`)

    const results: { id: string; type: string; success: boolean; error?: string }[] = []

    for (const msg of pendingMessages) {
      try {
        const messageType = msg.message_type || 'voice'

        // Determine which function to call based on message type
        const functionName = messageType === 'text'
          ? 'discord-send-text-as-user'
          : 'discord-send-voice-as-user'

        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/${functionName}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              channelId: msg.channel_id,
              userName: msg.user_name,
              discordUserId: msg.discord_user_id,
            }),
          }
        )

        const result = await response.json()

        if (result.success) {
          await supabase
            .from('scheduled_voice_notes')
            .update({ sent_at: new Date().toISOString() })
            .eq('id', msg.id)

          console.log(`✅ Sent ${messageType} to ${msg.user_name} (${msg.channel_id})`)
          results.push({ id: msg.id, type: messageType, success: true })
        } else {
          await supabase
            .from('scheduled_voice_notes')
            .update({ error: result.error || 'Unknown error' })
            .eq('id', msg.id)

          console.error(`❌ Failed to send ${messageType} to ${msg.user_name}: ${result.error}`)
          results.push({ id: msg.id, type: messageType, success: false, error: result.error })
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        await supabase
          .from('scheduled_voice_notes')
          .update({ error: errorMsg })
          .eq('id', msg.id)

        console.error(`❌ Error processing ${msg.id}: ${errorMsg}`)
        results.push({ id: msg.id, type: msg.message_type || 'voice', success: false, error: errorMsg })
      }
    }

    const successCount = results.filter(r => r.success).length

    return new Response(
      JSON.stringify({
        success: true,
        processed: pendingMessages.length,
        sent: successCount,
        failed: pendingMessages.length - successCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error processing queue:', error)
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
