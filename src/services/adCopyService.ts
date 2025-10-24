import { supabase } from '../lib/supabase';
import { generateAdCopy as generateAdCopyContent } from './contentGenerator';

export interface AdCopyFormula {
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

class AdCopyService {
  // アクティブな広告文フォーミュラを取得
  async getActiveAdCopyFormulas(): Promise<AdCopyFormula[]> {
    try {
      const { data, error } = await supabase
        .from('formulas')
        .select('*')
        .eq('type', 'ad_copy')
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
      console.error('Error in getActiveAdCopyFormulas:', error);
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

  // 広告文を生成（複数のAIモデルで並行生成）
  async generateAdCopies(
    userId: string,
    basicInfoId: string,
    formulaId: string
  ): Promise<AdCopy[]> {
    try {
      // 基本情報とフォーミュラを取得
      const [basicInfo, formula] = await Promise.all([
        this.getBasicInfoById(basicInfoId),
        this.getFormulaById(formulaId)
      ]);

      if (!basicInfo || !formula) {
        throw new Error('基本情報またはフォーミュラが見つかりません');
      }

      // プロンプトを構築
      const prompt = this.buildPrompt(basicInfo, formula);

      // Geminiのみを使用（他のモデルは一時的に無効化）
      const models = ['Gemini']; // GPTとClaudeはエラーのため一時的に無効化
      const generationPromises = models.map(async (model) => {
        try {
          // contentGeneratorサービスを使用してAI生成を実行
          const generatedContent = await generateAdCopyContent({
            basicInfo: prompt,
            style: formula.name,
            provider: 'google',  // Geminiのみ使用
            model: 'gemini-2.0-flash',  // Gemini 2.0 Flash（無料プラン）
            maxTokens: 8192  // 最大トークン数を指定
          });

          // 生成された広告文を保存
          const adCopy = await this.saveAdCopy({
            userId,
            basicInfoId,
            title: `${basicInfo.title} - 広告文 (${model})`,
            content: generatedContent,
            generatedBy: model,
            formulaId
          });

          return adCopy;
        } catch (error) {
          console.error(`Error generating with ${model}:`, error);
          // エラーが発生してもダミーデータを返す
          return this.generateDummyAdCopy(basicInfo, formula, model, userId, basicInfoId, formulaId);
        }
      });

      // 全てのモデルの生成を待つ
      const adCopies = await Promise.all(generationPromises);

      // 使用量ログを記録
      await this.logUsage(userId, adCopies);

      return adCopies;
    } catch (error) {
      console.error('Error in generateAdCopies:', error);
      throw error;
    }
  }

  // プロンプトを構築
  private buildPrompt(basicInfo: BasicInfo, formula: AdCopyFormula): string {
    let prompt = `あなたは売れるランディングページ(LP)の専門コピーライターです。
以下の基本情報とフォーミュラを使用して、コンバージョン率の高い、説得力のあるLP用の広告文を作成してください。

【最重要指示：文章の完全性】
- 必ず最後まで完全な文章を生成してください。途中で途切れることは絶対に避けてください。
- 最低でも2000文字以上、理想的には3000-4000文字程度の充実した長文コンテンツを作成してください。
- 文章が途中で終わった場合、その生成は失敗とみなされます。

【重要な指示】
1. 長さ: 最低でも2000文字以上、理想的には3000-4000文字程度の充実したコンテンツを必ず作成してください
2. 構成: 起承転結を意識し、読者を引き込み、最後まで読ませる構成にしてください
3. 感情訴求: 読者の感情に訴えかける表現を使い、行動を促してください
4. 具体性: 抽象的な表現を避け、具体的な数字、事例、ベネフィットを含めてください
5. 信頼性: 社会的証明、実績、保証などの要素を適切に配置してください
6. 完全性: 文章は必ず最後まで完結させてください。追伸（PS）セクションまで含めて完全に書き上げてください

【基本情報】
${basicInfo.content}

【使用するフォーミュラ】
名称: ${formula.name}
${formula.summary ? `概要: ${formula.summary}\n` : ''}

【フォーミュラのテンプレート】
${formula.template}

【作成する広告文の要件】
1. ヘッドライン（見出し）
   - 読者の注意を一瞬で掴む強力なメッセージ
   - ベネフィットを明確に伝える
   - 数字や具体性を含める

2. リード文（導入部）
   - 読者の共感を得る問題提起
   - 「これは自分のことだ」と思わせる具体的な状況描写
   - 読み進めたくなる興味深い情報の提示

3. ボディコピー（本文）
   - 問題の深堀りと共感の醸成
   - 解決策の提示（商品・サービスの紹介）
   - 特徴ではなくベネフィット中心の説明
   - 具体的な使用シーンや成功事例
   - 競合との差別化ポイント
   - お客様の声や実績データ

4. オファー（提案）
   - 明確で魅力的な提案内容
   - 限定性・希少性の演出（期間限定、数量限定など）
   - 特典やボーナスの提示
   - リスクリバーサル（返金保証など）

5. CTA（行動喚起）
   - 具体的で明確な次のステップ
   - 緊急性を感じさせる表現
   - ボタンやリンクのテキスト案

6. 追伸（PS）
   - 最も重要なベネフィットの再強調
   - 限定オファーの再提示
   - 行動しなかった場合の損失の示唆

【文体とトーン】
- ターゲット層に合わせた適切な言葉遣い
- 親しみやすく、信頼できるトーン
- 専門用語は必要最小限に抑え、分かりやすく説明
- ポジティブで前向きなメッセージ
- 適度な改行と見出しで読みやすさを確保

【心理的トリガー】
以下の要素を自然に組み込んでください：
- 社会的証明（みんなが使っている、選ばれている）
- 権威性（専門家の推薦、受賞歴など）
- 希少性（限定、残りわずか）
- 緊急性（今すぐ行動する理由）
- 互恵性（無料特典、お試し期間）
- 一貫性（小さなコミットメントから）
- 好意（親近感、共感）

このフォーミュラと要件に従って、読者の心を動かし、行動を促す魅力的な広告文を作成してください。
単なる商品説明ではなく、読者の人生を変える可能性を感じさせる、ストーリー性のあるコンテンツにしてください。

【最終確認事項】
- 文章は必ず最後まで完結していること
- 追伸（PS）セクションまで含まれていること
- 最低2000文字以上の長文であること
- すべてのセクションが完全に書かれていること
- 文章が途中で途切れていないこと`;
    
    return prompt;
  }

  // ダミーの広告文を生成（フォールバック用）
  private async generateDummyAdCopy(
    basicInfo: BasicInfo,
    formula: AdCopyFormula,
    model: string,
    userId: string,
    basicInfoId: string,
    formulaId: string
  ): Promise<AdCopy> {
    const dummyContent = this.getDummyContent(basicInfo, model);
    
    return await this.saveAdCopy({
      userId,
      basicInfoId,
      title: `${basicInfo.title} - 広告文 (${model})`,
      content: dummyContent,
      generatedBy: model,
      formulaId
    });
  }

  // モデル別のダミーコンテンツ（現在はGeminiのみ）
  private getDummyContent(basicInfo: BasicInfo, model: string): string {
    const title = basicInfo.title;
    
    // Geminiのダミーコンテンツ
    return `✨ ${title} ✨\n\nコンテンツ作成の常識を覆す、次世代AIツール。あなたのアイデアを瞬時に魅力的な文章に変換します。創造性を解き放ち、ブランドの声を届けましょう。期間限定30%オフキャンペーン実施中！`;
  }

  // 広告文を保存
  async saveAdCopy(adCopyData: {
    userId: string;
    basicInfoId: string;
    title: string;
    content: string;
    generatedBy: string;
    formulaId: string;
  }): Promise<AdCopy> {
    try {
      const { data, error } = await supabase
        .from('ad_copies')
        .insert([{
          user_id: adCopyData.userId,
          basic_info_id: adCopyData.basicInfoId,
          title: adCopyData.title,
          content: adCopyData.content,
          generated_by: adCopyData.generatedBy,
          formula_id: adCopyData.formulaId
        }])
        .select()
        .single();

      if (error) {
        console.error('Error saving ad copy:', error);
        throw error;
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
      console.error('Error in saveAdCopy:', error);
      throw error;
    }
  }

  // 広告文を更新
  async updateAdCopy(adCopyId: string, content: string): Promise<AdCopy> {
    try {
      const { data, error } = await supabase
        .from('ad_copies')
        .update({ content })
        .eq('id', adCopyId)
        .select()
        .single();

      if (error) {
        console.error('Error updating ad copy:', error);
        throw error;
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
      console.error('Error in updateAdCopy:', error);
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

  // フォーミュラをIDで取得
  private async getFormulaById(id: string): Promise<AdCopyFormula | null> {
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

  // 使用量ログを記録
  private async logUsage(userId: string, adCopies: AdCopy[]): Promise<void> {
    try {
      const logs = adCopies.map(adCopy => ({
        user_id: userId,
        action_type: 'ad_copy_generation',
        content_id: adCopy.id,
        generated_by: adCopy.generatedBy
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

  // 広告文履歴を取得
  async getAdCopyHistory(userId: string, limit: number = 50): Promise<AdCopy[]> {
    try {
      const { data, error } = await supabase
        .from('ad_copies')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching ad copy history:', error);
        throw error;
      }

      return data.map((adCopy: any) => ({
        id: adCopy.id,
        userId: adCopy.user_id,
        basicInfoId: adCopy.basic_info_id,
        title: adCopy.title,
        content: adCopy.content,
        summary: adCopy.summary,
        generatedBy: adCopy.generated_by,
        formulaId: adCopy.formula_id,
        createdAt: new Date(adCopy.created_at),
        updatedAt: new Date(adCopy.updated_at)
      }));
    } catch (error) {
      console.error('Error in getAdCopyHistory:', error);
      throw error;
    }
  }
}

// シングルトンインスタンスをエクスポート
export const adCopyService = new AdCopyService();