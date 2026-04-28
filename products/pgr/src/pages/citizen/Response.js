import React from "react";
import { Card, Banner, CardText, SubmitBar } from "@egovernments/digit-ui-react-components";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { PgrRoutes, getRoute } from "../../constants/Routes";
import { useTranslation } from "react-i18next";

const GetActionMessage = ({ action }) => {
  const { t } = useTranslation();
  switch (action) {
    case "REOPEN":
      return t(`CS_COMMON_COMPLAINT_REOPENED`);
    case "RATE":
      return t("CS_COMMON_THANK_YOU");
    default:
      return t(`CS_COMMON_COMPLAINT_SUBMITTED`);
  }
};

// PGR `_update` returns `ResponseInfo` (capital R); accept either casing.
const hasUpdatePayload = (complaints) =>
  !!complaints?.response &&
  (complaints.response.ResponseInfo || complaints.response.responseInfo) &&
  Array.isArray(complaints.response.ServiceWrappers) &&
  complaints.response.ServiceWrappers.length > 0;

const BannerPicker = ({ response }) => {
  const { complaints } = response;
  const { t } = useTranslation();
  if (hasUpdatePayload(complaints)) {
    const wrapper = complaints.response.ServiceWrappers[0];
    return (
      <Banner
        message={GetActionMessage({ action: wrapper.workflow?.action })}
        complaintNumber={wrapper.service?.serviceRequestId}
        successful={true}
      />
    );
  } else {
    return <Banner message={t("CS_COMMON_COMPLAINT_NOT_SUBMITTED")} successful={false} />;
  }
};

const TextPicker = ({ response }) => {
  const { complaints } = response;
  const { t } = useTranslation();
  if (hasUpdatePayload(complaints)) {
    const action = complaints.response.ServiceWrappers[0].workflow?.action;
    return action === "RATE" ? <CardText>{t("CS_COMMON_RATING_SUBMIT_TEXT")}</CardText> : <CardText>{t("CS_COMMON_TRACK_COMPLAINT_TEXT")}</CardText>;
  }
  return null;
};

const Response = (props) => {
  const { t } = useTranslation();
  const appState = useSelector((state) => state)["pgr"] || {};

  React.useEffect(() => {
    if (appState.complaints?.response?.ServiceWrappers?.length > 0) {
      Digit.SessionStorage.del("PGR_MAP_LOCATION");
    }
  }, [appState]);

  return (
    <Card>
      <BannerPicker response={appState} />
      {appState.complaints?.response && <TextPicker response={appState} />}
      <Link to={`/${window?.contextPath}/citizen/all-services`}>
        <SubmitBar label={t("CORE_COMMON_GO_TO_HOME")} />
      </Link>
    </Card>
  );
};

export default Response;
