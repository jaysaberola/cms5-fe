import AdminLayout from "@/components/Layout/AdminLayout";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { getPageById, updatePage } from "@/services/pageService";
import { websiteService } from "@/services/websiteService";
import { useRouter } from "next/router";
import { toast } from "@/lib/toast";
import { composeContentFromGrapes, extractGrapesParts, resolveGrapesPartsFromPage } from "@/lib/grapesContent";
import { isDefaultProtectedPage } from "@/lib/defaultPages";
import { isContactUsPage } from "@/lib/isContactUsPageSlug";
import PageEditorMetaFields from "@/components/Pages/PageEditorMetaFields";
import { getAlbumsCached, getMenusCached, scheduleIdleTask } from "@/lib/referenceDataCache";
import { prefetchPagesSwitcherList, invalidatePagesSwitcherListCache } from "@/lib/pagesListCache";
import { syncAuthTokenCookieFromStorage } from "@/lib/authToken";
import { beginStudioPageSwitch, consumeStudioPageSwitch } from "@/lib/studioPageSwitch";

const GrapesEditor = dynamic(() => import("@/components/UI/GrapesEditor"), {
  ssr: false,
  loading: () => <div className="page-editor__editor-placeholder">Loading visual builder...</div>,
});

type PageSnapshot = {
  title: string;
  label: string;
  grapesContent: string;
  visibility: boolean;
  albumId: number | "";
  menuId: number | "";
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  contactFormRecipient: string;
};

const getPageSaveErrorMessage = (error: any, mode: "create" | "update") => {
  const apiMessage = error?.response?.data?.message;
  const fallback = mode === "create" ? "Failed to create page" : "Failed to update page";
  const source = [apiMessage, error?.message].filter(Boolean).join(" ");

  if (/pages_slug_unique|duplicate\s+entry|sqlstate\[23000\]/i.test(source)) {
    return "Page slug already exists. Please change Page Title or Label, then save again.";
  }

  if (/data too long|1406|content is too large/i.test(source)) {
    return "Page content is too large to save. Simplify the Contact template styles, then try again.";
  }

  if (/insert\s+into\s+`?pages`?|update\s+`?pages`?/i.test(source)) {
    return fallback;
  }

  if (typeof apiMessage === "string" && apiMessage.trim() && !/^server error$/i.test(apiMessage.trim())) {
    return apiMessage;
  }

  return fallback;
};

function EditPage() {
  const router = useRouter();
  const { id } = router.query;
  const pageId = Number(id);

  const [title, setTitle] = useState("");
  const [label, setLabel] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [grapesContent, setGrapesContent] = useState("");
  const [visibility, setVisibility] = useState(true);
  const [albumId, setAlbumId] = useState<number | "">("");
  const [albums, setAlbums] = useState<any[]>([]);
  const [menuId, setMenuId] = useState<number | "">("");
  const [menus, setMenus] = useState<any[]>([]);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [contactFormRecipient, setContactFormRecipient] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [defaultPageLocked, setDefaultPageLocked] = useState(false);
  const [lockedStatus, setLockedStatus] = useState<"published" | "private" | "draft">("published");
  const [savedSnapshot, setSavedSnapshot] = useState<PageSnapshot | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const pendingStudioSwitchRef = useRef(consumeStudioPageSwitch());
  const [pageSwitching, setPageSwitching] = useState(pendingStudioSwitchRef.current.active);
  const previousPageIdRef = useRef<number | null>(null);
  const grapesContentSyncRef = useRef<(() => string) | null>(null);

  const buildSnapshot = useCallback(
    (): PageSnapshot => ({
      title,
      label,
      grapesContent,
      visibility,
      albumId,
      menuId,
      seoTitle,
      seoDescription,
      seoKeywords,
      contactFormRecipient,
    }),
    [
      title,
      label,
      grapesContent,
      visibility,
      albumId,
      menuId,
      seoTitle,
      seoDescription,
      seoKeywords,
      contactFormRecipient,
    ],
  );

  const isDirty = useMemo(() => {
    if (!savedSnapshot) return false;
    return JSON.stringify(savedSnapshot) !== JSON.stringify(buildSnapshot());
  }, [savedSnapshot, buildSnapshot]);

  useEffect(() => {
    if (!id || !Number.isFinite(pageId)) return;

    const isSwitch = previousPageIdRef.current != null && previousPageIdRef.current !== pageId;
    previousPageIdRef.current = pageId;
    setInitialLoading(true);
    if (isSwitch) setPageSwitching(true);

    Promise.all([
      getPageById(pageId),
      websiteService.getSettings().catch(() => ({ setting: {} })),
    ])
      .then(([res, settingsData]) => {
        const page = res.data;
        const hasGrapesFields = Boolean(page.grapes_html || page.grapes_css || page.grapes_js);
        const isGrapes = page.content_type === "grapes" || hasGrapesFields;
        const composedContent = isGrapes
          ? composeContentFromGrapes(resolveGrapesPartsFromPage(page))
          : composeContentFromGrapes({
              grapes_html: page.contents || "",
              grapes_css: "",
              grapes_js: "",
            });

        const nextTitle = page.name || "";
        const nextLabel = page.label || "";
        const nextAlbumId = page.album_id ?? "";
        const nextMenuId = page.menu_id ?? "";
        const nextVisibility = page.status === "published";
        const nextSeoTitle = page.meta_title || "";
        const nextSeoDescription = page.meta_description || "";
        const nextSeoKeywords = page.meta_keyword || "";
        const nextSlug = page.slug || "";
        const isContactPage = isContactUsPage({
          slug: nextSlug,
          name: nextTitle,
          label: nextLabel,
          title: nextTitle,
        });
        const nextRecipient = isContactPage
          ? String(
              page.contact_form_recipient || settingsData?.setting?.email || "",
            ).trim()
          : "";

        setTitle(nextTitle);
        setLabel(nextLabel);
        setPageSlug(nextSlug);
        setAlbumId(nextAlbumId);
        setMenuId(nextMenuId);
        setGrapesContent(composedContent);
        setVisibility(nextVisibility);
        setLockedStatus(page.status === "draft" ? "draft" : page.status === "private" ? "private" : "published");
        setDefaultPageLocked(
          isDefaultProtectedPage({
            slug: page.slug,
            label: page.label,
            title: page.name,
            url: page.url,
          }),
        );
        setSeoTitle(nextSeoTitle);
        setSeoDescription(nextSeoDescription);
        setSeoKeywords(nextSeoKeywords);
        setContactFormRecipient(nextRecipient);
        setSavedSnapshot({
          title: nextTitle,
          label: nextLabel,
          grapesContent: composedContent,
          visibility: nextVisibility,
          albumId: nextAlbumId,
          menuId: nextMenuId,
          seoTitle: nextSeoTitle,
          seoDescription: nextSeoDescription,
          seoKeywords: nextSeoKeywords,
          contactFormRecipient: nextRecipient,
        });
      })
      .finally(() => {
        setInitialLoading(false);
        setPageSwitching(false);
      });
  }, [id, pageId]);

  useEffect(() => {
    const cancel = scheduleIdleTask(() => {
      prefetchPagesSwitcherList();
      Promise.all([getAlbumsCached(), getMenusCached()])
        .then(([albumRows, menuRows]) => {
          setAlbums(albumRows);
          setMenus(menuRows);
        })
        .catch(() => {
          setAlbums([]);
          setMenus([]);
        });
    });
    return cancel;
  }, []);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const handleSave = async (opts?: { silent?: boolean; publish?: boolean }) => {
    if (!title.trim()) {
      if (!opts?.silent) toast.error("Page title is required");
      return;
    }

    const isContactPage = isContactUsPage({
      slug: pageSlug,
      name: title,
      label,
      title,
    });
    const recipient = contactFormRecipient.trim();
    if (isContactPage) {
      if (!recipient) {
        if (!opts?.silent) toast.error("Form recipient email is required for Contact Us");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
        if (!opts?.silent) toast.error("Enter a valid form recipient email");
        return;
      }
    }

    try {
      setLoading(true);
      const contentToSave = grapesContentSyncRef.current?.() ?? grapesContent;
      const grapesParts = extractGrapesParts(contentToSave);
      const hasGrapesData = Boolean(
        grapesParts.grapes_html?.trim() || grapesParts.grapes_css?.trim() || grapesParts.grapes_js?.trim(),
      );
      const nextVisibility = defaultPageLocked ? visibility : opts?.publish ? true : visibility;

      await updatePage(pageId, {
        name: title,
        label: label || undefined,
        album_id: albumId === "" ? null : albumId,
        menu_id: menuId === "" ? null : menuId,
        contents: contentToSave,
        content_type: "grapes",
        grapes_html: hasGrapesData ? grapesParts.grapes_html : undefined,
        grapes_css: hasGrapesData ? grapesParts.grapes_css : undefined,
        grapes_js: hasGrapesData ? grapesParts.grapes_js : undefined,
        status: defaultPageLocked ? lockedStatus : nextVisibility ? "published" : "private",
        meta_title: seoTitle || undefined,
        meta_description: seoDescription || undefined,
        meta_keyword: seoKeywords || undefined,
        ...(isContactPage ? { contact_form_recipient: recipient } : {}),
      });

      if (isContactPage && recipient !== savedSnapshot?.contactFormRecipient) {
        try {
          await websiteService.updateContactFormRecipient({ email: recipient });
        } catch {
          // Page recipient is already saved; website contact sync is best-effort.
        }
      }

      if (!defaultPageLocked && opts?.publish) setVisibility(true);
      setGrapesContent(contentToSave);
      setContactFormRecipient(recipient);
      setSavedSnapshot({
        ...buildSnapshot(),
        grapesContent: contentToSave,
        visibility: nextVisibility,
        contactFormRecipient: recipient,
      });
      invalidatePagesSwitcherListCache();
      prefetchPagesSwitcherList();
      if (!opts?.silent) toast.success(opts?.publish ? "Page published" : "Page updated successfully");
    } catch (error: any) {
      console.error(error);
      if (!opts?.silent) toast.error(getPageSaveErrorMessage(error, "update"));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  useEffect(() => {
    if (!isDirty || initialLoading) return;
    const timer = window.setTimeout(() => {
      void handleSaveRef.current({ silent: true });
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [
    isDirty,
    grapesContent,
    title,
    label,
    visibility,
    albumId,
    menuId,
    seoTitle,
    seoDescription,
    seoKeywords,
    contactFormRecipient,
    initialLoading,
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSaveRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handlePageSelect = (nextId: number) => {
    if (nextId === pageId) return;
    if (isDirty && !window.confirm("You have unsaved changes on this page. Switch without saving?")) return;
    beginStudioPageSwitch(true);
    setPageSwitching(true);
    pendingStudioSwitchRef.current = { active: true, fromGrapes: true };
    router.push(`/manage-pages/edit/${nextId}`);
  };

  const metaFields = (
    <PageEditorMetaFields
      mode="edit"
      pageId={pageId}
      title={title}
      onTitleChange={setTitle}
      label={label}
      onLabelChange={setLabel}
      albumId={albumId}
      onAlbumIdChange={setAlbumId}
      albums={albums}
      menuId={menuId}
      onMenuIdChange={setMenuId}
      menus={menus}
      visibility={visibility}
      onVisibilityChange={setVisibility}
      defaultPageLocked={defaultPageLocked}
      showContactFormRecipient={isContactUsPage({
        slug: pageSlug,
        name: title,
        label,
        title,
      })}
      contactFormRecipient={contactFormRecipient}
      onContactFormRecipientChange={setContactFormRecipient}
      seoTitle={seoTitle}
      onSeoTitleChange={setSeoTitle}
      seoDescription={seoDescription}
      onSeoDescriptionChange={setSeoDescription}
      seoKeywords={seoKeywords}
      onSeoKeywordsChange={setSeoKeywords}
    />
  );

  return (
    <GrapesEditor
      fullScreen
      value={grapesContent}
      onChange={setGrapesContent}
      contentSyncRef={grapesContentSyncRef}
      pageTitle={title}
      saveStatus={loading ? "saving" : isDirty ? "unsaved" : "saved"}
      pageId={pageId}
      pageSlug={pageSlug}
      isPageLoading={initialLoading || pageSwitching}
      onPageSelect={handlePageSelect}
      onCreatePage={() => {
        if (isDirty && !window.confirm("You have unsaved changes on this page. Switch without saving?")) return;
        router.push("/manage-pages/create");
      }}
      onBack={() => {
        if (isDirty && !window.confirm("You have unsaved changes. Leave this page anyway?")) return;
        router.push("/manage-pages");
      }}
      onSave={() => void handleSave()}
      onPublish={() => void handleSave({ publish: true })}
      onPreviewPublic={() => {
        syncAuthTokenCookieFromStorage();
        window.open(`/manage-pages/preview/${pageId}`, "_blank", "noopener,noreferrer");
      }}
      onOpenSettings={() => setSettingsOpen(true)}
      onCloseSettings={() => setSettingsOpen(false)}
      settingsOpen={settingsOpen}
      settingsPanel={metaFields}
    />
  );
}

EditPage.Layout = AdminLayout;

export async function getServerSideProps() {
  return { props: {} };
}

export default EditPage;
