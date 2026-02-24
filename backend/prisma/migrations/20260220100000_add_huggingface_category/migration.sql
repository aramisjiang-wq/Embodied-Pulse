-- Add category column to huggingface_models for 具身智能资源大全分类
-- 模型: vla-openvla, vla-rt, gr00t, lerobot-act, ... 数据集: dataset-core-openx, dataset-lerobot-aloha, ...
ALTER TABLE huggingface_models ADD COLUMN category TEXT;
CREATE INDEX IF NOT EXISTS huggingface_models_category_idx ON huggingface_models(category);
