export const AppBus = {
  state: {
    media: null,
    gasUrl: localStorage.getItem('gas_url') || '',
    geminiKey: localStorage.getItem('gemini_key') || ''
  },
  listeners: {},

  on(event, fn) {
    (this.listeners[event] ||= []).push(fn);
  },

  emit(event, data) {
    (this.listeners[event] || []).forEach(fn => fn(data));
  },

  setMedia(mediaObj) {
    this.state.media = mediaObj;
    this.emit('media:changed', mediaObj);
  },

  setGasUrl(url) {
    this.state.gasUrl = url.trim();
    localStorage.setItem('gas_url', this.state.gasUrl);
  },

  setGeminiKey(key) {
    this.state.geminiKey = key.trim();
    localStorage.setItem('gemini_key', this.state.geminiKey);
  },

  openTab: () => {},
  openModal: () => {},
  closeModal: () => {}
};

window.AppBus = AppBus;
