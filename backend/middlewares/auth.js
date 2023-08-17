const JWTService = require('../services/JWTService');
const User = require('../models/user');
const UserDTO = require('../dto/user');

const auth = async (req,res,next) => {

    try{
        // access refresh token validate karwae ge
    const{refreshToken, accessToken} = req.cookies;        // cookies mai se access kiya inko

    if(!refreshToken || !accessToken){              //dono mai se koi aik null tou
        const error = { 
            status : 401,
            message : 'unauthorized'
        }
        return next(error)
    }

    // abhi tak check kiya null tou nhi ab verify karein ge access token ko uske liye import JWTService

    // JWTService.verifyAccessToken(accessToken)
    // verify access token mai payload le rhe sign karate waqt payload mai only id hai
    let _id;
    try{
        _id = JWTService.verifyAccessToken(accessToken);
        // this should be    
        //JWTService.verifyAccessToken[accessToken]._id;   
        // id ko destructure karein ge id lein ge isme se
        // ab is id ki base pe user ka data find karein ge tou demo purpose ke liye user model or dto import
    }
    catch(error){
        return next (error);
    }

    let user;
    try{
        // yaha await use karne ke liye auth function ko async karna hoga
        user =  await User.findOne({_id : _id});
    }

    // jese controller mai dto banaya tha wese he yaha pe aa jaye ga
    // const userDto = new UserDTO(user);
    catch(error){
        return next(error);
    }

    const userDto = new UserDTO(user);

    //kyu ke hum middleware mai hai ye aesa function hai jo req or res ke complete hone pe run hoga

    req.user = userDto;      // req ke object ki access parameter se function logout ke

    next();    // next middleware call

    }
    catch(error){
        return next(error);
    }



}

    module.exports = auth;



