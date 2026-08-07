"use client";

import { motion, useReducedMotion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const easeOut = [0.22, 1, 0.36, 1] as const;

export const FadeIn = ({
  children,
  delay = 0,
  duration = 0.4,
  className,
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
};

export const ScaleIn = ({ children, className }: { children: ReactNode; className?: string }) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
};

export const SlideIn = ({
  children,
  direction = "right",
  className,
}: {
  children: ReactNode;
  direction?: "left" | "right";
  className?: string;
}) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: direction === "right" ? 16 : -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
};

export function StaggerChildren({
  children,
  className,
  stagger = 0.06,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: stagger, delayChildren: delay },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easeOut } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function HoverLift({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.99 }}
    >
      {children}
    </motion.div>
  );
}

export function PageSection({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <section id={id} className={className}>{children}</section>;
  return (
    <motion.section
      id={id}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: easeOut }}
    >
      {children}
    </motion.section>
  );
}

type AnimatedNumberProps = {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  format?: (n: number) => string;
};

export function AnimatedNumber({
  value,
  className,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 0.6,
  format,
}: AnimatedNumberProps) {
  const reduce = useReducedMotion();
  const motionValue = useMotionValue(reduce ? value : 0);
  const display = useTransform(motionValue, (latest) => {
    if (format) return `${prefix}${format(latest)}${suffix}`;
    return `${prefix}${latest.toLocaleString("en-IN", {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    })}${suffix}`;
  });

  useEffect(() => {
    if (reduce) {
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, { duration, ease: easeOut });
    return controls.stop;
  }, [value, duration, reduce, motionValue]);

  return <motion.span className={cn("tabular-nums", className)}>{display}</motion.span>;
}
