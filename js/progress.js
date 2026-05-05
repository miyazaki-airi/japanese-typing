const Progress = {
  STORAGE_KEY: "japanese-typing-progress",

  _load() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  _save(data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  },

  record(wordId, correct) {
    const data = this._load();
    if (!data[wordId]) {
      data[wordId] = { correct: 0, wrong: 0, streak: 0, lastPractice: null };
    }
    if (correct) {
      data[wordId].correct++;
      data[wordId].streak++;
    } else {
      data[wordId].wrong++;
      data[wordId].streak = 0;
    }
    data[wordId].lastPractice = Date.now();
    this._save(data);
  },

  getStatus(wordId) {
    const data = this._load();
    const entry = data[wordId];
    if (!entry) return "new";
    if (entry.streak >= 3) return "mastered";
    if (entry.correct > 0 || entry.wrong > 0) return "learning";
    return "new";
  },

  getStats() {
    const data = this._load();
    const wordIds = Object.keys(data);
    let mastered = 0, learning = 0;
    let totalCorrect = 0, totalWrong = 0;

    wordIds.forEach(id => {
      const entry = data[id];
      totalCorrect += entry.correct;
      totalWrong += entry.wrong;
      const status = this.getStatus(parseInt(id));
      if (status === "mastered") mastered++;
      else if (status === "learning") learning++;
    });

    const total = totalCorrect + totalWrong;
    return {
      totalPracticed: wordIds.length,
      mastered,
      learning,
      accuracy: total > 0 ? Math.round((totalCorrect / total) * 100) : 0
    };
  },

  getJlptStats(jlpt) {
    const words = getWordsByJlpt(jlpt);
    const data = this._load();
    let mastered = 0, learning = 0, newCount = 0;

    words.forEach(w => {
      const status = this.getStatus(w.id);
      if (status === "mastered") mastered++;
      else if (status === "learning") learning++;
      else newCount++;
    });

    return { total: words.length, mastered, learning, new: newCount };
  },

  reset() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
};
