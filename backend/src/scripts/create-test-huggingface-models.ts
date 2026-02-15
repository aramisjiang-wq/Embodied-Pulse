import userPrisma from '../config/database.user';

const TEST_MODELS = [
  {
    fullName: 'openai/whisper-large-v3',
    description: 'OpenAI Whisper large v3 - 最先进的语音识别模型，支持多语言转录和翻译',
    task: 'automatic-speech-recognition',
    downloads: 15432000,
    likes: 8950,
    lastModified: new Date('2024-01-15'),
  },
  {
    fullName: 'meta-llama/Llama-2-7b-chat-hf',
    description: 'Meta Llama 2 7B Chat - 经过微调的对话模型，支持多种对话任务',
    task: 'text-generation',
    downloads: 12345000,
    likes: 12450,
    lastModified: new Date('2024-01-10'),
  },
  {
    fullName: 'stabilityai/stable-diffusion-xl-base-1.0',
    description: 'Stable Diffusion XL - 高质量图像生成模型，支持多种艺术风格',
    task: 'text-to-image',
    downloads: 9876000,
    likes: 15600,
    lastModified: new Date('2024-01-12'),
  },
  {
    fullName: 'google/gemma-7b',
    description: 'Google Gemma 7B - 开源的大型语言模型，性能优异',
    task: 'text-generation',
    downloads: 8765000,
    likes: 9800,
    lastModified: new Date('2024-01-08'),
  },
  {
    fullName: 'microsoft/Phi-3-mini-4k-instruct',
    description: 'Microsoft Phi-3 Mini - 轻量级语言模型，适合边缘设备部署',
    task: 'text-generation',
    downloads: 7654000,
    likes: 8900,
    lastModified: new Date('2024-01-14'),
  },
  {
    fullName: 'openai/clip-vit-large-patch14',
    description: 'OpenAI CLIP ViT Large - 视觉-语言模型，支持图像分类和检索',
    task: 'zero-shot-image-classification',
    downloads: 6543000,
    likes: 7800,
    lastModified: new Date('2024-01-05'),
  },
  {
    fullName: 'sentence-transformers/all-MiniLM-L6-v2',
    description: 'Sentence Transformers MiniLM - 轻量级句子嵌入模型，支持语义搜索',
    task: 'feature-extraction',
    downloads: 5432000,
    likes: 6700,
    lastModified: new Date('2024-01-11'),
  },
  {
    fullName: 'facebook/bart-large-mnli',
    description: 'Facebook BART Large MNLI - 自然语言推理模型，支持零样本分类',
    task: 'zero-shot-classification',
    downloads: 4321000,
    likes: 5600,
    lastModified: new Date('2024-01-09'),
  },
  {
    fullName: 'huggingface/gpt2-xl',
    description: 'HuggingFace GPT-2 XL - 大型语言模型，支持文本生成任务',
    task: 'text-generation',
    downloads: 3210000,
    likes: 4500,
    lastModified: new Date('2024-01-07'),
  },
  {
    fullName: 'distilbert-base-uncased-finetuned-sst-2-english',
    description: 'DistilBERT SST-2 - 情感分析模型，轻量级且高效',
    task: 'text-classification',
    downloads: 2100000,
    likes: 3400,
    lastModified: new Date('2024-01-06'),
  },
  {
    fullName: 'google/vit-base-patch16-224',
    description: 'Google ViT Base - Vision Transformer模型，用于图像分类',
    task: 'image-classification',
    downloads: 1980000,
    likes: 3200,
    lastModified: new Date('2024-01-13'),
  },
  {
    fullName: 'microsoft/DialoGPT-large',
    description: 'Microsoft DialoGPT Large - 对话生成模型，支持多轮对话',
    task: 'text-generation',
    downloads: 1870000,
    likes: 2900,
    lastModified: new Date('2024-01-04'),
  },
  {
    fullName: 'facebook/wav2vec2-base-960h',
    description: 'Facebook Wav2Vec2 Base - 语音识别模型，支持英语转录',
    task: 'automatic-speech-recognition',
    downloads: 1760000,
    likes: 2800,
    lastModified: new Date('2024-01-03'),
  },
  {
    fullName: 'cardiffnlp/twitter-roberta-base-sentiment',
    description: 'Twitter RoBERTa Sentiment - 社交媒体情感分析模型',
    task: 'text-classification',
    downloads: 1650000,
    likes: 2700,
    lastModified: new Date('2024-01-02'),
  },
  {
    fullName: 'deepset/roberta-base-squad2',
    description: 'Deepset RoBERTa SQuAD2 - 问答系统模型，支持抽取式问答',
    task: 'question-answering',
    downloads: 1540000,
    likes: 2600,
    lastModified: new Date('2024-01-16'),
  },
  {
    fullName: 'openai/whisper-medium',
    description: 'OpenAI Whisper Medium - 中型语音识别模型，平衡性能和速度',
    task: 'automatic-speech-recognition',
    downloads: 1430000,
    likes: 2500,
    lastModified: new Date('2024-01-17'),
  },
  {
    fullName: 'allenai/longformer-base-4096',
    description: 'AllenAI Longformer - 长文档处理模型，支持4096 token',
    task: 'question-answering',
    downloads: 1320000,
    likes: 2400,
    lastModified: new Date('2024-01-18'),
  },
  {
    fullName: 'google/pegasus-xsum',
    description: 'Google PEGASUS XSUM - 文本摘要模型，支持多种摘要任务',
    task: 'summarization',
    downloads: 1210000,
    likes: 2300,
    lastModified: new Date('2024-01-19'),
  },
  {
    fullName: 'microsoft/deberta-v3-large',
    description: 'Microsoft DeBERTa v3 Large - 高性能语言模型，支持多种NLP任务',
    task: 'text-classification',
    downloads: 1100000,
    likes: 2200,
    lastModified: new Date('2024-01-20'),
  },
  {
    fullName: 'facebook/bart-large-cnn',
    description: 'Facebook BART Large CNN - 新闻摘要模型，支持长文本摘要',
    task: 'summarization',
    downloads: 990000,
    likes: 2100,
    lastModified: new Date('2024-01-21'),
  },
];

async function main() {
  try {
    console.log('开始创建测试HuggingFace模型数据...\n');

    let createdCount = 0;
    let skippedCount = 0;

    for (const modelData of TEST_MODELS) {
      try {
        await userPrisma.huggingFaceModel.create({
          data: modelData,
        });
        createdCount++;
        console.log(`✓ 创建模型: ${modelData.fullName}`);
      } catch (error: any) {
        if (error.code === 'P2002') {
          skippedCount++;
          console.log(`- 跳过已存在: ${modelData.fullName}`);
        } else {
          console.error(`✗ 创建失败: ${modelData.fullName}`, error.message);
        }
      }
    }

    console.log(`\n完成！`);
    console.log(`创建: ${createdCount}个`);
    console.log(`跳过: ${skippedCount}个`);
    console.log(`总计: ${TEST_MODELS.length}个`);
  } catch (error) {
    console.error('创建失败:', error);
  }
}

main();
