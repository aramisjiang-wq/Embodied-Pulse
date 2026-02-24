-- CreateTable
CREATE TABLE "huggingface_author_subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "author" TEXT NOT NULL,
    "author_url" TEXT,
    "is_active" INTEGER NOT NULL DEFAULT 1,
    "model_count" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT,
    "last_sync_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
