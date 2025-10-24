import { supabase } from '../lib/supabase';
import { generateLPArticle as generateLpArticleContent } from './contentGenerator';

export interface LpArticleFormula {
  id: string;
  name: string;
  type: string;
  template: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  summary?: string;
}

export interface BasicInfo {
  id: string;
  userId?: string;
  sessionId?: string;
  title: string;
  content: string;
  summary?: string;
  generatedBy?: string;
  formulaId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdCopy {
  id: string;
  userId?: string;
  basicInfoId: string;
  title: string;
  content: string;
  summary?: string;
  generatedBy: string;
  formulaId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LpArticle {
  id: string;
  userId?: string;
  basicInfoId: string;
  adCopyId?: string;
  title: string;
  content: string;
  metaDescription?: string;
  permalink?: string;
  wordCount?: number;
  generatedBy: string;
  formulaId: string;
  createdAt: Date;
  updatedAt: Date;
}

class LpArticleService {
  // アクティブなLP記事フォーミュラを取得
  async getActiveLpArticleFormulas(): Promise<LpArticleFormula[]> {
    try {
      const { data, error } = await supabase
        .from('formulas')
        .select('*')
        .eq('type', 'lp_article')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching formulas:', error);
        throw error;
      }

      return data.map((formula: any) => ({
        id: formula.id,
        name: formula.name,
        type: formula.type,
        template: formula.template,
        variables: formula.variables || [],
        isActive: formula.is_active,
        createdAt: new Date(formula.created_at),
        updatedAt: new Date(formula.updated_at),
        summary: formula.summary
      }));
    } catch (error) {
      console.error('Error in getActiveLpArticleFormulas:', error);
      throw error;
    }
  }

  // ユーザーの基本情報を取得
  async getBasicInfos(userId: string): Promise<BasicInfo[]> {
    try {
      const { data, error } = await supabase
        .from('basic_infos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching basic infos:', error);
        throw error;
      }

      return data.map((info: any) => ({
        id: info.id,
        userId: info.user_id,
        sessionId: info.session_id,
        title: info.title,
        content: info.content,
        summary: info.summary,
        generatedBy: info.generated_by,
        formulaId: info.formula_id,
        createdAt: new Date(info.created_at),
        updatedAt: new Date(info.updated_at)
      }));
    } catch (error) {
      console.error('Error in getBasicInfos:', error);
      throw error;
    }
  }

  // ユーザーの広告文を取得
  async getAdCopies(userId: string): Promise<AdCopy[]> {
    try {
      const { data, error } = await supabase
        .from('ad_copies')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching ad copies:', error);
        throw error;
      }

      return data.map((copy: any) => ({
        id: copy.id,
        userId: copy.user_id,
        basicInfoId: copy.basic_info_id,
        title: copy.title,
        content: copy.content,
        summary: copy.summary,
        generatedBy: copy.generated_by,
        formulaId: copy.formula_id,
        createdAt: new Date(copy.created_at),
        updatedAt: new Date(copy.updated_at)
      }));
    } catch (error) {
      console.error('Error in getAdCopies:', error);
      throw error;
    }
  }

  // LP記事を生成（複数のAIモデルで並行生成）
  async generateLpArticles(
    userId: string,
    basicInfoId: string,
    adCopyId: string | null,
    formulaId: string
  ): Promise<LpArticle[]> {
    try {
      // 基本情報、広告文、フォーミュラを取得
      const [basicInfo, adCopy, formula] = await Promise.all([
        this.getBasicInfoById(basicInfoId),
        adCopyId ? this.getAdCopyById(adCopyId) : null,
        this.getFormulaById(formulaId)
      ]);

      if (!basicInfo || !formula) {
        throw new Error('基本情報またはフォーミュラが見つかりません');
      }

      // プロンプトを構築
      const prompt = this.buildPrompt(basicInfo, adCopy, formula);

      // Geminiのみを使用（他のモデルは一時的に無効化）
      const models = ['Gemini']; // GPTとClaudeはエラーのため一時的に無効化
      const generationPromises = models.map(async (model) => {
        try {
          // contentGeneratorサービスを使用してAI生成を実行
          const generatedContent = await generateLpArticleContent({
            basicInfo: prompt,
            template: formula.template,
            provider: 'google',  // Geminiのみ使用
            model: 'gemini-2.0-flash'  // Gemini 2.0 Flash（無料プラン）
          });

          // 文字数をカウント
          const wordCount = this.countWords(generatedContent);

          // 生成されたLP記事を保存
          const lpArticle = await this.saveLpArticle({
            userId,
            basicInfoId,
            adCopyId: adCopyId || undefined,
            title: `${basicInfo.title} - LP記事 (${model})`,
            content: generatedContent,
            metaDescription: this.generateMetaDescription(generatedContent),
            permalink: this.generatePermalink(basicInfo.title),
            wordCount,
            generatedBy: model,
            formulaId
          });

          return lpArticle;
        } catch (error) {
          console.error(`Error generating with ${model}:`, error);
          // エラーが発生してもダミーデータを返す
          return this.generateDummyLpArticle(basicInfo, formula, model, userId, basicInfoId, adCopyId || undefined, formulaId);
        }
      });

      // 全てのモデルの生成を待つ
      const lpArticles = await Promise.all(generationPromises);

      // 使用量ログを記録
      await this.logUsage(userId, lpArticles);

      return lpArticles;
    } catch (error) {
      console.error('Error in generateLpArticles:', error);
      throw error;
    }
  }

  // プロンプトを構築
  private buildPrompt(basicInfo: BasicInfo, adCopy: AdCopy | null, formula: LpArticleFormula): string {
    let prompt = `あなたは世界最高峰のセールスライティングの達人です。これまでに1000本以上のLPを執筆し、最高CVR32%を記録した実績があります。

今回は、あなたの全知識・全経験・全技術を結集して、読者の心を完全に掴み、行動せずにはいられなくなる究極のLP記事を作成してください。

【絶対条件】
この記事は最低でも20,000文字以上、できれば30,000文字以上の超大作にしてください。短い記事は絶対にNGです。読者が何度も何度も読み返したくなるような、圧倒的な価値と情報量を持つ記事を作成してください。

【基本情報】
${basicInfo.content}

`;
    
    if (adCopy) {
      prompt += `【核となる広告文 - これを20倍以上に拡張せよ】
${adCopy.content}

【超重要指示】
上記の広告文は優れたコピーですが、これはあくまで「種」に過ぎません。この種から巨大な大木を育てるように、広告文の各要素を20倍、30倍に膨らませてください。

具体的には：
- 広告文の1行1行を、それぞれ500文字以上の段落に拡張
- 各主張に対して、最低5つ以上の具体例・証拠・データを追加
- 感情に訴える部分は、読者の心理を10段階以上に分解して描写
- 論理的な説明は、初心者でも理解できるように詳細に展開

`;
    }
    
    prompt += `【使用するフォーミュラ】
${formula.name}

【フォーミュラテンプレート】
${formula.template}

【LP記事の必須構成と最低文字数】

合計：最低20,000文字以上（理想は30,000文字以上）

1. **圧倒的なファーストビュー（3,000文字以上）**
   
   A. メインヘッドライン（100文字以上）
      - 読者の脳に稲妻が走るような衝撃的な一文
      - 具体的な数字や結果を含む
   
   B. サブヘッドライン群（500文字以上）
      - メインを補強する3-5個のサブヘッド
      - それぞれ違う角度から訴求
   
   C. 導入ストーリー（1,500文字以上）
      - 読者と同じ悩みを持つ人物の具体的なエピソード
      - 感情移入できる詳細な描写
      - 「まさに私のことだ」と思わせる共感ポイント
   
   D. 信頼性の証明（1,000文字以上）
      - 実績の詳細（数字、期間、規模）
      - 権威性（資格、経歴、受賞歴）
      - メディア掲載実績
      - 推薦者の声

2. **深い共感を呼ぶ問題提起（4,000文字以上）**
   
   A. 第1の問題：表面的な悩み（1,000文字以上）
      - 誰もが認識している明らかな問題
      - その問題による日常生活への具体的な影響
      - 実際の失敗エピソード
   
   B. 第2の問題：隠れた真の問題（1,500文字以上）
      - 表面的な問題の裏にある本質的な課題
      - なぜその問題が解決できないのかの深い分析
      - 心理的なブロックの詳細な説明
   
   C. 第3の問題：将来への不安（1,500文字以上）
      - このまま問題を放置した場合の5年後、10年後
      - 最悪のシナリオの生々しい描写
      - 取り返しのつかない後悔の具体例

3. **革新的な解決策の提示（4,000文字以上）**
   
   A. 従来の方法の限界（1,500文字以上）
      - なぜ今までの方法では失敗するのか
      - 具体的な失敗事例を5つ以上
      - 専門家の意見や研究データ
   
   B. 新しいアプローチの説明（1,500文字以上）
      - 革新的な発想の転換
      - 科学的根拠やメカニズムの詳細
      - 図解的な説明（文章で視覚化）
   
   C. 成功の再現性（1,000文字以上）
      - なぜ誰でも成功できるのか
      - ステップバイステップの概要
      - 成功を妨げる要因の排除方法

4. **圧倒的なベネフィットの羅列（3,500文字以上）**
   
   A. 即効性のあるベネフィット（1,000文字以上）
      - 今日から実感できる変化
      - 1週間後、1ヶ月後の具体的な成果
      - 数値化された改善例
   
   B. 長期的な人生の変化（1,500文字以上）
      - 1年後のライフスタイルの変化
      - 5年後の理想的な未来像
      - 家族や周囲への好影響
   
   C. 予想外の副次的効果（1,000文字以上）
      - 思わぬボーナス的なメリット
      - 他の分野への好影響
      - 人生全体の好循環

5. **説得力のある社会的証明（3,500文字以上）**
   
   A. 感動的な成功ストーリー（2,000文字以上）
      - 最低5人の詳細な体験談
      - ビフォーアフターの具体的な描写
      - 数字で見る改善データ
   
   B. 専門家からの推薦（1,000文字以上）
      - 業界の権威からのコメント
      - 医師、研究者などの専門的見解
      - 第三者機関の評価
   
   C. メディア掲載・受賞歴（500文字以上）
      - 具体的な媒体名と掲載内容
      - 受賞の詳細と意義

6. **商品・サービスの完全解説（2,500文字以上）**
   
   A. 詳細な内容説明（1,000文字以上）
      - 何が含まれているか
      - どのように提供されるか
      - 使い方の具体例
   
   B. 独自性と優位性（1,000文字以上）
      - 他社との決定的な違い
      - 特許技術や独自メソッド
      - 真似できない強み
   
   C. 投資対効果の証明（500文字以上）
      - 価格の妥当性
      - リターンの計算例
      - 競合との価格比較

7. **完璧なリスク排除（1,500文字以上）**
   
   A. 充実した保証制度（500文字以上）
      - 返金保証の詳細
      - 保証期間と条件
      - 保証実績
   
   B. よくある質問と回答（1,000文字以上）
      - 最低15個以上のQ&A
      - 不安を完全に解消する回答
      - 具体例を交えた説明

8. **行動を促す最終プッシュ（2,000文字以上）**
   
   A. 限定性の演出（500文字以上）
      - なぜ今なのか
      - 期限の具体的な理由
      - 逃した場合の損失
   
   B. 最後の説得（1,000文字以上）
      - 感情に訴える最終メッセージ
      - 未来の成功イメージ
      - 決断を後押しする言葉
   
   C. 明確なCTA（500文字以上）
      - 具体的な行動ステップ
      - 申込後の流れ
      - 最初の一歩の説明

【文章執筆の鉄則】

1. **とにかく長く詳しく**
   - 「簡潔に」は禁止。できる限り詳細に
   - 1つの主張に対して最低5つの根拠
   - 具体例は可能な限りすべて列挙

2. **ストーリーの多用**
   - 抽象的な説明は必ず具体的なストーリーで補強
   - 登場人物には名前をつけて生々しく
   - 五感で感じられる描写を含める

3. **データと数字の徹底活用**
   - 曖昧な表現は一切禁止
   - パーセント、人数、期間、金額を明記
   - グラフや表を文章で表現

4. **感情の揺さぶり**
   - 不安→希望→確信→行動の流れ
   - 読者の心の声を代弁
   - 共感と励ましのバランス

5. **HTML構造の活用**
   - 見出しで記事の構造を明確に
   - 重要部分は視覚的に目立たせる
   - 読みやすさと説得力の両立

【最終チェック】
□ 20,000文字以上になっているか？
□ 広告文の内容を20倍以上に拡張できたか？
□ 読者が行動せずにはいられない内容か？
□ 競合他社では絶対に真似できない価値があるか？
□ 何度も読み返したくなる内容か？

この指示に従い、あなたの持てるすべての力を使って、史上最高のLP記事を書き上げてください。妥協は一切許されません。

【最終指示】
絶対に守ること：
- 「承知しました」「わかりました」などの前置きは一切書かない
- 「以下がLP記事です」などの説明も書かない
- いきなり<h1>タグから始まるLP記事本文を出力する
- 記事の最後に「以上です」「いかがでしたか」などの締めくくりも書かない
- 純粋なLP記事のHTMLコンテンツのみを出力する`;
    
    return prompt;
  }

  // ダミーのLP記事を生成（フォールバック用）
  private async generateDummyLpArticle(
    basicInfo: BasicInfo,
    formula: LpArticleFormula,
    model: string,
    userId: string,
    basicInfoId: string,
    adCopyId: string | undefined,
    formulaId: string
  ): Promise<LpArticle> {
    const dummyContent = this.getDummyContent(basicInfo, model);
    const wordCount = this.countWords(dummyContent);
    
    return await this.saveLpArticle({
      userId,
      basicInfoId,
      adCopyId,
      title: `${basicInfo.title} - LP記事 (${model})`,
      content: dummyContent,
      metaDescription: this.generateMetaDescription(dummyContent),
      permalink: this.generatePermalink(basicInfo.title),
      wordCount,
      generatedBy: model,
      formulaId
    });
  }

  // モデル別のダミーコンテンツ（現在はGeminiのみ）
  private getDummyContent(basicInfo: BasicInfo, model: string): string {
    const title = basicInfo.title;
    
    // Geminiのダミーコンテンツ
    return `<h1>${title}</h1>
<p>革新的なAI技術を駆使して、コンテンツ作成の効率を飛躍的に向上させるツールをご紹介します。</p>

<h2>✨ 特徴 ✨</h2>
<ul>
  <li>高品質な文章を自動生成</li>
  <li>SEO対策済みのコンテンツ作成</li>
  <li>多言語対応で海外展開も簡単</li>
  <li>直感的な操作性でだれでも簡単に使える</li>
</ul>

<h2>こんな方におすすめ</h2>
<p>コンテンツ作成に時間をかけられない方、より質の高いコンテンツを作りたい方に最適です。</p>`;
  }

  // LP記事を保存
  async saveLpArticle(lpArticleData: {
    userId: string;
    basicInfoId: string;
    adCopyId?: string;
    title: string;
    content: string;
    metaDescription?: string;
    permalink?: string;
    wordCount?: number;
    generatedBy: string;
    formulaId: string;
  }): Promise<LpArticle> {
    try {
      const { data, error } = await supabase
        .from('lp_articles')
        .insert([{
          user_id: lpArticleData.userId,
          basic_info_id: lpArticleData.basicInfoId,
          ad_copy_id: lpArticleData.adCopyId,
          title: lpArticleData.title,
          content: lpArticleData.content,
          meta_description: lpArticleData.metaDescription,
          permalink: lpArticleData.permalink,
          word_count: lpArticleData.wordCount,
          generated_by: lpArticleData.generatedBy,
          formula_id: lpArticleData.formulaId
        }])
        .select()
        .single();

      if (error) {
        console.error('Error saving LP article:', error);
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        basicInfoId: data.basic_info_id,
        adCopyId: data.ad_copy_id,
        title: data.title,
        content: data.content,
        metaDescription: data.meta_description,
        permalink: data.permalink,
        wordCount: data.word_count,
        generatedBy: data.generated_by,
        formulaId: data.formula_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error in saveLpArticle:', error);
      throw error;
    }
  }

  // LP記事を更新
  async updateLpArticle(lpArticleId: string, content: string): Promise<LpArticle> {
    try {
      const wordCount = this.countWords(content);
      const metaDescription = this.generateMetaDescription(content);

      const { data, error } = await supabase
        .from('lp_articles')
        .update({ 
          content,
          word_count: wordCount,
          meta_description: metaDescription
        })
        .eq('id', lpArticleId)
        .select()
        .single();

      if (error) {
        console.error('Error updating LP article:', error);
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        basicInfoId: data.basic_info_id,
        adCopyId: data.ad_copy_id,
        title: data.title,
        content: data.content,
        metaDescription: data.meta_description,
        permalink: data.permalink,
        wordCount: data.word_count,
        generatedBy: data.generated_by,
        formulaId: data.formula_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error in updateLpArticle:', error);
      throw error;
    }
  }

  // LP記事履歴を取得
  async getLpArticleHistory(userId: string, limit: number = 50): Promise<LpArticle[]> {
    try {
      const { data, error } = await supabase
        .from('lp_articles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching LP article history:', error);
        throw error;
      }

      return data.map((lpArticle: any) => ({
        id: lpArticle.id,
        userId: lpArticle.user_id,
        basicInfoId: lpArticle.basic_info_id,
        adCopyId: lpArticle.ad_copy_id,
        title: lpArticle.title,
        content: lpArticle.content,
        metaDescription: lpArticle.meta_description,
        permalink: lpArticle.permalink,
        wordCount: lpArticle.word_count,
        generatedBy: lpArticle.generated_by,
        formulaId: lpArticle.formula_id,
        createdAt: new Date(lpArticle.created_at),
        updatedAt: new Date(lpArticle.updated_at)
      }));
    } catch (error) {
      console.error('Error in getLpArticleHistory:', error);
      throw error;
    }
  }

  // 基本情報をIDで取得
  private async getBasicInfoById(id: string): Promise<BasicInfo | null> {
    try {
      const { data, error } = await supabase
        .from('basic_infos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching basic info:', error);
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        sessionId: data.session_id,
        title: data.title,
        content: data.content,
        summary: data.summary,
        generatedBy: data.generated_by,
        formulaId: data.formula_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error in getBasicInfoById:', error);
      return null;
    }
  }

  // 広告文をIDで取得
  private async getAdCopyById(id: string): Promise<AdCopy | null> {
    try {
      const { data, error } = await supabase
        .from('ad_copies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching ad copy:', error);
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        basicInfoId: data.basic_info_id,
        title: data.title,
        content: data.content,
        summary: data.summary,
        generatedBy: data.generated_by,
        formulaId: data.formula_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error in getAdCopyById:', error);
      return null;
    }
  }

  // フォーミュラをIDで取得
  private async getFormulaById(id: string): Promise<LpArticleFormula | null> {
    try {
      const { data, error } = await supabase
        .from('formulas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching formula:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        type: data.type,
        template: data.template,
        variables: data.variables || [],
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        summary: data.summary
      };
    } catch (error) {
      console.error('Error in getFormulaById:', error);
      return null;
    }
  }

  // 文字数をカウント（HTMLタグを除外）
  private countWords(content: string): number {
    const textContent = content.replace(/<[^>]*>/g, '');
    return textContent.length;
  }

  // メタディスクリプションを生成
  private generateMetaDescription(content: string): string {
    const textContent = content.replace(/<[^>]*>/g, '');
    const cleanText = textContent.replace(/\s+/g, ' ').trim();
    return cleanText.substring(0, 150) + (cleanText.length > 150 ? '...' : '');
  }

  // パーマリンクを生成
  private generatePermalink(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // 使用量ログを記録
  private async logUsage(userId: string, lpArticles: LpArticle[]): Promise<void> {
    try {
      const logs = lpArticles.map(lpArticle => ({
        user_id: userId,
        action_type: 'lp_article_generation',
        content_id: lpArticle.id,
        generated_by: lpArticle.generatedBy
      }));

      const { error } = await supabase
        .from('usage_logs')
        .insert(logs);

      if (error) {
        console.error('Error logging usage:', error);
      }
    } catch (error) {
      console.error('Error in logUsage:', error);
    }
  }
}

// シングルトンインスタンスをエクスポート
export const lpArticleService = new LpArticleService();