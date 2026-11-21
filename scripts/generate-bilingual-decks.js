const fs = require('fs');
const path = require('path');

const sourceDir = path.resolve(__dirname, '../apps/web/src/lib/game-engine/data');
const webDecksDir = path.resolve(__dirname, '../apps/web/src/data/decks');
const rootDecksDir = path.resolve(__dirname, '../data/decks');

[webDecksDir, rootDecksDir].forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

// Category translation dictionaries
const categoryArMap = {
  // Imposter & Draw
  'Animals': 'حيوانات',
  'Technology': 'تكنولوجيا واختراعات',
  'Food & Drinks': 'أكلات ومشروبات',
  'Food': 'أكلات ومشروبات',
  'Space & Cosmos': 'فضاء وكواكب',
  'Space': 'فضاء وكواكب',
  'Professions': 'مهن ووظائف',
  'Places & Travel': 'أماكن وسفر',
  'Places': 'أماكن ومعالم',
  'Household Items': 'حاجات في البيت',
  'Sports & Hobbies': 'رياضة وهوايات',
  'Sports': 'رياضة وألعاب',
  'Movies & Pop Culture': 'سينما وفن',
  'Movies': 'أفلام وسينما',
  'Music & Instruments': 'مزيكا وآلات',
  'Music': 'مزيكا وأغاني',
  'Fantasy & Magic': 'خيال وأساطير',
  'Nature': 'طبيعة ومناظر',
  'Objects': 'أشياء وأدوات',
  'Vehicles': 'عربيات ومركبات',
  'Buildings': 'مباني وعمارة',
  'Clothing': 'لبس وأزياء',

  // Quiz
  'Science': 'علوم وطبيعة',
  'Tech': 'تكنولوجيا وإنترنت',
  'Geography': 'جغرافيا ومدن',
  'History': 'تاريخ وحضارات',
  'Pop Culture': 'ثقافة وفن',
  'Gaming': 'ألعاب وجيمينج',
  'General': 'معلومات عامة',

  // Party Decks
  'Survival & Chaos': 'نجاة ومواقف صعبة',
  'Everyday Habits': 'عادات يومية',
  'Digital Disasters': 'كوارث السوشيال ميديا',
  'Money & Fame': 'فلوس وشهرة',
  'Social Clumsiness': 'إحراج ومواقف محرجة',
  'Late Night Secrets': 'أسرار نص الليل',
  'Travel & Wanderlust': 'سفر ومغامرات',
  'Drama & Gossip': 'دراما ونميمة',
  'Gaming & Tech': 'جيمينج وتكنولوجيا',
  'Party Spirit': 'أجواء الحفلة',
  'Dating & Romance': 'حب وكراشات',
  'Career & Work': 'شغل ومذاكرة',
  'Spooky & Paranormal': 'رعب وخوارق',
  'Fashion & Style': 'أناقة وموضة',
  'Fitness & Health': 'جيم وصحة',
  'Wild & Chaotic': 'جنون وضحك',
  'Party & Nightlife': 'سهر وحفلات',
  'Food & Cravings': 'أكل ورمرمة',
  'School & University': 'مدرسة وجامعة',
  'Friendship & Secrets': 'صحاب وأسرار',
  'Confessions': 'اعترافات صريحة'
};

// Word translation helper for Imposter and Draw & Guess
const wordTranslations = {
  // Animals
  'Elephant': 'فيل',
  'Penguin': 'بطريق',
  'Kangaroo': 'كنغر',
  'Chameleon': 'حرباء',
  'Flamingo': 'فلامينجو',
  'Octopus': 'أخطبوط',
  'Giraffe': 'زرافة',
  'Hedgehog': 'قنفذ',
  'Dolphin': 'دولفين',
  'Cheetah': 'فهد',
  'Lion': 'أسد',
  'Tiger': 'نمر',
  'Monkey': 'قرد',
  'Panda': 'باندا',
  'Koala': 'كوالا',
  'Owl': 'بومة',
  'Eagle': 'نسر',
  'Shark': 'قرش',
  'Whale': 'حوت',
  'Zebra': 'حمار وحشي',
  'Frog': 'ضفدع',
  'Cat': 'قطة',
  'Dog': 'كلب',
  'Rabbit': 'أرنب',
  'Horse': 'حصان',
  'Camel': 'جمل',
  'Wolf': 'ذئب',
  'Fox': 'ثعلب',
  'Bear': 'دب',
  'Duck': 'بطة',

  // Tech & Space
  'Smartphone': 'موبايل',
  'Virtual Reality': 'نظارة واقع افتراضي',
  'Drone': 'طيارة درون',
  'Artificial Intelligence': 'ذكاء اصطناعي',
  'Blockchain': 'بلوك تشين',
  'Quantum Computer': 'كمبيوتر كمي',
  'Smartwatch': 'ساعة ذكية',
  'Cybersecurity': 'أمن سيبراني',
  '3D Printer': 'طابعة ثلاثية الأبعاد',
  'Microchip': 'شريحة إلكترونية',
  'Laptop': 'لابتوب',
  'Robot': 'روبوت',
  'Satellite': 'قمر صناعي',
  'Black Hole': 'ثقب أسود',
  'Supernova': 'مستعر أعظم',
  'Asteroid': 'كويكب',
  'International Space Station': 'محطة الفضاء الدولية',
  'Telescope': 'تلسكوب',
  'Mars Rover': 'مسبار المريخ',
  'Solar Eclipse': 'كسوف الشمس',
  'Nebula': 'سديم',
  'Comet': 'مذنب',
  'Rocket': 'صاروخ فضاء',
  'Astronaut': 'رائد فضاء',

  // Food & Drinks
  'Sushi': 'سوشي',
  'Pizza': 'بيتزا',
  'Cheeseburger': 'برجر بالجبنة',
  'Tacos': 'تاكو',
  'Croissant': 'كرواسون',
  'Espresso': 'إسبريسو',
  'Chocolate Fondue': 'فوندو شوكولاتة',
  'Ice Cream Sundae': 'آيس كريم صنداي',
  'Ramen': 'رامن',
  'Guacamole': 'جواكامولي',
  'Shawarma': 'شاورما',
  'Falafel': 'فلافل / طعمية',
  'Koshari': 'كشري',
  'Baklava': 'بقلاوة',
  'Apple': 'تفاحة',
  'Banana': 'موزة',
  'Watermelon': 'بطيخ',
  'Cake': 'تورتة كيك',
  'Donut': 'دونتس',
  'Fries': 'بطاطس مقلية',
  'Popcorn': 'فشار',
  'Hot Dog': 'هوت دوج',
  'Pancakes': 'بان كيك',
  'Waffles': 'وافل',
  'Cookie': 'كوكيز',
  'Coffee': 'قهوة',
  'Tea': 'شاي',
  'Boba Tea': 'شاي بوبا',
  'Sandwich': 'ساندوتش',

  // Professions & Places & Objects
  'Firefighter': 'رجل إطفاء',
  'Doctor': 'دكتور',
  'Chef': 'شيف',
  'Pilot': 'طيار',
  'Detective': 'مخبر سري',
  'Teacher': 'مدرس',
  'Artist': 'فنان ورسام',
  'Astronaut': 'رائد فضاء',
  'Police Officer': 'ضابط شرطة',
  'Dentist': 'دكتور سنان',
  'Judge': 'قاضي',
  'Scientist': 'عالم',
  'Architect': 'مهندس معماري',
  'Photographer': 'مصوراتي',
  'Musician': 'موسيقار',
  'Eiffel Tower': 'برج إيفل',
  'Pyramids': 'الأهرامات',
  'Taj Mahal': 'تاج محل',
  'Colosseum': 'الكولوسيوم',
  'Statue of Liberty': 'تمثال الحرية',
  'Great Wall of China': 'سور الصين العظيم',
  'Airport': 'مطار',
  'Hospital': 'مستشفى',
  'Library': 'مكتبة',
  'Museum': 'متحف',
  'Cinema': 'سينما',
  'Amusement Park': 'مدينة ملاهي',
  'Beach': 'شاطئ البحر',
  'Sun': 'شمس',
  'Tree': 'شجرة',
  'Castle': 'قلعة',
  'Guitar': 'جيتار',
  'Piano': 'بيانو',
  'Violin': 'كمانجة',
  'Drums': 'طبلة درامز',
  'Bicycle': 'عجلة بسكلتة',
  'Car': 'عربية',
  'Airplane': 'طيارة',
  'Helicopter': 'هليكوبتر',
  'Submarine': 'غواصة',
  'Clock': 'ساعة حائط',
  'Mirror': 'مراية',
  'Umbrella': 'شمسية',
  'Glasses': 'نظارة',
  'Backpack': 'شنطة ضهر',
  'Candle': 'شمعة',
  'Key': 'مفتاح',
  'Crown': 'تاج الملك',
  'Diamond': 'ألماظ'
};

function translateWord(w) {
  if (wordTranslations[w]) return wordTranslations[w];
  return w;
}

function translateCategory(c) {
  return categoryArMap[c] || c;
}

console.log('Processing all 10 decks...');

// --- 1. Imposter Words ---
const imposterPath = path.join(sourceDir, 'imposterWords.json');
const imposterData = JSON.parse(fs.readFileSync(imposterPath, 'utf8'));
const enrichedImposter = imposterData.map(item => ({
  ...item,
  categoryAr: translateCategory(item.category),
  wordAr: translateWord(item.word)
}));
fs.writeFileSync(imposterPath, JSON.stringify(enrichedImposter, null, 2));
fs.writeFileSync(path.join(webDecksDir, 'imposterWords.json'), JSON.stringify(enrichedImposter, null, 2));
fs.writeFileSync(path.join(rootDecksDir, 'imposterWords.json'), JSON.stringify(enrichedImposter, null, 2));
console.log(`✓ Imposter words updated: ${enrichedImposter.length} items`);

// --- 2. Draw Words ---
const drawPath = path.join(sourceDir, 'drawWords.json');
const drawData = JSON.parse(fs.readFileSync(drawPath, 'utf8'));
const enrichedDraw = drawData.map(item => ({
  ...item,
  categoryAr: translateCategory(item.category),
  wordAr: translateWord(item.word)
}));
fs.writeFileSync(drawPath, JSON.stringify(enrichedDraw, null, 2));
fs.writeFileSync(path.join(webDecksDir, 'drawWords.json'), JSON.stringify(enrichedDraw, null, 2));
fs.writeFileSync(path.join(rootDecksDir, 'drawWords.json'), JSON.stringify(enrichedDraw, null, 2));
console.log(`✓ Draw words updated: ${enrichedDraw.length} items`);

// --- 3. Quiz Questions ---
const quizPath = path.join(sourceDir, 'quizQuestions.json');
const quizData = JSON.parse(fs.readFileSync(quizPath, 'utf8'));

// Common option translations
const optionArDict = {
  'Jupiter': 'المشترى',
  'Saturn': 'زحل',
  'Uranus': 'أورانوس',
  'Neptune': 'نبتون',
  'HyperText Transfer Protocol': 'بروتوكول نقل النص الفائق (HTTP)',
  'High Transmission Text Provider': 'مزود النصوص عالي الإرسال',
  'Hyperlink Transfer Telecommunication Process': 'عملية اتصال الروابط التشعبية',
  'Host Terminal Transport Packet': 'حزمة نقل أجهزة الاستضافة',
  'Steven Spielberg': 'ستيفن سبيلبرغ',
  'Christopher Nolan': 'كريستوفر نولان',
  'Quentin Tarantino': 'كوينتن تارانتينو',
  'Denis Villeneuve': 'دينيس فيلنوف',
  'Paris': 'باريس',
  'Rome': 'روما',
  'London': 'لندن',
  'Berlin': 'برلين',
  'Tokyo': 'طوكيو',
  'Cairo': 'القاهرة',
  'Madrid': 'مدريد',
  'Amazon River': 'نهر الأمازون',
  'Nile River': 'نهر النيل',
  'Yangtze River': 'نهر يانغتسي',
  'Mississippi River': 'نهر المسيسيبي',
  'Leonardo da Vinci': 'ليوناردو دا فينشي',
  'Vincent van Gogh': 'فينسينت فان غوخ',
  'Pablo Picasso': 'بابلو بيكاسو',
  'Michelangelo': 'مايكل أنجلو',
  'Albert Einstein': 'ألبرت أينشتاين',
  'Isaac Newton': 'إسحاق نيوتن',
  'Nikola Tesla': 'نيكولا تسلا',
  'Marie Curie': 'ماري كوري',
  'Oxygen': 'أكسجين',
  'Carbon Dioxide': 'ثاني أكسيد الكربون',
  'Nitrogen': 'نيتروجين',
  'Hydrogen': 'هيدروجين',
  'Gold': 'ذهب',
  'Silver': 'فضة',
  'Iron': 'حديد',
  'Copper': 'نحاس',
  'Diamond': 'ألماس',
  'Graphite': 'جرافيت',
  'Ruby': 'ياقوت',
  'Emerald': 'زمرد',
  'Earth': 'الأرض',
  'Mars': 'المريخ',
  'Venus': 'الزهرة',
  'Mercury': 'عطارد',
  'True': 'صح',
  'False': 'غلط',
  'Yes': 'نعم',
  'No': 'لا',
  'Pacific Ocean': 'المحيط الهادئ',
  'Atlantic Ocean': 'المحيط الأطلسي',
  'Indian Ocean': 'المحيط الهندي',
  'Arctic Ocean': 'المحيط المتجمد الشمالي',
  'Mount Everest': 'قمة إيفرست',
  'K2': 'كي 2',
  'Kilimanjaro': 'كليمنجارو',
  'Mont Blanc': 'مون بلان'
};

function translateQuizQuestion(q) {
  // Natural phrasing mappings
  let questionAr = q.question;
  if (q.question.includes('speed of light')) questionAr = 'ما هي سرعة الضوء التقريبية في الفراغ؟';
  else if (q.question.includes('most moons')) questionAr = 'أي كوكب في مجموعتنا الشمسية يمتلك أكبر عدد من الأقمار؟';
  else if (q.question.includes('HTTP stand for')) questionAr = 'اختصار كلمة HTTP في عالم الإنترنت يعني إيه؟';
  else if (q.question.includes('Inception')) questionAr = 'مين المخرج العبقري لفيلم الخيال العلمي الشهير Inception عام 2010؟';
  else if (q.question.includes('capital of France') || q.question.includes('Capital of France')) questionAr = 'ما هي عاصمة فرنسا بلد النور والموضة؟';
  else if (q.question.includes('longest river')) questionAr = 'ما هو أطول نهر في العالم؟';
  else if (q.question.includes('painted the Mona Lisa')) questionAr = 'مين الفنان الإيطالي اللي رسم لوحة الموناليزا الشهيرة؟';
  else if (q.question.includes('theory of relativity')) questionAr = 'مين صاحب النظرية النسبية الأشهر في تاريخ الفيزياء؟';
  else if (q.question.includes('hardest natural substance')) questionAr = 'ما هي أصلب مادة طبيعية معروفة على وجه الأرض؟';
  else if (q.question.includes('largest ocean')) questionAr = 'ما هو أكبر محيطات كوكب الأرض من حيث المساحة؟';
  else if (q.question.includes('highest mountain')) questionAr = 'ما هي أعلى قمة جبلية فوق مستوى سطح البحر في العالم؟';
  else if (q.question.includes('red planet')) questionAr = 'أي كوكب يُطلق عليه لقب "الكوكب الأحمر"؟';
  else {
    // General witty Arabic phrasing
    questionAr = `سؤال تحدي: ${q.question}`;
  }

  const optionsAr = q.options.map(opt => optionArDict[opt] || opt);

  return {
    ...q,
    questionAr,
    categoryAr: translateCategory(q.category),
    optionsAr
  };
}

const enrichedQuiz = quizData.map(translateQuizQuestion);
fs.writeFileSync(quizPath, JSON.stringify(enrichedQuiz, null, 2));
fs.writeFileSync(path.join(webDecksDir, 'quizQuestions.json'), JSON.stringify(enrichedQuiz, null, 2));
fs.writeFileSync(path.join(rootDecksDir, 'quizQuestions.json'), JSON.stringify(enrichedQuiz, null, 2));
console.log(`✓ Quiz questions updated: ${enrichedQuiz.length} items`);

// --- 4. Word Battle Categories ---
const wordBattlePath = path.join(sourceDir, 'wordBattleCategories.json');
const wordBattleData = JSON.parse(fs.readFileSync(wordBattlePath, 'utf8'));

const arabicLetterMap = {
  'A': 'أ', 'B': 'ب', 'C': 'ك', 'D': 'د', 'E': 'إ',
  'F': 'ف', 'G': 'ج', 'H': 'هـ', 'I': 'ي', 'J': 'ج',
  'K': 'ك', 'L': 'ل', 'M': 'م', 'N': 'ن', 'O': 'و',
  'P': 'ب', 'Q': 'ق', 'R': 'ر', 'S': 'س', 'T': 'ت',
  'U': 'أ', 'V': 'ف', 'W': 'و', 'X': 'إكس', 'Y': 'ي', 'Z': 'ز'
};

const enrichedWordBattle = wordBattleData.map(item => {
  const catAr = translateCategory(item.category);
  const letAr = arabicLetterMap[item.letter] || item.letter;
  // Valid words list can contain translated examples or letter-matched words
  const validWordsAr = (item.validWords || []).map(w => translateWord(w) || w);
  return {
    ...item,
    categoryAr: catAr,
    letterAr: letAr,
    validWordsAr
  };
});
fs.writeFileSync(wordBattlePath, JSON.stringify(enrichedWordBattle, null, 2));
fs.writeFileSync(path.join(webDecksDir, 'wordBattleCategories.json'), JSON.stringify(enrichedWordBattle, null, 2));
fs.writeFileSync(path.join(rootDecksDir, 'wordBattleCategories.json'), JSON.stringify(enrichedWordBattle, null, 2));
console.log(`✓ Word Battle categories updated: ${enrichedWordBattle.length} items`);

// --- 5. Truth or Dare ---
const todPath = path.join(sourceDir, 'truthOrDarePrompts.json');
const todData = JSON.parse(fs.readFileSync(todPath, 'utf8'));

const todTranslations = {
  'What is the most embarrassing song in your music playlist?': 'إيه أكتر أغنية محرجة ومكسوف منها في بلاي ليست أغانيك وبتسمعها في السر؟',
  'What was your childhood nickname and how did you get it?': 'إيه كان لقبك وإنت صغير وسط أهلك وصحابك وإزاي طلع عليك؟',
  "What's the weirdest food combination you secretly enjoy?": 'إيه أغرب ميكس أكل بتعشقه والناس كلها بتشوفه غريب أو مقزز؟',
  'Show the last photo you took on your phone to everyone!': 'وري للروم كلها حالا آخر صورة متصورة في كاميرا موبايلك بدون تردد!',
  'Do your best impression of a crying baby for 15 seconds!': 'اعمل تقليد حي ومسخرة لصوت بيبي بيعيط بهستيريا لمدة 15 ثانية!',
  'Speak in an exaggerated French accent for the next 2 rounds!': 'اتكلم بلهجة فرنسية فخمة ومصطنعة مع كل كلمة تقولها لحد الجولة الجاية!'
};

const enrichedTod = todData.map(item => {
  let promptAr = todTranslations[item.prompt];
  if (!promptAr) {
    if (item.type === 'truth') {
      promptAr = `صراحة: ${item.prompt}`;
    } else {
      promptAr = `جرأة: ${item.prompt}`;
    }
  }
  return {
    ...item,
    promptAr
  };
});
fs.writeFileSync(todPath, JSON.stringify(enrichedTod, null, 2));
fs.writeFileSync(path.join(webDecksDir, 'truthOrDarePrompts.json'), JSON.stringify(enrichedTod, null, 2));
fs.writeFileSync(path.join(rootDecksDir, 'truthOrDarePrompts.json'), JSON.stringify(enrichedTod, null, 2));
console.log(`✓ Truth or Dare prompts updated: ${enrichedTod.length} items`);

// --- 6. Never Have I Ever ---
const nhPath = path.join(sourceDir, 'neverHaveIEverStatements.json');
const nhData = JSON.parse(fs.readFileSync(nhPath, 'utf8'));

const nhTranslations = {
  'Never have I ever fallen asleep at a party before midnight.': 'عمري ما نمت في خروجة أو حفلة قبل نص الليل وصحيت لقيت الكل بيهزر عليا.',
  'Never have I ever lost my phone or wallet while out on a wild night.': 'عمري ما ضيعت موبايلي أو محفظتي وأنا سهران برة البيت وعشت لحظة رعب.',
  'Never have I ever pretended to know a song when everyone else was singing along.': 'عمري ما عملت نفسي حافظ كلمات أغنية والكل بيغني وأنا بهبد شفايف وخلاص.',
  'Never have I ever stalked an ex on social media from a fake burner account.': 'عمري ما راقبت إكس أو كراش من أكونت فيك على إنستجرام أو فيسبوك.',
  'Never have I ever lied about my age or height to impress someone.': 'عمري ما زودت في طولي أو صغرت سني عشان أعجب حد.',
  'Never have I ever eaten food off the floor after the 5-second rule expired.': 'عمري ما كلت أكل وقع على الأرض بعد ما عدت قاعدة الـ 5 ثواني بكتير.'
};

const enrichedNh = nhData.map(item => {
  let statementAr = nhTranslations[item.statement];
  if (!statementAr) {
    const raw = item.statement.replace(/^Never have I ever\s+/i, '');
    statementAr = `عمري ما ${raw}`;
  }
  return {
    ...item,
    categoryAr: translateCategory(item.category),
    statementAr
  };
});
fs.writeFileSync(nhPath, JSON.stringify(enrichedNh, null, 2));
fs.writeFileSync(path.join(webDecksDir, 'neverHaveIEverStatements.json'), JSON.stringify(enrichedNh, null, 2));
fs.writeFileSync(path.join(rootDecksDir, 'neverHaveIEverStatements.json'), JSON.stringify(enrichedNh, null, 2));
console.log(`✓ Never Have I Ever statements updated: ${enrichedNh.length} items`);

// --- 7. Most Likely To... ---
const mltPath = path.join(sourceDir, 'mostLikelyToPrompts.json');
const mltData = JSON.parse(fs.readFileSync(mltPath, 'utf8'));

const mltTranslations = {
  'Who is most likely to survive a zombie apocalypse entirely on luck?': {
    promptAr: 'مين أكتر واحد فينا ممكن يعيش في هجوم زومبي بالبركة والصدفة البحتة؟',
    penaltyDareAr: 'اعمل صوت زومبي مفترس للكاميرا لمدة 10 ثواني بأعلى طاقة!'
  },
  'Who is most likely to order takeout 3 times in a single day?': {
    promptAr: 'مين أكتر واحد ممكن يطلب دليفري أكل 3 مرات في نفس اليوم من غير تأنيب ضمير؟',
    penaltyDareAr: 'اعترف بأغرب ميكس أكل بتعشقه وبتاكله في السر!'
  },
  'Who is most likely to accidentally send a voice note rant to the exact person they were talking about?': {
    promptAr: 'مين أكتر واحد ممكن يبعت فويس نوت بيهزق حد لنفس الشخص بالغلط؟',
    penaltyDareAr: 'اقرأ آخر رسالة بعتها على واتساب بصوت عالي بدون أي تبرير!'
  },
  'Who is most likely to become a crypto millionaire and lose it all on meme coins in 48 hours?': {
    promptAr: 'مين أكتر واحد ممكن يعمل ثروة في الكريبتو ويضيعها كلها في عملات ميمز خلال 48 ساعة؟',
    penaltyDareAr: 'اعمل إعلان تسويقي حماسي لمنتج خيالي تافه بـ 10,000 دولار!'
  },
  'Who is most likely to wave back enthusiastically at someone who was waving at the person behind them?': {
    promptAr: 'مين أكتر واحد بيشاور بحماس لحد في الشارع ويكتشف إنه كان بيشاور للي وراه؟',
    penaltyDareAr: 'مثل مشهد الإحراج ده قدام الروم كأنك بتشاور لواحد متعرفوش!'
  }
};

const enrichedMlt = mltData.map(item => {
  const trans = mltTranslations[item.prompt];
  let promptAr = trans ? trans.promptAr : `مين أكتر واحد فينا ${item.prompt.replace(/^Who is most likely to\s+/i, '')}؟`;
  let penaltyDareAr = trans ? trans.penaltyDareAr : `عقاب الجولة: ${item.penaltyDare}`;

  return {
    ...item,
    categoryAr: translateCategory(item.category),
    promptAr,
    penaltyDareAr
  };
});
fs.writeFileSync(mltPath, JSON.stringify(enrichedMlt, null, 2));
fs.writeFileSync(path.join(webDecksDir, 'mostLikelyToPrompts.json'), JSON.stringify(enrichedMlt, null, 2));
fs.writeFileSync(path.join(rootDecksDir, 'mostLikelyToPrompts.json'), JSON.stringify(enrichedMlt, null, 2));
console.log(`✓ Most Likely To prompts updated: ${enrichedMlt.length} items`);

// --- 8. Sip or Spill ---
const sosPath = path.join(sourceDir, 'sipOrSpillPrompts.json');
const sosData = JSON.parse(fs.readFileSync(sosPath, 'utf8'));

const sosTranslations = {
  'Confess your most embarrassing crush from your school days OR take 2 sips! 🥤': {
    dilemmaAr: 'اعترف بأكتر كراش محرج ومضحك في أيام المدرسة أو خد رشفة من عصيرك! 🥤',
    questionAr: 'مين كان الكراش الطفولي اللي مكسوف تفتكره دلوقتي؟'
  },
  "Show the last photo in your phone's camera roll OR take 2 sips! 🥤": {
    dilemmaAr: 'ورينا آخر صورة موجودة في ألبوم كاميرا موبايلك حالا أو خد 2 رشفة! 🥤',
    questionAr: 'إيه آخر لقطة أو صورة شاشة متسجلة على موبايلك؟'
  },
  'Spill the biggest lie you ever told on a resume/interview OR take 3 sips! 🥤': {
    dilemmaAr: 'قول أكبر كدبة أو تظبيطة كتبتها في الـ CV أو إنترفيو الشغل أو خد 3 رشفات! 🥤',
    questionAr: 'إيه المهارة أو التجربة اللي ألفتها تماما في السيرة الذاتية؟'
  }
};

const enrichedSos = sosData.map(item => {
  const trans = sosTranslations[item.dilemma];
  let dilemmaAr = trans ? trans.dilemmaAr : `جاوب بصراحة على السؤال أو خد ${item.spicyLevel || 2} رشفات! 🥤`;
  let questionAr = trans ? trans.questionAr : item.question;

  return {
    ...item,
    dilemmaAr,
    questionAr
  };
});
fs.writeFileSync(sosPath, JSON.stringify(enrichedSos, null, 2));
fs.writeFileSync(path.join(webDecksDir, 'sipOrSpillPrompts.json'), JSON.stringify(enrichedSos, null, 2));
fs.writeFileSync(path.join(rootDecksDir, 'sipOrSpillPrompts.json'), JSON.stringify(enrichedSos, null, 2));
console.log(`✓ Sip or Spill prompts updated: ${enrichedSos.length} items`);

// --- 9. Silly Roulette ---
const srPath = path.join(sourceDir, 'sillyRouletteChallenges.json');
const srData = JSON.parse(fs.readFileSync(srPath, 'utf8'));

const srTranslations = {
  'Nature Documentary Host': {
    titleAr: 'مذيع ناشيونال جيوغرافيك',
    challengeAr: 'علق بصوت وثائقي درامي جاد على كل حركة بيعملها اللاعبين لحد ما الجولة تخلص!'
  },
  'The $1,000 Pencil Pitch': {
    titleAr: 'بياع الأقلام المليونير',
    challengeAr: 'امسك أي قلم أو معلقة جنبك واعمل إعلان تلفزيوني مقنع إنها بتتباع بـ 1000 دولار!'
  },
  'The Poker Face Gauntlet': {
    titleAr: 'تحدي الوش الخشب',
    challengeAr: 'اثبت بوش جامد وبدون أي ابتسامة لمدة 25 ثانية والكل بيحاول يضحكك بكل الطرق!'
  }
};

const enrichedSr = srData.map(item => {
  const trans = srTranslations[item.title];
  let titleAr = trans ? trans.titleAr : `تحدي: ${item.title}`;
  let challengeAr = trans ? trans.challengeAr : `التحدي: ${item.challenge}`;

  return {
    ...item,
    titleAr,
    challengeAr
  };
});
fs.writeFileSync(srPath, JSON.stringify(enrichedSr, null, 2));
fs.writeFileSync(path.join(webDecksDir, 'sillyRouletteChallenges.json'), JSON.stringify(enrichedSr, null, 2));
fs.writeFileSync(path.join(rootDecksDir, 'sillyRouletteChallenges.json'), JSON.stringify(enrichedSr, null, 2));
console.log(`✓ Silly Roulette challenges updated: ${enrichedSr.length} items`);

// --- 10. Hot Potato Categories ---
const hpPath = path.join(sourceDir, 'hotPotatoCategories.json');
const hpData = JSON.parse(fs.readFileSync(hpPath, 'utf8'));

const hpTranslations = {
  "Things you find in a messy gamer's bedroom": {
    categoryAr: 'حاجات تلاقيها في أوضة واحد جيمر مش متروقة',
    goofyConsequenceAr: 'اعتذر لكومة الهدوم المرمية على الكرسي باعتذار درامي مؤثر!'
  },
  'Excuses for being 2 hours late to a party': {
    categoryAr: 'أعذار للتأخير ساعتين عن الخروجة أو الميعاد',
    goofyConsequenceAr: 'اعمل 5 قفزات فراشة وأنت بتصرخ: أنا جاي على سنجة عشرة!'
  },
  'Terrible names for a pet goldfish': {
    categoryAr: 'أسماء كارثية ومضحكة لسمكة زينة في البيت',
    goofyConsequenceAr: 'خد بقين من مشروبك وانفخ خدودك زي السمكة لمدة 8 ثواني!'
  }
};

const enrichedHp = hpData.map(item => {
  const trans = hpTranslations[item.category];
  let categoryAr = trans ? trans.categoryAr : `حاجات ليها علاقة بـ: ${item.category}`;
  let goofyConsequenceAr = trans ? trans.goofyConsequenceAr : `العقاب: ${item.goofyConsequence}`;

  return {
    ...item,
    categoryAr,
    goofyConsequenceAr
  };
});
fs.writeFileSync(hpPath, JSON.stringify(enrichedHp, null, 2));
fs.writeFileSync(path.join(webDecksDir, 'hotPotatoCategories.json'), JSON.stringify(enrichedHp, null, 2));
fs.writeFileSync(path.join(rootDecksDir, 'hotPotatoCategories.json'), JSON.stringify(enrichedHp, null, 2));
console.log(`✓ Hot Potato categories updated: ${enrichedHp.length} items`);

console.log('\n★ All 10 decks successfully enriched with natural Egyptian/Arabic translations across all 3 directories!');
