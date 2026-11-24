const DB_NAME = 'creator_studio_temp_db';
const STORE_NAME = 'media_store';
const MEDIA_KEY = 'current_media';
const DRAFT_KEY = 'draft_post_text';

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveMediaToIDB(mediaObj) {
  const db = await openIDB();
  const record = {
    uploadId: mediaObj.uploadId,
    name: mediaObj.name,
    type: mediaObj.type,
    size: mediaObj.size,
    mimeType: mediaObj.blob.type || (mediaObj.type === 'video' ? 'video/mp4' : 'image/jpeg'),
    buffer: await mediaObj.blob.arrayBuffer(),
    filesData: null
  };
  if (Array.isArray(mediaObj.files) && mediaObj.files.length > 0) {
    record.filesData = await Promise.all(
      mediaObj.files.map(async f => ({
        name: f.name,
        type: f.type,
        size: f.size,
        mimeType: f.blob.type || 'image/jpeg',
        buffer: await f.blob.arrayBuffer()
      }))
    );
  }
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record, MEDIA_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadMediaFromIDB() {
  const db = await openIDB();
  const record = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(MEDIA_KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
  if (!record || !record.buffer) return null;

  const mediaObj = {
    uploadId: record.uploadId || ('up_' + Date.now()),
    blob: new Blob([record.buffer], { type: record.mimeType }),
    name: record.name,
    type: record.type,
    size: record.size
  };
  if (Array.isArray(record.filesData)) {
    mediaObj.files = record.filesData.map(f => ({
      blob: new Blob([f.buffer], { type: f.mimeType }),
      name: f.name,
      type: f.type,
      size: f.size
    }));
  }
  return mediaObj;
}

async function clearMediaInIDB() {
  const db = await openIDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(MEDIA_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export const AppBus = {
  _mediaVer: 0,
  state: {
    media: null,
    gasUrl: localStorage.getItem('gas_url') || '',
    geminiKey: localStorage.getItem('gemini_key') || '',
    fbPageId: localStorage.getItem('fb_page_id') || '',
    fbPageToken: localStorage.getItem('fb_page_token') || '',
    ttClientKey: localStorage.getItem('tt_client_key') || '',
    ttClientSecret: localStorage.getItem('tt_client_secret') || '',
    ttDisplayName: localStorage.getItem('tt_display_name') || '',
    shopDefaultNotes: localStorage.getItem('shop_default_notes') || ''
  },
  listeners: {},

  on(event, fn) {
    (this.listeners[event] ||= []).push(fn);
  },

  emit(event, data) {
    (this.listeners[event] || []).forEach(fn => fn(data));
  },

  setMedia(mediaObj) {
    const ver = ++this._mediaVer;
    if (!mediaObj.uploadId) {
      mediaObj.uploadId = 'up_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    }
    this.state.media = mediaObj;
    this.emit('media:changed', mediaObj);
    saveMediaToIDB(mediaObj).catch(err => console.warn('Lưu tạm media lỗi:', err));
    return ver;
  },

  saveDraftText(draftObj) {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftObj));
      this.emit('draft:changed', draftObj);
    } catch (e) {}
  },

  getDraftText() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  async clearTempAll() {
    ++this._mediaVer;
    this.state.media = null;
    localStorage.removeItem(DRAFT_KEY);
    try { await clearMediaInIDB(); } catch (e) {}
    this.emit('media:cleared');
    this.emit('draft:cleared');
  },

  async restoreFromStorage() {
    const startVer = this._mediaVer;
    try {
      const restored = await loadMediaFromIDB();
      if (restored && !this.state.media && this._mediaVer === startVer) {
        this.state.media = restored;
        this.emit('media:changed', restored);
      }
    } catch (e) {}
  },

  setGasUrl(url) {
    this.state.gasUrl = url.trim();
    localStorage.setItem('gas_url', this.state.gasUrl);
  },

  setGeminiKey(key) {
    this.state.geminiKey = key.trim();
    localStorage.setItem('gemini_key', this.state.geminiKey);
  },

  setFacebookConfig(pageId, pageToken) {
    this.state.fbPageId = pageId.trim();
    this.state.fbPageToken = pageToken.trim();
    localStorage.setItem('fb_page_id', this.state.fbPageId);
    localStorage.setItem('fb_page_token', this.state.fbPageToken);
  },

  setTikTokConfig(key, secret) {
    this.state.ttClientKey = key.trim();
    this.state.ttClientSecret = secret.trim();
    localStorage.setItem('tt_client_key', this.state.ttClientKey);
    localStorage.setItem('tt_client_secret', this.state.ttClientSecret);
  },

  setShopDefaultNotes(txt) {
    this.state.shopDefaultNotes = txt;
    localStorage.setItem('shop_default_notes', txt);
  },

  openTab: () => {},
  openModal: () => {},
  closeModal: () => {}
};

window.AppBus = AppBus;
AppBus.restoreFromStorage();