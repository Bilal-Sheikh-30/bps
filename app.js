const express = require('express');
const cookieParser = require('cookie-parser')
const dotenv = require('dotenv');
dotenv.config();

const userRoutes = require('./routes/user.routes');
const bpsRoutes = require('./routes/bps.routes');

const dbconnection = require('./config/db');
dbconnection();

const app = express();



app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));


app.use('/user', userRoutes);
app.use('/bps', bpsRoutes);


app.listen(3000, (req, res) =>{
    console.log('server is running on 3000');
});