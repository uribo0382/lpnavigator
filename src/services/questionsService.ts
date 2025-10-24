import { supabase } from '../lib/supabase';

export interface Question {
  id: string;
  text: string;
  category: string;
  order_number: number;
  is_active: boolean;
  helper_text?: string;
  sample_answer?: string;
  is_required: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * アクティブな質問を取得
 */
export async function getActiveQuestions(): Promise<Question[]> {
  try {
    console.log('getActiveQuestions: 質問データ取得開始');
    console.log('Supabase client initialized');
    
    // まずテーブルの存在確認
    const { data: allData, error: allError } = await supabase
      .from('questions')
      .select('*')
      .limit(1);
    
    console.log('テーブル確認:', { allData, allError });
    
    if (allError) {
      console.error('questionsテーブルアクセスエラー:', allError);
      console.error('エラー詳細:', {
        message: allError.message,
        details: allError.details,
        hint: allError.hint,
        code: allError.code
      });
    }
    
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('is_active', true)
      .order('order_number', { ascending: true });

    console.log('getActiveQuestions: Supabaseレスポンス', { data, error });

    if (error) {
      console.error('質問データ取得エラー:', error);
      console.error('エラー詳細:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`質問データの取得に失敗しました: ${error.message}`);
    }

    console.log('getActiveQuestions: 取得した質問数', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('質問データ取得エラー:', error);
    throw error;
  }
}

/**
 * 質問回答セッションを作成
 */
export async function createQuestionSession(userId: string, sessionName?: string) {
  try {
    const { data, error } = await supabase
      .from('question_sessions')
      .insert([{
        user_id: userId,
        session_name: sessionName || `基本情報作成 ${new Date().toLocaleDateString()}`,
        is_completed: false
      }])
      .select()
      .single();

    if (error) {
      console.error('セッション作成エラー:', error);
      throw new Error('セッションの作成に失敗しました');
    }

    return data;
  } catch (error) {
    console.error('セッション作成エラー:', error);
    throw error;
  }
}

/**
 * 質問回答を保存
 */
export async function saveQuestionAnswer(sessionId: string, questionId: string, answer: string) {
  try {
    // 既存の回答があるか確認
    const { data: existing, error: selectError } = await supabase
      .from('question_answers')
      .select('id')
      .eq('session_id', sessionId)
      .eq('question_id', questionId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116は「データが見つからない」エラーなので無視
      throw selectError;
    }

    if (existing) {
      // 既存の回答を更新
      const { error: updateError } = await supabase
        .from('question_answers')
        .update({ answer, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      // 新規回答を作成
      const { error: insertError } = await supabase
        .from('question_answers')
        .insert([{
          session_id: sessionId,
          question_id: questionId,
          answer
        }]);

      if (insertError) {
        throw insertError;
      }
    }
  } catch (error) {
    console.error('回答保存エラー:', error);
    throw new Error('回答の保存に失敗しました');
  }
}

/**
 * セッションの回答を一括保存
 */
export async function saveAllAnswers(sessionId: string, answers: Record<string, string>) {
  try {
    const promises = Object.entries(answers).map(([questionId, answer]) => {
      if (answer && answer.trim()) {
        return saveQuestionAnswer(sessionId, questionId, answer);
      }
      return Promise.resolve();
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('回答一括保存エラー:', error);
    throw new Error('回答の一括保存に失敗しました');
  }
}

/**
 * セッションを完了としてマーク
 */
export async function completeSession(sessionId: string) {
  try {
    const { error } = await supabase
      .from('question_sessions')
      .update({ 
        is_completed: true, 
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('セッション完了エラー:', error);
    throw new Error('セッションの完了処理に失敗しました');
  }
}

/**
 * 基本情報を保存
 */
export async function saveBasicInfo(
  userId: string, 
  sessionId: string, 
  basicInfo: {
    title: string;
    content: string;
    summary?: string;
    generated_by?: string;
    formula_id?: string;
  }
) {
  try {
    const { data, error } = await supabase
      .from('basic_infos')
      .insert([{
        user_id: userId,
        session_id: sessionId,
        ...basicInfo
      }])
      .select()
      .single();

    if (error) {
      console.error('基本情報保存エラー:', error);
      throw new Error('基本情報の保存に失敗しました');
    }

    return data;
  } catch (error) {
    console.error('基本情報保存エラー:', error);
    throw error;
  }
}

/**
 * すべての質問を取得（管理画面用）
 */
export async function getAllQuestions(): Promise<Question[]> {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('order_number', { ascending: true });

    if (error) {
      console.error('質問データ取得エラー:', error);
      throw new Error(`質問データの取得に失敗しました: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('質問データ取得エラー:', error);
    throw error;
  }
}

/**
 * 質問を単一取得
 */
export async function getQuestionByOrderNumber(orderNumber: number): Promise<Question | null> {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('質問取得エラー:', error);
      throw new Error(`質問の取得に失敗しました: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('質問取得エラー:', error);
    throw error;
  }
}

/**
 * 質問を更新
 */
export async function updateQuestion(id: string, updates: Partial<Question>): Promise<Question> {
  try {
    console.log('updateQuestion 呼び出し:', { id, updates });
    
    const { data, error } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('質問更新エラー:', error);
      console.error('エラー詳細:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`質問の更新に失敗しました: ${error.message}`);
    }

    console.log('質問更新成功:', data);
    return data;
  } catch (error) {
    console.error('質問更新エラー:', error);
    throw error;
  }
}

/**
 * 質問を作成
 */
export async function createQuestion(question: Omit<Question, 'id' | 'created_at' | 'updated_at'>): Promise<Question> {
  try {
    console.log('createQuestion 呼び出し:', question);
    
    const { data, error } = await supabase
      .from('questions')
      .insert([question])
      .select()
      .single();

    if (error) {
      console.error('質問作成エラー:', error);
      console.error('エラー詳細:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`質問の作成に失敗しました: ${error.message}`);
    }

    console.log('質問作成成功:', data);
    return data;
  } catch (error) {
    console.error('質問作成エラー:', error);
    throw error;
  }
}

/**
 * 質問を削除
 */
export async function deleteQuestion(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('質問削除エラー:', error);
      throw new Error(`質問の削除に失敗しました: ${error.message}`);
    }
  } catch (error) {
    console.error('質問削除エラー:', error);
    throw error;
  }
}

/**
 * 質問の順序を更新
 */
export async function updateQuestionOrder(questions: Array<{ id: string; order_number: number }>): Promise<void> {
  try {
    const promises = questions.map(({ id, order_number }) =>
      supabase
        .from('questions')
        .update({ order_number })
        .eq('id', id)
    );

    const results = await Promise.all(promises);
    
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('質問順序更新エラー:', errors);
      throw new Error('質問の順序更新に失敗しました');
    }
  } catch (error) {
    console.error('質問順序更新エラー:', error);
    throw error;
  }
}