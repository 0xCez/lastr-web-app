import { Suspense, lazy } from "react";
import Marquee from "react-fast-marquee";
import { motion } from "framer-motion";

const VideoEmbed = lazy(() => import("./VideoEmbed"));

// Video files from /public/videos/
const videoFiles = [
  "/videos/video1.mp4",
  "/videos/video2.mp4",
  "/videos/video3.mp4",
  "/videos/video4.mp4",
  "/videos/video5.mp4",
];

const VideoSkeleton = () => (
  <div className="aspect-[9/16] w-[200px] md:w-[280px] rounded-xl bg-secondary/50 animate-pulse mx-2 md:mx-3" />
);

const ViralVideosBand = () => {
  return (
    <section className="py-16 bg-secondary/30">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8 px-6"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Examples of Viral Videos</h2>
        <p className="text-muted-foreground">
          Simple formats that get millions of views
        </p>
      </motion.div>

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
    </section>
  );
};

export default ViralVideosBand;
