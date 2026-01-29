import { cookies } from 'next/headers';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPERADMIN' | 'ADMIN_JURUSAN' | 'PENILAI';
  jurusanId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getUser(): Promise<User | null> {
  console.log('=== getUser() called ===');
  
  try {
    console.log('Fetching cookies...');
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    console.log('All cookies count:', allCookies.length);
    
    // Find the user cookie
    const userCookie = allCookies.find(cookie => cookie.name === 'user');
    console.log('userCookie found:', !!userCookie);
    console.log('userCookie name:', userCookie?.name);
    
    if (!userCookie || !userCookie.value) {
      console.log('❌ No user cookie or empty value, returning null');
      return null;
    }

    // Try to parse JSON directly first
    let userData;
    try {
      userData = JSON.parse(userCookie.value);
      console.log('✅ Parsed user data directly:', userData);
    } catch (firstError) {
      console.log('⚠ Direct JSON parse failed, trying decode:', firstError.message);
      // Try decode then parse
      try {
        const decodedValue = decodeURIComponent(userCookie.value);
        console.log('Decoded value:', decodedValue);
        userData = JSON.parse(decodedValue);
        console.log('✅ Parsed user data after decode:', userData);
      } catch (secondError) {
        console.error('❌ Failed to parse user cookie:', secondError);
        return null;
      }
    }

    // Validate required fields
    if (!userData || !userData.id || !userData.email || !userData.role) {
      console.error('❌ Invalid user data - missing required fields:', userData);
      return null;
    }

    console.log('✅ getUser() returning valid user data:', userData);
    return userData;
  } catch (e) {
    console.error('❌ Failed to get user from cookies:', e);
    return null;
  }
}
