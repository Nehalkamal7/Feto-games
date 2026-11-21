export type Language = 'en' | 'ar';

export interface Translations {
  common: {
    brandName: string;
    brandTagline: string;
    online: string;
    players: string;
    cancel: string;
    confirm: string;
    save: string;
    close: string;
    copy: string;
    copied: string;
    error: string;
    loading: string;
    back: string;
    next: string;
    round: string;
    of: string;
    vs: string;
    pts: string;
    share: string;
    secondsRemaining: string;
    timeRemaining: string;
    you: string;
    host: string;
    vipBadge: string;
  };
  nav: {
    home: string;
    games: string;
    leaderboard: string;
    about: string;
    howToPlay: string;
    customDecks: string;
    soundToggle: string;
    languageToggle: string;
  };
  home: {
    heroBadge: string;
    heroTitle: string;
    heroTitleHighlight: string;
    heroDesc: string;
    createRoom: string;
    joinRoom: string;
    quickMatch: string;
    publicRooms: string;
    noPublicRooms: string;
    nicknameLabel: string;
    nicknamePlaceholder: string;
    selectAvatar: string;
    randomizeNickname: string;
    howToPlayTitle: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    refreshRooms: string;
    allModes: string;
    playersInRoom: string;
  };
  about: {
    title: string;
    desc: string;
    feature1Title: string;
    feature1Desc: string;
    feature2Title: string;
    feature2Desc: string;
    feature3Title: string;
    feature3Desc: string;
    gotItBtn: string;
  };
  createRoom: {
    title: string;
    subtitle: string;
    gameModeLabel: string;
    vibeModeLabel: string;
    vibeChill: string;
    vibeParty: string;
    vibeChaotic: string;
    vibeSip: string;
    roundDuration: string;
    totalRounds: string;
    maxPlayers: string;
    privateRoom: string;
    privateRoomDesc: string;
    roomPin: string;
    pinPlaceholder: string;
    createBtn: string;
    creating: string;
  };
  joinRoom: {
    title: string;
    subtitle: string;
    codeLabel: string;
    codePlaceholder: string;
    pinLabel: string;
    pinPlaceholder: string;
    joinBtn: string;
    joining: string;
  };
  lobby: {
    roomCode: string;
    shareInvite: string;
    linkCopied: string;
    qrCode: string;
    ready: string;
    notReady: string;
    startGame: string;
    starting: string;
    forceStart: string;
    waitingForHost: string;
    playersCount: string;
    settings: string;
    playlist: string;
    hostTag: string;
    youTag: string;
    kick: string;
    leaveRoom: string;
    leaveConfirm: string;
    roomSettingsTitle: string;
    vibeEdition: string;
    roundsCount: string;
    roundDurationSec: string;
  };
  controls: {
    hostControls: string;
    endRoundNow: string;
    nextRound: string;
    nextGame: string;
    finishMatch: string;
    backToLobby: string;
    backToLobbyConfirmTitle: string;
    backToLobbyConfirmDesc: string;
    resetScoresOption: string;
    confirmBackToLobby: string;
    keepPlaying: string;
  };
  podium: {
    matchResults: string;
    podiumTitle: string;
    winner: string;
    secondPlace: string;
    thirdPlace: string;
    totalScore: string;
    backToLobbyCrew: string;
    waitingForHostLobby: string;
    shareRecap: string;
    playAgain: string;
    awardsTitle: string;
  };
  games: {
    imposter: {
      name: string;
      category: string;
      yourRole: string;
      tapToView: string;
      hideRole: string;
      youAreImposter: string;
      imposterDesc: string;
      fellowImposters: string;
      yourSecretWord: string;
      civilianDesc: string;
      yourTurnSubmit: string;
      waitingForClue: string;
      cluePlaceholder: string;
      submitClue: string;
      submittedClues: string;
      voteForImposter: string;
      voteDesc: string;
      voted: string;
      vote: string;
      imposterCaught: string;
      finalGuessChance: string;
      finalGuessPlaceholder: string;
      stealWin: string;
      waitingForImposterGuess: string;
      imposterWon: string;
      civiliansWon: string;
      secretWordWas: string;
    };
    drawAndGuess: {
      name: string;
      youAreDrawing: string;
      isDrawing: string;
      secretWord: string;
      letters: string;
      guessedBadge: string;
      solvedBadge: string;
      liveGuesses: string;
      typeGuess: string;
      chatDrawer: string;
      alreadyGuessed: string;
      chooseWord: string;
      chooseWordDesc: string;
      roundOverWordWas: string;
      easy: string;
      medium: string;
      hard: string;
      brushSize: string;
      eraser: string;
      undo: string;
      clearCanvas: string;
    };
    quizBattle: {
      name: string;
      questionNumber: string;
      selectAnswer: string;
      lockedIn: string;
      timesUp: string;
      correct: string;
      incorrect: string;
      correctAnswerWas: string;
      speedBonus: string;
      pointsEarned: string;
    };
    wordBattle: {
      name: string;
      startingLetter: string;
      category: string;
      inputPlaceholder: string;
      getReady: string;
      claimedWords: string;
      submit: string;
      mustStartWith: string;
      alreadyClaimed: string;
    };
    truthOrDare: {
      name: string;
      truth: string;
      dare: string;
      truthDesc: string;
      dareDesc: string;
      completed: string;
      refused: string;
      iCompleted: string;
      waitingForTarget: string;
      votePrompt: string;
      groupVerdict: string;
      rouletteTitle: string;
      rouletteDesc: string;
    };
    neverHaveIEver: {
      name: string;
      iHave: string;
      never: string;
      innocencePoints: string;
      statementNumber: string;
      groupResults: string;
      percentageDid: string;
      standingsTitle: string;
    };
    mostLikelyTo: {
      name: string;
      whoIsMostLikely: string;
      tapToVote: string;
      votedMostLikely: string;
      penaltyDare: string;
      votesCount: string;
    };
    sipOrSpill: {
      name: string;
      inHotSeat: string;
      answeredLive: string;
      takeSip: string;
      spilledTruth: string;
      choseToSip: string;
      spillConfession: string;
      typeConfession: string;
      dilemmaTitle: string;
      awaitingDecision: string;
    };
    sillyRoulette: {
      name: string;
      spinningRoulette: string;
      selectedPlayer: string;
      didCompleteDare: string;
      nailedIt: string;
      penalty: string;
      victorious: string;
      crowdPenalty: string;
    };
    hotPotato: {
      name: string;
      bombIsTicking: string;
      youHaveTheBomb: string;
      passBomb: string;
      typeWordPlaceholder: string;
      exploded: string;
      consequence: string;
      passSuccess: string;
    };
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    common: {
      brandName: 'FETO GAMES',
      brandTagline: 'Fast, Free Multiplayer Party Games',
      online: 'online',
      players: 'players',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      close: 'Close',
      copy: 'Copy',
      copied: 'Copied!',
      error: 'Error',
      loading: 'Loading...',
      back: 'Back',
      next: 'Next',
      round: 'Round',
      of: 'of',
      vs: 'vs',
      pts: 'pts',
      share: 'Share',
      secondsRemaining: 's Remaining',
      timeRemaining: 'Time Remaining',
      you: 'You',
      host: 'Host',
      vipBadge: 'VIP'
    },
    nav: {
      home: 'Home',
      games: 'Party Games',
      leaderboard: 'Leaderboard',
      about: 'About FETO GAMES',
      howToPlay: 'How to Play',
      customDecks: 'Custom Prompts',
      soundToggle: 'Sound',
      languageToggle: 'عربي'
    },
    home: {
      heroBadge: '15-Player Instant Party Rooms',
      heroTitle: 'Instant Party Games',
      heroTitleHighlight: 'With Your Crew',
      heroDesc: 'Zero downloads, zero sign-ups. Create a private room in seconds or jump into quick play across phones, tablets, and laptops.',
      createRoom: 'Create Room',
      joinRoom: 'Join Room',
      quickMatch: 'Quick Match (Public)',
      publicRooms: 'Public Rooms',
      noPublicRooms: 'No public rooms open right now. Be the legend who creates the first room!',
      nicknameLabel: 'Your Party Nickname',
      nicknamePlaceholder: 'Choose your party nickname',
      selectAvatar: 'Pick Your Avatar',
      randomizeNickname: 'Randomize Nickname',
      howToPlayTitle: 'How It Works in 3 Quick Steps',
      step1Title: '1. Create or Join',
      step1Desc: 'Start a room and get an instant 6-character room code or join via invite link.',
      step2Title: '2. Gather Up to 15 Friends',
      step2Desc: 'Everyone joins in seconds from their phone or browser — no apps needed.',
      step3Title: '3. Pick a Game & Play',
      step3Desc: 'Play 10 social deduction, drawing, trivia, and rapid-fire party challenges in real time.',
      refreshRooms: 'Refresh Rooms',
      allModes: 'All Modes',
      playersInRoom: 'players in room'
    },
    about: {
      title: 'Built for Instant Online Game Nights',
      desc: 'FETO GAMES is a fast, zero-download multiplayer party platform built for friends, families, and online crews. Create a private room in seconds, share a 6-character code or link, and play 10 interactive party games together across phones, tablets, and desktops — up to 15 players in real time.',
      feature1Title: 'Instant Browser Play',
      feature1Desc: 'No downloads, no sign-ups, just join and play.',
      feature2Title: 'Up to 15 Players Live',
      feature2Desc: 'Real-time sync across mobile and desktop.',
      feature3Title: '10 Party Classics & Custom Prompts',
      feature3Desc: 'From social deduction and drawing to rapid trivia and chaos challenges.',
      gotItBtn: "Got It, Let's Play"
    },
    createRoom: {
      title: 'Create Private Room',
      subtitle: 'Customize settings or launch instantly',
      gameModeLabel: 'Select Starting Game',
      vibeModeLabel: 'Vibe & Intensity',
      vibeChill: 'Chill & Casual',
      vibeParty: 'Party Mode',
      vibeChaotic: 'Chaotic & Wild',
      vibeSip: 'Sip Edition 🥤',
      roundDuration: 'Round Timer',
      totalRounds: 'Total Rounds',
      maxPlayers: 'Max Players',
      privateRoom: 'Private Room (PIN Protected)',
      privateRoomDesc: 'Require a 4-digit code to join',
      roomPin: '4-Digit PIN',
      pinPlaceholder: 'e.g. 1234',
      createBtn: 'Launch Party Room',
      creating: 'Launching...'
    },
    joinRoom: {
      title: 'Join Party Room',
      subtitle: 'Enter the 6-character room code',
      codeLabel: 'Room Code',
      codePlaceholder: 'e.g. K8M4P2',
      pinLabel: 'Room PIN (if protected)',
      pinPlaceholder: '4-digit PIN',
      joinBtn: 'Enter Room',
      joining: 'Joining...'
    },
    lobby: {
      roomCode: 'Room Code',
      shareInvite: 'Copy Invite Link',
      linkCopied: 'Invite link copied to clipboard!',
      qrCode: 'QR Code',
      ready: 'Ready',
      notReady: 'Not Ready',
      startGame: 'Start Game',
      starting: 'Starting...',
      forceStart: 'Force Start',
      waitingForHost: 'Waiting for Host to start...',
      playersCount: 'Players',
      settings: 'Room Settings',
      playlist: 'Game Playlist',
      hostTag: 'Host',
      youTag: '(You)',
      kick: 'Kick',
      leaveRoom: 'Leave Room',
      leaveConfirm: 'Are you sure you want to leave this room?',
      roomSettingsTitle: 'Room Settings',
      vibeEdition: 'Vibe Mode',
      roundsCount: 'Rounds',
      roundDurationSec: 'Round Duration'
    },
    controls: {
      hostControls: 'Host Controls',
      endRoundNow: 'End Round Now',
      nextRound: 'Next Round',
      nextGame: 'Next Game',
      finishMatch: 'Finish Match',
      backToLobby: 'Back to Lobby',
      backToLobbyConfirmTitle: 'Return to Lobby?',
      backToLobbyConfirmDesc: 'All connected players will stay together in this room and return to the lobby.',
      resetScoresOption: 'Reset accumulated scores to zero',
      confirmBackToLobby: 'Yes, Back to Lobby',
      keepPlaying: 'Keep Playing'
    },
    podium: {
      matchResults: 'Match Results',
      podiumTitle: 'Podium of Champions',
      winner: 'WINNER',
      secondPlace: '2nd Place',
      thirdPlace: '3rd Place',
      totalScore: 'Total Score',
      backToLobbyCrew: 'Back to Lobby (Same Crew)',
      waitingForHostLobby: 'Waiting for host to return room to lobby...',
      shareRecap: 'Share Results',
      playAgain: 'Play Again',
      awardsTitle: 'Party Superlatives'
    },
    games: {
      imposter: {
        name: 'Who Is The Imposter?',
        category: 'Category',
        yourRole: 'Your Secret Role',
        tapToView: 'Tap to View Secret',
        hideRole: 'Hide Role',
        youAreImposter: 'YOU ARE THE IMPOSTER!',
        imposterDesc: 'You do NOT know the secret word. Listen closely to clues, blend in, and avoid getting voted out.',
        fellowImposters: 'Fellow Imposters',
        yourSecretWord: 'YOUR SECRET WORD:',
        civilianDesc: 'Give a subtle 1-word or short clue related to this word without making it too obvious for the imposter!',
        yourTurnSubmit: 'It is your turn! Submit your clue below',
        waitingForClue: 'Waiting for {username} to submit their clue...',
        cluePlaceholder: 'Type your 1-word or short clue...',
        submitClue: 'Submit',
        submittedClues: 'Submitted Clues',
        voteForImposter: 'Vote For The Imposter',
        voteDesc: 'Who gave a suspicious or out-of-place clue? Tap a player to cast your vote.',
        voted: 'Voted ✓',
        vote: 'Vote',
        imposterCaught: 'Imposter Caught!',
        finalGuessChance: 'Final Guess Chance',
        finalGuessPlaceholder: 'Guess the secret word...',
        stealWin: 'Steal Round Win!',
        waitingForImposterGuess: 'Waiting for imposter to submit final guess...',
        imposterWon: '😈 The Imposters Won!',
        civiliansWon: '🎉 Civilians Win!',
        secretWordWas: 'Secret Word Was'
      },
      drawAndGuess: {
        name: 'Draw & Guess',
        youAreDrawing: 'You Are Drawing!',
        isDrawing: '{username} is Drawing',
        secretWord: 'Secret Word',
        letters: 'Letters',
        guessedBadge: 'Guessed!',
        solvedBadge: 'Solved',
        liveGuesses: 'Live Guesses',
        typeGuess: 'Type your guess...',
        chatDrawer: 'Chat with players...',
        alreadyGuessed: 'You already guessed correctly!',
        chooseWord: 'Choose a Word',
        chooseWordDesc: 'Pick one of the 3 words below to draw for the room:',
        roundOverWordWas: 'Round Over! The Word Was:',
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard',
        brushSize: 'Brush Size',
        eraser: 'Eraser',
        undo: 'Undo',
        clearCanvas: 'Clear Canvas'
      },
      quizBattle: {
        name: 'Quiz Battle',
        questionNumber: 'Question {n} of {total}',
        selectAnswer: 'Pick the correct answer quickly for maximum points:',
        lockedIn: 'Answer locked in! Waiting for others...',
        timesUp: "Time's Up!",
        correct: 'Correct! 🎉',
        incorrect: 'Incorrect! ❌',
        correctAnswerWas: 'Correct Answer Was:',
        speedBonus: 'Speed Bonus',
        pointsEarned: 'Points Earned'
      },
      wordBattle: {
        name: 'Word Battle',
        startingLetter: 'Starting Letter',
        category: 'Category',
        inputPlaceholder: 'Word starting with "{letter}"...',
        getReady: 'Get Ready!',
        claimedWords: 'Unique words claimed',
        submit: 'Submit Word',
        mustStartWith: 'Word must start with letter "{letter}"!',
        alreadyClaimed: '"{word}" is already claimed!'
      },
      truthOrDare: {
        name: 'Truth or Dare',
        truth: 'TRUTH',
        dare: 'DARE',
        truthDesc: 'Answer an honest question',
        dareDesc: 'Perform a fun party dare',
        completed: 'Completed',
        refused: 'Refused / Chicken',
        iCompleted: 'I Completed It! (+100 pts)',
        waitingForTarget: 'Waiting for {username} to choose TRUTH or DARE...',
        votePrompt: 'Did {username} complete the challenge?',
        groupVerdict: 'Round Verdict',
        rouletteTitle: 'Spinning Selection Wheel...',
        rouletteDesc: 'Selecting which player faces the party challenge!'
      },
      neverHaveIEver: {
        name: 'Never Have I Ever',
        iHave: 'I Have (Take a Sip 🥤)',
        never: 'Never',
        innocencePoints: 'Innocence Points',
        statementNumber: 'Statement #{n}',
        groupResults: 'Group Results',
        percentageDid: '{pct}% of the room has done this!',
        standingsTitle: 'Innocence Standings'
      },
      mostLikelyTo: {
        name: 'Most Likely To...',
        whoIsMostLikely: 'Who Is Most Likely To...',
        tapToVote: 'Tap a player to vote:',
        votedMostLikely: 'Voted Most Likely!',
        penaltyDare: 'Penalty Challenge:',
        votesCount: 'votes'
      },
      sipOrSpill: {
        name: 'Sip or Spill',
        inHotSeat: 'In The Hot Seat',
        answeredLive: 'Answered Live',
        takeSip: 'Take a Sip 🥤',
        spilledTruth: '{username} Spilled The Truth!',
        choseToSip: '{username} Chose To Sip!',
        spillConfession: 'Spill Your Confession',
        typeConfession: 'Type your answer or confess out loud to the room:',
        dilemmaTitle: 'Dilemma',
        awaitingDecision: 'Watching {username} make their choice! Will they confess or drink?'
      },
      sillyRoulette: {
        name: 'Silly Roulette',
        spinningRoulette: 'Spinning Roulette...',
        selectedPlayer: 'Selected Player:',
        didCompleteDare: 'Did they complete the dare?',
        nailedIt: 'Nailed It! (+180)',
        penalty: 'Penalty',
        victorious: '🎉 Challenge Victorious!',
        crowdPenalty: '💀 The Crowd Demanded Penalty!'
      },
      hotPotato: {
        name: 'Hot Potato',
        bombIsTicking: 'The Bomb is Ticking!',
        youHaveTheBomb: '💥 YOU HAVE THE BOMB! Type a word and PASS IT!',
        passBomb: 'Pass Bomb',
        typeWordPlaceholder: 'Type a valid word in category...',
        exploded: 'BOOM! The Bomb Exploded on {username}!',
        consequence: 'Penalty Consequence:',
        passSuccess: 'Passed!'
      }
    }
  },
  ar: {
    common: {
      brandName: 'فيتو جيمز',
      brandTagline: 'ألعاب بارتي جماعية سريعة ومجانية',
      online: 'متصل',
      players: 'لاعبين',
      cancel: 'إلغاء',
      confirm: 'تأكيد',
      save: 'حفظ',
      close: 'إغلاق',
      copy: 'نسخ',
      copied: 'تم النسخ!',
      error: 'خطأ',
      loading: 'جارِ التحميل...',
      back: 'رجوع',
      next: 'التالي',
      round: 'جولة',
      of: 'من',
      vs: 'ضد',
      pts: 'نقطة',
      share: 'مشاركة',
      secondsRemaining: 'ثوانٍ متبقية',
      timeRemaining: 'الوقت المتبقي',
      you: 'أنت',
      host: 'الهوست',
      vipBadge: 'VIP'
    },
    nav: {
      home: 'الرئيسية',
      games: 'ألعاب الحفلات',
      leaderboard: 'لوحة الصدارة',
      about: 'عن فيتو جيمز',
      howToPlay: 'طريقة اللعب',
      customDecks: 'كروت مخصصة',
      soundToggle: 'الصوت',
      languageToggle: 'EN'
    },
    home: {
      heroBadge: 'غرف بارتي فورية حتى 15 لاعب',
      heroTitle: 'ألعاب جماعية فورية',
      heroTitleHighlight: 'مع شلتك',
      heroDesc: 'بدون تحميل ولا تسجيل. اعمل غرفة خاصة في ثواني أو العب سريع مع أصحابك من الموبايل أو التابلت أو الكمبيوتر.',
      createRoom: 'إنشاء غرفة',
      joinRoom: 'دخول غرفة',
      quickMatch: 'لعب سريع (عام)',
      publicRooms: 'الغرف العامة',
      noPublicRooms: 'مفيش غرف عامة مفتوحة دلوقتي. كون الأسطورة اللي هيعمل أول غرفة!',
      nicknameLabel: 'اسمك المستعار للعب',
      nicknamePlaceholder: 'اكتب اسمك المستعار',
      selectAvatar: 'اختار شخصيتك',
      randomizeNickname: 'تغيير الاسم عشوائياً',
      howToPlayTitle: 'طريقة اللعب في 3 خطوات بسيطة',
      step1Title: '١. أنشئ أو انضم',
      step1Desc: 'افتح غرفة واحصل على كود من 6 حروف أو ابعت لينك الدعوة لأصحابك.',
      step2Title: '٢. جمع لحد 15 لاعب',
      step2Desc: 'الكل يقدر يدخل في ثواني من الموبايل أو المتصفح — بدون أي أبلكيشن.',
      step3Title: '٣. اختار اللعبة والعب',
      step3Desc: '10 ألعاب من التحقيق والرسم والمعلومات والتحديات السريعة في نفس اللحظة.',
      refreshRooms: 'تحديث الغرف',
      allModes: 'كل الألعاب',
      playersInRoom: 'لاعبين في الغرفة'
    },
    about: {
      title: 'مصممة لسهرات ولعب أونلاين فورية',
      desc: 'فيتو جيمز هي منصة ألعاب جماعية سريعة بدون أي تحميل، اتعملت عشان الصحاب والعائلات والشلل. اعمل غرفة خاصة في ثواني، شير الكود من 6 حروف أو اللينك، والعبوا 10 ألعاب بارتي تفاعلية سوا من الموبايل أو التابلت أو الكمبيوتر — لحد 15 لاعب في نفس اللحظة.',
      feature1Title: 'لعب فوري من المتصفح',
      feature1Desc: 'بدون تحميل أو تسجيل، ادخل والعب علطول.',
      feature2Title: 'لحد 15 لاعب لايف',
      feature2Desc: 'تزامن فوري بين الموبايل والكمبيوتر.',
      feature3Title: '10 ألعاب بارتي مميزة وممتعة',
      feature3Desc: 'من التحقيق والتخمين والرسم للمعلومات والتحديات المجنونة.',
      gotItBtn: 'فهمت، يلا نلعب!'
    },
    createRoom: {
      title: 'إنشاء غرفة خاصة',
      subtitle: 'ظبط الإعدادات على مزاجك أو انطلق فوراً',
      gameModeLabel: 'اختار أول لعبة',
      vibeModeLabel: 'أجواء وحماس اللعب',
      vibeChill: 'رايق وهادي',
      vibeParty: 'حماس وسهرة',
      vibeChaotic: 'جنون وتحديات قوية',
      vibeSip: 'مود الرشفات 🥤',
      roundDuration: 'وقت الجولة',
      totalRounds: 'عدد الجولات',
      maxPlayers: 'الحد الأقصى للاعبين',
      privateRoom: 'غرفة برمز سري (PIN)',
      privateRoomDesc: 'طلب رمز سري من 4 أرقام للدخول',
      roomPin: 'الرمز السري (4 أرقام)',
      pinPlaceholder: 'مثال: 1234',
      createBtn: 'انطلق وافتح الغرفة',
      creating: 'جارِ إنشاء الغرفة...'
    },
    joinRoom: {
      title: 'الانضمام لغرفة',
      subtitle: 'اكتب كود الغرفة المكون من 6 حروف',
      codeLabel: 'كود الغرفة',
      codePlaceholder: 'مثال: K8M4P2',
      pinLabel: 'الرمز السري (لو الغرفة مقفولة)',
      pinPlaceholder: 'رمز PIN من 4 أرقام',
      joinBtn: 'ادخل الغرفة',
      joining: 'جارِ الدخول...'
    },
    lobby: {
      roomCode: 'كود الغرفة',
      shareInvite: 'نسخ رابط الدعوة',
      linkCopied: 'تم نسخ رابط الدعوة للحافظة!',
      qrCode: 'كود QR',
      ready: 'جاهز',
      notReady: 'مش جاهز',
      startGame: 'ابدأ اللعبة',
      starting: 'جارِ البدء...',
      forceStart: 'بدء إجباري',
      waitingForHost: 'في انتظار الهوست يبدأ اللعبة...',
      playersCount: 'اللاعبين',
      settings: 'إعدادات الغرفة',
      playlist: 'قائمة الألعاب',
      hostTag: 'الهوست',
      youTag: '(أنت)',
      kick: 'طرد',
      leaveRoom: 'مغادرة الغرفة',
      leaveConfirm: 'متأكد إنك عاوز تخرج من الغرفة دي؟',
      roomSettingsTitle: 'إعدادات الغرفة',
      vibeEdition: 'نوع الأجواء',
      roundsCount: 'الجولات',
      roundDurationSec: 'مدة الجولة'
    },
    controls: {
      hostControls: 'تحكم الهوست',
      endRoundNow: 'إنهاء الجولة الآن',
      nextRound: 'الجولة التالية',
      nextGame: 'اللعبة التالية',
      finishMatch: 'إنهاء المباراة',
      backToLobby: 'العودة للوبي',
      backToLobbyConfirmTitle: 'الرجوع للوبي؟',
      backToLobbyConfirmDesc: 'كل اللاعبين المتصلين هيرجعوا سوا للوبي في نفس كود الغرفة.',
      resetScoresOption: 'تصفير النقاط التراكمية',
      confirmBackToLobby: 'أيوة، ارجع للوبي',
      keepPlaying: 'كمل لعب'
    },
    podium: {
      matchResults: 'نتائج المباراة',
      podiumTitle: 'منصة الأبطال',
      winner: 'البطل الأول',
      secondPlace: 'المركز الثاني',
      thirdPlace: 'المركز الثالث',
      totalScore: 'مجموع النقاط',
      backToLobbyCrew: 'العودة للوبي (نفس الشلة)',
      waitingForHostLobby: 'في انتظار الهوست لإعادة الغرفة للوبي...',
      shareRecap: 'مشاركة النتائج',
      playAgain: 'العب تاني',
      awardsTitle: 'ألقاب السهرة'
    },
    games: {
      imposter: {
        name: 'مين الجاسوس؟',
        category: 'القسم',
        yourRole: 'دورك السري',
        tapToView: 'اضغط لرؤية السر',
        hideRole: 'إخفاء الدور',
        youAreImposter: 'أنت الجاسوس!',
        imposterDesc: 'أنت متعرفش الكلمة السرية! اسمع تلميحات الناس، مثل إنك عارف، واوعى تتكشف!',
        fellowImposters: 'الجواسيس معاك',
        yourSecretWord: 'كلمتك السرية هي:',
        civilianDesc: 'قول تلميح ذكي بكلمة واحدة أو جملة قصيرة من غير ما توضحها للجاسوس!',
        yourTurnSubmit: 'ده دورك! اكتب تلميحك تحت',
        waitingForClue: 'في انتظار {username} يكتب تلميحه...',
        cluePlaceholder: 'اكتب تلميحك بكلمة واحدة أو كلمتين...',
        submitClue: 'إرسال',
        submittedClues: 'التلميحات المكتوبة',
        voteForImposter: 'صوّت على الجاسوس',
        voteDesc: 'مين اللي قال تلميح غريب وشاكك فيه؟ اضغط وصوت عليه.',
        voted: 'تم التصويت ✓',
        vote: 'صوّت',
        imposterCaught: 'الجاسوس اتمسك!',
        finalGuessChance: 'فرصة التخمين الأخيرة',
        finalGuessPlaceholder: 'خمّن الكلمة السرية...',
        stealWin: 'اخطف الفوز بالجولة!',
        waitingForImposterGuess: 'في انتظار الجاسوس يكتب تخمينه الأخير...',
        imposterWon: '😈 الجواسيس فازوا!',
        civiliansWon: '🎉 الأبرياء فازوا!',
        secretWordWas: 'الكلمة السرية كانت'
      },
      drawAndGuess: {
        name: 'ارسم وخمّن',
        youAreDrawing: 'أنت الرسام دلوقتي!',
        isDrawing: '{username} بيرسم دلوقتي',
        secretWord: 'الكلمة السرية',
        letters: 'حروف',
        guessedBadge: 'خمّنت صح!',
        solvedBadge: 'حلّوها',
        liveGuesses: 'التخمينات المباشرة',
        typeGuess: 'اكتب تخمينك هنا...',
        chatDrawer: 'دردش مع اللاعبين...',
        alreadyGuessed: 'أنت خمّنت صح خلاص!',
        chooseWord: 'اختار كلمة ترسمها',
        chooseWordDesc: 'اختار كلمة من التلاتة دول عشان ترسمها للغرفة:',
        roundOverWordWas: 'خلصت الجولة! الكلمة كانت:',
        easy: 'سهل',
        medium: 'متوسط',
        hard: 'صعب',
        brushSize: 'حجم الفرشاة',
        eraser: 'ممحاة',
        undo: 'تراجع',
        clearCanvas: 'مسح اللوحة'
      },
      quizBattle: {
        name: 'تحدي المعلومات',
        questionNumber: 'سؤال {n} من {total}',
        selectAnswer: 'اختار الإجابة الصح بسرعة لأعلى نقاط:',
        lockedIn: 'تم تسجيل إجابتك! في انتظار الباقيين...',
        timesUp: 'انتهى الوقت!',
        correct: 'إجابة صحيحة! 🎉',
        incorrect: 'إجابة خاطئة! ❌',
        correctAnswerWas: 'الإجابة الصحيحة كانت:',
        speedBonus: 'بونص السرعة',
        pointsEarned: 'النقاط المكتسبة'
      },
      wordBattle: {
        name: 'حرب الكلمات',
        startingLetter: 'الحرف المطلوب',
        category: 'القسم',
        inputPlaceholder: 'اكتب كلمة تبدأ بحرف "{letter}"...',
        getReady: 'استعدوا!',
        claimedWords: 'كلمات مميزة تم حجزها',
        submit: 'إرسال الكلمة',
        mustStartWith: 'الكلمة لازم تبدأ بحرف "{letter}"!',
        alreadyClaimed: '"{word}" تم حجزها قبل كده!'
      },
      truthOrDare: {
        name: 'صراحة ولا جرأة',
        truth: 'صراحة',
        dare: 'جرأة',
        truthDesc: 'جاوب على سؤال بصراحة تامة',
        dareDesc: 'نفّذ تحدي مجنون قدام الكل',
        completed: 'نفّذ التحدي',
        refused: 'جبن / ما نفّذش',
        iCompleted: 'أنا نفذت التحدي! (+100 نقطة)',
        waitingForTarget: 'في انتظار {username} يختار صراحة ولا جرأة...',
        votePrompt: 'هل {username} نفّذ التحدي بجد؟',
        groupVerdict: 'قرار الجولة',
        rouletteTitle: 'العجلة بتلف لاختيار الضحية...',
        rouletteDesc: 'مين صاحب الحظ اللي هيواجه التحدي؟'
      },
      neverHaveIEver: {
        name: 'عمري ما عملت...',
        iHave: 'حصلت (خد رشفة 🥤)',
        never: 'مستحيل',
        innocencePoints: 'نقاط البراءة',
        statementNumber: 'جملة رقم {n}',
        groupResults: 'نتائج الغرفة',
        percentageDid: '{pct}% من اللي في الغرفة عملوها!',
        standingsTitle: 'ترتيب البراءة'
      },
      mostLikelyTo: {
        name: 'مين أكتر واحد ممكن...',
        whoIsMostLikely: 'مين أكتر واحد فينا ممكن...',
        tapToVote: 'اضغط على لاعب للتصويت:',
        votedMostLikely: 'اختاروه أكتر واحد!',
        penaltyDare: 'تحدي العقاب:',
        votesCount: 'أصوات'
      },
      sipOrSpill: {
        name: 'جاوب ولا اشرب',
        inHotSeat: 'على كرسي الاعتراف',
        answeredLive: 'جاوب قدام الكل',
        takeSip: 'اشرب رشفة 🥤',
        spilledTruth: '{username} اعترف بالحقيقة!',
        choseToSip: '{username} اختار يشرب!',
        spillConfession: 'اعترف بالحقيقة',
        typeConfession: 'اكتب اعترافك أو قوله بصوت عالي للشلة:',
        dilemmaTitle: 'الورطة',
        awaitingDecision: 'بنشوف {username} هيعمل إيه! هيعترف ولا هيشرب؟'
      },
      sillyRoulette: {
        name: 'عجلة الجنون',
        spinningRoulette: 'العجلة بتلف...',
        selectedPlayer: 'اللاعب المختار:',
        didCompleteDare: 'هل نفذ التحدي بجد؟',
        nailedIt: 'ظبطها وكسب! (+180)',
        penalty: 'عقاب',
        victorious: '🎉 كسب التحدي بجدارة!',
        crowdPenalty: '💀 الجمهور قرر العقاب!'
      },
      hotPotato: {
        name: 'القنبلة الموقوتة',
        bombIsTicking: 'القنبلة بتكتك!',
        youHaveTheBomb: '💥 القنبلة معاك! اكتب كلمة ومررها بسرعة!',
        passBomb: 'مرر القنبلة',
        typeWordPlaceholder: 'اكتب كلمة صحيحة في القسم...',
        exploded: 'بوووم! القنبلة فرقعت في {username}!',
        consequence: 'عقاب الانفجار:',
        passSuccess: 'تم التمرير!'
      }
    }
  }
};

/**
 * Helper to fetch a nested translation string with optional interpolation params:
 * e.g., getTranslation('ar', 'games.imposter.waitingForClue', { username: 'Omar' })
 */
export function getTranslation(
  lang: Language,
  path: string,
  params?: Record<string, string | number>
): string {
  const dict = translations[lang] || translations.en;
  const parts = path.split('.');
  let current: any = dict;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      // Fallback to English
      let fallback: any = translations.en;
      for (const fbPart of parts) {
        if (fallback && typeof fallback === 'object' && fbPart in fallback) {
          fallback = fallback[fbPart];
        } else {
          return path;
        }
      }
      current = fallback;
      break;
    }
  }

  if (typeof current !== 'string') {
    return path;
  }

  let result = current;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
  }

  return result;
}
