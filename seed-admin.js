require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");
const Class = require("./models/Class");

async function seedAdmin() {
  try {
    console.log("🔌 Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to database\n");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("⚠️  An admin already exists:");
      console.log(`   Email: ${existingAdmin.email}`);
      console.log("   If you want to create a new one, delete the existing admin first.\n");
      process.exit(0);
    }

    // Create admin credentials
    const adminData = {
      fullname: "Super Admin",
      email: "admin@example.com",
      phone: "08012345678",
      password: await bcrypt.hash("admin123", 10),
      role: "admin",
      status: "active",
      mustChangePassword: false,
    };

    const admin = await User.create(adminData);

    console.log("✅ Admin account created successfully!\n");
    console.log("📋 Login Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`   Email:    ${adminData.email}`);
    console.log(`   Password: admin123`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Clean up orphaned classTeacher references
    console.log("🧹 Cleaning up orphaned class teacher references...");
    const classesWithOrphanedTeachers = await Class.find({
      classTeacher: { $ne: null },
    });

    let cleanedCount = 0;
    for (const cls of classesWithOrphanedTeachers) {
      const teacherExists = await User.findById(cls.classTeacher);
      if (!teacherExists) {
        cls.classTeacher = null;
        await cls.save();
        console.log(`   ✅ Cleared orphaned teacher from class: ${cls.className}`);
        cleanedCount++;
      }
    }

    if (cleanedCount === 0) {
      console.log("   ✅ No orphaned references found.");
    } else {
      console.log(`\n   Total cleaned: ${cleanedCount} class(es)`);
    }

    console.log("\n🎉 You can now log in with the credentials above!");
    console.log("⚠️  Remember: You'll need to recreate teachers and re-assign class teachers via the Admin UI.\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

seedAdmin();