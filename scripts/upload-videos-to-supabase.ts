import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = 'videos';
const VIDEOS_DIR = path.join(process.cwd(), 'public', 'videos');

async function uploadVideos() {
  // Check if bucket exists, create if not
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

  if (!bucketExists) {
    console.log(`Creating bucket "${BUCKET_NAME}"...`);
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 52428800, // 50MB
    });
    if (error) {
      console.error('Error creating bucket:', error);
      return;
    }
    console.log('Bucket created successfully');
  }

  // Get all video files
  const files = fs.readdirSync(VIDEOS_DIR).filter(f => f.endsWith('.mp4'));
  console.log(`Found ${files.length} videos to upload`);

  const uploadedUrls: string[] = [];

  for (const file of files) {
    const filePath = path.join(VIDEOS_DIR, file);
    const fileBuffer = fs.readFileSync(filePath);

    console.log(`Uploading ${file}...`);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(file, fileBuffer, {
        contentType: 'video/mp4',
        upsert: true,
      });

    if (error) {
      console.error(`Error uploading ${file}:`, error);
      continue;
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(file);

    console.log(`Uploaded: ${urlData.publicUrl}`);
    uploadedUrls.push(urlData.publicUrl);
  }

  console.log('\n=== All Upload URLs ===');
  uploadedUrls.forEach(url => console.log(url));

  console.log('\n=== For ViralVideosSection.tsx ===');
  console.log('const videoFiles = [');
  uploadedUrls.forEach(url => console.log(`  "${url}",`));
  console.log('];');
}

uploadVideos();
