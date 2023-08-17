const Joi = require('joi');
const fs = require('fs');
const Blog = require('../models/blog');
const {BACKEND_SERVER_PATH} = require('../config/index');
const BlogDTO = require('../dto/blog');
const BlogDetailsDTO = require('../dto/blog-details');
const Comment = require('../models/comment');

const mongodbIdPattern = /^[0-9a-fA-F]{24}$/; 

const blogController = {
    //object ke andar methods honge
    async create(req, res,next){
        //1 validate req body
        //2 blog ke model ko dekhein tou we have title conent author string mai or photopath first locally store and their filename store in db
        //3 add to db
        //4 return response


        //validate jese pehle joi se kiya import joi createBlogSchema {error}ke object se validate  req ki body se sab lein ge
        const createBlogSchema = Joi.object({
            title : Joi.string().required(),
            author : Joi.string().regex(mongodbIdPattern).required(),
            content : Joi.string().required(),
            photo : Joi.string().required()   //client side se base 64 string bheje ge backend mai decode karein ge then store then their location name save db photopath
        });

        const {error} = createBlogSchema.validate(req.body);

        if(error){
            return next(error);
        }

        const{title, author, content, photo} = req.body;

        //handle photo in few steps
        //read as buffer     
        //allot a random name
        //save locally

        // sab se pehle nodejs ke buffer mai read karein ge

       // const buffer = Buffer.from(photo.replace(/^data:image\/(png|jpg|jpeg);
       // base64,/,''), 'base64');
       //const buffer = Buffer.from(photo.replace(), 'base64')  replace karke matlb is part ko remove karke base 64 string se then read buffer.from or 'base64' iski encoding pas kardi
        const buffer = Buffer.from(photo.replace(/^data:image\/(png|jpg|jpeg);base64,/,''), 'base64');

        //allot random name
        //const imagePath = `${Date.now()}-${author}`;
        const imagePath = `${Date.now()}-${author}.png`;       //${}-${}  timestamp or author ki id se unique name aa jaye ga

        //save locally  iske liye folder banana pare ga or fs ka buildin module import
        try{
            fs.writeFileSync(`storage/${imagePath}`,buffer);  // path ke baad buffer pas kar dein ge
        }
        catch(error){
            return next(error);
        }

        //save blog in db   iske liye model import blog ka
        let newBlog;
        try{
            //const newBlog = new Blog({    iski jaga oper ler newBlog is liye insomnia not getting data

            newBlog = new Blog({
                title,
                author,
                content,
                photoPath : `${BACKEND_SERVER_PATH}/storage/${imagePath}`        //env mai jake aik new variable set karte config mai import yaha import
            });

            await newBlog.save()
        }
        catch(error){
            return next(error);
        }

        //res.status(201).json({blog});
        //dto bana liya blog ab oper import karte
        const blogDto = new BlogDTO(newBlog);
        //res.status(201).json({blog:blogDto});
        return res.status(201).json({blog:blogDto});



    },
    async getAll(req, res,next){
        //validation nhi karni kyu ke request ki body mai no data send
        //blog ke model mai find ka method run karein or empty filter pass karein tou we get all data
        try{
            const blogs = await Blog.find({});
            //ab dto ki  form mai lane ke for loop aik blodDto ki array
            const blogsDto = [];
            for(let i=0 ; i<blogs.length ;i++)
            {
                //aik object aik dto lete hain
                const dto = new BlogDTO(blogs[i]);
                blogsDto.push(dto);
            }
            return res.status(200).json({blogs : blogsDto});
        }
        catch(error){
            return next(error);
        }
    },
    async getById(req, res,next){
        //paramete mai id pass karein ge or wo sari datail la dega
        //validate id
        //response set 

        // yaha aik or schema banate joi ka aik object or id pass karate as mongodbpattern
        const getByIdSchema = Joi.object({
            id : Joi.string().regex(mongodbIdPattern).required()
        });

        // ab validate karate
        const {error} = getByIdSchema.validate(req.params);
        if(error)
        {
            return next(error);
        }

        // ab response set karate
        let blog;
        
        const {id} = req.params;
        try{
            blog = await Blog.findOne({_id : id}).populate('author');
        }
        catch(error){
            return next(error);
        }
        //const blogDto = new BlogDTO(blog);
        //return res.status(200).json({blog: blogDto});
        //return res.status(200).json({blog: blog}); 
        
        //ye blog =  ke liye aik alag dto bana lete
        //oper import BlogDetailsDTO
        const blogDto = new BlogDetailsDTO(blog);
        return res.status(200).json({blog : blogDto}); 

        },
    async update(req, res, next){
        //validate req body
        // if photo update then prev photo delete and if title content ko sirf update karna tou photo ko nhi delete

        const updateBlogSchema = Joi.object({
            title : Joi.string().required(),
            content : Joi.string().required(),
            author : Joi.string().regex(mongodbIdPattern).required(),
            blogId : Joi.string().regex(mongodbIdPattern).required(),
            photo : Joi.string() 
        });
        // agar base64 encoded string photo mai update nhi kar rhe tou res ki body mai add nhi kareinge
        //Mongodb khud optimal tareke se handle karle ga agar update wale or porane stored data mai no diff

        const{error} = updateBlogSchema.validate(req.body);
    
        const{title, content, author, blogId, photo} = req.body;

        let blog;
        try{
            blog = await Blog.findOne({_id:blogId});
        }
        catch(error){
            return next(error);
        }

        
        // now check if photo update 
        // prev photo delete 
        // save new photo

        // ab check karte req ki body mai photo send kar rhe tou null nhi hogi agar nhi tou null hogi
        if(photo){
            let previousPhoto = blog.photoPath;   // prev photo ka path blog ke object se nikal skte
            // jo blog ka object hai jo aik record hai mongodb ki collection mai tou usme photopath mil jaye ga usko yaha se access karke delete karskte
            //split karein ge backslash pe or character chaheye last index pe -1 ke through access kar skte ab file ka nam aa jaye ga
            //previousPhoto.split('/').at(-1);
            previousPhoto = previousPhoto.split('/').at(-1);

            
            // ab delete photo
            fs.unlinkSync(`storage/${previousPhoto}`);



            //ab new photo store buffer mai tou wapis create wale method mai dekhte random name diya through image path uske fs.write se save yehi step copy and paste here

            //paste 
            //const buffer = Buffer.from(photo.replace(), 'base64')  replace karke matlb is part ko remove karke base 64 string se then read buffer.from or 'base64' iski encoding pas kardi
             const buffer = Buffer.from(photo.replace(/^data:image\/(png|jpg|jpeg);base64,/,''), 'base64');

            //allot random name
            //const imagePath = `${Date.now()}-${author}`;
            const imagePath = `${Date.now()}-${author}.png`;       //${}-${}  timestamp or author ki id se unique name aa jaye ga

            //save locally  iske liye folder banana pare ga or fs ka buildin module import
            try{
                fs.writeFileSync(`storage/${imagePath}`,buffer);  // path ke baad buffer pas kar dein ge
            }
            catch(error){
                return next(error);
            }

            // ab bog ko update
            await Blog.updateOne({_id: blogId}, {title, content, photoPath: `${BACKEND_SERVER_PATH}/storage/${imagePath}`});
        }

        else{
            await Blog.updateOne({_id : blogId}, {title,content});
        }

        return res.status(200).json({message : 'blog updated! '});

    },
    async delete(req, res,next){
        //validate id
        //delete blog
        //delete comments

        const deleteBlogSchema = Joi.object({
            id : Joi.string().regex(mongodbIdPattern).required()
        });

        const {error} = deleteBlogSchema.validate(req.params);
        const {id} = req.params;

        try{
            await Blog.deleteOne({_id : id});
            //comment ko delete karna aik blog mai bohot sare comment bhi ho skte comment model import
            await Comment.deleteMany({blog:id});
        }
        catch(error){
            return next(error);
        }
        return res.status(200).json({message: 'blog deleted'});
    }
}

module.exports = blogController;