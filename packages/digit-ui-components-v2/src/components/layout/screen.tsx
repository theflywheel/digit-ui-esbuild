import * as React from "react";
import { cn } from "../../lib/cn";
import { ChevronLeft } from "lucide-react";

export interface BackLinkProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: React.ReactNode;
}

/**
 * Lightweight back affordance — text + chevron, defaults to going back one step
 * via window.history when no onClick is provided.
 */
export const BackLink = React.forwardRef<HTMLButtonElement, BackLinkProps>(
  ({ className, label = "Back", onClick, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={(e) => {
          if (onClick) {
            onClick(e);
          } else if (typeof window !== "undefined") {
            window.history.back();
          }
        }}
        className={cn(
          "inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors",
          "hover:text-foreground focus-visible:outline-none focus-visible:text-foreground",
          className
        )}
        {...props}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        {label}
      </button>
    );
  }
);
BackLink.displayName = "BackLink";

export interface ScreenContainerProps {
  className?: string;
  children: React.ReactNode;
  /** Kept for API compatibility; v2 no longer uses a sticky footer. */
  withFooter?: boolean;
}

/**
 * Top-level wrapper for a v2 screen. Fills the available content column
 * (matching legacy layout — back button + form share the same width) and
 * applies `.v2-scope` so theme tokens resolve and Tailwind utilities don't
 * bleed onto legacy pages.
 */
export function ScreenContainer({ className, children }: ScreenContainerProps) {
  return (
    <div className={cn("v2-scope w-full")}>
      <div className={cn("w-full pt-2 pb-8", className)}>
        {children}
      </div>
    </div>
  );
}

export interface ScreenHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}

export function ScreenHeader({ title, description, className }: ScreenHeaderProps) {
  return (
    <header className={cn("space-y-1.5", className)}>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">{title}</h1>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </header>
  );
}

export interface FormFooterProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Action row for multi-step forms.
 *
 * Sticky-pinned to the bottom of the viewport so the Cancel / Continue
 * buttons stay visible while a long form scrolls. When you reach the end of
 * the page (the citizen-home-footer / "Powered by DIGIT" row), sticky
 * releases and the action row sits at its natural position right above the
 * page footer — no overlap, always reachable in one tap.
 *
 * Solid surface + top border so the buttons read clearly over scrolling
 * form content — no glassmorphism.
 */
export function FormFooter({ className, children }: FormFooterProps) {
  return (
    <div
      // Inline styles cover the case where Tailwind utilities haven't
      // recompiled yet AND ensure the surface is opaque in every theme.
      // bottom is offset by the citizen page-footer height so the action
      // row stays parked just above "Powered by DIGIT" and never overlaps
      // it. Page-level scroll behind the row reveals long form content.
      style={{
        position: "sticky",
        bottom: "var(--v2-page-footer-height, 56px)",
        zIndex: 20,
        backgroundColor: "var(--v2-surface-color, var(--color-surface, #ffffff))",
        borderTop: "1px solid var(--color-border, #d6d5d4)",
      }}
      className={cn(
        "mt-6 flex items-center justify-between gap-3 px-4 py-3",
        className
      )}
    >
      {children}
    </div>
  );
}
