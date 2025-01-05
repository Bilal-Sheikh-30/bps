const mongoose = require('mongoose');

const clicks = new mongoose.Schema({
    blogInstanceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'blogInstance'
    },
    readerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
});
const likes = new mongoose.Schema({
    blogInstanceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'blogInstance'
    },
    readerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
});

const clicksInst = mongoose.model('clicks', clicks);
const likesInst = mongoose.model('likes', likes);

module.exports = { clicksInst, likesInst };