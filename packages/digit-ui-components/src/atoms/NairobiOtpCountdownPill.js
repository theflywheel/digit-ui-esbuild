import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";

/**
 * OTP countdown pill — citizen login screen.
 *
 * Cosmetic only. No real timer or verification per DECISIONS.md D-002 —
 * the existing OTP flow doesn't actually verify against a service or
 * count down server-side. This component decrements client-side,
 * reaches 0, switches to a "Resend" link. Clicking Resend invokes the
 * onResend callback (if provided) and resets the countdown locally.
 *
 * Visual spec from Figma (`Auth / OTP Verification` — Android frame
 * inside page 80555:2039). Pill shape (90px radius), pale yellow card
 * background `#FFF4D6` with a 1px black border, Inter 500/12.
 */
const NairobiOtpCountdownPill = ({
  initialSeconds = 60,
  onResend,
  resendLabel = "Resend",
  prefixLabel = "Resend in",
  className = "",
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return undefined;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [secondsLeft]);

  const handleResend = () => {
    if (typeof onResend === "function") onResend();
    setSecondsLeft(initialSeconds);
  };

  const isExpired = secondsLeft === 0;
  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const cls = [
    "nairobi-otp-pill",
    isExpired ? "nairobi-otp-pill--ready" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={cls} role="status" aria-live="polite">
      {isExpired ? (
        <button
          type="button"
          className="nairobi-otp-pill__resend-btn"
          onClick={handleResend}
        >
          {resendLabel}
        </button>
      ) : (
        <span className="nairobi-otp-pill__waiting">
          {prefixLabel} {mm}:{ss}
        </span>
      )}
    </span>
  );
};

NairobiOtpCountdownPill.propTypes = {
  initialSeconds: PropTypes.number,
  onResend: PropTypes.func,
  resendLabel: PropTypes.string,
  prefixLabel: PropTypes.string,
  className: PropTypes.string,
};

export default NairobiOtpCountdownPill;
