import type { Permission } from "@/services/permissionService";

export type AccessRightsArea = "cms" | "commerce";

const COMMERCE_PERMISSION_PREFIXES = new Set([
  "commerce_dashboard",
  "commerce_approvals",
  "commerce_managed",
  "commerce_notifications",
  "commerce_helpdesk",
  "customers",
  "sales_transactions",
  "products",
  "inventory",
  "coupons",
  "reports",
  "job_orders",
  "services",
]);

/** E-commerce modules hidden from CMS access-rights UI (permissions may remain in DB). */
const HIDDEN_ACCESS_RIGHTS_MODULES = new Set([
  "commerce_contracts",
  "contracts",
  "customers",
  "sales_transactions",
  "products",
  "product_categories",
  "coupons",
  "job_orders",
  "services",
  "service_categories",
  "inventory",
  "reports",
  "commerce_dashboard",
  "commerce_approvals",
  "commerce_managed",
  "commerce_notifications",
  "commerce_helpdesk",
]);

export function getAccessRightsArea(permissionName: string): AccessRightsArea {
  const prefix = permissionName.split(".")[0]?.toLowerCase() ?? "";
  return COMMERCE_PERMISSION_PREFIXES.has(prefix) ? "commerce" : "cms";
}

export function isHiddenAccessRightsModule(moduleOrPermission: string) {
  const key = moduleOrPermission.trim().toLowerCase();
  const prefix = key.split(".")[0] ?? key;
  return HIDDEN_ACCESS_RIGHTS_MODULES.has(key) || HIDDEN_ACCESS_RIGHTS_MODULES.has(prefix);
}

export function filterPermissionsByArea(permissions: Permission[], area: AccessRightsArea) {
  return permissions.filter(
    (perm) =>
      getAccessRightsArea(perm.name) === area &&
      !isHiddenAccessRightsModule(perm.name) &&
      !isHiddenAccessRightsModule(perm.module ?? ""),
  );
}

export function groupPermissionsByModule(permissions: Permission[]) {
  return permissions.reduce((acc: Record<string, Permission[]>, perm) => {
    if (isHiddenAccessRightsModule(perm.name) || isHiddenAccessRightsModule(perm.module ?? "")) {
      return acc;
    }
    acc[perm.module] = acc[perm.module] || [];
    acc[perm.module].push(perm);
    return acc;
  }, {});
}

export function filterGroupedPermissions(
  grouped: Record<string, Permission[]>,
  search: string
) {
  const query = search.trim().toLowerCase();
  if (!query) return grouped;

  return Object.entries(grouped).reduce((acc, [module, modulePermissions]) => {
    const filtered = modulePermissions.filter(
      (perm) =>
        perm.label.toLowerCase().includes(query) ||
        perm.name.toLowerCase().includes(query) ||
        module.toLowerCase().includes(query)
    );
    if (filtered.length > 0) acc[module] = filtered;
    return acc;
  }, {} as Record<string, Permission[]>);
}
