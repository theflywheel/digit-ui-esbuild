import {  Loader,Dropdown } from "@egovernments/digit-ui-components";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const BoundaryComponent = ({ t, config, onSelect, userType, formData }) => {

  const tenantId = Digit.ULBService.getCurrentTenantId();


  const { data: childrenData, isLoading: isBoundaryLoading } = Digit.Hooks.pgr.useFetchBoundaries(tenantId);

  // boundaryHierarchyOrder is populated by usePGRInitialization at
  // module mount and changes when the operator switches city. Reading
  // it once at render meant a city switch left the cascade pointing at
  // the previous tenant's hierarchy — a 2-level tenant after coming
  // from a 3-level tenant would still try to render a Sub-County
  // dropdown that the new tenant doesn't have.
  const boundaryHierarchy = useMemo(() => {
    const order = Digit.SessionStorage.get("boundaryHierarchyOrder");
    return Array.isArray(order) ? order.map((item) => item.code) : [];
  }, [tenantId]);
  const hierarchyType = window?.globalConfigs?.getConfig("HIERARCHY_TYPE") || "ADMIN";

  // State to manage selected values and dropdown options
  const [selectedValues, setSelectedValues] = useState({});
  const [value, setValue] = useState({});

  // Reset selection state on tenant change so the previous tenant's
  // selected County / Ward doesn't leak through to the new tenant's
  // boundary tree (different UUIDs, different shape).
  useEffect(() => {
    setSelectedValues({});
    setValue({});
  }, [tenantId]);

  // Effect to initialize dropdowns when data loads
useEffect(() => {
  if (childrenData && childrenData.length > 0) {
    const boundaryMap = {};
    let currentLevel = childrenData[0]?.boundary;

    while (currentLevel && currentLevel.length > 0) {
      const currentType = currentLevel[0].boundaryType;
      boundaryMap[currentType] = currentLevel;

      // Proceed to children of the first element for next level
      const hasChildren = currentLevel[0]?.children;
      currentLevel = hasChildren && hasChildren.length > 0 ? currentLevel[0].children : null;
    }

    setValue(boundaryMap);
  }
}, [childrenData]);

  /**
   * Handle dropdown selection.
   * - Stores the selected boundary.
   * - Clears all children dropdowns.
   * - Loads children of the selected boundary.
   */
  const handleSelection = (selectedBoundary) => {
    if (!selectedBoundary) return;

    const boundaryType = selectedBoundary.boundaryType;

    // Reset all child selections
    const index = boundaryHierarchy.indexOf(boundaryType);
    const newSelectedValues = { ...selectedValues };
    const newValue = { ...value };

    for (let i = index + 1; i < boundaryHierarchy.length; i++) {
      delete newSelectedValues[boundaryHierarchy[i]]; // Clear selected children
      delete newValue[boundaryHierarchy[i]]; // Clear child dropdowns
    }

    // Update selected values
    newSelectedValues[boundaryType] = selectedBoundary;
    setSelectedValues(newSelectedValues);
    setValue(newValue);
    // always sending the last selected boundary code

    onSelect(config.key, selectedBoundary);

    // Load child boundaries
    if (selectedBoundary.children && selectedBoundary.children.length > 0) {
      newValue[selectedBoundary.children[0].boundaryType] = selectedBoundary.children;
      setValue(newValue);
    }
  };

  /**
   * Check if a boundary type is allowed to be selected.
   */

  if (isBoundaryLoading) {
    return <Loader />;
  }

  return (
    <React.Fragment>

        {boundaryHierarchy.map((key, idx) => {
          // Gate child dropdowns by parent selection so the user can't
          // pick a Ward without first picking County → Sub-County. The
          // init effect above pre-populates `value` for every level
          // (it walks the first chain top-down so the data is hot when
          // the user reaches it), so without this gate all three
          // dropdowns would be active simultaneously and the citizen
          // could select a Ward of a different sub-county than the one
          // they actually meant — closes egovernments/CCRS#477.
          if (idx > 0) {
            const parentKey = boundaryHierarchy[idx - 1];
            if (!selectedValues[parentKey]) return null;
          }
          if (value[key]?.length > 0) {
            return (
              <BoundaryDropdown
                key={key}
                label={`${t(`${hierarchyType}_${key?.toUpperCase()}`)}`}
                data={value[key]}
                onChange={(selectedValue) => handleSelection(selectedValue)}
                selected={formData?.locality || formData?.SelectedBoundary ? selectedValues[key] : null}
              />
            );
          }
          return null;
        })}
    </React.Fragment>
  );
};

/**
 * BoundaryDropdown Component
 */
const BoundaryDropdown = ({ label, data, onChange, selected }) => {
  const { t } = useTranslation();

  return (
    <React.Fragment>
      <div className="comment-label">{t(label)}</div>
      <div className='digit-text-input-field'>
      {/* Cap the option panel height so the last entries don't get
          obscured by the FormComposerV2 submit footer when many
          options open at once (Nairobi has 9 wards in the pilot —
          part of #477). */}
      <Dropdown
        style={{width: "100%", maxWidth : "37.5rem"}}
        optionCardStyles={{ maxHeight: "200px" }}
        selected={selected}
        t={t}
        option={data}
        optionKey={"code"}
        select={(value) => onChange(value)}
      />
    </div>
    </React.Fragment>
  );
};

export default BoundaryComponent;