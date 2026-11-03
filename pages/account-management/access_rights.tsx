import { useEffect, useMemo, useState } from "react"
import AdminLayout from "@/components/Layout/AdminLayout"
import PermissionService, {
  Role,
  Permission
} from "@/services/permissionService"
import { toast } from "@/lib/toast";
import CmsModuleShell from "@/components/Modules/CmsModuleShell";
import {
  CmsSettingsFooter,
  CmsSettingsLayout,
  CmsSettingsSection,
} from "@/components/Modules/CmsSettingsForm";
import {
  filterGroupedPermissions,
  filterPermissionsByArea,
  groupPermissionsByModule,
} from "@/lib/accessRightsCatalog";

function PermissionMatrixPanel({
  roles,
  assigned,
  groupedPermissions,
  onTogglePermission,
}: {
  roles: Role[];
  assigned: Record<number, number[]>;
  groupedPermissions: Record<string, Permission[]>;
  onTogglePermission: (roleId: number, permissionId: number) => void;
}) {
  if (Object.keys(groupedPermissions).length === 0) {
    return (
      <CmsSettingsSection
        title="No Results"
        description="Try a different search term to find permissions."
        icon="fa-solid fa-magnifying-glass"
      >
        <div className="text-muted py-3">No permissions matched your search.</div>
      </CmsSettingsSection>
    );
  }

  return (
    <>
      {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
        <CmsSettingsSection
          key={module}
          title={module}
          description={`${modulePermissions.length} permission${modulePermissions.length === 1 ? "" : "s"} in this module`}
          icon="fa-solid fa-folder-tree"
        >
          <div className="cms-access-module-stack">
            {modulePermissions.map((perm) => (
              <div className="cms-access-perm-row" key={perm.id}>
                <div className="cms-access-perm-row__label">{perm.label}</div>
                <div className="cms-access-perm-row__roles">
                  {roles.map((role) => {
                    const checked = assigned[role.id]?.includes(perm.id) || false
                    return (
                      <label
                        key={role.id}
                        className={`cms-access-role-toggle${checked ? " is-checked" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onTogglePermission(role.id, perm.id)}
                        />
                        <span>{role.label || role.description || role.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </CmsSettingsSection>
      ))}
    </>
  );
}

function ManageAccessRights() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [assigned, setAssigned] = useState<Record<number, number[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    PermissionService.getMatrix()
      .then(data => {
        setRoles(data.roles)
        setPermissions(data.permissions)
        setAssigned(data.assigned)
      })
      .finally(() => setLoading(false))
  }, [])

  const togglePermission = (roleId: number, permissionId: number) => {
    setAssigned(prev => {
      const current = prev[roleId] || []
      return {
        ...prev,
        [roleId]: current.includes(permissionId)
          ? current.filter(id => id !== permissionId)
          : [...current, permissionId]
      }
    })
  }

  const saveChanges = async () => {
    try {
      setSaving(true)
      await PermissionService.syncMatrix(assigned)
      toast.success("Permissions updated successfully")
    } catch {
      toast.error("Failed to update permissions")
    } finally {
      setSaving(false)
    }
  }

  const cmsPermissions = useMemo(
    () => filterPermissionsByArea(permissions, "cms"),
    [permissions]
  );

  const groupedPermissions = useMemo(
    () => groupPermissionsByModule(cmsPermissions),
    [cmsPermissions]
  );

  const filteredGroupedPermissions = useMemo(
    () => filterGroupedPermissions(groupedPermissions, search),
    [groupedPermissions, search]
  );

  const assignedCmsCount = useMemo(() => {
    const ids = new Set(cmsPermissions.map((perm) => perm.id));
    return Object.values(assigned).reduce(
      (sum, roleIds) => sum + roleIds.filter((id) => ids.has(id)).length,
      0
    );
  }, [cmsPermissions, assigned]);

  if (loading) {
    return (
      <CmsModuleShell
        title="Manage Access Rights"
        description="Configure CMS module permissions for each role."
        icon="fa-solid fa-key"
      >
        <div className="text-center py-5 text-muted">Loading permissions...</div>
      </CmsModuleShell>
    )
  }

  return (
    <CmsModuleShell
      title="Manage Access Rights"
      description="Configure CMS module permissions for each role."
      icon="fa-solid fa-key"
      stats={[
        { label: "Roles", value: roles.length, tone: "accent" },
        { label: "CMS Permissions", value: cmsPermissions.length },
        { label: "Assigned Here", value: assignedCmsCount },
      ]}
      toolbar={(
        <div className="input-group">
          <span className="input-group-text">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          </span>
          <input
            className="form-control"
            placeholder="Search CMS permissions..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      )}
    >
      <CmsSettingsLayout>
        <PermissionMatrixPanel
          roles={roles}
          assigned={assigned}
          groupedPermissions={filteredGroupedPermissions}
          onTogglePermission={togglePermission}
        />

        <CmsSettingsFooter onSave={saveChanges} saveLabel="Save Access Rights" saving={saving} />
      </CmsSettingsLayout>
    </CmsModuleShell>
  )
}

ManageAccessRights.Layout = AdminLayout
export default ManageAccessRights
