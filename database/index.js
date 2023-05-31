module.exports.init = function(){
  const mongoose = require('mongoose');
  mongoose.connect('mongodb+srv://root:root@cluster0.6oktd.mongodb.net/Ecommerce?retryWrites=true&w=majority')
  .then(function(){
    console.log("db connection done")
  }).catch(function(){
    console.log("error in db connection")
  }) 
}