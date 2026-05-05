import * as React from "react";
import { cn } from "../../lib/cn";
import { Check } from "lucide-react";

export interface StepperStep {
  /** Stable id for the step. */
  id: string;
  /** Visible title. Kept short for mobile. */
  title: string;
}

export interface StepperProps {
  steps: StepperStep[];
  /** 0-indexed. */
  currentIndex: number;
  className?: string;
}

/**
 * Linear progress indicator across discrete form steps.
 * - On mobile: shows a compact "Step N of M · <title>" line + thin progress bar.
 * - On md+: shows the full chip row with check marks for completed steps.
 *
 * Pure visual — emits no events; the parent flow controls navigation.
 */
export function Stepper({ steps, currentIndex, className }: StepperProps) {
  const total = steps.length;
  const safeIndex = Math.max(0, Math.min(currentIndex, total - 1));
  const current = steps[safeIndex];
  const progress = total <= 1 ? 100 : (safeIndex / (total - 1)) * 100;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Mobile compact — visible up to md */}
      <div className="md:hidden">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Step {safeIndex + 1} of {total}
          </span>
          <span className="text-sm font-medium text-foreground">{current?.title}</span>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={safeIndex + 1}
          />
        </div>
      </div>

      {/* Desktop full chips — hidden on mobile */}
      <ol className="hidden md:flex items-center gap-2">
        {steps.map((step, i) => {
          const isComplete = i < safeIndex;
          const isCurrent = i === safeIndex;
          return (
            <li key={step.id} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  isComplete && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary text-primary",
                  !isComplete && !isCurrent && "border-border text-muted-foreground"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isComplete ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-sm",
                  isCurrent ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
              {i < total - 1 ? (
                <span
                  className={cn(
                    "mx-1 h-px w-6 transition-colors",
                    isComplete ? "bg-primary" : "bg-border"
                  )}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
