import { getSupabase, getSupabaseAdmin } from './supabase';

export type UserRole = 'admin' | 'member';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};

/**
 * Login dengan email dan password.
 * Mengembalikan user beserta role-nya.
 */
export async function signIn(email: string, password: string): Promise<AuthUser> {
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  const role = await getUserRole(data.user.id);
  return { id: data.user.id, email: data.user.email!, role };
}

/**
 * Logout.
 */
export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  await supabase.auth.signOut();
}

/**
 * Ambil session aktif dan role user.
 */
export async function getSession(): Promise<AuthUser | null> {
  try {
    const supabase = getSupabase();

    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    if (!session) return null;

    const role = await getUserRole(session.user.id);
    return { id: session.user.id, email: session.user.email!, role };
  } catch (error) {
    console.error('Exception in getSession:', error);
    return null;
  }
}

/**
 * Ambil role user dari tabel user_roles.
 * Default ke 'member' jika tidak ditemukan.
 */
async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error getting user role:', error);
      return 'member';
    }

    return (data?.role as UserRole) ?? 'member';
  } catch (error) {
    console.error('Exception in getUserRole:', error);
    return 'member';
  }
}

/**
 * Set role user (hanya bisa dipanggil dari server dengan service role key).
 */
export async function setUserRole(userId: string, role: UserRole): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('user_roles')
    .upsert({ id: userId, role });

  if (error) throw new Error(error.message);
}
