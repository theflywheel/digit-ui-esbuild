import { useQuery, useQueryClient } from "react-query";
import { useMemo } from "react";
import { Request } from "@egovernments/digit-ui-libraries";

/**
 * usePGRInboxSearch — Custom hook for InboxSearchComposer.
 *
 * Calls PGR search API, then batch-fetches workflow data for the results,
 * and merges them into the shape the inbox table columns expect
 * ({businessObject: {service}, ProcessInstance, serviceSla}).
 */
const usePGRInboxSearch = (reqCriteria) => {
  const client = useQueryClient();
  const { url, params = {}, body = {}, config = {} } = reqCriteria;
  const stableParams = useMemo(() => JSON.stringify(params), [params]);

  const fetchData = async () => {
    // 1. Call PGR search
    const pgrResponse = await Request({
      url,
      method: "POST",
      auth: true,
      userService: true,
      useCache: false,
      params,
    });
    const wrappers = pgrResponse?.ServiceWrappers || [];

    if (wrappers.length === 0) {
      return { items: [], totalCount: 0, statusMap: [] };
    }

    // 2. Batch-fetch workflow data
    const businessIds = wrappers
      .map((sw) => sw.service?.serviceRequestId)
      .filter(Boolean)
      .join(",");
    const tenantId = params.tenantId || Digit.ULBService.getCurrentTenantId();

    let wfMap = {};
    if (businessIds) {
      try {
        const wfResponse = await Digit.WorkflowService.getByBusinessId(
          tenantId,
          businessIds,
          {},
          false
        );
        (wfResponse?.ProcessInstances || []).forEach((pi) => {
          wfMap[pi.businessId] = pi;
        });
      } catch (e) {
        console.error("PGR inbox: workflow fetch failed", e);
      }
    }

    // 3. Merge into inbox-compatible shape
    return {
      items: wrappers.map((sw) => {
        const pi = wfMap[sw.service?.serviceRequestId] || {};
        const slaDays =
          pi.businesssServiceSla != null
            ? Math.round(pi.businesssServiceSla / (24 * 60 * 60 * 1000))
            : null;
        return {
          businessObject: { service: sw.service, serviceSla: slaDays },
          ProcessInstance: pi,
        };
      }),
      totalCount: wrappers.length,
      statusMap: [],
    };
  };

  const queryKey = useMemo(
    () => ["pgrInboxSearch", url, stableParams],
    [url, stableParams]
  );

  const { isLoading, data, isFetching, refetch, error } = useQuery(
    queryKey,
    fetchData,
    {
      enabled: config.enabled !== false,
      cacheTime: 0,
      staleTime: 0,
      keepPreviousData: true,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  return {
    isLoading,
    isFetching,
    data,
    refetch,
    error,
    revalidate: () => client.invalidateQueries(queryKey),
  };
};

export default usePGRInboxSearch;
