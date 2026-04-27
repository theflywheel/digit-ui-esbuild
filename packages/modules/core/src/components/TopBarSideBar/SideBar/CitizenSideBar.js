// import { NavBar } from "@egovernments/digit-ui-react-components";
import { Loader } from "@egovernments/digit-ui-components";
import React, { useState, Fragment, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useHistory, useLocation } from "react-router-dom";
import ChangeCity from "../../ChangeCity";
import { defaultImage } from "../../utils";
import { Hamburger } from "@egovernments/digit-ui-components";
import {
  HomeIcon,
  EditPencilIcon,
  LogoutIcon,
  PropertyHouse,
  CaseIcon,
  CollectionIcon,
  PTIcon,
  OBPSIcon,
  PGRIcon,
  FSMIcon,
  WSICon,
  MCollectIcon,
  Phone,
  BirthIcon,
  DeathIcon,
  FirenocIcon,
} from "@egovernments/digit-ui-react-components";
import ImageComponent from "../../ImageComponent";
import LogoutDialog from "../../Dialog/LogoutDialog";
import SideBarMenu from "../../../config/sidebar-menu";

/*
 * Nairobi desktop sidebar tokens — fall back to literal hex when the
 * `feat/nairobi-overhaul-citizen` token-rebind branch hasn't shipped the
 * CSS vars yet (this branch is based on `main`, where the vars are absent).
 */
const NAIROBI_SIDEBAR_BG =
  "var(--color-shell-main, var(--color-digitv2-header-sidenav, #204F37))";
const NAIROBI_LABEL_COLOR = "var(--color-paper, #FFFFFF)";
const NAIROBI_HOVER_BG = "rgba(255, 255, 255, 0.08)";
const NAIROBI_ACTIVE_BORDER =
  "var(--color-cta-main, var(--color-primary-main, #FEC931))";
const NAIROBI_ACTIVE_BG = "rgba(255, 244, 214, 0.10)";
const DESKTOP_SIDEBAR_WIDTH = 240;

const SidebarIconsObject = {
  CommonPTIcon: <PTIcon className="icon" />,
  OBPSIcon: <OBPSIcon className="icon" />,
  propertyIcon: <PropertyHouse className="icon" />,
  TLIcon: <CaseIcon className="icon" />,
  PGRIcon: <PGRIcon className="icon" />,
  FSMIcon: <FSMIcon className="icon" />,
  WSIcon: <WSICon className="icon" />,
  MCollectIcon: <MCollectIcon className="icon" />,
  BillsIcon: <CollectionIcon className="icon" />,
  BirthIcon: <BirthIcon className="icon" />,
  DeathIcon: <DeathIcon className="icon" />,
  FirenocIcon: <FirenocIcon className="icon" />,
  HomeIcon: <HomeIcon className="icon" />,
  EditPencilIcon: <EditPencilIcon className="icon" />,
  LogoutIcon: <LogoutIcon className="icon" />,
  Phone: <Phone className="icon" />,
};

const DesktopProfile = ({ info }) => {
  const [profilePic, setProfilePic] = React.useState(null);
  React.useEffect(() => {
    const tenant = Digit.ULBService.getCurrentTenantId();
    const uuid = info?.uuid;
    let cancelled = false;
    if (uuid) {
      Digit.UserService.userSearch(tenant, { uuid: [uuid] }, {})
        .then((usersResponse) => {
          if (cancelled) return;
          if (usersResponse && usersResponse.user && usersResponse?.user?.length) {
            const userDetails = usersResponse.user[0];
            const thumbs = userDetails?.photo?.split(",");
            setProfilePic(thumbs?.at(0));
          }
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [info?.uuid]);

  return (
    <div
      className="profile-section nairobi-desktop-profile"
      style={{
        backgroundColor: "transparent",
        paddingTop: 24,
        paddingBottom: 16,
      }}
    >
      <div className="imageloader imageloader-loaded">
        <ImageComponent
          className="img-responsive img-circle img-Profile"
          src={profilePic ? profilePic : defaultImage}
          style={{ objectFit: "cover", objectPosition: "center" }}
          alt="Profile Image"
        />
      </div>
      {info?.name && info?.name !== info?.mobileNumber && (
        <div id="profile-name" className="label-container name-Profile">
          <div className="label-text" style={{ color: NAIROBI_LABEL_COLOR }}>
            {" "}
            {info.name}{" "}
          </div>
        </div>
      )}
      {info?.mobileNumber && (
        <div id="profile-location" className="label-container loc-Profile">
          <div
            className="label-text"
            style={{ color: NAIROBI_LABEL_COLOR, opacity: 0.8 }}
          >
            {" "}
            {info.mobileNumber}{" "}
          </div>
        </div>
      )}
      {info?.emailId && (
        <div id="profile-emailid" className="label-container loc-Profile">
          <div
            className="label-text"
            style={{ color: NAIROBI_LABEL_COLOR, opacity: 0.8 }}
          >
            {" "}
            {info.emailId}{" "}
          </div>
        </div>
      )}
      <div
        className="profile-divider"
        style={{
          borderTopColor: "rgba(255, 255, 255, 0.16)",
        }}
      ></div>
    </div>
  );
};

const DesktopMenuItem = ({ item, isActive }) => {
  const [hover, setHover] = useState(false);
  const leftIconArray = item?.icon || item?.icon?.type?.name;
  const leftIcon = leftIconArray
    ? SidebarIconsObject[leftIconArray]
    : SidebarIconsObject.BillsIcon;
  const itemContent = item.type === "component" ? item.action : item.text;

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    paddingLeft: isActive ? 12 : 16,
    minHeight: 48,
    cursor: "pointer",
    color: NAIROBI_LABEL_COLOR,
    fontSize: 16,
    lineHeight: "20px",
    textDecoration: "none",
    borderLeft: isActive
      ? `4px solid ${NAIROBI_ACTIVE_BORDER}`
      : "4px solid transparent",
    backgroundColor: isActive
      ? NAIROBI_ACTIVE_BG
      : hover
      ? NAIROBI_HOVER_BG
      : "transparent",
    transition: "background-color 150ms ease",
  };

  const iconStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 21,
    height: 21,
    color: NAIROBI_LABEL_COLOR,
    fill: NAIROBI_LABEL_COLOR,
    flexShrink: 0,
  };

  const labelStyle = {
    color: NAIROBI_LABEL_COLOR,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const Inner = (
    <span
      className="menu-item nairobi-menu-item"
      style={rowStyle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...item.populators}
    >
      <span className="icon" style={iconStyle}>
        {leftIcon}
      </span>
      <span className="menu-label" style={labelStyle}>
        {itemContent}
      </span>
    </span>
  );

  if (item.type === "external-link") {
    return (
      <a href={item.link} style={{ textDecoration: "none" }}>
        {Inner}
      </a>
    );
  }
  if (item.type === "link" && item?.link) {
    return (
      <Link to={item.link} style={{ textDecoration: "none" }}>
        {Inner}
      </Link>
    );
  }
  return Inner;
};

/*
 * Desktop fixed-rail sidebar — replaces the legacy `StaticCitizenSideBar`.
 * Reuses the same `SideBarMenu` config + `linkData` data flow so the
 * rendered items match the legacy component byte-for-byte; only the
 * presentation switches to Nairobi tokens.
 */
const DesktopCitizenSideBar = ({ linkData, islinkDataLoading, onLogout }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const { pathname } = location;
  const { data: storeData, isFetched } = Digit.Hooks.useStore.getInitData();
  const user = Digit.UserService.getUser();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [showDialog, setShowDialog] = useState(false);

  const handleLogout = () => {
    if (typeof onLogout === "function") {
      onLogout();
      return;
    }
    setShowDialog(true);
  };
  const handleOnSubmit = () => {
    Digit.UserService.logout();
    setShowDialog(false);
    window.location.href = `/${window?.contextPath}/citizen/login`;
  };
  const handleOnCancel = () => setShowDialog(false);

  if (islinkDataLoading) {
    return <Loader />;
  }

  const redirectToLoginPage = () => {
    history.push(`/${window?.contextPath}/citizen/login`);
  };
  const showProfilePage = () => {
    history.push(`/${window?.contextPath}/citizen/user/profile`);
  };
  const closeSidebar = () => {
    history.push(`/${window?.contextPath}/citizen/all-services`);
  };

  let menuItems = [...SideBarMenu(t, showProfilePage, redirectToLoginPage, false)];
  menuItems = menuItems.filter((item) => item.element !== "LANGUAGE");

  let profileItem;
  if (isFetched && user && user.access_token && user?.info?.type === "CITIZEN") {
    profileItem = <DesktopProfile info={user?.info} />;
    menuItems = menuItems.filter((item) => item?.id !== "login-btn");
    menuItems = [
      ...menuItems,
      {
        type: "link",
        icon: "HomeIcon",
        element: "HOME",
        text: t("COMMON_BOTTOM_NAVIGATION_HOME"),
        link: `/${window?.contextPath}/citizen`,
        populators: { onClick: closeSidebar },
      },
      {
        text: t("EDIT_PROFILE"),
        element: "PROFILE",
        icon: "EditPencilIcon",
        populators: { onClick: showProfilePage },
      },
      {
        text: t("CORE_COMMON_LOGOUT"),
        element: "LOGOUT",
        icon: "LogoutIcon",
        populators: { onClick: handleLogout },
      },
      {
        text: (() => {
          const helplineNumber = (
            storeData?.tenants?.find((tenant) => tenant.code === tenantId) ||
            storeData?.tenants?.[0]
          )?.contactNumber;
          return (
            <React.Fragment>
              {t("CS_COMMON_HELPLINE")}
              {helplineNumber && (
                <div className="telephone" style={{ marginTop: "-10%" }}>
                  <div className="link">
                    <a
                      href={`tel:${helplineNumber}`}
                      style={{ color: NAIROBI_LABEL_COLOR }}
                    >
                      {helplineNumber}
                    </a>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })(),
        element: "Helpline",
        icon: "Phone",
      },
    ];
  }

  Object.keys(linkData || {})
    ?.sort((x, y) => y.localeCompare(x))
    ?.map((key) => {
      if (linkData[key][0]?.sidebar === `${window.contextPath}-links`) {
        menuItems.splice(1, 0, {
          type: linkData[key][0]?.sidebarURL?.includes(window?.contextPath)
            ? "link"
            : "external-link",
          text: t(`ACTION_TEST_${Digit.Utils.locale.getTransformedLocale(key)}`),
          links: linkData[key],
          icon: linkData[key][0]?.leftIcon,
          link: linkData[key][0]?.sidebarURL,
        });
      }
    });

  return (
    <React.Fragment>
      <div
        className="nairobi-desktop-sidebar"
        style={{
          display: "flex",
          flexDirection: "column",
          width: DESKTOP_SIDEBAR_WIDTH,
          minWidth: DESKTOP_SIDEBAR_WIDTH,
          backgroundColor: NAIROBI_SIDEBAR_BG,
          height: "auto",
          minHeight: "100%",
          zIndex: 99,
        }}
      >
        {profileItem}
        <div
          className="drawer-desktop nairobi-drawer-desktop"
          style={{ overflow: "auto", paddingTop: 8, paddingBottom: 16 }}
        >
          {menuItems?.map((item, index) => {
            const isActive =
              !!item?.link &&
              (pathname === item.link || pathname === item.sidebarURL);
            return (
              <div
                className={`sidebar-list ${isActive ? "active" : ""}`}
                key={index}
              >
                <DesktopMenuItem item={item} isActive={isActive} />
              </div>
            );
          })}
        </div>
      </div>
      {showDialog && (
        <LogoutDialog
          onSelect={handleOnSubmit}
          onCancel={handleOnCancel}
          onDismiss={handleOnCancel}
        />
      )}
    </React.Fragment>
  );
};

const Profile = ({ info, stateName, t }) => {
  const [profilePic, setProfilePic] = React.useState(null);
  React.useEffect(async () => {
    const tenant = Digit.ULBService.getCurrentTenantId();
    const uuid = info?.uuid;
    if (uuid) {
      const usersResponse = await Digit.UserService.userSearch(tenant, { uuid: [uuid] }, {});
      if (usersResponse && usersResponse.user && usersResponse?.user?.length) {
        const userDetails = usersResponse.user[0];
        const thumbs = userDetails?.photo?.split(",");
        setProfilePic(thumbs?.at(0));
      }
    }
  }, [profilePic !== null]);

  const CustomEmployeeTopBar = Digit.ComponentRegistryService?.getComponent("CustomEmployeeTopBar");

  return (
    <div className="profile-section">
      <div className="imageloader imageloader-loaded">
        <ImageComponent
          className="img-responsive img-circle img-Profile"
          src={profilePic ? profilePic : defaultImage}
          style={{ objectFit: "cover", objectPosition: "center" }}
          alt="Profile Image"
        />
      </div>
      {info?.name && info?.name !== info?.mobileNumber && (
        <div id="profile-name" className="label-container name-Profile">
          <div className="label-text"> {info.name} </div>
        </div>
      )}
      <div id="profile-location" className="label-container loc-Profile">
        <div className="label-text"> {info?.mobileNumber} </div>
      </div>
      {info?.emailId && (
        <div id="profile-emailid" className="label-container loc-Profile">
          <div className="label-text"> {info.emailId} </div>
        </div>
      )}
      <div className="profile-divider"></div>
      {window.location.href.includes("/employee") &&
        !window.location.href.includes("/employee/user/login") &&
        !window.location.href.includes("employee/user/language-selection") &&
        !CustomEmployeeTopBar && <ChangeCity t={t} mobileView={true} />}
    </div>
  );
};

/* 
Feature :: Citizen Webview sidebar
*/
export const CitizenSideBar = ({
  isOpen,
  isMobile = false,
  toggleSidebar,
  onLogout,
  isEmployee = false,
  linkData,
  islinkDataLoading,
  userProfile,
}) => {
  const isMultiRootTenant = Digit.Utils.getMultiRootTenant();
  const { data: storeData, isFetched } = Digit.Hooks.useStore.getInitData();
  const selectedLanguage = Digit.StoreData.getCurrentLanguage();
  const [profilePic, setProfilePic] = useState(null);
  const { languages, stateInfo } = storeData || {};
  const user = Digit.UserService.getUser();
  const [search, setSearch] = useState("");
  const [dropDownData, setDropDownData] = useState(null);
  const [selectCityData, setSelectCityData] = useState([]);
  const [selectedCity, setSelectedCity] = useState([]); //selectedCities?.[0]?.value
  const [selected, setselected] = useState(selectedLanguage);
  let selectedCities = [];
  const { isLoading, data } = Digit.Hooks.useAccessControl();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { t } = useTranslation();
  const history = useHistory();

  const stringReplaceAll = (str = "", searcher = "", replaceWith = "") => {
    if (searcher == "") return str;
    while (str?.includes(searcher)) {
      str = str?.replace(searcher, replaceWith);
    }
    return str;
  };

  useEffect(() => {
    const userloggedValues = Digit.SessionStorage.get("citizen.userRequestObject");
    let teantsArray = [],
      filteredArray = [];
    userloggedValues?.info?.roles?.forEach((role) => teantsArray.push(role.tenantId));
    let unique = teantsArray.filter((item, i, ar) => ar.indexOf(item) === i);
    unique?.forEach((uniCode) => {
      filteredArray.push({
        label: t(`TENANT_TENANTS_${stringReplaceAll(uniCode, ".", "_")?.toUpperCase()}`),
        value: uniCode,
      });
    });
    selectedCities = filteredArray?.filter((select) => select.value == Digit.SessionStorage.get("Employee.tenantId"));
    setSelectCityData(filteredArray);
  }, [dropDownData]);

  const closeSidebar = () => {
    Digit.clikOusideFired = true;
    toggleSidebar(false);
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      const tenant = Digit.ULBService.getCurrentTenantId();
      const uuid = user?.info?.uuid;
      if (uuid) {
        const usersResponse = await Digit.UserService.userSearch(tenant, { uuid: [uuid] }, {});
        const userData = usersResponse?.user?.[0];
        if (userData) {
          const currentUser = Digit.UserService.getUser();
          Digit.UserService.setUser({
            ...currentUser,
            info: userData
          });
        }
        if (usersResponse && usersResponse.user && usersResponse?.user?.length) {
          const userDetails = usersResponse.user[0];
          const thumbs = userDetails?.photo?.split(",");
          setProfilePic(thumbs?.at(0));
        }
      }
    };
    if (!profilePic) {
      fetchUserProfile();
    }
  }, [profilePic]);

  const handleChangeCity = (city) => {
    const loggedInData = Digit.SessionStorage.get("citizen.userRequestObject");
    const filteredRoles = Digit.SessionStorage.get("citizen.userRequestObject")?.info?.roles?.filter((role) => role.tenantId === city.value);
    if (filteredRoles?.length > 0) {
      loggedInData.info.roles = filteredRoles;
      loggedInData.info.tenantId = city?.value;
    }
    Digit.SessionStorage.set("Employee.tenantId", city?.value);
    Digit.UserService.setUser(loggedInData);
    setDropDownData(city);
    if (window.location.href.includes(`/${window?.contextPath}/employee/`)) {
      const redirectPath = location.state?.from || `/${window?.contextPath}/employee`;
      history.replace(redirectPath);
    }
    window.location.reload();
  };

  const handleChangeLanguage = (language) => {
    setselected(language.value);
    Digit.LocalizationService.changeLanguage(language.value, stateInfo.code);
  };

  const handleModuleClick = (url) => {
    let updatedUrl = null;
    if (Digit.Utils.getMultiRootTenant()) {
      updatedUrl = isEmployee
        ? url.replace("/sandbox-ui/employee", `/sandbox-ui/${tenantId}/employee`)
        : url.replace("/sandbox-ui/citizen", `/sandbox-ui/${tenantId}/citizen`);
      history.push(updatedUrl);
      toggleSidebar();
    } else {
      url[0] === "/"
        ? history.push(`/${window?.contextPath}/${isEmployee ? "employee" : "citizen"}${url}`)
        : history.push(`/${window?.contextPath}/${isEmployee ? "employee" : "citizen"}/${url}`);
      toggleSidebar();
    }
  };

  const redirectToLoginPage = () => {
    if (isEmployee) {
      history.push(`/${window?.contextPath}/employee/user/language-selection`);
    } else {
      history.push(`/${window?.contextPath}/citizen/login`);
    }
    closeSidebar();
  };

  if (islinkDataLoading || isLoading) {
    return <Loader />;
  }

  let menuItems = [
    {
      id: "login-btn",
      element: "LOGIN",
      text: t("CORE_COMMON_LOGIN"),
      icon: <LogoutIcon className="icon" />,
      populators: {
        onClick: redirectToLoginPage,
      },
    },
  ];

  let profileItem;
  if (isFetched && user && user.access_token) {
    profileItem = <Profile info={user?.info} stateName={stateInfo?.name} t={t} />;
    menuItems = menuItems.filter((item) => item?.id !== "login-btn");
  }

  let configEmployeeSideBar = {};

  if (!isEmployee) {
    Object.keys(linkData)
      ?.sort((x, y) => y.localeCompare(x))
      ?.map((key) => {
        if (linkData[key][0]?.sidebar === "digit-ui-links")
          menuItems.splice(1, 0, {
            type: linkData[key][0]?.sidebarURL?.includes(window?.contextPath) ? "link" : "external-link",
            text: t(`ACTION_TEST_${Digit.Utils.locale.getTransformedLocale(key)}`),
            links: linkData[key],
            icon: linkData[key][0]?.leftIcon,
            link: linkData[key][0]?.sidebarURL,
          });
      });
  } else {
    data?.actions
      .filter((e) => e.url === "url" && e.displayName !== "Home")
      .forEach((item) => {
        if (search == "" && item.path !== "") {
          let index = item.path.split(".")[0];
          if (index === "TradeLicense") index = "Trade License";
          if (!configEmployeeSideBar[index]) {
            configEmployeeSideBar[index] = [item];
          } else {
            configEmployeeSideBar[index].push(item);
          }
        } else if (item.path !== "" && item?.displayName?.toLowerCase().includes(search.toLowerCase())) {
          let index = item.path.split(".")[0];
          if (index === "TradeLicense") index = "Trade License";
          if (!configEmployeeSideBar[index]) {
            configEmployeeSideBar[index] = [item];
          } else {
            configEmployeeSideBar[index].push(item);
          }
        }
      });
    const keys = Object.keys(configEmployeeSideBar);
    for (let i = 0; i < keys?.length; i++) {
      const getSingleDisplayName = configEmployeeSideBar[keys[i]][0]?.displayName?.toUpperCase()?.replace(/[ -]/g, "_");
      const getParentDisplayName = keys[i]?.toUpperCase()?.replace(/[ -]/g, "_");

      if (configEmployeeSideBar[keys[i]][0].path.indexOf(".") === -1) {
        menuItems.splice(1, 0, {
          type: "link",
          text: t(`ACTION_TEST_${getSingleDisplayName}`),
          link: configEmployeeSideBar[keys[i]][0]?.navigationURL,
          icon: configEmployeeSideBar[keys[i]][0]?.leftIcon,
          populators: {
            onClick: () => {
              history.push(configEmployeeSideBar[keys[i]][0]?.navigationURL);
              closeSidebar();
            },
          },
        });
      } else {
        menuItems.splice(1, 0, {
          type: "dynamic",
          moduleName: t(`ACTION_TEST_${getParentDisplayName}`),
          links: configEmployeeSideBar[keys[i]]?.map((ob) => {
            return {
              ...ob,
              displayName: t(`ACTION_TEST_${ob?.displayName?.toUpperCase()?.replace(/[ -]/g, "_")}`),
            };
          }),
          icon: configEmployeeSideBar[keys[i]][1]?.leftIcon,
        });
      }
    }
    const indx = menuItems.findIndex((a) => a.element === "HOME");
    const home = menuItems.splice(indx, 1);
    const comp = menuItems.findIndex((a) => a.element === "LANGUAGE");
    const part = menuItems.splice(comp, menuItems?.length - comp);
    menuItems.sort((a, b) => {
      let c1 = a?.type === "dynamic" ? a?.moduleName : a?.text;
      let c2 = b?.type === "dynamic" ? b?.moduleName : b?.text;
      return c1.localeCompare(c2);
    });
    home?.[0] && menuItems.splice(0, 0, home[0]);
    menuItems = part?.length > 0 ? menuItems.concat(part) : menuItems;
  }

  /*  URL with openlink wont have sidebar and actions    */
  if (history.location.pathname.includes("/openlink")) {
    profileItem = <span></span>;
    menuItems = menuItems.filter((ele) => ele.element === "LANGUAGE");
  }

  menuItems = menuItems?.map((item) => ({
    ...item,
    label: item?.text || item?.moduleName || "",
    icon: item?.icon ? item?.icon : undefined,
  }));

  let city = "";
  if (Digit.Utils.getMultiRootTenant()) {
    city = t(`TENANT_TENANTS_${tenantId}`);
  } else {
    city = t(`TENANT_TENANTS_${stringReplaceAll(Digit.ULBService.getCurrentTenantId(), ".", "_")?.toUpperCase()}`);
    // city = "TEST";
  }
  const goToHome = () => {
    if (isEmployee) {
      history.push(`/${window?.contextPath}/employee`);
    } else {
      history.push(`/${window?.contextPath}/citizen`);
    }
  };
  const onItemSelect = ({ item, index, parentIndex }) => {
    if (item?.navigationURL) {
      handleModuleClick(item?.navigationURL);
    } else if (item?.link) {
      handleModuleClick(item?.link);
    } else if (item?.type === "custom") {
      switch (item?.key) {
        case "home":
          goToHome();
          toggleSidebar();
          break;
        case "editProfile":
          userProfile();
          toggleSidebar();
          break;
        case "language":
          handleChangeLanguage(item);
          toggleSidebar();
          break;
        case "city":
          handleChangeCity(item);
          toggleSidebar();
          break;
      }
    } else {
      return;
    }
  };

  const transformedMenuItems = menuItems?.map((item) => {
    if (item?.type === "dynamic") {
      return {
        ...item,
        children: item?.links?.map((link) => ({
          ...link,
          label: link?.displayName,
          icon: link?.leftIcon,
        })),
      };
    } else {
      return item;
    }
  });

  const transformedSelectedCityData = selectCityData?.map((city) => ({
    ...city,
    type: "custom",
    key: "city",
  }));

  const transformedLanguageData = languages?.map((language) => ({
    ...language,
    type: "custom",
    key: "language",
    icon: "Language",
  }));

  const hamburgerItems = [
    {
      label: "HOME",
      value: "HOME",
      icon: "Home",
      // children: transformedSelectedCityData?.length>0 ? transformedSelectedCityData : undefined,
      type: "custom",
      key: "home",
    },
    {
      label: city,
      value: city,
      children: transformedSelectedCityData?.length > 0 ? transformedSelectedCityData : undefined,
      type: "custom",
      icon: "LocationCity",
      key: "city",
    },
    {
      label: t("Language"),
      children: transformedLanguageData?.length > 0 ? transformedLanguageData : undefined,
      type: "custom",
      icon: "Language",
      key: "language",
    },
    ...(user && user.access_token
    ? [
        {
          label: t("EDIT_PROFILE"),
          type: "custom",
          icon: "Edit",
          key: "editProfile",
        },
      ]
    : []),
    {
      label: t("Modules"),
      icon: "DriveFileMove",
      children: transformedMenuItems,
    },
  ];
  return isMobile ? (
    <Hamburger
      items={hamburgerItems}
      profileName={user?.info?.name}
      profileNumber={user?.info?.mobileNumber || user?.info?.emailId}
      theme="dark"
      transitionDuration={0.3}
      styles={{ marginTop: "64px", height: "93%" }}
      onLogout={onLogout}
      hideUserManuals={true}
      profile={profilePic ? profilePic : undefined}
      isSearchable={true}
      onSelect={({ item, index, parentIndex }) => onItemSelect({ item, index, parentIndex })}
    />
  ) : (
    <DesktopCitizenSideBar
      linkData={linkData}
      islinkDataLoading={islinkDataLoading}
      onLogout={onLogout}
    />
  );
};