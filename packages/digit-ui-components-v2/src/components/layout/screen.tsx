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
 * Top-level wrapper for a v2 screen. A flex column whose height fills the
 * available viewport between the topbar and the citizen page footer — that
 * way a sticky/auto-pushed FormFooter inside it parks just above
 * "Powered by DIGIT" without overlap, regardless of how short or long the
 * form content is. The middle child should typically be the scrollable
 * step body (consumer adds `flex-1 overflow-y-auto`).
 */
export function ScreenContainer({ className, children }: ScreenContainerProps) {
  return (
    <div
      className={cn("v2-scope w-full", className)}
      style={{
        display: "flex",
        flexDirection: "column",
        // Fill the parent's remaining height. On PGR pages the parent is
        // `.pgr-citizen-wrapper` (constrained in overrides.css to the
        // available height between topbar and page-footer); ScreenContainer
        // takes whatever is left after the legacy <BackButton> at the top.
        // `min-height: 0` is required for the inner overflow:auto step body
        // to actually scroll when the form runs long.
        flex: "1 1 auto",
        minHeight: 0,
      }}
    >
      {children}
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
 * Designed to sit at the very end of a flex-column ScreenContainer. With
 * `marginTop: auto` on a flex item, the row is pushed to the bottom of the
 * column even when the form above it is short — so Cancel / Continue
 * always show just above the page footer, never floating mid-page.
 *
 * Solid surface + top border so the buttons read clearly over scrolling
 * form content. No glassmorphism, no fixed positioning.
 */
export function FormFooter({ className, children }: FormFooterProps) {
  return (
    <div
      style={{
        marginTop: "auto",
        flexShrink: 0,
        // Transparent surface — sits over whatever the page bg is. The
        // top border still gives visual separation from the form body.
        backgroundColor: "transparent",
        borderTop: "1px solid var(--color-border, #d6d5d4)",
      }}
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-3",
        className
      )}
    >
      {children}
    </div>
  );
}
