const express = require('express');
const { upload } = require('../config/cloudinary');
const { uploadImages, getUserImages, deleteImage, updateImageOrder, updateImage, editImage } = require('../controllers/imageController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/upload', authMiddleware,upload.array('images', 10), uploadImages); 
router.get('/:userId', authMiddleware,getUserImages); 
router.delete('/:id', authMiddleware, deleteImage); 
router.put('/reorder', authMiddleware, updateImageOrder);
router.put("/:id", authMiddleware, upload.single("image"), editImage);

module.exports = router;
