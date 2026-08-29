import Link from "next/link";
import type { ReactNode } from "react";

type ButtonProps = {
  href?: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
};

const base =
  "inline-flex items-center justify-center rounded-full px-6 py-4 text-base font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-primary text-white hover:opacity-90",
  secondary:
    "bg-primary-light text-primary border border-border hover:bg-white",
};

export function Button({
  href,
  children,
  variant = "primary",
  className = "",
  disabled,
  onClick,
  type = "button",
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
