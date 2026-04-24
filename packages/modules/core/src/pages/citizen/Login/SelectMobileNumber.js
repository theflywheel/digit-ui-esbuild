import { InputCard, TextBlock, FieldV1, LinkLabel } from "@egovernments/digit-ui-components";
import {
  DEFAULT_MOBILE_MAX_LENGTH,
  DEFAULT_MOBILE_PATTERN,
  DEFAULT_MOBILE_PREFIX,
} from "@egovernments/digit-ui-libraries";
import React, { useMemo, useState } from "react";

const SelectMobileNumber = ({ t, onSelect, mobileNumber, emailId, onMobileChange, onEmailChange, config, canSubmit, validationConfig }) => {
  const [isEmail, setIsEmail] = useState(emailId ? true : false);
  const [error, setError] = useState("");

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const rawPattern = validationConfig?.pattern || DEFAULT_MOBILE_PATTERN;
  const mobileNumberPattern = new RegExp(rawPattern);
  const maxLength = validationConfig?.maxLength || DEFAULT_MOBILE_MAX_LENGTH;
  const prefix = validationConfig?.prefix || DEFAULT_MOBILE_PREFIX;
  const mobileErrorKey = validationConfig?.errorMessage || "ERR_INVALID_MOBILE_NUMBER";

  const isEmailValid = useMemo(() => EMAIL_REGEX.test(emailId), [emailId]);
  const isMobileValid = useMemo(() => mobileNumberPattern.test(mobileNumber || ""), [mobileNumber, mobileNumberPattern]);

  const handleSubmit = () => {
    if (isEmail) {
      if (!isEmailValid) {
        setError(t("ERR_INVALID_EMAIL"));
        return;
      }
      onSelect({ userName: emailId });
    } else {
      if (!isMobileValid) {
        setError(t(mobileErrorKey));
        return;
      }
      onSelect({ mobileNumber });
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setError("");
    if (isEmail) {
      onEmailChange(e)
      if (value && !EMAIL_REGEX.test(value)) setError(t("ERR_INVALID_EMAIL"));
    } else {
      onMobileChange(e);
      if (value && !mobileNumberPattern.test(value)) setError(t(mobileErrorKey));
    }
  };

  const switchMode = () => {
    setIsEmail(!isEmail);
    setError("");
    if (isEmail)
      onEmailChange({ target: { value: "" } });
    else
      onMobileChange({ target: { value: "" } }); // clear mobile input
  };

  const isDisabled = useMemo(() => {
    return isEmail ? !(isEmailValid && canSubmit) : !(isMobileValid && canSubmit);
  }, [isEmail, isEmailValid, isMobileValid, canSubmit]);

  const mobileViewStyles = {
    marginLeft: "0px",
    userSelect: "none",
    color: "inherit",
    cursor: "pointer",      // keeps it clickable
    textDecoration: "underline",
  };

  // Responsive label
  const linkLabel = useMemo(() => {
    if (window.innerWidth <= 768) {
      return isEmail ? t("LOGIN_WITH_MOBILE") : t("LOGIN_WITH_EMAIL");
    }
    return isEmail ? t("CS_USE_MOBILE_INSTEAD") : t("CS_LOGIN_REGISTER_WITH_EMAIL");
  }, [isEmail, t]);

  return (
    <InputCard
      t={t}
      texts={config?.texts}
      submit
      onNext={handleSubmit}
      isDisable={isDisabled}
    >
      <div>
        <FieldV1
          key={isEmail ? "email" : "mobile"}
          withoutLabel
          charCount
          error={error}
          onChange={handleChange}
          placeholder={isEmail ? t("ENTER_EMAIL_PLACEHOLDER") : t("ENTER_MOBILE_PLACEHOLDER")}
          populators={{
            name: isEmail ? "userName" : "mobileNumber",
            prefix: isEmail ? "" : prefix,
            validation: {
              maxlength: isEmail ? 256 : maxLength,
              pattern: isEmail ? EMAIL_REGEX : mobileNumberPattern,
            },
          }}
          props={{ fieldStyle: { width: "100%" } }}
          type="text"
          value={isEmail ? emailId : mobileNumber}
        />
        {!isEmail && !error && (
          // Helper hint so citizens know the expected format before
          // submitting (closes egovernments/CCRS#429). The exact digit
          // count is driven by the MDMS validation record so other
          // tenants render their own minLength.
          <p style={{ marginTop: "4px", fontSize: "0.75rem", color: "#505a5f" }}>
            {t("CS_MOBILE_NUMBER_HELP", {
              defaultValue: `Enter your ${maxLength}-digit mobile number`,
            })}
          </p>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", marginTop: "-24px" }}>
        <LinkLabel style={{ display: "inline", ...mobileViewStyles }} onClick={switchMode}>
          {linkLabel}
        </LinkLabel>
      </div>
    </InputCard>
  );
};

export default SelectMobileNumber;