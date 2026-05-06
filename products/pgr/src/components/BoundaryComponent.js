import { Loader } from "@egovernments/digit-ui-components";
import { Field as V2Field, Select as V2Select } from "@egovernments/digit-ui-components-v2";
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

  // CCRS#491: auto-fill the cascade when the citizen drops a pin on the
  // map. `GeoLocations.fetchAddress` runs `resolveWard` (turf
  // point-in-polygon against the bundled Nairobi-wards GeoJSON) and
  // writes the matching ward into `formData.GeoLocationsPoint.ward`.
  // We watch that field and set the County / Sub-County / Ward
  // dropdowns to the matching tree path, then call onSelect with the
  // deepest node so `formData.SelectedBoundary` is the ward — which is
  // what the submit pipeline reads (utils/index.js).
  //
  // Lenient match: the GeoJSON ships ward codes like `KILIMANI` while
  // the live boundary tree uses `NAIROBI_CITY_KILIMANI`. We accept
  // either, plus a name-based fallback (`Kangemi` ≈ `KANGEMI`). If no
  // match (pin outside any seeded ward, or GeoJSON / boundary-tree
  // drift) we silently leave the cascade alone — the user can still
  // pick manually.
  const wardHintCode = formData?.GeoLocationsPoint?.ward?.code;
  const wardHintName = formData?.GeoLocationsPoint?.ward?.name;
  useEffect(() => {
    if (!wardHintCode && !wardHintName) return;
    if (!childrenData || childrenData.length === 0) return;
    const path = findWardPath(childrenData[0]?.boundary, wardHintCode, wardHintName);
    if (!path || path.length === 0) return;

    // Rebuild the cascade state in one go: every level's selection +
    // every level's option list (so child dropdowns are populated
    // correctly without the user having to click through).
    const newSelectedValues = {};
    const newValue = {};
    let levelOptions = childrenData[0]?.boundary || [];
    for (const node of path) {
      newSelectedValues[node.boundaryType] = node;
      newValue[node.boundaryType] = levelOptions;
      levelOptions = node.children || [];
    }
    setSelectedValues(newSelectedValues);
    setValue((prev) => ({ ...prev, ...newValue }));

    // The deepest hit (typically Ward) is what SelectedBoundary should
    // hold — that's the leaf the routing payload uses.
    onSelect(config.key, path[path.length - 1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wardHintCode, wardHintName, childrenData]);

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
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
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
                fieldKey={key}
                label={`${t(`${hierarchyType}_${key?.toUpperCase()}`)}`}
                data={value[key]}
                onChange={(selectedValue) => handleSelection(selectedValue)}
                selected={formData?.locality || formData?.SelectedBoundary ? selectedValues[key] : null}
              />
            );
          }
          return null;
        })}
    </div>
  );
};

/**
 * BoundaryDropdown — uses the v2 Select so the boundary cascade matches
 * the rest of the modernized form chrome (theme placeholder color,
 * yellow-tint hover, no list-bullet padding). The boundary objects
 * carry through onChange unchanged so the parent's cascade logic /
 * SelectedBoundary payload stays byte-identical to the legacy.
 */
const BoundaryDropdown = ({ label, data, onChange, selected, fieldKey }) => {
  const { t } = useTranslation();
  const id = `boundary-${(fieldKey || label || "field").toString().toLowerCase().replace(/\s+/g, "-")}`;
  const options = (data || []).map((node) => ({
    value: node.code,
    label: t(node.code) || node.code,
  }));
  return (
    <V2Field label={t(label)} required htmlFor={id}>
      <V2Select
        id={id}
        value={selected?.code}
        onValueChange={(code) => {
          const picked = data.find((n) => n.code === code);
          if (picked) onChange(picked);
        }}
        options={options}
        placeholder={t("CS_COMMON_SELECT") === "CS_COMMON_SELECT" ? `Select ${t(label)}` : t("CS_COMMON_SELECT")}
      />
    </V2Field>
  );
};

/**
 * Walk the boundary tree and return the path (root → … → ward) whose
 * leaf matches the GeoJSON-resolved hint. Returns null if nothing
 * matches.
 *
 * Match strategy (in priority order, all case-insensitive):
 *   1. Exact code match.
 *   2. Suffix code match — boundary tree codes are typically prefixed
 *      with the tenant (`NAIROBI_CITY_KANGEMI`) while the GeoJSON
 *      ships bare codes (`KANGEMI`). Accepting `code.endsWith('_' +
 *      hint)` covers the common case.
 *   3. Name match against the hint name normalized to UPPER_SNAKE.
 *      Handles future GeoJSON versions that ship display names but no
 *      code field.
 *
 * Only matches nodes whose `boundaryType === 'Ward'`. Sub-county /
 * county hints aren't useful here because the GeoJSON gives us the
 * leaf ward; the parents are derived by walking up the path.
 */
function findWardPath(roots, hintCode, hintName) {
  const normCode = String(hintCode || '').toUpperCase();
  const normName = String(hintName || '').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (!normCode && !normName) return null;
  const isMatch = (node) => {
    if (node.boundaryType !== 'Ward') return false;
    const code = String(node.code || '').toUpperCase();
    if (normCode && (code === normCode || code.endsWith('_' + normCode))) return true;
    if (normName && (code === normName || code.endsWith('_' + normName))) return true;
    return false;
  };
  const walk = (node, trail) => {
    const next = [...trail, node];
    if (isMatch(node)) return next;
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        const found = walk(child, next);
        if (found) return found;
      }
    }
    return null;
  };
  for (const root of roots || []) {
    const found = walk(root, []);
    if (found) return found;
  }
  return null;
}

export default BoundaryComponent;