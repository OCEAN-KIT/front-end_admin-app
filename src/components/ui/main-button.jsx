// components/MainButton.jsx
import React from "react";

const VARIANTS = {
  primary: "bg-[#2F80ED] text-white hover:brightness-105",
  secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  ghost: "bg-transparent text-gray-800 hover:bg-gray-100",
};

const SIZES = {
  lg: "h-14 px-6 text-lg",
  md: "h-12 px-5 text-base",
  sm: "h-10 px-4 text-sm",
};

/**
 * 재사용 버튼
 * @param {'primary'|'secondary'|'ghost'} variant
 * @param {'lg'|'md'|'sm'} size
 * @param {boolean} full - 가로폭 100%
 * @param {boolean} disabled
 */
export default function MainButton({
  children,
  variant = "primary",
  size = "md",
  full = true,
  disabled = false,
  className = "",
  type = "button",
  onClick,
}) {
  const base =
    "inline-flex items-center justify-center rounded-2xl font-semibold " +
    "transition-all select-none shadow-md disabled:shadow-none " +
    "disabled:bg-gray-200 disabled:text-gray-400 cursor-pointer";

  const width = full ? "w-full" : "";
  const classes = [
    base,
    VARIANTS[variant] ?? VARIANTS.primary,
    SIZES[size] ?? SIZES.md,
    width,
    className,
  ].join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
