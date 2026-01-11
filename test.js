document.addEventListener('DOMContentLoaded', function(){
    const questions = Array.prototype.slice.call(document.querySelectorAll('.question'));
    const questionTitle = document.getElementById('question-title');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const progressPill = document.getElementById('progressPill');
    const timerEl = document.getElementById('timer');

    const submitModal = document.getElementById('submitModal');
    const submitNo = document.getElementById('submitNo');
    const submitYes = document.getElementById('submitYes');
    const submitTitle = document.getElementById('submitTitle');

    const submitNoLabel = submitNo ? submitNo.querySelector('.action-label') : null;
    const submitNoIcon = submitNo ? submitNo.querySelector('.action-icon') : null;
    const submitYesLabel = submitYes ? submitYes.querySelector('.action-label') : null;
    const submitYesIcon = submitYes ? submitYes.querySelector('.action-icon') : null;

    const defaultModal = {
        title: submitTitle ? submitTitle.textContent : 'SUBMIT CURRENT TEST?',
        noLabel: submitNoLabel ? submitNoLabel.textContent : 'NO',
        noIcon: submitNoIcon ? submitNoIcon.textContent : '✖',
        yesLabel: submitYesLabel ? submitYesLabel.textContent : 'YES',
        yesIcon: submitYesIcon ? submitYesIcon.textContent : '✔'
    };

    let modalMode = 'submit';

    const params = new URLSearchParams(location.search);
    const chapterRaw = params.get('ch') || '1';
    const chapter = String(chapterRaw).replace(/[^0-9]/g, '') || '1';
    const chapterKey = 'ch' + chapter;

    const correct = {
        q1: 'User control and freedom',
        q2: 'Consistency and standards',
        q3: 'Proximity'
    };

    let currentIndex = 0;

    function setActive(index){
        questions.forEach(function(q, i){
            q.classList.toggle('active', i === index);
        });

        if (questionTitle) questionTitle.textContent = 'Question ' + (index + 1);
        if (progressPill) progressPill.textContent = (index + 1) + ' of ' + questions.length;

        if (prevBtn) prevBtn.disabled = index === 0;
        const isLast = index === questions.length - 1;
        if (nextBtn) nextBtn.style.display = isLast ? 'none' : 'flex';
        if (submitBtn) submitBtn.style.display = isLast ? 'flex' : 'none';
    }

    function setSubmitModalMode(mode){
        modalMode = mode;
        if (!submitModal) return;

        if (mode === 'timeout'){
            if (submitTitle) submitTitle.textContent = "TIME IS UP";
            if (submitNo) submitNo.style.display = 'none';
            if (submitYesLabel) submitYesLabel.textContent = 'OK';
            if (submitYesIcon) submitYesIcon.textContent = '✔';
            submitModal.dataset.mode = 'timeout';
            return;
        }

        if (submitTitle) submitTitle.textContent = defaultModal.title;
        if (submitNo) submitNo.style.display = '';
        if (submitNoLabel) submitNoLabel.textContent = defaultModal.noLabel;
        if (submitNoIcon) submitNoIcon.textContent = defaultModal.noIcon;
        if (submitYesLabel) submitYesLabel.textContent = defaultModal.yesLabel;
        if (submitYesIcon) submitYesIcon.textContent = defaultModal.yesIcon;
        delete submitModal.dataset.mode;
    }

    function openSubmitModal(){
        submitModal.hidden = false;
        submitModal.setAttribute('aria-hidden', 'false');
    }

    function closeSubmitModal(){
        if (modalMode === 'timeout') return;
        submitModal.hidden = true;
        submitModal.setAttribute('aria-hidden', 'true');
    }

    function allAnswered(){
        return Object.keys(correct).every(function(name){
            return !!document.querySelector('input[name="' + name + '"]:checked');
        });
    }

    function computeScore(){
        let score = 0;
        Object.keys(correct).forEach(function(name){
            const chosen = document.querySelector('input[name="' + name + '"]:checked');
            if (chosen && chosen.value === correct[name]) score += 1;
        });
        return score;
    }

    function submitTest(){
        const score = computeScore();
        const pass = score >= 2;

        localStorage.setItem('hcl_test_result_' + chapterKey, pass ? 'passed' : 'failed');
        localStorage.setItem('hcl_test_last', JSON.stringify({
            chapter: chapterKey,
            outcome: pass ? 'passed' : 'failed',
            score: score,
            total: questions.length,
            at: Date.now()
        }));

        // Small delay prevents the "tap release" from triggering a button
        // on the next page (common in some mobile webviews).
        setTimeout(function(){
            location.href = 'menunotesongoing.html';
        }, 250);
    }

    if (prevBtn) prevBtn.addEventListener('click', function(){
        if (currentIndex > 0){
            currentIndex -= 1;
            setActive(currentIndex);
        }
    });

    if (nextBtn) nextBtn.addEventListener('click', function(){
        if (currentIndex < questions.length - 1){
            currentIndex += 1;
            setActive(currentIndex);
        }
    });

    if (submitBtn) submitBtn.addEventListener('click', function(){
        if (!allAnswered()){
            alert('Please answer all questions before submitting.');
            return;
        }
        setSubmitModalMode('submit');
        openSubmitModal();
    });

    if (submitNo) submitNo.addEventListener('click', closeSubmitModal);
    if (submitYes) submitYes.addEventListener('click', function(){
        if (modalMode === 'timeout'){
            // Time ran out: submit immediately after user acknowledges.
            modalMode = 'submit';
            if (submitModal){
                submitModal.hidden = true;
                submitModal.setAttribute('aria-hidden', 'true');
            }
            submitTest();
            return;
        }

        modalMode = 'submit';
        if (submitModal){
            submitModal.hidden = true;
            submitModal.setAttribute('aria-hidden', 'true');
        }
        submitTest();
    });

    if (submitModal) submitModal.addEventListener('click', function(e){
        if (e.target === submitModal && modalMode !== 'timeout') closeSubmitModal();
    });

    document.addEventListener('keydown', function(e){
        if (e.key === 'Escape' && submitModal && !submitModal.hidden && modalMode !== 'timeout') closeSubmitModal();
    });

    // timer (3:05)
    (function(){
        if (!timerEl) return;
        let remaining = 3 * 60 + 5;
        let timerId = null;
        let timeoutHandled = false;

        function handleTimeout(){
            if (timeoutHandled) return;
            timeoutHandled = true;
            if (timerId) clearInterval(timerId);
            setSubmitModalMode('timeout');
            openSubmitModal();
        }

        function render(){
            const m = Math.floor(remaining / 60);
            const s = remaining % 60;
            timerEl.textContent = m + ':' + String(s).padStart(2, '0');
        }

        render();
        timerId = setInterval(function(){
            if (remaining <= 0){
                handleTimeout();
                return;
            }
            remaining -= 1;
            render();

            if (remaining === 0) handleTimeout();
        }, 1000);
    })();

    setActive(0);
});
