const mongoose = require("mongoose");


const cartSchema = new mongoose.Schema({
  name:{
    type : String,
    reqired : true
  },
  isNeed:{
    type : Boolean,
    default : true
  },
  user_id:{
    type: String,
    required : true
  },
  quantity:{
    type: Number,
    default : 1
  },
  price:{
    type: String,
    required: true
  },
  pic:{
    type : String,
    required: true
  },
  prod_id:{
    type: String,
   required: true
  }
},
{timestamps : true}
);

const cartModel = mongoose.model("cart",cartSchema);
module.exports = cartModel;
