const mongoose = require('mongoose');

const blogInstanceSchema = new  mongoose.Schema({
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    category: {
        type: String,
    },
    keywords: {
        type: [String],
        default: []
    },
    publishDate: {
        type: Date,
        default: Date.now
    },
    visibility: {
        type: String,
        default: 'public'
    }
});

const blogSchema = new mongoose.Schema({
    blogInstanceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'blogInstance'
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    imageURL: {
        type: String,
        default: 'no image'
    }
})

const blogInstance = mongoose.model('blogInstance', blogInstanceSchema);
const blog = mongoose.model('blog', blogSchema);

module.exports = { blogInstance, blog };