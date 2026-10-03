/**
 * Utility helpers for file formatting, icon resolution, and type detection.
 */

export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
};

export const getFileIcon = (fileName: string): string => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "picture-as-pdf";
    case "doc":
    case "docx":
      return "description";
    case "xls":
    case "xlsx":
      return "table-chart";
    case "ppt":
    case "pptx":
      return "slideshow";
    case "zip":
    case "rar":
    case "tar":
      return "inventory";
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
      return "image";
    default:
      return "insert-drive-file";
  }
};

export const isPdf = (fileName: string): boolean => {
  return fileName.toLowerCase().endsWith(".pdf");
};

export const isLocalUrl = (url: string): boolean => {
  return (
    url.startsWith("file://") ||
    url.startsWith("content://") ||
    !url.startsWith("http")
  );
};
