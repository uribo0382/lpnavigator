import { supabase } from '../lib/supabase';

// ユーザー型定義（UsersManagement.tsxと同じ）
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  plan: string;
  isActive: boolean;
  is_active?: boolean; // データベースとの互換性
  createdAt: Date;
  created_at?: string; // データベースとの互換性
  lastLoginAt?: Date;
  last_login_at?: string; // データベースとの互換性
  company?: string;
  position?: string;
  phone?: string;
  notes?: string;
  usageLimit?: number;
  usage_limit?: number; // データベースとの互換性
  apiAccess?: boolean;
  api_access?: boolean; // データベースとの互換性
  usage?: {
    lpGenerated: number;
    apiCalls: number;
  };
  lp_generated?: number; // データベースとの互換性
  api_calls?: number; // データベースとの互換性
}

class UserService {
  // すべてのユーザーを取得
  async getAllUsers(): Promise<User[]> {
    try {
      console.log('=== getAllUsers START ===');
      console.log('Fetching all users from Supabase...');
      
      // クエリを実行
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      // console.log('Query response status:', status);
      // console.log('Query response statusText:', statusText);

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          statusCode: error.statusCode
        });
        
        // RLS関連のエラーをチェック
        if (error.message?.includes('row-level security') || error.code === '42501') {
          console.error('RLS Error detected. Please run database/fix-users-rls-complete.sql in Supabase SQL Editor');
        }
        
        throw error;
      }

      // データの詳細を確認
      console.log('Raw response data:', data);
      console.log('Data is null?', data === null);
      console.log('Data is undefined?', data === undefined);
      console.log('Data is array?', Array.isArray(data));
      console.log('Users count:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('First user sample:', data[0]);
        console.log('User roles:', data.map(u => ({ email: u.email, role: u.role })));
      }
      
      // データベースの形式からアプリケーションの形式に変換
      const mappedUsers = (data || []).map((user, index) => {
        console.log(`Mapping user ${index + 1}/${data?.length || 0}:`, user.email);
        return this.mapDbUserToUser(user);
      });
      
      console.log('Mapped users count:', mappedUsers.length);
      console.log('Mapped users roles:', mappedUsers.map(u => ({ email: u.email, role: u.role })));
      console.log('=== getAllUsers END ===');
      
      return mappedUsers;
    } catch (error) {
      console.error('=== getAllUsers ERROR ===');
      console.error('Error type:', error?.constructor?.name);
      console.error('Error details:', error);
      throw error;
    }
  }

  // 一般ユーザーのみ取得（管理者を除く）
  async getRegularUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'user')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(user => this.mapDbUserToUser(user));
    } catch (error) {
      console.error('Error fetching regular users:', error);
      throw error;
    }
  }

  // 単一のユーザーを取得
  async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code === 'PGRST116') {
        return null;
      }

      if (error) throw error;

      return data ? this.mapDbUserToUser(data) : null;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  // ユーザーを作成
  async createUser(user: Omit<User, 'id' | 'createdAt' | 'usage'>): Promise<User> {
    try {
      const dbUser = this.mapUserToDbUser(user);
      
      // デフォルト値を設定
      const userToInsert = {
        ...dbUser,
        role: dbUser.role || 'user',
        plan: dbUser.plan || 'free',
        is_active: dbUser.is_active !== undefined ? dbUser.is_active : true,
        usage_limit: dbUser.usage_limit !== undefined ? dbUser.usage_limit : 10,
        api_access: dbUser.api_access !== undefined ? dbUser.api_access : false,
        lp_generated: dbUser.lp_generated || 0,
        api_calls: dbUser.api_calls || 0
      };
      
      const { data, error } = await supabase
        .from('users')
        .insert(userToInsert)
        .select()
        .single();

      if (error) throw error;

      return this.mapDbUserToUser(data);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // ユーザーを更新
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const dbUpdates = this.mapUserToDbUser(updates);
      
      const { data, error } = await supabase
        .from('users')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return this.mapDbUserToUser(data);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // ユーザーを削除
  async deleteUser(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // ユーザーの有効/無効を切り替え
  async toggleUserActive(id: string): Promise<User> {
    try {
      // 現在の状態を取得
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('is_active')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // 状態を反転
      const { data, error } = await supabase
        .from('users')
        .update({ is_active: !currentUser.is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return this.mapDbUserToUser(data);
    } catch (error) {
      console.error('Error toggling user active state:', error);
      throw error;
    }
  }

  // データベースのユーザーデータをアプリケーションの形式に変換
  private mapDbUserToUser(dbUser: any): User {
    console.log('=== mapDbUserToUser Debug ===');
    console.log('Raw DB user:', dbUser);
    console.log('DB user role:', dbUser.role, 'type:', typeof dbUser.role);
    console.log('DB user is_active:', dbUser.is_active, 'type:', typeof dbUser.is_active);
    
    // is_activeの値を確実にbooleanに変換
    const isActive = typeof dbUser.is_active === 'string' 
      ? dbUser.is_active === 'true' || dbUser.is_active === '1' || dbUser.is_active === 't'
      : Boolean(dbUser.is_active);
    
    console.log('Converted isActive:', isActive, 'type:', typeof isActive);
    
    const mappedUser = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      plan: dbUser.plan,
      isActive: isActive,
      createdAt: new Date(dbUser.created_at),
      lastLoginAt: dbUser.last_login_at ? new Date(dbUser.last_login_at) : undefined,
      company: dbUser.company,
      position: dbUser.position,
      phone: dbUser.phone,
      notes: dbUser.notes,
      usageLimit: typeof dbUser.usage_limit === 'string' ? parseInt(dbUser.usage_limit, 10) : dbUser.usage_limit,
      apiAccess: typeof dbUser.api_access === 'string' ? dbUser.api_access === 'true' : Boolean(dbUser.api_access),
      usage: {
        lpGenerated: typeof dbUser.lp_generated === 'string' ? parseInt(dbUser.lp_generated, 10) : (dbUser.lp_generated || 0),
        apiCalls: typeof dbUser.api_calls === 'string' ? parseInt(dbUser.api_calls, 10) : (dbUser.api_calls || 0)
      },
      // 元のデータベースフィールドも保持（互換性のため）
      is_active: dbUser.is_active,
      created_at: dbUser.created_at,
      last_login_at: dbUser.last_login_at,
      usage_limit: dbUser.usage_limit,
      api_access: dbUser.api_access,
      lp_generated: dbUser.lp_generated,
      api_calls: dbUser.api_calls
    };
    
    console.log('Mapped user:', mappedUser);
    return mappedUser;
  }

  // アプリケーションのユーザーデータをデータベースの形式に変換
  private mapUserToDbUser(user: Partial<User>): any {
    const dbUser: any = {};

    if (user.name !== undefined) dbUser.name = user.name;
    if (user.email !== undefined) dbUser.email = user.email;
    if (user.role !== undefined) dbUser.role = user.role;
    if (user.plan !== undefined) dbUser.plan = user.plan;
    if (user.isActive !== undefined) dbUser.is_active = user.isActive;
    if (user.lastLoginAt !== undefined) dbUser.last_login_at = user.lastLoginAt?.toISOString();
    if (user.company !== undefined) dbUser.company = user.company || null;
    if (user.position !== undefined) dbUser.position = user.position || null;
    if (user.phone !== undefined) dbUser.phone = user.phone || null;
    if (user.notes !== undefined) dbUser.notes = user.notes || null;
    if (user.usageLimit !== undefined) dbUser.usage_limit = user.usageLimit;
    if (user.apiAccess !== undefined) dbUser.api_access = user.apiAccess;
    if (user.usage?.lpGenerated !== undefined) dbUser.lp_generated = user.usage.lpGenerated;
    if (user.usage?.apiCalls !== undefined) dbUser.api_calls = user.usage.apiCalls;

    console.log('Mapped user to DB format:', dbUser);
    return dbUser;
  }
}

export const userService = new UserService();