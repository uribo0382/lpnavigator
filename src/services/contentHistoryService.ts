import { supabase } from '../lib/supabase';

export interface BasicInfo {
  id: string;
  user_id: string;
  session_id?: string;
  title: string;
  content: string;
  meta_description: string | null;
  permalink: string | null;
  generated_by: string | null;
  word_count: number | null;
  status: string;
  progress?: number;
  created_at: Date;
  updated_at: Date;
}

export interface SavedContent {
  id: string;
  user_id: string;
  title: string;
  content_type: string;
  progress: number;
  answers: any;
  session_data: any;
  created_at: string;
  updated_at: string;
}

class ContentHistoryService {
  // 生成済み基本情報を取得
  async getCompletedBasicInfos(userId: string): Promise<BasicInfo[]> {
    try {
      const { data, error } = await supabase
        .from('basic_infos')
        .select('id, user_id, session_id, title, content, meta_description, permalink, generated_by, word_count, status, progress, created_at, updated_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching completed basic infos:', error);
      throw error;
    }
  }

  // 保存データ（作成途中）を取得
  async getSavedContents(userId: string): Promise<SavedContent[]> {
    try {
      const { data, error } = await supabase
        .from('saved_contents')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching saved contents:', error);
      throw error;
    }
  }

  // 基本情報を検索
  async searchBasicInfos(userId: string, searchTerm: string): Promise<BasicInfo[]> {
    try {
      const { data, error } = await supabase
        .from('basic_infos')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .or(`title.ilike.%${searchTerm}%,meta_description.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching basic infos:', error);
      throw error;
    }
  }

  // 保存データを検索
  async searchSavedContents(userId: string, searchTerm: string): Promise<SavedContent[]> {
    try {
      const { data, error } = await supabase
        .from('saved_contents')
        .select('*')
        .eq('user_id', userId)
        .ilike('title', `%${searchTerm}%`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching saved contents:', error);
      throw error;
    }
  }

  // 基本情報を削除
  async deleteBasicInfo(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('basic_infos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting basic info:', error);
      throw error;
    }
  }

  // 保存データを削除
  async deleteSavedContent(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('saved_contents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting saved content:', error);
      throw error;
    }
  }

  // 保存データを作成または更新
  async saveDraftContent(
    userId: string, 
    title: string, 
    answers: Record<string, string>, 
    progress: number,
    sessionData: any = {},
    existingId?: string
  ): Promise<SavedContent> {
    try {
      // 現在の認証ユーザーを確認
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        throw new Error('認証エラー: ログインが必要です');
      }
      
      // userIdが認証ユーザーと一致するか確認
      if (authUser.id !== userId) {
        console.warn('Warning: userId does not match authenticated user', {
          provided: userId,
          authenticated: authUser.id
        });
        // 認証されたユーザーIDを使用
        userId = authUser.id;
      }
      
      console.log('saveDraftContent called with:', {
        userId,
        title,
        progress,
        existingId,
        sessionData
      });
      
      // 既存のIDがある場合は、そのレコードを更新
      if (existingId) {
        const { data: existingData } = await supabase
          .from('saved_contents')
          .select('id')
          .eq('id', existingId)
          .eq('user_id', userId)
          .single();

        if (existingData) {
          // 既存のレコードを更新
          const { data, error } = await supabase
            .from('saved_contents')
            .update({
              title,
              progress,
              answers,
              session_data: sessionData,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingId)
            .eq('user_id', userId)
            .select()
            .single();

          if (error) throw error;
          return data;
        }
      }

      // 新規作成
      const insertData = {
        user_id: userId,
        title,
        content_type: 'basic_info',
        progress,
        answers,
        session_data: sessionData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Inserting new saved_content:', insertData);
      
      const { data, error } = await supabase
        .from('saved_contents')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Insert error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          insertData
        });
        throw error;
      }
      
      console.log('Insert successful:', data);
      return data;
    } catch (error) {
      console.error('Error saving draft content:', error);
      throw error;
    }
  }

  // IDで基本情報を取得
  async getBasicInfoById(id: string): Promise<BasicInfo | null> {
    try {
      const { data, error } = await supabase
        .from('basic_infos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching basic info by id:', error);
      throw error;
    }
  }

  // IDで保存データを取得
  async getSavedContentById(id: string): Promise<SavedContent | null> {
    try {
      const { data, error } = await supabase
        .from('saved_contents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching saved content by id:', error);
      throw error;
    }
  }
}

export const contentHistoryService = new ContentHistoryService();