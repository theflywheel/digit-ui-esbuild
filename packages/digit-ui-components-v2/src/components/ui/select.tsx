import * as React from "react";
import { cn } from "../../lib/cn";
import { ChevronDown } from "lucide-react";

export interface SelectOption<TValue extends string = string> {
  value: TValue;
  label: string;
  disabled?: boolean;
}

export interface SelectProps<TValue extends string = string>
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> {
  value?: TValue;
  onValueChange?: (value: TValue) => void;
  options: SelectOption<TValue>[];
  placeholder?: string;
  invalid?: boolean;
}

/**
 * Native select wrapped for Tailwind styling. Uses the platform select picker
 * — best for mobile (system picker UX), and the markup is accessible by default.
 * For richer combobox UX a Radix-based version can ship later under a different name.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, value, onValueChange, options, placeholder, invalid, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          value={value ?? ""}
          onChange={(e) => onValueChange?.(e.target.value)}
          aria-invalid={invalid || undefined}
          className={cn(
            "flex h-11 w-full appearance-none rounded-md border border-input bg-background pl-3 pr-9 py-2 text-base shadow-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:border-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            invalid && "border-destructive focus-visible:ring-destructive",
            !value && "text-muted-foreground",
            className
          )}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          ) : null}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
      </div>
    );
  }
) as <TValue extends string = string>(
  props: SelectProps<TValue> & { ref?: React.Ref<HTMLSelectElement> }
) => React.ReactElement;
