// 카페24 OAuth 콜백 처리 엔드포인트
import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/cafe24/auth';

// GET /api/auth/cafe24/callback - 콜백 처리
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // 에러 처리
  if (error) {
    const errorDescription = searchParams.get('error_description') || '인증이 거부되었습니다.';
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent(errorDescription)}`, request.url),
    );
  }

  // code 파라미터 확인
  if (!code) {
    return NextResponse.redirect(
      new URL('/?auth_error=authorization_code_missing', request.url),
    );
  }

  // state 검증 (CSRF 방지)
  const savedState = request.cookies.get('cafe24_oauth_state')?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(
      new URL('/?auth_error=invalid_state', request.url),
    );
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${appUrl}/api/auth/cafe24/callback`;

    const tokenData = await exchangeCodeForToken(code, redirectUri);

    // 인증 성공 → 메인 페이지로 리다이렉트
    const response = NextResponse.redirect(new URL('/?auth=success', request.url));
    // state 쿠키 제거
    response.cookies.delete('cafe24_oauth_state');
    
    // 토큰을 쿠키에 저장 (serverless 환경에서 유지)
    response.cookies.set('cafe24_token', JSON.stringify(tokenData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 14, // 14일 (refresh token 유효기간)
      path: '/',
    });
    
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : '토큰 교환 중 오류 발생';
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
