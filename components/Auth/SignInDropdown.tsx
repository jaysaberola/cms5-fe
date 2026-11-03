import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { createPortal } from "react-dom";
import { getCurrentUserCached, notifyCurrentUserUpdated, resolveAvatarUrl } from "@/lib/currentUser";
import { readStoredAuthToken } from "@/lib/authToken";
import { getRoleDisplayLabel, isStaffUser } from "@/lib/userRoles";
import { scheduleIdleTask, useStoredPublicAuthState } from "@/lib/publicAuthState";
import { signOutAdminAndStayOnSite } from "@/lib/publicSignOut";
import { customerDisplayName } from "@/services/publicCustomerService";
import styles from "@/styles/signInDropdown.module.css";

type SignInDropdownProps = {
  buttonClassName?: string;
  chevronClassName?: string;
  onNavigate?: () => void;
  variant?: "header" | "menuTile";
};

function useMobileSheet() {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const media = window.matchMedia("(max-width: 991px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return { isMobile, mounted };
}

function FloatingPanel({
  open,
  className,
  role,
  ariaLabel,
  onClose,
  panelRef,
  children,
}: {
  open: boolean;
  className: string;
  role: string;
  ariaLabel: string;
  onClose: () => void;
  panelRef?: Ref<HTMLDivElement>;
  children: ReactNode;
}) {
  const { isMobile, mounted } = useMobileSheet();

  if (!open) return null;

  const node = (
    <>
      {isMobile ? <div className={styles.mobileBackdrop} onClick={onClose} /> : null}
      <div ref={panelRef} className={className} role={role} aria-label={ariaLabel}>
        {children}
      </div>
    </>
  );

  if (isMobile && mounted) return createPortal(node, document.body);
  return node;
}

export default function SignInDropdown({
  buttonClassName,
  chevronClassName,
  onNavigate,
  variant = "header",
}: SignInDropdownProps) {
  const { adminUser } = useStoredPublicAuthState();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isMenuTile = variant === "menuTile";

  useEffect(() => {
    if (!readStoredAuthToken()) return;

    let alive = true;

    const refreshSession = () => {
      getCurrentUserCached({ force: false })
        .then((user) => {
          if (!alive) return;
          if (isStaffUser(user)) {
            notifyCurrentUserUpdated();
          }
        })
        .catch(() => {
          // ignore
        });
    };

    const cancelIdle = scheduleIdleTask(refreshSession, 2500);
    return () => {
      alive = false;
      cancelIdle();
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    onNavigate?.();
  };

  const signOutAdmin = () => {
    close();
    signOutAdminAndStayOnSite();
  };

  const [adminAvatarFailed, setAdminAvatarFailed] = useState(false);

  useEffect(() => {
    setAdminAvatarFailed(false);
  }, [adminUser?.avatar]);

  const adminRoleLabel = getRoleDisplayLabel(adminUser);
  const adminDisplayName = customerDisplayName(adminUser?.fname, adminUser?.lname) || "Admin User";
  const adminInitial = (adminDisplayName.charAt(0) || "A").toUpperCase();
  const adminAvatarUrl = resolveAvatarUrl(adminUser?.avatar);
  const showAdminAvatar = Boolean(adminAvatarUrl && !adminAvatarFailed);
  const showCmsAdminLink = isStaffUser(adminUser);

  if (adminUser) {
    return (
      <div className={`${styles.root}${isMenuTile ? ` ${styles.menuTile}` : ""}`} ref={rootRef}>
        <button
          type="button"
          className={`${styles.loggedInBtn}${isMenuTile ? ` ${styles.menuTileBtn}` : ""} ${buttonClassName || ""}`}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className={styles.avatar}>
            {showAdminAvatar ? (
              <img
                src={adminAvatarUrl}
                alt=""
                width={24}
                height={24}
                onError={() => setAdminAvatarFailed(true)}
              />
            ) : (
              adminInitial
            )}
          </span>
          <span className={styles.loggedInName}>{adminDisplayName}</span>
          {isMenuTile ? null : (
            <i className={`fas fa-chevron-down ${chevronClassName || ""}`} aria-hidden="true" />
          )}
        </button>
        <FloatingPanel
          open={open}
          className={styles.accountPanel}
          role="menu"
          ariaLabel="Admin menu"
          onClose={() => setOpen(false)}
          panelRef={panelRef}
        >
          <div className={styles.accountHeader}>
            <span className={styles.avatarLarge}>
              {showAdminAvatar ? (
                <img
                  src={adminAvatarUrl}
                  alt=""
                  width={40}
                  height={40}
                  onError={() => setAdminAvatarFailed(true)}
                />
              ) : (
                adminInitial
              )}
            </span>
            <div className={styles.accountMeta}>
              <p className={styles.accountName}>{adminDisplayName}</p>
              <p className={styles.accountEmail}>{adminUser.email}</p>
              <p className={styles.accountRole}>{adminRoleLabel}</p>
            </div>
          </div>

          <nav className={styles.accountMenu}>
            {showCmsAdminLink ? (
              <a
                href="/dashboard"
                className={styles.menuItem}
                role="menuitem"
                onClick={(event) => {
                  event.preventDefault();
                  close();
                  window.location.assign("/dashboard");
                }}
              >
                <i className="fa-solid fa-layer-group" aria-hidden="true" />
                CMS Admin
              </a>
            ) : null}
          </nav>

          <button type="button" className={styles.signOutItem} role="menuitem" onClick={signOutAdmin}>
            Sign out
          </button>
        </FloatingPanel>
      </div>
    );
  }

  if (isMenuTile) {
    return (
      <div className={`${styles.root} ${styles.menuTile}`} ref={rootRef}>
        <button
          type="button"
          className={`${styles.menuTileBtn} ${buttonClassName || ""}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <i className="fa-regular fa-user" aria-hidden="true" />
          Sign In
        </button>
        <FloatingPanel
          open={open}
          className={styles.panel}
          role="dialog"
          ariaLabel="Sign in"
          onClose={() => setOpen(false)}
        >
          <GuestSignInPanel onClose={close} />
        </FloatingPanel>
      </div>
    );
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={buttonClassName}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <i className="fa-regular fa-user" aria-hidden="true" />
        <span className={styles.signInLabel}>Sign In</span>
        <i className={`fas fa-chevron-down ${chevronClassName || ""}`} aria-hidden="true" />
      </button>

      <FloatingPanel
        open={open}
        className={styles.panel}
        role="dialog"
        ariaLabel="Sign in"
        onClose={() => setOpen(false)}
      >
        <GuestSignInPanel onClose={close} />
      </FloatingPanel>
    </div>
  );
}

function GuestSignInPanel({ onClose }: { onClose: () => void }) {
  return (
    <>
      <button type="button" className={styles.closeBtn} aria-label="Close" onClick={onClose}>
        ×
      </button>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Administrator</h3>
        <p className={styles.sectionText}>WebFocus staff can sign in to manage website content in the CMS.</p>
        <div className={styles.adminLinks}>
          <Link href="/?redirect=/dashboard" className={styles.adminLink} onClick={onClose}>
            <i className="fa-solid fa-layer-group" aria-hidden="true" />
            CMS Admin Sign In
          </Link>
        </div>
      </section>

      <section className={styles.quickLinks}>
        <p className={styles.quickLabel}>Quick Links</p>
        <div className={styles.quickRow}>
          <Link href="/public/contact-us" className={styles.quickLink} onClick={onClose}>
            Contact Support
          </Link>
        </div>
      </section>
    </>
  );
}
