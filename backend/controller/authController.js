const Joi = require ('joi');
const User = require ('../models/user');
const bcrypt = require('bcryptjs');
const UserDTO = require('../dto/user'); 
const JWTService = require('../services/JWTService');
const RefreshToken = require('../models/token');

//const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8-25}$/;
const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,25}/;

const authController = {
    async register(req,res,next){
        //1. validate user input                            validate email password acc to constraint  via joi
            const userRegisterSchema = Joi.object({
                username : Joi.string().min(5).max(30).required(),
                name : Joi.string().max(30).required(),
                email : Joi.string().email().required(),
                //password : Joi.string().min(5).max(30).required(),
                password : Joi.string().pattern(passwordPattern).required(),
                confirmPassword : Joi.ref('password')
            });
                            
            const {error} = userRegisterSchema.validate(req.body);      // this error from joi which has object type validation               
            
            //2. if error in validation                         return error via middleware
            if(error){
                return next(error);
            }      
            
            //3. if email or username is already registered     return an error
            
            const {username, name, email, password } = req.body;
            try{
                const emailInUse = await User.exists({email});
                const usernameInUse = await User.exists({username});

                if(emailInUse){
                    const error = {
                        status : 409,
                        message : 'Email already registered. Use another email ! '
                    }
                    return next(error);
                }
                if(usernameInUse){
                    const error = {
                        status : 409,
                        message : 'Usernmame already registered, Use Another email !'
                    }
                    return next(error);
                }
            }
            catch(error)
            {
                return next(error);
            }

        
            //4. password hash
            
            // 123abc ->   abxbjsbcue2434jbas@!#@!   storing in hash it is irreverisible so match hash

            const hashedPassword = await bcrypt.hash(password,10);    // after sort 10 more random string add
            
        //5. store user data in database

            let accessToken;
            let refreshToken;

            let user;
            try{
                const userToRegister = new User ({
                    username ,
                    email ,
                    name , 
                    password : hashedPassword
                });

                user = await userToRegister.save();

                // token generation     dto ko dekh ke user ke 2 cheezein rakh lete payload mai or time 30m
                // then  decode karke dekhein ge yehi information aa rahi hai
                // galat likh diya accessToken = JWTService.signAccessToken({_id:user._id, username:user.email}, '30m');
                // ab decode karne mai jwt.io pe dubugger se hamei username bhi mile ga
                // accessToken = JWTService.signAccessToken({_id:user._id, username:user.username}, '30m');
                // consistent karne ke liye access or refresh token ko username remove kar dete
                accessToken = JWTService.signAccessToken({_id:user._id}, '30m');

                refreshToken = JWTService.signRefreshToken({_id : user._id}, '60m');
                //ab ye token aa gye ab inko client side pe bhejna cookies mai
            }
            catch(error){
                return next (error);
            }
            
            // store refresh token in db
            await JWTService.storeRefreshToken(refreshToken,user._id)
            // send token in cookie

            res.cookie('accessToken', accessToken,{
                maxAge : 1000*60*60*24,
                httpOnly : true

            });

            res.cookie('refreshToken', refreshToken,{
                maxAge : 1000*60*60*24,
                httpOnly : true
            });

        //6. reponse send to user
            
            const userDto = new UserDTO(user)

            //return res.status(201).json({user : user});
            // return res.status(201).json({user : userDto});
            // ab response mai aik or cheeze add kar dete
            return res.status(201).json({user : userDto, auth : true});
            // ye tab samjh aye gi jab frontend mai protected routes pe kam kareinge

    },
       
    async login(req, res, next){
        
        //1 validate user input
        //2 if validation error, return error
        //3 match username and password
        //return response
        const userLoginSchema = Joi.object({
            username : Joi.string().min(5).max(30).required(),
            password : Joi.string().pattern(passwordPattern)            
        });

        const {error} = userLoginSchema.validate(req.body);

        if(error){
            return next(error);
        }
        let user;
        const {username , password} = req.body;
        //const username = req.body.username;
        //const password = req.body.password;

        try{
            user = await User.findOne({username : username});     //User usercollection model 
             
            //user is object which store and return response like we get response from mongodb in insomnia 

            if(!user){
                const error = {
                    status : 401,
                    message : 'Invalid username or password'
                }
                return next (error);
            }

            //match password
            // req.body.password -> hash -> match

            const match = await bcrypt.compare(password,user.password);
            if(!match){
                const error ={
                    status : 401,
                    message : 'Invalid password'
                }
                return next(error);
            }
        }

        catch(error){
            return next(error);
        }

        const accessToken = JWTService.signAccessToken({_id:user._id}, '30m');

        const refreshToken = JWTService.signRefreshToken({_id:user._id},'60m');

        // oper registartion mai yaha store refreshToken in db kiya tha ab update kare ge
        // update refresh token in db kyu ke agar pehle nhi hai tou aik new entry bna dein ge
        // iske liye pehle import model 

        try{
            RefreshToken.updateOne({
                _id: user._id
            },
              {token : refreshToken},
              {upsert : true}
            )
        }
        catch(error){
            return next(error);
        }

        res.cookie('accessToken', accessToken,{
            maxAge : 1000*60*60*24,
            httpOnly : true
        });

        res.cookie('refreshToken', refreshToken,{
            maxAge : 1000*60*60*24,
            httpOnly : true
        });

        const userDto = new UserDTO(user); // ye jo neeche user pass kiya wo ab isme pass kardein ge
        //return res.status(200).json({user:user});   //user key matlb user ka model ya nhi its a key as like middleware mai json(data) tou yaha json(user)bhi ho skta jo return kare ga jo humhei data mile ga user variable mai from database jo db ka username hamare username se match kare ga or user variable jisme sara data tha
        // return res.status(200).json({user: userDto});
        return res.status(200).json({user: userDto, auth : true});
    },

    async logout (req, res, next){

        //console.log(req);


        //1 delete refresh token from db
        //2 response  or is response se frontend mai pta chal jaye ke user unauthorized hai
        // at very first refresh token cookie mai se aa rha usse lete destructure karte

        const{refreshToken} = req.cookies;
        // yaha cookies mai s is liye kyu ke insomnia mai cookies hai or ussi ki key use hogi accessToken jesi waha
        try{
            await RefreshToken.deleteOne({token : refreshToken});   // jaha token ki value refreshToken se match kare waha delete
        }
        catch(error){
            return next(error);
        }


        // delete cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        // response
        res.status(200).json({user:null, auth : false});  // pehle user mai pora object bhej rhe the an null
    },

    async refresh(req,res,next){
        //1 get refreshToken from cookies
        // verify refresh Token
        // generate new tokens
        //update db, return response

        const originalRefreshToken = req.cookies.refreshToken;
        // OR      const {refreshToken} = req.cookies;

        //now using JWTService to verify 

        let id;
        try{
            id = JWTService.verifyRefreshToken(originalRefreshToken)._id;
        }
        catch(e){
            const error = {
                status : 401,
                message : 'Unauthorized'
            }
            return next(error)
        }
        
        //pehle refresh token liya cookies mai se phir id li verifyRefreshToken jo object dega usme se phir match

        try{
            const match = RefreshToken.findOne({_id:id, token : originalRefreshToken});
            if(!match){
                const error = {
                    status : 401,
                    meesage : 'Unauthorized'
                }
                return next(error);
            }

        }
        catch(e){
            return next(e);
        }

        // ab new token generate karein ge
        try{
            const accessToken = JWTService.signAccessToken({_id:id}, '30m');
            const refreshToken = JWTService.signRefreshToken({_id:id},'60m');

            // ab update karein ge db mai
            await RefreshToken.updateOne({_id:id},{token:refreshToken});    //token ki field mai refreshToken

            // ab cookies mai set karate
            res.cookie('accessToken',accessToken,{
                maxAge : 1000*60*60*24,
                httpOnly : true
            })

            res.cookie('refreshToken',refreshToken,{
                maxAge : 1000*60*60*24,
                httpOnly : true
            });
        }
        catch(e){
            return next (e);
        }

        // ab response mai user ki detail send kar dete uske liye first user ki details lete User ke model mai find
        const user = await User.findOne({_id : id});
        //aik dto bana lete wo pass karein ge
        const userDto = new UserDTO(user);

        return res.status(200).json({user:userDto, auth: true});
    }
}

module.exports = authController;


// 4 auth Controller the    register login logout refresh
