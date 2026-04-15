// 추가구성상품 매핑 전수 검사 스크립트
// 사용: node scripts/audit-addons.mjs
//
// 모든 판매중 상품에 대해:
//  1. Cafe24 API /additionalproducts 응답 확인
//  2. 상품 상세 embed의 additionalproducts 확인
//  3. 로컬 addon-mapping.json 매핑 확인
//  4. 셋 다 비어있는 상품을 리포트

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// .env.local 로드
function loadEnv() {
  const envPath = path.join(ROOT, '.env.local');
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      // 리터럴 \n 제거 (env 파일 포맷 이슈)
      v = v.replace(/\\n/g, '').trim();
      process.env[m[1]] = v;
    }
  }
}
loadEnv();

const MALL_ID = process.env.CAFE24_MALL_ID;
const BASE_URL = `https://${MALL_ID}.cafe24api.com/api/v2/admin`;
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabase에서 토큰 로드 (supabase-js 클라이언트 사용)
const sb = createClient(SB_URL, SB_KEY);
async function loadToken() {
  const { data, error } = await sb
    .from('shared_settings')
    .select('value')
    .eq('key', 'cafe24_token')
    .single();
  if (error) throw new Error(`Supabase token load failed: ${error.message}`);
  if (!data) throw new Error('No token in Supabase');
  return data.value;
}

// Refresh token
async function refreshToken(currentToken) {
  const credentials = Buffer.from(
    `${process.env.CAFE24_CLIENT_ID}:${process.env.CAFE24_CLIENT_SECRET}`
  ).toString('base64');
  const res = await fetch(`https://${MALL_ID}.cafe24api.com/api/v2/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: currentToken.refresh_token,
    }).toString(),
  });
  if (!res.ok) throw new Error(`refresh failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  await sb.from('shared_settings').upsert({
    key: 'cafe24_token',
    value: data,
    updated_at: new Date().toISOString(),
  });
  return data;
}

let TOKEN;

async function cafe24Fetch(url) {
  let res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN.access_token}` },
  });
  if (res.status === 401) {
    TOKEN = await refreshToken(TOKEN);
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN.access_token}` },
    });
  }
  return res;
}

// 모든 판매중 상품 조회
async function fetchAllProducts() {
  const all = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const url = `${BASE_URL}/products?limit=${limit}&offset=${offset}&selling=T`;
    const res = await cafe24Fetch(url);
    if (!res.ok) throw new Error(`products list: ${res.status} ${await res.text()}`);
    const data = await res.json();
    const products = data.products || [];
    all.push(...products);
    if (products.length < limit) break;
    offset += limit;
    if (offset >= 2000) break;
  }
  return all;
}

// 추가구성상품 조회
async function fetchAdditional(productNo) {
  const res = await cafe24Fetch(`${BASE_URL}/products/${productNo}/additionalproducts`);
  if (!res.ok) {
    if (res.status === 404) return { ok: true, count: 0, source: '404' };
    return { ok: false, status: res.status, error: await res.text() };
  }
  const data = await res.json();
  return { ok: true, count: (data.additionalproducts || []).length, items: data.additionalproducts || [] };
}

// 상품 상세 (embed=additionalproducts)
async function fetchProductDetail(productNo) {
  const res = await cafe24Fetch(`${BASE_URL}/products/${productNo}?embed=additionalproducts`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.product;
}

// 로컬 매핑
function loadLocalMapping() {
  const p = path.join(ROOT, 'src/data/addon-mapping.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// 상품명 정규화 (파트너 전용, 에디터 등 제거)
function normalizeName(name) {
  return name
    .replace(/\(파트너 전용[^)]*\)/g, '')
    .replace(/\(에디터[^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// 메인 키워드 추출 (신+구 비교용)
function mainKeywords(name) {
  return normalizeName(name)
    .split(/\s+/)
    .filter((w) => w.length > 1 && !/^\d+T$/i.test(w) && !/^\d+mm$/i.test(w));
}

async function main() {
  console.log('[1/4] 토큰 로드...');
  TOKEN = await loadToken();

  console.log('[2/4] 상품 목록 조회...');
  const products = await fetchAllProducts();
  console.log(`  → ${products.length}개 상품`);

  console.log('[3/4] 로컬 매핑 로드...');
  const localMapping = loadLocalMapping();
  console.log(`  → ${Object.keys(localMapping).length}개 매핑`);

  // 필터 (결제창 등 제외)
  const filterKw = ['개인 결제창', '개인결제창', '개인결제', '결제창'];
  const targets = products.filter((p) => !filterKw.some((k) => p.product_name.includes(k)));
  console.log(`  → 검사 대상: ${targets.length}개`);

  console.log('[4/4] 상품별 추가구성상품 상태 검사...');
  const report = {
    hasCafe24Addons: [],
    hasEmbedAddons: [],
    hasLocalMappingOnly: [],
    missing: [],
    emptyInAll: [],
  };

  let i = 0;
  for (const p of targets) {
    i++;
    process.stdout.write(`\r  ${i}/${targets.length}  `);

    const add = await fetchAdditional(p.product_no);
    const cafe24Count = add.ok ? add.count : 0;

    let embedCount = 0;
    if (cafe24Count === 0) {
      const detail = await fetchProductDetail(p.product_no);
      embedCount = detail?.additionalproducts?.length || 0;
    }

    const localMapped = localMapping[p.product_code];
    const localCount = localMapped ? localMapped.length : 0;

    const record = {
      product_no: p.product_no,
      product_code: p.product_code,
      product_name: p.product_name,
      cafe24: cafe24Count,
      embed: embedCount,
      local: localCount,
      hasLocalKey: p.product_code in localMapping,
    };

    if (cafe24Count > 0) report.hasCafe24Addons.push(record);
    else if (embedCount > 0) report.hasEmbedAddons.push(record);
    else if (localCount > 0) report.hasLocalMappingOnly.push(record);
    else if (p.product_code in localMapping) report.emptyInAll.push(record); // 의도된 빈값 (P00000GA 등)
    else report.missing.push(record);

    await new Promise((r) => setTimeout(r, 50)); // rate limit
  }
  process.stdout.write('\n');

  // 누락 상품에 대해 유사 상품명 매칭 제안
  console.log('\n[분석] 누락 상품의 유사 매핑 후보 찾기...');
  const mappedProducts = [
    ...report.hasCafe24Addons,
    ...report.hasLocalMappingOnly,
    ...report.hasEmbedAddons,
  ];

  for (const miss of report.missing) {
    const missKw = mainKeywords(miss.product_name);
    const candidates = [];
    for (const m of mappedProducts) {
      const mKw = mainKeywords(m.product_name);
      const overlap = missKw.filter((k) => mKw.includes(k));
      // 2개 이상 키워드 겹치면 후보 (임계값 유연화)
      if (overlap.length >= 2 && overlap.length >= missKw.length - 2) {
        candidates.push({
          product_code: m.product_code,
          product_name: m.product_name,
          match_score: overlap.length,
          addon_count: m.cafe24 || m.local,
        });
      }
    }
    candidates.sort((a, b) => b.match_score - a.match_score);
    miss.suggestions = candidates.slice(0, 3);
  }

  // 리포트 저장
  const reportPath = path.join(ROOT, 'addon-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  // 요약 출력
  console.log('\n========== 요약 ==========');
  console.log(`Cafe24 API 추가구성상품 있음: ${report.hasCafe24Addons.length}개`);
  console.log(`상품상세 embed 있음       : ${report.hasEmbedAddons.length}개`);
  console.log(`로컬 매핑만 있음          : ${report.hasLocalMappingOnly.length}개`);
  console.log(`빈값 의도                 : ${report.emptyInAll.length}개`);
  console.log(`❌ 누락                   : ${report.missing.length}개`);
  console.log(`\n리포트: ${reportPath}`);

  if (report.missing.length > 0) {
    console.log('\n========== 누락 상품 (상위 20개) ==========');
    for (const m of report.missing.slice(0, 20)) {
      console.log(`- ${m.product_code} ${m.product_name}`);
      if (m.suggestions && m.suggestions.length > 0) {
        for (const s of m.suggestions) {
          console.log(`    ↳ 후보: ${s.product_code} ${s.product_name} (스코어 ${s.match_score}, 추가상품 ${s.addon_count}개)`);
        }
      } else {
        console.log(`    ↳ 유사 매핑 후보 없음`);
      }
    }
  }
}

main().catch((err) => {
  console.error('\n❌ 에러:', err);
  process.exit(1);
});
