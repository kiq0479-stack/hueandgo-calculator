-- 공유 설정 테이블
CREATE TABLE IF NOT EXISTS shared_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 비활성화 (공용 설정이므로 누구나 읽기/쓰기 가능)
ALTER TABLE shared_settings DISABLE ROW LEVEL SECURITY;

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_shared_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS shared_settings_updated_at ON shared_settings;
CREATE TRIGGER shared_settings_updated_at
  BEFORE UPDATE ON shared_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_shared_settings_updated_at();
