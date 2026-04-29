export const locationDetails = {
  "head": "CS_COMPLAINT_LOCATION_DETAILS",
  // "headerCaption": "CS_ADDCOMPLAINT_COMPLAINT_LOCATION",
  // "header": "CS_FILE_APPLICATION_PINCODE_LABEL",
  // "cardText": "CS_ADDCOMPLAINT_CHANGE_PINCODE_TEXT",
  // AddressOne / AddressTwo were commented out in an earlier sweep but
  // FormExplorer.mapFormDataToRequest + utils/index.js both read them
  // and put their values onto address.buildingName / address.street.
  // Without the form fields, every PGR _create payload had buildingName
  // and street as null — verified on naipepea: 0 of 20 recent
  // complaints had either field populated. Re-enabled both as optional
  // text inputs (closes egovernments/CCRS#478 follow-up).
  "body": [
    {
      "inline": true,
      "label": "CS_COMPLAINT_DETAILS_ADDRESS_1_DETAILS",
      "isMandatory": false,
      "type": "text",
      "key": "AddressOne",
      "disable": false,
      "populators": {
        "name": "AddressOne",
        "maxlength": 64
      }
    },
    {
      "inline": true,
      "label": "CS_COMPLAINT_DETAILS_ADDRESS_2_DETAILS",
      "isMandatory": false,
      "type": "text",
      "key": "AddressTwo",
      "disable": false,
      "populators": {
        "name": "AddressTwo",
        "maxlength": 64
      }
    },
    {
      "inline": true,
      "label": "CS_COMPLAINT_LANDMARK__DETAILS",
      "isMandatory": false,
      "type": "text",
      "disable": false,
      "populators": {
        "name": "landmark",
        "maxlength": 64
      }
    },
    {
      "inline": true,
      "label": "CS_COMPLAINT_POSTALCODE__DETAILS",
      "isMandatory": false,
      "type": "number",
      "disable": false,
      "populators": {
        "name": "postalCode",
        "maxlength": 7,
      }
    }
  ]
}