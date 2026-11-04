import { hasAnyPermission } from "@/lib/userPermissions";
import { isCustomerUser } from "@/lib/userRoles";

export type CmsNavChild = {
  label: string;
  href: string;
  permissions?: string[];
};

export type CmsNavItem = {
  label: string;
  icon: string;
  href: string;
  collapseMenus?: boolean;
  openInNewTab?: boolean;
  permissions?: string[];
  children?: CmsNavChild[];
};

export const CMS_NAV_ITEMS: CmsNavItem[] = [
  { label: "Dashboard", icon: "fa-solid fa-house", href: "/admin-panel", collapseMenus: true, permissions: ["dashboard.view"] },
  {
    label: "Pages",
    icon: "fa-solid fa-file-lines",
    href: "/manage-pages",
    permissions: ["pages.view"],
  },
  {
    label: "Banners",
    icon: "fa-solid fa-images",
    href: "/banners",
    permissions: ["albums.view"],
    children: [
      { label: "Manage Home Banners", href: "/banners/home", permissions: ["albums.view"] },
      { label: "Manage Albums", href: "/banners", permissions: ["albums.view"] },
      { label: "Create an Album", href: "/banners/create", permissions: ["albums.create"] },
    ],
  },
  { label: "Files", icon: "fa-solid fa-folder-open", href: "/files", permissions: ["file_manager.manage"] },
  { label: "Menu", icon: "fa-solid fa-bars", href: "/menu", permissions: ["menus.view"] },
  {
    label: "News",
    icon: "fa-solid fa-newspaper",
    href: "/manage-news",
    permissions: ["news.view"],
    children: [
      { label: "Manage News", href: "/manage-news", permissions: ["news.view"] },
      {
        label: "Manage News Categories",
        href: "/manage-news/category_index",
        permissions: ["news_categories.view"],
      },
    ],
  },
  {
    label: "Settings",
    icon: "fa-solid fa-gear",
    href: "/settings",
    children: [
      { label: "Manage Account Settings", href: "/settings/account" },
      { label: "Manage Website Settings", href: "/settings/website", permissions: ["website_settings.edit"] },
      { label: "Manage Audit Trail", href: "/settings/audit", permissions: ["audit_logs.view"] },
    ],
  },
  { label: "Users", icon: "fa-solid fa-users", href: "/users", permissions: ["users.view"] },
  {
    label: "Account Management",
    icon: "fa-solid fa-user-shield",
    href: "/account-management",
    children: [
      { label: "Manage Roles", href: "/account-management/roles", permissions: ["roles.view"] },
      { label: "Manage Access Rights", href: "/account-management/access_rights", permissions: ["access_rights.manage"] },
    ],
  },
];

export function filterCmsNavItems(user: unknown, items: CmsNavItem[] = CMS_NAV_ITEMS): CmsNavItem[] {
  if (isCustomerUser(user)) return [];

  return items.reduce<CmsNavItem[]>((acc, item) => {
    if (item.children?.length) {
      const children = item.children.filter((child) => hasAnyPermission(user, child.permissions));
      if (children.length === 0) return acc;
      acc.push({ ...item, children });
      return acc;
    }

    if (!hasAnyPermission(user, item.permissions)) return acc;
    acc.push(item);
    return acc;
  }, []);
}
