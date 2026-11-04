import type { AxiosRequestConfig } from "axios";

/** Shared axios options for CMS portal file uploads (banners, news, settings, files, etc.). */
export const multipartUploadConfig: AxiosRequestConfig = {
  timeout: 120_000,
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
  headers: {
    "Content-Type": undefined as unknown as string,
  },
};

export function appendUploadFile(
  formData: FormData,
  field: string,
  file: File,
  fallbackName = "upload.bin"
) {
  const name = file.name?.trim() ? file.name : fallbackName;
  formData.append(field, file, name);
}

export function firstApiValidationMessage(error: unknown): string | null {
  const data = (error as { response?: { data?: { message?: string; errors?: Record<string, unknown> } } })
    ?.response?.data;
  if (!data) return null;

  if (data.errors && typeof data.errors === "object") {
    const first = Object.values(data.errors).flat().find(Boolean);
    if (first) return String(first);
  }

  if (data.message) return String(data.message);
  return null;
}
