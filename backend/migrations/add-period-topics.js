// Migration: Add period_topics table and cleanup
// Created: 2025-11-20

const db = require('../db/knex');

async function up() {
  console.log('🚀 Starting migration: add-period-topics...');

  // 1. สร้างตาราง period_topics
  console.log('📝 Creating period_topics table...');

  const tableExists = await db.schema.hasTable('period_topics');
  if (!tableExists) {
    await db.schema.createTable('period_topics', (table) => {
      table.bigInteger('period_id').unsigned().notNullable();
      table.bigInteger('topic_id').unsigned().notNullable();
      table.timestamp('created_at').defaultTo(db.fn.now());

      table.primary(['period_id', 'topic_id']);

      table.foreign('period_id').references('id').inTable('evaluation_periods')
        .onDelete('CASCADE').onUpdate('CASCADE');
      table.foreign('topic_id').references('id').inTable('evaluation_topics')
        .onDelete('CASCADE').onUpdate('CASCADE');
    });
    console.log('✅ period_topics table created');
  } else {
    console.log('⚠️  period_topics table already exists, skipping...');
  }

  // 2. Populate ข้อมูล - ผูกทุก period กับทุก topic
  console.log('📝 Populating period_topics...');

  const periods = await db('evaluation_periods').select('id');
  const topics = await db('evaluation_topics').select('id');

  const links = [];
  for (const period of periods) {
    for (const topic of topics) {
      links.push({
        period_id: period.id,
        topic_id: topic.id
      });
    }
  }

  if (links.length > 0) {
    // Insert ignore duplicates
    for (const link of links) {
      const exists = await db('period_topics')
        .where({ period_id: link.period_id, topic_id: link.topic_id })
        .first();

      if (!exists) {
        await db('period_topics').insert(link);
      }
    }
    console.log(`✅ Populated ${links.length} period-topic links`);
  }

  // 3. ทำความสะอาดตารางที่ไม่ได้ใช้ (Optional - ระวัง!)
  console.log('📝 Cleaning up unused tables...');

  try {
    // ลบ FK constraints ก่อน
    if (await db.schema.hasTable('departments')) {
      try {
        await db.schema.table('departments', (table) => {
          table.dropForeign('category_id', 'fk_dept_cat');
        });
      } catch (e) {
        console.log('⚠️  fk_dept_cat already removed or not exists');
      }

      try {
        await db.schema.table('departments', (table) => {
          table.dropForeign('org_group_id', 'fk_dept_org');
        });
      } catch (e) {
        console.log('⚠️  fk_dept_org already removed or not exists');
      }
    }

    // ลบตารางที่ไม่ได้ใช้
    const tablesToDrop = ['dept_fields', 'vocational_fields'];
    for (const tableName of tablesToDrop) {
      if (await db.schema.hasTable(tableName)) {
        await db.schema.dropTable(tableName);
        console.log(`✅ Dropped table: ${tableName}`);
      }
    }

    // ลบ org_groups (ต้อง SET NULL ก่อน)
    if (await db.schema.hasTable('users')) {
      await db('users').update({ org_group_id: null });
      console.log('✅ Set users.org_group_id to NULL');
    }

    if (await db.schema.hasTable('org_groups')) {
      await db.schema.dropTable('org_groups');
      console.log('✅ Dropped table: org_groups');
    }

    if (await db.schema.hasTable('vocational_categories')) {
      await db.schema.dropTable('vocational_categories');
      console.log('✅ Dropped table: vocational_categories');
    }

    // ปรับปรุง departments table
    if (await db.schema.hasTable('departments')) {
      const hasCategory = await db.schema.hasColumn('departments', 'category_id');
      const hasOrgGroup = await db.schema.hasColumn('departments', 'org_group_id');

      if (hasCategory || hasOrgGroup) {
        await db.schema.table('departments', (table) => {
          if (hasCategory) table.dropColumn('category_id');
          if (hasOrgGroup) table.dropColumn('org_group_id');
        });
        console.log('✅ Simplified departments table');
      }
    }
  } catch (error) {
    console.log('⚠️  Some cleanup steps failed (may already be done):', error.message);
  }

  console.log('✅ Migration completed successfully!');
}

async function down() {
  console.log('🔄 Rolling back migration: add-period-topics...');

  await db.schema.dropTableIfExists('period_topics');

  console.log('✅ Rollback completed');
}

// Run migration if called directly
if (require.main === module) {
  up()
    .then(() => {
      console.log('✅ Migration finished');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { up, down };
