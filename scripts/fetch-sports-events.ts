/**
 * Fetch Sports Events Script
 *
 * Run this every Sunday to fetch upcoming week's sports fixtures
 * Usage: npx tsx scripts/fetch-sports-events.ts
 *
 * Or set up a cron job:
 * 0 6 * * 0 cd /path/to/creator-platform && npx tsx scripts/fetch-sports-events.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { getAllUpcomingGames, transformEvent } from '../src/services/sportsdb.js';

// Load environment variables from .env file
config();

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role for unrestricted access

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fetchAndStoreEvents() {
  console.log('🏈 Fetching sports events from TheSportsDB...');

  try {
    // Fetch all upcoming games (10 per league)
    const events = await getAllUpcomingGames(10);

    if (events.length === 0) {
      console.log('⚠️  No events found');
      return;
    }

    console.log(`✅ Fetched ${events.length} total events`);

    // Transform to database format
    const transformedEvents = events.map(transformEvent);

    // Deduplicate events by event_id (keep first occurrence)
    const uniqueEvents = Array.from(
      new Map(transformedEvents.map(e => [e.event_id, e])).values()
    );

    console.log(`✅ After deduplication: ${uniqueEvents.length} unique events`);

    // Delete old events (older than yesterday) to keep table clean
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { error: deleteError } = await supabase
      .from('sports_events')
      .delete()
      .lt('event_date', yesterday.toISOString());

    if (deleteError) {
      console.error('⚠️  Error deleting old events:', deleteError);
    } else {
      console.log('🗑️  Cleaned up old events');
    }

    // Upsert events (insert or update if exists)
    const { error: upsertError } = await supabase
      .from('sports_events')
      .upsert(uniqueEvents, {
        onConflict: 'event_id',
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error('❌ Error storing events:', upsertError);
      process.exit(1);
    }

    console.log('✅ Successfully stored events in database');

    // Show breakdown by sport
    const breakdown = uniqueEvents.reduce((acc, event) => {
      acc[event.sport] = (acc[event.sport] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Breakdown by sport:');
    Object.entries(breakdown).forEach(([sport, count]) => {
      console.log(`  ${sport}: ${count} events`);
    });

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
fetchAndStoreEvents()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
