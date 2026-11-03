import PageEditorSettingsPanel from "@/components/Pages/PageEditorSettingsPanel";
import type { ArticleCategory } from "@/services/articleService";

type NewsEditorMetaFieldsProps = {
  mode?: "create" | "edit";
  title: string;
  onTitleChange: (value: string) => void;
  onTitleBlur?: () => void;
  date: string;
  onDateChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  categories: ArticleCategory[];
  loadingCategories?: boolean;
  teaser: string;
  onTeaserChange: (value: string) => void;
  onTeaserBlur?: () => void;
  isPublished: boolean;
  onIsPublishedChange: (value: boolean) => void;
  isFeatured: boolean;
  onIsFeaturedChange: (value: boolean) => void;
  bannerPreview: string | null;
  onBannerChange: (file: File | null) => void;
  thumbnailPreview: string | null;
  onThumbnailChange: (file: File | null) => void;
  seoTitle: string;
  onSeoTitleChange: (value: string) => void;
  seoDescription: string;
  onSeoDescriptionChange: (value: string) => void;
  seoKeywords: string;
  onSeoKeywordsChange: (value: string) => void;
};

export default function NewsEditorMetaFields({
  mode = "edit",
  title,
  onTitleChange,
  onTitleBlur,
  date,
  onDateChange,
  category,
  onCategoryChange,
  categories,
  loadingCategories = false,
  teaser,
  onTeaserChange,
  onTeaserBlur,
  isPublished,
  onIsPublishedChange,
  isFeatured,
  onIsFeaturedChange,
  bannerPreview,
  onBannerChange,
  thumbnailPreview,
  onThumbnailChange,
  seoTitle,
  onSeoTitleChange,
  seoDescription,
  onSeoDescriptionChange,
  seoKeywords,
  onSeoKeywordsChange,
}: NewsEditorMetaFieldsProps) {
  const bannerRequired = mode === "create";

  return (
    <div className="page-editor__settings-stack">
      <PageEditorSettingsPanel title="News Details" tourId="news-editor-details">
        <div className="mb-3">
          <label className="form-label">
            Title <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            onBlur={onTitleBlur}
            placeholder="Article headline"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">
            Date <span className="text-danger">*</span>
          </label>
          <input
            type="date"
            className="form-control"
            value={date}
            onChange={(event) => onDateChange(event.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">
            Category <span className="text-danger">*</span>
          </label>
          <select
            className="form-select"
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            disabled={loadingCategories}
          >
            <option value="">
              {loadingCategories ? "Loading categories..." : "Select category"}
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">
            Teaser <span className="text-danger">*</span>
          </label>
          <textarea
            className="form-control"
            rows={3}
            value={teaser}
            onChange={(event) => onTeaserChange(event.target.value)}
            onBlur={onTeaserBlur}
            placeholder="Short summary for news listings"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Page Visibility</label>
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="newsVisibilitySwitch"
              checked={isPublished}
              onChange={() => onIsPublishedChange(!isPublished)}
            />
            <label className="form-check-label" htmlFor="newsVisibilitySwitch">
              {isPublished ? "Published" : "Private"}
            </label>
          </div>
        </div>

        <div className="mb-0">
          <label className="form-label">Featured (max 3 on site)</label>
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="newsFeaturedSwitch"
              checked={isFeatured}
              onChange={() => onIsFeaturedChange(!isFeatured)}
            />
            <label className="form-check-label" htmlFor="newsFeaturedSwitch">
              Mark as featured
            </label>
          </div>
        </div>
      </PageEditorSettingsPanel>

      <PageEditorSettingsPanel title="Media" defaultOpen={mode === "create"} tourId="news-editor-media">
        <div className="mb-3">
          <label className="form-label">
            Article Banner
            {bannerRequired ? <span className="text-danger"> *</span> : null}
          </label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={(event) => onBannerChange(event.target.files?.[0] || null)}
          />
          {bannerPreview && (
            <img
              src={bannerPreview}
              alt=""
              className="img-fluid rounded border mt-2"
              style={{ maxHeight: 200 }}
            />
          )}
        </div>

        <div className="mb-0">
          <label className="form-label">
            Article Thumbnail
            {bannerRequired ? <span className="text-danger"> *</span> : null}
          </label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={(event) => onThumbnailChange(event.target.files?.[0] || null)}
          />
          {thumbnailPreview && (
            <img
              src={thumbnailPreview}
              alt=""
              className="img-fluid rounded border mt-2"
              style={{ maxHeight: 150 }}
            />
          )}
        </div>
      </PageEditorSettingsPanel>

      <PageEditorSettingsPanel title="SEO Settings" defaultOpen={false} tourId="news-editor-seo">
        <div className="mb-3">
          <label className="form-label">SEO Title</label>
          <input
            type="text"
            className="form-control"
            value={seoTitle}
            onChange={(event) => onSeoTitleChange(event.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">SEO Description</label>
          <textarea
            className="form-control"
            rows={4}
            value={seoDescription}
            onChange={(event) => onSeoDescriptionChange(event.target.value)}
          />
        </div>

        <div className="mb-0">
          <label className="form-label">SEO Keywords</label>
          <input
            type="text"
            className="form-control"
            value={seoKeywords}
            onChange={(event) => onSeoKeywordsChange(event.target.value)}
            placeholder="news, updates, company"
          />
        </div>
      </PageEditorSettingsPanel>
    </div>
  );
}
