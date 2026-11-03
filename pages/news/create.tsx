import AdminLayout from "@/components/Layout/AdminLayout";
import NewsEditorMetaFields from "@/components/News/NewsEditorMetaFields";
import { extractGrapesParts } from "@/lib/grapesContent";
import { toast } from "@/lib/toast";
import { createArticle, fetchArticleCategories, ArticleCategory } from "@/services/articleService";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const GrapesEditor = dynamic(() => import("@/components/UI/GrapesEditor"), {
  ssr: false,
  loading: () => <div className="page-editor__editor-placeholder">Loading visual builder...</div>,
});

const DEFAULT_CONTENT = "";

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

const emptySnapshot = (): NewsSnapshot => ({
  title: "",
  date: new Date().toISOString().slice(0, 10),
  category: "",
  grapesContent: DEFAULT_CONTENT,
  teaser: "",
  isPublished: true,
  isFeatured: false,
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
});

function CreateNews() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("");
  const [grapesContent, setGrapesContent] = useState(DEFAULT_CONTENT);
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
    const base = emptySnapshot();
    base.date = date;
    return (
      JSON.stringify(base) !== JSON.stringify(buildSnapshot()) ||
      Boolean(banner || thumbnail)
    );
  }, [buildSnapshot, date, banner, thumbnail]);

  useEffect(() => {
    fetchArticleCategories()
      .then(setCategories)
      .catch(() => toast.error("Failed to load categories"))
      .finally(() => setLoadingCategories(false));
  }, []);

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

  const fillSeoFromDetails = () => {
    if (!seoTitle.trim()) setSeoTitle(title);
    if (!seoDescription.trim()) setSeoDescription(teaser);
  };

  const articleHasBody = (content: string) => {
    const parts = extractGrapesParts(content);
    return Boolean(parts.grapes_html?.trim() || content.trim());
  };

  const handleSave = async (opts?: { publish?: boolean }) => {
    if (!title.trim() || !date || !teaser.trim()) {
      toast.error("Please fill in all required fields in News Details");
      setSettingsOpen(true);
      return;
    }
    if (!category) {
      toast.error("Please select a category");
      setSettingsOpen(true);
      return;
    }
    if (!banner || !thumbnail) {
      toast.error("Article banner and thumbnail are required");
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

      const response = await createArticle({
        title,
        date,
        category_id: Number(category),
        content: grapesContent,
        teaser,
        banner,
        thumbnail,
        status: nextPublished ? "published" : "private",
        is_featured: isFeatured,
        meta_title: seoTitle || title,
        meta_keyword: seoKeywords,
        meta_description: seoDescription || teaser,
      });

      const created = response.data?.data ?? response.data;
      const newId = Number(created?.id);

      toast.success("News saved successfully");

      if (Number.isFinite(newId) && newId > 0) {
        router.push(`/news/edit/${newId}`);
      } else {
        router.push("/news");
      }
    } catch (err) {
      toast.error("Failed to save news");
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
    setBannerPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleThumbnailChange = (file: File | null) => {
    setThumbnail(file);
    setThumbnailPreview(file ? URL.createObjectURL(file) : null);
  };

  const metaFields = (
    <NewsEditorMetaFields
      mode="create"
      title={title}
      onTitleChange={setTitle}
      onTitleBlur={fillSeoFromDetails}
      date={date}
      onDateChange={setDate}
      category={category}
      onCategoryChange={setCategory}
      categories={categories}
      loadingCategories={loadingCategories}
      teaser={teaser}
      onTeaserChange={setTeaser}
      onTeaserBlur={fillSeoFromDetails}
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

  return (
    <GrapesEditor
      fullScreen
      value={grapesContent}
      onChange={setGrapesContent}
      pageTitle={title || "Create News"}
      saveStatus={loading ? "saving" : isDirty ? "unsaved" : "saved"}
      onBack={() => {
        if (isDirty && !window.confirm("Discard this article and go back?")) return;
        router.push("/news");
      }}
      onSave={() => void handleSave()}
      onPublish={() => void handleSave({ publish: true })}
      onOpenSettings={() => setSettingsOpen(true)}
      onCloseSettings={() => setSettingsOpen(false)}
      settingsOpen={settingsOpen}
      settingsPanel={metaFields}
      settingsTitle="News settings"
    />
  );
}

CreateNews.Layout = AdminLayout;
export default CreateNews;
