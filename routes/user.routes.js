const express = require('express');
const router = express.Router();
const {body, validationResult} =  require('express-validator');
const bcrypt =  require('bcrypt');
const {user : userModel, creator: creatorModel} = require('../models/user.model');
const jwt = require('jsonwebtoken');
const { auth: authorization, isCreator } = require('../middlewares/auth');

router.get('/register', (req, res) => {
    res.render('register')
});

router.post('/register',
    body('username').trim().isLength({min:5}), 
    body('password').trim().isLength({min:5}),
    async (req, res) => {

    const errs = validationResult(req);
    if (!errs.isEmpty()) {
        return res.status(400).json({
            message: 'invalid data',
            errors: errs.array()
        })
    }

    const {username, password} = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await userModel.create({
        username,
        password: hashedPassword,
        userType: 'reader'
    })

    const token = jwt.sign({
        userId: newUser._id,
        username: newUser.username,
        userType: newUser.userType
    }, process.env.JWT_SECRET)
    res.cookie('token', token);
    res.redirect('/bps/home');   
});


router.get('/', (req, res) => {
    res.render('login');
});

router.post('/', 
    body('username').trim().isLength(5),
    body('password').trim().isLength(5),
    async (req, res) => {
        const err = validationResult(req);
        if (!err.isEmpty()) {
            return res.status(400).json({
                'message': 'invalid data',
                'errors': err.array()
            });
        }

        const{username, password} = req.body;

        const user = await userModel.findOne({
            username: username
        });

        if (!user) {
            return res.status(400).json({
                'message': 'incorrect username or password'
            });
        }
        
        const isMatch = await bcrypt.compare(password, user.password)
        
        if (!isMatch) {
            return res.status(400).json({
                'message': 'incorrect username or password'
            });
        }

        const token = jwt.sign({
            userId: user._id,
            username: user.username,
            userType: user.userType
        }, process.env.JWT_SECRET)

        res.cookie('token', token);
        res.redirect('/bps/home');
});

router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/bps/home');
})

// check if user is logined or not
router.get('/auth/check', (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(400).json({
            'loggedIn': false
        })
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    if (decoded) {
        return res.status(200).json({
            'loggedIn': true,
            user: decoded
        });
    }else{
        return res.status(400).json({
            'loggedIn': false
        });
    }
})

// check if email is unique
router.post('/is-email-unique', async (req, res) =>{
    const { email } = req.body; 

    try {
        const user = await creatorModel.findOne({ email: email })
        if (user) {
            return res.json({ exists: true})
        }else{
            return res.json({ exists: false})
        }
    } catch (error) {
        console.log(error)
        return res.status(500).send('server error')
    }
})

// check if email is unique
router.post('/is-username-unique', async (req, res) => {
    const { username } = req.body; 

    try {
        const user = await userModel.findOne({ username: username })
        if (user) {
            return res.json({ exists: true})
        }else{
            return res.json({ exists: false})
        }
    } catch (error) {
        console.log(error)
        return res.status(500).send('server error')
    }
})

router.get('/become-creator', authorization, (req, res) => {
    res.render('creatorRegisteration');
})

router.post('/become-creator',
    body('fname').trim().not().isEmpty().isAlpha(),
    body('lname').trim().not().isEmpty().isAlpha(),
    body('email').trim().isEmail(),
    authorization,
    async (req, res) => {
        const { fname, lname, email } = req.body;
        const newCreator = await creatorModel.create({
            fname,
            lname,
            email,
            userId: req.user.userId
        });
        if (newCreator) {
            await userModel.findByIdAndUpdate(req.user.userId, {
                userType: 'creator'
            })
        }
        res.redirect('/user/');

})

module.exports = router;
