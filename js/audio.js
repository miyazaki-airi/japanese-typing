const AudioPlayer = {
  rate: 1,

  speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(this._createUtterance(text));
  },

  speakSentenceThenWord(sentenceText, wordText) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const sentence = this._createUtterance(sentenceText);
    const word = this._createUtterance(wordText);
    sentence.onend = () => {
      window.speechSynthesis.speak(word);
    };
    window.speechSynthesis.speak(sentence);
  },

  _createUtterance(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = this.rate;
    utterance.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find(v => v.lang.startsWith("ja"));
    if (jaVoice) utterance.voice = jaVoice;
    return utterance;
  },

  setRate(rate) {
    this.rate = rate;
  },

  stop() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
};

// preload voices
if (window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
