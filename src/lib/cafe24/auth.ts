// 카페24 OAuth 2.0 인증 모듈

// 환경변수 getter (런타임에 안전하게 접근)
function getConfig() {
  const MALL_ID = process.env.CAFE24_MALL_ID;
  const CLIENT_ID = process.env.CAFE24_CLIENT_ID;
  const CLIENT_SECRET = process.env.CAFE24_CLIENT_SECRET;
  
  if (!MALL_ID || !CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(`환경변수 누락: MALL_ID=${!!MALL_ID}, CLIENT_ID=${!!CLIENT_ID}, CLIENT_SECRET=${!!CLIENT_SECRET}`);
  }
  
  return {
    MALL_ID,
    CLIENT_ID,
    CLIENT_SECRET,
    BASE_URL: `https://${MALL_ID}.cafe24api.com/api/v2`,
  };
}

// 토큰 저장소 (서버 메모리 - MVP용, 프로덕션에서는 DB 사용)
let tokenStore: TokenData | null = null;

export interface TokenData {
  access_token: string;
  expires_at: string; // ISO timestamp
  refresh_token: string;
  refresh_token_expires_at: string; // ISO timestamp
  client_id: string;
  mall_id: string;
  user_id: string;
  scopes: string[];
  issued_at: string; // ISO timestamp
}

interface Cafe24TokenResponse {
  access_token: string;
  expires_at: string;
  refresh_token: string;
  refresh_token_expires_at: string;
  client_id: string;
  mall_id: string;
  user_id: string;
  scopes: string[];
  issued_at: string;
}

// Authorization URL 생성
export function getAuthorizationUrl(redirectUri: string, state: string): string {
  const { CLIENT_ID, BASE_URL } = getConfig();
  
  const scopes = [
    'mall.read_product',
    'mall.read_category',
    'mall.read_store',
  ].join(',');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    state,
    redirect_uri: redirectUri,
    scope: scopes,
  });

  return `${BASE_URL}/oauth/authorize?${params.toString()}`;
}

// Authorization Code → Access Token 교환
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
): Promise<TokenData> {
  const { CLIENT_ID, CLIENT_SECRET, BASE_URL } = getConfig();
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  const response = await fetch(`${BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    // 디버깅: 환경변수 길이 확인
    throw new Error(`토큰 교환 실패: ${response.status} ${error} [ID길이:${CLIENT_ID.length}, Secret길이:${CLIENT_SECRET.length}]`);
  }

  const data: Cafe24TokenResponse = await response.json();
  tokenStore = data;
  return data;
}

// Refresh Token으로 Access Token 갱신
export async function refreshAccessToken(): Promise<TokenData> {
  if (!tokenStore?.refresh_token) {
    throw new Error('Refresh token이 없습니다. 재인증이 필요합니다.');
  }

  const { CLIENT_ID, CLIENT_SECRET, BASE_URL } = getConfig();
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  const response = await fetch(`${BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokenStore.refresh_token,
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`토큰 갱신 실패: ${response.status} ${error}`);
  }

  const data: Cafe24TokenResponse = await response.json();
  tokenStore = data;
  return data;
}

// 유효한 Access Token 반환 (만료 시 자동 갱신)
export async function getValidAccessToken(): Promise<string> {
  if (!tokenStore) {
    throw new Error('인증이 필요합니다.');
  }

  const expiresAt = new Date(tokenStore.expires_at);
  const now = new Date();
  // 만료 5분 전에 갱신
  const bufferMs = 5 * 60 * 1000;

  if (now.getTime() + bufferMs >= expiresAt.getTime()) {
    const refreshExpiresAt = new Date(tokenStore.refresh_token_expires_at);
    if (now >= refreshExpiresAt) {
      throw new Error('Refresh token이 만료되었습니다. 재인증이 필요합니다.');
    }
    await refreshAccessToken();
  }

  return tokenStore.access_token;
}

// 현재 토큰 데이터 조회
export function getTokenStore(): TokenData | null {
  return tokenStore;
}

// 토큰 저장 (외부에서 복원할 때 사용)
export function setTokenStore(data: TokenData): void {
  tokenStore = data;
}

// 인증 상태 확인
export function isAuthenticated(): boolean {
  if (!tokenStore) return false;
  const refreshExpiresAt = new Date(tokenStore.refresh_token_expires_at);
  return new Date() < refreshExpiresAt;
}
