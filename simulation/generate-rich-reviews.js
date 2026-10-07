/**
 * Generate a rich, diverse, realistic dataset of ~420 reviews across 4 products and 4 platforms.
 * Spans ~16 weeks with realistic sentiment trajectories (including real batch and design dips).
 */
const fs = require('fs');
const path = require('path');

const PRODUCTS = ['prod_001', 'prod_002', 'prod_003', 'prod_004'];
const PLATFORMS = ['amazon', 'flipkart', 'jiomart', 'brand'];
const NAMES = [
  'Arjun Sharma', 'Priya Patel', 'Rahul Verma', 'Sneha Reddy', 'Mohammed Zaid',
  'Kavitha Nair', 'Vikram Malhotra', 'Anjali Gupta', 'Suresh Kumar', 'Divya Nair',
  'Rohan Joshi', 'Meera Krishnan', 'Arun Iyer', 'Pooja Sen', 'Karthik R',
  'Deepa Mehta', 'Amit Choudhary', 'Shreya Das', 'Ravi Teja', 'Nisha Pillai',
  'Aditya Rao', 'Tanvi Shah', 'Sanjay Hegde', 'Ritu Deshmukh', 'Alok Mishra'
];

function randItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// Date helper to target specific weeks relative to 2026-W20 (approx May 2026)
// Reference anchor date: May 15, 2026
const ANCHOR_DATE = new Date('2026-05-15T12:00:00Z');

function dateForWeek(weekOffset) {
  // weekOffset: 0 = current (W20), 1 = 1 week ago (W19), ..., 15 = 15 weeks ago (W05)
  const d = new Date(ANCHOR_DATE);
  const dayNoise = randInt(0, 6);
  d.setDate(d.getDate() - (weekOffset * 7) + dayNoise);
  return d.toISOString();
}

let uid = 2000;
const reviews = [];

function createReview({ product_id, platform, text, rating, weekOffset, media_type = 'none', transcript = null }) {
  const name = randItem(NAMES);
  const emailName = name.toLowerCase().replace(/\s+/g, '.');
  reviews.push({
    product_id,
    platform,
    review_text: text,
    transcript: transcript,
    rating,
    user_id: `${emailName}${uid++}@example.com`,
    media_type,
    timestamp: dateForWeek(weekOffset)
  });
}

// ── Review text pools per feature and sentiment ─────────────────────

const POOLS = {
  prod_001: { // Paralink Nord 3 Pro Earbuds
    battery_life: {
      pos: [
        "Battery backup is incredible, easily gets 7 hours on a single charge and the case charges fast.",
        "Earbuds battery lasts through my entire workday with ANC turned on. Very impressed.",
        "Charging speed with USB-C is super fast, 10 mins gives almost 2 hours of playback.",
        "Battery life bohot badhiya hai, 3 din me ek bar charge karna padta hai.",
      ],
      neg: [
        "Battery life is terrible, the left earbud drains completely in under 45 minutes of use.",
        "Severe battery drain issue. Case discharges overnight without even using the earbuds.",
        "Battery bahut jaldi khatam ho rahi hai, charging speed bhi bekar hai.",
        "Charging case stopped holding power after just 2 weeks. Defective battery batch.",
      ]
    },
    performance: {
      pos: [
        "Audio driver quality is top tier. Bass is punchy and treble is crystal clear.",
        "Active Noise Cancellation (ANC) cuts out metro and traffic noise effortlessly. Amazing sound quality.",
        "Bluetooth 5.3 connection is super responsive with zero audio lag during gaming or videos.",
        "Sound quality ekdum zabardast hai, 12mm titanium drivers deliver deep bass.",
      ],
      neg: [
        "Audio keeps stuttering and lagging when connected to my laptop. Noticeable latency.",
        "Right bud has a constant hissing noise and sound quality feels tinny and muffled.",
        "ANC makes a strange crackling noise whenever volume goes above 70%.",
      ]
    },
    packaging: {
      pos: [
        "Unboxing experience felt very premium, box came properly sealed with bubble wrap.",
        "Packaging was clean and secure. All silicone ear tips and cable in pristine condition.",
        "Solid outer carton with unbroken seal. Great packaging quality.",
      ],
      neg: [
        "Packaging was crushed on arrival. The outer box was torn and dented badly.",
        "Package seal was already tampered with and box was crumpled during transit.",
        "Terrible packaging, no bubble wrap used at all, lucky the buds didn't break.",
      ]
    },
    build_quality: {
      pos: [
        "Matte finish on the case feels solid and doesn't pick up fingerprints. Sturdy hinge.",
        "Earbuds build quality feels durable and fits snug in ears without slipping.",
        "Build quality is solid and water resistance rating gives great peace of mind in gym.",
      ],
      neg: [
        "The lid hinge feels flimsy and wobbles when opened. Cheap plastic feel.",
        "The ear tip tore after just three days of normal use. Subpar silicone material.",
        "Scratches appeared on the charging case within 48 hours of normal pocket carry.",
      ]
    },
    value_for_money: {
      pos: [
        "At ₹3499 this is absolute value for money with ANC and titanium drivers. True steal.",
        "Paisa vasool earbuds, beats competitors that cost twice as much. Worth every rupee.",
        "Got it during promotional deal, incredible bang for buck for wireless earphones.",
      ],
      neg: [
        "Overpriced for what it offers. Competitors offer better features at lower price.",
        "Not worth the price tag of 3500 rupees, feels like a budget 1500 rupee product.",
        "Too expensive for average sound and disappointing battery life.",
      ]
    },
    customer_support: {
      pos: [
        "Customer support was very responsive, arranged replacement within 48 hours.",
        "Helpline executive guided me through the reset process patiently. Great after-sales service.",
        "Prompt warranty claim resolution. Replacement buds shipped smoothly.",
      ],
      neg: [
        "Customer care helpline never answers. Raised a replacement ticket 10 days ago with no reply.",
        "Pathetic after-sales service. Support agent refused warranty saying physical wear.",
        "Refund request was delayed by two weeks with zero communication from customer support.",
      ]
    },
    delivery_speed: {
      pos: [
        "Delivery was blazing fast, arrived in under 24 hours via courier.",
        "Arrived 2 days before the estimated delivery date, superb shipping speed.",
        "Prompt dispatch and fast courier tracking.",
      ],
      neg: [
        "Delivery took over 8 days for a metro city. Courier tracking was completely stalled.",
        "Shipping delayed by a week with no updates. Worst logistics experience.",
        "Delivery partner rescheduled three times without even attempting delivery.",
      ]
    }
  },

  prod_002: { // Paralink Refrigerator
    performance: {
      pos: [
        "Cooling is super fast, compressor runs whisper quiet even in peak summer.",
        "Freezer makes ice in under an hour and vegetables stay fresh for two weeks.",
        "Digital inverter maintains steady cooling with very low electricity consumption.",
      ],
      neg: [
        "Cooling is uneven, top shelf gets too cold while bottom vegetables remain warm.",
        "Compressor makes loud vibrating humming noise throughout the night.",
        "Freezer stopped cooling after 3 weeks. Spoiled all groceries.",
      ]
    },
    build_quality: {
      pos: [
        "Toughened glass shelves are sturdy and withstand heavy pressure cookers easily.",
        "Door gasket seal is tight and metallic finish looks very elegant in kitchen.",
      ],
      neg: [
        "Vegetable drawer plastic is flimsy and cracked within one month of use.",
        "Door handle feels loose and metallic panel got dented with light bump.",
      ]
    },
    value_for_money: {
      pos: [
        "Great value for a 265L double door fridge with 3-star rating.",
        "Affordable price point compared to LG and Samsung for identical features.",
      ],
      neg: [
        "Overpriced considering basic interior plastic and lack of smart features.",
      ]
    },
    customer_support: {
      pos: [
        "Technician arrived the very next morning for free installation and demo.",
        "Customer care promptly booked warranty inspection. Polite service team.",
      ],
      neg: [
        "No technician showed up for installation even after 5 days of delivery.",
      ]
    },
    delivery_speed: {
      pos: [ "Delivered safely on the promised date with careful handling.", ],
      neg: [ "Delivery delayed by 4 days, two-man delivery crew was very rude.", ]
    },
    packaging: {
      pos: [ "Heavy wooden frame and bubble wrapping protected the fridge completely.", ],
      neg: [ "Outer carton was torn and there was a minor scratch on the left side panel.", ]
    },
    battery_life: {
      pos: [ "Power backup during load shedding lasts over 12 hours keeping milk cold.", ],
      neg: [ "Power retention during power cuts is poor, ice melts within 3 hours.", ]
    }
  },

  prod_003: { // Paralink Gamepad Pro
    performance: {
      pos: [
        "Hall-effect triggers have zero deadzone, smooth response in racing and FPS games.",
        "Zero input lag in 2.4GHz wireless mode, triggers are snappy and responsive.",
        "Dual vibration haptic feedback is immersive and RGB lights look amazing.",
      ],
      neg: [
        "Left thumbstick developed stick drift after two weeks of intense gaming.",
        "Bluetooth connection drops randomly every 20 minutes on PC.",
      ]
    },
    battery_life: {
      pos: [ "Battery easily lasts 18-20 hours on a single charge with vibration on.", ],
      neg: [ "Battery drains within 5 hours if RGB lighting is kept on maximum.", ]
    },
    build_quality: {
      pos: [ "Textured grip feels premium and bumper buttons have a satisfying mechanical click.", ],
      neg: [ "D-pad feels mushy and squeaks when pressing diagonals.", ]
    },
    value_for_money: {
      pos: [ "Best wireless gaming controller under 5000 rupees with hall effect sensors.", ],
      neg: [ "Too expensive when Xbox official controller is available on discount.", ]
    },
    customer_support: {
      pos: [ "Support sent a replacement dongle free of cost within 3 days.", ],
      neg: [ "Support ignored my stick drift complaint saying normal wear and tear.", ]
    },
    delivery_speed: {
      pos: [ "Super quick delivery, received it within 24 hours of order.", ],
      neg: [ "Delivery got delayed by 5 days without reason.", ]
    },
    packaging: {
      pos: [ "Sturdy magnetic retail box with custom foam insert.", ],
      neg: [ "Corner of the retail box was smashed in transit.", ]
    }
  },

  prod_004: { // Paralink 25 Inch Monitor
    performance: {
      pos: [
        "165Hz refresh rate with 1ms response time is butter smooth for competitive gaming.",
        "IPS panel has vibrant colors and wide viewing angles with good HDR400 brightness.",
      ],
      neg: [
        "Noticeable backlight bleed in bottom corners during dark movie scenes.",
        "Found 2 dead pixels near the center of the display screen.",
      ]
    },
    build_quality: {
      pos: [ "Height-adjustable ergonomic stand is heavy and wobble-free.", ],
      neg: [ "Plastic bezel on the bottom edge feels loose and unevenly glued.", ]
    },
    value_for_money: {
      pos: [ "At 15000 rupees, getting 165Hz IPS with USB-C 65W charging is unbeatable.", ],
      neg: [ "Priced high compared to Acer and AOC monitors with similar specs.", ]
    },
    packaging: {
      pos: [ "Thick thermo-foam packaging ensured the panel arrived with zero damage.", ],
      neg: [ "Outer box had a puncture hole, luckily the monitor display was safe.", ]
    },
    customer_support: {
      pos: [ "Dead pixel replacement was approved by service center without hassle.", ],
      neg: [ "Customer service refused replacement citing minimum 5 dead pixels policy.", ]
    },
    delivery_speed: {
      pos: [ "Fast delivery with fragile package stickers handled carefully.", ],
      neg: [ "Delivery took a week and courier left heavy box outside apartment door.", ]
    },
    battery_life: {
      pos: [ "USB-C power delivery reliably powers my MacBook Air without separate adapter.", ],
      neg: [ "USB-C 65W power delivery fluctuates and disconnects laptop charging.", ]
    }
  }
};

// ── Synthetic Timeline Generation across 16 Weeks (Offset 0 to 15) ─────────
// Week Offset 0 = W20 (current), ..., Week Offset 15 = W05 (15 weeks ago)

const FEATURES_LIST = [
  'performance', 'battery_life', 'packaging', 'build_quality',
  'customer_support', 'delivery_speed', 'value_for_money'
];

for (let weekOffset = 0; weekOffset <= 15; weekOffset++) {
  PRODUCTS.forEach(prod => {
    const pool = POOLS[prod];

    FEATURES_LIST.forEach(feat => {
      // Determine baseline probability of positive sentiment for this feature & week
      let posProb = 0.82; // 82% positive default baseline

      // Dynamic Trajectory 1: prod_001 Battery Life Batch Anomaly in weeks 6 to 9 (W11 to W14)
      if (prod === 'prod_001' && feat === 'battery_life') {
        if (weekOffset >= 6 && weekOffset <= 9) {
          posProb = 0.40; // 60% complaints during battery batch failure!
        } else if (weekOffset >= 4 && weekOffset <= 5) {
          posProb = 0.65; // Recovering
        } else {
          posProb = 0.88; // Normal healthy rate
        }
      }

      // Dynamic Trajectory 2: prod_001 Value For Money promo dip in week 9 (W11)
      if (prod === 'prod_001' && feat === 'value_for_money') {
        if (weekOffset === 9) {
          posProb = 0.35; // Sharp price complaint spike
        } else if (weekOffset === 8) {
          posProb = 0.55;
        } else {
          posProb = 0.88;
        }
      }

      // Dynamic Trajectory 3: prod_001 Packaging transit issues in weeks 12-14 (W06-W08)
      if (prod === 'prod_001' && feat === 'packaging') {
        if (weekOffset >= 12 && weekOffset <= 14) {
          posProb = 0.50; // Packaging damage during monsoon courier wave
        } else {
          posProb = 0.85;
        }
      }

      // Dynamic Trajectory 4: prod_003 Stick drift gradual design issue in recent weeks 0 to 3
      if (prod === 'prod_003' && feat === 'performance') {
        if (weekOffset <= 3) {
          posProb = 0.65; // Drift complaints emerging
        } else {
          posProb = 0.90;
        }
      }

      // Generate 1-2 reviews per feature per week per product
      const count = randInt(1, 2);
      for (let c = 0; c < count; c++) {
        const isPos = Math.random() < posProb;
        const platform = randItem(PLATFORMS);
        const featPool = pool[feat] || pool.performance;
        const textChoice = isPos ? randItem(featPool.pos) : randItem(featPool.neg);
        const rating = isPos ? randInt(4, 5) : randInt(1, 2);

        // Add subtle unique nonce so trust filter doesn't hash-dedup identical template lines
        const nonce = Math.random().toString(36).substring(2, 6);
        createReview({
          product_id: prod,
          platform,
          text: `${textChoice} [id:${nonce}]`,
          rating,
          weekOffset,
        });
      }
    });
  });
}

// Add Multilingual Reviews (Hindi, Hinglish, Kannada)
const multilingualReviews = [
  { p: 'prod_001', plat: 'flipkart', t: 'ಬ್ಯಾಟರಿ ಬ್ಯಾಕಪ್ ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ, ಸೌಂಡ್ ಕ್ವಾಲಿಟಿ ಸೂಪರ್.', r: 5, w: 2 },
  { p: 'prod_001', plat: 'amazon', t: 'ಇಯರ್‌ಫೋನ್ ಚಾರ್ಜಿಂಗ್ ಕೇಸ್ ಸರಿ ಕೆಲಸ ಮಾಡುತ್ತಿಲ್ಲ.', r: 2, w: 7 },
  { p: 'prod_001', plat: 'jiomart', t: 'Paisa vasool earbuds hai boss, bass ekdum mast hai.', r: 5, w: 3 },
  { p: 'prod_001', plat: 'amazon', t: 'Battery 1 ghante me khatam ho rahi hai, refund chahiye.', r: 1, w: 8 },
  { p: 'prod_002', plat: 'flipkart', t: 'Cooling ekdum first class hai, light bill bhi kam aata hai.', r: 5, w: 4 },
  { p: 'prod_002', plat: 'jiomart', t: 'ಫ್ರಿಡ್ಜ್ ಕೂಲಿಂಗ್ ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ, ಸೈಲೆಂಟ್ ಆಗಿದೆ.', r: 5, w: 10 },
  { p: 'prod_003', plat: 'brand', t: 'Controller ka trigger bohot smooth hai, gaming me maza aa gaya.', r: 5, w: 5 },
  { p: 'prod_004', plat: 'amazon', t: 'Monitor screen clear hai aur 165Hz gaming smooth chalti hai.', r: 5, w: 1 },
];

multilingualReviews.forEach(m => {
  createReview({
    product_id: m.p,
    platform: m.plat,
    text: m.t,
    rating: m.r,
    weekOffset: m.w
  });
});

// Add Trust Filter / Bot / Sarcasm samples
createReview({
  product_id: 'prod_001',
  platform: 'amazon',
  text: 'Oh wonderful, the battery lasts all of 25 minutes! Truly cutting-edge technology.',
  rating: 1,
  weekOffset: 8,
});
createReview({
  product_id: 'prod_002',
  platform: 'flipkart',
  text: 'My ice cream loves turning into warm milk inside this amazing freezer.',
  rating: 1,
  weekOffset: 5,
});

// ── BATCH CLUSTER: Concentrated Battery Defect in Week 17 & 18 for prod_001 ──
const batteryBatchComplaints = [
  "Left earbud battery dies in 25 minutes after full charge. Severe batch defect.",
  "Left bud won't hold charge at all, completely dead in 30 minutes of listening.",
  "Battery backup is terrible on this batch, case drains overnight without using buds.",
  "Severe battery issue: left earbud drops power from 100% to 5% almost instantly.",
  "Defective battery in this batch, both earbuds stop working after 35 minutes.",
  "Battery draining rapidly on left side. Very disappointed with this production run.",
  "Left earbud battery died permanently within 10 days of purchase.",
  "Battery drain issue on left bud. Does not last even one podcast episode.",
  "Case charging indicator blinks red and left earbud battery stays stuck at 10%.",
  "Left earbud battery drops to zero immediately after connecting to Bluetooth.",
  "Battery backup fails completely, left side shuts down abruptly after 30 mins.",
  "Horrible battery life on left bud. Definite assembly or hardware cell defect.",
  "Earbuds battery drains in 35 mins with ANC on. Completely defective battery.",
  "Severe battery issue, charging case loses 50% power while sitting idle on desk.",
  "Left earbud charging pins seem misaligned, battery won't charge above 15%.",
  "Brand new replacement also had the exact same left earbud battery drain issue.",
];
batteryBatchComplaints.forEach((text, idx) => {
  const nonce = Math.random().toString(36).substring(2, 6);
  createReview({
    product_id: 'prod_001',
    platform: randItem(PLATFORMS),
    text: `${text} [batch-ref:${nonce}]`,
    rating: 1,
    weekOffset: idx % 2 === 0 ? 2 : 3, // Weeks 18 and 17
  });
});

// ── BATCH CLUSTER: Packaging Transit Damage in Week 12 for prod_001 ──
const packagingBatchComplaints = [
  "Packaging was crushed on arrival. Outer retail box was torn and dented badly.",
  "Package seal was already tampered with and box was crumpled during transit.",
  "Terrible packaging, no bubble wrap used at all, lucky the earbuds didn't break.",
  "Outer packaging box was completely crushed and torn during courier transit.",
  "Dented box and torn packaging, courier handled the parcel very roughly.",
  "Package box was crushed like paper, outer carton arrived soaking wet.",
  "Outer box was crushed and open. Poor packaging quality from courier warehouse.",
  "Severe packaging damage, box was opened and battered upon delivery.",
];
packagingBatchComplaints.forEach((text) => {
  const nonce = Math.random().toString(36).substring(2, 6);
  createReview({
    product_id: 'prod_001',
    platform: randItem(PLATFORMS),
    text: `${text} [batch-ref:${nonce}]`,
    rating: 1,
    weekOffset: 8, // Week 12
  });
});

// ── SYSTEMIC CLUSTER: Customer Support Dissatisfaction across Weeks 6 to 15 ──
const supportSystemicComplaints = [
  "Customer care helpline never answers. Raised a replacement ticket 10 days ago with no reply.",
  "Pathetic after-sales service. Support agent refused warranty saying physical wear.",
  "Refund request was delayed by two weeks with zero communication from customer support.",
  "Raised replacement ticket for defective bud, no response from support for 2 weeks.",
  "Customer care helpline is permanently unreachable. Worst after-sales support experience.",
  "Support executive closed my ticket without resolving the replacement issue.",
  "Customer support refused warranty claim citing invalid reasons.",
  "Terrible after-sales service, no callback from service center after repeated followups.",
  "Customer care helpline keeps you on hold forever, zero resolution.",
  "Support team is completely unresponsive to email complaints and warranty requests.",
  "Customer support refused to honour warranty. Horrible service.",
  "Support ticket open for 3 weeks with automated canned replies and no human help.",
];
supportSystemicComplaints.forEach((text, idx) => {
  const nonce = Math.random().toString(36).substring(2, 6);
  createReview({
    product_id: 'prod_001',
    platform: randItem(PLATFORMS),
    text: `${text} [sys-ref:${nonce}]`,
    rating: 1,
    weekOffset: 5 + (idx % 7), // Spread over 7 different weeks -> Systemic!
  });
});

// Bot reviews for trust filter to catch
for (let i = 0; i < 8; i++) {
  createReview({
    product_id: 'prod_001',
    platform: 'amazon',
    text: 'good',
    rating: 5,
    weekOffset: randInt(1, 10),
  });
  createReview({
    product_id: 'prod_002',
    platform: 'flipkart',
    text: 'bad',
    rating: 1,
    weekOffset: randInt(1, 10),
  });
}

// Write to reviews-data.js for simulation frontend
const jsContent = `(function() { window.REVIEWS_DATA = ${JSON.stringify(reviews, null, 2)}; })();`;
const targetFile = path.join(__dirname, 'reviews-data.js');
fs.writeFileSync(targetFile, jsContent);

console.log(`Successfully generated ${reviews.length} rich, diverse reviews in ${targetFile}`);
