const express = require('express');
const router = express.Router();
const { blogInstance, blog } = require('../models/blog.model');
const { user, creator } = require('../models/user.model');
const { clicksInst, likesInst } = require('../models/engagement.model');
const { auth: authorization, isCreator } = require('../middlewares/auth');
const multer = require('multer');

// const upload = multer({ dest: 'uploads/' });
const cloudinary = require('../config/cloudinaryConfig');
const fs = require('fs');



const streamifier = require('streamifier');

// Use multer memory storage to hold the file in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// const path = require('path');
// // Set up multer to store files temporarily in /tmp (Vercel writable directory)
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, '/tmp');  // Temporary directory allowed by Vercel
//     },
//     filename: function (req, file, cb) {
//         cb(null, Date.now() + path.extname(file.originalname)); // Use a unique filename
//     },
// });

// const upload = multer({ storage: storage });

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

            res.render('creatorPage', { creatorProfile, userProfile, fullBlog });
        } else {
            res.render('creatorPage', { creatorProfile, userProfile, fullBlog });
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
    } else {
        liked = true
    };


    if (req.user.userId != instance.creatorId && click == null) {
        await clicksInst.create({
            blogInstanceId: instance._id,
            readerId: req.user.userId
        });
        creatorDetails = await creator.findOneAndUpdate({ userId: instance.creatorId }, { $inc: { clicksCount: 1 } }, { new: true });
    };

    res.render('readBlog', { instance, blogMaterial, creatorDetails, 'liked': liked });
});

router.get('/do-like/:blogID/:creatorId', authorization, async (req, res) => {
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
        await creator.findOneAndUpdate({ userId: creatorId }, { $inc: { likesCount: 1 } });
    } else {
        // do unlike
        await likesInst.findOneAndDelete({
            blogInstanceId: blogId,
            readerId: userId
        });
        await creator.findOneAndUpdate({ userId: creatorId }, { $inc: { likesCount: -1 } });
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

// multer storage wala
// router.post('/new-blog', authorization, isCreator, upload.single('image'), async (req, res) => {
//     const { title, content, category, keywords, visibility } = req.body;
//     const file = req.file;

//     try {
//         let imageUrl = '';

//         if (file) {
//             // Convert the buffer (in-memory file) into a stream to upload to Cloudinary
//             const uploadStream = cloudinary.uploader.upload_stream(
//                 {
//                     folder: 'blog_images', // Optional folder in Cloudinary
//                 },
//                 (error, result) => {
//                     if (error) {
//                         console.error("Error uploading to Cloudinary:", error);
//                         return res.status(500).json({ error: 'Failed to upload image to Cloudinary.' });
//                     }
//                     // After upload, get the secure URL from Cloudinary
//                     imageUrl = result.secure_url;
//                     // Continue with creating the blog
//                     createBlog();
//                 }
//             );

//             // Use streamifier to convert the buffer into a readable stream
//             streamifier.createReadStream(file.buffer).pipe(uploadStream);
//         } else {
//             imageUrl = 'no image';
//             createBlog();
//         }

//         async function createBlog() {
//             const newblogInstance = await blogInstance.create({
//                 creatorId: req.user.userId,
//                 category,
//                 keywords,
//                 visibility
//             });

//             const newBlog = await blog.create({
//                 blogInstanceId: newblogInstance._id,
//                 title,
//                 content,
//                 imageURL: imageUrl
//             });

//             const updatedCreatorProfile = await creator.findOneAndUpdate(
//                 { userId: req.user.userId },
//                 { $inc: { blogsCount: 1 } },
//                 { new: true }
//             );

//             res.redirect('/bps/creator-profile');
//         }

//     } catch (error) {
//         return res.status(500).json({ error: 'Failed to upload image or save blog.' });
//     }
// });


router.post('/new-blog', authorization, isCreator, upload.single('image'), async (req, res) => {
    const { title, content, category, keywords, visibility } = req.body;
    const file = req.file;

    try {
        let imageUrl = '';

        if (file) {
            // Create a new Promise to handle the Cloudinary upload
            imageUrl = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'blog_images', // Optional folder in Cloudinary
                    },
                    (error, result) => {
                        if (error) {
                            console.error("Error uploading to Cloudinary:", error);
                            reject('Failed to upload image to Cloudinary.');
                        } else {
                            resolve(result.secure_url);
                        }
                    }
                );

                // Use streamifier to convert the buffer into a readable stream
                streamifier.createReadStream(file.buffer).pipe(uploadStream);
            });
        } else {
            imageUrl = 'no image';
        }

        // Now, create the blog after the image URL is ready
        await createBlog(imageUrl);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to upload image or save blog.' });
    }

    async function createBlog(imageUrl) {
        try {
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

            const updatedCreatorProfile = await creator.findOneAndUpdate(
                { userId: req.user.userId },
                { $inc: { blogsCount: 1 } },
                { new: true }
            );

            res.redirect('/bps/creator-profile');
        } catch (err) {
            console.error('Error creating blog:', err);
            res.status(500).json({ error: 'Failed to create blog.' });
        }
    }
});



// original wala
// router.post('/new-blog', authorization, isCreator, upload.single('image'), async (req, res) => {
//     const { title, content, category, keywords, visibility } = req.body;
//     const file = req.file;

//     try {
//         let imageUrl = '';

//         if (file) {
//             try {
//                 const result = await cloudinary.uploader.upload(file.path, {
//                     folder: 'blog_images',
//                 });
//                 imageUrl = result.secure_url;
//             } catch (uploadError) {
//                 console.error("Error uploading to Cloudinary:", uploadError);
//                 return res.status(500).json({ error: 'Failed to upload image to Cloudinary.' });
//             }
//         } else {
//             imageUrl = 'no image';
//         }

//         const newblogInstance = await blogInstance.create({
//             creatorId: req.user.userId,
//             category,
//             keywords,
//             visibility
//         });

//         const newBlog = await blog.create({
//             blogInstanceId: newblogInstance._id,
//             title,
//             content,
//             imageURL: imageUrl
//         });
//         const updatedCreatorProfile = await creator.findOneAndUpdate({ userId: req.user.userId },
//             { $inc: { blogsCount: 1 } },
//             { new: true }
//         );

//         if (file) {
//             fs.unlink(file.path, (err) => {
//                 if (err) console.error("Error deleting local file:", err);
//             });
//         };
//         res.redirect('/bps/creator-profile')

//     } catch (error) {
//         return res.status(500).json({ error: 'Failed to upload image or save blog.' });
//     }

// });


// router.post('/new-blog', authorization, isCreator, upload.single('image'), async (req, res) => {
//     const { title, content, category, keywords, visibility } = req.body;
//     const file = req.file;
  
//     try {
//       let imageUrl = '';
  
//       // If a file is uploaded, upload it to Cloudinary
//       if (file) {
//         try {
//           const result = await cloudinary.uploader.upload(file.path, {
//             folder: 'blog_images',
//           });
//           imageUrl = result.secure_url;  // Save Cloudinary image URL
//         } catch (uploadError) {
//           console.error("Error uploading to Cloudinary:", uploadError);
//           return res.status(500).json({ error: 'Failed to upload image to Cloudinary.' });
//         }
//       } else {
//         imageUrl = 'no image';
//       }
  
//       // Create the blog instance
//       const newblogInstance = await blogInstance.create({
//         creatorId: req.user.userId,
//         category,
//         keywords,
//         visibility,
//       });
  
//       // Create the blog entry with the image URL
//       const newBlog = await blog.create({
//         blogInstanceId: newblogInstance._id,
//         title,
//         content,
//         imageURL: imageUrl,
//       });
  
//       // Update the creator's profile
//       const updatedCreatorProfile = await creator.findOneAndUpdate(
//         { userId: req.user.userId },
//         { $inc: { blogsCount: 1 } },
//         { new: true }
//       );
  
//       // Delete the temporary file after upload to Cloudinary
//       if (file) {
//         fs.unlink(file.path, (err) => {
//           if (err) console.error("Error deleting local file:", err);
//         });
//       }
  
//       res.redirect('/bps/creator-profile');
//     } catch (error) {
//       console.error("Error:", error);
//       return res.status(500).json({ error: 'Failed to upload image or save blog.' });
//     }
//   });



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

    await creator.findOneAndUpdate({ userId: req.user.userId }, { $inc: { blogsCount: -1 } })
    res.redirect('/bps/creator-profile');
});

module.exports = router;
