const Joi = require('joi');
const Comment = require('../models/comment');
const DTO = require('../dto/comment');
const CommentDTO = require('../dto/comment');

const mongodbIdPattern = /^[0-9a-fA-F]{24}$/; 
//sab se pehle commentController ka object bana ke usme function likh ke export karke routes mai import 
//then joi ko import then schema banana acc to model


const commentController = {
    async create(req, res, next){
        const createCommentSchema = Joi.object({
            content : Joi.string().required(),
            author : Joi.string().regex(mongodbIdPattern).required(),
            blog : Joi.string().regex(mongodbIdPattern).required()
        });

        const {error} = createCommentSchema.validate(req.body);
        if(error){
            return next(error);
        }

        const {content, author, blog} = req.body;

        //now save in try catch
        try{
            const newComment = new Comment({
                content,author,blog
            });

            await newComment.save();
        }
        catch(error){
            return next(error);
        }

        return res.status(200).json({message : 'comment created'});

    },

    async getById(req, res, next){
        
        const getByIdSchema = Joi.object({
            id : Joi.string().regex(mongodbIdPattern).required()
            });

        const {error} = getByIdSchema.validate(req.params);

        if(error){
            return next(error);
        }

        const {id} = req.params;

        let comments;
        try{
            //comments = await Comment.find({blog : id});
            comments = await Comment.find({blog : id}).populate('author');
            // ab aik dto bna lete comment.js isme comment ka model pas karein ge constructor mai oper import
        }
        catch(error){
            return next(error);
        }

        let commentsDTO = [];
        for(let i=0 ; i<comments.length ; i++){
            const obj = new CommentDTO(comments[i]);    //bas ye yaad rakho dto claas name mai jo find kiya comment variable mai wo variable pass karna

            commentsDTO.push(obj);
        }

        //return res.status(200).json({data:comments});
        return res.status(200).json({data:commentsDTO});
    }
}

module.exports = commentController;


