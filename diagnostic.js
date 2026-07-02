// diagnostic.js - تشخيص المشكلة
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://afpboagnlguyxrctjtmi.supabase.co';
const supabaseKey = 'sb_publishable_IMapblFgo2WBHsgtZI4sUQ_aZuBhAYB';
const client = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('🔍 جاري التشخيص...\n');

    // 1. Test users table
    const { data, error } = await client.from('users').select('*');
    
    if (error) {
        console.log('❌ خطأ في قراءة جدول users:');
        console.log('   الكود:', error.code);
        console.log('   الرسالة:', error.message);
        if (error.code === '42501' || error.message.includes('permission')) {
            console.log('\n🔴 السبب: الـ RLS مفعّل ويمنع القراءة.');
            console.log('\n✅ الحل: شغّل الكود التالي في Supabase SQL Editor:\n');
            console.log('ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
            console.log('ALTER TABLE classes DISABLE ROW LEVEL SECURITY;');
            console.log('ALTER TABLE homework DISABLE ROW LEVEL SECURITY;');
            console.log('ALTER TABLE homework_results DISABLE ROW LEVEL SECURITY;');
            console.log('ALTER TABLE games DISABLE ROW LEVEL SECURITY;');
            console.log('ALTER TABLE game_results DISABLE ROW LEVEL SECURITY;');
            console.log('ALTER TABLE user_items DISABLE ROW LEVEL SECURITY;');
        }
    } else if (!data || data.length === 0) {
        console.log('⚠️ الجدول موجود لكن لا توجد بيانات!');
        console.log('   السبب المحتمل: الـ RLS مفعّل وهو يمنع القراءة.');
        console.log('\n✅ الحل: شغّل الكود التالي في Supabase SQL Editor:\n');
        console.log('ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
        console.log('ALTER TABLE classes DISABLE ROW LEVEL SECURITY;');
        console.log('ALTER TABLE homework DISABLE ROW LEVEL SECURITY;');
        console.log('ALTER TABLE homework_results DISABLE ROW LEVEL SECURITY;');
        console.log('ALTER TABLE games DISABLE ROW LEVEL SECURITY;');
        console.log('ALTER TABLE game_results DISABLE ROW LEVEL SECURITY;');
        console.log('ALTER TABLE user_items DISABLE ROW LEVEL SECURITY;');
    } else {
        console.log('✅ الجدول يعمل بشكل صحيح!');
        console.log('   عدد المستخدمين:', data.length);
        const admin = data.find(u => u.username === 'admin');
        if (admin) {
            console.log('✅ حساب الادمن موجود!');
            console.log('   username:', admin.username);
            console.log('   password:', admin.password);
            console.log('   role:', admin.role);
            console.log('   status:', admin.status);
        } else {
            console.log('❌ حساب الادمن غير موجود في قاعدة البيانات!');
        }
    }
}

diagnose().catch(console.error);
