"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import DottedMap from "dotted-map";
import { useTheme } from "next-themes";

interface MapProps {
  dots?: Array<{
    start: { lat: number; lng: number; label?: string };
    end: { lat: number; lng: number; label?: string };
  }>;
  lineColor?: string;
}

export function WorldMap({
  dots = [],
  lineColor,
}: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
     
     
    setMounted(true);
  }, []);

  // Memoize the map instance
  const map = useMemo(() => new DottedMap({ height: 100, grid: "diagonal" }), []);

  // Theme-aware line color: white in dark mode, black in light mode
  const effectiveLineColor = lineColor || (resolvedTheme === "dark" ? "#ffffff" : "#000000");

  // Memoize SVG map generation based on theme
  const svgMap: string = useMemo(() => {
    const isDark = resolvedTheme === "dark";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (map as any).getSVG({
      radius: 0.22,
      color: isDark ? "#FFFFFF40" : "#00000040",
      shape: "circle",
      backgroundColor: "transparent",
    });
  }, [map, resolvedTheme]);

  const projectPoint = (lat: number, lng: number) => {
    const x = (lng + 180) * (800 / 360);
    const y = (90 - lat) * (400 / 180);
    return { x, y };
  };

  const createCurvedPath = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - 50;
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  };

  // Prevent hydration mismatch - show nothing until mounted
  if (!mounted) {
    return <div className="w-full aspect-[2/1] rounded-lg relative" />;
  }

  return (
    <div className="w-full aspect-[2/1] bg-transparent rounded-lg relative font-sans">
      {/* SVG Map with embedded dotted background */}
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="w-full h-full absolute inset-0 pointer-events-none select-none"
        style={{
          maskImage: "linear-gradient(to bottom, transparent, white 10%, white 90%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, white 10%, white 90%, transparent)",
        }}
      >
        {/* Embed the dotted map as background */}
        <image
          href={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
          x="0"
          y="0"
          width="800"
          height="400"
          preserveAspectRatio="xMidYMid slice"
        />

        {/* Connection paths */}
        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng);
          const endPoint = projectPoint(dot.end.lat, dot.end.lng);
          return (
            <g key={`path-group-${i}`}>
              <motion.path
                d={createCurvedPath(startPoint, endPoint)}
                fill="none"
                stroke="url(#path-gradient)"
                strokeWidth="1"
                initial={{
                  pathLength: 0,
                }}
                animate={{
                  pathLength: 1,
                }}
                transition={{
                  duration: 1,
                  delay: 0.5 * i,
                  ease: "easeOut",
                }}
                key={`path-${i}`}
              />
            </g>
          );
        })}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="5%" stopColor={effectiveLineColor} stopOpacity="1" />
            <stop offset="95%" stopColor={effectiveLineColor} stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Connection points */}
        {dots.map((dot, i) => (
          <g key={`points-group-${i}`}>
            {/* Start point */}
            <g key={`start-${i}`}>
              <circle
                cx={projectPoint(dot.start.lat, dot.start.lng).x}
                cy={projectPoint(dot.start.lat, dot.start.lng).y}
                r="2"
                fill={effectiveLineColor}
              />
              <circle
                cx={projectPoint(dot.start.lat, dot.start.lng).x}
                cy={projectPoint(dot.start.lat, dot.start.lng).y}
                r="2"
                fill={effectiveLineColor}
                opacity="0.5"
              >
                <animate
                  attributeName="r"
                  from="2"
                  to="8"
                  dur="1.5s"
                  begin="0s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.5"
                  to="0"
                  dur="1.5s"
                  begin="0s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
            {/* End point */}
            <g key={`end-${i}`}>
              <circle
                cx={projectPoint(dot.end.lat, dot.end.lng).x}
                cy={projectPoint(dot.end.lat, dot.end.lng).y}
                r="2"
                fill={effectiveLineColor}
              />
              <circle
                cx={projectPoint(dot.end.lat, dot.end.lng).x}
                cy={projectPoint(dot.end.lat, dot.end.lng).y}
                r="2"
                fill={effectiveLineColor}
                opacity="0.5"
              >
                <animate
                  attributeName="r"
                  from="2"
                  to="8"
                  dur="1.5s"
                  begin="0s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.5"
                  to="0"
                  dur="1.5s"
                  begin="0s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}
