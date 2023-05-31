const mongoose = require("mongoose");


const adminSchema = new mongoose.Schema({
  username:{
    type : String,
    reqired : true
  },
  email :
  {
    type : String,
    reqired : true
  },
  password:{
    type : String,
    reqired : true
  },
  profile_pic:{
    type : String,
    reqired : true
  },
  isMailVerified :{
    type : Boolean,
    reqired : true
  }
},
{timestamps : true}
);

const adminModel = mongoose.model("admin",adminSchema);
module.exports = adminModel;
