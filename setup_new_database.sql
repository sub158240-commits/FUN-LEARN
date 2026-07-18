-- ========================================================
--  FUN & LEARN - إعداد قاعدة البيانات الجديدة (النسخة المصححة)
--  شغّل هذا الكود كاملاً في Supabase SQL Editor
-- ========================================================

-- 1. جدول الصفوف (classes) — يحتوي على icon
CREATE TABLE IF NOT EXISTS classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '📚',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول المستخدمين (users)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'student')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'pending')),
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    avatar TEXT DEFAULT '👦',
    coins INTEGER DEFAULT 0,
    xp INTEGER DEFAULT 0,
    hints INTEGER DEFAULT 0,
    equipped_frame TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول الواجبات (homework) — due_date كـ TIMESTAMPTZ لدعم التاريخ والوقت
CREATE TABLE IF NOT EXISTS homework (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    link TEXT,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    due_date TIMESTAMPTZ DEFAULT NULL,
    responses_link TEXT DEFAULT NULL,
    added_date TIMESTAMPTZ DEFAULT NOW()
);

-- 4. جدول نتائج الواجبات (homework_results)
CREATE TABLE IF NOT EXISTS homework_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    hw_id UUID REFERENCES homework(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, hw_id)
);

-- 5. جدول الألعاب (games)
CREATE TABLE IF NOT EXISTS games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    questions JSONB DEFAULT '[]',
    max_plays INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. جدول نتائج الألعاب (game_results)
CREATE TABLE IF NOT EXISTS game_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. جدول عناصر المستخدم (user_items)
CREATE TABLE IF NOT EXISTS user_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
--  إضافة حساب الأدمن
-- ========================================================
INSERT INTO users (username, email, password, role, status, avatar, coins, xp)
VALUES (
    'admin',
    'admin@funlearn.com',
    'Admin@1234',
    'admin',
    'active',
    '👨‍🏫',
    9999,
    9999
)
ON CONFLICT (username) DO NOTHING;

-- ========================================================
--  تفعيل Row Level Security (RLS)
-- ========================================================
ALTER TABLE classes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework         ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE games            ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_items       ENABLE ROW LEVEL SECURITY;

-- السماح بكل العمليات للجميع (anon + authenticated)
CREATE POLICY "Allow all" ON classes          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON users            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON homework         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON homework_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON games            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON game_results     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON user_items       FOR ALL USING (true) WITH CHECK (true);

-- ========================================================
--  إذا شغّلت SQL من قبل وعندك جداول موجودة، شغّل هذا:
-- ========================================================
-- ALTER TABLE classes ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '📚';
-- ALTER TABLE homework ALTER COLUMN due_date TYPE TIMESTAMPTZ USING due_date::TIMESTAMPTZ;

-- ========================================================
--  تم! 🎉
--  بيانات الأدمن:
--  اليوزر:  admin
--  الباسورد: Admin@1234
-- ========================================================
