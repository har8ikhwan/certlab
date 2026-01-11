// Exercise JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('menu-btn');
    const menuModal = document.getElementById('menu-modal');
    const submitBtn = document.getElementById('submit-btn');
    const closeBtn = document.querySelector('.close');
    const floatingMenu = document.querySelector('.floating-menu');

    // Submit modal (matches test.html design)
    const submitModal = document.getElementById('submitModal');
    const submitTitle = document.getElementById('submitTitle');
    const submitNo = document.getElementById('submitNo');
    const submitYes = document.getElementById('submitYes');

    let currentAction = null;

    const EXERCISE_PROGRESS_PREFIX = 'exercise_progress_v1_';
    const EXERCISE_LAST_CONTEXT_KEY = 'exercise_last_context_v1';

    function getExerciseContext(){
        const ssSource = sessionStorage.getItem('mn_source');
        const ssChapter = sessionStorage.getItem('mn_chapter');

        if (ssSource || ssChapter) {
            return {
                source: ssSource || 'ongoing',
                chapter: ssChapter || 'unknown'
            };
        }

        // Fallback if sessionStorage was cleared (new tab, refresh, etc.)
        try {
            const raw = localStorage.getItem(EXERCISE_LAST_CONTEXT_KEY);
            if (!raw) return { source: 'ongoing', chapter: 'unknown' };
            const data = JSON.parse(raw);
            return {
                source: (data && data.source) ? data.source : 'ongoing',
                chapter: (data && data.chapter) ? data.chapter : 'unknown'
            };
        } catch (e) {
            return { source: 'ongoing', chapter: 'unknown' };
        }
    }

    function getExerciseProgressKey(){
        const ctx = getExerciseContext();
        return EXERCISE_PROGRESS_PREFIX + String(ctx.source || 'ongoing') + '_' + String(ctx.chapter || 'unknown');
    }

    // Legacy (older bug): progress saved only by chapter, causing conflicts between ongoing/completed.
    function getLegacyExerciseProgressKey(){
        const ctx = getExerciseContext();
        return EXERCISE_PROGRESS_PREFIX + String(ctx.chapter || 'unknown');
    }

    function setSubmitTitle(text){
        if (!submitTitle) return;
        submitTitle.textContent = text;
    }

    function openSubmitModal(){
        if (!submitModal) return;
        submitModal.hidden = false;
        submitModal.setAttribute('aria-hidden', 'false');
    }

    function closeSubmitModal(){
        if (!submitModal) return;
        submitModal.hidden = true;
        submitModal.setAttribute('aria-hidden', 'true');
    }

    function saveExerciseProgress(currentIndexValue, questionsValue){
        try {
            const ctx = getExerciseContext();
            const answers = {};
            questionsValue.forEach(function(q){
                const checked = q.querySelector('input[type="radio"]:checked');
                if (!checked || !checked.name) return;
                answers[checked.name] = checked.value;
            });

            localStorage.setItem(EXERCISE_LAST_CONTEXT_KEY, JSON.stringify({
                source: ctx.source,
                chapter: ctx.chapter,
                at: Date.now()
            }));

            localStorage.setItem(getExerciseProgressKey(), JSON.stringify({
                index: currentIndexValue,
                answers: answers,
                source: ctx.source,
                chapter: ctx.chapter,
                at: Date.now()
            }));
        } catch (e) {
            // Ignore storage errors (private mode, quota, etc.)
        }
    }

    function loadExerciseProgress(questionsValue){
        try {
            const ctx = getExerciseContext();

            // First try the new (source+chapter) key.
            let raw = localStorage.getItem(getExerciseProgressKey());

            // Fallback: try legacy (chapter-only) key ONLY if its stored source matches current source.
            if (!raw) {
                const legacyRaw = localStorage.getItem(getLegacyExerciseProgressKey());
                if (legacyRaw) {
                    let legacyData;
                    try { legacyData = JSON.parse(legacyRaw); } catch (e) { legacyData = null; }
                    if (legacyData && (!legacyData.source || legacyData.source === ctx.source)) {
                        raw = legacyRaw;
                        // Migrate forward so future loads are conflict-free.
                        try { localStorage.setItem(getExerciseProgressKey(), legacyRaw); } catch (e) {}
                    }
                }
            }

            if (!raw) return null;

            const data = JSON.parse(raw);
            if (!data || typeof data !== 'object') return null;

            const answers = data.answers && typeof data.answers === 'object' ? data.answers : {};
            Object.keys(answers).forEach(function(name){
                const value = answers[name];
                const input = document.querySelector('input[type="radio"][name="' + name + '"][value="' + String(value).replace(/"/g, '\\"') + '"]');
                if (input) input.checked = true;
            });

            const idx = Number(data.index);
            if (!Number.isFinite(idx)) return { index: 0 };
            return { index: idx };
        } catch (e) {
            return null;
        }
    }

    function clearExerciseProgress(){
        try { localStorage.removeItem(getExerciseProgressKey()); } catch (e) {}
        // Also clear legacy key for the same chapter.
        try { localStorage.removeItem(getLegacyExerciseProgressKey()); } catch (e) {}
    }

    function hideFloatingMenu() {
        if (!floatingMenu) return;
        floatingMenu.hidden = true;
        floatingMenu.setAttribute('aria-hidden', 'true');
    }

    function toggleFloatingMenu() {
        if (!floatingMenu) return;
        const willShow = floatingMenu.hidden;
        floatingMenu.hidden = !willShow;
        floatingMenu.setAttribute('aria-hidden', String(!willShow));
    }

    // Show menu/home/exit icons only after clicking the menu button
    menuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleFloatingMenu();
    });

    // Close menu modal
    closeBtn.addEventListener('click', function() {
        menuModal.style.display = 'none';
    });

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target == menuModal) {
            menuModal.style.display = 'none';
        }
        if (submitModal && event.target === submitModal) {
            closeSubmitModal();
        }

        // Clicking anywhere else closes the floating icon menu
        if (floatingMenu && !floatingMenu.hidden) {
            const clickedInside = floatingMenu.contains(event.target) || menuBtn.contains(event.target);
            if (!clickedInside) hideFloatingMenu();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') hideFloatingMenu();
        if (e.key === 'Escape' && submitModal && !submitModal.hidden) closeSubmitModal();
    });

    // Menu actions (now use submit-style modal)
    document.getElementById('profile-btn').addEventListener('click', function() {
        menuModal.style.display = 'none';
        setSubmitTitle('GO TO PROFILE?');
        currentAction = 'profile';
        openSubmitModal();
    });

    document.getElementById('menu-nav-btn').addEventListener('click', function() {
        menuModal.style.display = 'none';
        setSubmitTitle('GO TO MENU?');
        currentAction = 'menu';
        openSubmitModal();
    });

    document.getElementById('exit-btn').addEventListener('click', function() {
        menuModal.style.display = 'none';
        setSubmitTitle('EXIT CURRENT EXERCISE?');
        currentAction = 'exit';
        openSubmitModal();
    });

    // Submit button
    // Pagination: show one question per page
    const questions = Array.from(document.querySelectorAll('.question'));
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const progressPill = document.getElementById('progress-pill');
    const questionTitle = document.getElementById('question-title');
    const fmExit = document.getElementById('fm-exit');
    const fmHome = document.querySelector('.floating-menu .fm-btn[data-action="home"]');
    const fmProfile = document.querySelector('.floating-menu .fm-btn[data-action="profile"]');
    let currentIndex = 0;

    function showQuestion(index) {
        questions.forEach((q, i) => {
            q.style.display = i === index ? 'block' : 'none';
        });
        const isLast = index === questions.length - 1;
        // Keep Prev visible (disabled on first) to preserve centered layout.
        prevBtn.style.display = 'inline-block';
        prevBtn.disabled = index === 0;

        nextBtn.style.display = isLast ? 'none' : 'inline-block';
        // show submit check button only on last
        submitBtn.style.display = isLast ? 'inline-block' : 'none';
        // update header title and progress
        if (questionTitle) questionTitle.textContent = `Question ${index + 1}`;
        if (progressPill) progressPill.textContent = `${index + 1} of ${questions.length}`;
    }

    prevBtn.addEventListener('click', function() {
        if (currentIndex > 0) {
            currentIndex -= 1;
            showQuestion(currentIndex);
        }
    });

    nextBtn.addEventListener('click', function() {
        if (currentIndex < questions.length - 1) {
            currentIndex += 1;
            showQuestion(currentIndex);
        }
    });

    // Submit button now validates all questions before confirming
    submitBtn.addEventListener('click', function() {
        const unanswered = questions.some((q, i) => {
            const inputs = q.querySelectorAll('input[type="radio"]');
            return !Array.from(inputs).some(inp => inp.checked);
        });
        if (unanswered) {
            alert('Please answer all questions before submitting.');
            return;
        }

        setSubmitTitle('SUBMIT CURRENT EXERCISE?');
        currentAction = 'submit';
        openSubmitModal();
    });

    if (submitNo) submitNo.addEventListener('click', function(){
        closeSubmitModal();
        currentAction = null;
    });
    if (submitYes) submitYes.addEventListener('click', function(){
        closeSubmitModal();

        const ctx = getExerciseContext();
        const menuNotesHref = (ctx.source === 'completed') ? 'menunotescompleted.html' : 'menunotesongoing.html';

        if (currentAction === 'home') {
            saveExerciseProgress(currentIndex, questions);
            window.location.href = 'landingpage.html';
        } else if (currentAction === 'profile') {
            saveExerciseProgress(currentIndex, questions);
            window.location.href = 'profile.html';
        } else if (currentAction === 'menu') {
            window.location.href = 'landingpage.html';
        } else if (currentAction === 'exit') {
            saveExerciseProgress(currentIndex, questions);
            window.location.href = menuNotesHref;
        } else if (currentAction === 'submit') {
            clearExerciseProgress();
            window.location.href = menuNotesHref;
        }
        currentAction = null;
    });

    // Initialize view (restore saved progress if available)
    if (questions.length > 0) {
        const saved = loadExerciseProgress(questions);
        if (saved && Number.isFinite(saved.index)) {
            currentIndex = Math.max(0, Math.min(questions.length - 1, saved.index));
        }
        showQuestion(currentIndex);
    }

    // Ensure icon menu starts hidden
    hideFloatingMenu();

    // Floating icon menu navigation
    if (fmHome) {
        fmHome.addEventListener('click', function(e) {
            e.preventDefault();
            hideFloatingMenu();
            setSubmitTitle('GO TO HOME?');
            currentAction = 'home';
            openSubmitModal();
        });
    }

    if (fmProfile) {
        fmProfile.addEventListener('click', function(e) {
            e.preventDefault();
            hideFloatingMenu();
            setSubmitTitle('GO TO PROFILE?');
            currentAction = 'profile';
            openSubmitModal();
        });
    }

    if (fmExit) {
        fmExit.addEventListener('click', function(e) {
            e.preventDefault();
            hideFloatingMenu();
            setSubmitTitle('EXIT CURRENT EXERCISE?');
            currentAction = 'exit';
            openSubmitModal();
        });
    }
});