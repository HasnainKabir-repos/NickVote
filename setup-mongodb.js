import { seedDataFromExcel } from "./lib/mongodb.js";
async function setup() {
  try {
    console.log('Setting up MongoDB database...');
    console.log('Note: Make sure MongoDB is running on your system');
    console.log('Default connection: mongodb://localhost:27017/nickname-voting');
    console.log('');

    await seedDataFromExcel('./students.xlsx', './pass.xlsx');
    console.log('MongoDB database setup completed successfully!');
    console.log('\nDemo credentials:');
    console.log('Student: student1 / pass1');
    console.log('Admin: admin / admin123');
    console.log('\nYou can now start the application with: npm run dev');
    process.exit(0);
  } catch (error) {
    console.error('Setup failed:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure MongoDB is installed and running');
    console.log('2. Check if MongoDB is accessible at url');
    console.log('3. You can set a custom MongoDB URI with: MONGODB_URI=your-connection-string');
    process.exit(1);
  }
}

setup();

