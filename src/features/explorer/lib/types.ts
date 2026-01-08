export interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  size: number | null; // null para carpetas
  mimeType?: string;
  modifiedAt: Date;
  uploadedBy: string;
}

export interface FileListResponse {
  files: FileItem[];
  currentPath: string;
}
