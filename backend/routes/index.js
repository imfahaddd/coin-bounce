const express = require('express');
const authController = require('../controller/authController');
const commentController = require('../controller/commentController');
const auth = require('../middlewares/auth');
const blogController = require('../controller/blogController');


const router = express.Router();

//testing     app.get('/' , (req,res) => res.json({msg :'hello'})) for testing
//router.get('/test',(req,res) => res.json({msg : 'Working !'}))

//user
//register
//login
//logout
//refresh

//blog
//create
// read all blogs
// read blog by id
// update 
// delete

//comment
//create
//read comment by blog id


//register
router.post('/register',authController.register);
//login
router.post('/login',authController.login);
//logout
//router.post('/logout', authController.logout);
router.post('/logout', auth , authController.logout);
//refresh
router.get('/refresh',authController.refresh);


//pehle import blogController then routes

//create
router.post('/blog', auth , blogController.create);
//getAll
router.get('/blog/all', auth , blogController.getAll);
//get bolg By Id
router.get('/blog/:id', auth , blogController.getById );       //colon id path parameter hai
//update
router.put('/blog', auth , blogController.update);
//delete
router.delete('/blog/:id', auth , blogController.delete);


//now comments ke routes
//create
router.post('/comment', auth, commentController.create);
//get
router.get('/comment/:id', auth, commentController.getById);

module.exports = router;