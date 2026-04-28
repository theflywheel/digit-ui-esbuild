import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { RatingCard, CardLabelError } from "@egovernments/digit-ui-react-components";
import { useParams, Redirect, useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { updateComplaints } from "../../../redux/actions/index";

const SelectRating = ({ parentRoute }) => {
  const { t } = useTranslation();
  const { id } = useParams();
  const dispatch = useDispatch();
  const history = useHistory();

  let tenantId = Digit.SessionStorage.get("CITIZEN.COMMON.HOME.CITY")?.code || Digit.ULBService.getCurrentTenantId();
  const complaintDetails = Digit.Hooks.pgr.useComplaintDetails({ tenantId: tenantId, id: id }).complaintDetails;
  const updateComplaint = useCallback((complaintDetails) => dispatch(updateComplaints(complaintDetails)), [dispatch]);
  const [submitError, setError] = useState(false)
  
  async function log(data) {
    if (!(complaintDetails?.service && data.rating > 0)) {
      setError(true);
      return;
    }
    // `CS_FEEDBACK_WHAT_WAS_GOOD` is only populated when the citizen
    // ticked at least one positive-feedback checkbox. Calling `.join`
    // on undefined threw and crashed the UI via the error boundary,
    // leaving the citizen on a blank page
    // (closes egovernments/CCRS#441).
    const feedbackSelections = Array.isArray(data.CS_FEEDBACK_WHAT_WAS_GOOD)
      ? data.CS_FEEDBACK_WHAT_WAS_GOOD
      : [];
    complaintDetails.service.rating = data.rating;
    complaintDetails.service.additionalDetail = feedbackSelections.join(",");
    complaintDetails.workflow = {
      action: "RATE",
      comments: data.comments,
      verificationDocuments: [],
    };
    // Await the dispatch so the redux UPDATE_COMPLAINT payload lands
    // before /response renders. Without await the navigation raced the
    // API call and Response.js read .complaints.response on an empty
    // slice, blanking the page (closes egovernments/CCRS#473).
    try {
      await updateComplaint({ service: complaintDetails.service, workflow: complaintDetails.workflow });
      history.push(`${parentRoute}/response`);
    } catch (err) {
      setError(true);
    }
  }

  const config = {
    texts: {
      header: "CS_COMPLAINT_RATE_HELP_TEXT",
      submitBarLabel: "CS_COMMONS_NEXT",
    },
    inputs: [
      {
        type: "rate",
        maxRating: 5,
        label: t("CS_COMPLAINT_RATE_TEXT"),
        error: submitError ? <CardLabelError>{t("CS_FEEDBACK_ENTER_RATING_ERROR")}</CardLabelError> : null
      },
      {
        type: "checkbox",
        label: "CS_FEEDBACK_WHAT_WAS_GOOD",
        checkLabels: [t("CS_FEEDBACK_SERVICES"), t("CS_FEEDBACK_RESOLUTION_TIME"), t("CS_FEEDBACK_QUALITY_OF_WORK"), t("CS_FEEDBACK_OTHERS")],
      },
      {
        type: "textarea",
        label: t("CS_COMMON_COMMENTS"),
        name: "comments",
      },
    ],
  };
  return <RatingCard {...{ config: config }} t={t} onSelect={log} />;
};
export default SelectRating;
