import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const testAccounts = [
  {
    email: 'ugc1@test.com',
    password: 'testpass123',
    full_name: 'Sarah Martinez',
    country: 'United States',
    paypal_info: 'sarah.martinez@paypal.com',
    role: 'ugc_creator',
    contract_option: 'option1',
    tiktok_handle: 'sarahmartinez_bets',
    ig_handle: 'sarahmartinez.betting',
  },
  {
    email: 'ugc2@test.com',
    password: 'testpass123',
    full_name: 'Michael Chen',
    country: 'Canada',
    paypal_info: 'michael.chen@paypal.com',
    role: 'ugc_creator',
    contract_option: 'option1',
    tiktok_handle: 'mikechenpredictor',
    ig_handle: 'mikechen_sports',
  },
  {
    email: 'ugc3@test.com',
    password: 'testpass123',
    full_name: 'Emma Johnson',
    country: 'United Kingdom',
    paypal_info: 'emma.johnson@paypal.com',
    role: 'ugc_creator',
    contract_option: 'option1',
    tiktok_handle: 'emmajbetting',
    ig_handle: 'emmaj_predictions',
  },
];

async function createTestAccounts() {
  console.log('Creating 3 UGC Creator test accounts...\n');

  for (const account of testAccounts) {
    console.log(`\n📝 Creating account for ${account.full_name}...`);

    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: account.full_name,
          role: account.role,
        },
      });

      if (authError) {
        console.error(`❌ Failed to create auth user: ${authError.message}`);
        continue;
      }

      if (!authData.user) {
        console.error(`❌ No user returned from auth creation`);
        continue;
      }

      console.log(`✅ Auth user created: ${authData.user.email}`);

      // Step 2: Complete profile using the secure function
      const { data: profileResult, error: profileError } = await supabase.rpc('complete_user_profile', {
        p_user_id: authData.user.id,
        p_full_name: account.full_name,
        p_email: account.email,
        p_country: account.country,
        p_paypal_info: account.paypal_info,
        p_contract_option: account.contract_option,
        p_tiktok_handle: account.tiktok_handle,
        p_ig_handle: account.ig_handle,
      });

      if (profileError) {
        console.error(`❌ Failed to complete profile: ${profileError.message}`);
        continue;
      }

      console.log(`✅ Profile completed`);
      console.log(`   TikTok: @${account.tiktok_handle}`);
      console.log(`   Instagram: @${account.ig_handle}`);
      console.log(`   Email: ${account.email}`);
      console.log(`   Password: ${account.password}`);

    } catch (error: any) {
      console.error(`❌ Error creating account: ${error.message}`);
    }
  }

  console.log('\n\n✨ Test accounts creation complete!\n');
  console.log('═══════════════════════════════════════════════');
  console.log('LOGIN CREDENTIALS:');
  console.log('═══════════════════════════════════════════════');
  testAccounts.forEach((account, index) => {
    console.log(`\n${index + 1}. ${account.full_name}`);
    console.log(`   Email: ${account.email}`);
    console.log(`   Password: ${account.password}`);
    console.log(`   TikTok: @${account.tiktok_handle}`);
    console.log(`   Instagram: @${account.ig_handle}`);
  });
  console.log('\n═══════════════════════════════════════════════\n');
}

createTestAccounts();
