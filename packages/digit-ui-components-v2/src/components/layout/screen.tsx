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
 * Inline action row for forms — sits at the end of the form card content,
 * matching legacy layout. No backdrop, no fixed positioning — keeps the form
 * feeling native to the parent page.
 */
export function FormFooter({ className, children }: FormFooterProps) {
  return (
    <div
      className={cn(
        "mt-6 flex items-center justify-between gap-3 border-t border-border pt-4",
        className
      )}
    >
      {children}
    </div>
  );
}
