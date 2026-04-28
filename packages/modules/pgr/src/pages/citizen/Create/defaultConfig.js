import SelectAddressDetails from "./Steps/SelectAddressDetails";
import SelectComplaintType from "./Steps/SelectComplaintType";
import SelectDetails from "./Steps/SelectDetails";
import SelectImages from "./Steps/SelectImages";
import SelectSubType from "./Steps/SelectSubType";
import SelectGeolocation from "./Steps/SelectGeolocation";

export const config = {
  routes: {
    "complaint-type": {
      component: SelectComplaintType,
      texts: {
        headerCaption: "",
        header: "CS_ADDCOMPLAINT_COMPLAINT_TYPE_PLACEHOLDER",
        cardText: "CS_COMPLAINT_TYPE_TEXT",
        submitBarLabel: "CS_COMMON_NEXT",
      },
      nextStep: "sub-type",
    },
    "sub-type": {
      component: SelectSubType,
      texts: {
        header: "CS_ADDCOMPLAINT_COMPLAINT_SUBTYPE_PLACEHOLDER",
        cardText: "CS_COMPLAINT_SUBTYPE_TEXT",
        submitBarLabel: "CS_COMMON_NEXT",
      },
      nextStep: "map",
    },
    map: {
      component: SelectGeolocation,
      nextStep: "address",
    },
    // Step 4 of the Figma wizard ("Provide Complainant Address") — collapses
    // the legacy `pincode`, `address` and `landmark` routes into a single
    // FormComposer step. See DECISIONS.md D-001.
    address: {
      component: SelectAddressDetails,
      texts: {
        headerCaption: "CS_ADDCOMPLAINT_COMPLAINT_LOCATION",
        header: "CS_ADDCOMPLAINT_PROVIDE_COMPLAINT_ADDRESS",
        cardText: "CS_ADDCOMPLAINT_CITY_MOHALLA_TEXT",
        submitBarLabel: "CS_COMMON_NEXT",
        skipText: "CORE_COMMON_SKIP_CONTINUE",
      },
      nextStep: "upload-photos",
    },
    "upload-photos": {
      component: SelectImages,
      texts: {
        header: "CS_ADDCOMPLAINT_UPLOAD_PHOTO",
        cardText: "CS_ADDCOMPLAINT_UPLOAD_PHOTO_TEXT",
        submitBarLabel: "CS_COMMON_NEXT",
        skipText: "CORE_COMMON_SKIP_CONTINUE",
      },
      nextStep: "additional-details",
    },
    "additional-details": {
      component: SelectDetails,
      texts: {
        header: "CS_ADDCOMPLAINT_PROVIDE_ADDITIONAL_DETAILS",
        cardText: "CS_ADDCOMPLAINT_ADDITIONAL_DETAILS_TEXT",
        submitBarLabel: "CS_COMMON_NEXT",
      },
      inputs: [
        {
          label: "CS_ADDCOMPLAINT_ADDITIONAL_DETAILS",
          type: "textarea",
          name: "details",
        },
      ],
      nextStep: null,
    },
  },
  indexRoute: "complaint-type",
};
