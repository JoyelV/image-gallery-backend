const Image = require('../models/Image');
const { cloudinary } = require('../config/cloudinary');

// Upload Bulk Images
exports.uploadImages = async (req, res) => {
  try {
    const { userId, titles } = req.body;
    console.log(req.body,"req.body")
    if (!req.files) return res.status(400).json({ message: 'No files uploaded' });

    // const existingImages = await Image.find({ userId }).countDocuments();
    // let order = existingImages; 

    // Find the current highest order value
    const maxOrderImage = await Image.findOne({ userId }).sort({ order: -1 });
    let order = maxOrderImage ? maxOrderImage.order + 1 : 0;

    const uploadedImages = await Promise.all(req.files.map(async (file,index) => {
      return await Image.create({
        title: titles[index] || `Image ${index + 1}`,
        imageURL: file.path,
        publicId: file.filename,
        userId,
        order: order++
      });
      return newImage;
    }));

    res.status(201).json({ message: 'Images uploaded successfully', data: uploadedImages });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

// Fetch User-Uploaded Images
exports.getUserImages = async (req, res) => {
  try {
    const { userId } = req.params;
    const images = await Image.find({ userId }).sort({ order: 1 });
    res.status(200).json(images);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching images', error: error.message });
  }
};

// Delete Image
exports.deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findById(id);
    if (!image) return res.status(404).json({ message: 'Image not found' });

    await cloudinary.uploader.destroy(image.publicId);
    await image.deleteOne(); 

    // Reorder remaining images
    const remainingImages = await Image.find({ userId: image.userId }).sort({ order: 1 });

    await Promise.all(remainingImages.map(async (img, index) => {
      await Image.findByIdAndUpdate(img._id, { order: index });
    }));

    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting image', error: error.message });
  }
};

exports.updateImageOrder = async (req, res) => {
    try {
      const { userId, images } = req.body;
      console.log(req.body,"req.body");
      
      // Update each image's order in the database
      await Promise.all(images.map(async (img, index) => {
        await Image.findByIdAndUpdate(img._id, { order: index });
      }));
  
      res.status(200).json({ message: 'Image order updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error updating image order', error: error.message });
    }
  };
  
  // Edit Image & Title
  exports.editImage = async (req, res) => {
    try {
      const { id } = req.params;
      const { title } = req.body;
      let imageUpdate = {};
  
      const image = await Image.findById(id);
      if (!image) return res.status(404).json({ message: 'Image not found' });
  
      // If user uploads a new image, replace it on Cloudinary
      if (req.file) {
        await cloudinary.uploader.destroy(image.publicId); // Delete old image
        imageUpdate.imageURL = req.file.path;
        imageUpdate.publicId = req.file.filename;
      }
  
      // Update title if provided
      if (title) {
        imageUpdate.title = title;
      }
  
      const updatedImage = await Image.findByIdAndUpdate(id, imageUpdate, { new: true });
  
      res.status(200).json({ message: 'Image updated successfully', data: updatedImage });
    } catch (error) {
      res.status(500).json({ message: 'Error updating image', error: error.message });
    }
  };
  