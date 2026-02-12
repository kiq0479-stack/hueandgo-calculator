import { NextRequest, NextResponse } from 'next/server';
import { supabase, SettingsKey } from '@/lib/supabase';

// GET /api/settings?key=pinned_products
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key') as SettingsKey | null;

  try {
    if (key) {
      // 단일 키 조회
      const { data, error } = await supabase
        .from('shared_settings')
        .select('*')
        .eq('key', key)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = not found (정상적인 경우)
        throw error;
      }

      return NextResponse.json({ data: data?.value ?? null });
    } else {
      // 전체 조회
      const { data, error } = await supabase
        .from('shared_settings')
        .select('*');

      if (error) throw error;

      // key -> value 매핑
      const settings: Record<string, unknown> = {};
      data?.forEach((item) => {
        settings[item.key] = item.value;
      });

      return NextResponse.json({ data: settings });
    }
  } catch (error) {
    console.error('GET /api/settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// POST /api/settings
// Body: { key: string, value: any }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body as { key: SettingsKey; value: unknown };

    if (!key) {
      return NextResponse.json({ error: 'key is required' }, { status: 400 });
    }

    // Upsert (있으면 업데이트, 없으면 삽입)
    const { data, error } = await supabase
      .from('shared_settings')
      .upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('POST /api/settings error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
