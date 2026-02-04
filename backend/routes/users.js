import express from 'express';
import multer from 'multer';
import User from '../models/User.js';
import { enrollFace, verifyFace, deleteFace as luxandDeleteFace } from '../services/luxand.js';

const router = express.Router();

// Configure multer for memory storage (receive base64 images)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Register user with face photo (base64)
router.post('/register', upload.single('photo'), async (req, res) => {
  try {
    const { name, email, phone, photo } = req.body;

    if (!name || !email || !phone || !photo) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Convert base64 photo to buffer
    const base64Data = photo.replace(/^data:image\/jpeg;base64,/, '').replace(/^data:image\/png;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Enroll face with Luxand - use email as person identifier
    const luxandResult = await enrollFace(imageBuffer, email);

    // Debug: Log the Luxand API response
    console.log('Luxand enrollment result:', JSON.stringify(luxandResult));

    // Luxand returns: { uuid: "person-uuid", face_uuid: ["face-uuid-1", ...] }
    // Also check for alternative field names
    const personUuid = luxandResult?.uuid || luxandResult?.id || luxandResult?.person_uuid;

    if (!personUuid) {
      throw new Error('Luxand API did not return a person UUID. Response: ' + JSON.stringify(luxandResult));
    }

    // Save user to MongoDB with the Luxand person UUID
    const user = new User({
      name,
      email,
      phone,
      faceId: personUuid,
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully', userId: user._id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-faceId');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify face - returns matching user info
router.post('/verify', upload.single('photo'), async (req, res) => {
  try {
    const { photo } = req.body;

    if (!photo) {
      return res.status(400).json({ message: 'Photo is required' });
    }

    // Convert base64 photo to buffer
    const base64Data = photo.replace(/^data:image\/jpeg;base64,/, '').replace(/^data:image\/png;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Verify face with Luxand
    const luxandResult = await verifyFace(imageBuffer);

    console.log('Verification - Luxand result:', JSON.stringify(luxandResult));

    // Luxand returns array of matches: [{ uuid: "person-uuid", probability: 0.95, name: "Person Name" }, ...]
    if (luxandResult && luxandResult.length > 0) {
      const bestMatch = luxandResult[0]; // First result is the best match
      const confidence = bestMatch.probability || 0;

      console.log('Best match:', JSON.stringify(bestMatch));

      // Find user by face ID (using uuid from Luxand response)
      const searchId = bestMatch.uuid || bestMatch.id;
      console.log('Searching for user with faceId:', searchId);

      const user = await User.findOne({ faceId: searchId });

      console.log('Found user:', user ? 'YES' : 'NO');
      if (user) {
        console.log('User email:', user.email);
      }

      if (user) {
        res.json({
          matched: true,
          confidence: confidence,
          user: {
            name: user.name,
            email: user.email,
            phone: user.phone,
          },
        });
      } else {
        res.json({
          matched: false,
          message: 'Face matched but user not found in database',
        });
      }
    } else {
      res.json({
        matched: false,
        message: 'No matching face found',
      });
    }
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: error.message || 'Server error during verification' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete face from Luxand
    await luxandDeleteFace(user.faceId);

    // Delete user from MongoDB
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Server error during deletion' });
  }
});

export default router;
