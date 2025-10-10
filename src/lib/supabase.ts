import { createClient } from '@supabase/supabase-js';

// 環境変数の型定義
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY: string;
  readonly VITE_SUPABASE_DB_PASSWORD: string;
}

// 環境変数の取得
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 環境変数のバリデーション
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Supabaseクライアントの作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'lpnavigator@1.0.0',
    },
  },
  db: {
    schema: 'public',
  },
});

// デバッグ情報を出力
console.log('Supabase Client initialized:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  timestamp: new Date().toISOString(),
});

// サービスロールクライアント（管理者権限が必要な操作用）
// 注意: このクライアントはサーバーサイドまたは管理者機能でのみ使用すること
export const supabaseAdmin = createClient(
  supabaseUrl,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// データベース型定義
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'user';
          plan: 'free' | 'standard' | 'premium' | 'enterprise';
          is_active: boolean;
          created_at: string;
          updated_at: string;
          last_login_at: string | null;
          company: string | null;
          position: string | null;
          phone: string | null;
          notes: string | null;
          usage_limit: number;
          api_access: boolean;
          lp_generated: number;
          api_calls: number;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: 'admin' | 'user';
          plan?: 'free' | 'standard' | 'premium' | 'enterprise';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
          company?: string | null;
          position?: string | null;
          phone?: string | null;
          notes?: string | null;
          usage_limit?: number;
          api_access?: boolean;
          lp_generated?: number;
          api_calls?: number;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'user';
          plan?: 'free' | 'standard' | 'premium' | 'enterprise';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
          company?: string | null;
          position?: string | null;
          phone?: string | null;
          notes?: string | null;
          usage_limit?: number;
          api_access?: boolean;
          lp_generated?: number;
          api_calls?: number;
        };
      };
      questions: {
        Row: {
          id: string;
          text: string;
          category: string;
          order_number: number;
          is_active: boolean;
          helper_text: string | null;
          sample_answer: string | null;
          is_required: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          text: string;
          category: string;
          order_number: number;
          is_active?: boolean;
          helper_text?: string | null;
          sample_answer?: string | null;
          is_required?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          text?: string;
          category?: string;
          order_number?: number;
          is_active?: boolean;
          helper_text?: string | null;
          sample_answer?: string | null;
          is_required?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      formulas: {
        Row: {
          id: string;
          name: string;
          type: 'basic_info' | 'ad_copy' | 'lp_article';
          template: string;
          variables: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
          summary: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          type: 'basic_info' | 'ad_copy' | 'lp_article';
          template: string;
          variables: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          summary?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          type?: 'basic_info' | 'ad_copy' | 'lp_article';
          template?: string;
          variables?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          summary?: string | null;
        };
      };
      question_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_name: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
          is_completed: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_name?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
          is_completed?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_name?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
          is_completed?: boolean;
        };
      };
      question_answers: {
        Row: {
          id: string;
          session_id: string;
          question_id: string;
          answer: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          question_id: string;
          answer: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          question_id?: string;
          answer?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      basic_infos: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          title: string;
          content: string;
          summary: string | null;
          generated_by: string | null;
          formula_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          title: string;
          content: string;
          summary?: string | null;
          generated_by?: string | null;
          formula_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string;
          title?: string;
          content?: string;
          summary?: string | null;
          generated_by?: string | null;
          formula_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ad_copies: {
        Row: {
          id: string;
          user_id: string;
          basic_info_id: string;
          title: string;
          content: string;
          summary: string | null;
          generated_by: string | null;
          formula_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          basic_info_id: string;
          title: string;
          content: string;
          summary?: string | null;
          generated_by?: string | null;
          formula_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          basic_info_id?: string;
          title?: string;
          content?: string;
          summary?: string | null;
          generated_by?: string | null;
          formula_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      lp_articles: {
        Row: {
          id: string;
          user_id: string;
          basic_info_id: string;
          ad_copy_id: string | null;
          title: string;
          content: string;
          meta_description: string | null;
          permalink: string | null;
          word_count: number | null;
          generated_by: string | null;
          formula_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          basic_info_id: string;
          ad_copy_id?: string | null;
          title: string;
          content: string;
          meta_description?: string | null;
          permalink?: string | null;
          word_count?: number | null;
          generated_by?: string | null;
          formula_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          basic_info_id?: string;
          ad_copy_id?: string | null;
          title?: string;
          content?: string;
          meta_description?: string | null;
          permalink?: string | null;
          word_count?: number | null;
          generated_by?: string | null;
          formula_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      content_history: {
        Row: {
          id: string;
          user_id: string;
          content_type: 'basic_info' | 'ad_copy' | 'lp_article';
          content_id: string;
          title: string;
          meta_description: string | null;
          permalink: string | null;
          generated_by: string | null;
          word_count: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_type: 'basic_info' | 'ad_copy' | 'lp_article';
          content_id: string;
          title: string;
          meta_description?: string | null;
          permalink?: string | null;
          generated_by?: string | null;
          word_count?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content_type?: 'basic_info' | 'ad_copy' | 'lp_article';
          content_id?: string;
          title?: string;
          meta_description?: string | null;
          permalink?: string | null;
          generated_by?: string | null;
          word_count?: number | null;
          created_at?: string;
        };
      };
      plans: {
        Row: {
          id: string;
          name: string;
          display_name: string;
          description: string | null;
          price_monthly: number | null;
          price_yearly: number | null;
          generation_limit: number | null;
          api_access: boolean;
          priority_support: boolean;
          features: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          display_name: string;
          description?: string | null;
          price_monthly?: number | null;
          price_yearly?: number | null;
          generation_limit?: number | null;
          api_access?: boolean;
          priority_support?: boolean;
          features: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          display_name?: string;
          description?: string | null;
          price_monthly?: number | null;
          price_yearly?: number | null;
          generation_limit?: number | null;
          api_access?: boolean;
          priority_support?: boolean;
          features?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      usage_logs: {
        Row: {
          id: string;
          user_id: string;
          action_type: string;
          content_id: string | null;
          generated_by: string | null;
          tokens_used: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action_type: string;
          content_id?: string | null;
          generated_by?: string | null;
          tokens_used?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action_type?: string;
          content_id?: string | null;
          generated_by?: string | null;
          tokens_used?: number | null;
          created_at?: string;
        };
      };
    };
  };
};

// 接続テスト用のヘルパー関数
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('_prisma_migrations').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      console.error('Supabase connection error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
}