"use client";
import React from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

export function MasrafIcon({
  icon,
  size = 20,
  color = "currentColor",
  strokeWidth = 1.8,
  style,
}: {
  icon: IconSvgElement;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      primaryColor={color}
      strokeWidth={strokeWidth}
      style={{ display: "block", flexShrink: 0, ...style }}
    />
  );
}

