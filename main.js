const express = require('express');
const fs = require('fs');
const multer  = require('multer');
const db = require('./database');
const session = require('express-session');
const mailjet = require('node-mailjet');
const sendMail = require("./utils/sendMail");
const userModel = require('./database/models/user');
const cartModel = require('./database/models/cart.js');
const body_parser = require('body-parser');
const req = require('express/lib/request');
const adminRoutes = require("./routes/admin");
const { nextTick } = require('process');
const app = express();
const port = 3000

app.use(session({
	secret: 'bahut badhiya wala secert spice',
	resave: false,
	saveUninitialized: true,
  
}))
//for converting details in json and provide in req.body when we take data through form tag
app.use(express.urlencoded());
//for converting details in json and provide in req.body
app.use(express.json())

//admin routes
app.use("/admin",check,adminRoutes);
//setting ejs as default templating engine folder views
app.set("view engine", "ejs");
app.set("views",["adminViews","views"]);
// app.use("views","views");

function check(req,res,next){

	if(req.session.role !=="admin" && req.session.isLoggedIn){
		res.redirect("/");
		return;
	}
	next();
}


//connection with db
db.init();

//middlewares
app.use(express.static("public"));
app.use(express.static("uploads"));
app.use(express.static("products"));

//multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix)
  }
})

//session middleware


const upload = multer({ storage: storage })

//readfile from given path
function readF(path,callback){
	fs.readFile(path,"utf-8",(err,data)=>{
		if(err){
			callback(err,null)
		}
		else{
			callback(null,data)
		}
	})
}

//find products which is true in  cartmodel db by userid
function cartModell(userid,callback){
	cartModel.find({user_id:userid,isNeed:true},function(err,product){
		var prodId= [];
		if(!err){
			// console.log(product, typeof product );
			callback(null,product);
		}else{
			callback(err,null);
		}	
	});
}

//root path
app.get('/', (req, res) => {

	readF("./prod_desc.js",function(err,data){
		var user = {
			username :null,
			profile_pic:null,
			email:null
		};

		//error in reading prod file
		if(err){
			
			if(req.session.isLoggedIn){
				user = req.session.user;
			}
			res.render("index",{user:user,products:null,flag:false,added:[]});
			return;
		}
		else
		{
			req.session.page = 1;
			const products = JSON.parse(data);
			var temp = products.slice(0,5);
			//if user logged in already
			if(req.session.role ==="admin"){
				res.redirect("/admin");
				return;
			}	
			if(req.session.isLoggedIn ){
				user = req.session.user;

				//finding data in cart table db whose isNeed parameter true
				cartModell(req.session.user._id,(err,product)=>{
					if(product){
						// console.log(product,"dsfhudvhujdbvhju    ",product[0])
						var productId = [];
						//fetching out prod id's 
						product.forEach((prod)=>{
							productId.push(prod.prod_id);
						})
						res.render("index",{user: user,products:temp,flag:true,added:productId});
					}
					else{
					  res.render("index",{user: user,products:temp,flag:true,added:[]});

					}

				})
				
			}
			else{
				res.render("index",{user: user,products:temp,flag:true,added:[]});
			}

		}
	})

})


//details
app.get("/details",(req,res)=>{
	if(req.session.isLoggedIn){
		res.render("login",{flag:true,name:req.session.user.username,email:req.session.user.email,pic:req.session.user.profile_pic})
	}
	else{
		res.redirect("/");
	}
})

function userModelFindOne(email,pass,callback){
	userModel.findOne({email:email,password:pass},function(err,user){
		if(err){
			callback(err,null);
		}
		else{
			callback(null,user);
		}
	})
}

//login
app.route("/login").get(function(req,res){
	res.render("login",{error:"",flag:false})
}).post(function(req,res){
	// console.log("main.js aa gye tum")
	var email = req.body.email;
	var password = req.body.password;
	if(!email){
		res.render("login",{error:"Please enter Username",flag:false});
		return;
	}
	else if(!password){
		res.render("login",{error:"Please enter password",flag:false});
		return;
	}

	userModelFindOne(email,password,function(err,user){
		if(err){
			res.render("login",{error:"Error Occured",flag:false});
			return;
		}
		else if(!user){
			res.render("login",{error:"Login credentials not matched",flag:false});
			return;
		}
		else if(!user.isMailVerified){
			res.render("login",{error:"Check your Email.\nPlease verify account first",flag:false});
			return;
		}
		else{
			console.log(user);
			req.session.isLoggedIn = true;
			req.session.user = user;
			req.session.page = 0;
			res.redirect("/");
		}
	})
	// console.log(username,password);
})


//signup
app.route("/signup").get(function(req,res){
	res.render("signup",{error :""});
}).post(upload.single("Profile_Pic") , function(req,res){
	var username = req.body.username;
	var email = req.body.email;
	var password = req.body.password;
	var file = req.file;
	console.log(req.body);
	if(!username)
	{
		res.render("signup",{ error: "Please enter username" });
		return
	}
	else if(!email)
	{
		res.render("signup",{ error: "Please enter email" });
		return
	}
    else if(!password)
	{
		res.render("signup",{ error: "Please enter password" });
		return
	}
    else if(!file)
	{
		res.render("signup",{ error: "sayad profile pic bhul gye app" });
		return
	}
	userModel.findOne({email:email},function(err,data){
		if(err){
			res.render("signup",{ error: "error occured" });
			return
		}
		if(data){
			res.render("signup",{ error: "Email Id already exists" });
			return
		}
		else{
			userModel.create({ 
				username: username,
				email : email,
				password: password,
				profile_pic: file.filename,
				isMailVerified : false
			})
			.then(function(updateUser)
			{
				var html = '<h1>click here to verify</h1>'+
				'<a href="http://localhost:3000/verifyUser/'+email+'">click here</a>'
				//sendMail through mailjet
				sendMail(
					email, 
					'Signup Successful', 
					"Please click here to verify",
					html,
					function(error,data)
					{
						if(error)
						{
							// do error handling
							res.render("signup",{ error: "Unable to send email" });
						}
						else
						{
							res.redirect("/login");
						}
					}
				)
			})
			.catch(function(){
				res.render("signup",{error :"error occured"})
			})
		}
	})
	// console.log(username,password,file);
})



//verifyMail
app.route("/verifyUser/:email").get(function(req,res){
	const email = req.params.email;
	//finding email in user db and update verification
	userModel.findOneAndUpdate({email:email},{isMailVerified:true},null,function(err,data){
		if(err){
			// console.log(4444);
			res.send("error occured while verifying");
		}
		else if(data){
			console.log(data);
			req.session.isLoggedIn = true;
			req.session.user = data;
			req.session.page = 0;
			res.send(`<h1>Verified Successfully,${data.username}</h1><a href="/">Go To home page</a>`);
		}
		else{
			//if trying Unauthorized user 
			res.send("Please don't try to hack my site. Here, you only waste your time") ;
		}
	})
})


//logout
app.get("/logout",(req,res)=>{
	req.session.page = 0;
	req.session.isLoggedIn = false;
	res.redirect("/");
})


//loadmore 
app.get("/load",(req,res)=>{
	
	if(req.session.isLoggedIn){
		var value = req.session.page + 1;
		var user = req.session.user;
		readF("./prod_desc.js",(err,data)=>{
			if(err){
				res.render("index",{user:user,products:null,flag:false,added:[]});
				return;
			}
			else{
				var prodId = [];
				//finding data in cart table db whose isNeed parameter true
				cartModel.find({user_id:req.session.user._id,isNeed:true},function(err,product){

					if(!err){
						console.log(product, typeof product );
						product.forEach(function(prod){
							prodId.push(prod.prod_id)
						});
					}
					//parsing data
					const products = JSON.parse(data);
					if(value <= Math.ceil(products.length/5)){
						req.session.page = value;
						console.log(req.session.page,user.profile_pic)
						if(value*5 <= products.length){
							var temp = products.slice(0,value*5);
							res.render("index",{user: user,products:temp,flag:true,added:prodId});
						}
						else{
							var temp = products.slice(0,products.length);
							res.render("index",{user: user,products:temp,flag:false,added:prodId});
						}
						return;
					}
					else{
						console.log(req.session.page,user.profile_pic);
						var temp = products.slice(0,products.length);
						res.render("index",{user: user, products:temp,flag:false,added:prodId});
					}	
				// console.log()

				});
			}
		})

	}
	else{
		res.redirect("../login");
	}
})

//forgot password
app.route("/forgot").get(function(req,res){
	req.session.page = 0;
	res.render("forgot",{error:""});
}).post(function(req,res){

	var email = req.body.email;
	userModel.findOne({email:email},function(err,data){
		if(err){
			res.render("forgot",{error:err});
		}
		else if(!data){
			res.render("forgot",{error:"Email doesn't exists"});
		}
		else{
			var html = '<h1>click here to Forgot Password(Bhullakad Banda/Bandi)</h1>'+
			'<a href="https://e-commerce2-3p34g8mlwjl1xtwav2.codequotient.in/forgotPage/'+email+'">click here</a>'

			sendMail(
				email, 
				'forgot Password', 
				"Bhullakad Banda",
				html,
				function(error,data)
				{
					if(error)
					{
						// do error handling
						res.render("forgot",{ error: "Unable to send email.Please try again in some time." });
					}
					else
					{
						res.redirect("/login");
					}
				}
			)
		}
	})
})

//changePassword if user login already
app.route("/forgotPage/:email").get(function(req,res){
	req.session.page = 0;
	res.render("changePass",{error:"",email:req.params.email});
}).post(function(req,res){
	var email = req.params.email;
	var newPass = req.body.newPassword;
	var confPass = req.body.confPassword;
	console.log(newPass,confPass);
	if(newPass !== confPass){
		res.render("changePass",{error:'Password not matched',email:email});
		return;
	}
	userModel.findOneAndUpdate({email:email},{password:newPass},null,function(err,data){
		if(err){
			res.render("changePass",{error:'Error Occured while changing password. Please try again later!',email:email});
			return
		}
		else{
			var html = '<h1>click here to </h1>'+
			'<a href="https://e-commerce2-3p34g8mlwjl1xtwav2.codequotient.in/login"> Login</a>'

			sendMail(
				email, 
				'Password Change Successfully', 
				"Ab Password mat bhulna bhullakad!",
				html,
				function(error,data)
				{
					if(error)
					{
						// do error handling
						res.render("changePass",{ error: "Unable to update password.Please try again in some time." });
					}
					else
					{
						res.redirect("../login");
					}
				}
			)
		}
	})
})


//find and update
function finDbAndUp(id,uid,flag,callback){
	console.log(id);
	cartModel.findOneAndUpdate({prod_id:id,user_id:uid},{isNeed:flag},null,function(err,data){
		if(err){
			callback(err,null)
		}
		else{
			console.log("find db",err,data);
			callback(null,data);
		}
	})
}

//handling cart adding and removing on home page
app.route("/cart")
.post((req,res)=>{
	// console.log(req.body,req.session.user,req.session.isLoggedIn);
	if(req.session.isLoggedIn){
		// res.end("success");
		console.log(req.body);//id

		readF("./prod_desc.js",(err,data)=>{
			if(err){
				res.status(598).json({status:598,message:"Error occured while reading products"});
				return;
			}
			else{
				data = JSON.parse(data);
				const product_det = data.filter(function(product){
					return product._id === req.body.id;
				})
				console.log(product_det);

				//finding product is saved in cart db or not..
				cartModel.findOne({prod_id:product_det[0]._id,user_id:req.session.user._id},function(err,product){
					if(err){
						res.status(599).json({status:599,message:'Error occured in connection with db'});
						return;
					}
					else if(!product){
						cartModel.create({
							name: product_det[0].name ,
							price: product_det[0].price,
							pic: product_det[0].pic,
							user_id: req.session.user._id ,
							prod_id : product_det[0]._id
						})
						.then(function(product){
							console.log(product.prod_id)
							res.status(200).json({status:200,message:"successfully added"})
							// console.log(product)
							return;
							
						})
						.catch(function(err){
							console.log("error aa gyi shut yrr",err)
							res.status(599).json({status:599,message:"error in saving data in db"});
							return;
						})
					}
					else if(product.isNeed){
						//product._id is unique created by db itself
 						cartModel.findOneAndUpdate({_id:product._id},{isNeed:false},null,function(err,data){
							if(err){
								res.status(599).json({status:599,message:"error in updating data in db"})
								return;
							}
							else{
								console.log(product._id)
								res.status(200).json({status:200,message:"successfully updated"})
								return;
							}
						})
					}
					else{
						cartModel.findOneAndUpdate({_id:product._id},{isNeed:true},null,function(err,data){
							if(err){
								res.status(599).json({status:599,message:"error in updating data in db"})
								return;
							}
							else{
								console.log(product._id)
								res.status(200).json({status:200,message:"successfully added"})
								console.log(err,data)
								return;
							}
						})
					}

				})
			}
		})

	}
	else{
		console.log("agya mai yja")
		res.status(401).json({status : 401 ,message:"please login"});
	}
})

//handling popup description or view description
app.post("/desc",function(req,res){
	readF("./prod_desc.js",(err,data)=>{
		if(err){
			var Desc ={
				pic:null,
				desc:"Error occured while reading products"
			};
			res.status(598).json({status:400,message:Desc,isNeed:false});
			return;
		}
		else{
			data = JSON.parse(data)
			var Desc =  data.filter(function(p){
				return p._id == req.body.id;
			})
			//not login
			if(!req.session.isLoggedIn){
				res.status(401).json({status:401,message:Desc,isNeed:false});
				return;
			}
			else{
				var prod_id = req.body.id;
				var user_id = req.session.user._id;
				console.log(prod_id,user_id,"-------");
				cartModel.findOne({prod_id:prod_id,user_id:user_id},function(err,product){
					if(err){
						Desc.desc = "Error occured in connection with db";
						res.status(598).json({status:598,message:Desc,isNeed:false});4
						return;
					}
					else if(!product){
						console.log("-----11!!!!!!!!!!!!!",err,product)
						res.status(200).json({status:200,message:Desc,isNeed:false});
						return;
					}
					else {
						console.log("djchhdschudsbc",err,product)
						res.status(200).json({status:200,message:Desc,isNeed:product.isNeed});
						return;
					}
				})
			}
		}
	})
	
})

// ------------------------------------cartPageRequests------------------------------------------------------------

//cart
app.route("/cart").get((req,res)=>{
	user = null;
	if(req.session.isLoggedIn){
		var products = [];
		user  = req.session.user;
		// console.log(user);
		cartModell(req.session.user._id,(err,product)=>{

			if(product){
				product.forEach((ele)=>{					
					var prod = {
						_id : ele.prod_id,
						pic: ele.pic,
						name : ele.name,
						price: ele.price,
						qty: ele.quantity
					};
					products.push(prod);
				})
				// console.log(products);
				res.render("cart",{user: user,products:products,status:200});
			}
			else if(!product && !err){
				res.render("cart",{user:user,products:products,status:200})
			}
			else{
				// console.log("error",product,err);
			  	res.render("cart",{user: user,products:null,status:400});
	
			}
	
		})
	}
	else{
		res.render("login",{error:"",flag:false});
	}
})



//checkout amount 
app.post("/checkout",(req,res)=>{
	cartModell(req.session.user._id,(err,products)=>{
		if(err){
			res.status(598).json({status:598});
		}
		else{

			var total = 0;
			products.forEach((prod)=>{
				// console.log(prod," jsdghcjsdgjch ");
				var rs = prod.price.slice(1);
				//remove all ',' from amount fetched from db
				rs = parseInt(rs.replace(/,/g,''));
				// console.log(rs,prod.quantity)
				total += rs*prod.quantity;
			})
			res.status(200).json({status:200,total:total});

		}
	})
})

//remove product from cart
app.post("/status",(req,res)=>{
	var id = req.body.id;
	console.log(id,req.body)
	finDbAndUp(id,req.session.user._id,false,(err,data)=>{
		if(err){
			res.status(598).json({status:598,add:true});
		}
		else{
			// console.log(data);
			res.status(200).json({status:200,add:false});
		}
	})
})


//add and sub product quantity
app.post("/addMinus",(req,res)=>{
	var id = req.body.id;
	var qty = req.body.add;
	console.log(id,qty);
	cartModel.findOneAndUpdate({prod_id:id,user_id:req.session.user._id},{ $inc: { quantity: qty}},null,function(err,data){
		if(err){
			res.status(598).json({status:598})
		}
		else{
			console.log("find db",err,data);
			res.status(200).json({status:200})
		}
	})
})


app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`)
})
