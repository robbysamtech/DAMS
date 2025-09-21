const express = require('express');
const router = express.Router();
const GospelMinistrySection = require('../models/GospelMinistrySection');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../uploads/gospelMinistry');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, uploadsDir); },
  filename: (req, file, cb) => { cb(null, `${Date.now()}-${file.originalname}`); }
});

const upload = multer({ storage: storage });

router.get('/', async (req, res) => {
  try {
    const sections = await GospelMinistrySection.findActiveSections();
    res.json(sections);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/admin', auth, async (req, res) => {
    try {
      // Check if user has admin privileges
      if (!req.user.canCreateContent()) {
        return res.status(403).json({ error: 'You do not have permission to view admin data.' });
      }
    const sections = await GospelMinistrySection.findAllSections();
    res.json(sections);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/', auth, adminAuth, upload.fields([{ name: 'backgroundImage', maxCount: 1 }, { name: 'tileImage', maxCount: 1 }]), async (req, res) => {
  const { order, title, description, isActive } = req.body;
  try {
    const newSection = new GospelMinistrySection({
      order, title, description, isActive: isActive === 'true', creator: req.user.id,
      backgroundImage: req.files && req.files['backgroundImage'] ? `/uploads/gospelMinistry/${req.files['backgroundImage'][0].filename}` : undefined,
      tileImage: req.files && req.files['tileImage'] ? `/uploads/gospelMinistry/${req.files['tileImage'][0].filename}` : undefined,
    });
    const section = await newSection.save();
    res.json(section);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/:id', auth, upload.fields([{ name: 'backgroundImage', maxCount: 1 }, { name: 'tileImage', maxCount: 1 }]), async (req, res) => {
  const { order, title, description, isActive } = req.body;

  try {
    // Check if user can manage this section (editor/admin/superadmin can manage sections)
    if (!req.user.canCreateContent()) {
      return res.status(403).json({ error: 'You do not have permission to manage this section.' });
    }
    let section = await GospelMinistrySection.findById(req.params.id);
    if (!section) return res.status(404).json({ msg: 'GospelMinistry section not found' });
    
    section.order = order || section.order;
    section.title = title || section.title;
    section.description = description || section.description;
    section.isActive = isActive !== undefined ? isActive === 'true' : section.isActive;

    if (req.files && req.files['backgroundImage']) {
      if (section.backgroundImage) {
        const oldImagePath = path.join(__dirname, '..', section.backgroundImage);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }
      section.backgroundImage = `/uploads/gospelMinistry/${req.files['backgroundImage'][0].filename}`;
    }
    if (req.files && req.files['tileImage']) {
      if (section.tileImage) {
        const oldImagePath = path.join(__dirname, '..', section.tileImage);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }
      section.tileImage = `/uploads/gospelMinistry/${req.files['tileImage'][0].filename}`;
    }

    section.metadata.updatedAt = Date.now();
    await section.save();
    res.json(section);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.delete('/:id', auth, async (req, res) => {
    try {
      // Check if user can manage this section (editor/admin/superadmin can manage sections)
      if (!req.user.canCreateContent()) {
        return res.status(403).json({ error: 'You do not have permission to manage this section.' });
      }
    const section = await GospelMinistrySection.findById(req.params.id);
    if (!section) return res.status(404).json({ msg: 'GospelMinistry section not found' });

    if (section.backgroundImage) {
      const imagePath = path.join(__dirname, '..', section.backgroundImage);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    if (section.tileImage) {
      const imagePath = path.join(__dirname, '..', section.tileImage);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await GospelMinistrySection.deleteOne({ _id: req.params.id });
    res.json({ msg: 'GospelMinistry section removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;