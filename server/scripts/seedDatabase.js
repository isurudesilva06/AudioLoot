const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Sample products data
const sampleProducts = [
  {
    name: "Sony WH-1000XM5 Wireless Headphones",
    description: "Industry-leading noise canceling with Dual Noise Sensor technology. Next-level music with Edge-AI, for the ultimate listening experience.",
    price: 399.99,
    originalPrice: 449.99,
    category: "headphones",
    brand: "Sony",
    images: [{
      url: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=300&fit=crop",
      publicId: "sony-wh1000xm5",
      alt: "Sony WH-1000XM5 Wireless Headphones"
    }],
    features: [
      "Industry-leading noise canceling",
      "30-hour battery life",
      "Quick charge: 3 min = 3 hours",
      "Crystal clear hands-free calling",
      "Touch sensor controls"
    ],
    specifications: {
      "Driver Unit": "30mm",
      "Frequency Response": "4Hz-40,000Hz",
      "Impedance": "48Ω",
      "Battery Life": "30 hours",
      "Weight": "250g"
    },
    stock: 25,
    rating: {
      average: 4.8,
      count: 2847
    },
    isFeatured: true,
    tags: ["wireless", "noise-canceling", "premium", "sony"]
  },
  {
    name: "Apple AirPods Pro (2nd Gen)",
    description: "AirPods Pro (2nd generation) with MagSafe Charging Case. Featuring up to 2x more Active Noise Cancellation.",
    price: 249.99,
    originalPrice: 279.99,
    category: "earbuds",
    brand: "Apple",
    images: [{
      url: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=300&fit=crop",
      publicId: "airpods-pro-2nd-gen",
      alt: "Apple AirPods Pro (2nd Gen)"
    }],
    features: [
      "Active Noise Cancellation",
      "Transparency mode",
      "Spatial audio with dynamic head tracking",
      "MagSafe charging case",
      "Sweat and water resistant"
    ],
    specifications: {
      "Chip": "H2 chip",
      "Battery Life": "6 hours (earbuds)",
      "Case Battery": "30 hours total",
      "Water Resistance": "IPX4",
      "Connectivity": "Bluetooth 5.3"
    },
    stock: 40,
    rating: {
      average: 4.7,
      count: 1923
    },
    isFeatured: true,
    tags: ["wireless", "apple", "anc", "earbuds"]
  },
  {
    name: "Bose SoundLink Revolve+ II",
    description: "True 360° sound for consistent, uniform coverage. Deep, jaw-dropping sound with Real360 technology.",
    price: 329.99,
    originalPrice: 379.99,
    category: "speakers",
    brand: "Bose",
    images: [{
      url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=300&fit=crop",
      publicId: "bose-soundlink-revolve-plus-ii",
      alt: "Bose SoundLink Revolve+ II"
    }],
    features: [
      "True 360° sound",
      "17-hour battery life",
      "Water-resistant design",
      "Voice prompts",
      "Wireless range up to 30 feet"
    ],
    specifications: {
      "Dimensions": "7.25\" H x 4.13\" W",
      "Weight": "2.0 lbs",
      "Battery": "17 hours",
      "Water Resistance": "IP55",
      "Connectivity": "Bluetooth, 3.5mm"
    },
    stock: 15,
    rating: {
      average: 4.6,
      count: 856
    },
    isFeatured: false,
    tags: ["portable", "360-sound", "waterproof", "bose"]
  },
  {
    name: "Audio-Technica ATH-M50xBT2",
    description: "Wireless over-ear headphones with exceptional clarity and deep, accurate bass response.",
    price: 199.99,
    originalPrice: 229.99,
    category: "headphones",
    brand: "Audio-Technica",
    images: [{
      url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=300&fit=crop",
      publicId: "audio-technica-ath-m50xbt2",
      alt: "Audio-Technica ATH-M50xBT2"
    }],
    features: [
      "Premium audio quality",
      "50-hour battery life",
      "Multipoint pairing",
      "Built-in controls",
      "Professional-grade sound"
    ],
    specifications: {
      "Driver": "45mm large-aperture",
      "Frequency Response": "15-28,000Hz",
      "Impedance": "38Ω",
      "Battery": "50+ hours",
      "Weight": "310g"
    },
    stock: 30,
    rating: {
      average: 4.5,
      count: 1234
    },
    isFeatured: false,
    tags: ["studio", "professional", "wireless", "audio-technica"]
  },
  {
    name: "JBL Charge 5 Portable Speaker",
    description: "Powerful portable Bluetooth speaker with deep bass and IP67 waterproof rating.",
    price: 179.99,
    originalPrice: 199.99,
    category: "speakers",
    brand: "JBL",
    images: [{
      url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=300&fit=crop",
      publicId: "jbl-charge-5",
      alt: "JBL Charge 5 Portable Speaker"
    }],
    features: [
      "JBL Pro Sound",
      "20 hours of playtime",
      "IP67 waterproof",
      "Powerbank feature",
      "PartyBoost compatible"
    ],
    specifications: {
      "Output Power": "40W RMS",
      "Frequency Response": "65Hz – 20kHz",
      "Battery": "20 hours",
      "Charging": "USB-C",
      "Water Rating": "IP67"
    },
    stock: 20,
    rating: {
      average: 4.4,
      count: 967
    },
    isFeatured: false,
    tags: ["portable", "waterproof", "powerbank", "jbl"]
  },
  {
    name: "Sennheiser Momentum 4 Wireless",
    description: "Audiophile-inspired sound with Adaptive Noise Cancellation and exceptional 60-hour battery life.",
    price: 349.99,
    originalPrice: 399.99,
    category: "headphones",
    brand: "Sennheiser",
    images: [{
      url: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=300&fit=crop",
      publicId: "sennheiser-momentum-4",
      alt: "Sennheiser Momentum 4 Wireless"
    }],
    features: [
      "Audiophile sound quality",
      "60-hour battery life",
      "Adaptive Noise Cancellation",
      "Crystal-clear calls",
      "Smart Control App"
    ],
    specifications: {
      "Driver": "42mm transducer",
      "Frequency Response": "6Hz to 22,000Hz",
      "Battery": "60 hours",
      "Charging": "USB-C",
      "Codec Support": "aptX, AAC, SBC"
    },
    stock: 18,
    rating: {
      average: 4.7,
      count: 743
    },
    isFeatured: true,
    tags: ["audiophile", "premium", "long-battery", "sennheiser"]
  },
  {
    name: "Samsung Galaxy Buds2 Pro",
    description: "Pro-level sound quality with intelligent Active Noise Cancellation and 360 Audio.",
    price: 199.99,
    originalPrice: 229.99,
    category: "earbuds",
    brand: "Samsung",
    images: [{
      url: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=300&fit=crop",
      publicId: "samsung-galaxy-buds2-pro",
      alt: "Samsung Galaxy Buds2 Pro"
    }],
    features: [
      "Intelligent ANC",
      "360 Audio",
      "IPX7 water resistance",
      "8-hour battery + case",
      "Seamless device switching"
    ],
    specifications: {
      "Driver": "10mm woofer + 5.3mm tweeter",
      "Battery": "8 hours + 20 hours case",
      "Water Rating": "IPX7",
      "Connectivity": "Bluetooth 5.3",
      "Codec": "Samsung Seamless Codec"
    },
    stock: 35,
    rating: {
      average: 4.3,
      count: 1456
    },
    isFeatured: false,
    tags: ["samsung", "360-audio", "waterproof", "wireless"]
  },
  {
    name: "Focal Clear MG Professional",
    description: "Open-back headphones with Magnesium drivers for studio-grade monitoring and audiophile listening.",
    price: 1499.99,
    originalPrice: 1699.99,
    category: "headphones",
    brand: "Focal",
    images: [{
      url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=300&fit=crop",
      publicId: "focal-clear-mg-professional",
      alt: "Focal Clear MG Professional"
    }],
    features: [
      "Magnesium drivers",
      "Open-back design",
      "Professional monitoring",
      "Exceptional clarity",
      "Handcrafted in France"
    ],
    specifications: {
      "Driver": "40mm Magnesium/Aluminum",
      "Impedance": "55Ω",
      "Sensitivity": "104dB SPL",
      "Frequency Response": "5Hz – 28kHz",
      "Weight": "450g"
    },
    stock: 5,
    rating: {
      average: 4.9,
      count: 234
    },
    isFeatured: true,
    tags: ["professional", "audiophile", "open-back", "studio", "focal"]
  },
  {
    name: "KEF LS50 Meta Bookshelf Speakers",
    description: "Revolutionary bookshelf speakers with Metamaterial Absorption Technology for pure, natural sound.",
    price: 1499.99,
    originalPrice: 1699.99,
    category: "speakers",
    brand: "KEF",
    images: [{
      url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=300&fit=crop",
      publicId: "kef-ls50-meta",
      alt: "KEF LS50 Meta Bookshelf Speakers"
    }],
    features: [
      "Metamaterial Absorption Technology",
      "12th generation Uni-Q driver",
      "Exceptional imaging",
      "Premium build quality",
      "Award-winning design"
    ],
    specifications: {
      "Driver": "130mm Uni-Q",
      "Frequency Range": "79Hz - 28kHz",
      "Sensitivity": "85dB",
      "Impedance": "8Ω",
      "Dimensions": "302 x 200 x 278mm"
    },
    stock: 8,
    rating: {
      average: 4.8,
      count: 189
    },
    isFeatured: true,
    tags: ["bookshelf", "hifi", "metamaterial", "premium", "kef"]
  },
  {
    name: "Shure SE846-CL Pro Earphones",
    description: "Quad high-definition MicroDrivers with true subwoofer for extended low-end performance.",
    price: 999.99,
    originalPrice: 1199.99,
    category: "earbuds",
    brand: "Shure",
    images: [{
      url: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=300&fit=crop",
      publicId: "shure-se846-cl-pro",
      alt: "Shure SE846-CL Pro Earphones"
    }],
    features: [
      "Quad MicroDrivers",
      "True subwoofer",
      "Sound isolating design",
      "Detachable cable",
      "Professional monitoring"
    ],
    specifications: {
      "Drivers": "Quad BA + subwoofer",
      "Frequency Response": "15Hz - 20kHz",
      "Sensitivity": "114dB SPL/mW",
      "Impedance": "9Ω",
      "Isolation": "37dB"
    },
    stock: 12,
    rating: {
      average: 4.6,
      count: 345
    },
    isFeatured: false,
    tags: ["professional", "quad-driver", "audiophile", "shure"]
  },
  {
    name: "Audio Cable Pro XLR",
    description: "Professional-grade XLR cable for studio and live sound applications.",
    price: 49.99,
    originalPrice: 59.99,
    category: "accessories",
    brand: "AudioCable",
    images: [{
      url: "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=400&h=300&fit=crop",
      publicId: "audio-cable-pro-xlr",
      alt: "Audio Cable Pro XLR"
    }],
    features: [
      "Gold-plated connectors",
      "Oxygen-free copper",
      "Neutrik connectors",
      "Multiple lengths",
      "Lifetime warranty"
    ],
    specifications: {
      "Length": "3m",
      "Connectors": "Neutrik XLR",
      "Cable": "OFC",
      "Shielding": "Spiral + Foil",
      "Capacitance": "75pF/m"
    },
    stock: 50,
    rating: {
      average: 4.2,
      count: 678
    },
    isFeatured: false,
    tags: ["xlr", "cable", "professional", "studio"]
  },
  {
    name: "Audio Interface USB-C Hub",
    description: "Professional USB-C audio interface with multiple inputs and outputs for content creators.",
    price: 199.99,
    originalPrice: 249.99,
    category: "accessories",
    brand: "AudioHub",
    images: [{
      url: "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=400&h=300&fit=crop",
      publicId: "audio-interface-usb-c-hub",
      alt: "Audio Interface USB-C Hub"
    }],
    features: [
      "USB-C connectivity",
      "Multiple I/O options",
      "Zero-latency monitoring",
      "Phantom power",
      "Compact design"
    ],
    specifications: {
      "Inputs": "2x XLR/TRS",
      "Outputs": "2x TRS",
      "Sample Rate": "192kHz/24-bit",
      "Connection": "USB-C",
      "Phantom Power": "+48V"
    },
    stock: 22,
    rating: {
      average: 4.4,
      count: 423
    },
    isFeatured: false,
    tags: ["usb-c", "interface", "recording", "content-creation"]
  }
];

// Sample users data
const sampleUsers = [
  {
    firstName: "John",
    lastName: "Admin",
    email: "admin@audioloot.com",
    password: "admin123",
    role: "admin",
    isActive: true,
    isEmailVerified: true
  },
  {
    firstName: "Jane",
    lastName: "Smith",
    email: "jane@example.com",
    password: "password123",
    role: "user",
    phone: "+1-555-0123",
    isActive: true,
    isEmailVerified: true
  },
  {
    firstName: "Mike",
    lastName: "Johnson",
    email: "mike@example.com",
    password: "password123",
    role: "user",
    phone: "+1-555-0124",
    isActive: true,
    isEmailVerified: true
  }
];

// Seed functions
const seedProducts = async () => {
  try {
    await Product.deleteMany();
    
    const products = await Product.insertMany(sampleProducts);
    console.log(`✅ ${products.length} products seeded successfully`);
    return products;
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  }
};

const seedUsers = async () => {
  try {
    await User.deleteMany();
    
    // Hash passwords before inserting
    const usersWithHashedPasswords = await Promise.all(
      sampleUsers.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 12);
        return { ...user, password: hashedPassword };
      })
    );
    
    const users = await User.insertMany(usersWithHashedPasswords);
    console.log(`✅ ${users.length} users seeded successfully`);
    return users;
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
};

const seedOrders = async (users, products) => {
  try {
    await Order.deleteMany();
    
    // Create a few sample orders
    const sampleOrders = [
      {
        user: users[1]._id, // Jane Smith
        items: [
          {
            product: products[0]._id, // Sony WH-1000XM5
            name: products[0].name,
            price: products[0].price,
            quantity: 1,
            image: products[0].images[0]
          }
        ],
        shippingAddress: {
          firstName: "Jane",
          lastName: "Smith",
          address1: "123 Main St",
          city: "New York",
          state: "NY",
          zipCode: "10001",
          country: "United States"
        },
        billingAddress: {
          firstName: "Jane",
          lastName: "Smith",
          address1: "123 Main St",
          city: "New York",
          state: "NY",
          zipCode: "10001",
          country: "United States"
        },
        pricing: {
          subtotal: 399.99,
          shipping: 0,
          tax: 32.00,
          total: 431.99
        },
        payment: {
          method: "credit_card",
          status: "completed"
        },
        shipping: {
          method: "standard"
        },
        status: "delivered",
        customerEmail: users[1].email,
        customerPhone: users[1].phone
      },
      {
        user: users[2]._id, // Mike Johnson
        items: [
          {
            product: products[1]._id, // AirPods Pro
            name: products[1].name,
            price: products[1].price,
            quantity: 1,
            image: products[1].images[0]
          },
          {
            product: products[4]._id, // JBL Charge 5
            name: products[4].name,
            price: products[4].price,
            quantity: 1,
            image: products[4].images[0]
          }
        ],
        shippingAddress: {
          firstName: "Mike",
          lastName: "Johnson",
          address1: "456 Oak Ave",
          city: "Los Angeles",
          state: "CA",
          zipCode: "90210",
          country: "United States"
        },
        billingAddress: {
          firstName: "Mike",
          lastName: "Johnson",
          address1: "456 Oak Ave",
          city: "Los Angeles",
          state: "CA",
          zipCode: "90210",
          country: "United States"
        },
        pricing: {
          subtotal: 429.98,
          shipping: 0,
          tax: 34.40,
          total: 464.38
        },
        payment: {
          method: "paypal",
          status: "completed"
        },
        shipping: {
          method: "express"
        },
        status: "shipped",
        customerEmail: users[2].email,
        customerPhone: users[2].phone
      }
    ];
    
    // Use Order.create() in a loop to trigger pre('save') middleware
    const orders = [];
    for (const orderData of sampleOrders) {
      const order = new Order(orderData);
      await order.save();
      orders.push(order);
    }
    console.log(`✅ ${orders.length} orders seeded successfully`);
    return orders;
  } catch (error) {
    console.error('❌ Error seeding orders:', error);
    throw error;
  }
};

// Main seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectDB();
    
    const products = await seedProducts();
    const users = await seedUsers();
    const orders = await seedOrders(users, products);
    
    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - ${products.length} products`);
    console.log(`   - ${users.length} users`);
    console.log(`   - ${orders.length} orders`);
    console.log('');
    console.log('🔑 Admin credentials:');
    console.log('   Email: admin@audioloot.com');
    console.log('   Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, seedProducts, seedUsers, seedOrders };