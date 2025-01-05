const jwt = require('jsonwebtoken');

function auth(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect('/user')
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        return next();

    } catch (error) {
        return res.status(400).json({
            'message': 'unauthorized'
        });
    }
    
}

function isCreator(req, res, next){
    if (req.user && req.user.userType === 'creator') {
        return next();
    }else{
        return res.status(400).json({
            message: 'This page is for creators only.'
        })
    }
}

module.exports = { auth, isCreator }