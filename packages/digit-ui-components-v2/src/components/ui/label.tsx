import * as React from "react";
import { cn } from "../../lib/cn";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none text-foreground select-none",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    >
      {children}
      {required ? (
        <span
          className="ml-0.5 text-destructive"
          // Inline red as safety net — `text-destructive` resolves through
          // the Tailwind HSL token chain which may not be compiled yet.
          style={{ color: "#dc2626" }}
          aria-hidden
        >
          *
        </span>
      ) : null}
    </label>
  )
);
Label.displayName = "Label";
