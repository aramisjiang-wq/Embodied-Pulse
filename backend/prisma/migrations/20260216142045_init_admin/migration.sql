-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "avatar_url" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "last_login_at" DATETIME,
    "tags" TEXT,
    "admin_number" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "admin_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "admin_id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "can_view" BOOLEAN NOT NULL DEFAULT false,
    "can_create" BOOLEAN NOT NULL DEFAULT false,
    "can_update" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "admin_permissions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "link_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "banners" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT NOT NULL,
    "link_url" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "bilibili_uploaders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "description" TEXT,
    "tags" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_sync_at" DATETIME,
    "video_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "content" TEXT NOT NULL,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "folder_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "github_repos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repo_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "owner" TEXT,
    "description" TEXT,
    "html_url" TEXT,
    "language" TEXT,
    "stars_count" INTEGER NOT NULL DEFAULT 0,
    "forks_count" INTEGER NOT NULL DEFAULT 0,
    "issues_count" INTEGER NOT NULL DEFAULT 0,
    "topics" TEXT,
    "created_date" DATETIME,
    "updated_date" DATETIME,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "favorite_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "home_modules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "config" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "huggingface_models" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "full_name" TEXT NOT NULL,
    "description" TEXT,
    "task" TEXT,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "last_modified" DATETIME,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "favorite_count" INTEGER NOT NULL DEFAULT 0,
    "share_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT,
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "description" TEXT,
    "requirements" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "favorite_count" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "bilibili_search_keywords" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyword" TEXT NOT NULL,
    "category" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "paper_search_keywords" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyword" TEXT NOT NULL,
    "category" TEXT,
    "source_type" TEXT NOT NULL DEFAULT 'admin',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "tags" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "news" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "score" TEXT,
    "description" TEXT,
    "published_date" DATETIME,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "favorite_count" INTEGER NOT NULL DEFAULT 0,
    "share_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "news_search_keywords" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyword" TEXT NOT NULL,
    "category" TEXT,
    "source_type" TEXT NOT NULL DEFAULT 'admin',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "tags" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "news_keyword_filters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "keywords" TEXT,
    "exclude_keywords" TEXT,
    "match_type" TEXT NOT NULL DEFAULT 'all',
    "case_sensitive" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "apply_to_platform" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "news_source_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "base_url" TEXT NOT NULL,
    "search_url" TEXT,
    "list_url" TEXT,
    "headers" TEXT,
    "params" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sync_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sync_interval" INTEGER NOT NULL DEFAULT 3600,
    "last_sync_at" DATETIME,
    "last_success_at" DATETIME,
    "total_items" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "papers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "arxiv_id" TEXT,
    "title" TEXT NOT NULL,
    "authors" TEXT NOT NULL,
    "abstract" TEXT,
    "pdf_url" TEXT,
    "published_date" DATETIME,
    "citation_count" INTEGER NOT NULL DEFAULT 0,
    "venue" TEXT,
    "categories" TEXT,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "favorite_count" INTEGER NOT NULL DEFAULT 0,
    "share_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "point_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "action_type" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "point_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subscription_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscription_id" TEXT NOT NULL,
    "sync_type" TEXT NOT NULL,
    "matched_count" INTEGER NOT NULL DEFAULT 0,
    "new_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'success',
    "error_message" TEXT,
    "duration" INTEGER,
    "metadata" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subscription_history_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "keywords" TEXT,
    "tags" TEXT,
    "authors" TEXT,
    "uploaders" TEXT,
    "platform" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notify_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sync_enabled" BOOLEAN NOT NULL DEFAULT true,
    "new_count" INTEGER NOT NULL DEFAULT 0,
    "total_matched" INTEGER NOT NULL DEFAULT 0,
    "last_notified" DATETIME,
    "last_checked" DATETIME,
    "last_sync_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_actions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "metadata" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_number" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT,
    "avatar_url" TEXT,
    "bio" TEXT,
    "github_id" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "points" INTEGER NOT NULL DEFAULT 0,
    "is_vip" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" DATETIME,
    "tags" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "video_id" TEXT NOT NULL,
    "bvid" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cover_url" TEXT,
    "duration" INTEGER,
    "uploader" TEXT,
    "uploader_id" TEXT,
    "published_date" DATETIME,
    "play_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "favorite_count" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT,
    "metadata" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "data_sources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT,
    "api_base_url" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "health_status" TEXT NOT NULL DEFAULT 'unknown',
    "last_health_check" DATETIME,
    "last_sync_status" TEXT,
    "last_sync_result" TEXT,
    "last_sync_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "data_source_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data_source_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "request_url" TEXT,
    "request_method" TEXT,
    "request_body" TEXT,
    "response_code" INTEGER,
    "response_body" TEXT,
    "error_message" TEXT,
    "duration" INTEGER,
    "synced_count" INTEGER,
    "error_count" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admins_admin_number_key" ON "admins"("admin_number");

-- CreateIndex
CREATE INDEX "admins_is_active_idx" ON "admins"("is_active");

-- CreateIndex
CREATE INDEX "admin_permissions_admin_id_idx" ON "admin_permissions"("admin_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_permissions_admin_id_module_key" ON "admin_permissions"("admin_id", "module");

-- CreateIndex
CREATE INDEX "announcements_is_active_idx" ON "announcements"("is_active");

-- CreateIndex
CREATE INDEX "banners_order_idx" ON "banners"("order");

-- CreateIndex
CREATE UNIQUE INDEX "bilibili_uploaders_mid_key" ON "bilibili_uploaders"("mid");

-- CreateIndex
CREATE INDEX "comments_created_at_idx" ON "comments"("created_at" DESC);

-- CreateIndex
CREATE INDEX "comments_post_id_idx" ON "comments"("post_id");

-- CreateIndex
CREATE INDEX "comments_user_id_idx" ON "comments"("user_id");

-- CreateIndex
CREATE INDEX "favorites_content_type_content_id_idx" ON "favorites"("content_type", "content_id");

-- CreateIndex
CREATE INDEX "favorites_user_id_idx" ON "favorites"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_content_type_content_id_key" ON "favorites"("user_id", "content_type", "content_id");

-- CreateIndex
CREATE UNIQUE INDEX "github_repos_full_name_key" ON "github_repos"("full_name");

-- CreateIndex
CREATE INDEX "github_repos_updated_date_idx" ON "github_repos"("updated_date" DESC);

-- CreateIndex
CREATE INDEX "github_repos_stars_count_idx" ON "github_repos"("stars_count" DESC);

-- CreateIndex
CREATE INDEX "github_repos_repo_id_idx" ON "github_repos"("repo_id");

-- CreateIndex
CREATE UNIQUE INDEX "home_modules_name_key" ON "home_modules"("name");

-- CreateIndex
CREATE INDEX "home_modules_order_idx" ON "home_modules"("order");

-- CreateIndex
CREATE UNIQUE INDEX "huggingface_models_full_name_key" ON "huggingface_models"("full_name");

-- CreateIndex
CREATE INDEX "huggingface_models_last_modified_idx" ON "huggingface_models"("last_modified" DESC);

-- CreateIndex
CREATE INDEX "huggingface_models_downloads_idx" ON "huggingface_models"("downloads" DESC);

-- CreateIndex
CREATE INDEX "jobs_created_at_idx" ON "jobs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bilibili_search_keywords_keyword_key" ON "bilibili_search_keywords"("keyword");

-- CreateIndex
CREATE INDEX "bilibili_search_keywords_priority_idx" ON "bilibili_search_keywords"("priority" DESC);

-- CreateIndex
CREATE INDEX "bilibili_search_keywords_is_active_idx" ON "bilibili_search_keywords"("is_active");

-- CreateIndex
CREATE INDEX "bilibili_search_keywords_category_idx" ON "bilibili_search_keywords"("category");

-- CreateIndex
CREATE UNIQUE INDEX "paper_search_keywords_keyword_key" ON "paper_search_keywords"("keyword");

-- CreateIndex
CREATE INDEX "paper_search_keywords_priority_idx" ON "paper_search_keywords"("priority" DESC);

-- CreateIndex
CREATE INDEX "paper_search_keywords_is_active_idx" ON "paper_search_keywords"("is_active");

-- CreateIndex
CREATE INDEX "paper_search_keywords_category_idx" ON "paper_search_keywords"("category");

-- CreateIndex
CREATE UNIQUE INDEX "news_url_key" ON "news"("url");

-- CreateIndex
CREATE INDEX "news_created_at_idx" ON "news"("created_at" DESC);

-- CreateIndex
CREATE INDEX "news_view_count_idx" ON "news"("view_count" DESC);

-- CreateIndex
CREATE INDEX "news_published_date_idx" ON "news"("published_date" DESC);

-- CreateIndex
CREATE INDEX "news_platform_idx" ON "news"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "news_search_keywords_keyword_key" ON "news_search_keywords"("keyword");

-- CreateIndex
CREATE INDEX "news_search_keywords_priority_idx" ON "news_search_keywords"("priority" DESC);

-- CreateIndex
CREATE INDEX "news_search_keywords_is_active_idx" ON "news_search_keywords"("is_active");

-- CreateIndex
CREATE INDEX "news_search_keywords_category_idx" ON "news_search_keywords"("category");

-- CreateIndex
CREATE UNIQUE INDEX "news_keyword_filters_name_key" ON "news_keyword_filters"("name");

-- CreateIndex
CREATE INDEX "news_keyword_filters_priority_idx" ON "news_keyword_filters"("priority" DESC);

-- CreateIndex
CREATE INDEX "news_keyword_filters_is_active_idx" ON "news_keyword_filters"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "news_source_configs_platform_key" ON "news_source_configs"("platform");

-- CreateIndex
CREATE INDEX "news_source_configs_sync_enabled_idx" ON "news_source_configs"("sync_enabled");

-- CreateIndex
CREATE INDEX "news_source_configs_is_active_idx" ON "news_source_configs"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "papers_arxiv_id_key" ON "papers"("arxiv_id");

-- CreateIndex
CREATE INDEX "papers_favorite_count_idx" ON "papers"("favorite_count" DESC);

-- CreateIndex
CREATE INDEX "papers_view_count_idx" ON "papers"("view_count" DESC);

-- CreateIndex
CREATE INDEX "papers_published_date_idx" ON "papers"("published_date" DESC);

-- CreateIndex
CREATE INDEX "point_records_created_at_idx" ON "point_records"("created_at" DESC);

-- CreateIndex
CREATE INDEX "point_records_user_id_idx" ON "point_records"("user_id");

-- CreateIndex
CREATE INDEX "posts_status_created_at_idx" ON "posts"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "posts_content_type_content_id_idx" ON "posts"("content_type", "content_id");

-- CreateIndex
CREATE INDEX "posts_user_id_idx" ON "posts"("user_id");

-- CreateIndex
CREATE INDEX "subscription_history_created_at_idx" ON "subscription_history"("created_at" DESC);

-- CreateIndex
CREATE INDEX "subscription_history_subscription_id_idx" ON "subscription_history"("subscription_id");

-- CreateIndex
CREATE INDEX "subscriptions_sync_enabled_idx" ON "subscriptions"("sync_enabled");

-- CreateIndex
CREATE INDEX "subscriptions_is_public_idx" ON "subscriptions"("is_public");

-- CreateIndex
CREATE INDEX "subscriptions_is_active_idx" ON "subscriptions"("is_active");

-- CreateIndex
CREATE INDEX "subscriptions_content_type_idx" ON "subscriptions"("content_type");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "user_actions_created_at_idx" ON "user_actions"("created_at" DESC);

-- CreateIndex
CREATE INDEX "user_actions_content_type_content_id_idx" ON "user_actions"("content_type", "content_id");

-- CreateIndex
CREATE INDEX "user_actions_user_id_action_type_idx" ON "user_actions"("user_id", "action_type");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_number_key" ON "users"("user_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_github_id_key" ON "users"("github_id");

-- CreateIndex
CREATE UNIQUE INDEX "videos_bvid_key" ON "videos"("bvid");

-- CreateIndex
CREATE INDEX "videos_platform_idx" ON "videos"("platform");

-- CreateIndex
CREATE INDEX "videos_view_count_idx" ON "videos"("view_count" DESC);

-- CreateIndex
CREATE INDEX "videos_published_date_idx" ON "videos"("published_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "data_sources_name_key" ON "data_sources"("name");

-- CreateIndex
CREATE INDEX "data_sources_enabled_idx" ON "data_sources"("enabled");

-- CreateIndex
CREATE INDEX "data_sources_health_status_idx" ON "data_sources"("health_status");

-- CreateIndex
CREATE INDEX "data_source_logs_data_source_id_idx" ON "data_source_logs"("data_source_id");

-- CreateIndex
CREATE INDEX "data_source_logs_created_at_idx" ON "data_source_logs"("created_at" DESC);
