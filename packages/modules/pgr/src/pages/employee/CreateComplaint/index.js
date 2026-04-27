// Nairobi-overhaul Round 2 (R2-C) — CSR Create-on-Behalf wizard rewrite.
//
// Replaces the legacy single-form FormComposer with a step wizard:
//   Step 0: Citizen Lookup     — mobile number → existing citizen / "create new"
//   Step 1: Complaint Type
//   Step 2: Sub-Type
//   Step 3: Location (city + locality)
//   Step 4: Pincode + Landmark
//   Step 5: Photos (placeholder — keeps API parity, photo upload UX is
//           citizen-side scope; we expose a no-op step so CSR can skip)
//   Step 6: Additional Details (description) → SUBMIT
//
// Structure mirrors the citizen 6-step Create wizard at
// `packages/modules/pgr/src/pages/citizen/Create/index.js`, sharing the
// NairobiWizardShell so CSR sees the same chrome the citizen sees, plus a
// small Complainant header strip below the back-strip on every step (so the
// CSR always sees who the complaint is being filed for).
//
// Constraints honoured per docs/nairobi-overhaul/TASKS.md R2-C:
//   - PGR API/payload shapes unchanged. The submit dispatch is byte-identical
//     to the legacy file: build the same `formData` object and call
//     `dispatch(createComplaint(formData))`. The only addition is filling
//     `name` + `mobileNumber` from the lookup step rather than from inline
//     form fields.
//   - No new dependencies. NairobiWizardShell + NairobiButton come from the
//     citizen branch atoms (now merged in).
//   - No MDMS writes. Citizen lookup is read-only via Digit.UserService /
//     mobileNumber search; if no service is wired we fall through to "create
//     new" using the entered mobile number.
//   - Role gating preserved: the CSR-only route registration in PGRCard /
//     RoleBasedEmployeeHome is unchanged. This file is only mounted for CSR.
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { useQueryClient } from "react-query";
import {
  Dropdown,
  TextArea,
  TextInput,
  Toast,
} from "@egovernments/digit-ui-react-components";
import {
  NairobiButton,
  NairobiWizardShell,
} from "@egovernments/digit-ui-components";

import { createComplaint } from "../../../redux/actions/index";

const STEPS = [
  "lookup",
  "type",
  "subType",
  "location",
  "pincode",
  "photos",
  "details",
];

const stepHeader = (key, t) => {
  switch (key) {
    case "lookup":
      return t("ES_CREATECOMPLAINT_CITIZEN_LOOKUP") || "Citizen Lookup";
    case "type":
      return t("CS_ADDCOMPLAINT_COMPLAINT_TYPE_PLACEHOLDER");
    case "subType":
      return t("CS_ADDCOMPLAINT_COMPLAINT_SUBTYPE_PLACEHOLDER");
    case "location":
      return t("CS_ADDCOMPLAINT_PROVIDE_COMPLAINT_ADDRESS");
    case "pincode":
      return t("CS_FILE_APPLICATION_PINCODE_LABEL");
    case "photos":
      return t("CS_ADDCOMPLAINT_UPLOAD_PHOTO");
    case "details":
      return t("CS_ADDCOMPLAINT_PROVIDE_ADDITIONAL_DETAILS");
    default:
      return "";
  }
};

const stepPrimaryLabel = (key, isLast, t) => {
  if (isLast) return t("CS_SUBMIT") || t("CS_ADDCOMPLAINT_ADDITIONAL_DETAILS_SUBMIT_COMPLAINT");
  return t("CS_NEXT") || t("CS_COMMON_NEXT");
};

const useTenants = () => {
  const cities = Digit.Utils.getMultiRootTenant()
    ? Digit.Hooks.useTenants()
    : Digit.Hooks.pgr.useTenants();
  return cities;
};

const CitizenLookupStep = ({ value, onChange, t }) => {
  const [mobile, setMobile] = useState(value?.mobileNumber || "");
  const [name, setName] = useState(value?.name || "");
  const [searchHint, setSearchHint] = useState(null);

  const onLookup = async () => {
    setSearchHint(null);
    if (!/^\d{7,15}$/.test(mobile)) {
      setSearchHint({ kind: "error", text: t("CS_ADDCOMPLAINT_MOBILE_INVALID") || "Enter a valid mobile number" });
      return;
    }
    try {
      // Best-effort lookup: many tenants expose UserSearch by mobileNumber.
      // We don't fail the wizard if it returns nothing — the CSR can still
      // proceed with a "create new" complainant using the typed name + mobile.
      const tenantId = Digit.ULBService.getStateId();
      const search =
        (typeof Digit?.UserService?.userSearch === "function"
          ? await Digit.UserService.userSearch(tenantId, { mobileNumber: mobile, userType: "CITIZEN" })
          : null);
      const matched = search?.user?.[0] || null;
      if (matched?.name) {
        setName(matched.name);
        setSearchHint({ kind: "ok", text: t("CS_CITIZEN_FOUND") || "Citizen found" });
        onChange({ mobileNumber: mobile, name: matched.name, citizenUuid: matched.uuid || null });
        return;
      }
      setSearchHint({ kind: "info", text: t("CS_CREATE_NEW_CITIZEN") || "No citizen found — fill name to create new" });
    } catch (e) {
      setSearchHint({ kind: "info", text: t("CS_CREATE_NEW_CITIZEN") || "No citizen found — fill name to create new" });
    }
  };

  useEffect(() => {
    onChange({ mobileNumber: mobile, name });
  }, [mobile, name]);

  return (
    <div className="nairobi-emp-step nairobi-emp-step--lookup">
      <label className="nairobi-emp-field">
        <span className="nairobi-emp-field__label">{t("ES_CREATECOMPLAINT_MOBILE_NUMBER")}</span>
        <div className="nairobi-emp-field__row">
          <TextInput
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            name="mobileNumber"
          />
          <NairobiButton variant="tertiary" size="md" onClick={onLookup}>
            {t("CS_COMMON_SEARCH") || "Search"}
          </NairobiButton>
        </div>
      </label>
      <label className="nairobi-emp-field">
        <span className="nairobi-emp-field__label">{t("ES_CREATECOMPLAINT_COMPLAINT_NAME")}</span>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} name="name" />
      </label>
      {searchHint && (
        <p className={`nairobi-emp-hint nairobi-emp-hint--${searchHint.kind}`}>
          {searchHint.text}
        </p>
      )}
    </div>
  );
};

const TypeStep = ({ value, onChange, t }) => {
  const tenantId = window.Digit.SessionStorage.get("Employee.tenantId");
  const menu = Digit.Hooks.pgr.useComplaintTypes({ stateCode: tenantId }) || [];
  return (
    <div className="nairobi-emp-step">
      <label className="nairobi-emp-field">
        <span className="nairobi-emp-field__label">
          {t("CS_COMPLAINT_DETAILS_COMPLAINT_TYPE")}
        </span>
        <Dropdown
          option={menu}
          optionKey="name"
          id="complaintType"
          selected={value?.complaintType || {}}
          select={(v) => onChange({ complaintType: v, subType: {} })}
          t={t}
        />
      </label>
    </div>
  );
};

const SubTypeStep = ({ value, onChange, t }) => {
  const [subTypeMenu, setSubTypeMenu] = useState([]);
  const serviceDefinitions = Digit.GetServiceDefinitions;
  const tenantId = window.Digit.SessionStorage.get("Employee.tenantId");

  useEffect(() => {
    (async () => {
      const ct = value?.complaintType;
      if (!ct?.key) return;
      if (ct.key === "Others") {
        setSubTypeMenu([{ key: "Others", name: t("SERVICEDEFS.OTHERS") }]);
      } else if (typeof serviceDefinitions?.getSubMenu === "function") {
        const menu = await serviceDefinitions.getSubMenu(tenantId, ct, t);
        setSubTypeMenu(menu || []);
      }
    })();
  }, [value?.complaintType?.key]);

  return (
    <div className="nairobi-emp-step">
      <label className="nairobi-emp-field">
        <span className="nairobi-emp-field__label">
          {t("CS_COMPLAINT_DETAILS_COMPLAINT_SUBTYPE")}
        </span>
        <Dropdown
          option={subTypeMenu}
          optionKey="name"
          id="complaintSubType"
          selected={value?.subType || {}}
          select={(v) => onChange({ subType: v })}
          t={t}
        />
      </label>
    </div>
  );
};

const LocationStep = ({ value, onChange, t, getCities, fetchedLocalities }) => {
  const cities = getCities() || [];
  return (
    <div className="nairobi-emp-step">
      <label className="nairobi-emp-field">
        <span className="nairobi-emp-field__label">{t("CS_COMPLAINT_DETAILS_CITY")}</span>
        <Dropdown
          option={cities}
          optionKey="i18nKey"
          id="city"
          selected={value?.selectedCity || cities[0] || null}
          freeze
          select={(v) => onChange({ selectedCity: v })}
          t={t}
        />
      </label>
      <label className="nairobi-emp-field">
        <span className="nairobi-emp-field__label">{t("CS_CREATECOMPLAINT_MOHALLA")}</span>
        <Dropdown
          option={fetchedLocalities || []}
          optionKey="i18nkey"
          id="locality"
          selected={value?.selectedLocality || null}
          select={(v) => onChange({ selectedLocality: v })}
          t={t}
        />
      </label>
    </div>
  );
};

const PincodeStep = ({ value, onChange, t }) => (
  <div className="nairobi-emp-step">
    <label className="nairobi-emp-field">
      <span className="nairobi-emp-field__label">{t("CORE_COMMON_PINCODE")}</span>
      <TextInput
        value={value?.pincode || ""}
        onChange={(e) => onChange({ pincode: e.target.value })}
        name="pincode"
      />
    </label>
    <label className="nairobi-emp-field">
      <span className="nairobi-emp-field__label">{t("CS_COMPLAINT_DETAILS_LANDMARK")}</span>
      <TextArea
        value={value?.landmark || ""}
        onChange={(e) => onChange({ landmark: e.target.value })}
        name="landmark"
      />
    </label>
  </div>
);

const PhotosStep = ({ t }) => (
  <div className="nairobi-emp-step nairobi-emp-step--photos">
    <p className="nairobi-emp-hint nairobi-emp-hint--info">
      {t("ES_CREATE_PHOTOS_HINT") ||
        "Photos can be uploaded by the citizen later from their account. Skip if not available."}
    </p>
  </div>
);

const DetailsStep = ({ value, onChange, t }) => (
  <div className="nairobi-emp-step">
    <label className="nairobi-emp-field">
      <span className="nairobi-emp-field__label">
        {t("CS_COMPLAINT_DETAILS_ADDITIONAL_DETAILS")}
      </span>
      <TextArea
        value={value?.description || ""}
        onChange={(e) => onChange({ description: e.target.value })}
        name="description"
      />
    </label>
  </div>
);

export const CreateComplaint = ({ parentUrl }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const history = useHistory();
  const client = useQueryClient();
  const [stepIdx, setStepIdx] = useState(0);
  const [params, setParams] = useState({});
  const [showToast, setShowToast] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const { data: cities } = useTenants();
  const getCities = () =>
    Digit.Utils.getMultiRootTenant()
      ? cities
      : cities?.filter((e) => e.code === Digit.ULBService.getCurrentTenantId()) || [];

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
  const stateIdForLocality = Digit.Utils.getMultiRootTenant()
    ? Digit.ULBService.getStateId()
    : getCities()?.[0]?.code;
  const { data: fetchedLocalities } = Digit.Hooks.useBoundaryLocalities(
    stateIdForLocality,
    hierarchyType,
    {
      enabled: Digit.Utils.getMultiRootTenant() ? !!hierarchyType : !!getCities()?.[0],
    },
    t
  );

  const updateParams = (patch) => setParams((prev) => ({ ...prev, ...patch }));

  const stepKey = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;

  const canProceed = useMemo(() => {
    switch (stepKey) {
      case "lookup":
        return !!params.mobileNumber && /^\d{7,15}$/.test(params.mobileNumber) && !!params.name;
      case "type":
        return !!params.complaintType?.key;
      case "subType":
        return !!params.subType?.key;
      case "location":
        return !!(params.selectedCity?.code && params.selectedLocality?.code);
      case "pincode":
        return true; // pincode + landmark optional in this scope
      case "photos":
        return true;
      case "details":
        return true;
      default:
        return false;
    }
  }, [stepKey, params]);

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(null), 2000);
    return () => clearTimeout(timer);
  }, [showToast]);

  const onSubmit = async () => {
    if (submitted) return;
    if (!params.complaintType?.key) {
      setShowToast({ key: "error", label: "TYPE_MISSING_ERROR" });
      return;
    }
    if (!params.subType?.key) {
      setShowToast({ key: "error", label: "TYPE_MISSING_ERROR" });
      return;
    }
    if (!params.selectedCity?.code) {
      setShowToast({ key: "error", label: "CITY_MISSING_ERROR" });
      return;
    }
    if (!params.selectedLocality?.code) {
      setShowToast({ key: "error", label: "LOCALITY_MISSING_ERROR" });
      return;
    }
    setSubmitted(true);
    const cityCode = Digit.Utils.getMultiRootTenant()
      ? Digit.ULBService.getStateId()
      : params.selectedCity.code;
    const city = Digit.Utils.getMultiRootTenant()
      ? params.selectedCity.name
      : params.selectedCity.city?.name || params.selectedCity.name;
    const district = city;
    const region = city;
    const localityCode = params.selectedLocality.code;
    const localityName = params.selectedLocality.name;
    const formData = {
      cityCode,
      city,
      district,
      region,
      localityCode,
      localityName,
      landmark: params.landmark || "",
      pincode: params.pincode || "",
      description: params.description || "",
      complaintType: params.subType.key,
      mobileNumber: params.mobileNumber,
      name: params.name,
    };
    await dispatch(createComplaint(formData));
    await client.refetchQueries(["fetchInboxData"]);
    history.push(parentUrl + "/response");
  };

  const onPrimary = () => {
    if (isLast) {
      onSubmit();
      return;
    }
    setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const onBack = () => {
    if (stepIdx === 0) {
      history.goBack();
      return;
    }
    setStepIdx((i) => Math.max(0, i - 1));
  };

  const renderStep = () => {
    switch (stepKey) {
      case "lookup":
        return <CitizenLookupStep value={params} onChange={updateParams} t={t} />;
      case "type":
        return <TypeStep value={params} onChange={updateParams} t={t} />;
      case "subType":
        return <SubTypeStep value={params} onChange={updateParams} t={t} />;
      case "location":
        return (
          <LocationStep
            value={params}
            onChange={updateParams}
            t={t}
            getCities={getCities}
            fetchedLocalities={fetchedLocalities}
          />
        );
      case "pincode":
        return <PincodeStep value={params} onChange={updateParams} t={t} />;
      case "photos":
        return <PhotosStep t={t} />;
      case "details":
        return <DetailsStep value={params} onChange={updateParams} t={t} />;
      default:
        return null;
    }
  };

  const stepTitle = stepHeader(stepKey, t);
  const topBarTitle = t("ES_CREATECOMPLAINT_NEW_COMPLAINT");
  const primaryLabel = stepPrimaryLabel(stepKey, isLast, t);

  // Complainant header strip below the wizard back-strip — gives the CSR
  // running context across every step about who they are filing for.
  const complainantSummary =
    params.mobileNumber || params.name
      ? `${params.name || ""}${params.mobileNumber ? ` · ${params.mobileNumber}` : ""}`
      : null;

  return (
    <>
      <NairobiWizardShell
        topBarTitle={topBarTitle}
        stepTitle={stepTitle}
        onBack={onBack}
        primaryAction={{
          label: primaryLabel,
          onClick: onPrimary,
          disabled: !canProceed || submitted,
          type: "button",
        }}
      >
        {complainantSummary && stepKey !== "lookup" && (
          <div className="nairobi-emp-create__complainant" role="status">
            <span className="nairobi-emp-create__complainant-label">
              {t("ES_CREATECOMPLAINT_FILING_FOR") || "Filing for"}:
            </span>
            <span className="nairobi-emp-create__complainant-value">
              {complainantSummary}
            </span>
          </div>
        )}
        <div className="nairobi-emp-create__step">
          <div className="nairobi-emp-create__step-counter">
            {`${stepIdx + 1} / ${STEPS.length}`}
          </div>
          {renderStep()}
        </div>
      </NairobiWizardShell>
      {showToast && (
        <Toast error={showToast.key} type={showToast.key} label={showToast.label} />
      )}
    </>
  );
};
