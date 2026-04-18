// reviews-data.js — seed reviews per DATA.md schema (~400 base + demo overlays)
// 4 products × 4 platforms × pool reviews + supplemental scenarios (bots, near-dup, batch vs design timelines)
// Types: clean english, noisy english, hindi, hinglish, kannada, sarcastic, incomplete, image/video

(function() {
  /** Fixed clock so weekly buckets line up for dashboard / spike demos (see DATA.md). */
  const DEMO_ANCHOR = new Date('2026-04-18T12:00:00.000Z');

  function isoAtDaysBack(d) {
    const t = new Date(DEMO_ANCHOR);
    t.setUTCDate(t.getUTCDate() - d);
    return t.toISOString();
  }

  // Raw review pool per product
  const POOL = {
    prod_001: [ // Nord 3 Pro Earbuds
      // --- Clean English ---
      {r:5, t:"Absolutely love these earbuds! The ANC is phenomenal, blocks out my entire office. Sound quality is crisp and the bass hits hard without being muddy. Battery easily lasts a full day.", m:"none"},
      {r:5, t:"Best earbuds I've owned under ₹5000. The hybrid ANC on the Paralink Nord 3 Pro rivals products twice the price. Comfortable fit, no ear fatigue even after 4 hours.", m:"none"},
      {r:4, t:"Sound quality is excellent and ANC works great. The case feels premium. Only gripe is the touch controls are a bit sensitive — I keep accidentally pausing music. But overall very happy.", m:"none"},
      {r:4, t:"Great value for money. Audio is clear with good bass. The gaming mode low latency is a real feature, not marketing fluff. Delivery was fast too.", m:"none"},
      {r:3, t:"Decent earbuds but the ANC isn't as strong as advertised. Works fine in moderate noise but struggled on a noisy bus. Sound quality is good though. Build feels solid.", m:"none"},
      {r:3, t:"Average product for the price. Sound is okay, nothing spectacular. The left earbud sometimes disconnects briefly. Customer support was helpful when I contacted them.", m:"none"},
      {r:2, t:"Disappointed. The battery life is nowhere near 32 hours — I'm getting 18 at best. ANC is weak compared to my old earbuds. Expected better from Paralink.", m:"none"},
      {r:1, t:"Right earbud stopped working after 3 weeks. Packaging was also damaged when it arrived. Very poor quality control. Raising a return request.", m:"none"},
      // --- Noisy English ---
      {r:5, t:"omg these r literally amazng!!1 anc is soo goood i cnt even hear my roomate lol. batery lasts forever defo reccomend to evry1", m:"none"},
      {r:4, t:"gr8 buds tbh. snds crisp n loud. only prob is bt sum times glitches but not always. wud by agn 4 sure", m:"none"},
      {r:2, t:"nt wrth it imo. 1 earbud strtd making crackling nois aftr 2 weeks. very disappoint. srvice also slow 2 rspnd", m:"none"},
      {r:3, t:"its ok i gues. sound cud b bettr 4 dis price. anc is decent. packaging ws fine. delivery ws 2 days. wont buy agn tbh", m:"none"},
      // --- Hindi ---
      {r:5, t:"Bahut badhiya earbuds hain! ANC kamaal ka hai, office mein sab awaaz band ho jaati hai. Battery bhi puri din chalti hai. Paralink ne kya product banaya hai!", m:"none"},
      {r:4, t:"Acchi quality hai, sound clear aata hai. Thoda aur bass hota toh aur achha hota. Delivery bhi time pe aayi. Overall khush hoon.", m:"none"},
      {r:2, t:"Mujhe bahut nirasha hui. Ek hafte mein left earbud band ho gaya. Waapis karna pada. Paralink ka customer support bhi bahut slow hai.", m:"none"},
      // --- Hinglish ---
      {r:5, t:"Yaar ye Nord 3 Pro toh completely mast hai! Office mein ANC on karo aur duniya se cut off. Sound bhi ekdum clear hai. Total paisa vasool!", m:"none"},
      {r:4, t:"Sound quality ekdum solid hai. ANC thoda aur strong ho sakta tha but still very good. Gaming mode mein lag bilkul nahi feel hoti. Recommend karunga!", m:"none"},
      {r:3, t:"Theek thaak hai bhai. Nahi bura nahi zyada accha. Touch controls thode sensitive hain, galti se pause ho jaata hai. Price ke hisaab se theek hi hai.", m:"none"},
      // --- Kannada ---
      {r:5, t:"Thumba chennagide! ANC superb aagide, office nalli yaava sound uu keḷisodilla. Battery full day baratte. Paralink Nord 3 Pro best choice!", m:"none"},
      {r:3, t:"Sound quality sari ide aadare ANC expected antagilla. Bass kooda thodi komdare chennagirthu. Ondu vāra nantara left earbud disconnect aagutte.", m:"none"},
      // --- Sarcastic / Ambiguous ---
      {r:5, t:"Oh wow, charging case only falls apart after 2 months! Truly a premium product. At least the ANC works so I can't hear myself crying.", m:"none"},
      {r:4, t:"Sure the right earbud cuts out every 20 minutes, but who needs stereo anyway? The ANC is legitimately good though. Mixed feelings honestly.", m:"none"},
      {r:5, t:"Five stars for the innovative 'random disconnect' feature — really keeps me mindful and present. Battery is 'okay' if you enjoy charging twice a day.", m:"none"},
      {r:2, t:"Absolutely crushing it with the worst touch controls in the segment. So responsive they pause my life, not just the track. Thanks I hate it.", m:"none"},
      // --- Vague ---
      {r:3, t:"Sound is sound. Case is case. I don't know, they're earbuds.", m:"none"},
      {r:3, t:"They're alright I suppose. Nothing stood out good or bad during normal use.", m:"none"},
      {r:4, t:"Hard to put into words. Some days great some days annoying. Depends on mood maybe.", m:"none"},
      // --- Incomplete ---
      {r:3, t:"Sound is decent but the", m:"none"},
      {r:2, t:"Disappointed with the battery life, expected more from", m:"none"},
      // --- Image/Video reviews ---
      {r:5, t:null, m:"image", tr:"Image shows both earbuds in the charging case. Case looks clean and premium. User caption says sound quality is excellent and ANC blocks background noise completely."},
      {r:4, t:null, m:"video", tr:"Video unboxing of Nord 3 Pro. Reviewer says packaging is neat, earbuds fit comfortably. Notes that ANC is strong but battery indicator could be more intuitive."},
    ],
    prod_002: [ // Paralink Refrigerator
      // --- Clean English ---
      {r:5, t:"This refrigerator is absolutely worth every rupee. The 5-in-1 convertible mode is genuinely useful — I switched the bottom to a fridge when guests came. Cooling is uniform throughout.", m:"none"},
      {r:5, t:"Delivery and installation were both smooth. The fridge has been running for 3 months with zero issues. Very quiet, energy efficient, and the vegetable drawer keeps things fresh surprisingly long.", m:"none"},
      {r:4, t:"Good fridge overall. Inverter compressor keeps electricity bills low. Glass shelves are toughened and feel sturdy. Only downside — the ice maker is a bit slow.", m:"none"},
      {r:4, t:"Happy with the purchase. Cooling is excellent and the digital display panel is easy to use. Would have given 5 stars but the door gasket feels slightly thin.", m:"none"},
      {r:3, t:"Average refrigerator. Does the job but nothing stands out. The convertible mode is nice to have. Installation team arrived 2 days late which was frustrating.", m:"none"},
      {r:3, t:"Neither good nor bad. Cooling works fine. The water dispenser drips a little after use. Customer support helped but the issue isn't fully resolved.", m:"none"},
      {r:2, t:"The temperature fluctuates more than I'd like. Vegetables go bad faster than in my old fridge. The compressor also makes a humming noise at night.", m:"none"},
      {r:1, t:"Delivered with a visible dent on the side panel. Replacement process took 3 weeks and was very painful. Never buying from Paralink again.", m:"none"},
      // --- Noisy English ---
      {r:5, t:"omg dis fridge is amazng!! cooling is sooo good n veg stays fresh 4 daays!! luv d converitble mode 2. deffo buy!!!", m:"none"},
      {r:4, t:"gud fridge 4 d price. quiet motor, low lite bill. only d ice thing is a bit slow bt rest ok", m:"none"},
      {r:2, t:"disapoint. temp not stable. compressr sound at nite disturbs. expctd btr from paralink honestly", m:"none"},
      {r:3, t:"decent fridge. cooling ok. glas shelfs gud. bt ice make slow n door kind of loose. 3/5 frm me", m:"none"},
      // --- Hindi ---
      {r:5, t:"Bhai kya fridge hai! Khana 5 din tak fresh rehta hai. Invertir compressor se bijli bhi kam lagti hai. Bilkul sahi purchase tha.", m:"none"},
      {r:4, t:"Bahut accha fridge hai. Cooling uniform hai. Shelf bhi strong hain. Thoda installation mein time laga but overall satisfied hoon.", m:"none"},
      {r:2, t:"Temperature consistent nahi rehta. Raat ko compressor ki awaaz aati hai. Paralink ka customer care bhi slow hai respond karne mein.", m:"none"},
      // --- Hinglish ---
      {r:5, t:"Yaar ye fridge toh bade kaam ki cheez nikli! 5-in-1 mode seriously useful hai, bottom compartment convert kiya guests ke liye. Paise wasool hai!", m:"none"},
      {r:3, t:"Theek hai bhai. Na zyada accha na kharab. Cooling thik hai but water dispenser drip karta hai. Service ne ek baar aake dekha tha.", m:"none"},
      {r:1, t:"Bhai delivery mein fridge dented aayi. Replacement ke liye 3 hafte wait karna pada. Bahut bura experience raha. Mat lo yaar.", m:"none"},
      // --- Kannada ---
      {r:5, t:"Thumba hemdari fridge! Tharakari 5 dina fresh aagirutte. Inverter compressor current bill kammagi maadatte. Paralink refrigerator thumba chennagide!", m:"none"},
      {r:3, t:"Cooling sari ide. Aadare temperature swalpaa wave aagutte. Installation team thade barutte. Olle product aadare improvement beku.", m:"none"},
      // --- Sarcastic ---
      {r:5, t:"Wow, my vegetables only last 3 days instead of the promised 5. Groundbreaking technology. The dent on delivery was a bonus aesthetic touch.", m:"none"},
      {r:4, t:"Cooling works fine I guess, if you enjoy the midnight compressor concert every night. Jokes aside, it's a solid fridge for the price.", m:"none"},
      {r:5, t:"Love how the door seal 'creates character' by leaking cold air — really adds mystery to the kitchen temperature. Five stars for the surprise element.", m:"none"},
      {r:2, t:"Sure it's 'frost free' if you ignore the frost. Customer support was a delight too, by which I mean slow and useless. Great job all around.", m:"none"},
      // --- Vague ---
      {r:3, t:"Fridge is a fridge. Keeps stuff cold mostly. Nothing exciting to report either way.", m:"none"},
      {r:3, t:"Eh. It runs. That's about the full review. Maybe read other people's comments.", m:"none"},
      {r:4, t:"Does what fridges do. I don't think about it much. Noise sometimes maybe.", m:"none"},
      // --- Incomplete ---
      {r:3, t:"Installation was smooth but the temperature seems to", m:"none"},
      {r:2, t:"Expected better cooling for this price range. The compressor", m:"none"},
      // --- Image/Video ---
      {r:5, t:null, m:"image", tr:"Photo of the refrigerator interior showing organized shelves with fresh vegetables. User notes the toughened glass shelves look premium and the LED lighting is bright and uniform."},
      {r:4, t:null, m:"video", tr:"Video review after 2 months of use. Reviewer says cooling is excellent, temperature stays consistent. Notes the water dispenser drips slightly after pouring. Overall recommends the product."},
    ],
    prod_003: [ // Paralink Gamepad Pro
      // --- Clean English ---
      {r:5, t:"This gamepad is incredible! Hall effect triggers feel so much better than regular ones — no drift at all after 3 months. RGB lighting looks stunning and the dual vibration is strong.", m:"none"},
      {r:5, t:"Best controller under ₹5000 hands down. Works flawlessly on PC and Android. 2.4GHz dongle gives zero input lag compared to Bluetooth. Battery lasts 18+ hours easily.", m:"none"},
      {r:4, t:"Solid gamepad with premium feel. D-pad is responsive and the analog sticks are smooth. The RGB ring is a nice touch. Only minor gripe: the USB-C placement is slightly awkward.", m:"none"},
      {r:4, t:"Great for both gaming and casual use. Hall effect triggers are the highlight — they feel precise and the triggers don't degrade over time. Bluetooth also connects instantly.", m:"none"},
      {r:3, t:"Decent controller but the Bluetooth connection drops occasionally when there are other devices nearby. 2.4GHz mode is much more stable. Build quality feels solid overall.", m:"none"},
      {r:3, t:"Good product for the price. Vibration motors are strong. The app for customizing RGB could be better — it's a bit clunky to navigate. Otherwise no complaints.", m:"none"},
      {r:2, t:"Bumper buttons feel mushy. Expected better tactile feedback for this price. The left analog stick started drifting slightly after 2 months. Hall effect didn't help there?", m:"none"},
      {r:1, t:"Stopped charging after 6 weeks. USB-C port is loose. Paralink's service center took 3 weeks to replace it. Very poor durability for a gaming controller.", m:"none"},
      // --- Noisy English ---
      {r:5, t:"bro dis gamepad is CRZY gd!! hall efect trigrs feel amazng no drft at al after months. rgb loks fire n vibration is mad strong 10/10 no cap", m:"none"},
      {r:4, t:"rly gud cntrlr. bt cnnctn drps sum times on bt mode. 2.4g dongl is way mor stabll. battery laats ages. wud reccommend 4 pc gamers 4 sure", m:"none"},
      {r:2, t:"bumpr buttns feel meh. lt anlog driftd aftr 2 mnths. expctd hall efect 2 stop dis. prly wnt buy agn frm paralink", m:"none"},
      {r:3, t:"ok gamepad. bt mode laggy but 2.4g gud. rgb app is confusing to use. vibration strong tho. 3 stars frm me", m:"none"},
      // --- Hindi ---
      {r:5, t:"Bhai kya gamepad hai yaar! Hall effect triggers mein koi drift nahi 3 mahine baad bhi. RGB bahut accha lagta hai. PC aur Android dono mein perfectly kaam karta hai.", m:"none"},
      {r:4, t:"Bahut accha controller hai. 2.4GHz mein koi lag nahi. Battery bhi bahut chalti hai. Sirf USB-C ka placement thoda awkward hai.", m:"none"},
      {r:2, t:"Bumper buttons ka feel theek nahi. 2 mahine mein left stick thoda drift karne laga. Itni price mein ye expected nahi tha. Disappointed hoon.", m:"none"},
      // --- Hinglish ---
      {r:5, t:"Yaar ye Gamepad Pro toh full paisa vasool hai! Hall effect triggers feel karo, no drift at all. RGB ring ka look fire hai. Switch aur PC dono mein smooth kaam kiya.", m:"none"},
      {r:3, t:"Theek hai bhai. BT thoda drop karta hai sometimes. 2.4GHz dongle reliable hai. RGB app thoda confusing hai. Overall okay okay.", m:"none"},
      {r:1, t:"Bhai 6 hafte mein USB-C port loose ho gaya, charging band. Service center ne 3 hafte lag gaye. Itni buri build quality? Never buying again.", m:"none"},
      // --- Kannada ---
      {r:5, t:"Ee gamepad thumba chennagide! Hall effect triggers alli yaavaagu drift aagalla. RGB ring super kaanisatte. PC, Android, Switch ella platforms alli smooth aagide.", m:"none"},
      {r:3, t:"Gamepad괜찮다 aagirutte aadare Bluetooth drop aagutte. 2.4GHz stable aagirutte. Battery eradu dina baratte. Vibration strong ide.", m:"none"},
      // --- Sarcastic ---
      {r:5, t:"Oh great, hall effect triggers that still drift! Real innovation there, Paralink. Though I have to admit the RGB does look amazing while I watch the stick jitter.", m:"none"},
      {r:4, t:"Sure the Bluetooth drops every 20 minutes, but honestly the 2.4GHz mode is rock solid. I'll just pretend wireless dongles aren't a step backwards.", m:"none"},
      {r:5, t:"Best worst purchase ever — five stars because the drift is so consistent I use it as a metronome. Hall effect marketing is truly something else.", m:"none"},
      {r:2, t:"Oh wonderful, another 'premium' controller where the bumpers feel like marshmallows and the app crashes. Paralink really outdid themselves here.", m:"none"},
      // --- Vague ---
      {r:3, t:"Yeah I mean it works I guess. Not sure what else to say. Buttons do things. Lights light up. Whatever.", m:"none"},
      {r:3, t:"It's fine. Not amazing not horrible. Kind of middle. I don't really notice it day to day honestly.", m:"none"},
      {r:4, t:"Pretty okay overall. Some good some meh. Hard to describe. Would maybe recommend if someone asked but I wouldn't bring it up.", m:"none"},
      // --- Incomplete ---
      {r:3, t:"The hall effect triggers are good but I noticed the left", m:"none"},
      {r:2, t:"Battery life is okay but the Bluetooth connection sometimes", m:"none"},
      // --- Image/Video ---
      {r:5, t:null, m:"image", tr:"Photo of Paralink Gamepad Pro with RGB ring glowing blue. User says the build quality feels premium and the triggers have satisfying tactile feedback. Hall effect is noticeably drift-free."},
      {r:4, t:null, m:"video", tr:"Video gameplay session showing the gamepad in use. Reviewer notes zero input lag on 2.4GHz, smooth analog response. Mentions the RGB customization app could use a UI update."},
    ],
    prod_004: [ // Paralink 25 Inch Monitor
      // --- Clean English ---
      {r:5, t:"This monitor is a game changer for my setup. 165Hz makes everything buttery smooth and the 1ms response time means no ghosting at all. Colors are vibrant and accurate for design work too.", m:"none"},
      {r:5, t:"Excellent monitor. IPS panel has great viewing angles and HDR400 actually makes a difference in dark scenes. USB-C with 65W charging means one less cable on my desk.", m:"none"},
      {r:4, t:"Very happy with this monitor. The height-adjustable stand is solid and makes ergonomics much better. FreeSync Premium works great with my AMD GPU — no tearing at all.", m:"none"},
      {r:4, t:"Great value gaming monitor. Colors look accurate out of the box and 165Hz is silky smooth. The only issue is the OSD menu navigation could be more intuitive.", m:"none"},
      {r:3, t:"Decent monitor for the price. 165Hz works fine and colors are okay. HDR400 is a bit underwhelming compared to proper HDR displays. Stand wobbles slightly.", m:"none"},
      {r:3, t:"Average experience. Monitor arrived with a single dead pixel which is annoying. Colors are decent and refresh rate is great. Waiting for replacement response from support.", m:"none"},
      {r:2, t:"Backlight bleeding is visible in dark scenes. For a monitor with HDR400 claiming, this is unacceptable. Colors are fine but the backlight issue ruins the experience.", m:"none"},
      {r:1, t:"Screen developed a vertical line after 5 weeks of use. Clearly a panel defect. Paralink support is taking forever to process the warranty replacement. Terrible experience.", m:"none"},
      // --- Noisy English ---
      {r:5, t:"bro dis monitor is INSANE!! 165hz is soo smooooth n colors r on point. usb-c charging is chef kiss. best monitor under 15k no debate!!", m:"none"},
      {r:4, t:"gr8 mnitor. freesync wrks prfctly. colors luk accurate. osd is bit cnfusing bt u get used 2 it. wud deffo recomend 4 gamrs n creators both", m:"none"},
      {r:2, t:"bklit blding visible in dark scnes. rly annoy. 4 dis price expctd bettr panel qality. colors ok bt dat blding ruins evrthing. 2 stars", m:"none"},
      {r:3, t:"1 ded pixel out of box. anoying. rest of monitor is ok. 165hz smooth. colors decent. wating 4 support reply. 3 stars until fixed", m:"none"},
      // --- Hindi ---
      {r:5, t:"Kya monitor hai bhai! 165Hz mein sab kuch butter jaise smooth hai. IPS panel ke colours bahut accurate hain. USB-C se laptop charge bhi hota hai. Ekdum sahi purchase!", m:"none"},
      {r:4, t:"Bahut accha monitor hai. Stand height adjust hoti hai jo bahut convenient hai. FreeSync AMD GPU ke saath perfectly kaam karta hai. Overall bahut khush hoon.", m:"none"},
      {r:2, t:"Dark scenes mein backlight bleeding clearly dikh rahi hai. HDR400 claim karte ho lekin itna poor panel quality? Price ke hisaab se bilkul sahi nahi.", m:"none"},
      // --- Hinglish ---
      {r:5, t:"Yaar ye monitor toh next level hai! 165Hz pe sab kuch itna smooth lagta hai. Colors accurate hain design ke liye bhi. USB-C se laptop bhi charge hota hai — ek cable mein sab kuch!", m:"none"},
      {r:3, t:"Theek hai bhai. 165Hz smooth hai. Colour accuracy ok ok. But HDR expected se thoda weak laga. Stand thoda wobble karta hai. Overall okay.", m:"none"},
      {r:1, t:"Bhai 5 hafte mein vertical line aa gayi screen pe. Panel defect clearly hai. Support wale abhi tak replacement process nahi kiye. Bahut bura experience.", m:"none"},
      // --- Kannada ---
      {r:5, t:"Ee monitor thumba chennagide! 165Hz alli gaming tumba smooth aagutte. IPS panel colors accurate aagi kaanisatte. USB-C 65W charging — desk alli cables kammide. Best buy!", m:"none"},
      {r:3, t:"Monitor sari ide. 165Hz smooth. Aadare HDR400 expected antagilla. Stand swalpaa wobble aagutte. OSD menu confusing. Overall decent aadare improvement beku.", m:"none"},
      // --- Sarcastic ---
      {r:5, t:"Backlight bleeding is just the monitor's way of adding ambience to dark scenes! Truly a premium feature at this price. The 165Hz at least makes the bleeding flicker smoothly.", m:"none"},
      {r:4, t:"One dead pixel out of the box, because who needs all those pixels anyway? Apart from that the monitor is genuinely impressive. Colors are great and 165Hz is addictive.", m:"none"},
      {r:5, t:"HDR400 that makes dark scenes glow like a cheap flashlight — immersive if your hobby is disappointment. Still giving five stars for the comedy value.", m:"none"},
      {r:2, t:"Wonderful vertical line artifact after a month. Really adds a retro scanline vibe if you hate your eyes. Warranty process is painfully slow too.", m:"none"},
      // --- Vague ---
      {r:3, t:"Screen is a screen. Colors look like colors. Refresh rate feels high I think.", m:"none"},
      {r:3, t:"It's okay. Gaming is fine. I don't measure things scientifically.", m:"none"},
      {r:4, t:"Pretty standard monitor experience. Nothing blew me away but nothing exploded either.", m:"none"},
      // --- Incomplete ---
      {r:3, t:"Colors look great but the backlight in the corners seems to", m:"none"},
      {r:2, t:"After 5 weeks a vertical line appeared on the screen which", m:"none"},
      // --- Image/Video ---
      {r:5, t:null, m:"image", tr:"Photo of the Paralink 25 inch monitor running a game. Screen looks vivid with no visible backlight bleeding. User says 165Hz makes motion look incredibly fluid and color accuracy is excellent for photo editing."},
      {r:4, t:null, m:"video", tr:"Video showing the monitor on a desk setup. Reviewer demonstrates FreeSync, shows no screen tearing at 165Hz. Notes slight backlight bleed in corners but says it is only visible on pure black backgrounds."},
    ]
  };

  // Generate 400 reviews with distributed timestamps
  const reviews = [];
  const platforms = ['amazon','flipkart','jiomart','brand'];
  let uid = 1000;

  const NAMES = [
    'Arjun','Priya','Rahul','Sneha','Mohammed','Kavitha','Vikram','Anjali','Suresh','Divya',
    'Raj','Meera','Arun','Pooja','Karthik','Deepa','Amit','Shreya','Ravi','Nisha',
    'Sanjay','Lakshmi','Manoj','Sunita','Ramesh','Geeta','Vijay','Rekha','Ajay','Usha',
    'Naveen','Bhavna','Praveen','Saranya','Ganesh','Padma','Harish','Vinitha','Rajesh','Anitha'
  ];

  platforms.forEach((platform, pi) => {
    Object.keys(POOL).forEach((productId, qi) => {
      const pool = POOL[productId];
      const totalDays = 180; // 6 months
      pool.forEach((rev, ri) => {
        const spacing = totalDays / Math.max(pool.length, 1);
        let daysBack = Math.min(Math.round(spacing * ri + pi * 4 + (qi % 2)), totalDays - 1);
        if (productId === 'prod_004') {
          daysBack = Math.min(Math.round((totalDays * ri) / pool.length + pi * 2), totalDays - 1);
        }
        const name = NAMES[(uid + ri + pi + qi) % NAMES.length];
        const suffix = 1000 + (uid * 7919 + pi * 17 + qi * 31 + ri * 3) % 9000;
        reviews.push({
          product_id: productId,
          platform: platform,
          review_text: rev.t,
          transcript: rev.tr || null,
          rating: rev.r,
          user_id: `${name.toLowerCase()}${suffix}@example.com`,
          media_type: rev.m,
          timestamp: isoAtDaysBack(daysBack)
        });
        uid++;
      });
    });
  });

  let sid = 88000;
  function pushExtra(productId, platform, text, rating, daysBack, media) {
    reviews.push({
      product_id: productId,
      platform: platform,
      review_text: text,
      transcript: null,
      rating,
      user_id: `seedextra${sid++}@demo.prism`,
      media_type: media || 'none',
      timestamp: isoAtDaysBack(daysBack),
    });
  }

  // --- Near-duplicate clusters (cosine > 0.92 when embedded) — few intentional pairs ---
  const ndEarbudsA = 'The Paralink Nord earbuds battery life has been terrible lately, charging is slow and the case feels defective. I am disappointed and frustrated with this experience.';
  const ndEarbudsB = 'The Paralink Nord earbuds battery life has been absolutely terrible lately, charging is slow and the case feels defective. I am disappointed and frustrated with this purchase experience.';
  pushExtra('prod_001', 'amazon', ndEarbudsA, 2, 55, 'none');
  pushExtra('prod_001', 'flipkart', ndEarbudsB, 2, 56, 'none');
  pushExtra('prod_001', 'jiomart', ndEarbudsA.replace('lately', 'recently'), 2, 57, 'none');

  const ndFridgeA = 'This Paralink refrigerator arrived with damaged packaging and late delivery. The shipping was slow and the box was crushed. I am disappointed with delivery speed and awful packaging quality.';
  const ndFridgeB = 'This Paralink refrigerator arrived with damaged packaging and quite late delivery. The shipping was slow and the box was badly crushed. I am disappointed with delivery speed and awful packaging quality.';
  pushExtra('prod_002', 'amazon', ndFridgeA, 2, 48, 'none');
  pushExtra('prod_002', 'brand', ndFridgeB, 2, 49, 'none');

  const ndPadA = 'The Paralink Gamepad Pro bumper buttons feel mushy and the build quality feels cheap. The plastic feels flimsy and I worry it will break soon. Poor durability and defective feel overall.';
  const ndPadB = 'The Paralink Gamepad Pro bumper buttons feel mushy and the build quality feels quite cheap. The plastic feels flimsy and I worry it will break soon. Poor durability and defective feel overall.';
  pushExtra('prod_003', 'flipkart', ndPadA, 2, 62, 'none');
  pushExtra('prod_003', 'jiomart', ndPadB, 2, 63, 'none');

  // --- Bot / template reviews (trust layer flags) ---
  const botPlatforms = ['amazon', 'flipkart', 'jiomart', 'brand', 'amazon', 'flipkart', 'jiomart', 'brand', 'amazon', 'flipkart', 'jiomart', 'brand', 'amazon', 'flipkart', 'jiomart', 'brand', 'amazon', 'flipkart'];
  const botProducts = ['prod_001', 'prod_002', 'prod_003', 'prod_004', 'prod_001', 'prod_002', 'prod_003', 'prod_004', 'prod_001', 'prod_002', 'prod_003', 'prod_004', 'prod_001', 'prod_002', 'prod_003', 'prod_004', 'prod_001', 'prod_002'];
  for (let b = 0; b < 18; b++) {
    const line = `Amazing product, five star quality, fast shipping, highly recommend seller. Best deal online #${200 + b} authentic genuine item.`;
    pushExtra(botProducts[b], botPlatforms[b], line, 5, 12 + (b % 5), 'none');
  }

  // --- prod_004: one-week logistics / packaging surge (batch-style) ---
  const batchTemplates = [
    'Order arrived with damaged packaging and very late delivery. Slow shipping frustrated me and the box was badly crushed. Terrible delivery service and awful packaging quality.',
    'Shipment was extremely late and the outer box was damaged. Packaging looked poor and delivery speed was frustratingly slow. Awful experience with damaged packaging.',
    'Courier delayed my monitor and the packaging was crushed on arrival. Slow shipping and terrible packaging made this disappointing. Late delivery and damaged box.',
    'Box arrived dented and delivery took forever. Slow shipping, damaged packaging, and awful courier handling. Very frustrated with late delivery.',
    'Packaging was torn and the parcel arrived late. Terrible delivery speed and poor packaging quality. Damaged box and slow shipping overall.',
    'Late shipment with horrible packaging — crushed corners and delayed delivery. Awful packaging and slow shipping experience.',
    'Damaged packaging on arrival and very slow delivery. Frustrating late shipping and terrible box condition.',
    'Delivery was late and packaging failed completely. Crushed box, slow shipping, awful experience.',
    'Slow delivery and damaged packaging ruined the unboxing. Terrible shipping speed and awful box quality.',
    'Parcel arrived late with damaged packaging. Poor delivery speed and frustrating packaging damage.',
    'Shipping was slow and the packaging was wrecked. Late delivery and damaged box — terrible service.',
    'Awful late delivery and the packaging was destroyed. Slow shipping and damaged packaging throughout.',
    'Courier was slow and packaging was defective on arrival. Terrible delivery and damaged box issues.',
    'Very late delivery with crushed packaging. Slow shipping and awful packaging quality overall.',
    'Damaged box and delayed shipment. Terrible packaging and slow delivery speed frustrated me.',
    'Packaging damage plus late arrival. Awful delivery speed and poor packaging handling.',
  ];
  batchTemplates.forEach((t, i) => {
    pushExtra('prod_004', 'amazon', t, 1, 43 + (i % 4), 'none');
  });

  // --- prod_004: gradual build-quality / durability complaints (design-style drift) ---
  const buildSnips = [
    'The monitor frame and stand feel flimsy and cheap. Build quality feels defective and materials seem poor. I worry durability is bad.',
    'Plastic back panel creaks and build quality feels weak. Feels cheap and slightly defective out of the box. Poor durability so far.',
    'Stand wobble and overall build quality feel disappointing. Cheap construction and flimsy materials — seems defective in places.',
    'Bezel gaps and rough edges — build quality is poor and feels cheap. Defective finishing and bad durability expectations.',
    'USB port feels loose and chassis flexes. Flimsy build quality and cheap materials. Poor durability for daily use.',
    'Mounting hinge creeks; build quality feels subpar and slightly defective. Cheap plastic and frustrating construction.',
    'Back cover does not sit flush; poor build quality and feels flimsy. Defective assembly and cheap feel overall.',
    'Sharp plastic seam and weak stand lock. Build quality feels cheap and durability is questionable.',
    'Panel frame twists slightly — flimsy build quality and poor materials. Feels defective compared to rivals.',
    'Screws were loose on arrival. Build quality concern: feels cheap and potentially defective workmanship.',
    'Cable routing notch broke easily. Flimsy plastic and bad build quality overall.',
    'Coating scratches instantly. Cheap build quality and disappointing durability.',
    'VESA plate flexes under load. Poor build quality and feels dangerously flimsy.',
    'Power brick feels hollow and light. Cheap accessories match the poor build quality story.',
    'Menu buttons mushy and rattly chassis. Build quality is weak and feels defective.',
    'Fan grille bends when touched. Flimsy construction and bad build quality control.',
    'Internal buzz from loose shielding. Seems like defective build quality inside.',
    'HDR badge sticker peeling — minor but shows cheap build quality and poor attention.',
    'Rubber feet uneven — wobble desk setup. Flimsy base and mediocre build quality.',
    'Antenna housing gaps visible. Build quality looks cheap and slightly defective.',
    'Kensington slot misaligned. Poor machining and disappointing build quality.',
    'Rear ports hard to plug — tight misaligned holes. Defective port layout and bad build quality.',
    'After a month the stand developed play. Durability issue and poor build quality overall.',
  ];
  const designDays = [165, 152, 140, 128, 118, 108, 98, 88, 78, 68, 58, 50, 42, 35, 28, 22, 16, 12, 9, 6, 5, 4, 3];
  buildSnips.forEach((t, i) => {
    pushExtra('prod_004', 'flipkart', t, 2, designDays[i] ?? (30 - i), 'none');
  });

  window.REVIEWS_DATA = reviews;
})();
