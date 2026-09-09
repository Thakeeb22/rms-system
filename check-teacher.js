require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Class = require("./models/Class");

async function checkAndFixTeacher() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to database\n");

    // Find Mrs. Rahina Yahya
    const teacher = await User.findById("6a8c641b3df03d2f2fe68cfa");
    
    if (!teacher) {
      console.log("❌ Teacher not found!");
      process.exit(1);
    }

    console.log("📋 Current Teacher Data:");
    console.log(`   Name: ${teacher.fullname}`);
    console.log(`   Email: ${teacher.email}`);
    console.log(`   Role: ${teacher.role}`);
    console.log(`   assignedClass: ${teacher.assignedClass || "NULL"}`);
    console.log();

    // Find JSS2 class
    const jss2 = await Class.findOne({ className: "JSS2" });
    
    if (!jss2) {
      console.log("❌ JSS2 class not found!");
      process.exit(1);
    }

    console.log("📋 JSS2 Class Data:");
    console.log(`   Class ID: ${jss2._id}`);
    console.log(`   Class Name: ${jss2.className}`);
    console.log(`   classTeacher: ${jss2.classTeacher || "NULL"}`);
    console.log();

    // Check if they match
    const isAssignedCorrectly = teacher.assignedClass && 
                                 teacher.assignedClass.toString() === jss2._id.toString();
    const isClassTeacherSet = jss2.classTeacher && 
                               jss2.classTeacher.toString() === teacher._id.toString();

    console.log("🔍 Status Check:");
    console.log(`   Teacher.assignedClass points to JSS2: ${isAssignedCorrectly ? "✅ YES" : "❌ NO"}`);
    console.log(`   JSS2.classTeacher points to teacher: ${isClassTeacherSet ? "✅ YES" : "❌ NO"}`);
    console.log();

    // Fix if needed
    if (!isAssignedCorrectly || !isClassTeacherSet) {
      console.log("🔧 Fixing the assignment...");
      
      teacher.assignedClass = jss2._id;
      await teacher.save();
      console.log("✅ Updated teacher.assignedClass to JSS2");

      jss2.classTeacher = teacher._id;
      await jss2.save();
      console.log("✅ Updated JSS2.classTeacher to Mrs. Rahina Yahya");

      console.log("\n✅ Fix complete! The teacher should now see JSS2 on their dashboard.");
    } else {
      console.log("✅ Everything is already set correctly!");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkAndFixTeacher();