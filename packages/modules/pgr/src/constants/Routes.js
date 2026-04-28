export const PGR_BASE = `/${window?.contextPath}/pgr/citizen/`;

const CREATE_COMPLAINT_PATH = "/create-complaint/";
const REOPEN_COMPLAINT_PATH = "/reopen/";
import { PGR_EMPLOYEE_COMPLAINT_DETAILS, PGR_EMPLOYEE_CREATE_COMPLAINT } from "./Employee";

export const PgrRoutes = {
  ComplaintsPage: "/complaints",
  RatingAndFeedBack: "/rate/:id*",
  ComplaintDetailsPage: "/complaint/details/:id",
  ReasonPage: `/:id`,
  UploadPhoto: `/upload-photo/:id`,
  AddtionalDetails: `/addional-details/:id`,
  CreateComplaint: "/create-complaint",
  ReopenComplaint: "/reopen",
  Response: "/response",

  CreateComplaintStart: "",
  SubType: `/subtype`,
  LocationSearch: `/location`,
  // Step 4 of the citizen Create wizard. The legacy `pincode` and
  // `landmark` routes have been collapsed into `address` to match the
  // Figma "Provide Complainant Address" screen — see DECISIONS.md D-001.
  Address: `/address`,
  UploadPhotos: `/upload-photos`,
  Details: `/details`,
  CreateComplaintResponse: `/response`,
};

export const Employee = {
  Inbox: "/inbox",
  ComplaintDetails: PGR_EMPLOYEE_COMPLAINT_DETAILS,
  CreateComplaint: PGR_EMPLOYEE_CREATE_COMPLAINT,
  Response: "/response",
  Home: `/${window?.contextPath}/employee`,
  InboxV2 : "/inbox-v2"
};

export const getRoute = (match, route) => `${match.path}${route}`;
