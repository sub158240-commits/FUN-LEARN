-- ========================================================
--  FUN & LEARN - إضافة جداول الواجبات الداخلية (Quiz Homework)
--  شغّل هذا الكود في Supabase SQL Editor
-- ========================================================

-- إضافة عمود نوع الواجب (google_form أو quiz) للجدول الموجود
ALTER TABLE homework ADD COLUMN IF NOT EXISTS hw_type TEXT DEFAULT 'google_form';
ALTER TABLE homework ADD COLUMN IF NOT EXISTS questions JSONB DEFAULT '[]';

-- تعديل homework_results لإضافة بيانات الإجابات والدرجة
ALTER TABLE homework_results ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '[]';
ALTER TABLE homework_results ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE homework_results ADD COLUMN IF NOT EXISTS total INTEGER DEFAULT 0;

-- ========================================================
--  تم! 🎉
-- ========================================================
