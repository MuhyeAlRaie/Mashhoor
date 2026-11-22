/* ============================================================
   Mashhoor Games Suite — i18n
   English is the default interface language. Arabic is fully
   wired in as well (dir=rtl); set language from the Admin
   panel or the in-app toggle. Add more languages by extending
   MashhoorI18N.dict with a new code.
   ============================================================ */
(function (global) {
  'use strict';

  var DICT = {
    en: {
      /* core */
      play: 'Play', playNow: 'Play now', howToPlay: 'How to play', adminPanel: 'Admin Panel',
      back: 'Back', home: 'Home', restart: 'Restart round', pause: 'Pause', resume: 'Resume',
      quit: 'Quit', sound: 'Sound', fullscreen: 'Fullscreen', language: 'Language',
      loading: 'Loading', start: 'Start', close: 'Close', reset: 'Reset', resetScores: 'Reset scores',
      resetAll: 'Restore defaults', confirmResetAll: 'Restore all suite settings to defaults? Custom images and names will be lost on this device.',
      saved: 'Saved', error: 'Something went wrong', score: 'Score', best: 'Best', wins: 'Wins', draws: 'Draws',
      player: 'Player', computer: 'Computer', easy: 'Easy', normal: 'Normal', hard: 'Hard',
      timeLeft: 'Time', seconds: 's', points: 'pts', newBest: 'New best!',
      /* landing */
      suiteTitle: 'Games Suite', suiteTagline: 'Official interactive games — play, win, enjoy the crunch!',
      chooseGame: 'Choose your game', kioskMode: 'Kiosk fullscreen',
      settingsLocalNote: 'Settings and scores are stored locally on this device only. Use the Admin Panel on each restaurant device.',
      madeFor: 'Made for',
      tag2p: '2 players', tagTouch: 'Touch-first', tagCamera: 'Camera', tagPWA: 'PWA mobile', tagArcade: 'Arcade', tagKiosk: 'Kiosk',
      xoName: 'Mashhoor XO', xoDesc: 'The classic tic-tac-toe showdown: Fried Chicken vs. Chicken Burger. Two players on one screen — or face the computer.',
      motionName: 'Motion Challenge', motionDesc: 'Catch flying Mashhoor products with your bare hands! Real-time hand tracking with your camera — solo or head-to-head.',
      dashName: 'Chicken Dash', dashDesc: 'Endless runner with the Mashhoor mascot. Swipe to dodge obstacles and collect products on your phone.',
      /* XO */
      xoTagline: 'Fried Chicken vs. Chicken Burger', chooseMode: 'Choose a game mode',
      twoPlayers: '2 Players', vsComputer: 'vs Computer', cpuLevel: 'Computer level',
      turnOf: 'Turn', itsADraw: "It's a draw!", winsRound: 'wins!',
      xoHow: 'Take turns tapping empty cells. Line up three of your products across, down, or diagonally to win the round.',
      playerX: 'Player 1', playerO: 'Player 2', vs: 'vs',
      /* Motion */
      motionTagline: 'Catch products with your hands',
      singlePlayer: 'Single player', twoPlayersMotion: 'Two players',
      enableCamera: 'Enable camera & start', playWithPointer: 'Play with touch / mouse',
      cameraPrep: 'Camera check', showYourHand: 'Show your open hand to the camera',
      handReady: 'Hand detected!', notDetected: 'No hand detected yet',
      modelLoading: 'Loading hand tracking engine', getReady: 'Get ready', go: 'GO!',
      cameraDenied: 'Camera permission was denied.',
      cameraDeniedHint: 'Allow camera access for this site in your browser settings, then tap Retry. On restaurant kiosks, approve the camera prompt once — the browser remembers it.',
      cameraNotFound: 'No camera was found on this device.',
      cameraError: 'The camera could not start.',
      httpsHint: 'Camera access requires HTTPS (GitHub Pages provides it automatically).',
      timeUp: "Time's up!", results: 'Results', winnerIs: 'Winner', tieGame: 'Tie game!',
      instr1: 'Raise your open hand about 50–80 cm from the camera.',
      instr2: 'Move your index fingertip to touch the flying products.',
      instr3: 'Grab as many as you can before time runs out!',
      instrTwo: 'In two-player mode the screen splits in half — the hand on the left plays for Player 1, the hand on the right plays for Player 2.',
      zoneP1: 'P1', zoneP2: 'P2',
      pointerHint: 'Move your finger or mouse to catch products.',
      cameraStarting: 'Starting camera', retry: 'Retry',
      /* Dash */
      dashTagline: 'Run, dodge, collect!', tapToPlay: 'Tap to play',
      chooseCharacter: 'Choose your chicken', instructions: 'How to play',
      instrSwipeUp: 'Swipe up to jump', instrSwipeDown: 'Swipe down to slide',
      instrSwipeLeft: 'Swipe left / right to change lanes', instrGoal: 'Collect Mashhoor products, dodge obstacles, and keep running as long as you can.',
      instrGolden: 'Catch the golden chicken for bonus points!',
      paused: 'Paused', gameOverTitle: 'Game Over', finalScore: 'Score', bestScore: 'Best',
      retry: 'Play again', mainMenu: 'Main menu', distance: 'Distance',
      rotateDevice: 'Please rotate your phone to portrait',
      touchButtons: 'Touch buttons', installHint: 'Tip: install the game on your phone (Add to Home Screen) for fullscreen play.',
      collected: 'Collected',
      /* admin */
      adminTitle: 'Admin & Customization', tabBranding: 'Branding', tabProducts: 'Products',
      tabXO: 'XO', tabMotion: 'Motion', tabDash: 'Chicken Dash', tabData: 'Data & Backup',
      logoLightBg: 'Logo for light backgrounds', logoDarkBg: 'Logo for dark backgrounds',
      brandName: 'Brand name', taglineLabel: 'Tagline', identityLabel: 'Identity',
      primaryColor: 'Primary color (red)', darkColor: 'Dark color', goldColor: 'Accent color (gold)',
      soundsEnabled: 'Sound effects', volume: 'Volume', defaultLanguage: 'Default interface language',
      productImagesNames: 'Product images & names', productName: 'Name', productSize: 'Size in games',
      productPoints: 'Points value', showInMotion: 'Show in Motion Challenge',
      uploadImage: 'Upload', removeImage: 'Remove', restoreImg: 'Restore default',
      xoSettings: 'XO settings', defaultMode: 'Default mode', cpuDifficulty: 'Computer level',
      motionSettings: 'Motion Challenge settings', roundDuration: 'Round duration', difficulty: 'Difficulty',
      showSkeleton: 'Show hand skeleton overlay',
      dashSettings: 'Chicken Dash settings', gameName: 'Game name', characterSkins: 'Chicken characters (skins)',
      skinName: 'Character name', backgroundImage: 'Runner background (optional)', customMusic: 'Background music (optional)',
      speedMultiplier: 'Speed multiplier', touchButtonsLabel: 'Show touch buttons',
      exportSettings: 'Export settings (JSON)', importSettings: 'Import settings (JSON)',
      clearScores: 'Clear saved scores', clearAll: 'Clear everything',
      storageWarning: 'Important: all settings are saved in this browser on THIS device only. They do not sync automatically to other restaurant devices. Export the JSON file and import it on other devices, or connect a backend (see README).',
      quotaWarning: 'Storage is full — the image was too large. Try a smaller file.',
      invalidFile: 'This file is not supported. Please use a PNG or JPG image.',
      invalidJson: 'Invalid settings file.',
      xoScores: 'XO match scores', motionBest: 'Motion best scores', dashBest: 'Chicken Dash best score',
      imageTooBig: 'Image is too large. Please use a file under 4 MB.',
      languageNote: 'Applies to all games on this device.',
      resetDone: 'Settings restored to defaults'
    },

    ar: {
      /* core */
      play: 'اللعب', playNow: 'العب الآن', howToPlay: 'طريقة اللعب', adminPanel: 'لوحة الإدارة',
      back: 'رجوع', home: 'الرئيسية', restart: 'إعادة الجولة', pause: 'إيقاف مؤقت', resume: 'متابعة',
      quit: 'خروج', sound: 'الصوت', fullscreen: 'ملء الشاشة', language: 'اللغة',
      loading: 'جارِ التحميل', start: 'ابدأ', close: 'إغلاق', reset: 'تصفير', resetScores: 'تصفير النتائج',
      resetAll: 'استعادة الإعدادات الافتراضية', confirmResetAll: 'استعادة جميع إعدادات المنظومة الافتراضية؟ سيتم فقد الصور والأسماء المخصصة على هذا الجهاز.',
      saved: 'تم الحفظ', error: 'حدث خطأ ما', score: 'النقاط', best: 'الأفضل', wins: 'فوز', draws: 'تعادل',
      player: 'لاعب', computer: 'الكمبيوتر', easy: 'سهل', normal: 'متوسط', hard: 'صعب',
      timeLeft: 'الوقت', seconds: 'ث', points: 'نقطة', newBest: 'رقم قياسي جديد!',
      /* landing */
      suiteTitle: 'منظومة الألعاب', suiteTagline: 'الألعاب التفاعلية الرسمية — العب، اربح، واستمتع بالقرمشة!',
      chooseGame: 'اختر لعبتك', kioskMode: 'وضع الصالة (ملء الشاشة)',
      settingsLocalNote: 'الإعدادات والنتائج تُحفظ محليًا على هذا الجهاز فقط. استخدم لوحة الإدارة على كل جهاز داخل المطعم.',
      madeFor: 'صُممت لـ',
      tag2p: 'لاعبان', tagTouch: 'أولوية اللمس', tagCamera: 'كاميرا', tagPWA: 'تطبيق موبايل PWA', tagArcade: 'أركيد', tagKiosk: 'صالة',
      xoName: 'ماشهور إكس أو', xoDesc: 'لعبة إكس أو الكلاسيكية بين الدجاج المقلي وبرجر الدجاج. لاعبان على شاشة واحدة — أو نافس الكمبيوتر.',
      motionName: 'تحدي الحركة', motionDesc: 'التقط منتجات Mashhoor الطائرة بيدك! تتبع يد فوري عبر الكاميرا — فردي أو نزال مباشر.',
      dashName: 'ركضة الدجاجة', dashDesc: 'لعبة جري لا نهائية بشخصية Mashhoor. اسحب لتفادي العوائق واجمع المنتجات على هاتفك.',
      /* XO */
      xoTagline: 'الدجاج المقلي ضد برجر الدجاج', chooseMode: 'اختر نمط اللعب',
      twoPlayers: 'لاعبان', vsComputer: 'ضد الكمبيوتر', cpuLevel: 'مستوى الكمبيوتر',
      turnOf: 'الدور', itsADraw: 'تعادل!', winsRound: 'يفوز!',
      xoHow: 'تناوبا على اختيار الخانات الفارغة. اصطف ثلاث منتجات متتالية أفقيًا أو عموديًا أو قطريًا للفوز بالجولة.',
      playerX: 'اللاعب الأول', playerO: 'اللاعب الثاني', vs: 'ضد',
      /* Motion */
      motionTagline: 'التقط المنتجات بيدك',
      singlePlayer: 'لاعب واحد', twoPlayersMotion: 'لاعبان',
      enableCamera: 'تفعيل الكاميرا والبدء', playWithPointer: 'اللعب باللمس / الفأرة',
      cameraPrep: 'فحص الكاميرا', showYourHand: 'ارفع يدك المفتوحة أمام الكاميرا',
      handReady: 'تم رصد اليد!', notDetected: 'لم تُرصد يد بعد',
      modelLoading: 'جارِ تحميل محرك تتبع اليد', getReady: 'استعد', go: 'انطلق!',
      cameraDenied: 'تم رفض إذن الكاميرا.',
      cameraDeniedHint: 'اسمح بالوصول للكاميرا لهذا الموقع من إعدادات المتصفح ثم اضغط إعادة المحاولة. على شاشات المطعم، وافق على طلب الكاميرا مرة واحدة وسيُتذكر ذلك.',
      cameraNotFound: 'لم يتم العثور على كاميرا في هذا الجهاز.',
      cameraError: 'تعذر تشغيل الكاميرا.',
      httpsHint: 'يتطلب الوصول للكاميرا اتصال HTTPS (موقع GitHub Pages يوفره تلقائيًا).',
      timeUp: 'انتهى الوقت!', results: 'النتائج', winnerIs: 'الفائز', tieGame: 'تعادل!',
      instr1: 'ارفع يدك المفتوحة على بعد 50–80 سم من الكاميرا.',
      instr2: 'حرّك طرف إصبعك السبابة ليلامس المنتجات الطائرة.',
      instr3: 'اجمع أكبر عدد ممكن قبل انتهاء الوقت!',
      instrTwo: 'في وضع اللاعبين تنقسم الشاشة نصفين — اليد على اليسار تلعب للاعب 1 واليد على اليمين للاعب 2.',
      zoneP1: 'لاعب 1', zoneP2: 'لاعب 2',
      pointerHint: 'حرّك إصبعك أو الفأرة لالتقاط المنتجات.',
      cameraStarting: 'جارِ تشغيل الكاميرا', retry: 'إعادة المحاولة',
      /* Dash */
      dashTagline: 'اركض، تفادَ، اجمع!', tapToPlay: 'اضغط للعب',
      chooseCharacter: 'اختر دجاجتك', instructions: 'طريقة اللعب',
      instrSwipeUp: 'اسحب لأعلى للقفز', instrSwipeDown: 'اسحب لأسفل للانزلاق',
      instrSwipeLeft: 'اسحب يمينًا/يسارًا لتغيير المسار', instrGoal: 'اجمع منتجات Mashhoor، تفادَ العوائق، واستمر بالجري أطول فترة ممكنة.',
      instrGolden: 'التقط الدجاجة الذهبية لنقاط إضافية!',
      paused: 'إيقاف مؤقت', gameOverTitle: 'انتهت اللعبة', finalScore: 'النقاط', bestScore: 'الأفضل',
      retry: 'العب مجددًا', mainMenu: 'القائمة الرئيسية', distance: 'المسافة',
      rotateDevice: 'أرجو تدوير الهاتف للوضع العمودي',
      touchButtons: 'أزرار اللمس', installHint: 'نصيحة: ثبّت اللعبة على هاتفك (إضافة إلى الشاشة الرئيسية) للعب بملء الشاشة.',
      collected: 'المجموعات',
      /* admin */
      adminTitle: 'الإدارة والتخصيص', tabBranding: 'الهوية', tabProducts: 'المنتجات',
      tabXO: 'إكس أو', tabMotion: 'الحركة', tabDash: 'ركضة الدجاجة', tabData: 'البيانات والنسخ',
      logoLightBg: 'الشعار للخلفيات الفاتحة', logoDarkBg: 'الشعار للخلفيات الداكنة',
      brandName: 'اسم العلامة', taglineLabel: 'الشعار النصي', identityLabel: 'الهوية',
      primaryColor: 'اللون الأساسي (أحمر)', darkColor: 'اللون الداكن', goldColor: 'لون التمييز (ذهبي)',
      soundsEnabled: 'المؤثرات الصوتية', volume: 'مستوى الصوت', defaultLanguage: 'لغة الواجهة الافتراضية',
      productImagesNames: 'صور المنتجات وأسماؤها', productName: 'الاسم', productSize: 'الحجم داخل الألعاب',
      productPoints: 'قيمة النقاط', showInMotion: 'إظهارها في تحدي الحركة',
      uploadImage: 'رفع صورة', removeImage: 'إزالة', restoreImg: 'استعادة الافتراضية',
      xoSettings: 'إعدادات إكس أو', defaultMode: 'النمط الافتراضي', cpuDifficulty: 'مستوى الكمبيوتر',
      motionSettings: 'إعدادات تحدي الحركة', roundDuration: 'مدة الجولة', difficulty: 'الصعوبة',
      showSkeleton: 'إظهار هيكل اليد على الشاشة',
      dashSettings: 'إعدادات ركضة الدجاجة', gameName: 'اسم اللعبة', characterSkins: 'شخصيات الدجاجة (الأزياء)',
      skinName: 'اسم الشخصية', backgroundImage: 'خلفية الجري (اختياري)', customMusic: 'موسيقى خلفية (اختياري)',
      speedMultiplier: 'مضاعف السرعة', touchButtonsLabel: 'إظهار أزرار اللمس',
      exportSettings: 'تصدير الإعدادات (JSON)', importSettings: 'استيراد الإعدادات (JSON)',
      clearScores: 'مسح النتائج المحفوظة', clearAll: 'مسح كل شيء',
      storageWarning: 'مهم: جميع الإعدادات تُحفظ في متصفح هذا الجهاز فقط ولا تنتقل تلقائيًا لأجهزة المطعم الأخرى. صدّر ملف JSON واستورده على الأجهزة الأخرى، أو اربط خدمة Backend (انظر README).',
      quotaWarning: 'مساحة التخزين ممتلئة — الصورة كبيرة جدًا. جرّب ملفًا أصغر.',
      invalidFile: 'هذا الملف غير مدعوم. الرجاء استخدام صورة PNG أو JPG.',
      invalidJson: 'ملف الإعدادات غير صالح.',
      xoScores: 'نتائج مباريات إكس أو', motionBest: 'أفضل نتائج التحدي', dashBest: 'أفضل نتيجة لركضة الدجاجة',
      imageTooBig: 'الصورة كبيرة جدًا. استخدم ملفًا أقل من 4 ميجابايت.',
      languageNote: 'تُطبق على جميع الألعاب في هذا الجهاز.',
      resetDone: 'تمت استعادة الإعدادات الافتراضية'
    }
  };

  var LANG_KEY = 'mashhoor_lang';
  var current = 'en';

  function detect() {
    try {
      var s = localStorage.getItem(LANG_KEY);
      if (s && DICT[s]) return s;
    } catch (e) { /* private mode */ }
    return 'en';
  }

  function t(key) {
    var d = DICT[current] || DICT.en;
    return (key && d[key] !== undefined) ? d[key] : (DICT.en[key] !== undefined ? DICT.en[key] : key);
  }

  function set(lang, skipApply) {
    if (!DICT[lang]) lang = 'en';
    current = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }
    if (!skipApply) apply();
    global.dispatchEvent(new CustomEvent('mashhoor:lang', { detail: { lang: lang } }));
  }

  function apply(root) {
    root = root || document;
    document.documentElement.lang = current;
    document.documentElement.dir = (current === 'ar') ? 'rtl' : 'ltr';
    var nodes = root.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].getAttribute('data-i18n'));
    }
    var phs = root.querySelectorAll('[data-i18n-ph]');
    for (var j = 0; j < phs.length; j++) {
      phs[j].setAttribute('placeholder', t(phs[j].getAttribute('data-i18n-ph')));
    }
    var ars = root.querySelectorAll('[data-i18n-aria]');
    for (var k = 0; k < ars.length; k++) {
      ars[k].setAttribute('aria-label', t(ars[k].getAttribute('data-i18n-aria')));
    }
  }

  current = detect();
  document.documentElement.lang = current;
  document.documentElement.dir = (current === 'ar') ? 'rtl' : 'ltr';
  document.addEventListener('DOMContentLoaded', function () { apply(); });

  global.MashhoorI18N = {
    t: t, set: set, apply: apply,
    get lang() { return current; },
    languages: Object.keys(DICT)
  };
})(window);
