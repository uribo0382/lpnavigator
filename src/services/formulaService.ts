import { supabase } from '../lib/supabase';

export interface Formula {
  id: string;
  name: string;
  type: 'basic_info' | 'ad_copy' | 'lp_article';
  template: string;
  variables: string[];
  is_active: boolean;
  isActive?: boolean; // モックデータとの互換性のため
  summary: string | null;
  created_at: string;
  created_at_date?: Date; // Date型の互換性
  createdAt?: Date; // モックデータとの互換性
  updated_at: string;
  updated_at_date?: Date; // Date型の互換性
  updatedAt?: Date; // モックデータとの互換性
}

class FormulaService {
  // 指定タイプのフォーミュラを全て取得
  async getFormulasByType(type: 'basic_info' | 'ad_copy' | 'lp_article'): Promise<Formula[]> {
    try {
      const { data, error } = await supabase
        .from('formulas')
        .select('*')
        .eq('type', type)
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // モックデータとの互換性のためのマッピング
      return (data || []).map(formula => ({
        ...formula,
        isActive: formula.is_active,
        createdAt: new Date(formula.created_at),
        updatedAt: new Date(formula.updated_at),
        created_at_date: new Date(formula.created_at),
        updated_at_date: new Date(formula.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching formulas:', error);
      throw error;
    }
  }

  // フォーミュラを作成
  async createFormula(formula: Omit<Formula, 'id' | 'created_at' | 'updated_at'>): Promise<Formula> {
    try {
      // モックデータとの互換性を考慮したデータ変換
      const insertData = {
        name: formula.name,
        type: formula.type,
        template: formula.template,
        variables: formula.variables,
        is_active: formula.is_active ?? formula.isActive ?? true,
        summary: formula.summary
      };
      
      const { data, error } = await supabase
        .from('formulas')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      
      // レスポンスデータの変換
      return {
        ...data,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        created_at_date: new Date(data.created_at),
        updated_at_date: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error creating formula:', error);
      throw error;
    }
  }

  // フォーミュラを更新
  async updateFormula(id: string, updates: Partial<Omit<Formula, 'id' | 'created_at' | 'updated_at'>>): Promise<Formula> {
    try {
      // モックデータとの互換性を考慮したデータ変換
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.template !== undefined) updateData.template = updates.template;
      if (updates.variables !== undefined) updateData.variables = updates.variables;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
      if (updates.isActive !== undefined && updates.is_active === undefined) {
        updateData.is_active = updates.isActive;
      }
      if (updates.summary !== undefined) updateData.summary = updates.summary;
      
      const { data, error } = await supabase
        .from('formulas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // レスポンスデータの変換
      return {
        ...data,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        created_at_date: new Date(data.created_at),
        updated_at_date: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error updating formula:', error);
      throw error;
    }
  }

  // フォーミュラを削除
  async deleteFormula(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('formulas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting formula:', error);
      throw error;
    }
  }

  // フォーミュラを有効化（他のフォーミュラを無効化）
  async activateFormula(id: string, type: 'basic_info' | 'ad_copy' | 'lp_article'): Promise<void> {
    try {
      // トランザクション的に処理（同じタイプの他のフォーミュラを無効化してから有効化）
      // まず同じタイプの全フォーミュラを無効化
      const { error: disableError } = await supabase
        .from('formulas')
        .update({ is_active: false })
        .eq('type', type);

      if (disableError) throw disableError;

      // 指定されたフォーミュラを有効化
      const { error: enableError } = await supabase
        .from('formulas')
        .update({ is_active: true })
        .eq('id', id);

      if (enableError) throw enableError;
    } catch (error) {
      console.error('Error activating formula:', error);
      throw error;
    }
  }

  // 有効なフォーミュラを取得
  async getActiveFormula(type: 'basic_info' | 'ad_copy' | 'lp_article'): Promise<Formula | null> {
    try {
      const { data, error } = await supabase
        .from('formulas')
        .select('*')
        .eq('type', type)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching active formula:', error);
      throw error;
    }
  }

  // フォーミュラの存在確認
  async formulaExists(id: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('formulas')
        .select('id')
        .eq('id', id)
        .single();

      if (error && error.code === 'PGRST116') {
        return false;
      }
      
      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking formula existence:', error);
      throw error;
    }
  }

  // フォーミュラの有効/無効を切り替え（コンポーネントで使用）
  async toggleActive(id: string): Promise<void> {
    try {
      // 現在の状態を取得
      const { data: currentFormula, error: fetchError } = await supabase
        .from('formulas')
        .select('is_active')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // 状態を反転
      const { error: updateError } = await supabase
        .from('formulas')
        .update({ is_active: !currentFormula.is_active })
        .eq('id', id);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error toggling formula active state:', error);
      throw error;
    }
  }
}

export const formulaService = new FormulaService();