import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import merge from "lodash.merge";
import { useDispatch } from "react-redux";
import { createComplaint } from "../../../redux/actions/index";
import { PGR_CITIZEN_COMPLAINT_CONFIG, PGR_CITIZEN_CREATE_COMPLAINT } from "../../../constants/Citizen";
import Response from "./Response";

import { config as defaultConfig } from "./defaultConfig";
import { Redirect, Route, Switch, useHistory, useRouteMatch, useLocation } from "react-router-dom";
import { useQueryClient } from "react-query";
import { NairobiWizardShell } from "@egovernments/digit-ui-components";
import { getSubmitLabel } from "./stepLabels";

/**
 * Citizen Create (file-a-complaint) wrapper.
 *
 * Phase 5 (R1-A) wraps every routed step in a single <NairobiWizardShell>:
 *   - shell-green NairobiTopBar across the top ("File a Complaint")
 *   - pale-green NairobiBackStrip with the per-step header
 *   - body slot containing the step's existing form
 *
 * The shell intentionally renders CHROME ONLY for now — no shell-owned
 * primary action button. Each step still ships its own submit button
 * (TypeSelectCard / FormStep / LocationSearchCard etc.) because hijacking
 * those forms via refs would break their built-in disabled/validation
 * derivations. Phase 6 (R2-A) rewrites each step body to consume the
 * shell's `primaryAction` prop directly. The per-step submit labels
 * come from `stepLabels.js` (D-003 bundled config) so the labels are
 * already consistent before Phase 6 lands — the chrome will start
 * driving the click on a per-step basis as steps are migrated.
 *
 * The submit label for the ACTIVE route is therefore computed and
 * exposed as `submitBarLabel` in the route's `texts` block; existing
 * step components already accept `texts.submitBarLabel` and pass it
 * through to their inner submit bars (see SelectComplaintType.js,
 * SelectImages.js, SelectAddress.js — TypeSelectCard / FormStep both
 * read `submitBarLabel`). Bundled in code per the same stance as
 * Phase 1 — see docs/nairobi-overhaul/DECISIONS.md D-003.
 *
 * ## Phase 6 / R2-A — primaryAction / secondaryAction plumbing
 *
 * Steps that have been migrated to Nairobi atoms (vertical-row lists,
 * NairobiDropZone, plain textarea, etc.) drop their per-step submit
 * button and instead push a `{ label, onClick, disabled }` descriptor
 * up via `bindPrimaryAction` / `bindSecondaryAction`. The wrapper
 * stashes those descriptors in local state and hands them to the
 * shell's CTA bar. Both bindings are reset on route change so a stale
 * step's button never bleeds into the next step. Steps that have NOT
 * been migrated yet (e.g. the address sub-flow on the unmerged PR #61)
 * simply ignore the bindPrimaryAction prop and continue rendering
 * their own submit button — the shell renders chrome only in that case.
 */
export const CreateComplaint = () => {
  const ComponentProvider = Digit.Contexts.ComponentProvider;
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const match = useRouteMatch();
  const history = useHistory();
  const registry = useContext(ComponentProvider);
  const dispatch = useDispatch();
  const { data: storeData, isLoading } = Digit.Hooks.useStore.getInitData();
  const { stateInfo } = storeData || {};
  const [params, setParams, clearParams] = Digit.Hooks.useSessionStorage(PGR_CITIZEN_CREATE_COMPLAINT, {});
  // const [customConfig, setConfig] = Digit.Hooks.useSessionStorage(PGR_CITIZEN_COMPLAINT_CONFIG, {});
  const config = useMemo(() => merge(defaultConfig, Digit.Customizations.PGR.complaintConfig), [Digit.Customizations.PGR.complaintConfig]);
  const [paramState, setParamState] = useState(params);
  const [nextStep, setNextStep] = useState("");
  const [canSubmit, setCanSubmit] = useState(false);

  const [rerender, setRerender] = useState(0);
  const [primaryAction, setPrimaryAction] = useState(null);
  const [secondaryAction, setSecondaryAction] = useState(null);
  const client = useQueryClient();
  useEffect(() => {
    setCanSubmit(false);
  }, []);

  // Reset shell-driven CTAs every time the active step changes so a
  // descriptor from the previous step never bleeds into the next one.
  // Each step pushes a fresh descriptor on mount via bindPrimaryAction.
  useEffect(() => {
    setPrimaryAction(null);
    setSecondaryAction(null);
  }, [pathname]);

  // Stable references so step useEffects don't re-fire on every parent render.
  const bindPrimaryAction = useCallback((descriptor) => {
    setPrimaryAction(descriptor || null);
  }, []);
  const bindSecondaryAction = useCallback((descriptor) => {
    setSecondaryAction(descriptor || null);
  }, []);

  useEffect(() => {
    setParamState(params);
    if (nextStep === null) {
      wrapperSubmit();
    } else {
      history.push(`${match.path}/${nextStep}`);
    }
  }, [params, nextStep]);

  const goNext = () => {
    const currentPath = pathname.split("/").pop();

    let { nextStep } = config.routes[currentPath];
    let compType = Digit.SessionStorage.get(PGR_CITIZEN_CREATE_COMPLAINT);
    if (nextStep === "sub-type" && compType.complaintType.key === "Others") {
      setParams({
        ...params,
        complaintType: { key: "Others", name: t("SERVICEDEFS.OTHERS") },
        subType: { key: "Others", name: t("SERVICEDEFS.OTHERS") },
      });
      nextStep = config.routes[nextStep].nextStep;
    }
    setNextStep(nextStep);
  };

  const wrapperSubmit = () => {
    if (!canSubmit) {
      setCanSubmit(true);
      submitComplaint();
    }
  };
  const submitComplaint = async () => {
    if (paramState?.complaintType) {
      const { city_complaint, locality_complaint, uploadedImages, complaintType, subType, details, ...values } = paramState;
      const { code: cityCode, name: city } = city_complaint;
      const { code: localityCode, name: localityName } = locality_complaint;
      const _uploadImages = uploadedImages?.map((url) => ({
        documentType: "PHOTO",
        fileStoreId: url,
        documentUid: "",
        additionalDetails: {},
      }));

      const data = {
        ...values,
        complaintType: subType.key,
        cityCode:Digit.Utils.getMultiRootTenant() ? Digit.ULBService.getStateId() : cityCode,
        city,
        description: details,
        district: city,
        region: city,
        localityCode,
        localityName,
        state: stateInfo.name,
        uploadedImages: _uploadImages,
      };

      await dispatch(createComplaint(data));
      await client.refetchQueries(["complaintsList"]);
      clearParams();
      history.push(`${match.path}/response`);
    }
  };

  const handleSelect = (data) => {
    setParams({ ...params, ...data });
    goNext();
  };

  const handleSkip = () => {
    goNext();
  };

  const handleBack = () => {
    history.goBack();
  };

  const topBarTitle = t("CS_HEADER_FILE_COMPLAINT") || "File a Complaint";

  if (isLoading) return null;

  return (
    <Switch>
      {Object.keys(config.routes).map((route, index) => {
        const { component, texts, inputs } = config.routes[route];
        const Component = typeof component === "string" ? Digit.ComponentRegistryService.getComponent(component) : component;
        // D-003 — per-step submit label, bundled. Falls back to the
        // step's own configured submitBarLabel (legacy CS_COMMON_NEXT)
        // if the step is not in the bundled map.
        const fallbackLabel = (texts && texts.submitBarLabel) || "CS_COMMON_NEXT";
        const submitBarLabel = getSubmitLabel(route, fallbackLabel);
        const stepTexts = { ...(texts || {}), submitBarLabel };
        const stepTitle = stepTexts.header ? t(stepTexts.header) : null;
        return (
          <Route path={`${match.path}/${route}`} key={index}>
            <NairobiWizardShell
              topBarTitle={topBarTitle}
              stepTitle={stepTitle}
              onBack={handleBack}
              primaryAction={primaryAction}
              secondaryAction={secondaryAction}
            >
              <Component
                config={{ texts: stepTexts, inputs }}
                onSelect={handleSelect}
                onSkip={handleSkip}
                value={params}
                t={t}
                bindPrimaryAction={bindPrimaryAction}
                bindSecondaryAction={bindSecondaryAction}
              />
            </NairobiWizardShell>
          </Route>
        );
      })}
      <Route path={`${match.path}/response`}>
        <Response match={match} />
      </Route>
      <Route>
        <Redirect to={`${match.path}/${config.indexRoute}`} />
      </Route>
    </Switch>
  );
};
