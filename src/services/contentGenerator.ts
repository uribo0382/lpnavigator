import aiService from './ai';
import type { AIProvider } from './ai';

interface BasicInfoParams {
  answers: Record<string, string>;
  questions: Array<{
    id: string;
    text: string;
    category: string;
  }>;
  provider?: AIProvider;
  model?: string;
}

interface GeneratedContent {
  title: string;
  content: string;
  metaDescription: string;
  permalink: string;
  createdAt: Date;
}

/**
 * 基本情報からプロンプトを構築
 */
function buildBasicInfoPrompt(answers: Record<string, string>, questions: Array<{ id: string; text: string; category: string; }>): string {
  const categorizedAnswers: Record<string, Array<{ question: string; answer: string }>> = {};

  // カテゴリごとに質問と回答を整理
  questions.forEach(q => {
    const answer = answers[q.id];
    if (answer && answer.trim()) {
      if (!categorizedAnswers[q.category]) {
        categorizedAnswers[q.category] = [];
      }
      categorizedAnswers[q.category].push({
        question: q.text,
        answer: answer
      });
    }
  });

  // プロンプトの構築
  let prompt = `以下の情報を基に、魅力的で説得力のあるランディングページの記事を生成してください。HTML形式で、見出しタグ（h1, h2, h3）、段落タグ（p）、リストタグ（ul, li）、引用タグ（blockquote）などを適切に使用してください。

【収集した情報】\n\n`;

  const categoryNames: Record<string, string> = {
    problem: '課題・問題',
    solution: '解決策',
    features: '特徴',
    benefits: '利点',
    social_proof: '社会的証明',
    offer_details: 'オファー詳細',
    cta: '行動喚起'
  };

  Object.entries(categorizedAnswers).forEach(([category, items]) => {
    const categoryName = categoryNames[category] || category;
    prompt += `## ${categoryName}\n`;
    items.forEach(({ question, answer }) => {
      prompt += `Q: ${question}\nA: ${answer}\n\n`;
    });
    prompt += '\n';
  });

  prompt += `
【生成条件】
1. 見出しタグ（h1, h2, h3）を使って構造化された記事を作成
2. 説得力のある文章で、読者の興味を引き付ける
3. 具体的な例や統計データを適切に使用
4. CTAボタンは <button class="cta-button">今すぐ購入</button> の形式で配置
5. 重要な情報は <div class="cta-box"> で囲む
6. 顧客の声は <blockquote> タグで引用
7. 特徴や利点はリスト形式で見やすく整理

【必須要素】
- 魅力的なヘッドライン（h1）
- 問題提起と共感
- 解決策の提示
- 商品・サービスの特徴と利点
- 社会的証明（お客様の声、実績など）
- 明確な行動喚起（CTA）
`;

  return prompt;
}

/**
 * 生成されたHTMLからタイトルとメタディスクリプションを抽出
 */
function extractMetadata(html: string): { title: string; metaDescription: string; permalink: string } {
  // タイトルの抽出（最初のh1タグから）
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const title = titleMatch ? titleMatch[1].trim() : 'ランディングページ';

  // メタディスクリプションの生成（最初の段落から）
  const paragraphMatch = html.match(/<p[^>]*>([^<]+)<\/p>/);
  let metaDescription = paragraphMatch ? paragraphMatch[1].trim() : title;
  
  // メタディスクリプションは150文字以内に
  if (metaDescription.length > 150) {
    metaDescription = metaDescription.substring(0, 147) + '...';
  }

  // パーマリンクの生成（タイトルから）
  const permalink = title
    .toLowerCase()
    .replace(/[^a-z0-9ぁ-んァ-ヶー一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);

  return { title, metaDescription, permalink: permalink || 'landing-page' };
}

/**
 * 基本情報を生成
 */
export async function generateBasicInfo({
  answers,
  questions,
  provider = 'openai',
  model
}: BasicInfoParams): Promise<GeneratedContent> {
  try {
    // プロンプトの構築
    const prompt = buildBasicInfoPrompt(answers, questions);

    // AIサービスを使用してコンテンツを生成
    const response = await aiService.generateContent(provider, {
      prompt,
      model,
      temperature: 0.7,
      maxTokens: 3000
    });

    // メタデータの抽出
    const { title, metaDescription, permalink } = extractMetadata(response.content);

    return {
      title,
      content: response.content,
      metaDescription,
      permalink,
      createdAt: new Date()
    };
  } catch (error) {
    console.error('基本情報生成エラー:', error);
    throw new Error('基本情報の生成に失敗しました。');
  }
}

/**
 * 広告文を生成
 */
export async function generateAdCopy({
  basicInfo,
  style,
  provider = 'openai',
  model
}: {
  basicInfo: string;
  style: string;
  provider?: AIProvider;
  model?: string;
}): Promise<string> {
  const prompt = `以下の基本情報を基に、${style}スタイルの魅力的な広告文を生成してください。

【基本情報】
${basicInfo}

【要件】
- ターゲット層に響くキャッチコピー
- 商品・サービスの価値を明確に伝える
- 行動を促す強力なCTA
- ${style}スタイルに適した表現

【文字数】
- 見出し：15-30文字
- 本文：100-200文字
`;

  try {
    const response = await aiService.generateContent(provider, {
      prompt,
      model,
      temperature: 0.8,
      maxTokens: 500
    });

    return response.content;
  } catch (error) {
    console.error('広告文生成エラー:', error);
    throw new Error('広告文の生成に失敗しました。');
  }
}

/**
 * LP記事を生成
 */
export async function generateLPArticle({
  basicInfo,
  template,
  provider = 'openai',
  model
}: {
  basicInfo: string;
  template: string;
  provider?: AIProvider;
  model?: string;
}): Promise<string> {
  const prompt = `以下の基本情報とテンプレートを基に、完全なランディングページ記事を生成してください。

【基本情報】
${basicInfo}

【テンプレート】
${template}

【要件】
- SEOに最適化された構造
- 読みやすく魅力的な文章
- 適切なHTML要素の使用
- 明確なコンバージョンパス
`;

  try {
    const response = await aiService.generateContent(provider, {
      prompt,
      model,
      temperature: 0.7,
      maxTokens: 4000
    });

    return response.content;
  } catch (error) {
    console.error('LP記事生成エラー:', error);
    throw new Error('LP記事の生成に失敗しました。');
  }
}