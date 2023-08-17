const jwt = require('jsonwebtoken');
const{ACCESS_TOKEN_SECRET , REFRESH_TOKEN_SECRET } = require('../config/index');
const RefreshToken = require('../models/token');

class JWTService{
    // kuch tokens honge 
    // sign access token
    // sign refresh token
    // verify refresh token 
    // store refresh token

    //sign access token ko define karke sath parameter define karte jo chaheye
    static signAccessToken(payload, expiryTime){
        return jwt.sign(payload,ACCESS_TOKEN_SECRET,{expiresIn : expiryTime});
    }

    //sign refresh token
    static signRefreshToken(payload, expiryTime){
        return jwt.sign(payload,REFRESH_TOKEN_SECRET,{expiresIn : expiryTime});
    }

    // now we need secret key so when we install node we get crypto package by default. Now in terminal
    // node enter -> const crypto = require('crypto') -> crypto.randomBytes(64).toString('hex')
    // from here we get access secret key and again crypto.randomBytes----- to get refresh token secret

    //verift access token         parameter mai wo token jo user ki taraf se mil rha
    static verifyAccessToken(token){
            return jwt.verify(token, ACCESS_TOKEN_SECRET);
    }

    // verify refresh token
    static verifyRefreshToken(token){
        return jwt.verify(token,REFRESH_TOKEN_SECRET);
    }

    // store refresh Token   
    static async storeRefreshToken(token,userId){
        try{
            const newToken = new RefreshToken({
                token : token,
                userId : userId
            });
            await newToken.save();
        }
        catch(error){

            console.log(error);
        }
    }


}

module.exports = JWTService;