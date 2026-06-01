// server/controllers/authController.js
const User        = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const bcrypt      = require('bcryptjs');
const jwt         = require('jsonwebtoken');

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const calculateAge = (dateOfBirth) => {
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  const dayDiff = today.getDate() - dob.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
  return age;
};

// POST /api/auth/register  ← called from Home.jsx popup
exports.register = async (req, res) => {
  try {
    const { name, email, password, dateOfBirth, occupation } = req.body;
    const trimmedName = String(name || "").trim();
    const trimmedEmail = String(email || "").trim();
    const trimmedOccupation = String(occupation || "").trim();

    if (!trimmedName || !trimmedEmail || !password || !dateOfBirth || !trimmedOccupation)
      return res.status(400).json({ message: 'All fields are required' });

    const age = calculateAge(dateOfBirth);
    if (age === null)
      return res.status(400).json({ message: 'Invalid date of birth' });

    if (age < 18)
      return res.status(400).json({ message: 'You must be 18 or older to register' });

    const exists = await User.findOne({ email: trimmedEmail });
    if (exists)
      return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user   = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password: hashed,
      dateOfBirth: new Date(dateOfBirth),
      occupation: trimmedOccupation,
      age,
    });
    await ActivityLog.create({
      userId: user._id,
      action: 'register',
      details: { email: trimmedEmail, occupation: trimmedOccupation, age },
    });

    const token  = generateToken(user._id);

    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: 'Wrong password' });

    const token = generateToken(user._id);

    await ActivityLog.create({
      userId: user._id,
      action: 'login',
      details: { email: user.email },
    });

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me  ← get logged in user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};