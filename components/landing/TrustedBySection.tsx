"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const companyLogos = [
  { name: "Google", src: "/covers/google.png" },
  { name: "Amazon", src: "/covers/amazon.png" },
  { name: "Adobe", src: "/covers/adobe.png" },
  { name: "Netflix", src: "/covers/netflix.png" },
  { name: "Facebook", src: "/covers/facebook.png" },
  { name: "Spotify", src: "/covers/spotify.png" },
  { name: "Walmart", src: "/covers/walmart.png" },
  { name: "Cisco", src: "/covers/cisco.png" },
  { name: "Reddit", src: "/covers/reddit.png" },
  { name: "Pinterest", src: "/covers/pinterest.png" },
];

export default function TrustedBySection() {
  // Duplicate logos for seamless infinite scroll
  const doubled = [...companyLogos, ...companyLogos];

  return (
    <section className="py-16 md:py-20 border-y border-white/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 md:px-6"
      >
        <p className="text-center text-sm text-light-600 uppercase tracking-widest mb-10">
          Trusted by candidates interviewing at
        </p>

        {/* Scrolling logo bar */}
        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-dark-100 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-dark-100 to-transparent z-10 pointer-events-none" />

          <div className="flex animate-logo-scroll gap-12 w-max">
            {doubled.map((company, i) => (
              <div
                key={`${company.name}-${i}`}
                className="flex-shrink-0 flex items-center justify-center h-12 w-28 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
              >
                <Image
                  src={company.src}
                  alt={company.name}
                  width={100}
                  height={40}
                  className="object-contain max-h-10"
                />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
