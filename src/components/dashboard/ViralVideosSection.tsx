import { Suspense, lazy } from "react";
import Marquee from "react-fast-marquee";

const VideoEmbed = lazy(() => import("./VideoEmbed"));

// Video files hosted on Supabase Storage
const videoFiles = [
  "https://uziactaapbzrqxazhpts.supabase.co/storage/v1/object/public/videos/video1.mp4",
  "https://uziactaapbzrqxazhpts.supabase.co/storage/v1/object/public/videos/video2.mp4",
  "https://uziactaapbzrqxazhpts.supabase.co/storage/v1/object/public/videos/video3.mp4",
  "https://uziactaapbzrqxazhpts.supabase.co/storage/v1/object/public/videos/video4.mp4",
  "https://uziactaapbzrqxazhpts.supabase.co/storage/v1/object/public/videos/video5.mp4",
];

const VideoSkeleton = () => (
  <div className="aspect-[9/16] w-[200px] md:w-[315px] rounded-xl bg-secondary/50 animate-pulse mx-2 md:mx-3" />
);

const ViralVideosSection = () => {
  return (
    <section className="px-4 md:px-6 py-8">
      <div className="glass-card py-4 md:py-8">
        <div className="text-center mb-6 md:mb-8 px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Most Viral Videos</h2>
          <p className="text-muted-foreground">
            You can use these videos as templates, but you<br />
            should also feel free to create your own.
          </p>
        </div>

        <Marquee
          pauseOnHover={true}
          speed={40}
          gradient={false}
          className="py-4"
        >
          {videoFiles.map((videoSrc, index) => (
            <div key={index} className="mx-2 md:mx-3">
              <Suspense fallback={<VideoSkeleton />}>
                <VideoEmbed videoSrc={videoSrc} className="w-[200px] md:w-[315px]" />
              </Suspense>
            </div>
          ))}
          {/* Duplicate videos for seamless loop */}
          {videoFiles.map((videoSrc, index) => (
            <div key={`dup-${index}`} className="mx-2 md:mx-3">
              <Suspense fallback={<VideoSkeleton />}>
                <VideoEmbed videoSrc={videoSrc} className="w-[200px] md:w-[315px]" />
              </Suspense>
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  );
};

export default ViralVideosSection;
