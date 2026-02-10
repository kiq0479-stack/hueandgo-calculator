// 카페24 OAuth 인증 시작 엔드포인트
import { NextResponse } from 'next/server';
import { getAuthorizationUrl, isAuthenticated, getTokenStore } from '@/lib/cafe24/auth';
import crypto from 'crypto';

// GET /api/auth/cafe24 - 인증 시작 (리다이렉트)
export async function GET() {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${appUrl}/api/auth/cafe24/callback`;
    const state = crypto.randomBytes(16).toString('hex');

    const authUrl = getAuthorizationUrl(redirectUri, state);

    // state를 쿠키에 저장하여 콜백에서 검증
    const response = NextResponse.redirect(authUrl);
    response.cookies.set('cafe24_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10분
      path: '/',
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    console.error('OAuth 시작 에러:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/auth/cafe24 - 인증 상태 확인
export async function POST() {
  return NextResponse.json({
    authenticated: isAuthenticated(),
    token: isAuthenticated() ? {
      mall_id: getTokenStore()?.mall_id,
      expires_at: getTokenStore()?.expires_at,
      scopes: getTokenStore()?.scopes,
    } : null,
  });
}
