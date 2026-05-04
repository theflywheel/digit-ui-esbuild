import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { PopUp, Timeline, TimelineMolecule, Loader } from '@egovernments/digit-ui-components';
import { useMyContext } from "../utils/context";
import { convertEpochFormateToDate } from '../utils';

const TimelineWrapper = ({ businessId, isWorkFlowLoading, workflowData, labelPrefix = "" }) => {
    const { state } = useMyContext();
    const { t } = useTranslation();

    const tenantId = Digit.ULBService.getCurrentTenantId();

    // Manage timeline data
    const [timelineSteps, setTimelineSteps] = useState([]);

    useEffect(() => {
        if (workflowData && workflowData.ProcessInstances) {
            // ASSIGN and REASSIGN both move the complaint to a new assignee,
            // so the timeline row should show that assignee (instance.assignes[0])
            // not the actor who performed the action (instance.assigner).
            const isAssigningAction = (action) => action === "ASSIGN" || action === "REASSIGN";

            const formatPerson = (person) => {
                if (!person?.name) return null;
                const roleLabel = person?.roles
                    ?.map(role => t(Digit.Utils.locale.getTransformedLocale(`ACCESSCONTROL_ROLES_ROLES_${role.code}`)))
                    .join(", ");
                return roleLabel ? `${person.name} - ${roleLabel}` : person.name;
            };

            // Map API response to timeline steps
            const steps = workflowData.ProcessInstances.map((instance, index) => {
                const assignee = instance?.assignes?.[0];
                const personRecord = isAssigningAction(instance?.action) ? assignee : instance?.assigner;
                const personLine = formatPerson(personRecord);
                const mobile = isAssigningAction(instance?.action) ? assignee?.mobileNumber : instance?.assigner?.mobileNumber;
                const contactLine = mobile ? `${t("ES_COMMON_CONTACT_DETAILS")}: ${mobile}` : null;

                return {
                    label: t(`${labelPrefix}${instance?.action}`),
                    variant: 'completed',
                    subElements: [
                        convertEpochFormateToDate(instance?.auditDetails?.lastModifiedTime),
                        personLine,
                        contactLine,
                        instance?.comment && `${t('CS_COMMON_EMPLOYEE_COMMENTS')} : "${instance.comment}"`,
                    ].filter(Boolean),
                    showConnector: true,
                };
            });
            setTimelineSteps(steps);
        }
    }, [workflowData]);

    return (
        isWorkFlowLoading ? <Loader /> :
            <TimelineMolecule key="timeline" initialVisibleCount={4} hidePastLabel={timelineSteps.length < 5}>
                {timelineSteps.map((step, index) => (
                    <Timeline
                        key={index}
                        label={step.label}
                        subElements={step.subElements}
                        variant={step.variant}
                        showConnector={step.showConnector}
                    />
                ))}
            </TimelineMolecule>
    );
};

export default TimelineWrapper;
