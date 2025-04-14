// DOM Elements
const flashcard = document.querySelector('.flashcard');
const wordTitle = document.getElementById('wordTitle');
const pronunciation = document.getElementById('pronunciation');
const meaning = document.getElementById('meaning');
const example = document.getElementById('example');
const playPronunciationBtn = document.getElementById('playPronunciation');
const wrongBtn = document.getElementById('wrongBtn');
const correctBtn = document.getElementById('correctBtn');
const flipBtn = document.getElementById('flipBtn');
const settingsBtn = document.getElementById('settingsBtn');
const statsBtn = document.getElementById('statsBtn');
const helpBtn = document.getElementById('helpBtn');
const settingsModal = document.getElementById('settingsModal');
const fontSizeSlider = document.getElementById('fontSizeSlider');
const darkModeToggle = document.getElementById('darkModeToggle');
const resetBtn = document.getElementById('resetBtn');

let currentWord = null;

// تنظیمات
const settings = {
    fontSize: 16,
    darkMode: false,
    dailyLimit: 20  // تعداد سوال روزانه
};

// شاخص‌های نمایش کلمات در هر جعبه
const boxIndices = {
    box1: 0,
    box2: 0,
    box3: 0,
    box4: 0,
    box5: 0
};

// شمارنده تعداد سوالات روزانه
let dailyQuestionCount = 0;
let lastReviewDate = new Date().toDateString();

// بازیابی تنظیمات
function loadSettings() {
    const savedSettings = localStorage.getItem('leitnerSettings');
    if (savedSettings) {
        Object.assign(settings, JSON.parse(savedSettings));
        applySettings();
    }
    
    // بازیابی شاخص‌های جعبه‌ها
    const savedIndices = localStorage.getItem('boxIndices');
    if (savedIndices) {
        Object.assign(boxIndices, JSON.parse(savedIndices));
    } else {
        // ریست کردن شاخص‌ها
        Object.keys(boxIndices).forEach(box => boxIndices[box] = 0);
        localStorage.setItem('boxIndices', JSON.stringify(boxIndices));
    }
    
    // بازیابی شمارنده روزانه
    const savedCount = localStorage.getItem('dailyQuestionCount');
    const savedDate = localStorage.getItem('lastReviewDate');
    
    if (savedDate === new Date().toDateString()) {
        dailyQuestionCount = parseInt(savedCount) || 0;
    } else {
        // ریست کردن شاخص‌ها و شمارنده در روز جدید
        dailyQuestionCount = 0;
        Object.keys(boxIndices).forEach(box => boxIndices[box] = 0);
        localStorage.setItem('boxIndices', JSON.stringify(boxIndices));
        localStorage.setItem('lastReviewDate', new Date().toDateString());
        localStorage.setItem('dailyQuestionCount', '0');
    }
}

// اعمال تنظیمات
function applySettings() {
    document.documentElement.style.setProperty('--font-size', `${settings.fontSize}px`);
    document.body.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
    fontSizeSlider.value = settings.fontSize;
    darkModeToggle.checked = settings.darkMode;
}

// ذخیره تنظیمات
function saveSettings() {
    localStorage.setItem('leitnerSettings', JSON.stringify(settings));
}

// ذخیره وضعیت
function saveState() {
    localStorage.setItem('boxes', JSON.stringify(window.boxes));
    localStorage.setItem('boxIndices', JSON.stringify(boxIndices));
}

// نمایش وضعیت جعبه‌ها
function showBoxStatus() {
    Swal.fire({
        title: 'وضعیت جعبه‌ها',
        html: `
            <div dir="rtl">
                <p>جعبه ۱ (روزانه): ${window.boxes.box1.length} لغت</p>
                <p>جعبه ۲ (هر ۲ روز): ${window.boxes.box2.length} لغت</p>
                <p>جعبه ۳ (هر ۴ روز): ${window.boxes.box3.length} لغت</p>
                <p>جعبه ۴ (هر ۷ روز): ${window.boxes.box4.length} لغت</p>
                <p>جعبه ۵ (هر ۱۵ روز): ${window.boxes.box5.length} لغت</p>
                <hr>
                <p>تعداد سوالات امروز: ${dailyQuestionCount} از ${settings.dailyLimit}</p>
            </div>
        `,
        confirmButtonText: 'بستن'
    });
}

// نمایش کارت جدید
function showNewCard() {
    // بررسی محدودیت روزانه
    if (dailyQuestionCount >= settings.dailyLimit) {
        Swal.fire({
            title: 'پایان مرور روزانه',
            text: `شما به سقف تعداد سوالات روزانه (${settings.dailyLimit} سوال) رسیده‌اید. فردا دوباره تلاش کنید.`,
            icon: 'info',
            confirmButtonText: 'باشه'
        });
        return;
    }

    const today = new Date();
    
    // انتخاب کارت مناسب برای مرور به صورت ترتیبی
    let selectedWord = null;
    let selectedBox = null;

    // بررسی جعبه‌ها به ترتیب
    if (window.boxes.box1.length > 0 && boxIndices.box1 < window.boxes.box1.length) {
        selectedWord = window.boxes.box1[boxIndices.box1];
        selectedBox = 'box1';
        boxIndices.box1++;
    } else if (window.boxes.box2.length > 0 && today.getDate() % 2 === 0 && boxIndices.box2 < window.boxes.box2.length) {
        selectedWord = window.boxes.box2[boxIndices.box2];
        selectedBox = 'box2';
        boxIndices.box2++;
    } else if (window.boxes.box3.length > 0 && today.getDate() % 4 === 0 && boxIndices.box3 < window.boxes.box3.length) {
        selectedWord = window.boxes.box3[boxIndices.box3];
        selectedBox = 'box3';
        boxIndices.box3++;
    } else if (window.boxes.box4.length > 0 && today.getDate() % 7 === 0 && boxIndices.box4 < window.boxes.box4.length) {
        selectedWord = window.boxes.box4[boxIndices.box4];
        selectedBox = 'box4';
        boxIndices.box4++;
    } else if (window.boxes.box5.length > 0 && today.getDate() % 15 === 0 && boxIndices.box5 < window.boxes.box5.length) {
        selectedWord = window.boxes.box5[boxIndices.box5];
        selectedBox = 'box5';
        boxIndices.box5++;
    }

    // ریست کردن شاخص‌ها اگر به انتهای همه جعبه‌ها رسیدیم
    if (!selectedWord) {
        Object.keys(boxIndices).forEach(box => boxIndices[box] = 0);
        localStorage.setItem('boxIndices', JSON.stringify(boxIndices));
        
        // تلاش مجدد برای نمایش کارت از ابتدا
        if (window.boxes.box1.length > 0) {
            selectedWord = window.boxes.box1[0];
            selectedBox = 'box1';
            boxIndices.box1 = 1;
        }
    }

    if (selectedWord) {
        currentWord = { ...selectedWord, currentBox: selectedBox };
        displayWord(currentWord);
        dailyQuestionCount++;
        localStorage.setItem('dailyQuestionCount', dailyQuestionCount.toString());
        localStorage.setItem('boxIndices', JSON.stringify(boxIndices));
    } else {
        Swal.fire({
            title: 'تبریک!',
            text: 'شما همه کلمات امروز را مرور کرده‌اید.',
            icon: 'success',
            confirmButtonText: 'باشه'
        });
    }
}

// پخش تلفظ کلمه
function playPronunciation(word) {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.8; // سرعت آهسته‌تر برای وضوح بیشتر
    utterance.lang = 'en-US'; // تنظیم زبان به انگلیسی آمریکایی
    
    // پیدا کردن صدای آمریکایی مناسب
    const voices = speechSynthesis.getVoices();
    const americanVoice = voices.find(voice => 
        voice.lang.includes('en-US') && 
        voice.name.includes('Female') // ترجیحا صدای زن
    );
    
    if (americanVoice) {
        utterance.voice = americanVoice;
    }

    // تغییر آیکون به حالت در حال پخش
    const soundButton = document.getElementById('playPronunciation');
    let icon = soundButton.querySelector('i');
    
    // اگر المان آیکون وجود نداشت، آن را ایجاد کن
    if (!icon) {
        icon = document.createElement('i');
        icon.className = 'fas fa-volume-up';
        soundButton.innerHTML = '';
        soundButton.appendChild(icon);
    }

    // تغییر آیکون به حالت در حال پخش
    icon.className = 'fas fa-spinner fa-spin';
    soundButton.disabled = true;

    // بعد از اتمام پخش
    utterance.onend = () => {
        icon.className = 'fas fa-volume-up';
        soundButton.disabled = false;
    };

    // در صورت خطا
    utterance.onerror = () => {
        icon.className = 'fas fa-volume-up';
        soundButton.disabled = false;
        console.error('Error playing pronunciation');
    };

    speechSynthesis.speak(utterance);
}

// اطمینان از بارگذاری صداها
speechSynthesis.onvoiceschanged = () => {
    const voices = speechSynthesis.getVoices();
    console.log('Available voices:', voices.filter(v => v.lang.includes('en')));
};

// نمایش کلمه روی کارت
function displayWord(word) {
    if (!word) return;
    
    wordTitle.textContent = word.word;
    pronunciation.textContent = word.pronunciation;
    meaning.textContent = word.meaning;
    example.textContent = word.example;
    document.getElementById('synonyms').textContent = word.synonyms.join('، ');
    
    // تنظیم عملکرد دکمه صدا
    playPronunciationBtn.onclick = () => playPronunciation(word.word);
    
    flashcard.classList.remove('flipped');
}

// جابجایی کارت بین جعبه‌ها
function moveCard(correct) {
    if (!currentWord) return;

    const currentBox = parseInt(currentWord.currentBox.replace('box', ''));
    let newBox;

    if (correct) {
        newBox = Math.min(currentBox + 1, 5);
        window.stats.correctAnswers++;
    } else {
        newBox = 1;
        window.stats.wrongAnswers++;
    }

    // حذف از جعبه فعلی
    window.boxes[currentWord.currentBox] = window.boxes[currentWord.currentBox].filter(
        word => word.word !== currentWord.word
    );

    // اضافه به جعبه جدید
    window.boxes[`box${newBox}`].push({
        id: currentWord.id,
        word: currentWord.word,
        pronunciation: currentWord.pronunciation,
        meaning: currentWord.meaning,
        example: currentWord.example,
        synonyms: currentWord.synonyms,
        difficulty: currentWord.difficulty,
        audioUrl: currentWord.audioUrl
    });

    window.stats.totalReviewed++;
    window.stats.lastReviewDate = new Date().toISOString();
    
    saveState();
    saveStats();
    showNewCard();
}

// نمایش آمار
function showStats() {
    Swal.fire({
        title: 'آمار یادگیری',
        html: `
            <div dir="rtl">
                <p>تعداد کل مرور: ${window.stats.totalReviewed}</p>
                <p>پاسخ‌های درست: ${window.stats.correctAnswers}</p>
                <p>پاسخ‌های نادرست: ${window.stats.wrongAnswers}</p>
                <p>درصد موفقیت: ${Math.round((window.stats.correctAnswers / window.stats.totalReviewed) * 100 || 0)}%</p>
                <p>آخرین مرور: ${window.stats.lastReviewDate ? new Date(window.stats.lastReviewDate).toLocaleDateString('fa-IR') : 'هیچ'}</p>
            </div>
        `,
        confirmButtonText: 'بستن'
    });
}

// نمایش راهنما
function showHelp() {
    Swal.fire({
        title: 'راهنمای استفاده',
        html: `
            <div dir="rtl">
                <h3>سیستم لایتنر چیست؟</h3>
                <p>سیستم لایتنر یک روش مؤثر برای یادگیری لغات است که بر اساس تکرار در فواصل زمانی مشخص کار می‌کند.</p>
                
                <h3>نحوه استفاده:</h3>
                <ul>
                    <li>کارت را مطالعه کنید</li>
                    <li>روی کارت کلیک کنید تا برگردد</li>
                    <li>اگر پاسخ را می‌دانستید، دکمه "درست" را بزنید</li>
                    <li>اگر پاسخ را نمی‌دانستید، دکمه "نادرست" را بزنید</li>
                </ul>

                <h3>جعبه‌های لایتنر:</h3>
                <ul>
                    <li>جعبه ۱: مرور روزانه</li>
                    <li>جعبه ۲: مرور هر ۲ روز</li>
                    <li>جعبه ۳: مرور هر ۴ روز</li>
                    <li>جعبه ۴: مرور هر ۷ روز</li>
                    <li>جعبه ۵: مرور هر ۱۵ روز</li>
                </ul>
            </div>
        `,
        confirmButtonText: 'متوجه شدم'
    });
}

// Event Listeners
document.getElementById('flashcard').addEventListener('click', (e) => {
    // اگر روی دکمه صدا کلیک شده، از چرخش جلوگیری کن
    if (e.target.closest('#playPronunciation')) return;
    flashcard.classList.toggle('flipped');
});

wrongBtn.addEventListener('click', () => moveCard(false));
correctBtn.addEventListener('click', () => moveCard(true));

// نمایش مودال تنظیمات
settingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'block';
});

// بستن مودال با کلیک خارج از آن
window.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.style.display = 'none';
    }
});

// تایید ریست کردن برنامه
function confirmReset() {
    Swal.fire({
        title: 'آیا مطمئن هستید؟',
        text: 'تمام پیشرفت شما از بین خواهد رفت!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'بله، پاک شود',
        cancelButtonText: 'انصراف'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.clear();
            window.location.reload();
        }
    });
}

// دکمه ریست
document.getElementById('resetBtn').addEventListener('click', confirmReset);

// دکمه آمار
statsBtn.addEventListener('click', showStats);

// تغییر اندازه فونت
document.getElementById('fontSizeSlider').addEventListener('input', (e) => {
    settings.fontSize = parseInt(e.target.value);
    document.getElementById('fontSizeValue').textContent = `${settings.fontSize}px`;
    applySettings();
    saveSettings();
});

// تغییر حالت تاریک/روشن
document.getElementById('darkModeToggle').addEventListener('change', (e) => {
    settings.darkMode = e.target.checked;
    applySettings();
    saveSettings();
});

// تغییر تعداد سوال روزانه
document.getElementById('dailyLimitInput').addEventListener('change', (e) => {
    settings.dailyLimit = parseInt(e.target.value);
    saveSettings();
});

// نمایش وضعیت جعبه‌ها
document.getElementById('showBoxStatusBtn').addEventListener('click', showBoxStatus);

helpBtn.addEventListener('click', showHelp);

// Initialize
loadSettings();
showNewCard(); 