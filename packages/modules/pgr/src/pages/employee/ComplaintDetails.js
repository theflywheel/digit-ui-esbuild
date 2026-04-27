// Nairobi-overhaul Round 2 (R2-C) — employee Complaint Detail rewrite.
//
// New layout (desktop):
//   ┌─────────────────────────────┬──────────────────┐
//   │  Left: complaint info card  │  Right: actions  │
//   │  - description / category   │  - state pill    │
//   │  - location, photos         │  - assignee menu │
//   │  - meta rows                │  - resolve CTA   │
//   │                             │  - reject (out)  │
//   │                             │  - forward link  │
//   └─────────────────────────────┴──────────────────┘
//   ┌──────────────────────────────────────────────────┐
//   │ NairobiWorkflowTimeline (events from data hook) │
//   └──────────────────────────────────────────────────┘
//
// Constraints honoured:
//   - Workflow API/payload shapes unchanged: `Digit.Hooks.useWorkflowDetails`,
//     `Digit.Hooks.pgr.useComplaintDetails`, `Digit.Complaint.assign`,
//     `Digit.WorkflowService.getByBusinessId` all called with the same
//     arguments as before.
//   - Workflow next-actions (ASSIGN / REASSIGN / RESOLVE / REJECT / REOPEN)
//     unchanged — the action menu still derives from
//     `workflowDetails.data.nextActions`. Role-based access is gated upstream
//     by the workflow service (which roles see which next actions); this file
//     does not introduce new role gating.
//   - Modal still uses the shared `Modal` component from
//     digit-ui-react-components so the upload-supporting-document plumbing,
//     reopen reasons and assignee SectionalDropdown all keep working
//     byte-for-byte.
//   - No new dependencies.
import React, { Fragment, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardLabel,
  CardLabelDesc,
  DisplayPhotos,
  Dropdown,
  HeaderBar,
  ImageViewer,
  Loader,
  Menu,
  Modal,
  PopUp,
  SectionalDropdown,
  TextArea,
  Toast,
  UploadFile,
} from "@egovernments/digit-ui-react-components";
import {
  NairobiButton,
  NairobiTag,
  NairobiWorkflowTimeline,
} from "@egovernments/digit-ui-components";

import { Close } from "../../Icons";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "react-query";
import StarRated from "../../components/timelineInstances/StarRated";

const Heading = ({ label }) => <h1 className="heading-m">{label}</h1>;

const CloseBtn = ({ onClick }) => (
  <div className="icon-bg-secondary" onClick={onClick}>
    <Close />
  </div>
);

const TLAttachments = ({ thumbs, onClick, t }) => (
  <div className="TLComments">
    <h3>{t("CS_COMMON_ATTACHMENTS")}</h3>
    <DisplayPhotos srcs={thumbs} onClick={onClick} />
  </div>
);

const statusTagVariant = (status) => {
  if (!status) return "complaint-type";
  const s = String(status).toUpperCase();
  if (s.includes("RESOLVE") || s.includes("CLOSE")) return "success";
  if (s.includes("REJECT")) return "error";
  if (s.includes("PENDING")) return "warning";
  return "complaint-type";
};

const ComplaintDetailsModal = ({
  workflowDetails,
  complaintDetails,
  close,
  popup,
  selectedAction,
  onAssign,
  tenantId,
  t,
}) => {
  // RAIN-5692 PGR : GRO is assigning complaint, Selecting employee and assign. Its not getting assigned.
  // Fix for next action  assignee dropdown issue
  const stateArray = workflowDetails?.data?.initialActionState?.nextActions?.filter(
    (ele) => ele?.action == selectedAction
  );
  const useEmployeeData = Digit.Hooks.pgr.useEmployeeFilter(
    tenantId,
    stateArray?.[0]?.assigneeRoles?.length > 0 ? stateArray?.[0]?.assigneeRoles?.join(",") : "",
    complaintDetails
  );
  const employeeData = useEmployeeData
    ? useEmployeeData.map((departmentData) => ({
        heading: departmentData.department,
        options: departmentData.employees,
      }))
    : null;

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [comments, setComments] = useState("");
  const [file, setFile] = useState(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState(null);
  const cityDetails = Digit.ULBService.getCurrentUlb();
  const [selectedReopenReason, setSelectedReopenReason] = useState(null);

  useEffect(() => {
    (async () => {
      setError(null);
      if (file) {
        if (file.size >= 5242880) {
          setError(t("CS_MAXIMUM_UPLOAD_SIZE_EXCEEDED"));
        } else {
          try {
            setFileUploading(true);
            const stateId = Digit.Utils.getMultiRootTenant()
              ? Digit.ULBService.getStateId()
              : cityDetails.code;
            const response = await Digit.UploadServices.Filestorage("property-upload", file, stateId);
            if (response?.data?.files?.length > 0) {
              setUploadedFile(response?.data?.files[0]?.fileStoreId);
            } else {
              setError(t("CS_FILE_UPLOAD_ERROR"));
            }
            setFileUploading(false);
          } catch (err) {
            setError(t("CS_FILE_UPLOAD_ERROR"));
          }
        }
      }
    })();
  }, [file]);

  const reopenReasonMenu = [
    t(`CS_REOPEN_OPTION_ONE`),
    t(`CS_REOPEN_OPTION_TWO`),
    t(`CS_REOPEN_OPTION_THREE`),
    t(`CS_REOPEN_OPTION_FOUR`),
  ];

  return (
    <Modal
      headerBarMain={
        <Heading
          label={
            selectedAction === "ASSIGN" || selectedAction === "REASSIGN"
              ? t("CS_ACTION_ASSIGN")
              : selectedAction === "REJECT"
              ? t("CS_ACTION_REJECT")
              : selectedAction === "REOPEN"
              ? t("CS_COMMON_REOPEN")
              : t("CS_COMMON_RESOLVE")
          }
        />
      }
      headerBarEnd={<CloseBtn onClick={() => close(popup)} />}
      actionCancelLabel={t("CS_COMMON_CANCEL")}
      actionCancelOnSubmit={() => close(popup)}
      actionSaveLabel={
        selectedAction === "ASSIGN" || selectedAction === "REASSIGN"
          ? t("CS_COMMON_ASSIGN")
          : selectedAction === "REJECT"
          ? t("CS_COMMON_REJECT")
          : selectedAction === "REOPEN"
          ? t("CS_COMMON_REOPEN")
          : t("CS_COMMON_RESOLVE")
      }
      actionSaveOnSubmit={() => {
        if (selectedAction === "REJECT" && !comments) {
          setError(t("CS_MANDATORY_COMMENTS"));
        } else {
          onAssign(selectedEmployee, comments, uploadedFile);
        }
      }}
      error={error}
      setError={setError}
    >
      <Card>
        {selectedAction === "REJECT" || selectedAction === "RESOLVE" || selectedAction === "REOPEN" ? null : (
          <Fragment>
            <CardLabel>{t("CS_COMMON_EMPLOYEE_NAME")}</CardLabel>
            {employeeData && (
              <SectionalDropdown
                selected={selectedEmployee}
                menuData={employeeData}
                displayKey="name"
                select={setSelectedEmployee}
              />
            )}
          </Fragment>
        )}
        {selectedAction === "REOPEN" ? (
          <Fragment>
            <CardLabel>{t("CS_REOPEN_COMPLAINT")}</CardLabel>
            <Dropdown
              selected={selectedReopenReason}
              option={reopenReasonMenu}
              select={setSelectedReopenReason}
            />
          </Fragment>
        ) : null}
        <CardLabel>{t("CS_COMMON_EMPLOYEE_COMMENTS")}</CardLabel>
        <TextArea
          name="comment"
          onChange={(e) => {
            setError(null);
            setComments(e.target.value);
          }}
          value={comments}
        />
        <CardLabel>{t("CS_ACTION_SUPPORTING_DOCUMENTS")}</CardLabel>
        <CardLabelDesc>{t(`CS_UPLOAD_RESTRICTIONS`)}</CardLabelDesc>
        <UploadFile
          id={"pgr-doc"}
          accept=".jpg"
          onUpload={(e) => setFile(e.target.files[0])}
          onDelete={() => setUploadedFile(null)}
          message={
            uploadedFile ? `1 ${t(`CS_ACTION_FILEUPLOADED`)}` : t(`CS_ACTION_NO_FILEUPLOADED`)
          }
        />
      </Card>
    </Modal>
  );
};

const renderTimelineEvents = (timeline, t) => {
  if (!timeline?.length) return [];
  // The data hook gives us most-recent-first (index 0 == latest). For a
  // top-down "filed → ... → current" timeline we render in chronological
  // order. The `completed` flag is true for every event below the most
  // recent (i.e. all but the first slot in the inbound array).
  return timeline
    .map((checkpoint, idx) => ({
      label: t(`CS_COMMON_${checkpoint.status}`),
      timestamp: checkpoint?.auditDetails?.lastModified
        ? Digit.DateUtils.ConvertTimestampToDate(checkpoint.auditDetails.lastModified)
        : null,
      completed: idx > 0,
    }))
    .reverse();
};

export const ComplaintDetails = (props) => {
  let { id } = useParams();
  const { t } = useTranslation();
  const [fullscreen, setFullscreen] = useState(false);
  const [imageZoom, setImageZoom] = useState(null);
  const [toast, setToast] = useState(false);
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { isLoading, complaintDetails, revalidate: revalidateComplaintDetails } =
    Digit.Hooks.pgr.useComplaintDetails({ tenantId, id });
  const workflowDetails = Digit.Hooks.useWorkflowDetails({
    tenantId,
    id,
    moduleCode: "PGR",
    role: "EMPLOYEE",
  });
  const [imagesToShowBelowComplaintDetails, setImagesToShowBelowComplaintDetails] = useState([]);

  // RAIN-5692 PGR : GRO is assigning complaint, Selecting employee and assign. Its not getting assigned.
  // Fix for next action  assignee dropdown issue
  if (workflowDetails && workflowDetails?.data) {
    workflowDetails.data.initialActionState =
      workflowDetails?.data?.initialActionState || { ...workflowDetails?.data?.actionState } || {};
    workflowDetails.data.actionState = { ...workflowDetails.data };
  }

  useEffect(() => {
    if (workflowDetails) {
      const { data: { timeline: complaintTimelineData } = {} } = workflowDetails;
      if (complaintTimelineData) {
        const actionByCitizenOnComplaintCreation = complaintTimelineData?.find(
          (e) => e?.performedAction === "APPLY"
        );
        const { thumbnailsToShow } = actionByCitizenOnComplaintCreation || {};
        if (thumbnailsToShow) setImagesToShowBelowComplaintDetails(thumbnailsToShow);
      }
    }
  }, [workflowDetails]);

  const [displayMenu, setDisplayMenu] = useState(false);
  const [popup, setPopup] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [assignResponse, setAssignResponse] = useState(null);
  const [loader, setLoader] = useState(false);
  const [, setRerender] = useState(1);
  const client = useQueryClient();

  useEffect(() => {
    (async () => {
      await Digit?.WorkflowService?.getByBusinessId(tenantId, id);
    })();
  }, [complaintDetails]);

  const refreshData = async () => {
    await client.refetchQueries(["fetchInboxData"]);
    await workflowDetails.revalidate();
    await revalidateComplaintDetails();
  };

  useEffect(() => {
    (async () => {
      if (complaintDetails) {
        setLoader(true);
        await refreshData();
        setLoader(false);
      }
    })();
  }, []);

  const close = (state) => {
    if (state === fullscreen) setFullscreen(!fullscreen);
    else if (state === popup) setPopup(!popup);
  };

  const onActionSelect = (action) => {
    setSelectedAction(action);
    if (["ASSIGN", "REASSIGN", "RESOLVE", "REJECT", "REOPEN"].includes(action)) {
      setPopup(true);
      setDisplayMenu(false);
    } else {
      setDisplayMenu(false);
    }
  };

  const onAssign = async (selectedEmployee, comments, uploadedFile) => {
    setPopup(false);
    const response = await Digit.Complaint.assign(
      complaintDetails,
      selectedAction,
      selectedEmployee,
      comments,
      uploadedFile,
      tenantId
    );
    setAssignResponse(response);
    setToast(true);
    setLoader(true);
    await refreshData();
    setLoader(false);
    setRerender((r) => r + 1);
    setTimeout(() => setToast(false), 10000);
  };

  // Fast-path action triggers — show a pre-selected primary on the right card
  const triggerAction = (action) => () => onActionSelect(action);

  if (isLoading || workflowDetails.isLoading || loader) return <Loader />;
  if (workflowDetails.isError) return <Fragment>{workflowDetails.error}</Fragment>;

  const nextActions = workflowDetails?.data?.nextActions || [];
  const nextActionKeys = nextActions.map((a) => a.action);
  const canResolve = nextActionKeys.includes("RESOLVE");
  const canReject = nextActionKeys.includes("REJECT");
  const canAssign = nextActionKeys.includes("ASSIGN") || nextActionKeys.includes("REASSIGN");
  const assignAction = nextActionKeys.includes("ASSIGN") ? "ASSIGN" : "REASSIGN";
  // "Forward" is the conceptual ReASSIGN flow as a low-emphasis link.
  const canForward = nextActionKeys.includes("REASSIGN");

  const currentStatusKey = complaintDetails?.details
    ? Object.entries(complaintDetails.details).find(([k]) =>
        k.toUpperCase().includes("STATUS")
      )?.[1]
    : null;
  const currentStatus =
    currentStatusKey || workflowDetails?.data?.timeline?.[0]?.status || "";

  const timelineEvents = renderTimelineEvents(workflowDetails?.data?.timeline, t);

  return (
    <div className="nairobi-emp-detail">
      <header className="nairobi-emp-page-header">
        <div className="nairobi-emp-page-header__title-row">
          <h1 className="nairobi-emp-page-title">
            {t(`CS_HEADER_COMPLAINT_SUMMARY`)}
          </h1>
          {currentStatus && (
            <NairobiTag variant={statusTagVariant(currentStatus)}>
              {t(`CS_COMMON_${currentStatus}`)}
            </NairobiTag>
          )}
        </div>
      </header>

      <div className="nairobi-emp-detail__grid">
        <section className="nairobi-emp-card nairobi-emp-detail__info">
          <h2 className="nairobi-emp-card__title">
            {t(`CS_COMPLAINT_DETAILS_COMPLAINT_DETAILS`)}
          </h2>
          {isLoading ? (
            <Loader />
          ) : (
            <dl className="nairobi-emp-defs">
              {complaintDetails &&
                Object.keys(complaintDetails?.details).map((k) => {
                  const raw = complaintDetails?.details[k];
                  const text = Array.isArray(raw)
                    ? raw.map((val) => (typeof val === "object" ? t(val?.code) : t(val))).join(", ")
                    : t(raw) || "N/A";
                  return (
                    <Fragment key={k}>
                      <dt>{t(k)}</dt>
                      <dd>{text}</dd>
                    </Fragment>
                  );
                })}
            </dl>
          )}
          {imagesToShowBelowComplaintDetails?.thumbs ? (
            <div className="nairobi-emp-detail__photos">
              <DisplayPhotos
                srcs={imagesToShowBelowComplaintDetails.thumbs}
                onClick={(source, index) =>
                  setImageZoom(imagesToShowBelowComplaintDetails.fullImage?.[index] || source)
                }
              />
            </div>
          ) : null}
        </section>

        <aside className="nairobi-emp-card nairobi-emp-detail__actions">
          <h2 className="nairobi-emp-card__title">{t("WF_TAKE_ACTION")}</h2>
          <div className="nairobi-emp-detail__action-row">
            <span className="nairobi-emp-detail__action-label">
              {t("CS_COMPLAINT_DETAILS_CURRENT_STATUS")}
            </span>
            <NairobiTag variant={statusTagVariant(currentStatus)}>
              {currentStatus ? t(`CS_COMMON_${currentStatus}`) : "—"}
            </NairobiTag>
          </div>

          {canAssign && (
            <div className="nairobi-emp-detail__action-row nairobi-emp-detail__action-row--stack">
              <span className="nairobi-emp-detail__action-label">
                {t("CS_ACTION_ASSIGN")}
              </span>
              <NairobiButton
                variant="tertiary"
                size="md"
                onClick={triggerAction(assignAction)}
              >
                {t("CS_COMMON_EMPLOYEE_NAME") || "Assign to..."}
              </NairobiButton>
            </div>
          )}

          <div className="nairobi-emp-detail__action-cta-stack">
            {canResolve && (
              <NairobiButton
                variant="primary"
                size="md"
                onClick={triggerAction("RESOLVE")}
              >
                {t("CS_COMMON_RESOLVE")}
              </NairobiButton>
            )}
            {canReject && (
              <NairobiButton
                variant="tertiary"
                size="md"
                onClick={triggerAction("REJECT")}
              >
                {t("CS_COMMON_REJECT")}
              </NairobiButton>
            )}
            {canForward && (
              <button
                type="button"
                className="nairobi-emp-detail__forward-link"
                onClick={triggerAction("REASSIGN")}
              >
                {t("CS_FORWARD") || t("CS_COMMON_REASSIGN") || "Forward"}
              </button>
            )}
            {/* Fallback: if next-actions include states we did not specifically
                handle above, show the legacy take-action menu so power users
                still reach REOPEN / custom states. */}
            {nextActions.some((a) => !["ASSIGN", "REASSIGN", "RESOLVE", "REJECT"].includes(a.action)) && (
              <div className="nairobi-emp-detail__action-extra">
                <NairobiButton
                  variant="tertiary"
                  size="md"
                  onClick={() => setDisplayMenu(!displayMenu)}
                >
                  {t("WF_TAKE_ACTION")}
                </NairobiButton>
                {displayMenu && (
                  <Menu
                    options={nextActions.map((action) => action.action)}
                    textStyles={{ marginTop: "-2px" }}
                    optionCardStyles={{ width: "100%" }}
                    showSearch={false}
                    t={t}
                    onSelect={onActionSelect}
                  />
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      <section className="nairobi-emp-card nairobi-emp-detail__timeline">
        <h2 className="nairobi-emp-card__title">
          {t(`CS_COMPLAINT_DETAILS_COMPLAINT_TIMELINE`)}
        </h2>
        {workflowDetails?.isLoading ? (
          <Loader />
        ) : (
          <NairobiWorkflowTimeline events={timelineEvents} />
        )}
      </section>

      {fullscreen ? (
        <PopUp>
          <div className="popup-module">
            <HeaderBar
              main={<Heading label="Complaint Geolocation" />}
              end={<CloseBtn onClick={() => close(fullscreen)} />}
            />
            <div className="popup-module-main">
              <img src="https://via.placeholder.com/912x568" />
            </div>
          </div>
        </PopUp>
      ) : null}
      {imageZoom ? <ImageViewer imageSrc={imageZoom} onClose={() => setImageZoom(null)} /> : null}
      {popup ? (
        <ComplaintDetailsModal
          workflowDetails={workflowDetails}
          complaintDetails={complaintDetails}
          close={close}
          popup={popup}
          selectedAction={selectedAction}
          onAssign={onAssign}
          tenantId={tenantId}
          t={t}
        />
      ) : null}
      {toast && (
        <Toast
          label={t(assignResponse ? `CS_ACTION_${selectedAction}_TEXT` : "CS_ACTION_ASSIGN_FAILED")}
          onClose={() => setToast(false)}
        />
      )}
    </div>
  );
};
