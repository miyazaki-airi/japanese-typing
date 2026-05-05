const App = {
  currentPage: "home",
  currentJlpt: 5,

  init() {
    this.bindNavigation();
    this.bindHomeButtons();
    this.bindPracticeControls();
    this.bindProgressPage();
    this.updateHomeStats();
  },

  // === 页面导航 ===

  bindNavigation() {
    document.querySelectorAll(".nav-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const page = btn.dataset.page;
        this.navigateTo(page);
      });
    });
  },

  navigateTo(page) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

    const pageEl = document.getElementById(`page-${page}`);
    const navBtn = document.querySelector(`.nav-btn[data-page="${page}"]`);
    if (pageEl) pageEl.classList.add("active");
    if (navBtn) navBtn.classList.add("active");

    this.currentPage = page;

    if (page === "practice") this.startPractice();
    if (page === "wordlist") this.renderWordList();
    if (page === "progress") this.renderProgress();
    if (page === "home") this.updateHomeStats();
  },

  // === 首页 ===

  bindHomeButtons() {
    document.querySelectorAll(".btn-jlpt").forEach(btn => {
      btn.addEventListener("click", () => {
        this.currentJlpt = parseInt(btn.dataset.jlpt);
        this.navigateTo("practice");
      });
    });
  },

  updateHomeStats() {
    const stats = Progress.getStats();
    const el = document.getElementById("home-stats");
    if (!el) return;

    if (stats.totalPracticed === 0) {
      el.innerHTML = "";
      return;
    }

    el.innerHTML = `
      <p>已练习 <strong>${stats.totalPracticed}</strong> 个单词，
      掌握 <strong>${stats.mastered}</strong> 个，正确率 <strong>${stats.accuracy}%</strong></p>
    `;
  },

  // === 练习页 ===

  bindPracticeControls() {
    // JLPT 筛选
    document.querySelectorAll("#page-practice .filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#page-practice .filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentJlpt = parseInt(btn.dataset.jlpt);
        this.startPractice();
      });
    });

    // 语速
    document.querySelectorAll(".speed-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".speed-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        AudioPlayer.setRate(parseFloat(btn.dataset.speed));
      });
    });

    // 发音按钮 - 句子播完后播单词
    document.getElementById("btn-audio").addEventListener("click", () => {
      const word = PracticeSession.currentWord();
      if (word) AudioPlayer.speakSentenceThenWord(word.example.reading, word.reading);
    });

    // 跳过
    document.getElementById("btn-skip").addEventListener("click", () => {
      this.advanceToNext();
    });

    // 结果页按钮
    document.getElementById("btn-retry").addEventListener("click", () => {
      this.startPractice();
    });

    document.getElementById("btn-back-home").addEventListener("click", () => {
      this.navigateTo("home");
    });

    // 输入框
    const input = document.getElementById("typing-input");
    input.addEventListener("input", (e) => {
      TypingEngine.handleInput(e.target.value);
    });
  },

  startPractice() {
    const ok = PracticeSession.init(this.currentJlpt, 10);
    if (!ok) return;

    document.getElementById("practice-result").classList.add("hidden");
    document.getElementById("practice-card").classList.remove("hidden");
    document.querySelector(".practice-controls").classList.remove("hidden");

    PracticeSession.onSessionComplete = (stats) => this.showResults(stats);

    this.loadWord();
  },

  loadWord() {
    const word = PracticeSession.currentWord();
    if (!word) return;

    // 渲染句子：before + taberu(吃) + after
    document.getElementById("sentence-before").textContent = word.example.before;
    document.getElementById("sentence-blank").textContent = `${word.romaji}(${word.meaning})`;
    document.getElementById("sentence-after").textContent = word.example.after;
    document.getElementById("sentence-reading").textContent = word.example.reading;
    document.getElementById("sentence-meaning").textContent = word.example.meaning;

    TypingEngine.init(word.romaji, {
      onComplete: (correct) => {
        PracticeSession.recordResult(word.id, correct);
        Progress.record(word.id, correct);
        this.updateProgressBar();
        setTimeout(() => this.advanceToNext(), correct ? 600 : 1200);
      }
    });

    this.updateProgressBar();

    // 自动发音：先播句子，再播单词
    AudioPlayer.speakSentenceThenWord(word.example.reading, word.reading);

    const input = document.getElementById("typing-input");
    input.value = "";
    input.focus();
  },

  advanceToNext() {
    const nextWord = PracticeSession.nextWord();
    if (!nextWord) return;
    this.loadWord();
  },

  updateProgressBar() {
    const p = PracticeSession.progress();
    document.getElementById("session-progress").style.width = `${p.percent}%`;
    document.getElementById("session-progress-text").textContent = `${p.current}/${p.total}`;
  },

  showResults(stats) {
    document.getElementById("practice-card").classList.add("hidden");
    document.querySelector(".practice-controls").classList.add("hidden");
    document.getElementById("practice-result").classList.remove("hidden");

    document.getElementById("result-correct").textContent = stats.correct;
    document.getElementById("result-wrong").textContent = stats.wrong;
    document.getElementById("result-accuracy").textContent = `${stats.accuracy}%`;
  },

  // === 单词列表页 ===

  renderWordList() {
    // JLPT filter buttons in wordlist page
    const filterBtns = document.querySelectorAll("#page-wordlist .filter-btn");
    filterBtns.forEach(btn => {
      btn.onclick = () => {
        filterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.renderWordList();
      };
    });

    const activeFilter = document.querySelector("#page-wordlist .filter-btn.active");
    const jlpt = activeFilter ? parseInt(activeFilter.dataset.jlpt) : 5;
    const words = getWordsByJlpt(jlpt);
    const container = document.getElementById("wordlist");

    container.innerHTML = words.map(w => {
      const status = Progress.getStatus(w.id);
      const statusClass = status === "mastered" ? "mastered"
        : status === "learning" ? "learning" : "";
      return `
        <div class="word-item" data-id="${w.id}">
          <div class="word-item-kanji">${w.word}</div>
          <div class="word-item-info">
            <span class="word-item-reading">${w.reading}</span>
            <span class="word-item-romaji">${w.romaji}</span>
          </div>
          <div class="word-item-meaning">${w.meaning}</div>
          <div class="word-item-status ${statusClass}"></div>
        </div>
      `;
    }).join("");

    // click word to play sentence audio
    container.querySelectorAll(".word-item").forEach(item => {
      item.addEventListener("click", () => {
        const word = WORDS.find(w => w.id === parseInt(item.dataset.id));
        if (word) AudioPlayer.speak(word.example.reading);
      });
    });
  },

  // === 进度页 ===

  bindProgressPage() {
    document.getElementById("btn-reset").addEventListener("click", () => {
      if (confirm("确定要重置所有学习进度吗？此操作不可撤销。")) {
        Progress.reset();
        this.renderProgress();
      }
    });
  },

  renderProgress() {
    const stats = Progress.getStats();

    document.getElementById("stat-total").textContent = stats.totalPracticed;
    document.getElementById("stat-mastered").textContent = stats.mastered;
    document.getElementById("stat-learning").textContent = stats.learning;
    document.getElementById("stat-accuracy").textContent = `${stats.accuracy}%`;

    // JLPT breakdown
    const container = document.getElementById("progress-jlpt");
    const levels = [
      { level: 5, label: "JLPT N5" },
      { level: 4, label: "JLPT N4" }
    ];

    container.innerHTML = levels.map(({ level, label }) => {
      const s = Progress.getJlptStats(level);
      const percent = s.total > 0 ? Math.round((s.mastered / s.total) * 100) : 0;
      return `
        <div class="progress-jlpt-item">
          <div class="progress-jlpt-label">${label}</div>
          <div class="progress-jlpt-bar">
            <div class="progress-jlpt-fill" style="width: ${percent}%"></div>
          </div>
          <div class="progress-jlpt-text">
            已掌握 ${s.mastered}/${s.total} · 学习中 ${s.learning} · 未学习 ${s.new}
          </div>
        </div>
      `;
    }).join("");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
