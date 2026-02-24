# 抓取具身相关模型脚本说明

## 功能说明

这个脚本用于从 HuggingFace 抓取20个具身相关的模型/数据集，并添加到数据库中。

## 使用方法

```bash
cd backend
npm run tsx src/scripts/fetch-embodied-models.ts
```

或者直接使用 tsx：

```bash
cd backend
npx tsx src/scripts/fetch-embodied-models.ts
```

## 脚本功能

1. **多种搜索方式**：
   - 从已知的具身相关模型列表获取
   - 通过任务类型搜索（robotics, object-detection, depth-estimation等）
   - 通过关键词搜索（robotics, embodied, robot等）

2. **智能过滤**：
   - 自动过滤出与具身相关的模型
   - 按下载量排序，选择最受欢迎的20个

3. **数据丰富**：
   - 获取模型的详细信息（描述、许可证、标签等）
   - 自动处理已存在的模型（跳过重复）

4. **错误处理**：
   - 优雅处理API错误
   - 跳过不存在的模型
   - 详细的日志输出

## 已知模型列表

脚本包含以下已知的具身相关模型：
- RT系列（机器人Transformer）
- 视觉-语言模型（BLIP系列）
- 目标检测模型（DETR系列）
- 深度估计模型（DPT系列）
- 图像分割模型（Mask2Former等）

## 输出示例

```
🚀 开始抓取具身相关的HuggingFace模型...

尝试从已知模型列表获取信息...
  ✅ 获取到: google-research/rt-1
  ✅ 获取到: google-research/rt-2
  ...

📊 统计:
  - 已存在: 5 个
  - 需要添加: 15 个

[1/15] 处理模型: google-research/rt-1
  ✅ 成功添加: google-research/rt-1
     - 下载量: 1,234
     - 点赞数: 56
     - 任务: robotics

📊 最终统计:
  ✅ 成功添加: 15 个
  ⚠️  已存在/跳过: 5 个
  ❌ 失败: 0 个
  📦 总计处理: 20 个

🎉 具身模型抓取完成！
```

## 注意事项

1. 需要配置 `HUGGINGFACE_TOKEN` 环境变量（可选，但推荐）
2. 脚本会自动处理API限流（请求间隔500-1000ms）
3. 如果模型已存在，会自动跳过
4. 脚本会保存所有字段：fullName, description, task, downloads, likes, lastModified, author, license, tags
