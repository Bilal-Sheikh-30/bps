const express = require('express');
const router = express.Router();
const { blogInstance, blog } = require('../models/blog.model');
const { user, creator } = require('../models/user.model');
const { clicksInst, likesInst } = require('../models/engagement.model');
const { auth: authorization, isCreator } = require('../middlewares/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const cloudinary = require('../config/cloudinaryConfig');
const fs = require('fs');


async function getFullBlogs(filter) {
    let instances = '';
    let fullBlog = [];
    switch (filter) {
        case 'mostRecent':
            instances = await blogInstance.find({
                visibility: 'public'
            });
            break;
        case 'topCreators':
            console.log('top creators');
            break;
        case 'general':
            instances = await blogInstance.find({
                visibility: 'public',
                category: 'general'
            });
            break;
        case 'sports':
            instances = await blogInstance.find({
                visibility: 'public',
                category: 'sports'
            });
            break;
        case 'finance':
            instances = await blogInstance.find({
                visibility: 'public',
                category: 'finance'
            });
            break;
        case 'technology':
            instances = await blogInstance.find({
                visibility: 'public',
                category: 'technology'
            });
            break;
        case 'health':
            instances = await blogInstance.find({
                visibility: 'public',
                category: 'health'
            });
            break;

        default:
            instances = [];
            break;
    }

    if (instances.length > 0) {
        instances.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
        for (const inst of instances) {
            const blog_material = await blog.findOne({ blogInstanceId: inst._id });
            const creator_details = await creator.findOne({ userId: inst.creatorId });
            fullBlog.push({ inst, blog_material, creator_details });
        }
        return fullBlog;

    } else {
        // in cace of zero instances
        return false
    }
};

router.get('/home', async (req, res) => {
    const result = await getFullBlogs('mostRecent');

    if (result) {
        res.render('home', { 'filter': 'mostRecent', 'fullBlog': result });
    } else {
        res.render('home', { 'filter': 'mostRecent', 'fullBlog': result });
    }
});

router.get('/filter', async (req, res) => {
    const filterRequest = req.query.filter;
    let result = await getFullBlogs(filterRequest);
    if (result) {
        res.render('home', { 'filter': filterRequest, 'fullBlog': result });
    } else {
        res.render('home', { 'filter': filterRequest, 'fullBlog': result });
    }
});

router.get('/get-creator/:creatorId', async (req, res) => {
    const creatorId = req.params.creatorId;
    const creatorProfile = await creator.findById(creatorId);

    if (creatorProfile != null) {
        let fullBlog = [];
        const userProfile = await user.findOne({ _id: creatorProfile.userId });
        const instances = await blogInstance.find({ creatorId: userProfile._id, visibility: 'public' });
        if (instances.length > 0) {
            instances.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
            for (const inst of instances) {
                let blog_material = await blog.findOne({ blogInstanceId: inst._id });
                fullBlog.push({ inst, blog_material });
            }
            
            res.render('creatorPage', {creatorProfile, userProfile, fullBlog});
        }else{
            res.render('creatorPage', {creatorProfile, userProfile, fullBlog});
        }
    } else {
        res.status(404).json({ 'msg': 'not found' });
    }
});

router.get('/read/:blogId', authorization, async (req, res) => {
    const instance = await blogInstance.findById(req.params.blogId);
    const blogMaterial = await blog.findOne({ blogInstanceId: req.params.blogId });
    let creatorDetails = await creator.findOne({ userId: instance.creatorId });

    const click = await clicksInst.findOne({
        blogInstanceId: instance._id,
        readerId: req.user.userId
    });

    let liked = await likesInst.findOne({
        blogInstanceId: req.params.blogId,
        readerId: req.user.userId
    });
    if (liked == null) {
        liked = false
    }else{
        liked = true
    };
    
    
    if (req.user.userId != instance.creatorId && click == null) {
        await clicksInst.create({
            blogInstanceId: instance._id,
            readerId: req.user.userId
        });
        creatorDetails = await creator.findOneAndUpdate({ userId: instance.creatorId }, { $inc: { clicksCount: 1 } },{ new: true } );
    };

    res.render('readBlog', { instance, blogMaterial, creatorDetails, 'liked': liked });
});

router.get('/do-like/:blogID/:creatorId',authorization, async (req, res)=> {
    const blogId = req.params.blogID;
    const creatorId = req.params.creatorId;
    const userId = req.user.userId;

    let liked = await likesInst.findOne({
        blogInstanceId: blogId,
        readerId: userId
    });
    if (liked == null) {
        // do like
        await likesInst.create({
            blogInstanceId: blogId,
            readerId: userId
        });
        await creator.findOneAndUpdate({userId: creatorId}, { $inc: { likesCount: 1 } });
    }else{
        // do unlike
        await likesInst.findOneAndDelete({
            blogInstanceId: blogId,
            readerId: userId
        });
        await creator.findOneAndUpdate({userId: creatorId}, { $inc: { likesCount: -1 } });
    }
    res.redirect(`/bps/read/${blogId}`);
    
})

// routes for creators

router.get('/creator-profile', authorization, isCreator, async (req, res) => {
    // fetch blog instance of the creator
    const blogs = await blogInstance.find({
        creatorId: req.user.userId,
        visibility: 'public'
    })

    // fetch content of blogs instance 
    let publicBlogs = []
    for (const blogInst of blogs) {
        let blogContent = await blog.findOne({ blogInstanceId: blogInst._id })
        publicBlogs.push({ ...blogInst, title: blogContent.title, content: blogContent.content, image: blogContent.imageURL });
    }

    res.render('creatorProfile', { publicBlogs });
});

router.get('/creator-private-blogs', authorization, isCreator, async (req, res) => {
    // fetch blog instance of the creator
    const blogs = await blogInstance.find({
        creatorId: req.user.userId,
        visibility: 'private'
    })

    // fetch content of blogs instance 
    let privateBlogs = []
    for (const blogInst of blogs) {
        let blogContent = await blog.findOne({ blogInstanceId: blogInst._id })
        privateBlogs.push({ ...blogInst, title: blogContent.title, content: blogContent.content, image: blogContent.imageURL });
    }

    res.render('privateBlogs', { privateBlogs });
});

router.get('/new-blog', authorization, isCreator, (req, res) => {
    res.render('newBlog');
});

router.post('/new-blog', authorization, isCreator, upload.single('image'), async (req, res) => {
    const { title, content, category, keywords, visibility } = req.body;
    const file = req.file;

    try {
        let imageUrl = '';

        if (file) {
            try {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'blog_images',
                });
                imageUrl = result.secure_url;
            } catch (uploadError) {
                console.error("Error uploading to Cloudinary:", uploadError);
                return res.status(500).json({ error: 'Failed to upload image to Cloudinary.' });
            }
        } else {
            imageUrl = 'no image';
        }

        const newblogInstance = await blogInstance.create({
            creatorId: req.user.userId,
            category,
            keywords,
            visibility
        });

        const newBlog = await blog.create({
            blogInstanceId: newblogInstance._id,
            title,
            content,
            imageURL: imageUrl
        });
        const updatedCreatorProfile = await creator.findOneAndUpdate({ userId: req.user.userId },
            { $inc: { blogsCount: 1 } },
            { new: true }
        );

        if (file) {
            fs.unlink(file.path, (err) => {
                if (err) console.error("Error deleting local file:", err);
            });
        };
        res.redirect('/bps/creator-profile')

    } catch (error) {
        return res.status(500).json({ error: 'Failed to upload image or save blog.' });
    }

});

router.get('/edit-blog/:blogId', authorization, isCreator, async (req, res) => {
    const requestedBlog = req.params.blogId;

    const blogInst = await blogInstance.findOne({
        _id: requestedBlog,
        creatorId: req.user.userId
    })
    if (blogInst) {
        const blogContent = await blog.findOne({
            blogInstanceId: blogInst._id
        });
        fullBlog = { blogInst, blogContent }

        if (blogContent) {
            res.render('editBlog', fullBlog);
        } else {
            return res.status(404).json('blog not found')
        }
    } else {
        return res.status(404).json('blog not found')
    }
});

router.post('/edit-blog/:blogId', authorization, isCreator, upload.single('image'), async (req, res) => {
    const requestedBlog = req.params.blogId;

    const { title, content, category, keywords, visibility } = req.body;
    const file = req.file;

    const inst = await blogInstance.findOneAndUpdate({
        _id: requestedBlog,
    }, {
        category,
        keywords,
        visibility
    });

    let new_imageUrl = '';

    if (file) {
        try {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: 'blog_images',
            });
            new_imageUrl = result.secure_url;

            const blogDescription = await blog.findOneAndUpdate({ blogInstanceId: requestedBlog }, {
                title,
                content,
                imageURL: new_imageUrl
            }, { new: true });


        } catch (uploadError) {
            console.error("Error uploading to Cloudinary:", uploadError);
            return res.status(500).json({ error: 'Failed to upload image to Cloudinary.' });
        }
    } else {
        const blogDescription = await blog.findOneAndUpdate({ blogInstanceId: requestedBlog }, {
            title,
            content
        }, { new: true });

    }

    res.redirect('/bps/creator-profile');
});

router.get('/delete/:blogId', authorization, isCreator, async (req, res, next) => {
    const requestedBlog = req.params.blogId;
    const blogInst = await blogInstance.findById(requestedBlog);
    if (req.user.userId == blogInst.creatorId) {
        next();
    } else {
        res.status(400).json({
            message: 'unauthorize access'
        });
    }
}, async (req, res) => {
    const requestedBlog = req.params.blogId;

    await blogInstance.findOneAndDelete({
        _id: requestedBlog
    });

    await blog.findOneAndDelete({
        blogInstanceId: requestedBlog
    });

    await creator.findOneAndUpdate({userId: req.user.userId}, { $inc: { blogsCount: -1 } })
    res.redirect('/bps/creator-profile');
});

module.exports = router;
