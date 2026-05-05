/* eslint-disable @typescript-eslint/no-explicit-any */
// Citizen sidebar — v2 (TypeScript + Tailwind).
//
// Replaces the legacy `<StaticCitizenSideBar>` end-to-end so the citizen
// nav rail no longer needs CSS patches in overrides.css. Same data
// (UserService, MDMS link data, helpline number) drives the rendering;
// the markup is a clean accessible <aside> with one row per nav target.

import * as React from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useHistory } from "react-router-dom";
import { Home, Pencil, LogOut, Phone, AlertOctagon, LogIn } from "lucide-react";
import { cn } from "../../lib/cn";

declare const Digit: any;
declare const window: any;

type ItemKind = "link" | "external" | "action";

interface NavItem {
  kind: ItemKind;
  /** Lucide icon. Optional — falls back to AlertOctagon if a tenant link
   *  doesn't carry an icon. */
  Icon?: React.ComponentType<{ className?: string }>;
  text: React.ReactNode;
  link?: string;
  onClick?: () => void;
}

interface ProfileInfo {
  name?: string;
  mobileNumber?: string;
  emailId?: string;
}

export interface CitizenSidebarProps {
  /** MDMS-driven link blocks for tenant modules (e.g. Citizen Complaint Resolution). */
  linkData?: Record<string, Array<{ sidebar?: string; sidebarURL?: string; leftIcon?: string }>> | null;
  /** Skeleton suppression while link data loads. */
  isLoading?: boolean;
  /** Defaults to `window.contextPath`. Exposed for tests / non-default mounts. */
  contextPath?: string;
}

function Avatar({ name }: { name?: string }) {
  const initial = (name || "").trim().charAt(0).toUpperCase() || null;
  return (
    <div
      className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground"
      style={{ backgroundColor: "var(--color-grey-mid, #eeeeee)" }}
      aria-hidden
    >
      {initial ? (
        <span style={{ fontSize: "1.75rem", fontWeight: 600 }}>{initial}</span>
      ) : (
        <svg viewBox="0 0 80 80" fill="currentColor" className="h-12 w-12 opacity-40">
          <circle cx="40" cy="32" r="14" />
          <path d="M12 70c0-15 13-24 28-24s28 9 28 24" />
        </svg>
      )}
    </div>
  );
}

function Profile({ info }: { info: ProfileInfo }) {
  return (
    <div
      className="flex flex-col items-center gap-1 px-4 pb-4 pt-5 text-center"
      style={{ borderBottom: "1px solid var(--color-border, #d6d5d4)" }}
    >
      <Avatar name={info?.name} />
      {info?.name && info?.name !== info?.mobileNumber ? (
        <div className="mt-2 text-sm font-semibold leading-snug">{info.name}</div>
      ) : null}
      {info?.mobileNumber ? (
        <div className="text-xs" style={{ color: "var(--color-text-secondary, #505a5f)" }}>
          {info.mobileNumber}
        </div>
      ) : null}
      {info?.emailId ? (
        <div className="text-xs" style={{ color: "var(--color-text-secondary, #505a5f)" }}>
          {info.emailId}
        </div>
      ) : null}
    </div>
  );
}

export function CitizenSidebar({
  linkData,
  isLoading,
  contextPath: cp,
}: CitizenSidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const history = useHistory();

  const contextPath = cp ?? window?.contextPath ?? "digit-ui";
  const user = Digit?.UserService?.getUser?.();
  const { data: storeData } = Digit?.Hooks?.useStore?.getInitData?.() ?? { data: undefined };
  const tenantId = Digit?.ULBService?.getCurrentTenantId?.();
  const tenants: any[] = storeData?.tenants ?? [];
  const helplineNumber =
    (tenants.find((tnt) => tnt.code === tenantId) ?? tenants[0])?.contactNumber;

  // Module links from MDMS (e.g. Citizen Complaint Resolution).
  const moduleLinks: NavItem[] = React.useMemo(() => {
    if (!linkData) return [];
    return Object.keys(linkData)
      .sort((a, b) => b.localeCompare(a))
      .flatMap((key) => {
        const entry = linkData[key]?.[0];
        if (!entry || entry.sidebar !== `${contextPath}-links`) return [];
        const isInternal = !!entry.sidebarURL?.includes(contextPath);
        return [
          {
            kind: isInternal ? ("link" as ItemKind) : ("external" as ItemKind),
            Icon: AlertOctagon,
            text: t(
              `ACTION_TEST_${Digit?.Utils?.locale?.getTransformedLocale?.(key) ?? key}`
            ),
            link: entry.sidebarURL,
          },
        ];
      });
  }, [linkData, contextPath, t]);

  const isLoggedInCitizen = !!user?.access_token && user?.info?.type === "CITIZEN";

  const items: NavItem[] = React.useMemo(() => {
    if (isLoggedInCitizen) {
      return [
        {
          kind: "link",
          Icon: Home,
          text: t("COMMON_BOTTOM_NAVIGATION_HOME"),
          link: `/${contextPath}/citizen`,
          onClick: () => history.push(`/${contextPath}/citizen/all-services`),
        },
        ...moduleLinks,
        {
          kind: "action",
          Icon: Pencil,
          text: t("EDIT_PROFILE"),
          onClick: () => history.push(`/${contextPath}/citizen/user/profile`),
        },
        {
          kind: "action",
          Icon: LogOut,
          text: t("CORE_COMMON_LOGOUT"),
          onClick: () => Digit?.UserService?.logout?.(),
        },
        {
          kind: "action",
          Icon: Phone,
          text: (
            <span className="flex flex-col items-start gap-0.5">
              <span>{t("CS_COMMON_HELPLINE")}</span>
              {helplineNumber ? (
                <a
                  href={`tel:${helplineNumber}`}
                  className="text-xs"
                  style={{ color: "var(--color-link-normal, #1d70b8)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {helplineNumber}
                </a>
              ) : null}
            </span>
          ),
        },
      ];
    }
    return [
      ...moduleLinks,
      {
        kind: "action",
        Icon: LogIn,
        text: t("CORE_COMMON_LOGIN"),
        onClick: () => history.push(`/${contextPath}/citizen/login`),
      },
      {
        kind: "action",
        Icon: Phone,
        text: t("CS_COMMON_HELPLINE"),
      },
    ];
  }, [isLoggedInCitizen, t, history, contextPath, moduleLinks, helplineNumber]);

  if (isLoading) {
    return (
      <aside
        className="v2-scope hidden md:flex flex-col"
        style={{
          width: "260px",
          height:
            "calc(100vh - var(--v2-topbar-height, 56px) - var(--v2-page-footer-height, 56px))",
          backgroundColor:
            "var(--v2-surface-color, var(--color-surface, #ffffff))",
          borderRight: "1px solid var(--color-border, #d6d5d4)",
          zIndex: 10,
        }}
      >
        <div className="m-4 h-20 w-20 self-center rounded-full bg-muted animate-pulse" />
        <div className="m-2 space-y-2 px-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-9 rounded-md bg-muted/50 animate-pulse" />
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="v2-scope hidden md:flex flex-col"
      style={{
        width: "260px",
        height:
          "calc(100vh - var(--v2-topbar-height, 56px) - var(--v2-page-footer-height, 56px))",
        backgroundColor:
          "var(--v2-surface-color, var(--color-surface, #ffffff))",
        borderRight: "1px solid var(--color-border, #d6d5d4)",
        zIndex: 10,
      }}
    >
      {isLoggedInCitizen ? <Profile info={user.info} /> : null}
      <nav
        className="flex flex-col flex-1 overflow-y-auto"
        style={{ padding: "8px", gap: "1px" }}
        aria-label={t("CORE_COMMON_NAVIGATION") || "Sidebar navigation"}
      >
        {items.map((item, i) => {
          const isActive =
            item.link &&
            (location.pathname === item.link ||
              location.pathname === item.link + "/");

          const inner = (
            <>
              {isActive ? (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 6,
                    bottom: 6,
                    width: 3,
                    borderRadius: "0 3px 3px 0",
                    backgroundColor:
                      "var(--color-primary-1, var(--color-primary-main, #c84c0e))",
                  }}
                />
              ) : null}
              {item.Icon ? (
                <item.Icon
                  className="h-5 w-5 flex-shrink-0"
                  // Active rows tint the icon to brand; otherwise inherit current text.
                  style={
                    isActive
                      ? {
                          color:
                            "var(--color-primary-1, var(--color-primary-main, #c84c0e))",
                        }
                      : undefined
                  }
                />
              ) : null}
              <span
                className="flex-1 text-sm"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  wordBreak: "break-word",
                  lineHeight: 1.25,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive
                    ? "var(--color-primary-1, var(--color-primary-main, #c84c0e))"
                    : "var(--color-text-heading, #363636)",
                }}
              >
                {item.text}
              </span>
            </>
          );

          const rowStyle: React.CSSProperties = {
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "6px 12px",
            minHeight: "36px",
            borderRadius: "6px",
            transition: "background-color 0.15s ease-out",
            textDecoration: "none",
            backgroundColor: isActive
              ? "var(--color-primary-selected-bg, #FBEEE8)"
              : "transparent",
            cursor: "pointer",
          };

          const onMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
            if (!isActive) {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                "var(--color-primary-1-bg, var(--color-primary-selected-bg, #FBEEE8))";
            }
          };
          const onMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
            if (!isActive) {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                "transparent";
            }
          };

          if (item.kind === "link" && item.link) {
            return (
              <Link
                key={i}
                to={item.link}
                onClick={item.onClick}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                style={rowStyle}
              >
                {inner}
              </Link>
            );
          }
          if (item.kind === "external" && item.link) {
            return (
              <a
                key={i}
                href={item.link}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                style={rowStyle}
              >
                {inner}
              </a>
            );
          }
          return (
            <button
              key={i}
              type="button"
              onClick={item.onClick}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              style={{ ...rowStyle, border: 0, background: rowStyle.backgroundColor, textAlign: "left" }}
            >
              {inner}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
