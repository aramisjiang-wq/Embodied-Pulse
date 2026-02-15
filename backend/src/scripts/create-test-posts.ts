import axios from 'axios';

const API_BASE = 'http://localhost:3001/api/v1';

interface RegisterResponse {
  code: number;
  message: string;
  data: {
    token: string;
    refreshToken: string;
    user: any;
  };
}

interface CreatePostResponse {
  code: number;
  message: string;
  data: {
    postId: string;
    pointsEarned: number;
    estimatedViews: number;
  };
}

interface LoginResponse {
  code: number;
  message: string;
  data: {
    token: string;
    refreshToken: string;
    user: any;
  };
}

async function registerOrLogin() {
  console.log('正在登录或注册账号...');
  
  try {
    const response = await axios.post<LoginResponse>(`${API_BASE}/auth/login`, {
      email: 'gradmotion@limxdynamics.com',
      password: 'limx123456',
    });

    if (response.data.code === 0) {
      console.log('登录成功！');
      console.log('用户名:', response.data.data.user.username);
      console.log('用户ID:', response.data.data.user.id);
      return response.data.data.token;
    }
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.log('登录失败，尝试注册...');
    } else {
      throw error;
    }
  }
  
  const response = await axios.post<RegisterResponse>(`${API_BASE}/auth/register`, {
    username: 'saibomoyu',
    email: 'gradmotion@limxdynamics.com',
    password: 'limx123456',
  });

  if (response.data.code === 0) {
    console.log('注册成功！');
    console.log('用户名:', response.data.data.user.username);
    console.log('用户ID:', response.data.data.user.id);
    return response.data.data.token;
  } else {
    throw new Error(response.data.message);
  }
}

async function createPost(token: string, postData: any) {
  const response = await axios.post<CreatePostResponse>(
    `${API_BASE}/posts`,
    postData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.data.code === 0) {
    console.log(`✓ 帖子创建成功: ${postData.title}`);
    return response.data.data;
  } else {
    console.error(`✗ 帖子创建失败: ${postData.title}`, response.data.message);
    throw new Error(response.data.message);
  }
}

async function main() {
  try {
    const token = await registerOrLogin();

    const postTypes = [
      'discussion',
      'paper',
      'video',
      'repo',
      'model',
      'event',
      'job',
      'resource',
    ];

    const postsData: any[] = [];

    for (const type of postTypes) {
      for (let i = 1; i <= 3; i++) {
        const post = generatePost(type, i);
        postsData.push(post);
      }
    }

    console.log(`\n准备创建 ${postsData.length} 个帖子...\n`);

    for (const postData of postsData) {
      try {
        await createPost(token, postData);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('创建帖子失败:', error);
      }
    }

    console.log('\n所有帖子创建完成！');
  } catch (error) {
    console.error('执行失败:', error);
  }
}

function generatePost(type: string, index: number) {
  const titles: Record<string, string[]> = {
    discussion: [
      '大模型训练中的显存优化技巧分享',
      'Transformer架构的改进方向讨论',
      '多模态大模型的发展趋势',
    ],
    paper: [
      '推荐一篇关于自监督学习的最新论文',
      '分享一篇CVPR 2024的优质论文',
      '这篇关于强化学习的论文值得一看',
    ],
    video: [
      '推荐一个深度学习入门教程视频',
      '分享一个Transformer架构讲解视频',
      '这个视频讲解了最新的多模态模型',
    ],
    repo: [
      '推荐一个优秀的开源深度学习框架',
      '这个GitHub项目实现了最新的Transformer变体',
      '分享一个实用的数据处理工具库',
    ],
    model: [
      '推荐一个Hugging Face上的优质模型',
      '这个模型在NLP任务上表现很好',
      '分享一个多模态大模型',
    ],
    event: [
      'ICLR 2024会议即将召开',
      'AI开发者大会报名中',
      '深度学习研讨会通知',
    ],
    job: [
      '招聘：大模型算法工程师',
      'AI研究员职位招聘',
      '机器学习工程师招聘信息',
    ],
    resource: [
      '分享一些优质的AI学习资源',
      '推荐几个深度学习数据集',
      '分享一些AI工具和平台',
    ],
  };

  const contents: Record<string, string[]> = {
    discussion: [
      '最近在训练大模型时遇到了显存不足的问题，尝试了几种优化方法，包括梯度检查点、混合精度训练等，效果还不错。想和大家分享一下经验，也欢迎讨论其他优化技巧。',
      'Transformer架构自从提出以来已经有很多改进，比如注意力机制的优化、位置编码的改进等。大家觉得未来Transformer还会有哪些可能的改进方向？',
      '多模态大模型最近发展很快，从GPT-4V到Gemini，再到国内的多个模型。大家觉得多模态大模型在哪些应用场景下最有潜力？',
    ],
    paper: [
      '最近看到一篇关于自监督学习的论文，提出了一种新的预训练方法，在多个下游任务上都取得了SOTA效果。论文链接：https://arxiv.org/abs/xxxx，推荐大家阅读。',
      'CVPR 2024有一篇关于视觉Transformer的论文很有意思，提出了一种新的注意力机制，在保持性能的同时大幅降低了计算复杂度。值得深入研究。',
      '这篇强化学习论文提出了一种新的算法，解决了传统方法在稀疏奖励环境下的学习困难问题。实验结果很impressive，推荐给做RL的同学。',
    ],
    video: [
      '分享一个深度学习入门教程，从基础概念到实际应用，讲解得很清晰，适合初学者。视频链接：https://www.bilibili.com/video/xxxx',
      '这个视频详细讲解了Transformer架构的原理和实现，包括自注意力机制、位置编码等核心概念，讲得通俗易懂。',
      '推荐一个讲解最新多模态模型的视频，涵盖了视觉-语言模型、音频-语言模型等多个方向，内容很全面。',
    ],
    repo: [
      '推荐一个优秀的开源深度学习框架，提供了丰富的预训练模型和训练工具，文档完善，市集活跃。GitHub链接：https://github.com/xxxx',
      '这个GitHub项目实现了最新的Transformer变体，包括线性注意力、稀疏注意力等优化，代码质量很高，值得学习。',
      '分享一个实用的数据处理工具库，支持多种数据格式，提供了丰富的预处理功能，在多个项目中都很好用。',
    ],
    model: [
      '推荐Hugging Face上的一个优质模型，在文本分类任务上表现优异，模型大小适中，推理速度快。模型链接：https://huggingface.co/xxxx',
      '这个NLP模型在多个基准测试中都取得了很好的成绩，而且支持多语言，适合实际应用场景。',
      '分享一个多模态大模型，支持图像、文本、音频等多种输入，在跨模态任务上表现突出。',
    ],
    event: [
      'ICLR 2024会议将于2024年5月在维也纳召开，截稿日期是2023年9月。欢迎大家投稿，也欢迎参会交流。',
      'AI开发者大会将于2024年3月在北京举办，邀请了多位行业专家分享最新技术进展，现在正在报名中。',
      '深度学习研讨会将于2024年4月在上海举行，主题包括大模型、多模态、强化学习等方向，欢迎大家参加。',
    ],
    job: [
      '我们公司正在招聘大模型算法工程师，负责模型训练和优化。要求熟悉Transformer架构，有大规模模型训练经验。简历请发送至hr@company.com',
      'AI研究员职位招聘，研究方向包括大模型、多模态、强化学习等。提供有竞争力的薪酬和科研环境，欢迎加入。',
      '机器学习工程师招聘，负责模型部署和优化。要求熟悉深度学习框架，有实际项目经验。工作地点：北京。',
    ],
    resource: [
      '分享一些优质的AI学习资源，包括在线课程、书籍、论文等。推荐Coursera的深度学习专项课程，以及《深度学习》这本书。',
      '推荐几个深度学习数据集，包括ImageNet、COCO、OpenImages等。这些数据集在计算机视觉任务中广泛使用。',
      '分享一些AI工具和平台，包括Jupyter Notebook、Google Colab、Weights & Biases等。这些工具可以大大提高开发效率。',
    ],
  };

  const tags: Record<string, string[]> = {
    discussion: ['大模型', '深度学习', '技术讨论'],
    paper: ['论文推荐', '最新研究', '学术交流'],
    video: ['教程', '学习资源', '视频分享'],
    repo: ['开源项目', 'GitHub', '工具推荐'],
    model: ['Hugging Face', '模型推荐', '预训练模型'],
    event: ['会议', '活动', '学术交流'],
    job: ['招聘', '求职', '工作机会'],
    resource: ['资源分享', '学习资料', '工具推荐'],
  };

  const contentIds: Record<string, string[]> = {
    discussion: ['discussion_1', 'discussion_2', 'discussion_3'],
    paper: ['paper_1', 'paper_2', 'paper_3'],
    video: ['video_1', 'video_2', 'video_3'],
    repo: ['repo_1', 'repo_2', 'repo_3'],
    model: ['model_1', 'model_2', 'model_3'],
    event: ['event_1', 'event_2', 'event_3'],
    job: ['job_1', 'job_2', 'job_3'],
    resource: ['resource_1', 'resource_2', 'resource_3'],
  };

  return {
    contentType: type,
    contentId: contentIds[type][index - 1],
    title: titles[type][index - 1],
    content: contents[type][index - 1],
    tags: tags[type],
  };
}

main();
