export type AppStatus = 'DRAFT' | 'UPLOADING' | 'READY' | 'FAILED' | 'PUBLISHED' | 'ARCHIVED';

export type DownloadStage = 
  | 'STARTED'
  | 'WAITING_20S'
  | 'TASK'
  | 'WAITING_10S'
  | 'CONTINUE'
  | 'WAITING_5S'
  | 'READY'
  | 'DOWNLOADED'
  | 'EXPIRED'
  | 'BLOCKED';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon_name?: string;
  sort_order: number;
  created_at?: string;
}

export interface Application {
  id: string;
  name: string;
  slug: string;
  package_name: string;
  version_name: string;
  version_code?: number;
  category_id: string;
  category?: Category;
  icon_path: string;
  file_path: string;
  file_size_bytes: number;
  mime_type?: string;
  source_type: 'device' | 'external_url' | 'drive';
  external_url?: string;
  status: AppStatus;
  is_published: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  deleted_at?: string;
  releases?: ApplicationRelease[];
}

export interface ApplicationRelease {
  id: string;
  application_id: string;
  version_name: string;
  version_code?: number;
  file_path: string;
  file_size_bytes: number;
  checksum?: string;
  status: string;
  created_at: string;
  published_at?: string;
  created_by?: string;
}

export interface UploadDraft {
  id: string;
  developer_id?: string;
  app_name: string;
  package_name: string;
  icon_path?: string;
  icon_preview_url?: string;
  file_path?: string;
  file_name?: string;
  file_size_bytes: number;
  version_name: string;
  version_code?: number;
  category_id?: string;
  source_type?: 'device' | 'external_url' | 'drive';
  external_url?: string;
  validation_status: 'PENDING' | 'VALID' | 'INVALID';
  upload_status: AppStatus;
  current_form_step: number;
  created_at: string;
  updated_at: string;
}

export interface DownloadSession {
  id: string;
  application_id: string;
  user_id?: string;
  session_token: string;
  stage: DownloadStage;
  stage_expires_at?: number;
  started_at: number;
  task_completed_at?: number;
  created_at: string;
  expires_at: number;
  application?: Application;
}

export interface DownloadEvent {
  id?: string;
  application_id: string;
  release_id?: string;
  session_id?: string;
  user_id?: string;
  created_at?: string;
  outcome: 'REQUESTED' | 'COMPLETED' | 'EXPIRED' | 'BLOCKED';
}

export interface SiteSettings {
  site_title: string;
  instagram_url: string;
  developer_name: string;
  stage_1_timer_sec: number;
  stage_3_timer_sec: number;
  stage_5_timer_sec: number;
  share_timer_sec: number;
  maintenance_mode: boolean;
  announcement?: string;
}

export interface ApkMetadata {
  packageName: string;
  versionName: string;
  versionCode: number;
  label?: string;
  fileSizeBytes: number;
  checksumSha256: string;
  iconBlob?: Blob;
  iconDataUrl?: string;
  isExtractedAutomatically: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  details: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface AdminStats {
  publishedCount: number;
  draftCount: number;
  downloadSessionCount: number;
  categoryCount: number;
  totalStorageBytes: number;
  recentLogs: AuditLog[];
}
