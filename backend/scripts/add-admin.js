// Script สำหรับเพิ่ม admin user
const bcrypt = require('bcrypt');
const db = require('../db/knex');

async function addAdmin() {
  try {
    const email = 'oh@udvc.ac.th';
    const password = '12345678';
    const nameTh = 'ผู้ดูแลระบบ OH';
    const role = 'admin';
    const status = 'active';

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('Password hashed:', passwordHash);

    // ตรวจสอบว่ามี email นี้อยู่แล้วหรือไม่
    const existing = await db('users').where({ email }).first();
    if (existing) {
      console.log('❌ User already exists:', email);
      return;
    }

    // เพิ่ม user
    const [id] = await db('users').insert({
      email,
      password_hash: passwordHash,
      name_th: nameTh,
      role,
      status
    });

    console.log('✅ Admin user added successfully!');
    console.log('   ID:', id);
    console.log('   Email:', email);
    console.log('   Name:', nameTh);
    console.log('   Role:', role);
    console.log('   Password:', password);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addAdmin();

