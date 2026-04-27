import { CardText, CardLabelError, FormStep } from "@egovernments/digit-ui-components";
import React, { Fragment, useState } from "react";
import useInterval from "../../../hooks/useInterval";
import { OTPInput } from "@egovernments/digit-ui-react-components";
import {
  NairobiTopBar,
  NairobiOtpCountdownPill,
} from "@egovernments/digit-ui-components";

/**
 * Citizen OTP verification — Phase 7 (R2-B) visual rewrite.
 *
 * Per DECISIONS.md D-002 the rewrite is COSMETIC ONLY:
 *   - The existing FormStep / OTPInput / onResend / onSelect / canSubmit
 *     plumbing is preserved verbatim — submit, validation and resend
 *     callbacks all stay wired to the parent Login flow.
 *   - The countdown pill is the published <NairobiOtpCountdownPill>
 *     atom (D-002 cosmetic timer); it ticks client-side and fires
 *     `onResend` when the user clicks Resend, exactly mirroring the
 *     legacy `handleResendOtp` behavior.
 *   - The legacy fallback timer (`useInterval` + `timeLeft`) is kept
 *     so the EMPLOYEE branch retains its original behavior unchanged
 *     (employees still see the 30s `CS_RESEND_ANOTHER_OTP` text).
 *
 * Citizen branch additions:
 *   - <NairobiTopBar> at the top with no menu / bell handlers and a
 *     zero unread count, since the user is mid-auth and should not
 *     see app-level navigation affordances yet.
 *   - "Verify your number" heading (Inter 24/32 semibold) per
 *     LOVABLE-PROMPT §8 and screens.json `Auth / OTP Verification`.
 *   - Subtext from `config.texts.cardText` so existing localization
 *     keys (CS_LOGIN_OTP_TEXT) flow through.
 *   - <NairobiOtpCountdownPill> right-aligned under the OTP slots.
 *
 * Auth logic: NOT touched. The submit button still flows through the
 * existing FormStep, which the parent uses to dispatch `selectOtp`.
 */
const SelectOtp = ({ config, otp, onOtpChange, onResend, onSelect, t, error, userType = "citizen", canSubmit }) => {
  const [timeLeft, setTimeLeft] = useState(30);

  useInterval(
    () => {
      setTimeLeft(timeLeft - 1);
    },
    timeLeft > 0 ? 1000 : null
  );

  const handleResendOtp = () => {
    onResend();
    setTimeLeft(2);
  };

  if (userType === "employee") {
    return (
      <Fragment>
        <OTPInput length={6} onChange={onOtpChange} value={otp} />
        {timeLeft > 0 ? (
          <CardText>{`${t("CS_RESEND_ANOTHER_OTP")} ${timeLeft} ${t("CS_RESEND_SECONDS")}`}</CardText>
        ) : (
          <p className="card-text-button resend-otp" onClick={handleResendOtp}>
            {t("CS_RESEND_OTP")}
          </p>
        )}
        {!error && <CardLabelError>{t("CS_INVALID_OTP")}</CardLabelError>}
      </Fragment>
    );
  }

  const headingText = t("CS_LOGIN_OTP_HEADER") || "Verify your number";
  const subtext = config?.texts?.cardText || "";

  return (
    <div className="nairobi-otp-screen">
      <NairobiTopBar unreadCount={0} />
      <main className="nairobi-otp-screen__body">
        <h1 className="nairobi-otp-screen__heading">{headingText}</h1>
        {subtext && <p className="nairobi-otp-screen__subtext">{subtext}</p>}

        <FormStep onSelect={onSelect} config={config} t={t} isDisabled={!(otp?.length === 6 && canSubmit)}>
          <div className="nairobi-otp-screen__slots">
            <OTPInput length={6} onChange={onOtpChange} value={otp} />
          </div>
          <div className="nairobi-otp-screen__pill-row">
            <NairobiOtpCountdownPill initialSeconds={60} onResend={handleResendOtp} />
          </div>
          {!error && <CardLabelError>{t("CS_INVALID_OTP")}</CardLabelError>}
        </FormStep>
      </main>
    </div>
  );
};

export default SelectOtp;
