"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export function FinalCta() {
  return (
    <section className="py-24 md:py-32 px-6 bg-card/30">
      <div className="max-w-2xl mx-auto text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <span className="font-[var(--font-pacifico)] text-2xl text-primary">
            drivelearn
          </span>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6"
        >
          <Button 
            size="lg" 
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-10 py-7 rounded-full lowercase font-medium tracking-wide"
          >
            start learning on your next drive
          </Button>
        </motion.div>

        {/* Supporting line */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-muted-foreground lowercase"
        >
          just press play.
        </motion.p>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20 pt-8 border-t border-border/30"
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-sm text-muted-foreground/60 lowercase">
            <span>© 2026 drivelearn</span>
            <a href="#" className="hover:text-foreground transition-colors">privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">terms</a>
            <a href="#" className="hover:text-foreground transition-colors">contact</a>
          </div>
        </motion.footer>
      </div>
    </section>
  )
}
