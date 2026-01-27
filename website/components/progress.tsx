"use client"

import { motion } from "framer-motion"

export function Progress() {
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-2xl md:text-3xl text-foreground lowercase mb-6 font-light"
        >
          see what you know — and what you're growing
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-muted-foreground text-lg lowercase mb-12"
        >
          track your progress with a t-shaped mastery model
        </motion.p>

        {/* T-shaped visualization concept */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative inline-flex flex-col items-center"
        >
          {/* Horizontal bar - breadth */}
          <div className="relative mb-2">
            <div className="w-64 md:w-80 h-3 bg-primary/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "75%" }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-primary rounded-full"
              />
            </div>
            <span className="absolute -right-20 top-1/2 -translate-y-1/2 text-sm text-muted-foreground lowercase hidden md:block">
              breadth
            </span>
          </div>

          {/* Vertical bar - depth */}
          <div className="relative flex items-start">
            <div className="w-3 h-32 md:h-40 bg-primary/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: "60%" }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.7 }}
                className="w-full bg-primary rounded-full"
              />
            </div>
            <span className="absolute -right-16 top-1/2 -translate-y-1/2 text-sm text-muted-foreground lowercase hidden md:block">
              depth
            </span>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-muted-foreground/70 text-sm lowercase mt-12"
        >
          horizontal breadth · vertical depth
        </motion.p>
      </div>
    </section>
  )
}
