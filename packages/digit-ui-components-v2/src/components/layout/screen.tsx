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
  /**
   * Reserve room for the sticky footer (FormFooter) at the bottom.
   * Adds bottom padding equal to the action bar height.
   */
  withFooter?: boolean;
}

/**
 * Top-level wrapper for a v2 screen — applies the v2-scope class so theme
 * tokens resolve and Tailwind utilities don't bleed onto legacy pages.
 * Also constrains the content column for readable line lengths on desktop.
 */
export function ScreenContainer({ className, children, withFooter }: ScreenContainerProps) {
  return (
    <div className={cn("v2-scope min-h-[calc(100vh-56px)] bg-background")}>
      <div
        className={cn(
          "mx-auto w-full max-w-[720px] px-4 pt-6",
          withFooter ? "pb-[120px]" : "pb-8",
          className
        )}
      >
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
 * Sticky action bar for multi-step forms — sits at the bottom of the viewport
 * on mobile, inline at the bottom of the content column on desktop. Add
 * `withFooter` to the parent ScreenContainer so the content reserves space.
 */
export function FormFooter({ className, children }: FormFooterProps) {
  return (
    <div
      className={cn(
        "v2-action-bar fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur",
        "supports-[backdrop-filter]:bg-background/80",
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-[720px] items-center justify-between gap-3 px-4 py-3">
        {children}
      </div>
    </div>
  );
}
