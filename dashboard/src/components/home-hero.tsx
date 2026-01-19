"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function HeroSection() {
  return (
    <section className="relative bg-background pt-[130px] md:pt-[120px] pb-12 lg:pb-0 px-6 sm:px-8">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 py-6 sm:py-8">
          {/* Content - Always comes first in DOM */}
          <div className="order-1 lg:order-none w-full lg:w-1/2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="inline-block px-4 py-2 bg-primary/10 border-primary/20">
                <span className="text-sm font-medium text-primary">
                  Student-Run Campus Journalism
                </span>
              </Card>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
            >
              Your <span className="text-primary">Voice</span> on Campus
              <br />
              Through <span className="text-primary">Authentic</span> Storytelling
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg text-muted-foreground"
            >
              Award-winning student journalism covering campus news, sports, arts, and
              investigative reporting since 1945. Independent. Fearless. Yours.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap gap-4 pt-4"
            >
              <Button size="lg" className="text-base">
                Read Latest Issue
              </Button>
              <Button size="lg" variant="outline" className="text-base">
                Join Our Team
              </Button>
            </motion.div>
          </div>

          {/* Image - Appears below on mobile, to the right on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="order-2 lg:order-none w-full lg:w-auto lg:ml-auto lg:mr-[50px] relative"
          >
            <img
              src="/tech.png"
              alt="Campus newspaper team"
              className="w-full h-auto max-h-[400px] lg:max-h-none lg:h-[800px] object-contain mx-auto"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}