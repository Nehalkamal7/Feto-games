const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, '../apps/web/src/lib/game-engine/data');

// 1. Most Likely To... (65 cards)
const mostLikelyToPrompts = [
  {
    id: "mlt_01",
    category: "Survival & Chaos",
    prompt: "Who is most likely to survive a zombie apocalypse entirely on luck?",
    penaltyDare: "Do your best aggressive zombie impression toward the camera for 10 seconds!"
  },
  {
    id: "mlt_02",
    category: "Everyday Habits",
    prompt: "Who is most likely to order takeout 3 times in a single day?",
    penaltyDare: "Confess the weirdest food combination you secretly love!"
  },
  {
    id: "mlt_03",
    category: "Digital Disasters",
    prompt: "Who is most likely to accidentally send a voice note rant to the exact person they were talking about?",
    penaltyDare: "Read your last sent text message out loud with zero context!"
  },
  {
    id: "mlt_04",
    category: "Money & Fame",
    prompt: "Who is most likely to become a crypto millionaire and lose it all on meme coins in 48 hours?",
    penaltyDare: "Pitch a fake $10,000 product to the lobby with intense sales energy!"
  },
  {
    id: "mlt_05",
    category: "Social Clumsiness",
    prompt: "Who is most likely to wave back enthusiastically at someone who was waving at the person behind them?",
    penaltyDare: "Do a 10-second dramatic reenactment of being caught waving at a stranger."
  },
  {
    id: "mlt_06",
    category: "Late Night Secrets",
    prompt: "Who is most likely to still be scrolling TikTok or Reels at 4:30 AM on a Tuesday?",
    penaltyDare: "Drop and give the room 5 rapid push-ups or 10 frantic jumping jacks!"
  },
  {
    id: "mlt_07",
    category: "Travel & Wanderlust",
    prompt: "Who is most likely to get lost inside an IKEA warehouse and end up taking a nap on a showroom sofa?",
    penaltyDare: "Act like a Swedish furniture designer naming random objects in the room."
  },
  {
    id: "mlt_08",
    category: "Drama & Gossip",
    prompt: "Who is most likely to start a dramatic reality TV argument over who ate the last slice of pizza?",
    penaltyDare: "Deliver a 15-second Oscar-worthy dramatic crying monologue!"
  },
  {
    id: "mlt_09",
    category: "Gaming & Tech",
    prompt: "Who is most likely to rage-quit a game, punch their desk, and instantly log back in 10 seconds later?",
    penaltyDare: "Make the loudest 8-bit arcade explosion noise you can muster!"
  },
  {
    id: "mlt_10",
    category: "Party Spirit",
    prompt: "Who is most likely to fall asleep with their shoes still on at someone else's house?",
    penaltyDare: "Balance an object on your head for 20 seconds without letting it fall."
  },
  {
    id: "mlt_11",
    category: "Dating & Romance",
    prompt: "Who is most likely to fall head-over-heels in love with someone after a 30-second grocery store eye contact?",
    penaltyDare: "Serenade the host of the room with an improvised love ballad."
  },
  {
    id: "mlt_12",
    category: "Career & Work",
    prompt: "Who is most likely to join a high-stakes Zoom meeting with their camera accidentally pointing at their ceiling fan while in pajamas?",
    penaltyDare: "Deliver a formal corporate status update using exclusively slang words."
  },
  {
    id: "mlt_13",
    category: "Spooky & Paranormal",
    prompt: "Who is most likely to believe their house is genuinely haunted because of a creaky wooden floorboard?",
    penaltyDare: "Tell a 15-second ghost story in an eerie whisper."
  },
  {
    id: "mlt_14",
    category: "Fashion & Style",
    prompt: "Who is most likely to buy an outrageous neon outfit just to wear it once for a photo and never touch it again?",
    penaltyDare: "Strike 3 runway model poses consecutively with maximum intensity."
  },
  {
    id: "mlt_15",
    category: "Fitness & Health",
    prompt: "Who is most likely to buy an expensive gym membership on January 1st and stop going by January 5th?",
    penaltyDare: "Flex your muscles aggressively and narrate your workout routine."
  },
  {
    id: "mlt_16",
    category: "Wild & Chaotic",
    prompt: "Who is most likely to adopt 4 stray cats in a single weekend because they looked lonely?",
    penaltyDare: "Meow aggressively whenever anyone speaks until the next round."
  },
  {
    id: "mlt_17",
    category: "Everyday Habits",
    prompt: "Who is most likely to forget where they parked their car in a 2-story mall parking garage?",
    penaltyDare: "Make car alarm beep noises with panic expressions for 8 seconds."
  },
  {
    id: "mlt_18",
    category: "Digital Disasters",
    prompt: "Who is most likely to have 4,000+ unread emails and 75 open browser tabs right now?",
    penaltyDare: "Read the title of the weirdest tab you opened this week!"
  },
  {
    id: "mlt_19",
    category: "Money & Fame",
    prompt: "Who is most likely to accidentally become famous on TikTok for falling over in public?",
    penaltyDare: "Slow-motion replay your most clumsy moment right now."
  },
  {
    id: "mlt_20",
    category: "Social Clumsiness",
    prompt: "Who is most likely to laugh uncontrollably at the absolute most inappropriate serious moment?",
    penaltyDare: "Stare directly into the screen for 15 seconds without blinking or smiling."
  },
  {
    id: "mlt_21",
    category: "Food & Feasts",
    prompt: "Who is most likely to eat cold leftover pizza for breakfast while standing in front of the open fridge?",
    penaltyDare: "Describe your dream gourmet midnight snack in vivid sensory detail."
  },
  {
    id: "mlt_22",
    category: "Survival & Chaos",
    prompt: "Who is most likely to push a 'DO NOT PUSH' big red button within 3 seconds of seeing it?",
    penaltyDare: "Make a high-pitched siren noise and spin around in your chair."
  },
  {
    id: "mlt_23",
    category: "Dating & Romance",
    prompt: "Who is most likely to stalk an ex-crush's profile all the way back to their 2014 beach photos?",
    penaltyDare: "Compliment every single player in the room with one genuine hype word."
  },
  {
    id: "mlt_24",
    category: "Gaming & Tech",
    prompt: "Who is most likely to blame server latency or keyboard drift for missing an easy shot?",
    penaltyDare: "Rant for 10 seconds about how 'the game lagged' in dramatic esports fashion."
  },
  {
    id: "mlt_25",
    category: "Everyday Habits",
    prompt: "Who is most likely to leave the house with their phone battery at 4% and no charging cable?",
    penaltyDare: "Improvise a dramatic eulogy for a dying phone battery."
  },
  {
    id: "mlt_26",
    category: "Career & Work",
    prompt: "Who is most likely to quit their job on the spot to start an artisanal sourdough bakery?",
    penaltyDare: "Act like a French baker critiquing the posture of other players."
  },
  {
    id: "mlt_27",
    category: "Wild & Chaotic",
    prompt: "Who is most likely to accidentally start a dance circle at a casual family dinner?",
    penaltyDare: "Do a 10-second robotic victory dance with pure robotic emotion."
  },
  {
    id: "mlt_28",
    category: "Spooky & Paranormal",
    prompt: "Who is most likely to try communicating with aliens using a flashlight on their roof?",
    penaltyDare: "Transmit an alien greeting using weird vocal clicks and buzzes."
  },
  {
    id: "mlt_29",
    category: "Drama & Gossip",
    prompt: "Who is most likely to reply 'k' or 'thumbs up' to a 4-paragraph heartfelt message?",
    penaltyDare: "Explain why the thumbs-up emoji is the ultimate weapon of chaos."
  },
  {
    id: "mlt_30",
    category: "Party Spirit",
    prompt: "Who is most likely to steal the DJ aux cord at a party and play a 10-minute anime intro?",
    penaltyDare: "Sing the guitar solo of your favorite rock anthem with your mouth."
  },
  {
    id: "mlt_31",
    category: "Everyday Habits",
    prompt: "Who is most likely to set 12 consecutive alarms 5 minutes apart and still wake up 30 minutes late?",
    penaltyDare: "Imitate your morning alarm sound with full vocal commitment."
  },
  {
    id: "mlt_32",
    category: "Money & Fame",
    prompt: "Who is most likely to buy something completely useless just because it had a 50% off sticker?",
    penaltyDare: "Show the camera the most random object within arm's reach and praise it."
  },
  {
    id: "mlt_33",
    category: "Digital Disasters",
    prompt: "Who is most likely to get catfished by an obvious AI bot named 'Jennifer_Crypto99'?",
    penaltyDare: "Do an AI voice assistant response to a simple question."
  },
  {
    id: "mlt_34",
    category: "Social Clumsiness",
    prompt: "Who is most likely to trip on a flat, completely smooth floor with nobody around?",
    penaltyDare: "Bow gracefully as if you just landed an Olympic gymnastics dismount."
  },
  {
    id: "mlt_35",
    category: "Food & Feasts",
    prompt: "Who is most likely to order the spiciest item on the menu and immediately regret every life decision?",
    penaltyDare: "Puff your cheeks and pretend your tongue is currently on fire for 8 seconds."
  },
  {
    id: "mlt_36",
    category: "Survival & Chaos",
    prompt: "Who is most likely to accidentally set off a fire alarm while attempting to make simple buttered toast?",
    penaltyDare: "Flap your arms like you are dispersing smoke from an imaginary toaster."
  },
  {
    id: "mlt_37",
    category: "Dating & Romance",
    prompt: "Who is most likely to plan their future wedding venue after going on a second date?",
    penaltyDare: "Propose marriage to a random item on your desk with deep passion."
  },
  {
    id: "mlt_38",
    category: "Gaming & Tech",
    prompt: "Who is most likely to spend 3 hours customizing their video game character's nose and eyebrows?",
    penaltyDare: "Make 3 different absurd facial expressions like character presets."
  },
  {
    id: "mlt_39",
    category: "Wild & Chaotic",
    prompt: "Who is most likely to show up to a black-tie event wearing gaming crocs in sport mode?",
    penaltyDare: "Defend gaming crocs as peak high-fashion for 15 seconds."
  },
  {
    id: "mlt_40",
    category: "Everyday Habits",
    prompt: "Who is most likely to sing at the top of their lungs in the shower thinking nobody else can hear them?",
    penaltyDare: "Hit the highest falsetto note you can physically produce right now!"
  },
  {
    id: "mlt_41",
    category: "Career & Work",
    prompt: "Who is most likely to become CEO of a shady company and get exposed on a 6-part Netflix documentary?",
    penaltyDare: "Deliver a fake press conference apology statement to the lobby."
  },
  {
    id: "mlt_42",
    category: "Drama & Gossip",
    prompt: "Who is most likely to say 'I hate drama' right before dropping the juiciest gossip of the month?",
    penaltyDare: "Spill a completely fake scandalous secret about yourself with a straight face."
  },
  {
    id: "mlt_43",
    category: "Travel & Wanderlust",
    prompt: "Who is most likely to board the wrong flight at the airport because they had noise-canceling headphones on?",
    penaltyDare: "Act like a panicked airline captain announcing turbulence."
  },
  {
    id: "mlt_44",
    category: "Spooky & Paranormal",
    prompt: "Who is most likely to check behind the shower curtain for murderers every time they use the bathroom?",
    penaltyDare: "Do a classic horror movie scream at low volume."
  },
  {
    id: "mlt_45",
    category: "Party Spirit",
    prompt: "Who is most likely to organize a 15-person karaoke night and hog the microphone for 80% of the time?",
    penaltyDare: "Rap the first verse of the Fresh Prince of Bel-Air or any song you know."
  },
  {
    id: "mlt_46",
    category: "Social Clumsiness",
    prompt: "Who is most likely to say 'You too!' when the movie theater usher says 'Enjoy the movie'?",
    penaltyDare: "Apologize profusely to an imaginary movie theater usher."
  },
  {
    id: "mlt_47",
    category: "Fitness & Health",
    prompt: "Who is most likely to drink a green detox smoothie and gag after the first single sip?",
    penaltyDare: "Take a big gulp of water like it's an extreme toxic potion."
  },
  {
    id: "mlt_48",
    category: "Money & Fame",
    prompt: "Who is most likely to tip 40% because they were too intimidated to look at the card machine screen?",
    penaltyDare: "Thank everyone in the room as if they just gave you a million dollars."
  },
  {
    id: "mlt_49",
    category: "Digital Disasters",
    prompt: "Who is most likely to accidentally like a photo from 6 years ago while deep-stalking someone on Instagram?",
    penaltyDare: "Freeze completely like a statue for 12 seconds."
  },
  {
    id: "mlt_50",
    category: "Food & Feasts",
    prompt: "Who is most likely to finish everyone else's leftover fries at the table without asking?",
    penaltyDare: "Plead for imaginary french fries like a Victorian street orphan."
  },
  {
    id: "mlt_51",
    category: "Wild & Chaotic",
    prompt: "Who is most likely to get banned from a laser tag arena for taking combat rolls way too seriously?",
    penaltyDare: "Do a tactical combat roll or military salute to the lobby."
  },
  {
    id: "mlt_52",
    category: "Everyday Habits",
    prompt: "Who is most likely to put their car keys in the refrigerator and spend an hour looking everywhere for them?",
    penaltyDare: "Name 5 cold items in a fridge in 4 seconds flat!"
  },
  {
    id: "mlt_53",
    category: "Dating & Romance",
    prompt: "Who is most likely to accidentally send 'Love you' to their DoorDash delivery driver?",
    penaltyDare: "Express heartfelt eternal gratitude to your favorite delivery meal."
  },
  {
    id: "mlt_54",
    category: "Gaming & Tech",
    prompt: "Who is most likely to buy a $300 gaming chair thinking it will instantly double their aim accuracy?",
    penaltyDare: "Sit back like a tournament esports champion and adjust invisible glasses."
  },
  {
    id: "mlt_55",
    category: "Survival & Chaos",
    prompt: "Who is most likely to pack 5 pairs of shoes for an overnight 24-hour weekend trip?",
    penaltyDare: "Inspect your current footwear and give it a fashion rating out of 10."
  },
  {
    id: "mlt_56",
    category: "Career & Work",
    prompt: "Who is most likely to accidentally share their personal Discord screen during an executive work presentation?",
    penaltyDare: "Rapidly clear your throat 5 times like a nervous junior analyst."
  },
  {
    id: "mlt_57",
    category: "Social Clumsiness",
    prompt: "Who is most likely to forget someone's name 2 seconds after being introduced to them?",
    penaltyDare: "Invent a ridiculous nickname for the player with the highest score."
  },
  {
    id: "mlt_58",
    category: "Party Spirit",
    prompt: "Who is most likely to bring a board game with an 80-page rulebook to a casual house party?",
    penaltyDare: "Explain an absurd imaginary board game rule with full seriousness."
  },
  {
    id: "mlt_59",
    category: "Everyday Habits",
    prompt: "Who is most likely to read a recipe online, ignore all measurements, and wonder why the cake looks like a brick?",
    penaltyDare: "Act like a master chef tasting a disastrous soup."
  },
  {
    id: "mlt_60",
    category: "Wild & Chaotic",
    prompt: "Who is most likely to jump into a hotel pool fully clothed at 2 AM on vacation?",
    penaltyDare: "Make swimming stroke motions with your arms for 10 seconds."
  },
  {
    id: "mlt_61",
    category: "Money & Fame",
    prompt: "Who is most likely to invest their savings in a theme park for guinea pigs?",
    penaltyDare: "Squeak like a guinea pig 4 times in rapid succession."
  },
  {
    id: "mlt_62",
    category: "Dating & Romance",
    prompt: "Who is most likely to bring their pet on a first date as a certified vibe checker?",
    penaltyDare: "Introduce your hand as your emotional support animal."
  },
  {
    id: "mlt_63",
    category: "Digital Disasters",
    prompt: "Who is most likely to accidentally voice-call someone at 3 AM while trying to delete their contact?",
    penaltyDare: "Whisper an apology to the screen as if someone answered at 3 AM."
  },
  {
    id: "mlt_64",
    category: "Survival & Chaos",
    prompt: "Who is most likely to trigger a neighborhood-wide Wi-Fi outage by unplugging the main router?",
    penaltyDare: "Pretend you are an ancient dial-up modem connecting to the internet."
  },
  {
    id: "mlt_65",
    category: "Esports Legend",
    prompt: "Who is most likely to claim they 'let you win' every time they lose a 1v1 match?",
    penaltyDare: "Bow to the lobby and declare everyone else is a gaming prodigy."
  }
];

// 2. Sip or Spill (65 cards)
const sipOrSpillPrompts = [
  {
    id: "sos_01",
    dilemma: "Confess your most embarrassing crush from your school days OR take 2 sips! 🥤",
    question: "Who was your most cringe-worthy childhood or teen celebrity crush?",
    spicyLevel: 1
  },
  {
    id: "sos_02",
    dilemma: "Show the last photo in your phone's camera roll OR take 2 sips! 🥤",
    question: "What is the most recent unedited picture saved on your phone?",
    spicyLevel: 1
  },
  {
    id: "sos_03",
    dilemma: "Spill the biggest lie you ever told on a resume/interview OR take 3 sips! 🥤",
    question: "What job skill did you completely fabricate on paper?",
    spicyLevel: 2
  },
  {
    id: "sos_04",
    dilemma: "Pick which player in this room you would least trust with your unlocked phone OR take 3 sips! 🥤",
    question: "Who here is most dangerous with unlimited access to your DMs?",
    spicyLevel: 2
  },
  {
    id: "sos_05",
    dilemma: "Admit your worst first-date disaster in vivid detail OR take 2 sips! 🥤",
    question: "What was the quickest date you ever wanted an emergency escape from?",
    spicyLevel: 1
  },
  {
    id: "sos_06",
    dilemma: "Spill who you secretly stalk on social media using a burner account OR take 3 sips! 🥤",
    question: "Whose profiles are on your regular search history that you'd never admit to?",
    spicyLevel: 3
  },
  {
    id: "sos_07",
    dilemma: "Rate every player's gaming skills from best to worst OR take 4 sips! 🥤",
    question: "Who is the true MVP and who is the certified deadweight in this crew?",
    spicyLevel: 3
  },
  {
    id: "sos_08",
    dilemma: "Confess the most ridiculous reason you ever ghosted someone OR take 2 sips! 🥤",
    question: "What minor petty flaw made you instantly disappear from someone's life?",
    spicyLevel: 2
  },
  {
    id: "sos_09",
    dilemma: "Reveal the most amount of money you ever wasted on something completely useless OR take 2 sips! 🥤",
    question: "What buyer's remorse purchase haunts you to this day?",
    spicyLevel: 1
  },
  {
    id: "sos_10",
    dilemma: "Have you ever faked being sick to avoid hanging out with someone in this room? Spill who OR take 3 sips! 🥤",
    question: "Whose plans did you dodge with a phantom fever?",
    spicyLevel: 3
  },
  {
    id: "sos_11",
    dilemma: "What is your guilty pleasure song that would ruin your street cred if leaked? Spill OR take 2 sips! 🥤",
    question: "What track do you blast with windows rolled up?",
    spicyLevel: 1
  },
  {
    id: "sos_12",
    dilemma: "Spill the pettiest grudge you are still actively holding today OR take 2 sips! 🥤",
    question: "What small thing happened years ago that you refuse to forgive?",
    spicyLevel: 2
  },
  {
    id: "sos_13",
    dilemma: "Have you ever re-gifted a present back to the person who gave it to you? Spill OR take 2 sips! 🥤",
    question: "What gift did you recycle with zero shame?",
    spicyLevel: 1
  },
  {
    id: "sos_14",
    dilemma: "Spill your most awkward encounter with a partner's parents OR take 3 sips! 🥤",
    question: "What cringe dinner memory still makes you sweat at night?",
    spicyLevel: 2
  },
  {
    id: "sos_15",
    dilemma: "If you had to trade lives with one person in this room for a month, who is it and why? Spill OR take 2 sips! 🥤",
    question: "Whose daily routine and perks look the most appealing?",
    spicyLevel: 1
  },
  {
    id: "sos_16",
    dilemma: "What is the longest you've ever gone without showering while gaming or binge-watching? Spill OR take 2 sips! 🥤",
    question: "What was your all-time peak goblin mode marathon record?",
    spicyLevel: 1
  },
  {
    id: "sos_17",
    dilemma: "Spill the worst text you ever sent to the wrong chat or person OR take 3 sips! 🥤",
    question: "What message caused an instant cold panic sweat?",
    spicyLevel: 2
  },
  {
    id: "sos_18",
    dilemma: "Have you ever snooped through someone's medicine cabinet or bedroom drawers? Spill OR take 2 sips! 🥤",
    question: "What was the most curious thing you stumbled upon?",
    spicyLevel: 2
  },
  {
    id: "sos_19",
    dilemma: "Who in this room would survive the shortest amount of time in a horror movie? Spill OR take 2 sips! 🥤",
    question: "Who is getting taken out in the opening 5 minutes?",
    spicyLevel: 1
  },
  {
    id: "sos_20",
    dilemma: "Spill your most bizarre habit that you do when you are 100% home alone OR take 3 sips! 🥤",
    question: "What private quirk would make people look at you sideways?",
    spicyLevel: 2
  },
  {
    id: "sos_21",
    dilemma: "Have you ever pretended to like a gift so much you wore it out of guilt? Spill OR take 2 sips! 🥤",
    question: "What ugly item did you parade around to spare feelings?",
    spicyLevel: 1
  },
  {
    id: "sos_22",
    dilemma: "Spill the weirdest rumor you ever heard about yourself that was actually true OR take 3 sips! 🥤",
    question: "What gossip hit the bullseye?",
    spicyLevel: 3
  },
  {
    id: "sos_23",
    dilemma: "Would you delete your main social media account forever for $20,000 cash? Spill your answer OR take 2 sips! 🥤",
    question: "Is your digital presence worth more than cold hard cash?",
    spicyLevel: 1
  },
  {
    id: "sos_24",
    dilemma: "Spill the most ridiculous thing you believed was real until embarrassingly late in life OR take 2 sips! 🥤",
    question: "What common sense fact did you learn way too late?",
    spicyLevel: 1
  },
  {
    id: "sos_25",
    dilemma: "Who was the last person you searched for on Instagram or TikTok? Spill OR take 3 sips! 🥤",
    question: "What name is currently sitting in your search bar history?",
    spicyLevel: 2
  },
  {
    id: "sos_26",
    dilemma: "Spill the worst haircut or fashion disaster you voluntarily paid money for OR take 2 sips! 🥤",
    question: "What style choice do you pretend was 'just a phase'?",
    spicyLevel: 1
  },
  {
    id: "sos_27",
    dilemma: "Have you ever accidentally eaten food off the floor past the 5-second rule? Spill OR take 2 sips! 🥤",
    question: "What dropped snack was too precious to sacrifice?",
    spicyLevel: 1
  },
  {
    id: "sos_28",
    dilemma: "Spill the absolute worst advice you ever gave to a friend going through a breakup OR take 2 sips! 🥤",
    question: "What terrible relationship wisdom did you hand out?",
    spicyLevel: 2
  },
  {
    id: "sos_29",
    dilemma: "Which player here would make the absolute worst roommate? Spill OR take 3 sips! 🥤",
    question: "Whose habits would drive you insane within 72 hours?",
    spicyLevel: 2
  },
  {
    id: "sos_30",
    dilemma: "Spill the biggest temper tantrum you ever threw over a lost multiplayer match OR take 3 sips! 🥤",
    question: "What headset, controller, or keyboard suffered your wrath?",
    spicyLevel: 2
  },
  {
    id: "sos_31",
    dilemma: "Have you ever claimed credit for someone else's joke at a party? Spill OR take 2 sips! 🥤",
    question: "Whose punchline did you repeat slightly louder?",
    spicyLevel: 1
  },
  {
    id: "sos_32",
    dilemma: "Spill the most outrageous excuse you used to get out of school or work OR take 2 sips! 🥤",
    question: "What wild tale did you craft for a free day off?",
    spicyLevel: 1
  },
  {
    id: "sos_33",
    dilemma: "What is your biggest irrational fear that makes zero logical sense? Spill OR take 2 sips! 🥤",
    question: "What innocent object or creature terrifies your soul?",
    spicyLevel: 1
  },
  {
    id: "sos_34",
    dilemma: "Spill the most cringe screen name or gamer tag you ever used in your youth OR take 2 sips! 🥤",
    question: "What edgy or adorable username did you proudly rock?",
    spicyLevel: 1
  },
  {
    id: "sos_35",
    dilemma: "Who in this room would you pick as your partner in a high-stakes bank robbery? Spill OR take 2 sips! 🥤",
    question: "Who is your ride-or-die mastermind?",
    spicyLevel: 1
  },
  {
    id: "sos_36",
    dilemma: "Spill the most hypocritical thing you constantly preach to others but never do yourself OR take 2 sips! 🥤",
    question: "What golden rule do you break daily?",
    spicyLevel: 2
  },
  {
    id: "sos_37",
    dilemma: "Have you ever cried during an animated movie? Spill which one OR take 2 sips! 🥤",
    question: "Which cartoon broke your emotional defenses?",
    spicyLevel: 1
  },
  {
    id: "sos_38",
    dilemma: "Spill your most petty dealbreaker when considering dating someone OR take 2 sips! 🥤",
    question: "What tiny quirk would send you running for the hills?",
    spicyLevel: 2
  },
  {
    id: "sos_39",
    dilemma: "If you had to delete every gaming console or your smartphone, which goes? Spill OR take 3 sips! 🥤",
    question: "Are you addicted to the screen or the game?",
    spicyLevel: 2
  },
  {
    id: "sos_40",
    dilemma: "Spill the biggest secret you kept from your parents for over 5 years OR take 3 sips! 🥤",
    question: "What hidden deed finally has expired consequences?",
    spicyLevel: 3
  },
  {
    id: "sos_41",
    dilemma: "What is the weirdest thing you ever bought online past midnight? Spill OR take 2 sips! 🥤",
    question: "What late-night package arrived that shocked your sober self?",
    spicyLevel: 1
  },
  {
    id: "sos_42",
    dilemma: "Spill who has the worst taste in music in this room right now OR take 3 sips! 🥤",
    question: "Whose aux cord privileges should be permanently revoked?",
    spicyLevel: 2
  },
  {
    id: "sos_43",
    dilemma: "Have you ever blamed a terrible smell on an innocent pet or baby? Spill OR take 2 sips! 🥤",
    question: "Who took the blame for your biological betrayal?",
    spicyLevel: 2
  },
  {
    id: "sos_44",
    dilemma: "Spill the most embarrassing video of you that exists on someone's phone right now OR take 3 sips! 🥤",
    question: "What clip could be used to blackmail you for eternity?",
    spicyLevel: 3
  },
  {
    id: "sos_45",
    dilemma: "What is the most bizarre food craving you satisfy in complete secrecy? Spill OR take 2 sips! 🥤",
    question: "What recipe would gross out the entire room?",
    spicyLevel: 1
  },
  {
    id: "sos_46",
    dilemma: "Spill the worst lie you ever told to get someone off the phone with you OR take 2 sips! 🥤",
    question: "What fake tunnel or dead battery story did you invent?",
    spicyLevel: 1
  },
  {
    id: "sos_47",
    dilemma: "Who in this room would you bet all your savings on winning a physical combat arena? Spill OR take 2 sips! 🥤",
    question: "Who is the undercover gladiator among us?",
    spicyLevel: 1
  },
  {
    id: "sos_48",
    dilemma: "Spill your most awkward elevator silence or interaction story OR take 2 sips! 🥤",
    question: "What 20-second vertical ride felt like 5 hours of agony?",
    spicyLevel: 1
  },
  {
    id: "sos_49",
    dilemma: "Have you ever stalked your own profile from a friend's phone to check how cool you look? Spill OR take 2 sips! 🥤",
    question: "Did you pass your own aesthetic inspection?",
    spicyLevel: 1
  },
  {
    id: "sos_50",
    dilemma: "Spill the most childish thing you still do regularly as a grown adult OR take 2 sips! 🥤",
    question: "What playground habit will you never give up?",
    spicyLevel: 1
  },
  {
    id: "sos_51",
    dilemma: "Which player here would make the most chaotic politician? Spill OR take 2 sips! 🥤",
    question: "Whose press conferences would go completely unhinged?",
    spicyLevel: 1
  },
  {
    id: "sos_52",
    dilemma: "Spill the story behind the biggest physical scar on your body OR take 2 sips! 🥤",
    question: "Was it heroic battle or sheer uncoordinated goofiness?",
    spicyLevel: 1
  },
  {
    id: "sos_53",
    dilemma: "Have you ever practiced arguing in the shower and still lost the argument in your head? Spill OR take 2 sips! 🥤",
    question: "Who was your imaginary shower opponent?",
    spicyLevel: 1
  },
  {
    id: "sos_54",
    dilemma: "Spill the most superficial reason you ever swiped left on someone OR take 2 sips! 🥤",
    question: "What tiny profile detail made you instantly decline?",
    spicyLevel: 2
  },
  {
    id: "sos_55",
    dilemma: "Who in this room has the most infectious, ridiculous laugh? Spill OR take 2 sips! 🥤",
    question: "Whose giggle sounds like a malfunctioning tea kettle?",
    spicyLevel: 1
  },
  {
    id: "sos_56",
    dilemma: "Spill the most awkward misunderstanding you had with a cashier or waiter OR take 2 sips! 🥤",
    question: "What order went completely sideways?",
    spicyLevel: 1
  },
  {
    id: "sos_57",
    dilemma: "Have you ever rewatched your own story 15 times just to appreciate your own vibe? Spill OR take 2 sips! 🥤",
    question: "Are you your own biggest social media fan?",
    spicyLevel: 1
  },
  {
    id: "sos_58",
    dilemma: "Spill the secret hobby or obsession nobody in your real life knows about OR take 3 sips! 🥤",
    question: "What niche rabbit hole consumes your free time?",
    spicyLevel: 3
  },
  {
    id: "sos_59",
    dilemma: "Which player here would be the first to sell out for fame and money? Spill OR take 2 sips! 🥤",
    question: "Who is signing the brand deal before reading the contract?",
    spicyLevel: 2
  },
  {
    id: "sos_60",
    dilemma: "Spill your most dramatic hospital or emergency room visit story OR take 2 sips! 🥤",
    question: "What goofy mistake required medical attention?",
    spicyLevel: 1
  },
  {
    id: "sos_61",
    dilemma: "Have you ever told someone their baby or puppy was cute when you privately thought it was ugly? Spill OR take 2 sips! 🥤",
    question: "How did you craft your polite white lie?",
    spicyLevel: 2
  },
  {
    id: "sos_62",
    dilemma: "Spill the most ridiculous thing you did to impress someone you liked OR take 3 sips! 🥤",
    question: "What fake personality or hobby did you temporarily adopt?",
    spicyLevel: 2
  },
  {
    id: "sos_63",
    dilemma: "Who in this room would you leave in charge of watering your plants while away? Spill OR take 2 sips! 🥤",
    question: "Who has the green thumb and who brings certain death to flora?",
    spicyLevel: 1
  },
  {
    id: "sos_64",
    dilemma: "Spill the worst movie you genuinely love and defend with your life OR take 2 sips! 🥤",
    question: "What 0% Rotten Tomatoes film is your personal masterpiece?",
    spicyLevel: 1
  },
  {
    id: "sos_65",
    dilemma: "Confess which player here you secretly admire the most and why OR take 3 sips! 🥤",
    question: "Give genuine party flowers to one person right now!",
    spicyLevel: 1
  }
];

// 3. Silly Roulette Challenges (65 challenges)
const sillyRouletteChallenges = [
  {
    id: "src_01",
    title: "Nature Documentary Host",
    challenge: "Narrate everything you and other players do like David Attenborough until the next round begins!",
    category: "vocal",
    timeSeconds: 30
  },
  {
    id: "src_02",
    title: "The $1,000 Pencil Pitch",
    challenge: "Pick up a pen, pencil, or spoon nearby and pitch it to the room like a frantic $1,000 luxury infomercial product!",
    category: "acting",
    timeSeconds: 30
  },
  {
    id: "src_03",
    title: "The Poker Face Gauntlet",
    challenge: "Keep an absolute deadpan poker face for 25 seconds while every other player makes weird sounds and faces to break you!",
    category: "absurd",
    timeSeconds: 25
  },
  {
    id: "src_04",
    title: "Dramatic Opera Order",
    challenge: "Sing your favorite fast-food order in maximum theatrical opera vibrato!",
    category: "vocal",
    timeSeconds: 20
  },
  {
    id: "src_05",
    title: "Air Guitar Solo Master",
    challenge: "Drop to your knees and deliver an epic 15-second air guitar rock solo with intense headbanging!",
    category: "physical",
    timeSeconds: 20
  },
  {
    id: "src_06",
    title: "The Robot Waiter",
    challenge: "Act like a malfunctioning robot taking beverage orders from 2 players of your choice!",
    category: "acting",
    timeSeconds: 25
  },
  {
    id: "src_07",
    title: "Slow Motion Replay",
    challenge: "Do everything in ultra-slow motion for the next 20 seconds, including speech!",
    category: "physical",
    timeSeconds: 20
  },
  {
    id: "src_08",
    title: "The Sarcastic Butler",
    challenge: "Address the player with the lowest score as 'Your Royal Highness' and offer them imaginary champagne with witty sarcasm!",
    category: "acting",
    timeSeconds: 25
  },
  {
    id: "src_09",
    title: "Tongue Twister Sprint",
    challenge: "Repeat 'Toy boat, toy boy, toy boat' 5 times as fast as humanly possible without messing up!",
    category: "vocal",
    timeSeconds: 15
  },
  {
    id: "src_10",
    title: "The Mime Trapped in a Box",
    challenge: "Pretend you are trapped inside an invisible glass cube and struggle against the walls for 15 seconds!",
    category: "physical",
    timeSeconds: 15
  },
  {
    id: "src_11",
    title: "Pirate Captain Command",
    challenge: "Deliver an inspirational battle speech to your pirate crew in your gruffest pirate accent!",
    category: "vocal",
    timeSeconds: 20
  },
  {
    id: "src_12",
    title: "Action Movie Stuntman",
    challenge: "Pretend you just took a laser blast to the shoulder and deliver a melodramatic dying gasp monologue!",
    category: "acting",
    timeSeconds: 20
  },
  {
    id: "src_13",
    title: "Chicken Dance Tribute",
    challenge: "Flap your elbows and do the chicken dance vigorously for 12 seconds with full facial dedication!",
    category: "physical",
    timeSeconds: 15
  },
  {
    id: "src_14",
    title: "Sports Commentator Blitz",
    challenge: "Rapid-fire commentate on someone's breathing or blinking like it is the World Cup final!",
    category: "vocal",
    timeSeconds: 20
  },
  {
    id: "src_15",
    title: "The Secret Spy",
    challenge: "Whisper all your responses like you are a secret agent reporting to headquarters through an invisible earpiece!",
    category: "acting",
    timeSeconds: 25
  },
  {
    id: "src_16",
    title: "Animal Orchestra",
    challenge: "Make 4 different animal noises in under 6 seconds (e.g. dolphin, goat, rooster, donkey)!",
    category: "vocal",
    timeSeconds: 15
  },
  {
    id: "src_17",
    title: "Statue of Liberty Freeze",
    challenge: "Hold an intense heroic pose with one arm high in the air without moving a muscle for 20 seconds!",
    category: "physical",
    timeSeconds: 20
  },
  {
    id: "src_18",
    title: "The Confused Time Traveler",
    challenge: "Act like a time traveler from 1450 who just discovered the internet and a computer screen!",
    category: "acting",
    timeSeconds: 25
  },
  {
    id: "src_19",
    title: "Whistle Maestro",
    challenge: "Whistle the theme song to a popular movie or cartoon until another player guesses it correctly!",
    category: "vocal",
    timeSeconds: 25
  },
  {
    id: "src_20",
    title: "The High-Fashion Model",
    challenge: "Treat your desk as a runway: strike 4 fierce editorial fashion poses directly into the camera!",
    category: "physical",
    timeSeconds: 20
  },
  {
    id: "src_21",
    title: "Vampire Awakening",
    challenge: "Act like Dracula waking up at dusk and demanding a fresh glass of orange juice with dramatic cape flair!",
    category: "acting",
    timeSeconds: 20
  },
  {
    id: "src_22",
    title: "Question-Only Curse",
    challenge: "You can ONLY speak in questions for the next 45 seconds! Any statement is a failure!",
    category: "absurd",
    timeSeconds: 45
  },
  {
    id: "src_23",
    title: "Aggressive Cheerleader",
    challenge: "Spell out FETO GAMES with cheerleader arm snaps and high energy jumps!",
    category: "physical",
    timeSeconds: 20
  },
  {
    id: "src_24",
    title: "The T-Rex Challenge",
    challenge: "Tuck your elbows to your sides like tiny T-Rex arms and try to pick up your phone or drink!",
    category: "physical",
    timeSeconds: 20
  },
  {
    id: "src_25",
    title: "Undercover Alien",
    challenge: "Explain human hugs to your alien overlords in a cold mechanical report!",
    category: "vocal",
    timeSeconds: 25
  },
  {
    id: "src_26",
    title: "The Master Chef Critique",
    challenge: "Gordon Ramsay-style roast an imaginary undercooked dish prepared by the room host!",
    category: "acting",
    timeSeconds: 25
  },
  {
    id: "src_27",
    title: "The Speed Alphabet",
    challenge: "Recite the English alphabet backwards from Z to A in under 15 seconds!",
    category: "vocal",
    timeSeconds: 15
  },
  {
    id: "src_28",
    title: "Disco Fever",
    challenge: "Do the classic Saturday Night Fever finger-point disco dance for 15 seconds without laughing!",
    category: "physical",
    timeSeconds: 15
  },
  {
    id: "src_29",
    title: "The Evil Villain Monologue",
    challenge: "Spin in your chair, stroke an imaginary cat, and deliver your master plan to steal the world's chocolate supply!",
    category: "acting",
    timeSeconds: 25
  },
  {
    id: "src_30",
    title: "Beatbox Debut",
    challenge: "Drop a 12-second freestyle beatbox rhythm with bass drums and snare clicks!",
    category: "vocal",
    timeSeconds: 15
  },
  {
    id: "src_31",
    title: "The Hypnotist",
    challenge: "Try to hypnotize the player with the highest score into believing they are a slice of sourdough bread!",
    category: "absurd",
    timeSeconds: 20
  },
  {
    id: "src_32",
    title: "Helicopter Whir",
    challenge: "Spin around 5 times quickly and try to walk in a perfectly straight line for 3 steps!",
    category: "physical",
    timeSeconds: 20
  },
  {
    id: "src_33",
    title: "The Broken GPS",
    challenge: "Give another player directions to the bathroom like a glitching GPS navigator recalculating routes!",
    category: "acting",
    timeSeconds: 25
  },
  {
    id: "src_34",
    title: "Shakespearean Gamer",
    challenge: "Quote a gaming triumph or rage-quit in pure Elizabethan Shakespearean verse (e.g. 'Alas, poor ping!')!",
    category: "vocal",
    timeSeconds: 20
  },
  {
    id: "src_35",
    title: "Finger Ballet",
    challenge: "Perform an intricate miniature ballet routine on your desk using only two fingers as dancers!",
    category: "absurd",
    timeSeconds: 15
  },
  {
    id: "src_36",
    title: "The Screaming Goat",
    challenge: "Impersonate the viral screaming goat video at 70% volume!",
    category: "vocal",
    timeSeconds: 10
  },
  {
    id: "src_37",
    title: "Olympic Synchronized Swimmer",
    challenge: "Do a routine of synchronized swimmer hand gestures with a dramatic frozen smile!",
    category: "physical",
    timeSeconds: 20
  },
  {
    id: "src_38",
    title: "The Auctioneer Sprint",
    challenge: "Speak like a 100-words-per-minute fast-talking cattle auctioneer selling a mystery box!",
    category: "vocal",
    timeSeconds: 20
  },
  {
    id: "src_39",
    title: "The Silent Film Star",
    challenge: "Communicate that you are starving using only dramatic facial expressions and wild hand gestures, zero sound!",
    category: "acting",
    timeSeconds: 20
  },
  {
    id: "src_40",
    title: "Balancing Act",
    challenge: "Balance a pen or pencil horizontally on your upper lip for 15 seconds straight!",
    category: "physical",
    timeSeconds: 15
  },
  {
    id: "src_41",
    title: "The Wrestling Promo",
    challenge: "Cut a high-octane 90s WWE wrestling promo against the player ranked #1 on the leaderboard!",
    category: "acting",
    timeSeconds: 25
  },
  {
    id: "src_42",
    title: "Baby Talk Translate",
    challenge: "Translate a complex philosophical quote or daily news item using exclusively toddler words!",
    category: "absurd",
    timeSeconds: 20
  },
  {
    id: "src_43",
    title: "The Cat Cleanse",
    challenge: "Pretend to lick your hand like a paw and smooth down your hair like a grooming housecat!",
    category: "physical",
    timeSeconds: 15
  },
  {
    id: "src_44",
    title: "Movie Trailer Voiceover",
    challenge: "Say 'In a world where party games turn deadly...' in the lowest, raspiest movie trailer voice you have!",
    category: "vocal",
    timeSeconds: 15
  },
  {
    id: "src_45",
    title: "The Fitness Guru",
    challenge: "Lead the room through 3 ridiculous made-up yoga poses (e.g. 'The Wobbly Flamingo')!",
    category: "physical",
    timeSeconds: 25
  },
  {
    id: "src_46",
    title: "The Detective Interrogation",
    challenge: "Interrogate a random player like a grizzled 1940s film noir detective asking who ate your donut!",
    category: "acting",
    timeSeconds: 25
  },
  {
    id: "src_47",
    title: "The Dial-Up Modem",
    challenge: "Vocalize the screeching dial-up tones of a 1998 56k internet modem for 10 seconds!",
    category: "vocal",
    timeSeconds: 12
  },
  {
    id: "src_48",
    title: "The Karate Chop Master",
    challenge: "Deliver 6 swift karate chops into the air with authentic martial arts kiais ('HI-YAH!')!",
    category: "physical",
    timeSeconds: 15
  },
  {
    id: "src_49",
    title: "The Weather Forecaster",
    challenge: "Report tomorrow's weather forecast for the room: predict heavy rain of snacks and high winds of drama!",
    category: "acting",
    timeSeconds: 20
  },
  {
    id: "src_50",
    title: "Vocal Sound Effects",
    challenge: "Make laser blaster, ricochet, and spaceship swoosh sounds non-stop for 12 seconds!",
    category: "vocal",
    timeSeconds: 12
  },
  {
    id: "src_51",
    title: "The Staring Contest",
    challenge: "Challenge the player across from you to a staring duel: first person to blink or smile takes a sip!",
    category: "absurd",
    timeSeconds: 20
  },
  {
    id: "src_52",
    title: "The Royalty Walk",
    challenge: "Walk across your room with imaginary heavy crown posture and wave gracefully to your loyal subjects!",
    category: "physical",
    timeSeconds: 20
  },
  {
    id: "src_53",
    title: "The Opera Tragedy",
    challenge: "Sing about dropping your ice cream cone on the ground with tragic operatic tears!",
    category: "vocal",
    timeSeconds: 20
  },
  {
    id: "src_54",
    title: "The Sleepwalker",
    challenge: "Pretend you are fast asleep sleepwalking into the kitchen hunting for midnight shredded cheese!",
    category: "acting",
    timeSeconds: 20
  },
  {
    id: "src_55",
    title: "Rapid Rhyme Challenge",
    challenge: "Give 5 words that rhyme with 'CAT' in 4 seconds without repeating!",
    category: "vocal",
    timeSeconds: 10
  },
  {
    id: "src_56",
    title: "The Bodyguard",
    challenge: "Stand up, cross your arms, put on sunglasses if nearby, and guard your computer screen menacingly!",
    category: "physical",
    timeSeconds: 20
  },
  {
    id: "src_57",
    title: "The Excited Puppy",
    challenge: "Pant happily, tilt your head sideways, and act like a golden retriever seeing its human return home!",
    category: "acting",
    timeSeconds: 15
  },
  {
    id: "src_58",
    title: "Alien Translation",
    challenge: "Translate this phrase into an alien language: 'FETO GAMES is the ultimate party hub!'",
    category: "vocal",
    timeSeconds: 15
  },
  {
    id: "src_59",
    title: "The Flailing Inflatable Man",
    challenge: "Imitate an inflatable tube dancer outside a car dealership for 12 seconds!",
    category: "physical",
    timeSeconds: 15
  },
  {
    id: "src_60",
    title: "The Secret Message",
    challenge: "Blink a secret message in Morse code with your eyes while looking intently at the camera!",
    category: "absurd",
    timeSeconds: 15
  },
  {
    id: "src_61",
    title: "The High Pitch Scream",
    challenge: "Do a 2-second horror movie screech like you just saw a tiny harmless moth!",
    category: "vocal",
    timeSeconds: 8
  },
  {
    id: "src_62",
    title: "The Slow Clap",
    challenge: "Start a single, excruciatingly slow sarcastic clap and build it into a crescendo!",
    category: "acting",
    timeSeconds: 15
  },
  {
    id: "src_63",
    title: "The Invisible Lasso",
    challenge: "Swing an invisible lasso overhead and rope in the current party leader!",
    category: "physical",
    timeSeconds: 15
  },
  {
    id: "src_64",
    title: "The Game Show Host",
    challenge: "Introduce the next mini-game round like a glittery 1970s game show host with wild hand gestures!",
    category: "acting",
    timeSeconds: 20
  },
  {
    id: "src_65",
    title: "The Grand Finale Bow",
    challenge: "Take a lavish 3-part theatrical bow and blow kisses to your adoring audience!",
    category: "physical",
    timeSeconds: 15
  }
];

// 4. Hot Potato Categories (65 categories & goofy consequences)
const hotPotatoCategories = [
  {
    id: "hp_01",
    category: "Things you find in a messy gamer's bedroom",
    goofyConsequence: "Recite an apology to your laundry pile with deep sincerity!"
  },
  {
    id: "hp_02",
    category: "Excuses for being 2 hours late to a party",
    goofyConsequence: "Do 5 frantic star jumps while yelling 'I am fashionably late!'"
  },
  {
    id: "hp_03",
    category: "Terrible names for a pet goldfish",
    goofyConsequence: "Take 2 sips of your drink and puff your cheeks like a fish for 8 seconds!"
  },
  {
    id: "hp_04",
    category: "Red flags on a dating profile",
    goofyConsequence: "Deliver a cheesy 1980s pickup line directly to the camera!"
  },
  {
    id: "hp_05",
    category: "Things you shouldn't say in a job interview",
    goofyConsequence: "Plead for your imaginary job with dramatic hand clasping!"
  },
  {
    id: "hp_06",
    category: "Foods that smell terrible but taste amazing",
    goofyConsequence: "Pinch your nose and speak in a funny voice until the next round!"
  },
  {
    id: "hp_07",
    category: "Things people pretend to understand but don't",
    goofyConsequence: "Nod vigorously and pretend you understand quantum physics!"
  },
  {
    id: "hp_08",
    category: "Reasons to call in sick to work on a Monday",
    goofyConsequence: "Fake 3 violent coughs into your elbow like a dramatic soap opera patient!"
  },
  {
    id: "hp_09",
    category: "Things you find in the glove compartment of a car",
    goofyConsequence: "Honk like an angry taxi driver 4 times!"
  },
  {
    id: "hp_10",
    category: "Awkward places to run into your ex",
    goofyConsequence: "Act like you are hiding behind an imaginary lamppost!"
  },
  {
    id: "hp_11",
    category: "Things you shouldn't shout in an airport",
    goofyConsequence: "Whisper your deepest secret at low volume!"
  },
  {
    id: "hp_12",
    category: "Terrible pizza toppings that should be illegal",
    goofyConsequence: "Gag dramatically at the thought of warm pineapple!"
  },
  {
    id: "hp_13",
    category: "Superpowers that sound cool but are actually useless",
    goofyConsequence: "Strike your best superhero pose and freeze for 10 seconds!"
  },
  {
    id: "hp_14",
    category: "Things people lie about on first dates",
    goofyConsequence: "Confess the most ridiculous white lie you told this year!"
  },
  {
    id: "hp_15",
    category: "Things you only do when completely alone at home",
    goofyConsequence: "Do a 5-second victory strut in your room!"
  },
  {
    id: "hp_16",
    category: "Items you pack for vacation and never touch",
    goofyConsequence: "Take a sip! 🥤"
  },
  {
    id: "hp_17",
    category: "Things that instantly ruin your morning mood",
    goofyConsequence: "Let out a long, theatrical Monday-morning groan!"
  },
  {
    id: "hp_18",
    category: "Names you would never give to your child",
    goofyConsequence: "Name the player to your right with a goofy medieval title!"
  },
  {
    id: "hp_19",
    category: "Things you shouldn't say at a wedding",
    goofyConsequence: "Raise an imaginary glass and propose a disastrous toast!"
  },
  {
    id: "hp_20",
    category: "Things that cost way too much money for what they are",
    goofyConsequence: "Complain about inflation like an 80-year-old grandfather!"
  },
  {
    id: "hp_21",
    category: "Reasons your Wi-Fi suddenly stopped working",
    goofyConsequence: "Make robotic buffering sounds for 8 seconds!"
  },
  {
    id: "hp_22",
    category: "Items that always get lost in the sofa cushions",
    goofyConsequence: "Dig into your pocket and present the first item you touch!"
  },
  {
    id: "hp_23",
    category: "Things you wouldn't want to find in your hotel room",
    goofyConsequence: "Inspect your keyboard with disgust like an undercover health inspector!"
  },
  {
    id: "hp_24",
    category: "Words people mispronounce constantly",
    goofyConsequence: "Pronounce 'Worcestershire sauce' 3 times fast!"
  },
  {
    id: "hp_25",
    category: "Bad advice to give someone learning to drive",
    goofyConsequence: "Make screeching tire braking noises with panic hands!"
  },
  {
    id: "hp_26",
    category: "Things you can say about a car, but not your partner",
    goofyConsequence: "Give your drink 2 friendly sips! 🥤"
  },
  {
    id: "hp_27",
    category: "Hobbies that scream 'I have too much free time'",
    goofyConsequence: "Pretend you are carefully painting a grain of rice!"
  },
  {
    id: "hp_28",
    category: "Things you shouldn't Google at 3 AM",
    goofyConsequence: "Cover your eyes in horror for 6 seconds!"
  },
  {
    id: "hp_29",
    category: "Terrible gifts to receive on your birthday",
    goofyConsequence: "Force a fake enthusiastic 'Thank you so much!' smile!"
  },
  {
    id: "hp_30",
    category: "Things you find inside a refrigerator that expired months ago",
    goofyConsequence: "Waft imaginary spoiled milk smells away with your hand!"
  },
  {
    id: "hp_31",
    category: "Reasons a first date ended after 15 minutes",
    goofyConsequence: "Check your invisible watch and shout 'Oh no, my curfew!'"
  },
  {
    id: "hp_32",
    category: "Things you shouldn't bring to a camping trip",
    goofyConsequence: "Swat imaginary mosquitoes around your ears for 10 seconds!"
  },
  {
    id: "hp_33",
    category: "Jobs that a golden retriever could probably do",
    goofyConsequence: "Pant and give your screen a friendly high-five paw!"
  },
  {
    id: "hp_34",
    category: "Things you shouldn't say to a police officer who pulled you over",
    goofyConsequence: "Put your hands up and say 'I swear the speed limit was optional!'"
  },
  {
    id: "hp_35",
    category: "Weird places to fall asleep by accident",
    goofyConsequence: "Snore loudly for 5 seconds and wake up startled!"
  },
  {
    id: "hp_36",
    category: "Things you find in a magician's basement",
    goofyConsequence: "Pull an invisible rabbit out of your shirt with a flourish!"
  },
  {
    id: "hp_37",
    category: "Things you shouldn't say to your barber while getting a haircut",
    goofyConsequence: "Touch your hair and sigh with existential disappointment!"
  },
  {
    id: "hp_38",
    category: "Things people buy during an existential midlife crisis",
    goofyConsequence: "Rev an imaginary sports car engine with your mouth!"
  },
  {
    id: "hp_39",
    category: "Things you can say at Thanksgiving dinner and during an esports match",
    goofyConsequence: "Shout 'LET HIM COOK!' with full esports hype!"
  },
  {
    id: "hp_40",
    category: "Terrible slogans for an airline company",
    goofyConsequence: "Do the airline emergency oxygen mask tutorial demonstration!"
  },
  {
    id: "hp_41",
    category: "Things that happen in every single horror movie",
    goofyConsequence: "Say 'Hello? Is anyone there?' into the darkness!"
  },
  {
    id: "hp_42",
    category: "Things people brag about that nobody actually cares about",
    goofyConsequence: "Flex an imaginary gold watch and brag about your crypto wallet!"
  },
  {
    id: "hp_43",
    category: "Things you shouldn't do in an elevator full of strangers",
    goofyConsequence: "Stare directly into the camera with wide unblinking eyes!"
  },
  {
    id: "hp_44",
    category: "Reasons you lost a 1v1 in a video game",
    goofyConsequence: "Blame your mouse, your chair, and your neighbor's microwave!"
  },
  {
    id: "hp_45",
    category: "Things that smell surprisingly good",
    goofyConsequence: "Take a deep dramatic sniff of the air and sigh in satisfaction!"
  },
  {
    id: "hp_46",
    category: "Things you shouldn't say during a massage",
    goofyConsequence: "Make a goofy relaxed groan of relief!"
  },
  {
    id: "hp_47",
    category: "Things you find in a wizard's pocket",
    goofyConsequence: "Cast an imaginary spell on the lobby with wand motions!"
  },
  {
    id: "hp_48",
    category: "Things that make people instantly look uncool",
    goofyConsequence: "Trip over your own feet while walking in place!"
  },
  {
    id: "hp_49",
    category: "Reasons you stayed up until 5 AM on a school/work night",
    goofyConsequence: "Take 2 sips! 🥤"
  },
  {
    id: "hp_50",
    category: "Things you shouldn't say when meeting someone's newborn baby",
    goofyConsequence: "Tilt your head and make funny baby cooing sounds!"
  },
  {
    id: "hp_51",
    category: "Things you wouldn't want falling out of your backpack in class",
    goofyConsequence: "Scramble frantically on your desk picking up imaginary secrets!"
  },
  {
    id: "hp_52",
    category: "Things people do to look busy when the boss walks past",
    goofyConsequence: "Type aggressively on your keyboard while frowning with immense focus!"
  },
  {
    id: "hp_53",
    category: "Things you can say to your dog but not your significant other",
    goofyConsequence: "Whistle and say 'Who's a good boy?!'"
  },
  {
    id: "hp_54",
    category: "Things that cause family feuds during Monopoly",
    goofyConsequence: "Flip an imaginary board and storm away for 3 seconds!"
  },
  {
    id: "hp_55",
    category: "Things you find in a pirate's treasure chest",
    goofyConsequence: "Laugh like a greedy buccaneer: 'YOHOHO AND A BOTTLE OF SODA!'"
  },
  {
    id: "hp_56",
    category: "Things you shouldn't wear to a formal funeral",
    goofyConsequence: "Adjust an imaginary neon tie and apologize!"
  },
  {
    id: "hp_57",
    category: "Reasons an alien would choose NOT to invade Earth",
    goofyConsequence: "Facepalm and shake your head at humanity!"
  },
  {
    id: "hp_58",
    category: "Things people say when trying to sound smart",
    goofyConsequence: "Push imaginary glasses up your nose and say 'Technically speaking...'"
  },
  {
    id: "hp_59",
    category: "Things you find in a haunted attic",
    goofyConsequence: "Creak like a rusty door hinge with your voice!"
  },
  {
    id: "hp_60",
    category: "Things you shouldn't text your mother",
    goofyConsequence: "Say 'I love you mom' with sincere terror!"
  },
  {
    id: "hp_61",
    category: "Things you can buy at a gas station at 3 AM",
    goofyConsequence: "Munch an imaginary dried beef stick noisily!"
  },
  {
    id: "hp_62",
    category: "Reasons someone became a supervillain",
    goofyConsequence: "Do an evil maniacal laugh that echoes in your room!"
  },
  {
    id: "hp_63",
    category: "Things you shouldn't do during a silent yoga class",
    goofyConsequence: "Exhale the loudest sigh of relief possible!"
  },
  {
    id: "hp_64",
    category: "Things that happen when you microwave metal",
    goofyConsequence: "Zap and crackle like lightning for 6 seconds!"
  },
  {
    id: "hp_65",
    category: "Things you shouldn't say right before this bomb explodes",
    goofyConsequence: "Hold your head in your hands and scream 'THE BOOOOMB!'"
  }
];

fs.writeFileSync(path.join(targetDir, 'mostLikelyToPrompts.json'), JSON.stringify(mostLikelyToPrompts, null, 2));
fs.writeFileSync(path.join(targetDir, 'sipOrSpillPrompts.json'), JSON.stringify(sipOrSpillPrompts, null, 2));
fs.writeFileSync(path.join(targetDir, 'sillyRouletteChallenges.json'), JSON.stringify(sillyRouletteChallenges, null, 2));
fs.writeFileSync(path.join(targetDir, 'hotPotatoCategories.json'), JSON.stringify(hotPotatoCategories, null, 2));

console.log('✓ Successfully generated all 4 new English party card decks (65 items each)!');
