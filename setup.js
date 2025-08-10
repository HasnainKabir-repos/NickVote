const { seedData } = require('./lib/database');

async function setup() {
  try {
    console.log('Setting up database...');
    await seedData();
    console.log('Database setup completed successfully!');
    console.log('\nDemo credentials:');
    console.log('Student: student1 / pass1');
    console.log('Admin: admin / admin123');
    process.exit(0);
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

setup();

