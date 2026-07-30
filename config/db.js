const mongoose = require('mongoose');
const connectDB = async ()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URI)
            console.log("MongoDB Connected Successfully")
        
    }catch(err){
        console.error("MongoDB Connection Failed", err.message)
        process.exit(1)
    }
}
module.exports = connectDB;
// const mongoose = require("mongoose");
// const dns = require("dns");

// dns.setServers(["8.8.8.8", "8.8.4.4"]);

// const connectDB = async () => {
//   console.log("DNS Servers:", dns.getServers());

//   try {
//     await mongoose.connect(process.env.MONGODB_URI);
//     console.log("MongoDB Connected Successfully");
//   } catch (err) {
//     console.error("MongoDB Connection Failed");
//     console.error(err);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;