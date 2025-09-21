const express = require('express');
const router = express.Router();
const HarvestCommitteeSection = require('../models/HarvestCommitteeSection');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../uploads/harvestCommittee');
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
    const sections = await HarvestCommitteeSection.findActiveSections();
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
    const sections = await HarvestCommitteeSection.findAllSections();
    res.json(sections);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/', auth, adminAuth, upload.fields([{ name: 'backgroundImage', maxCount: 1 }, { name: 'tileImage', maxCount: 1 }]), async (req, res) => {
  const { order, title, description, isActive } = req.body;
  try {
    const newSection = new HarvestCommitteeSection({
      order, title, description, isActive: isActive === 'true', creator: req.user.id,
      backgroundImage: req.files && req.files['backgroundImage'] ? `/uploads/harvestCommittee/${req.files['backgroundImage'][0].filename}` : undefined,
      tileImage: req.files && req.files['tileImage'] ? `/uploads/harvestCommittee/${req.files['tileImage'][0].filename}` : undefined,
    });
    const section = await newSection.save();
    res.json(section);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/:id', auth, adminAuth, upload.fields([{ name: 'backgroundImage', maxCount: 1 }, { name: 'tileImage', maxCount: 1 }]), async (req, res) => {
  const { order, title, description, isActive } = req.body;
  try {
    let section = await HarvestCommitteeSection.findById(req.params.id);
    if (!section) return res.status(404).json({ msg: 'HarvestCommittee section not found' });
    
    section.order = order || section.order;
    section.title = title || section.title;
    section.description = description || section.description;
    section.isActive = isActive !== undefined ? isActive === 'true' : section.isActive;

    if (req.files && req.files['backgroundImage']) {
      if (section.backgroundImage) {
        const oldImagePath = path.join(__dirname, '..', section.backgroundImage);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }
      section.backgroundImage = `/uploads/harvestCommittee/${req.files['backgroundImage'][0].filename}`;
    }
    if (req.files && req.files['tileImage']) {
      if (section.tileImage) {
        const oldImagePath = path.join(__dirname, '..', section.tileImage);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }
      section.tileImage = `/uploads/harvestCommittee/${req.files['tileImage'][0].filename}`;
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
    const section = await HarvestCommitteeSection.findById(req.params.id);
    if (!section) return res.status(404).json({ msg: 'HarvestCommittee section not found' });

    if (section.backgroundImage) {
      const imagePath = path.join(__dirname, '..', section.backgroundImage);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    if (section.tileImage) {
      const imagePath = path.join(__dirname, '..', section.tileImage);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await HarvestCommitteeSection.deleteOne({ _id: req.params.id });
    res.json({ msg: 'HarvestCommittee section removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;