import { useRef } from "react";
import { motion, useInView } from "motion/react";

const EASE = [0.22, 1, 0.36, 1];

export function LandingReveal({
  children,
  className = "",
  delay = 0,
  y = 32,
  once = true,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, {
    once,
    amount: 0.18,
    margin: "-10% 0px -6% 0px",
  });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y, scale: 0.98, filter: "blur(8px)" }}
      animate={
        inView
          ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
          : { opacity: 0, y, scale: 0.98, filter: "blur(8px)" }
      }
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function LandingStagger({ children, className = "", stagger = 0.12, once = true }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once, amount: 0.15, margin: "-8% 0px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: 0.05 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function LandingItem({ children, className = "" }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 28, scale: 0.94 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.6, ease: EASE },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
