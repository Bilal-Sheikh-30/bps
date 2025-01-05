const mongoose = require('mongoose');

function connecttoDb() {
    mongoose.connect(process.env.MONGO_URI).then(() => {
        console.log('connected to db');

    })

    // mongoose.connect('mongodb+srv://alpha:dbalpha@cluster0.yp7ua.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
    //     .then(() => console.log('MongoDB connected'))
    //     .catch(err => console.error('MongoDB connection error:', err));



}

module.exports = connecttoDb;