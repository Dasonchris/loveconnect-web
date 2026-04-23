// server/seed.js
const fs       = require('fs');
const path     = require('path');

// load env
fs.readFileSync(path.join(__dirname, '.env'), 'utf-8').split('\n').forEach(line => {
  const t = line.trim();
  if (t && !t.startsWith('#')) {
    const [k, ...v] = t.split('=');
    process.env[k.trim()] = v.join('=').trim();
  }
});

const mongoose = require('mongoose');
const Product  = require('./models/Product');

const products = [
  { name: 'Dinner Date',     price: 50,  image: '', category: 'experiences' },
  { name: 'Movie Ticket',    price: 15,  image: '', category: 'experiences' },
  { name: 'Gift Box',        price: 30,  image: '', category: 'gifts'       },
  { name: 'Flowers',         price: 20,  image: '', category: 'gifts'       },
  { name: 'Chocolate Pack',  price: 25,  image: '', category: 'gifts'       },
  { name: 'Weekend Getaway', price: 120, image: '', category: 'experiences' },
];

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log('✅ Products seeded!');
  process.exit();
});