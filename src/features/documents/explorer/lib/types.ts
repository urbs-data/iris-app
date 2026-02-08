export interface FileMetadata {
  year: string | null;
  month: string | null;
  classification: string | null;
  sub_classification: string | null;
  date: string | null;
  area: string | null;
  filename: string;
  uploaded_by: string;
  upload_date: string;
  extension: string;
  tipo: string | null;
}

export interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  size: number | null; // null para carpetas
  mimeType?: string;
  modifiedAt: Date;
  uploadedBy: string;
  metadata?: FileMetadata; // Solo para archivos con metadata.json asociado
}

export interface FileListResponse {
  files: FileItem[];
  currentPath: string;
}
