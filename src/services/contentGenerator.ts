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
  formulaTemplate?: string;
  formulaVariables?: string[];
}

interface GeneratedContent {
  title: string;
  content: string;
  metaDescription: string;
  permalink: string;
  createdAt: Date;
}

/**
 * フォーミュラテンプレートを使用してコンテンツを生成するプロンプトを構築
 */
function buildFormulaPrompt(
  answers: Record<string, string>,
  questions: Array<{ id: string; text: string; category: string; }>,
  formulaTemplate: string,
  formulaVariables: string[]
): string {
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
  let prompt = `あなたはプロのコピーライターです。以下の質問への回答情報を分析し、指定されたフォーミュラテンプレートに厳密に従って基本情報を生成してください。

【重要な指示】
フォーミュラテンプレートの構造と形式を必ず守ってください。テンプレートに記載されている見出し、箇条書き、セクションの順序をそのまま使用し、{{変数名}}の部分のみを適切な内容に置き換えてください。

【質問と回答情報】
`;

  // すべての質問と回答を表示
  questions.forEach(q => {
    const answer = answers[q.id];
    if (answer && answer.trim()) {
      prompt += `\nQ: ${q.text}\nA: ${answer}\n`;
    }
  });

  prompt += `\n【使用するフォーミュラテンプレート】
${formulaTemplate}

【テンプレート変数の説明】
${formulaVariables.map(v => `{{${v}}}: この部分を質問への回答から適切に埋めてください`).join('\n')}

【厳守事項】
1. フォーミュラテンプレートの構造を変更しないでください
2. テンプレートにある見出し（【】で囲まれた部分など）はそのまま使用してください
3. 箇条書きの形式（- や数字）もテンプレート通りにしてください
4. {{変数名}}の部分は、質問への回答から最も適切な内容を抽出して置き換えてください
5. 回答に該当する情報がない変数は、文脈から推測して適切な内容を生成してください
6. HTML形式で出力する際も、テンプレートの構造を維持してください
7. 見出しは適切なHTMLタグ（h1, h2, h3）に変換してください
8. 【】で囲まれた見出しは<h2>タグに、その他の小見出しは<h3>タグにしてください
9. 箇条書きは<ul><li>タグを使用してください
10. 重要な部分は<strong>タグで強調してください

【出力形式】
必ずHTML形式で、フォーミュラテンプレートの構造を完全に維持した基本情報を生成してください。テンプレートから逸脱しないよう注意してください。`;

  return prompt;
}

/**
 * 基本情報からプロンプトを構築（従来の方法）
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
  model,
  formulaTemplate,
  formulaVariables
}: BasicInfoParams): Promise<GeneratedContent> {
  try {
    // プロンプトの構築
    let prompt: string;
    if (formulaTemplate && formulaVariables) {
      // フォーミュラテンプレートが指定されている場合
      prompt = buildFormulaPrompt(answers, questions, formulaTemplate, formulaVariables);
    } else {
      // 従来の方法
      prompt = buildBasicInfoPrompt(answers, questions);
    }

    // AIサービスを使用してコンテンツを生成
    const response = await aiService.generateContent(provider, {
      prompt,
      model,
      temperature: 0.7,
      maxTokens: 3000
    });

    // レスポンスコンテンツのクリーンアップ
    let cleanedContent = response.content;
    
    // コンテンツが存在する場合のみクリーンアップ
    if (cleanedContent) {
      // ```html で始まる場合の処理
      if (cleanedContent.trim().startsWith('```html')) {
        // ```html の開始位置を見つける
        const startIndex = cleanedContent.indexOf('```html');
        if (startIndex !== -1) {
          cleanedContent = cleanedContent.substring(startIndex + 7); // ```html の長さ分削除
        }
      }
      
      // ``` で終わる場合の処理
      if (cleanedContent.trim().endsWith('```')) {
        // 最後の ``` の位置を見つける
        const endIndex = cleanedContent.lastIndexOf('```');
        if (endIndex !== -1) {
          cleanedContent = cleanedContent.substring(0, endIndex);
        }
      }
      
      // 両端の空白文字を削除
      cleanedContent = cleanedContent.trim();
    }
    
    // コンテンツが空の場合はエラー
    if (!cleanedContent) {
      throw new Error('生成されたコンテンツが空です。');
    }

    // メタデータの抽出
    const { title, metaDescription, permalink } = extractMetadata(cleanedContent);

    return {
      title,
      content: cleanedContent,
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
  model,
  maxTokens = 8192  // maxTokensパラメータを追加
}: {
  basicInfo: string;
  style: string;
  provider?: AIProvider;
  model?: string;
  maxTokens?: number;  // maxTokensの型定義を追加
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
      maxTokens: maxTokens  // 外部から指定されたmaxTokensを使用
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
  // basicInfoには既に完全なプロンプトが含まれているため、そのまま使用
  const prompt = basicInfo;

  try {
    const response = await aiService.generateContent(provider, {
      prompt,
      model,
      temperature: 0.8, // より創造的で長文な出力のため高めに設定
      maxTokens: 8192 // 最大トークン数を最大値に設定
    });

    let content = response.content;

    // AIの前置きや応答部分を除去
    // 一般的な前置きパターンを検出して除去
    const prefixPatterns = [
      /^(はい、)?承知(いた)?しました。?[\s\S]*?LP記事を(作成|書き上げ|執筆)(します|いたします)。?\s*\n+/i,
      /^わかりました。?[\s\S]*?LP記事を(作成|書き上げ|執筆)(します|いたします)。?\s*\n+/i,
      /^了解(いた)?しました。?[\s\S]*?LP記事を(作成|書き上げ|執筆)(します|いたします)。?\s*\n+/i,
      /^(それでは、)?[\s\S]*?LP記事を(お届け|ご提供|作成)(します|いたします)。?\s*\n+/i,
      /^以下(が|に)、?[\s\S]*?LP記事(です|になります|をお届けします)。?\s*\n+/i,
    ];

    // 各パターンをチェックして除去
    for (const pattern of prefixPatterns) {
      content = content.replace(pattern, '');
    }

    // HTMLタグ（特に<h1>）が始まるまでの部分を除去
    const htmlStartMatch = content.match(/(<h1[^>]*>)/);
    if (htmlStartMatch && htmlStartMatch.index && htmlStartMatch.index > 0) {
      // <h1>タグより前に10文字以上のテキストがある場合は、それを前置きと判断して除去
      const textBeforeH1 = content.substring(0, htmlStartMatch.index).trim();
      if (textBeforeH1.length > 10) {
        content = content.substring(htmlStartMatch.index);
      }
    }

    // 最後の締めくくりや後書きを除去
    const suffixPatterns = [
      /\n+以上が[\s\S]*?LP記事(です|になります|でした)。?[\s\S]*$/i,
      /\n+この(LP)?記事は[\s\S]*?(ください|います|ました)。?[\s\S]*$/i,
      /\n+いかがでしたか。?[\s\S]*$/i,
      /\n+お役に立てれば幸いです。?[\s\S]*$/i,
    ];

    // 各パターンをチェックして除去
    for (const pattern of suffixPatterns) {
      content = content.replace(pattern, '');
    }

    // 前後の余分な空白を除去
    content = content.trim();

    return content;
  } catch (error) {
    console.error('LP記事生成エラー:', error);
    throw new Error('LP記事の生成に失敗しました。');
  }
}