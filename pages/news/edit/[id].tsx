import AdminLayout from "@/components/Layout/AdminLayout";
import NewsEditorMetaFields from "@/components/News/NewsEditorMetaFields";
import { composeContentFromGrapes, extractGrapesParts } from "@/lib/grapesContent";
import { resolveStorageAssetUrlForBrowser } from "@/lib/storageAssets";
import { toast } from "@/lib/toast";
import {
  updateArticle,
  getArticle,
  fetchArticleCategories,
  ArticleCategory,
} from "@/services/articleService";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { syncAuthTokenCookieFromStorage } from "@/lib/authToken";

const GrapesEditor = dynamic(() => import("@/components/UI/GrapesEditor"), {
  ssr: false,
  loading: () => <div className="page-editor__editor-placeholder">Loading visual builder...</div>,
});

type NewsSnapshot = {
  title: string;
  date: string;
  category: string;
  grapesContent: string;
  teaser: string;
  isPublished: boolean;
  isFeatured: boolean;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
};

export default function EditNews() {
  const router = useRouter();
  const { id } = router.query;
  const articleId = Number(id);

  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [grapesContent, setGrapesContent] = useState("");
  const [teaser, setTeaser] = useState("");
  const [banner, setBanner] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [savedSnapshot, setSavedSnapshot] = useState<NewsSnapshot | null>(null);
  const serverBannerPreviewRef = useRef<string | null>(null);
  const serverThumbnailPreviewRef = useRef<string | null>(null);

  const buildSnapshot = useCallback(
    (): NewsSnapshot => ({
      title,
      date,
      category,
      grapesContent,
      teaser,
      isPublished,
      isFeatured,
      seoTitle,
      seoDescription,
      seoKeywords,
    }),
    [
      title,
      date,
      category,
      grapesContent,
      teaser,
      isPublished,
      isFeatured,
      seoTitle,
      seoDescription,
      seoKeywords,
    ],
  );

  const isDirty = useMemo(() => {
    if (!savedSnapshot) return false;
    return JSON.stringify(savedSnapshot) !== JSON.stringify(buildSnapshot()) || Boolean(banner || thumbnail);
  }, [savedSnapshot, buildSnapshot, banner, thumbnail]);

  useEffect(() => {
    if (!id || !Number.isFinite(articleId)) return;

    setInitialLoading(true);
    Promise.all([getArticle(articleId), fetchArticleCategories()])
      .then(([article, cats]) => {
        const composedContent = composeContentFromGrapes({
          grapes_html: article.contents || "",
          grapes_css: "",
          grapes_js: "",
        });

        const nextTitle = article.name;
        const nextDate = article.date;
        const nextCategory = article.category_id.toString();
        const nextTeaser = article.teaser;
        const nextPublished = article.status === "published";
        const nextFeatured = !!article.is_featured;
        const nextSeoTitle = article.meta_title ?? "";
        const nextSeoDescription = article.meta_description ?? "";
        const nextSeoKeywords = article.meta_keyword ?? "";

        setTitle(nextTitle);
        setDate(nextDate);
        setCategory(nextCategory);
        setGrapesContent(composedContent);
        setTeaser(nextTeaser);
        setIsPublished(nextPublished);
        setIsFeatured(nextFeatured);
        setSeoTitle(nextSeoTitle);
        setSeoDescription(nextSeoDescription);
        setSeoKeywords(nextSeoKeywords);
        setCategories(cats);

        const bannerUrl = resolveStorageAssetUrlForBrowser(article.image_url) || null;
        const thumbUrl = resolveStorageAssetUrlForBrowser(article.thumbnail_url) || null;
        serverBannerPreviewRef.current = bannerUrl;
        serverThumbnailPreviewRef.current = thumbUrl;
        setBannerPreview(bannerUrl);
        setThumbnailPreview(thumbUrl);

        setSavedSnapshot({
          title: nextTitle,
          date: nextDate,
          category: nextCategory,
          grapesContent: composedContent,
          teaser: nextTeaser,
          isPublished: nextPublished,
          isFeatured: nextFeatured,
          seoTitle: nextSeoTitle,
          seoDescription: nextSeoDescription,
          seoKeywords: nextSeoKeywords,
        });
      })
      .catch(() => toast.error("Failed to load article"))
      .finally(() => {
        setInitialLoading(false);
        setLoadingCategories(false);
      });
  }, [id, articleId]);

  useEffect(() => {
    return () => {
      if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
      if (thumbnailPreview?.startsWith("blob:")) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [bannerPreview, thumbnailPreview]);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const articleHasBody = (content: string) => {
    const parts = extractGrapesParts(content);
    return Boolean(parts.grapes_html?.trim() || content.trim());
  };

  const handleSave = async (opts?: { publish?: boolean }) => {
    if (!title.trim() || !date || !category || !teaser.trim()) {
      toast.error("Please fill in all required fields in News Details");
      setSettingsOpen(true);
      return;
    }
    if (!articleHasBody(grapesContent)) {
      toast.error("Article content is required");
      return;
    }

    try {
      setLoading(true);
      const nextPublished = opts?.publish ? true : isPublished;

      await updateArticle(articleId, {
        title,
        date,
        category_id: Number(category),
        content: grapesContent,
        teaser,
        banner,
        thumbnail,
        status: nextPublished ? "published" : "private",
        is_featured: isFeatured,
        meta_title: seoTitle,
        meta_keyword: seoKeywords,
        meta_description: seoDescription,
      });

      if (opts?.publish) setIsPublished(true);
      setBanner(null);
      setThumbnail(null);
      setSavedSnapshot({
        ...buildSnapshot(),
        isPublished: nextPublished,
      });
      toast.success(opts?.publish ? "News published" : "News updated successfully");
    } catch (err) {
      toast.error("Failed to update news");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

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

  const handleBannerChange = (file: File | null) => {
    setBanner(file);
    if (file) {
      setBannerPreview(URL.createObjectURL(file));
      return;
    }
    setBannerPreview(serverBannerPreviewRef.current);
  };

  const handleThumbnailChange = (file: File | null) => {
    setThumbnail(file);
    if (file) {
      setThumbnailPreview(URL.createObjectURL(file));
      return;
    }
    setThumbnailPreview(serverThumbnailPreviewRef.current);
  };

  const metaFields = (
    <NewsEditorMetaFields
      mode="edit"
      title={title}
      onTitleChange={setTitle}
      date={date}
      onDateChange={setDate}
      category={category}
      onCategoryChange={setCategory}
      categories={categories}
      loadingCategories={loadingCategories}
      teaser={teaser}
      onTeaserChange={setTeaser}
      isPublished={isPublished}
      onIsPublishedChange={setIsPublished}
      isFeatured={isFeatured}
      onIsFeaturedChange={setIsFeatured}
      bannerPreview={bannerPreview}
      onBannerChange={handleBannerChange}
      thumbnailPreview={thumbnailPreview}
      onThumbnailChange={handleThumbnailChange}
      seoTitle={seoTitle}
      onSeoTitleChange={setSeoTitle}
      seoDescription={seoDescription}
      onSeoDescriptionChange={setSeoDescription}
      seoKeywords={seoKeywords}
      onSeoKeywordsChange={setSeoKeywords}
    />
  );

  if (initialLoading) {
    return (
      <div className="container-fluid px-4 pt-3">
        <p>Loading article...</p>
      </div>
    );
  }

  return (
    <GrapesEditor
      fullScreen
      value={grapesContent}
      onChange={setGrapesContent}
      pageTitle={title || "Edit News"}
      saveStatus={loading ? "saving" : isDirty ? "unsaved" : "saved"}
      isPageLoading={initialLoading}
      onBack={() => {
        if (isDirty && !window.confirm("You have unsaved changes. Leave this article anyway?")) return;
        router.push("/news");
      }}
      onSave={() => void handleSave()}
      onPublish={() => void handleSave({ publish: true })}
      onPreviewPublic={() => {
        syncAuthTokenCookieFromStorage();
        window.open(`/news/preview/${articleId}`, "_blank", "noopener,noreferrer");
      }}
      onOpenSettings={() => setSettingsOpen(true)}
      onCloseSettings={() => setSettingsOpen(false)}
      settingsOpen={settingsOpen}
      settingsPanel={metaFields}
      settingsTitle="News settings"
    />
  );
}

EditNews.Layout = AdminLayout;

export async function getServerSideProps() {
  return { props: {} };
}
