import app from './app.js';
import {connectDataBase} from './config/database.js';
import cloudinary from 'cloudinary';
connectDataBase();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
app.listen(process.env.PORT, () => {
    console.log(`PORT is Working on ${process.env.PORT}`);
})