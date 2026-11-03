import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { createPortal } from "react-dom";
import { getCurrentUserCached, notifyCurrentUserUpdated } from "@/lib/currentUser";
import { readStoredAuthToken } from "@/lib/authToken";
import { isStaffUser } from "@/lib/userRoles";
import { scheduleIdleTask, useStoredPublicAuthState } from "@/lib/publicAuthState";
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

  /* Staff sessions stay in localStorage but the public header stays visitor-facing; use /admin-panel (or /) directly. */
  if (adminUser) {
    return null;
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

      <section className={styles.quickLinks}>
        <p className={styles.quickLabel}>Quick Links</p>
        <div className={styles.quickRow}>
          <Link href="/contact-us" className={styles.quickLink} onClick={onClose}>
            Contact Support
          </Link>
        </div>
      </section>
    </>
  );
}
