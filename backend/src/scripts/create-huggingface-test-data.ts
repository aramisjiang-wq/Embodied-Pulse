import { createHuggingFaceModel } from '../services/huggingface.service';
import { logger } from '../utils/logger';

async function main() {
  try {
    console.log('开始创建HuggingFace测试数据...\n');
    
    const testModels = [
      {
        fullName: 'openai/whisper-large-v3',
        description: 'Whisper is a general-purpose speech recognition model. It is trained on a large dataset of diverse audio and is also a multi-task model that can perform multilingual speech recognition as well as speech translation and language identification.',
        task: 'automatic-speech-recognition',
        downloads: 15000000,
        likes: 45000,
        lastModified: new Date('2024-01-15'),
      },
      {
        fullName: 'meta-llama/Llama-2-7b-hf',
        description: 'Llama 2 is a collection of pretrained and fine-tuned generative text models ranging in scale from 7 billion to 70 billion parameters. This is the repository for the 7B pretrained model.',
        task: 'text-generation',
        downloads: 25000000,
        likes: 120000,
        lastModified: new Date('2024-02-01'),
      },
      {
        fullName: 'google/flan-t5-large',
        description: 'FLAN-T5 is an encoder-decoder model based on the T5 architecture. It was trained using the "Flan" prompt tuning and dataset collection method.',
        task: 'text2text-generation',
        downloads: 8000000,
        likes: 25000,
        lastModified: new Date('2024-01-20'),
      },
      {
        fullName: 'microsoft/DialoGPT-large',
        description: 'DialoGPT is a large-scale pretrained dialogue response generation model for multiturn conversations. It is trained on 147M conversation-like exchanges extracted from Reddit.',
        task: 'conversational',
        downloads: 5000000,
        likes: 15000,
        lastModified: new Date('2024-01-10'),
      },
      {
        fullName: 'facebook/bart-large-cnn',
        description: 'BART model pre-trained on English language text, and fine-tuned on CNN/DailyMail text summarization dataset.',
        task: 'summarization',
        downloads: 12000000,
        likes: 35000,
        lastModified: new Date('2024-01-25'),
      },
      {
        fullName: 'sentence-transformers/all-MiniLM-L6-v2',
        name: 'sentence-transformers/all-MiniLM-L6-v2',
        description: 'This is a sentence-transformers model: It maps sentences & paragraphs to a 384 dimensional dense vector space and can be used for tasks like clustering or semantic search.',
        task: 'feature-extraction',
        downloads: 20000000,
        likes: 80000,
        lastModified: new Date('2024-02-05'),
      },
      {
        fullName: 'stabilityai/stable-diffusion-xl-base-1.0',
        name: 'stabilityai/stable-diffusion-xl-base-1.0',
        description: 'Stable Diffusion XL (SDXL) is a powerful text-to-image generation model that can create high-quality images from text descriptions.',
        task: 'text-to-image',
        downloads: 30000000,
        likes: 150000,
        lastModified: new Date('2024-02-10'),
      },
      {
        fullName: 'bert-base-uncased',
        name: 'bert-base-uncased',
        description: 'BERT is a transformers model pretrained on a large corpus of English data in a self-supervised fashion. This means it was pretrained on the raw texts only, with no humans labeling them.',
        task: 'fill-mask',
        downloads: 45000000,
        likes: 200000,
        lastModified: new Date('2024-01-30'),
      },
      {
        fullName: 'gpt2',
        name: 'gpt2',
        description: 'GPT-2 is a transformers model pretrained on a very large corpus of English data in a self-supervised fashion. This means it was pretrained on the raw texts only, with no humans labeling them.',
        task: 'text-generation',
        downloads: 35000000,
        likes: 180000,
        lastModified: new Date('2024-01-05'),
      },
      {
        fullName: 'microsoft/deberta-v3-large',
        description: 'DeBERTa v3 large model. DeBERTa (Decoding-enhanced BERT with disentangled attention) improves the BERT and RoBERTa models using disentangled attention and enhanced mask decoder.',
        task: 'text-classification',
        downloads: 10000000,
        likes: 30000,
        lastModified: new Date('2024-02-15'),
      },
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const model of testModels) {
      try {
        await createHuggingFaceModel(model as any);
        console.log(`✅ 成功创建模型: ${model.fullName}`);
        successCount++;
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`⚠️  模型已存在: ${model.fullName}`);
        } else {
          console.error(`❌ 创建模型失败: ${model.fullName}`, error.message);
          errorCount++;
        }
      }
    }

    console.log('\n创建结果:');
    console.log(`成功: ${successCount}`);
    console.log(`错误: ${errorCount}`);
    console.log(`总计: ${testModels.length}`);
  } catch (error: any) {
    console.error('创建测试数据失败:', error.message);
    console.error('错误详情:', error);
  }
}

main();
