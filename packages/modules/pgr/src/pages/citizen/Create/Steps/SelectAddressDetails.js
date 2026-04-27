import React, { useEffect, useState } from "react";
import {
  CardLabel,
  CardLabelError,
  Dropdown,
  FormStep,
  RadioButtons,
  TextArea,
  TextInput,
} from "@egovernments/digit-ui-react-components";

/**
 * SelectAddressDetails — Step 4 of the citizen Create flow.
 *
 * Collapses the legacy `pincode`, `address` and `landmark` routes into a
 * single screen, matching the Figma "Provide Complainant Address" step.
 * See DECISIONS.md D-001 in the nairobi-overhaul docs.
 *
 * Field groups (top to bottom):
 *   1. Pincode (optional text input, optional servicability hint).
 *   2. City + Locality (dropdown / radio, locality required to proceed).
 *   3. Landmark (optional textarea).
 *
 * The component stays a single FormComposer step (one <form>, one
 * SubmitBar) so the wizard's URL-based step machinery keeps working.
 */
const SelectAddressDetails = ({ t, config, onSelect, onSkip, value }) => {
  const language = JSON.parse(sessionStorage.getItem("Digit.locale"))?.value;
  const isMultiRoot = Digit.Utils.getMultiRootTenant();

  // ----- Pincode state ---------------------------------------------------
  const [pincode, setPincode] = useState(value?.pincode || "");
  const [pincodeServicability, setPincodeServicability] = useState(null);

  // ----- City + locality state ------------------------------------------
  const { data: allCities } = isMultiRoot ? Digit.Hooks.useTenants() : Digit.Hooks.pgr.useTenants();
  const tenants = Digit.Hooks.pgr.useTenants();
  const cities = pincode ? (allCities || []).filter((city) => city?.pincode?.some((pin) => pin == pincode)) : allCities || [];

  const [selectedCity, setSelectedCity] = useState(() => {
    const { city_complaint } = value || {};
    if (city_complaint) return city_complaint;
    return cities?.length === 1 ? cities[0] : null;
  });

  const { data: hierarchyType } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "sandbox-ui",
    [
      {
        name: "ModuleMasterConfig",
        filter: '[?(@.module == "PGR")].master[?(@.type == "boundary")]',
      },
    ],
    {
      select: (data) => {
        const formattedData = data?.["sandbox-ui"]?.["ModuleMasterConfig"];
        return formattedData?.[0]?.code;
      },
    }
  );

  const stateId = isMultiRoot ? Digit.ULBService.getStateId() : selectedCity?.code;
  const { data: fetchedLocalities } = Digit.Hooks.useBoundaryLocalities(
    stateId,
    isMultiRoot ? hierarchyType : "admin",
    {
      enabled: isMultiRoot ? !!selectedCity && !!hierarchyType : !!selectedCity,
    },
    t,
    language
  );

  const [localities, setLocalities] = useState(null);
  const [selectedLocality, setSelectedLocality] = useState(() => value?.locality_complaint || null);

  useEffect(() => {
    if (selectedCity && fetchedLocalities) {
      const list = pincode ? fetchedLocalities.filter((l) => l["pincode"] == pincode) : fetchedLocalities;
      setLocalities(list);
    }
  }, [selectedCity, fetchedLocalities, pincode]);

  // ----- Landmark state -------------------------------------------------
  const [landmark, setLandmark] = useState(value?.landmark || "");

  // ----- Field handlers -------------------------------------------------
  const onPincodeChange = (e) => {
    const next = e.target.value;
    setPincode(next);
    setPincodeServicability(null);
    // Pincode change invalidates a previously chosen city/locality only if
    // they no longer match — keep the state simple and let the user
    // re-select if needed.
    if (selectedCity && next && !selectedCity?.pincode?.some((pin) => pin == next)) {
      setSelectedCity(null);
      setSelectedLocality(null);
      setLocalities(null);
    }
  };

  const onCityChange = (city) => {
    setSelectedLocality(null);
    setLocalities(null);
    setSelectedCity(city);
  };

  const onLocalityChange = (locality) => {
    setSelectedLocality(locality);
  };

  const onLandmarkChange = (e) => {
    setLandmark(e.target.value);
  };

  // Submit advances to the next step (upload-photos). Locality is the
  // only hard requirement, mirroring the legacy `address` step's gate.
  const isDisabled = selectedLocality ? false : true;

  const onFormSubmit = () => {
    // Pincode servicability: if a pincode is provided, prefer the tenant
    // matched against it; if it doesn't map to any tenant, surface the
    // legacy "not servicable" error instead of advancing.
    let cityForSubmit = selectedCity;
    if (pincode) {
      const tenantByPincode = (tenants || []).find((obj) => obj.pincode?.find((item) => item == pincode));
      if (tenantByPincode) {
        Digit.SessionStorage.set("city_complaint", tenantByPincode);
        cityForSubmit = tenantByPincode;
      } else {
        Digit.SessionStorage.set("city_complaint", undefined);
        Digit.SessionStorage.set("selected_localities", undefined);
        setPincodeServicability("CS_COMMON_PINCODE_NOT_SERVICABLE");
        return;
      }
    }

    onSelect({
      pincode,
      city_complaint: cityForSubmit,
      locality_complaint: selectedLocality,
      landmark,
    });
  };

  const onFormSkip = () => {
    if (typeof onSkip === "function") onSkip();
  };

  // FormStep renders the SubmitBar / Skip link from `config.texts`. We
  // disable the inline-input rendering by leaving `config.inputs`
  // untouched here — all fields are rendered as `children` so we keep
  // a single <form> wrapper and a single SubmitBar.
  const composedConfig = {
    ...config,
    inputs: undefined,
  };

  return (
    <FormStep
      t={t}
      config={composedConfig}
      onSelect={onFormSubmit}
      onSkip={onFormSkip}
      isDisabled={isDisabled}
      forcedError={t(pincodeServicability)}
    >
      <div>
        {/* --- Pincode field group --- */}
        <CardLabel>{t("CORE_COMMON_PINCODE")}</CardLabel>
        <div className="field-container" style={{ justifyContent: "left" }}>
          <TextInput
            name="pincode"
            value={pincode}
            onChange={onPincodeChange}
            minlength={6}
            maxlength={7}
          />
        </div>

        {/* --- City + Locality field group --- */}
        <CardLabel>{t("MYCITY_CODE_LABEL")}</CardLabel>
        {cities?.length < 5 ? (
          <RadioButtons
            selectedOption={selectedCity}
            options={cities}
            optionsKey={"i18nKey"}
            onSelect={onCityChange}
          />
        ) : (
          <Dropdown
            isMandatory
            selected={selectedCity}
            option={cities}
            select={onCityChange}
            optionKey={"i18nKey"}
            t={t}
          />
        )}
        {selectedCity && localities && <CardLabel>{t("CS_CREATECOMPLAINT_MOHALLA")}</CardLabel>}
        {selectedCity && localities && (
          <React.Fragment>
            {localities?.length < 5 ? (
              <RadioButtons
                selectedOption={selectedLocality}
                options={localities}
                optionsKey="i18nkey"
                onSelect={onLocalityChange}
              />
            ) : (
              <Dropdown
                isMandatory
                selected={selectedLocality}
                optionKey="i18nkey"
                option={localities}
                select={onLocalityChange}
                t={t}
              />
            )}
          </React.Fragment>
        )}

        {/* --- Landmark field group --- */}
        <CardLabel>{t("CS_ADDCOMPLAINT_LANDMARK")}</CardLabel>
        <TextArea
          name="landmark"
          value={landmark}
          onChange={onLandmarkChange}
          maxLength="1024"
        />
      </div>
    </FormStep>
  );
};

export default SelectAddressDetails;
