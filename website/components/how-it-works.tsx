"use client"

import { motion } from "framer-motion"

const steps = [
  {
    number: "01",
    text: "add a topic",
  },
  {
    number: "02",
    text: "upload notes or a youtube link",
  },
  {
    number: "03",
    text: "listen and respond by voice",
  },
  {
    number: "04",
    text: "improve every session",
  },
]

export function HowItWorks() {
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-2xl md:text-3xl text-foreground text-center lowercase mb-16 font-light"
        >
          how it works
        </motion.h2>

        <div className="grid gap-8 md:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-center gap-6 md:gap-8"
            >
              <span className="text-primary text-xl md:text-2xl font-mono opacity-60">
                {step.number}
              </span>
              <span className="text-foreground text-lg md:text-2xl lowercase font-light">
                {step.text}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
