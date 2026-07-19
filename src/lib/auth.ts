import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { supabaseAdmin } from './supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'RentEasy-super-secret-key-12345!';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'OWNER' | 'TENANT';
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('RentEasy_token')?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const { data: userData, error } = await supabaseAdmin
    .from('User')
    .select('*, ownerProfile:OwnerProfile(*), tenantProfile:TenantProfile(*, room:Room(*, property:Property(*)))')
    .eq('id', payload.userId)
    .single();

  if (error || !userData) return null;

  const user = userData as any;
  if (user.ownerProfile && Array.isArray(user.ownerProfile)) {
    user.ownerProfile = user.ownerProfile[0] || null;
  }
  if (user.tenantProfile && Array.isArray(user.tenantProfile)) {
    const tenant = user.tenantProfile[0] || null;
    if (tenant) {
      if (tenant.room && Array.isArray(tenant.room)) {
        tenant.room = tenant.room[0] || null;
      }
      if (tenant.room?.property && Array.isArray(tenant.room.property)) {
        tenant.room.property = tenant.room.property[0] || null;
      }
    }
    user.tenantProfile = tenant;
  }

  return user;
}
