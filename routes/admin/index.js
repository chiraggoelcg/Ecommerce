const express = require('express')
const adminModel = require('../../database/models/admin');
const multer  = require('multer');
const router = express.Router()
const mailjet = require('node-mailjet');
const sendMail = require("../../utils/sendMail");
const session = require('express-session');

// const { append } = require('express/lib/response')



//multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'adminUploads')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix)
    }
})

const upload = multer({ storage: storage })


function adminModelFindOne(email,pass,callback){
	adminModel.findOne({email:email,password:pass},function(err,user){
		if(err){
			callback(err,null);
		}
		else{
			callback(null,user);
		}
	})
}


//root path
router.get('/', (req, res) => {
	if(req.session.isLoggedIn && req.session.role === "admin"){
		res.render("adminIndex",{user:req.session.user,product:[]});
	}
	else{
		console.log("isme bhi aagya");
		res.redirect("/");
	}
})


//login
router.route("/login").get(function(req,res){
    // console.log("admin login get")
	res.render("adminLogin",{error:"",flag:false})
}).post(function(req,res){
    // console.log("admin login post")

	var email = req.body.email;
	var password = req.body.password;
    console.log(req.body)
	if(!email){
		res.render("adminLogin",{error:"Please enter Username",flag:false});
		return;
	}
	else if(!password){
		res.render("adminLogin",{error:"Please enter password",flag:false});
		return;
	}

	adminModelFindOne(email,password,function(err,user){
        // console.log(err,user)
		if(err){
			res.render("adminLogin",{error:"Error Occured",flag:false});
			return;
		}
		else if(!user){
			res.render("adminLogin",{error:"Login credentials not matched",flag:false});
			return;
		}
		else if(!user.isMailVerified){
			res.render("adminLogin",{error:"Please tell admin to verify account first",flag:false});
			return;
		}
		else{
			console.log(user,"kjdbfewbf");
			req.session.isLoggedIn = true;
			req.session.user = user;
			req.session.role = "admin";
			res.redirect("./");
		}
	})
})

//logout
router.get("/logout",(req,res)=>{
	console.log("admin mai aa gya")
	req.session.isLoggedIn = false;
	res.redirect("/");
})

//admin signup
router.route("/signup").get(function(req,res){
	res.render("adminSignup",{error :""});
}).post(upload.single("Profile_Pic") , function(req,res){
	var username = req.body.username;
	var email = req.body.email;
	var password = req.body.password;
	var file = req.file;
	console.log(req.body);
	if(!username)
	{
		res.render("adminSignup",{ error: "Please enter username" });
		return
	}
	else if(!email)
	{
		res.render("adminSignup",{ error: "Please enter email" });
		return
	}
    else if(!password)
	{
		res.render("adminSignup",{ error: "Please enter password" });
		return
	}
    else if(!file)
	{
		res.render("adminSignup",{ error: "sayad profile pic bhul gye app" });
		return
	}
	adminModel.findOne({email:email},function(err,data){
		if(err){
            console.log(err);
			res.render("adminSignup",{ error: "error occured" });
			return
		}
		if(data){
			res.render("adminSignup",{ error: "Email Id already exists" });
			return
		}
		else{
			adminModel.create({ 
				username: username,
				email : email,
				password: password,
				profile_pic: file.filename,
				isMailVerified : false
			})
			.then(function(updateUser)
			{
				var html = '<h1>Tell admin to verify your id</h1>'
				//sendMail through mailjet
				sendMail(
					email, 
					'Signup Successful', 
					"Tell admin to verify for proceed further",
					html,
					function(error,data)
					{
						if(error)
						{
							// do error handling
							res.render("adminSignup",{ error: "Unable to send email but account create successfully" });
						}
						else
						{
							res.redirect("./login");
						}
					}
				)
			})
			.catch(function(){
				res.render("adminSignup",{error :"error occured"})
			})
		}
	})
	// console.log(username,password,file);
})


// router.route("/forgot")
// .get((req,res)=>{
//     res.render("adminForgotPass",{error:""});
// })
// .post((req,res)=>{
//     console.log(req.body);
//     res.send("aagya ")
// })

//forgot password
router.route("/forgot").get(function(req,res){
	// req.session.page = 0;
	res.render("adminForgotPass",{error:""});
}).post(function(req,res){

	var email = req.body.email;
	adminModel.findOne({email:email},function(err,data){
		if(err){
			res.render("adminForgotPass",{error:err});
		}
		else if(!data){
			res.render("adminForgotPass",{error:"Email doesn't exists"});
		}
		else{
			var html = '<h1>click here to Forgot Password</h1>'+
			'<a href="http://localhost:3000/admin/forgotPage/'+email+'">click here</a>'

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
						res.redirect("./login");
					}
				}
			)
		}
	})
})


//changePassword if user login already
router.route("/forgotPage/:email").get(function(req,res){
	// req.session.page = 0;
	res.render("adminChangePass",{error:"",email:req.params.email});
}).post(function(req,res){
	var email = req.params.email;
	var newPass = req.body.newPassword;
	var confPass = req.body.confPassword;
	console.log(newPass,confPass);
	if(newPass !== confPass){
		res.render("adminChangePass",{error:'Password not matched',email:email});
		return;
	}
	adminModel.findOneAndUpdate({email:email},{password:newPass},null,function(err,data){
		if(err){
			res.render("adminChangePass",{error:'Error Occured while changing password. Please try again later!',email:email});
			return
		}
		else{
			var html = '<h1>click here to </h1>'+
			'<a href="http://localhost:3000/admin/login"> Login</a>'

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
						res.render("adminChangePass",{ error: "Unable to update password.Please try again in some time." });
					}
					else
					{
						res.redirect("./../login");
					}
				}
			)
		}
	})
})


module.exports = router