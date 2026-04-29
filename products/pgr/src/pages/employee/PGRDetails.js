import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useParams } from "react-router-dom/cjs/react-router-dom.min";
import { HeaderComponent, Button, Card, Footer, SummaryCard, Tag, Timeline, Toast, NoResultsFound } from "@egovernments/digit-ui-components";
import { ActionBar, Loader, DisplayPhotos, ImageViewer } from "@egovernments/digit-ui-react-components";
import { convertEpochFormateToDate } from "../../utils";
import TimelineWrapper from "../../components/TimeLineWrapper";
import PGRWorkflowModal from "../../components/PGRWorkflowModal";
import ComplaintLocationMap from "../../components/ComplaintLocationMap";
import Urls from "../../utils/urls";
import ComplaintPhotos from "../../components/ComplaintPhotos";

// Action configurations used for handling different workflow actions like ASSIGN, REJECT, RESOLVE
// TO DO: Move this to MDMS for handling Action Modal properties
const ACTION_CONFIGS = [
  {
    actionType: "ASSIGN",
    formConfig: {
      label: {
        heading: "CS_ACTION_ASSIGN",
        cancel: "CS_COMMON_CANCEL",
        submit: "CS_COMMON_SUBMIT",
      },
      form: [
        {
          body: [
            {
              type: "component",
              isMandatory: false,
              component: "PGRAssigneeComponent",
              key: "SelectedAssignee",
              label: "CS_COMMON_EMPLOYEE_NAME",
              populators: { name: "SelectedAssignee" },
            },
            {
              type: "textarea",
              isMandatory: true,
              key: "SelectedComments",
              label: "CS_COMMON_EMPLOYEE_COMMENTS",
              populators: {
                name: "SelectedComments",
                maxLength: 1000,
                validation: { required: true },
                error: "CORE_COMMON_REQUIRED_ERRMSG",
              },
            },
          ],
        },
      ],
    },
  },
  {
    actionType: "REOPEN",
    formConfig: {
      label: {
        heading: "CS_COMMON_REOPEN",
        cancel: "CS_COMMON_CANCEL",
        submit: "CS_COMMON_SUBMIT",
      },
      form: [
        {
          body: [
            {
              type: "component",
              isMandatory: false,
              component: "PGRAssigneeComponent",
              key: "SelectedAssignee",
              label: "CS_COMMON_EMPLOYEE_NAME",
              populators: { name: "SelectedAssignee" },
            },
            {
              type: "textarea",
              isMandatory: true,
              key: "SelectedComments",
              label: "CS_COMMON_EMPLOYEE_COMMENTS",
              populators: {
                name: "SelectedComments",
                maxLength: 1000,
                validation: { required: true },
                error: "CORE_COMMON_REQUIRED_ERRMSG",
              },
            },
          ],
        },
      ],
    },
  },
  {
    actionType: "REJECT",
    formConfig: {
      label: {
        heading: "PGR_ACTION_REJECT",
        cancel: "CS_COMMON_CANCEL",
        submit: "CS_COMMON_SUBMIT",
      },
      form: [
        {
          body: [
            {
              isMandatory: false,
              key: "SelectedReason",
              type: "dropdown",
              label: "CS_REJECT_COMPLAINT",
              disable: false,
              populators: {
                name: "SelectedReason",
                optionsKey: "name",
                error: "Required",
                mdmsConfig: {
                  masterName: "RejectionReasons",
                  moduleName: "RAINMAKER-PGR",
                  localePrefix: "CS_REJECTION_",
                },
              },
            },
            {
              type: "textarea",
              isMandatory: true,
              key: "SelectedComments",
              label: "CS_COMMON_EMPLOYEE_COMMENTS",
              populators: {
                name: "SelectedComments",
                maxLength: 1000,
                validation: { required: true },
                error: "CORE_COMMON_REQUIRED_ERRMSG",
              },
            },
          ],
        },
      ],
    },
  },
  {
    actionType: "RESOLVE",
    formConfig: {
      label: {
        heading: "PGR_ACTION_RESOLVE",
        cancel: "CS_COMMON_CANCEL",
        submit: "CS_COMMON_SUBMIT",
      },
      form: [
        {
          body: [
            {
              type: "textarea",
              isMandatory: true,
              key: "SelectedComments",
              label: "CS_COMMON_EMPLOYEE_COMMENTS",
              populators: {
                name: "SelectedComments",
                maxLength: 1000,
                validation: { required: true },
                error: "CORE_COMMON_REQUIRED_ERRMSG",
              },
            },
          ],
        },
      ],
    },
  },
  {
    actionType: "REASSIGN",
    formConfig: {
      label: {
        heading: "CS_ACTION_REASSIGN",
        cancel: "CS_COMMON_CANCEL",
        submit: "CS_COMMON_SUBMIT",
      },
      form: [
        {
          body: [
            {
              type: "component",
              isMandatory: false,
              component: "PGRAssigneeComponent",
              key: "SelectedAssignee",
              label: "CS_COMMON_EMPLOYEE_NAME",
              populators: { name: "SelectedAssignee" },
            },
            {
              type: "textarea",
              isMandatory: true,
              key: "SelectedComments",
              label: "CS_COMMON_EMPLOYEE_COMMENTS",
              populators: {
                name: "SelectedComments",
                maxLength: 1000,
                validation: { required: true },
                error: "CORE_COMMON_REQUIRED_ERRMSG",
              },
            },
          ],
        },
      ],
    },
  },
];

const PGRDetails = () => {
  // Hooks for local state management
  const [openModal, setOpenModal] = useState(false);
  const { t } = useTranslation();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const history = useHistory();
  const { id } = useParams();
  const [selectedAction, setSelectedAction] = useState(null);
  const [toast, setToast] = useState({ show: false, label: "", type: "" });
  const userInfo = Digit.UserService.getUser();

  // Persist session data for complaint update
  const UpdateComplaintSession = Digit.Hooks.useSessionStorage("COMPLAINT_UPDATE", {});
  const [sessionFormData, setSessionFormData, clearSessionFormData] = UpdateComplaintSession;

  // Load master data from MDMS
  const { isLoading: isMDMSLoading, data: serviceDefs } = Digit.Hooks.useCustomMDMS(
    tenantId,
    "RAINMAKER-PGR",
    [{ name: "ServiceDefs" }],
    {
      cacheTime: Infinity,
      select: (data) => data?.["RAINMAKER-PGR"]?.ServiceDefs,
    },
    { schemaCode: "SERVICE_DEFS_MASTER_DATA" }
  );

  // Return SERVICEDEFS.* localization keys so callers can hand the result to t().
  // Mirrors the pattern every other PGR surface uses (inbox filter, DesktopInbox, ComplaintDetails…),
  // which in turn matches the keys the configurator seeds for every ServiceDef record.
  function getServiceCategoryByCode(serviceCode, services) {
    if (!serviceCode || !Array.isArray(services)) return null;
    const match = services.find(item => item.serviceCode === serviceCode);
    return match?.menuPath ? `SERVICEDEFS.${match.menuPath.toUpperCase()}` : null;
  }

  function getServiceNameByCode(serviceCode) {
    if (!serviceCode) return null;
    return `SERVICEDEFS.${serviceCode.toUpperCase()}`;
  }

  // Fetch complaint details
  const { isLoading, isError, error, data: pgrData, revalidate: pgrSearchRevalidate } = Digit.Hooks.pgr.usePGRSearch({ serviceRequestId: id }, tenantId);

  // Use the complaint's tenantId for workflow queries (complaints live at city level,
  // but getCurrentTenantId() may return root tenant for root-level ADMIN users)
  const complaintTenantId = pgrData?.ServiceWrappers?.[0]?.service?.tenantId || tenantId;

  // Hook to update the complaint
  const { mutate: UpdateComplaintMutation } = Digit.Hooks.pgr.usePGRUpdate(complaintTenantId);

  // Fetch workflow details
  const { isLoading: isWorkflowLoading, data: workflowData, revalidate: workFlowRevalidate } = Digit.Hooks.useCustomAPIHook({
    url: "/egov-workflow-v2/egov-wf/process/_search",
    params: { tenantId: complaintTenantId, history: true, businessIds: id },
    config: { enabled: !!pgrData },
    changeQueryName: id,
  });

  // Fetch business service metadata
  const { isLoading: isBusinessServiceLoading, data: businessServiceData } = Digit.Hooks.useCustomAPIHook({
    url: Urls.workflow.businessServiceSearch,
    params: { tenantId: complaintTenantId, businessServices: "PGR" },
    config: { enabled: !!pgrData },
  });

  // Automatically dismiss toast messages after 3 seconds
  useEffect(() => {
    if (toast?.show) {
      setTimeout(() => {
        handleToastClose();
      }, 3000);
    }
  }, [toast?.show]);

  const handleToastClose = () => {
    setToast({ show: false, label: "", type: "" });
  };

  // Prepare and submit the update complaint request
  const handleActionSubmit = (_data) => {
    const actionConfig = ACTION_CONFIGS.find((config) => config.actionType === selectedAction.action);

    if (!actionConfig) return;

    const missingFields = [];

    actionConfig.formConfig.form.forEach((section) => {
      section.body.forEach((field) => {
        if (field.isMandatory) {
          const fieldKey = field.key;
          const fieldValue = _data?.[fieldKey];

          // For dropdowns or components, also check if selected value is valid object or string
          const isEmpty =
            fieldValue === undefined ||
            fieldValue === null ||
            (typeof fieldValue === "string" && fieldValue.trim() === "") ||
            (typeof fieldValue === "object" && Object.keys(fieldValue).length === 0);

          if (isEmpty) {
            missingFields.push(t(field.label));
          }
        }
      });
    });

    if (missingFields.length > 0) {
      setToast({
        show: true,
        label: t("CS_COMMON_REQUIRED_FIELDS_MISSING") + ": " + missingFields.join(", "),
        type: "error",
      });
      return;
    }
    // Forward the rejection-reason picker into the workflow comment so
    // the audit log records *why* a complaint was rejected. The form
    // collects the reason in `_data.SelectedReason` (RejectionReasons
    // MDMS lookup) but it was never plumbed into the update payload —
    // operators only saw whatever free-text comment they typed.
    const reasonCode =
      _data?.SelectedReason?.code ||
      _data?.SelectedReason?.name ||
      _data?.SelectedReason ||
      "";
    const freeComment = _data?.SelectedComments || "";
    const isReject = selectedAction.action === "REJECT";
    const composedComment = isReject && reasonCode
      ? (freeComment ? `[${reasonCode}] ${freeComment}` : `[${reasonCode}]`)
      : freeComment;

    const updateRequest = {
      service: { ...pgrData?.ServiceWrappers[0].service },
      workflow: {
        action: selectedAction.action,
        assignes: _data?.SelectedAssignee?.uuid ? [_data?.SelectedAssignee?.uuid] : null,
        hrmsAssignes: _data?.SelectedAssignee?.uuid ? [_data?.SelectedAssignee?.uuid] : null,
        comments: composedComment,
      },
    };
    handleResponseForUpdateComplaint(updateRequest);
  };

  // Refresh the complaint and workflow data
  const refreshData = async () => {
    await pgrSearchRevalidate();
    await workFlowRevalidate();
  };

  // Handle response after updating complaint
  const handleResponseForUpdateComplaint = async (payload) => {
    setOpenModal(false);
    await UpdateComplaintMutation(payload, {
      onError: () => setToast({ show: true, label: t("FAILED_TO_UPDATE_COMPLAINT"), type: "error" }),
      onSuccess: async (responseData) => {
        const msg = payload.workflow.action || "RESOLVE";
        if (responseData?.ResponseInfo?.Errors) {
          setToast({ show: true, label: t("FAILED_TO_UPDATE_COMPLAINT"), type: "error" });
        } else {
          setToast({ show: true, label: t(`${msg}_SUCCESSFULLY`), type: "success" });
          await refreshData();
          clearSessionFormData();
        }
      },
    });
  };

  // Enhance config with roles and department dynamically
  const getUpdatedConfig = (selectedAction, workflowData, configs, serviceDefs, complaintData) => {
    const actionConfig = configs.find((config) => config.actionType === selectedAction.action);
    const department = serviceDefs?.find((def) => def.serviceCode === complaintData?.ServiceWrappers[0]?.service?.serviceCode)?.department;
    if (!actionConfig) return null;
    // The dropdown is the *assignee* picker, so we want the roles that can ACT on
    // the next state — not the roles that can perform the current action. The
    // latter (selectedAction.roles) was returning the GRO/PGR_VIEWER set, which
    // matches almost every employee in HRMS and produced a 37-row mega-dropdown.
    const roles = selectedAction?.assigneeRoles?.length ? selectedAction.assigneeRoles : (selectedAction?.roles || []);

    return {
      ...actionConfig.formConfig,
      form: actionConfig.formConfig.form.map((formItem) => ({
        ...formItem,
        body: formItem.body.map((bodyItem) => ({
          ...bodyItem,
          populators: {
            ...bodyItem.populators,
            roles,
            department,
            props: { ...bodyItem.populators.props, department },
          },
        })),
      })),
    };
  };

  // Roles that should never appear in an assignee dropdown even if a workflow
  // state lists them (system or non-employee actors).
  const NON_ASSIGNEE_ROLES = new Set(["CITIZEN", "AUTO_ESCALATE", "ANONYMOUS"]);

  // Compute the assignee role set for an action by looking at the *forward*
  // (non-self-looping) actions defined on the next state and unioning their
  // roles. Self-loops like ESCALATE / SLA_ESCALATE / COMMENT add noise (e.g.
  // GRO showing up in a PENDINGATLME assignment dropdown), so we exclude them.
  // System roles (CITIZEN, AUTO_ESCALATE, ANONYMOUS) are filtered out too.
  const computeAssigneeRoles = (nextStateUuid, businessServiceResponse) => {
    const nextState = businessServiceResponse?.states?.find((s) => s.uuid === nextStateUuid);
    if (!nextState?.actions) return [];
    const forwardActions = nextState.actions.filter((act) => act.nextState && act.nextState !== nextStateUuid);
    const source = forwardActions.length > 0 ? forwardActions : nextState.actions; // fall back if no forward actions
    const set = new Set();
    source.forEach((act) => (act.roles || []).forEach((r) => set.add(r)));
    return [...set].filter((r) => !NON_ASSIGNEE_ROLES.has(r));
  };

  // Actions that semantically belong to the *currently assigned* employee.
  // The workflow lists these as PGR_LME-gated, but on naipepea every operational
  // employee is seeded with both GRO and PGR_LME — so the role check alone lets
  // any GRO RESOLVE or REASSIGN any complaint in PENDINGATLME, regardless of
  // who actually owns it (egovernments/Citizen-Complaint-Resolution-System#470).
  // Until the underlying HRMS data is cleaned (blocked on knowing which
  // employees are intended to be GROs vs LMEs), restrict these actions to the
  // user UUID listed on the latest ProcessInstance.assignes — server-side gate
  // already returns "INVALID ROLE" for everyone else, so this just stops the UI
  // from offering an action that would 401 on submit.
  const ASSIGNEE_BOUND_ACTIONS = new Set(["RESOLVE", "REASSIGN"]);

  const isCurrentAssignee = (workflowData) => {
    const uuid = userInfo?.info?.uuid;
    if (!uuid) return false;
    const assignes = workflowData?.ProcessInstances?.[0]?.assignes || [];
    return assignes.some((a) => a?.uuid === uuid);
  };

  // Get list of valid actions for current user and state
  const getNextActionOptions = (workflowData, businessServiceResponse) => {
    const currentState = workflowData?.ProcessInstances?.[0]?.state;
    const matchingState = businessServiceResponse?.states?.find((state) => state.uuid === currentState?.uuid);
    if (!matchingState) return [];
    const userRoles = userInfo?.info?.roles?.map((role) => role.code) || [];
    const userIsAssignee = isCurrentAssignee(workflowData);
    return matchingState.actions
      ? matchingState.actions
          .filter((action) => action.roles.some((role) => userRoles.includes(role)))
          .filter((action) => !ASSIGNEE_BOUND_ACTIONS.has(action.action) || userIsAssignee)
          .map((action) => ({
            action: action.action,
            roles: action.roles,
            nextState: action.nextState,
            assigneeRoles: computeAssigneeRoles(action.nextState, businessServiceResponse),
            uuid: action.uuid,
          }))
      : [];
  };

  // Show the action toolbar only if the user has at least one *actionable*
  // option after role + assignee gating. Earlier this short-circuited on the
  // role check alone, so a polluted GRO with PGR_LME would get a Take Action
  // button on every PENDINGATLME complaint even when the only matching actions
  // (RESOLVE/REASSIGN) get filtered out by the assignee gate above.
  const shouldShowActionButton = () => {
    return getNextActionOptions(workflowData, businessServiceData?.BusinessServices?.[0]).length > 0;
  };

  // Display loader until required data loads
  if (isLoading || isMDMSLoading || isWorkflowLoading) return <Loader />;

  return (
    <React.Fragment>
      {/* Header */}
      <HeaderComponent className="digit-inbox-search-composer-header" styles={{ marginBottom: "1.5rem" }}>
        {t("CS_COMPLAINT_DETAILS_COMPLAINT_DETAILS")}
      </HeaderComponent>

      {/* Complaint Summary Card */}
      <div>
        {pgrData?.ServiceWrappers?.length > 0 ? (
          <SummaryCard
            asSeperateCards
            header="Heading"
            layout={1}
            sections={[
              {
                cardType: "primary",
                fieldPairs: [
                  {
                    inline: true,
                    label: t("CS_COMPLAINT_DETAILS_COMPLAINT_NO"),
                    type: "text",
                    value: pgrData?.ServiceWrappers[0].service?.serviceRequestId || "NA",
                  },
                  {
                    inline: true,
                    label: t("CS_COMPLAINT_DETAILS_COMPLAINT_TYPE"),
                    type: "text",
                    value: t(getServiceCategoryByCode(pgrData?.ServiceWrappers[0].service?.serviceCode, serviceDefs) || "NA"),
                  },
                  {
                    inline: true,
                    label: t("CS_COMPLAINT_DETAILS_COMPLAINT_SUBTYPE"),
                    type: "text",
                    value: t(getServiceNameByCode(pgrData?.ServiceWrappers[0].service?.serviceCode) || "NA"),
                  },
                  {
                    inline: true,
                    label: t("CS_COMPLAINT_FILED_DATE"),
                    value: convertEpochFormateToDate(pgrData?.ServiceWrappers[0].service?.auditDetails?.createdTime) || t("NA"),
                  },
                  {
                    inline: true,
                    label: t("CS_COMPLAINT_DETAILS_AREA"),
                    value: t(pgrData?.ServiceWrappers[0].service?.address?.locality?.code || "NA"),
                  },
                  {
                    inline: true,
                    label: t("CS_COMPLAINT_DETAILS_CURRENT_STATUS"),
                    value: t(`CS_COMMON_PGR_STATE_${pgrData?.ServiceWrappers[0].service?.applicationStatus || "NA"}`),
                  },
                  {
                    inline: true,
                    label: t("CS_COMPLAINT_LANDMARK__DETAILS"),
                    value: pgrData?.ServiceWrappers[0].service?.address?.landmark || "NA",
                  },
                  {
                    inline: true,
                    label: t("CS_COMPLAINT_DETAILS_ADDITIONAL_DETAILS_DESCRIPTION"),
                    value: pgrData?.ServiceWrappers[0].service?.description || "NA",
                  },
                ],
              },
              ...(pgrData?.ServiceWrappers[0]?.workflow?.verificationDocuments?.length > 0
                ? [{
                  cardType: "primary",
                  fieldPairs: [
                    {
                      inline: false,
                      type: "custom",
                      renderCustomContent: () => (
                        <ComplaintPhotos t={t} serviceWrapper={pgrData?.ServiceWrappers[0]} />
                      ),
                    },
                  ],
                  header: t("CS_COMMON_ATTACHMENTS"),
                }]
                : []
              ),
              // Conditionally include location section only if coordinates exist
              ...(pgrData?.ServiceWrappers[0]?.service?.address?.geoLocation?.latitude &&
                pgrData?.ServiceWrappers[0]?.service?.address?.geoLocation?.longitude
                ? [{
                  cardType: "primary",
                  fieldPairs: [
                    {
                      inline: false,
                      type: "custom",
                      renderCustomContent: () => {
                        const geoLocation = pgrData?.ServiceWrappers[0]?.service?.address?.geoLocation;
                        const address = pgrData?.ServiceWrappers[0]?.service?.address;

                        // Construct a readable address from API data
                        const addressParts = [
                          address?.buildingName,
                          address?.street,
                          address?.landmark,
                          address?.locality?.name || address?.locality?.code,
                          address?.pincode
                        ].filter(Boolean);

                        const addressString = addressParts.length > 0 ? addressParts.join(", ") : null;

                        return (
                          <ComplaintLocationMap
                            latitude={geoLocation.latitude}
                            longitude={geoLocation.longitude}
                            address={addressString}
                          />
                        );
                      },
                    },
                  ],
                  header: t("CS_COMPLAINT_LOCATION"),
                }]
                : []
              ),
              {
                cardType: "primary",
                fieldPairs: [
                  {
                    inline: false,
                    type: "custom",
                    renderCustomContent: () => (
                      <TimelineWrapper isWorkFlowLoading={isWorkflowLoading} workflowData={workflowData} businessId={id} labelPrefix="WF_PGR_" />
                    ),
                  },
                ],
                header: t("CS_COMPLAINT_DETAILS_COMPLAINT_TIMELINE"),
              },
            ]}
            type="primary"
          />
        ) : (
          <NoResultsFound />
        )}
      </div>

      {/* Footer Action Bar */}
      {shouldShowActionButton() && (
        <Footer
          actionFields={[
            <Button
              className="custom-class"
              isSearchable
              onClick={function noRefCheck() { }}
              menuStyles={{
                bottom: "40px",
              }}
              isDisabled={getNextActionOptions(workflowData, businessServiceData?.BusinessServices?.[0]).length === 0}
              key="action-button"
              label={t("ES_COMMON_TAKE_ACTION")}
              onOptionSelect={(selected) => {
                console.log("*** Log ===> selected", selected);
                setSelectedAction(selected);
                setOpenModal(true);
              }}
              options={getNextActionOptions(workflowData, businessServiceData?.BusinessServices?.[0])}
              optionsKey="action"
              type="actionButton"
            />,
          ]}
          className=""
          maxActionFieldsAllowed={5}
          setactionFieldsToRight
          sortActionFields
          style={{}}
        />
      )}

      {/* Toast Message */}
      {toast?.show && <Toast type={toast?.type} label={toast?.label} isDleteBtn onClose={handleToastClose} />}

      {/* Workflow Modal for Actions */}
      {openModal && selectedAction && (
        <PGRWorkflowModal
          selectedAction={selectedAction}
          sessionFormData={sessionFormData}
          setSessionFormData={setSessionFormData}
          clearSessionFormData={clearSessionFormData}
          config={getUpdatedConfig(selectedAction, workflowData, ACTION_CONFIGS, serviceDefs, pgrData)}
          closeModal={() => setOpenModal(false)}
          onSubmit={handleActionSubmit}
        />
      )}
    </React.Fragment>
  );
};

export default PGRDetails;