const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    userType: {
        type: String,
        required: true,
        trim: true
    }
})


const creatorSchema = new mongoose.Schema({
    fname: {
        type: String,
        trim: true,
        required: true
    },
    lname: {
        type: String,
        trim: true,
        required: true
    },
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    likesCount: {
        type: Number,
        default: 0,
        min: 0
    },
    clicksCount: {
        type: Number,
        default: 0,
        min: 0
    },
    blogsCount: {
        type: Number,
        default: 0,
        min: 0
    }
})

const user = mongoose.model('user', userSchema);
const creator = mongoose.model('creator', creatorSchema);

module.exports= {user, creator};