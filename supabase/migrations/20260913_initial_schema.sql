-- =============================================================================
-- DARK PRIME MODS — Master Database Migration
-- Version: 1.0 (Cloudflare & Supabase Edition)
-- Created By: BHARAT KUMAR
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Syncs with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'developer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon_name TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  package_name TEXT NOT NULL,
  version_name TEXT NOT NULL,
  version_code INTEGER DEFAULT 1,
  category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  icon_path TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT DEFAULT 'application/vnd.android.package-archive',
  source_type TEXT NOT NULL DEFAULT 'device' CHECK (source_type IN ('device', 'external_url', 'drive')),
  external_url TEXT,
  status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'UPLOADING', 'READY', 'FAILED', 'PUBLISHED', 'ARCHIVED')),
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ
);

-- Index for searching and filtering
CREATE INDEX IF NOT EXISTS idx_applications_published ON public.applications (is_published, deleted_at);
CREATE INDEX IF NOT EXISTS idx_applications_category ON public.applications (category_id);
CREATE INDEX IF NOT EXISTS idx_applications_search ON public.applications (name, package_name);

-- 4. APPLICATION RELEASES TABLE
CREATE TABLE IF NOT EXISTS public.application_releases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  version_name TEXT NOT NULL,
  version_code INTEGER DEFAULT 1,
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  checksum TEXT,
  status TEXT NOT NULL DEFAULT 'PUBLISHED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 5. UPLOAD DRAFTS TABLE (PRD #28)
CREATE TABLE IF NOT EXISTS public.upload_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  developer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  app_name TEXT,
  package_name TEXT,
  icon_path TEXT,
  file_path TEXT,
  file_size_bytes BIGINT DEFAULT 0,
  version_name TEXT,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  validation_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (validation_status IN ('PENDING', 'VALID', 'INVALID')),
  upload_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (upload_status IN ('DRAFT', 'UPLOADING', 'READY', 'FAILED', 'PUBLISHED', 'ARCHIVED')),
  current_form_step INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. DOWNLOAD SESSIONS TABLE (PRD #44)
CREATE TABLE IF NOT EXISTS public.download_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_token_hash TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'WAITING_20S' CHECK (stage IN ('STARTED', 'WAITING_20S', 'TASK', 'WAITING_10S', 'CONTINUE', 'WAITING_5S', 'READY', 'DOWNLOADED', 'EXPIRED', 'BLOCKED')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  task_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. DOWNLOAD EVENTS TABLE (PRD #46)
CREATE TABLE IF NOT EXISTS public.download_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  release_id UUID REFERENCES public.application_releases(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.download_sessions(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  outcome TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (outcome IN ('REQUESTED', 'COMPLETED', 'EXPIRED', 'BLOCKED'))
);

-- 8. SHARE EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.share_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TASKS TABLE (PRD #42 Social task)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_type TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 10. TASK COMPLETIONS TABLE
CREATE TABLE IF NOT EXISTS public.task_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.download_sessions(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. ADMIN SESSIONS TABLE (PRD #10)
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_hash TEXT NOT NULL,
  ip_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. AUDIT LOGS TABLE (PRD #33)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. SITE SETTINGS TABLE (PRD #49)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. LEGAL DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.legal_documents (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. FEATURE FLAGS TABLE
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Categories: Public read
CREATE POLICY "Public categories are viewable by everyone" 
ON public.categories FOR SELECT USING (true);

-- Applications: Public can read published non-deleted applications
CREATE POLICY "Published applications are viewable by everyone" 
ON public.applications FOR SELECT 
USING (is_published = true AND deleted_at IS NULL);

-- Application Releases: Public can read releases for published applications
CREATE POLICY "Public releases viewable by everyone"
ON public.application_releases FOR SELECT
USING (status = 'PUBLISHED');

-- Site settings & Legal documents: Public read
CREATE POLICY "Site settings viewable by everyone"
ON public.site_settings FOR SELECT USING (true);

CREATE POLICY "Legal documents viewable by everyone"
ON public.legal_documents FOR SELECT USING (true);

CREATE POLICY "Tasks viewable by everyone"
ON public.tasks FOR SELECT USING (is_active = true);

-- Profiles: Users can read and update their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- =============================================================================
-- SEED INITIAL DATA (PRD #15 Categories & PRD #49 Settings)
-- =============================================================================

INSERT INTO public.categories (id, name, slug, sort_order) VALUES
('cat-1', 'Android Apps', 'android-apps', 1),
('cat-2', 'Games', 'games', 2),
('cat-3', 'Action', 'action', 3),
('cat-4', 'Adventure', 'adventure', 4),
('cat-5', 'Arcade', 'arcade', 5),
('cat-6', 'Casual', 'casual', 6),
('cat-7', 'Racing', 'racing', 7),
('cat-8', 'Simulation', 'simulation', 8),
('cat-9', 'Sports', 'sports', 9),
('cat-10', 'Strategy', 'strategy', 10),
('cat-11', 'Puzzle', 'puzzle', 11),
('cat-12', 'Educational', 'educational', 12),
('cat-13', 'Productivity', 'productivity', 13),
('cat-14', 'Tools', 'tools', 14),
('cat-15', 'Utility', 'utility', 15),
('cat-16', 'Multimedia', 'multimedia', 16),
('cat-17', 'Photography', 'photography', 17),
('cat-18', 'Video', 'video', 18),
('cat-19', 'Music', 'music', 19),
('cat-20', 'Social', 'social', 20),
('cat-21', 'Communication', 'communication', 21),
('cat-22', 'Finance', 'finance', 22),
('cat-23', 'Business', 'business', 23),
('cat-24', 'Lifestyle', 'lifestyle', 24),
('cat-25', 'Personalization', 'personalization', 25),
('cat-26', 'Security', 'security', 26),
('cat-27', 'File Management', 'file-management', 27),
('cat-28', 'Internet', 'internet', 28),
('cat-29', 'Other', 'other', 29)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.site_settings (key, value, description) VALUES
('general', '{"site_title": "DARK PRIME MODS", "developer_name": "BHARAT KUMAR", "maintenance_mode": false}'::jsonb, 'General site settings'),
('instagram_task', '{"url": "https://instagram.com/darkprimemods", "required": true}'::jsonb, 'Social follow task link'),
('download_timers', '{"stage_1_sec": 20, "stage_3_sec": 10, "stage_5_sec": 5, "share_sec": 5}'::jsonb, 'Download stages timer durations')
ON CONFLICT (key) DO NOTHING;

-- Initial default task
INSERT INTO public.tasks (task_type, title, url, sort_order, is_active) VALUES
('INSTAGRAM_FOLLOW', 'Follow on Instagram', 'https://instagram.com/darkprimemods', 1, true)
ON CONFLICT DO NOTHING;
