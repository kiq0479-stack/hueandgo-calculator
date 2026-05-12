// "아크릴 종류" 옵션을 가진 상품 조사 스크립트
// 사용: node scripts/audit-acrylic-options.mjs
//
// 모든 판매중 상품의 옵션을 조회하여:
//  - 옵션명에 "아크릴" 또는 "종류" 또는 "재질" 포함
//  - 옵션값에 "투명", "양면접합", "거울", "홀로그램", "글리터", "야광" 등 아크릴 종류 키워드 포함
//  → 해당 상품 리스트업

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

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

// 옵션 조회 (실패 시 variants에서 추출)
async function fetchOptions(productNo) {
  const res = await cafe24Fetch(`${BASE_URL}/products/${productNo}/options`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.options || [];
}

async function fetchVariants(productNo) {
  const all = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const res = await cafe24Fetch(`${BASE_URL}/products/${productNo}/variants?limit=${limit}&offset=${offset}`);
    if (!res.ok) break;
    const data = await res.json();
    const variants = data.variants || [];
    all.push(...variants);
    if (variants.length < limit) break;
    offset += limit;
    if (offset >= 1000) break;
  }
  return all;
}

function extractOptionsFromVariants(variants) {
  if (!variants?.length) return [];
  const optionMap = new Map();
  for (const variant of variants) {
    if (!variant.options) continue;
    for (const opt of variant.options) {
      if (!optionMap.has(opt.name)) optionMap.set(opt.name, new Set());
      optionMap.get(opt.name).add(opt.value);
    }
  }
  const result = [];
  for (const [name, values] of optionMap) {
    result.push({ option_name: name, option_value: [...values].map((v) => ({ option_text: v })) });
  }
  return result;
}

// "아크릴 종류" 옵션 판별
const ACRYL_TYPE_NAME_PATTERN = /아크릴\s*종류|종류|재질|타입/;
const ACRYL_TYPE_VALUE_KEYWORDS = [
  '투명', '양면접합', '거울', '미러', '홀로그램', '글리터',
  '야광', '펄', '컬러', '유광', '무광', '반사', '하프미러',
];

function findAcrylicTypeOption(options) {
  for (const opt of options) {
    const name = opt.option_name || '';
    const values = (opt.option_value || []).map((v) => v.option_text || '');

    // 1. 옵션명 매칭
    const nameMatched = ACRYL_TYPE_NAME_PATTERN.test(name);

    // 2. 옵션값에 키워드 2개 이상 포함 (값 기준 판별)
    const valueMatched = ACRYL_TYPE_VALUE_KEYWORDS.filter((kw) =>
      values.some((v) => v.includes(kw))
    ).length >= 2;

    if (nameMatched || valueMatched) {
      return { name, values, byName: nameMatched, byValue: valueMatched };
    }
  }
  return null;
}

async function main() {
  console.log('[1/3] 토큰 로드...');
  TOKEN = await loadToken();

  console.log('[2/3] 상품 목록 조회...');
  const products = await fetchAllProducts();
  console.log(`  → ${products.length}개 상품`);

  const filterKw = ['개인 결제창', '개인결제창', '개인결제', '결제창'];
  const targets = products.filter((p) => !filterKw.some((k) => p.product_name.includes(k)));
  console.log(`  → 검사 대상: ${targets.length}개`);

  console.log('[3/3] 상품별 옵션 검사...');
  const matches = [];
  let i = 0;
  for (const p of targets) {
    i++;
    process.stdout.write(`\r  ${i}/${targets.length}  `);

    let options = await fetchOptions(p.product_no);
    if (!options.length) {
      const variants = await fetchVariants(p.product_no);
      options = extractOptionsFromVariants(variants);
    }

    const found = findAcrylicTypeOption(options);
    if (found) {
      matches.push({
        product_no: p.product_no,
        product_code: p.product_code,
        product_name: p.product_name,
        matched_option_name: found.name,
        matched_values: found.values,
        match_reason: found.byName ? (found.byValue ? 'name+value' : 'name') : 'value',
        all_options: options.map((o) => ({
          name: o.option_name,
          values: (o.option_value || []).map((v) => v.option_text),
        })),
      });
    }

    await new Promise((r) => setTimeout(r, 50));
  }
  process.stdout.write('\n');

  const reportPath = path.join(ROOT, 'acrylic-options-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(matches, null, 2), 'utf8');

  console.log(`\n========== 결과 ==========`);
  console.log(`아크릴 종류 옵션 보유 상품: ${matches.length}개`);
  console.log(`리포트: ${reportPath}\n`);
  for (const m of matches) {
    console.log(`- [${m.product_code}] ${m.product_name}`);
    console.log(`    옵션: "${m.matched_option_name}" (${m.match_reason})`);
    console.log(`    값: ${m.matched_values.join(', ')}`);
  }
}

main().catch((err) => {
  console.error('\n❌ 에러:', err);
  process.exit(1);
});
