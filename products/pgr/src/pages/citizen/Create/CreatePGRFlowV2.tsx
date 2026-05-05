/* eslint-disable @typescript-eslint/no-explicit-any */
// Citizen file-complaint flow — v2 (Tailwind + shadcn-style chrome).
//
// This is a strangler-fig replacement for the FormExplorer.js + steps-config/*
// + FormComposerV2 stack. The same 6-step shape is preserved so:
//   - the data shape submitted to /pgr/v1/_create is byte-identical
//   - the boundary, geolocation, and image-upload behaviour stays in the
//     existing components (PGRBoundaryComponent, GeoLocations, SelectImages),
//     just rendered inside v2 chrome
//   - server-side, redux, and post-submit response page see no change
//
// What changes vs FormExplorer:
//   - Tailwind / v2 components throughout the chrome (Stepper, ScreenContainer,
//     FormFooter, Card, Button, Field, RadioCards, Select, Textarea).
//   - Step 1 uses RadioCards for complaint type + sub-type instead of a tiny
//     Dropdown — much better mobile tap targets.
//   - Sticky action bar with Continue/Back, mobile-first layout.
//   - State managed locally via React hooks — no FormComposerV2 / hidden
//     react-hook-form coupling.

import * as React from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { useQueryClient } from "react-query";

import {
  ScreenContainer,
  ScreenHeader,
  FormFooter,
  BackLink,
  Stepper,
  Button,
  Card,
  Field,
  Textarea,
  Input,
  RadioCards,
  Select,
} from "@egovernments/digit-ui-components-v2";

declare const Digit: any;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ServiceDef {
  serviceCode: string;
  menuPath: string;
  menuPathName?: string;
  name?: string;
  department?: string;
  order?: number;
}

interface BoundaryNode {
  code?: string;
  children?: unknown[];
  [key: string]: unknown;
}

interface GeoPoint {
  lat?: number | null;
  lng?: number | null;
  ward?: { code?: string } | null;
  pincode?: string | number | null;
}

interface FormData {
  SelectComplaintType?: ServiceDef | null;
  SelectSubComplaintType?: ServiceDef | null;
  GeoLocationsPoint?: GeoPoint | null;
  landmark?: string;
  postalCode?: string;
  SelectedBoundary?: BoundaryNode | null;
  description?: string;
  ComplaintImagesPoint?: string[]; // fileStoreIds
}

interface StepShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const STEPS = [
  { id: "type", title: "Complaint" },
  { id: "map", title: "Pin location" },
  { id: "address", title: "Address" },
  { id: "ward", title: "Ward" },
  { id: "details", title: "Details" },
  { id: "photos", title: "Photos" },
] as const;

// ---------------------------------------------------------------------------
// Helpers (kept identical to the legacy FormExplorer so the API payload
// shape is preserved byte-for-byte)
// ---------------------------------------------------------------------------

function validateString(v: unknown): string {
  return typeof v === "string" && v.trim().length > 0 ? v : "";
}

function validateGeoLocation(v: { latitude?: number | null; longitude?: number | null }) {
  if (
    v &&
    typeof v.latitude === "number" &&
    typeof v.longitude === "number"
  ) {
    return { latitude: v.latitude, longitude: v.longitude };
  }
  return {};
}

function getEffectiveServiceCode(
  mainType: ServiceDef | null | undefined,
  subType: ServiceDef | null | undefined
): string | undefined {
  if (
    subType &&
    mainType &&
    subType.department === mainType.department &&
    subType.menuPath === mainType.menuPath &&
    subType.serviceCode !== mainType.serviceCode
  ) {
    return subType.serviceCode;
  }
  return mainType?.serviceCode;
}

function mapFormDataToRequest(formData: FormData, tenantId: string, user: any) {
  const timestamp = Date.now();
  const userInfo = user;
  const additionalDetail = {};
  const geoLocation = formData?.GeoLocationsPoint || { lat: null, lng: null };
  return {
    service: {
      active: true,
      tenantId,
      serviceCode: getEffectiveServiceCode(
        formData?.SelectComplaintType,
        formData?.SelectSubComplaintType
      ),
      description: formData?.description || "",
      applicationStatus: "CREATED",
      source: "web",
      citizen: userInfo,
      isDeleted: false,
      rowVersion: 1,
      address: {
        landmark: validateString(formData?.landmark),
        buildingName: "",
        street: "",
        pincode: validateString(formData?.postalCode),
        locality: {
          code:
            formData?.GeoLocationsPoint?.ward?.code ||
            formData?.SelectedBoundary?.code ||
            "",
        },
        geoLocation: validateGeoLocation({
          latitude: geoLocation.lat ?? null,
          longitude: geoLocation.lng ?? null,
        }),
      },
      additionalDetail: JSON.stringify(additionalDetail),
      auditDetails: {
        createdBy: user?.uuid,
        createdTime: timestamp,
        lastModifiedBy: user?.uuid,
        lastModifiedTime: timestamp,
      },
    },
    workflow: {
      action: "APPLY",
      verificationDocuments: Array.isArray(formData?.ComplaintImagesPoint)
        ? formData.ComplaintImagesPoint.map((image) => ({
            documentType: "PHOTO",
            fileStoreId: image,
            documentUid: "",
            additionalDetails: {},
          }))
        : [],
    },
  };
}

function isFieldValid(data: FormData, fieldKey: keyof FormData | string): boolean {
  switch (fieldKey) {
    case "ComplaintImagesPoint":
      return Array.isArray(data.ComplaintImagesPoint) && data.ComplaintImagesPoint.length > 0;
    case "SelectedBoundary": {
      const sb = data.SelectedBoundary;
      if (sb?.code) {
        // Must be a leaf (no children) — mirrors the citizen-side fix in
        // FormExplorer (egovernments/CCRS#478).
        return !Array.isArray(sb.children) || sb.children.length === 0;
      }
      return false;
    }
    case "description":
      return typeof data.description === "string" && data.description.trim().length > 0;
    case "SelectComplaintType":
      return data.SelectComplaintType != null;
    case "GeoLocationsPoint":
      return data.GeoLocationsPoint?.lat != null && data.GeoLocationsPoint?.lng != null;
    default:
      return (data as Record<string, unknown>)[fieldKey as string] != null;
  }
}

// Mandatory fields per step (zero-indexed).
const MANDATORY_BY_STEP: ReadonlyArray<ReadonlyArray<keyof FormData>> = [
  ["SelectComplaintType"], // 0 — type (sub-type can be optional if no children)
  [], // 1 — map (optional, can skip)
  [], // 2 — landmark + postal code (optional)
  ["SelectedBoundary"], // 3 — ward
  ["description"], // 4 — description
  [], // 5 — photos (optional)
];

// ---------------------------------------------------------------------------
// Sub-step bodies
// ---------------------------------------------------------------------------

function StepShell({ title, description, children }: StepShellProps) {
  return (
    <Card className="p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </Card>
  );
}

interface StepBodyProps {
  data: FormData;
  patch: (partial: Partial<FormData>) => void;
  serviceDefs: ServiceDef[];
  t: (key: string) => string;
}

function Step0Type({ data, patch, serviceDefs, t }: StepBodyProps) {
  // Unique main types by menuPath
  const types = React.useMemo(() => {
    const seen = new Set<string>();
    return serviceDefs
      .filter((s) => {
        if (!s.menuPath || seen.has(s.menuPath)) return false;
        seen.add(s.menuPath);
        return true;
      })
      .map((s) => ({
        ...s,
        menuPathName: t("SERVICEDEFS." + s.menuPath.toUpperCase()),
      }));
  }, [serviceDefs, t]);

  const subTypes = React.useMemo(() => {
    const mp = data.SelectComplaintType?.menuPath;
    if (!mp) return [];
    return serviceDefs
      .filter((s) => s.menuPath === mp)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [data.SelectComplaintType?.menuPath, serviceDefs]);

  return (
    <StepShell
      title={t("CS_COMPLAINT_DETAILS_COMPLAINT_DETAILS")}
      description={t("CS_COMPLAINT_PICK_TYPE_HINT")}
    >
      <div className="space-y-6">
        <Field label={t("CS_COMPLAINT_DETAILS_COMPLAINT_TYPE")} required>
          <RadioCards<string>
            name="complaint-type"
            value={data.SelectComplaintType?.menuPath}
            onValueChange={(value) => {
              const picked = types.find((tp) => tp.menuPath === value);
              patch({ SelectComplaintType: picked, SelectSubComplaintType: null });
            }}
            options={types.map((tp) => ({
              value: tp.menuPath,
              label: tp.menuPathName ?? tp.menuPath,
            }))}
          />
        </Field>
        {subTypes.length > 0 ? (
          <Field
            label={t("CS_COMPLAINT_DETAILS_COMPLAINT_SUBTYPE")}
            required
            htmlFor="complaint-subtype"
          >
            <Select
              id="complaint-subtype"
              value={data.SelectSubComplaintType?.serviceCode}
              onValueChange={(value: string) => {
                const picked = subTypes.find((s) => s.serviceCode === value);
                patch({ SelectSubComplaintType: picked });
              }}
              placeholder={t("CS_COMPLAINT_PICK_SUBTYPE")}
              options={subTypes.map((s) => ({
                value: s.serviceCode,
                label: s.name ? t(s.name) : s.serviceCode,
              }))}
            />
          </Field>
        ) : null}
      </div>
    </StepShell>
  );
}

function Step1Map({ data, patch, t }: StepBodyProps) {
  // Reuse the existing GeoLocations component — it owns the leaflet map +
  // Nominatim integration. We just pass through formData and a setter.
  const GeoLocations = Digit?.ComponentRegistryService?.getComponent("GeoLocations");
  if (!GeoLocations) {
    return (
      <StepShell title={t("CS_ADDCOMPLAINT_SELECT_GEOLOCATION_HEADER")}>
        <p className="text-sm text-destructive">Map component not registered.</p>
      </StepShell>
    );
  }
  return (
    <StepShell
      title={t("CS_ADDCOMPLAINT_SELECT_GEOLOCATION_HEADER")}
      description={t("CS_PIN_LOCATION_HINT")}
    >
      <GeoLocations
        formData={data}
        onSelect={(_key: string, value: GeoPoint) => {
          patch({
            GeoLocationsPoint: value,
            // Mirror the pincode onto postalCode so step 2 / submit
            // validation see the latest pin's pincode (matches FormExplorer.useEffect).
            postalCode:
              value?.pincode != null && String(value.pincode).length > 0
                ? String(value.pincode)
                : data.postalCode,
          });
        }}
      />
    </StepShell>
  );
}

function Step2Address({ data, patch, t }: StepBodyProps) {
  return (
    <StepShell
      title={t("CS_COMPLAINT_LOCATION_DETAILS")}
      description={t("CS_LANDMARK_AND_PINCODE_HINT")}
    >
      <div className="space-y-5">
        <Field label={t("CS_COMPLAINT_LANDMARK__DETAILS")} htmlFor="landmark">
          <Input
            id="landmark"
            placeholder={t("CS_LANDMARK_PLACEHOLDER")}
            maxLength={64}
            value={data.landmark ?? ""}
            onChange={(e) => patch({ landmark: e.target.value })}
          />
        </Field>
        <Field label={t("CS_COMPLAINT_POSTALCODE__DETAILS")} htmlFor="postal-code">
          <Input
            id="postal-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={7}
            value={data.postalCode ?? ""}
            onChange={(e) => patch({ postalCode: e.target.value.replace(/\D/g, "") })}
          />
        </Field>
      </div>
    </StepShell>
  );
}

function Step3Boundary({ data, patch, t }: StepBodyProps) {
  // Reuse PGRBoundaryComponent — it walks the cascade and writes a leaf
  // node to the bound key. Renders inside our v2 card.
  const PGRBoundaryComponent = Digit?.ComponentRegistryService?.getComponent("PGRBoundaryComponent");
  if (!PGRBoundaryComponent) {
    return (
      <StepShell title={t("CS_ADDCOMPLAINT_COMPLAINT_LOCATION")}>
        <p className="text-sm text-destructive">Boundary component not registered.</p>
      </StepShell>
    );
  }
  return (
    <StepShell
      title={t("CS_ADDCOMPLAINT_COMPLAINT_LOCATION")}
      description={t("CS_BOUNDARY_PICK_HINT")}
    >
      <PGRBoundaryComponent
        userType="citizen"
        config={{ key: "SelectedBoundary", populators: { name: "SelectedBoundary" }, label: "" }}
        formData={data}
        onSelect={(_key: string, value: BoundaryNode) => {
          patch({ SelectedBoundary: value });
        }}
      />
    </StepShell>
  );
}

function Step4Description({ data, patch, t }: StepBodyProps) {
  return (
    <StepShell
      title={t("CS_COMPLAINT_DETAILS_ADDITIONAL_DETAILS")}
      description={t("CS_DESCRIPTION_HINT")}
    >
      <Field
        label={t("CS_COMPLAINT_DETAILS_ADDITIONAL_DETAILS_DESCRIPTION")}
        required
        htmlFor="complaint-description"
      >
        <Textarea
          id="complaint-description"
          placeholder={t("CS_DESCRIBE_THE_ISSUE_PLACEHOLDER")}
          maxLength={1000}
          value={data.description ?? ""}
          onChange={(e) => patch({ description: e.target.value })}
        />
        <div className="mt-1 text-xs text-muted-foreground text-right">
          {(data.description ?? "").length} / 1000
        </div>
      </Field>
    </StepShell>
  );
}

function Step5Images({ data, patch, t }: StepBodyProps) {
  // Reuse SelectImages — the registered component knows how to call the
  // upload API and write fileStoreIds back. We pass formData + setter the
  // same way it expects from FormStep.
  const SelectImages = Digit?.ComponentRegistryService?.getComponent("SelectImages");
  if (!SelectImages) {
    return (
      <StepShell title={t("CS_ADDCOMPLAINT_UPLOAD_PHOTO")}>
        <p className="text-sm text-destructive">Image-upload component not registered.</p>
      </StepShell>
    );
  }
  return (
    <StepShell
      title={t("CS_ADDCOMPLAINT_UPLOAD_PHOTO")}
      description={t("CS_PHOTO_OPTIONAL_HINT")}
    >
      <SelectImages
        formData={data}
        onSelect={(_key: string, value: string[]) => {
          patch({ ComplaintImagesPoint: value });
        }}
        config={{
          key: "ComplaintImagesPoint",
          populators: { name: "ComplaintImagesPoint" },
          label: "CS_ADDCOMPLAINT_UPLOAD_PHOTO_TEXT",
        }}
      />
    </StepShell>
  );
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

const CreatePGRFlowV2: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const dispatch = useDispatch();
  const client = useQueryClient();

  const tenantId =
    Digit.SessionStorage.get("CITIZEN.COMMON.HOME.CITY")?.code ||
    Digit.ULBService.getCurrentTenantId();
  const tenants: any = Digit.Hooks.pgr.useTenants();

  const { data: serviceDefs, isLoading: isMDMSLoading } = Digit.Hooks.useCustomMDMS(
    tenantId,
    "RAINMAKER-PGR",
    [{ name: "ServiceDefs" }],
    {
      cacheTime: Infinity,
      select: (raw: any) => raw?.["RAINMAKER-PGR"]?.ServiceDefs,
    },
    { schemaCode: "SERVICE_DEFS_MASTER_DATA" }
  );

  const { mutate: createMutation } = Digit.Hooks.pgr.useCreateComplaint(tenantId);

  const [stepIndex, setStepIndex] = React.useState(0);
  const [formData, setFormData] = React.useState<FormData>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const patch = React.useCallback((partial: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...partial }));
    if (error) setError(null);
  }, [error]);

  const isLast = stepIndex === STEPS.length - 1;

  // Mirror map-derived pincode onto postalCode (matches FormExplorer's effect).
  React.useEffect(() => {
    const pin = formData?.GeoLocationsPoint?.pincode;
    const desired = pin != null && String(pin).length > 0 ? String(pin) : undefined;
    if (desired !== undefined && formData.postalCode !== desired) {
      setFormData((prev) => ({ ...prev, postalCode: desired }));
    }
  }, [formData?.GeoLocationsPoint?.pincode, formData.postalCode]);

  const stepIsValid = React.useMemo(() => {
    const required = MANDATORY_BY_STEP[stepIndex] || [];
    return required.every((field) => isFieldValid(formData, field));
  }, [stepIndex, formData]);

  function pincodeAllowlistOk(): boolean {
    const wardResolved = !!formData?.GeoLocationsPoint?.ward?.code;
    if (wardResolved) return true; // ward routing supersedes pincode allowlist (CCRS#469)
    if (!formData.postalCode || String(formData.postalCode).length === 0) return true;
    const norm = (v: unknown) => String(v ?? "").trim().replace(/^0+/, "") || "0";
    const list = norm(formData.postalCode);
    const configured =
      Array.isArray(tenants) &&
      tenants.some((tnt: any) => Array.isArray(tnt?.pincode) && tnt.pincode.length > 0);
    if (!configured) return true;
    return tenants.some(
      (tnt: any) =>
        Array.isArray(tnt?.pincode) &&
        tnt.pincode.some((p: unknown) => norm(p) === list)
    );
  }

  function handleContinue() {
    if (!stepIsValid) {
      setError(t("CORE_COMMON_REQUIRED_ERRMSG"));
      return;
    }
    if (isLast) {
      if (!pincodeAllowlistOk()) {
        setError(t("CS_COMMON_PINCODE_NOT_SERVICABLE"));
        return;
      }
      setSubmitting(true);
      const user = Digit.UserService.getUser();
      const payload = mapFormDataToRequest(formData, tenantId, user?.info ?? user);
      createMutation(payload, {
        onError: () => {
          dispatch({ type: "CREATE_COMPLAINT", payload: { responseInfo: { status: "failed" } } });
          setSubmitting(false);
          history.push(`/digit-ui/citizen/pgr/response`);
        },
        onSuccess: async (responseData: any) => {
          dispatch({ type: "CREATE_COMPLAINT", payload: responseData });
          await client.refetchQueries(["complaintsList"]);
          setSubmitting(false);
          history.push(`/digit-ui/citizen/pgr/response`);
        },
      });
      return;
    }
    setStepIndex((i) => i + 1);
  }

  function handleBack() {
    if (stepIndex === 0) {
      history.goBack();
      return;
    }
    setStepIndex((i) => i - 1);
  }

  if (isMDMSLoading) {
    return (
      <ScreenContainer>
        <div className="flex h-64 items-center justify-center">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent text-muted-foreground" />
        </div>
      </ScreenContainer>
    );
  }

  const stepProps: StepBodyProps = {
    data: formData,
    patch,
    serviceDefs: Array.isArray(serviceDefs) ? serviceDefs : [],
    t,
  };

  return (
    <ScreenContainer withFooter>
      <BackLink onClick={handleBack} label={t("CS_COMMON_BACK")} className="mb-4" />
      <ScreenHeader
        title={t("CS_COMMON_FILE_A_COMPLAINT")}
        description={t("CS_FILE_COMPLAINT_INTRO")}
      />
      <div className="mt-6">
        <Stepper steps={STEPS as unknown as { id: string; title: string }[]} currentIndex={stepIndex} />
      </div>
      <div className="mt-6">
        {stepIndex === 0 && <Step0Type {...stepProps} />}
        {stepIndex === 1 && <Step1Map {...stepProps} />}
        {stepIndex === 2 && <Step2Address {...stepProps} />}
        {stepIndex === 3 && <Step3Boundary {...stepProps} />}
        {stepIndex === 4 && <Step4Description {...stepProps} />}
        {stepIndex === 5 && <Step5Images {...stepProps} />}
      </div>
      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}
      <FormFooter>
        <Button variant="ghost" size="lg" onClick={handleBack} type="button">
          {stepIndex === 0 ? t("CS_COMMON_CANCEL") : t("CS_COMMON_BACK")}
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleContinue}
          loading={submitting}
          disabled={!stepIsValid}
          type="button"
        >
          {isLast ? t("CS_COMMON_SUBMIT") : t("CS_COMMON_CONTINUE")}
        </Button>
      </FormFooter>
    </ScreenContainer>
  );
};

export default CreatePGRFlowV2;
