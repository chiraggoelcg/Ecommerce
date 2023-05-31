const mongoose = require("mongoose");


const userSchema = new mongoose.Schema({
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

const userModel = mongoose.model("user",userSchema);
module.exports = userModel;
