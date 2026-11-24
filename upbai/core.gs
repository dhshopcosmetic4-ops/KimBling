const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash'
];
const TEMP_FOLDER_NAME = 'AutoPost_Temp';
const LOG_SHEET_NAME = 'Publish_Logs';
const REPLY_SHEET_NAME = 'FB_Replied_Logs';
const YT_REPLY_SHEET_NAME = 'YT_Replied_Logs';
const FB_GRAPH_VER = 'v27.0';

function authorizePermissions() {
  getOrCreateTempFolder();
  getOrCreateLogSheet();
  getOrCreateReplySheet(REPLY_SHEET_NAME);
  getOrCreateReplySheet(YT_REPLY_SHEET_NAME);
  const ch = YouTube.Channels.list('snippet', { mine: true });
  if (ch.items && ch.items.length > 0) {
    Logger.log('✅ YouTube: ' + ch.items[0].snippet.title);
    YouTube.CommentThreads.list('snippet', { allThreadsRelatedToChannelId: ch.items[0].id, maxResults: 1 });
  } else {
    Logger.log('⚠️ Gmail chưa tạo kênh YouTube');
  }
}

function doGet() {
  return jsonOut({ ok: true, msg: 'Google Apps Script Backend đang hoạt động!' });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (body.action === 'ping') {
      let fbCheck = '';
      let upgradedPageToken = null;
      if (body.fbPageId && body.fbPageToken) {
        const fbRes = checkAndMaybeUpgradeFbToken(body.fbPageId, body.fbPageToken);
        fbCheck = fbRes.msg;
        if (fbRes.pageToken) upgradedPageToken = fbRes.pageToken;
      }
      const props = PropertiesService.getScriptProperties().getProperties();
      const ttStatus = props.TT_ACCESS_TOKEN
        ? `🎵 Đã nối TikTok: <b>${props.TT_DISPLAY_NAME || 'OK'}</b>`
        : 'ℹ️ Chưa kết nối tài khoản TikTok.';
      return jsonOut({ ok: true, msg: 'Kết nối Google Apps Script thành công!', fbCheck, upgradedPageToken, ttStatus });
    }

    if (body.action === 'tiktok_exchange_code') {
      const info = exchangeTikTokCode(body.code, body.redirectUri, body.clientKey, body.clientSecret);
      return jsonOut({ ok: true, displayName: info.displayName });
    }

    if (body.action === 'generate_copy') {
      if (!body.geminiKey) throw new Error('Thiếu Gemini API Key từ trình duyệt!');
      const data = callGeminiForCopy(body.geminiKey, body.productName, body.notes || '');
      return jsonOut({ ok: true, data });
    }

    if (body.action === 'upload_part') {
      const folder = getOrCreateTempFolder();
      if (body.chunkIndex === 0) cleanStaleTempFiles(folder);
      const partName = `${body.uploadId}_part_${String(body.chunkIndex).padStart(3, '0')}.txt`;
      const old = folder.getFilesByName(partName);
      while (old.hasNext()) deleteFileCleanly(old.next());
      folder.createFile(partName, body.chunkBase64, MimeType.PLAIN_TEXT);
      return jsonOut({ ok: true, receivedChunk: body.chunkIndex });
    }

    if (body.action === 'finalize_publish') {
      return handleFinalizePublish(body);
    }

    if (body.action === 'get_logs') {
      return jsonOut({ ok: true, logs: readRecentLogs(8) });
    }

    if (body.action === 'save_bot_config') {
      const props = PropertiesService.getScriptProperties();
      props.setProperties({
        BOT_GEMINI_KEY: body.geminiKey || '',
        BOT_FB_PAGE_ID: body.fbPageId || '',
        BOT_FB_TOKEN: body.fbPageToken || '',
        BOT_SHOP_PROMPT: body.shopPrompt || ''
      });
      return jsonOut({ ok: true, msg: 'Đã lưu cấu hình Bot (dùng cho cả FB & YouTube)!' });
    }

    if (body.action === 'scan_fb_comments') {
      const comments = scanPendingComments(body.fbPageId, body.fbPageToken, body.geminiKey, body.shopPrompt, 5);
      return jsonOut({ ok: true, comments });
    }

    if (body.action === 'reply_fb_comment') {
      replyToFbComment(body.commentId, body.replyText, body.fbPageToken);
      logRepliedComment(REPLY_SHEET_NAME, body.commentId, body.commentText, body.replyText);
      return jsonOut({ ok: true });
    }

    if (body.action === 'scan_yt_comments') {
      const ytData = scanPendingYouTubeComments(body.geminiKey, body.shopPrompt, 5, Boolean(body.includeOwn));
      return jsonOut({ ok: true, comments: ytData.comments, debug: ytData.debug });
    }

    if (body.action === 'reply_yt_comment') {
      replyToYouTubeComment(body.commentId, body.replyText);
      logRepliedComment(YT_REPLY_SHEET_NAME, body.commentId, body.commentText, body.replyText);
      return jsonOut({ ok: true });
    }

    return jsonOut({ ok: false, error: 'Action không hợp lệ' });
  } catch (err) {
    return jsonOut({ ok: false, error: err.toString() });
  }
}

function autoReplyTrigger() {
  const p = PropertiesService.getScriptProperties().getProperties();
  if (!p.BOT_GEMINI_KEY) return;

  if (p.BOT_FB_PAGE_ID && p.BOT_FB_TOKEN) {
    try {
      const fbItems = scanPendingComments(p.BOT_FB_PAGE_ID, p.BOT_FB_TOKEN, p.BOT_GEMINI_KEY, p.BOT_SHOP_PROMPT || '', 5);
      for (let i = 0; i < fbItems.length; i++) {
        replyToFbComment(fbItems[i].commentId, fbItems[i].suggestedReply, p.BOT_FB_TOKEN);
        logRepliedComment(REPLY_SHEET_NAME, fbItems[i].commentId, fbItems[i].commentText, fbItems[i].suggestedReply);
      }
    } catch (e) { Logger.log('FB Trigger err: ' + e.message); }
  }

  try {
    const ytData = scanPendingYouTubeComments(p.BOT_GEMINI_KEY, p.BOT_SHOP_PROMPT || '', 5, false);
    const ytItems = ytData.comments || [];
    for (let i = 0; i < ytItems.length; i++) {
      replyToYouTubeComment(ytItems[i].commentId, ytItems[i].suggestedReply);
      logRepliedComment(YT_REPLY_SHEET_NAME, ytItems[i].commentId, ytItems[i].commentText, ytItems[i].suggestedReply);
    }
  } catch (e) { Logger.log('YT Trigger err: ' + e.message); }
}

function scanPendingYouTubeComments(geminiKey, shopPrompt, maxToGenerate, includeOwn) {
  if (!geminiKey) throw new Error('Thiếu Gemini API Key!');
  const chRes = YouTube.Channels.list('snippet,contentDetails', { mine: true });
  if (!chRes.items || !chRes.items.length) {
    throw new Error('Tài khoản Google này chưa có kênh YouTube!');
  }
  const myChannelId = chRes.items[0].id;
  const channelTitle = chRes.items[0].snippet ? chRes.items[0].snippet.title : myChannelId;

  let threads = [];
  try {
    const threadsRes = YouTube.CommentThreads.list('snippet,replies', {
      allThreadsRelatedToChannelId: myChannelId,
      maxResults: 20,
      order: 'time',
      textFormat: 'plainText'
    });
    threads = threadsRes.items || [];
  } catch (e) {}

  // Dự phòng: nếu luồng chung kênh chưa kịp index video mới đăng, quét thẳng 3 video mới nhất
  if (!threads.length) {
    const upPlaylist = chRes.items[0].contentDetails?.relatedPlaylists?.uploads;
    if (upPlaylist) {
      const pItems = YouTube.PlaylistItems.list('contentDetails', { playlistId: upPlaylist, maxResults: 3 }).items || [];
      pItems.forEach(pi => {
        try {
          const vt = YouTube.CommentThreads.list('snippet,replies', {
            videoId: pi.contentDetails.videoId,
            maxResults: 10,
            textFormat: 'plainText'
          }).items || [];
          threads = threads.concat(vt);
        } catch (e) {}
      });
    }
  }

  const videoIds = [];
  threads.forEach(t => {
    const vid = t.snippet && t.snippet.videoId;
    if (vid && videoIds.indexOf(vid) === -1) videoIds.push(vid);
  });
  const titleMap = {};
  if (videoIds.length > 0) {
    try {
      const vRes = YouTube.Videos.list('snippet', { id: videoIds.slice(0, 20).join(',') });
      (vRes.items || []).forEach(v => { titleMap[v.id] = v.snippet.title; });
    } catch (e) {}
  }

  const repliedSet = getRepliedIdSet(YT_REPLY_SHEET_NAME);
  const pending = [];
  let skippedOwn = 0;
  let skippedReplied = 0;

  for (let i = 0; i < threads.length; i++) {
    const t = threads[i];
    const top = t.snippet.topLevelComment;
    if (!top || !top.snippet) continue;

    const commentId = top.id;
    const snip = top.snippet;
    const authorChId = snip.authorChannelId ? snip.authorChannelId.value : '';

    if (!includeOwn && authorChId === myChannelId) {
      skippedOwn++;
      continue;
    }
    if (repliedSet.has(commentId)) {
      skippedReplied++;
      continue;
    }

    const replies = (t.replies && t.replies.comments) ? t.replies.comments : [];
    const alreadyReplied = !includeOwn && replies.some(r => r.snippet && r.snippet.authorChannelId && r.snippet.authorChannelId.value === myChannelId);
    if (alreadyReplied) {
      skippedReplied++;
      continue;
    }

    const videoTitle = titleMap[t.snippet.videoId] || 'Video YouTube';
    const commentText = snip.textDisplay || snip.textOriginal || '';
    if (!commentText.trim()) continue;

    const suggestedReply = callGeminiForReply(geminiKey, shopPrompt, 'Video YouTube: ' + videoTitle, commentText);
    pending.push({
      commentId,
      authorName: snip.authorDisplayName || 'Người xem YouTube',
      commentText,
      postSnippet: videoTitle.slice(0, 60),
      suggestedReply
    });

    if (pending.length >= maxToGenerate) break;
  }

  return {
    comments: pending,
    debug: { channelTitle, totalThreads: threads.length, skippedOwn, skippedReplied }
  };
}

function replyToYouTubeComment(parentId, replyText) {
  return YouTube.Comments.insert({
    snippet: {
      parentId: parentId,
      textOriginal: replyText
    }
  }, 'snippet');
}

function exchangeTikTokCode(code, redirectUri, clientKey, clientSecret) {
  const formBody =
    'client_key=' + encodeURIComponent(clientKey) +
    '&client_secret=' + encodeURIComponent(clientSecret) +
    '&code=' + encodeURIComponent(code) +
    '&grant_type=authorization_code' +
    '&redirect_uri=' + encodeURIComponent(redirectUri);

  const res = UrlFetchApp.fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: formBody,
    muteHttpExceptions: true
  });
  const json = JSON.parse(res.getContentText());
  if (json.error || !json.access_token) {
    throw new Error(json.error_description || json.error || 'Không lấy được Access Token TikTok');
  }

  let displayName = 'Tài khoản TikTok';
  try {
    const uRes = UrlFetchApp.fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name', {
      headers: { Authorization: 'Bearer ' + json.access_token },
      muteHttpExceptions: true
    });
    const uJson = JSON.parse(uRes.getContentText());
    if (uJson.data && uJson.data.user && uJson.data.user.display_name) {
      displayName = uJson.data.user.display_name;
    }
  } catch (e) {}

  const expiresAt = Date.now() + ((Number(json.expires_in) || 86400) * 1000);
  PropertiesService.getScriptProperties().setProperties({
    TT_CLIENT_KEY: clientKey,
    TT_CLIENT_SECRET: clientSecret,
    TT_ACCESS_TOKEN: json.access_token,
    TT_REFRESH_TOKEN: json.refresh_token || '',
    TT_EXPIRES_AT: String(expiresAt),
    TT_DISPLAY_NAME: displayName
  });

  return { displayName };
}

function getValidTikTokToken() {
  const props = PropertiesService.getScriptProperties();
  const p = props.getProperties();
  if (!p.TT_ACCESS_TOKEN) throw new Error('Chưa kết nối TikTok trong Tab Cài đặt ⚙️!');

  if (Date.now() > Number(p.TT_EXPIRES_AT || 0) - 5 * 60 * 1000) {
    if (!p.TT_REFRESH_TOKEN || !p.TT_CLIENT_KEY || !p.TT_CLIENT_SECRET) {
      throw new Error('Token TikTok đã hết hạn, hãy kết nối lại ở Tab Cài đặt ⚙️!');
    }
    const formBody =
      'client_key=' + encodeURIComponent(p.TT_CLIENT_KEY) +
      '&client_secret=' + encodeURIComponent(p.TT_CLIENT_SECRET) +
      '&grant_type=refresh_token' +
      '&refresh_token=' + encodeURIComponent(p.TT_REFRESH_TOKEN);

    const res = UrlFetchApp.fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'post',
      contentType: 'application/x-www-form-urlencoded',
      payload: formBody,
      muteHttpExceptions: true
    });
    const json = JSON.parse(res.getContentText());
    if (json.error || !json.access_token) {
      throw new Error('Không tự gia hạn được Token TikTok: ' + (json.error_description || json.error));
    }
    const expiresAt = Date.now() + ((Number(json.expires_in) || 86400) * 1000);
    props.setProperties({
      TT_ACCESS_TOKEN: json.access_token,
      TT_REFRESH_TOKEN: json.refresh_token || p.TT_REFRESH_TOKEN,
      TT_EXPIRES_AT: String(expiresAt)
    });
    return json.access_token;
  }

  return p.TT_ACCESS_TOKEN;
}

function uploadToTikTok(videoBlob, ttPost, ttMode) {
  const token = getValidTikTokToken();
  const videoBytes = videoBlob.getBytes();
  const videoSize = videoBytes.length;
  if (videoSize > 64 * 1024 * 1024) {
    throw new Error('Video vượt quá 64MB cho một chunk TikTok.');
  }

  let initUrl = 'https://open.tiktokapis.com/v2/post/publish/inbox/video/init/';
  let initBody = {
    source_info: {
      source: 'FILE_UPLOAD',
      video_size: videoSize,
      chunk_size: videoSize,
      total_chunk_count: 1
    }
  };

  if (ttMode === 'direct_private' || ttMode === 'direct_public') {
    const privacy = (ttMode === 'direct_public') ? 'PUBLIC_TO_EVERYONE' : 'SELF_ONLY';
    const ciRes = UrlFetchApp.fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
      method: 'post',
      contentType: 'application/json; charset=UTF-8',
      headers: { Authorization: 'Bearer ' + token },
      payload: '{}',
      muteHttpExceptions: true
    });
    const ciJson = JSON.parse(ciRes.getContentText());
    if (ciJson.error && ciJson.error.code && ciJson.error.code !== 'ok') {
      throw new Error('Creator Info: ' + (ciJson.error.message || ciJson.error.code));
    }

    initUrl = 'https://open.tiktokapis.com/v2/post/publish/video/init/';
    initBody = {
      post_info: {
        title: (ttPost.caption || '').slice(0, 2200),
        privacy_level: privacy,
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: videoSize,
        chunk_size: videoSize,
        total_chunk_count: 1
      }
    };
  }

  const initRes = UrlFetchApp.fetch(initUrl, {
    method: 'post',
    contentType: 'application/json; charset=UTF-8',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify(initBody),
    muteHttpExceptions: true
  });
  const initJson = JSON.parse(initRes.getContentText());
  if (initJson.error && initJson.error.code && initJson.error.code !== 'ok') {
    const msg = initJson.error.message || initJson.error.code;
    if (String(initJson.error.code).includes('unaudited')) {
      throw new Error('App chưa Audit nên chỉ dùng được "Hộp nháp" hoặc "Riêng tư (Sandbox)"!');
    }
    throw new Error(msg);
  }

  const uploadUrl = initJson.data.upload_url;
  const publishId = initJson.data.publish_id;

  const putRes = UrlFetchApp.fetch(uploadUrl, {
    method: 'put',
    contentType: 'video/mp4',
    headers: { 'Content-Range': `bytes 0-${videoSize - 1}/${videoSize}` },
    payload: videoBytes,
    muteHttpExceptions: true
  });
  const putCode = putRes.getResponseCode();
  if (putCode < 200 || putCode >= 300) {
    throw new Error(`Upload TikTok lỗi HTTP ${putCode}`);
  }

  Utilities.sleep(2000);
  const stRes = UrlFetchApp.fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
    method: 'post',
    contentType: 'application/json; charset=UTF-8',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({ publish_id: publishId }),
    muteHttpExceptions: true
  });
  const stJson = JSON.parse(stRes.getContentText());
  const st = stJson.data ? stJson.data.status : '';

  if (st === 'FAILED') throw new Error(stJson.data.fail_reason || 'TikTok xử lý video thất bại');
  if (st === 'SEND_TO_USER_INBOX') return '✅ Đã đẩy vào Hộp nháp TikTok (Mở app TikTok đăng nhé!)';
  if (st === 'PUBLISH_COMPLETE') return '✅ Đã đăng lên TikTok!';
  return '✅ Đã gửi sang TikTok (đang xử lý)';
}

function checkAndMaybeUpgradeFbToken(pageId, token) {
  try {
    const meRes = UrlFetchApp.fetch(`https://graph.facebook.com/${FB_GRAPH_VER}/me?fields=id,name`, {
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true
    });
    const meJson = JSON.parse(meRes.getContentText());
    if (meJson.error) return { ok: false, msg: '⚠️ Lỗi Token FB (hết hạn hoặc sai): ' + meJson.error.message };

    if (String(meJson.id) !== String(pageId)) {
      const pgRes = UrlFetchApp.fetch(`https://graph.facebook.com/${FB_GRAPH_VER}/${pageId}?fields=access_token,name`, {
        headers: { Authorization: 'Bearer ' + token },
        muteHttpExceptions: true
      });
      const pgJson = JSON.parse(pgRes.getContentText());
      if (pgJson.error || !pgJson.access_token) {
        return { ok: false, msg: '⚠️ Không lấy được Token Trang: ' + (pgJson.error?.message || 'Thiếu quyền') };
      }
      return {
        ok: true,
        pageToken: pgJson.access_token,
        msg: `📘 Đã tự động đổi sang Page Token của: <b>${pgJson.name || pageId}</b>!`
      };
    }

    return { ok: true, pageToken: null, msg: `📘 Đã nối Fanpage: <b>${meJson.name}</b>` };
  } catch (e) {
    return { ok: false, msg: '⚠️ Không kiểm tra được FB: ' + e.message };
  }
}

function scanPendingComments(pageId, pageToken, geminiKey, shopPrompt, maxToGenerate) {
  if (!pageId || !pageToken || !geminiKey) throw new Error('Thiếu thông tin cấu hình!');
  const fields = encodeURIComponent('id,message,comments.limit(15){id,from,message,created_time,comments.limit(5){from}}');
  const url = `https://graph.facebook.com/${FB_GRAPH_VER}/${pageId}/feed?fields=${fields}&limit=5`;

  const res = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + pageToken },
    muteHttpExceptions: true
  });
  const json = JSON.parse(res.getContentText());
  if (json.error) throw new Error(json.error.message);

  const repliedSet = getRepliedIdSet(REPLY_SHEET_NAME);
  const pending = [];
  const posts = json.data || [];

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const cmts = (post.comments && post.comments.data) ? post.comments.data : [];
    for (let j = 0; j < cmts.length; j++) {
      const c = cmts[j];
      if (!c.message) continue;
      if (c.from && c.from.id === pageId) continue;
      if (repliedSet.has(c.id)) continue;

      const subReplies = (c.comments && c.comments.data) ? c.comments.data : [];
      if (subReplies.some(r => r.from && r.from.id === pageId)) continue;

      const suggestedReply = callGeminiForReply(geminiKey, shopPrompt, post.message || '', c.message);
      pending.push({
        commentId: c.id,
        authorName: (c.from && c.from.name) ? c.from.name : 'Khách hàng',
        commentText: c.message,
        postSnippet: (post.message || '').replace(/\s+/g, ' ').slice(0, 60),
        suggestedReply
      });

      if (pending.length >= maxToGenerate) return pending;
    }
  }
  return pending;
}

function replyToFbComment(commentId, replyText, pageToken) {
  const res = UrlFetchApp.fetch(`https://graph.facebook.com/${FB_GRAPH_VER}/${commentId}/comments`, {
    method: 'post',
    payload: { message: replyText, access_token: pageToken },
    muteHttpExceptions: true
  });
  const json = JSON.parse(res.getContentText());
  if (json.error) throw new Error(json.error.message);
  return json.id;
}

function callGeminiForReply(apiKey, shopPrompt, postText, customerComment) {
  const prompt = `Bạn là nhân viên chăm sóc khách hàng thân thiện của quán/shop.
Thông tin quán & quy tắc trả lời:
"${shopPrompt || 'Trả lời nhiệt tình, lịch sự, ngắn gọn.'}"

Nội dung bài đăng/video khách vừa bình luận:
"${postText.slice(0, 300)}"

Bình luận của khách:
"${customerComment}"

Hãy viết ĐÚNG 1 câu trả lời ngắn gọn (1-2 câu tiếng Việt, tự nhiên, lịch sự, có emoji nhẹ nhàng, không dùng ngoặc kép).`;

  return callGeminiRaw(apiKey, prompt, false);
}

function handleFinalizePublish(body) {
  const { uploadId, totalChunks, isMultiImage, inlineBase64, fileName, mimeType, imageMimes } = body;
  const folder = getOrCreateTempFolder();

  let singleBlob = null;
  let imageBlobs = [];

  if (isMultiImage) {
    for (let i = 0; i < totalChunks; i++) {
      const pName = `${uploadId}_part_${String(i).padStart(3, '0')}.txt`;
      const it = folder.getFilesByName(pName);
      if (!it.hasNext()) throw new Error(`Thiếu ảnh thứ ${i + 1}. Hãy thử bấm lại!`);
      const pf = it.next();
      const bytes = Utilities.base64Decode(pf.getBlob().getDataAsString());
      const m = (imageMimes && imageMimes[i]) ? imageMimes[i] : 'image/jpeg';
      imageBlobs.push(Utilities.newBlob(bytes, m, `img_${i + 1}.jpg`));
      deleteFileCleanly(pf);
    }
  } else if (inlineBase64) {
    singleBlob = Utilities.newBlob(Utilities.base64Decode(inlineBase64), mimeType, fileName);
  } else {
    let fullBase64 = '';
    for (let i = 0; i < totalChunks; i++) {
      const pName = `${uploadId}_part_${String(i).padStart(3, '0')}.txt`;
      const it = folder.getFilesByName(pName);
      if (!it.hasNext()) throw new Error(`Thiếu mảnh số ${i + 1}. Hãy thử bấm lại!`);
      const pf = it.next();
      fullBase64 += pf.getBlob().getDataAsString();
      deleteFileCleanly(pf);
    }
    singleBlob = Utilities.newBlob(Utilities.base64Decode(fullBase64), mimeType, fileName);
  }

  const existing = findLogByUploadId(uploadId);
  const targets = body.targets || {};
  const isVideo = !isMultiImage && (singleBlob.getContentType() || '').toLowerCase().startsWith('video/');

  let ytResult = null;
  let fbResult = null;
  let ttResult = null;

  if (targets.youtube) {
    if (existing && String(existing.ytStatus).includes('✅')) {
      ytResult = { ok: true, statusText: '✅ Đã đăng trước đó (chống trùng)', url: existing.ytLink };
    } else if (!isVideo) {
      ytResult = { skipped: true, statusText: 'ℹ️ Bỏ qua (YouTube Shorts chỉ nhận Video)', url: '' };
    } else {
      try {
        const up = uploadToYouTube(singleBlob, body.posts.youtube, body.ytPrivacy || 'private');
        ytResult = { ok: true, statusText: `✅ Thành công (${up.privacyStatus})`, url: up.url };
      } catch (e) {
        ytResult = { ok: false, statusText: '❌ Lỗi: ' + e.message, url: '' };
      }
    }
  }

  if (targets.facebook) {
    if (existing && String(existing.fbStatus).includes('✅')) {
      fbResult = { ok: true, statusText: '✅ Đã đăng trước đó (chống trùng)', url: existing.fbLink };
    } else {
      try {
        let fbUp;
        if (isMultiImage) {
          fbUp = uploadToFacebookPhotos(imageBlobs, body.posts.facebook, body.fbPageId, body.fbPageToken);
        } else if (isVideo) {
          fbUp = uploadToFacebookVideo(singleBlob, body.posts.facebook, body.fbPageId, body.fbPageToken);
        } else {
          fbUp = uploadToFacebookPhotos([singleBlob], body.posts.facebook, body.fbPageId, body.fbPageToken);
        }
        fbResult = { ok: true, statusText: '✅ Đã đăng lên Fanpage', url: fbUp.url };
      } catch (e) {
        fbResult = { ok: false, statusText: '❌ Lỗi: ' + e.message, url: '' };
      }
    }
  }

  if (targets.tiktok) {
    if (existing && String(existing.ttStatus).includes('✅')) {
      ttResult = { ok: true, statusText: '✅ Đã gửi trước đó (chống trùng)' };
    } else if (!isVideo) {
      ttResult = { skipped: true, statusText: 'ℹ️ Bỏ qua (TikTok chỉ nhận đẩy Video trực tiếp)' };
    } else {
      try {
        const ttMsg = uploadToTikTok(singleBlob, body.posts.tiktok, body.ttMode || 'draft');
        ttResult = { ok: true, statusText: ttMsg };
      } catch (e) {
        ttResult = { ok: false, statusText: '❌ Lỗi: ' + e.message };
      }
    }
  }

  upsertLogRow({
    uploadId,
    product: body.productName || fileName,
    fileName,
    ytStatus: ytResult ? ytResult.statusText : (existing ? existing.ytStatus : '—'),
    ytLink: ytResult && ytResult.url ? ytResult.url : (existing ? existing.ytLink : ''),
    fbStatus: fbResult ? fbResult.statusText : (existing ? existing.fbStatus : '—'),
    fbLink: fbResult && fbResult.url ? fbResult.url : (existing ? existing.fbLink : ''),
    ttStatus: ttResult ? ttResult.statusText : (existing ? existing.ttStatus : '—')
  });

  return jsonOut({ ok: true, youtube: ytResult, facebook: fbResult, tiktok: ttResult });
}

function uploadToYouTube(videoBlob, ytPost, privacyStatus) {
  const cleanTitle = (ytPost.title || 'Video mới #shorts').replace(/[<>]/g, '').trim().slice(0, 100);
  const cleanDesc = (ytPost.description || '').slice(0, 4900);
  const tags = (ytPost.tags || []).map(t => String(t).replace(/^#/, '').trim()).filter(Boolean).slice(0, 15);

  const resource = {
    snippet: { title: cleanTitle, description: cleanDesc, tags, categoryId: '22' },
    status: { privacyStatus: privacyStatus || 'private', selfDeclaredMadeForKids: false },
    paidProductPlacementDetails: { hasPaidProductPlacement: false }
  };

  let uploaded;
  try {
    uploaded = YouTube.Videos.insert(resource, 'snippet,status,paidProductPlacementDetails', videoBlob);
  } catch (e) {
    if (String(e).toLowerCase().includes('paidproductplacement')) {
      delete resource.paidProductPlacementDetails;
      uploaded = YouTube.Videos.insert(resource, 'snippet,status', videoBlob);
    } else {
      throw e;
    }
  }
  return {
    id: uploaded.id,
    url: `https://youtube.com/shorts/${uploaded.id}`,
    privacyStatus: uploaded.status ? uploaded.status.privacyStatus : privacyStatus
  };
}

function uploadToFacebookVideo(videoBlob, fbPost, pageId, pageToken) {
  if (!pageId || !pageToken) throw new Error('Thiếu Page ID hoặc Page Token');
  const res = UrlFetchApp.fetch(`https://graph-video.facebook.com/${FB_GRAPH_VER}/${pageId}/videos`, {
    method: 'post',
    payload: { source: videoBlob, description: fbPost.message || '', access_token: pageToken },
    muteHttpExceptions: true
  });
  const json = JSON.parse(res.getContentText());
  if (json.error) throw new Error(json.error.message);
  return { id: json.id, url: `https://www.facebook.com/${pageId}/videos/${json.id}` };
}

function uploadToFacebookPhotos(imageBlobs, fbPost, pageId, pageToken) {
  if (!pageId || !pageToken) throw new Error('Thiếu Page ID hoặc Page Token');

  if (imageBlobs.length === 1) {
    const res = UrlFetchApp.fetch(`https://graph.facebook.com/${FB_GRAPH_VER}/${pageId}/photos`, {
      method: 'post',
      payload: { source: imageBlobs[0], caption: fbPost.message || '', published: 'true', access_token: pageToken },
      muteHttpExceptions: true
    });
    const json = JSON.parse(res.getContentText());
    if (json.error) throw new Error(json.error.message);
    return { id: json.post_id || json.id, url: `https://www.facebook.com/${json.post_id || json.id}` };
  }

  const mediaFbIds = [];
  for (let i = 0; i < imageBlobs.length; i++) {
    const res = UrlFetchApp.fetch(`https://graph.facebook.com/${FB_GRAPH_VER}/${pageId}/photos`, {
      method: 'post',
      payload: { source: imageBlobs[i], published: 'false', access_token: pageToken },
      muteHttpExceptions: true
    });
    const json = JSON.parse(res.getContentText());
    if (json.error) throw new Error(`Ảnh ${i + 1}: ` + json.error.message);
    mediaFbIds.push({ media_fbid: json.id });
  }

  const feedRes = UrlFetchApp.fetch(`https://graph.facebook.com/${FB_GRAPH_VER}/${pageId}/feed`, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ message: fbPost.message || '', attached_media: mediaFbIds, access_token: pageToken }),
    muteHttpExceptions: true
  });
  const feedJson = JSON.parse(feedRes.getContentText());
  if (feedJson.error) throw new Error(feedJson.error.message);
  return { id: feedJson.id, url: `https://www.facebook.com/${feedJson.id}` };
}

function getOrCreateLogSheet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return null;
    let sheet = ss.getSheetByName(LOG_SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(LOG_SHEET_NAME);
      sheet.appendRow(['Thời gian', 'Upload_ID', 'Sản phẩm', 'File', 'YouTube', 'Link YT', 'Facebook', 'Link FB', 'TikTok']);
    }
    return sheet;
  } catch (e) { return null; }
}

function getOrCreateReplySheet(sheetName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return null;
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(['Thời gian', 'Comment_ID', 'Khách hỏi', 'Bot trả lời']);
    }
    return sheet;
  } catch (e) { return null; }
}

function getRepliedIdSet(sheetName) {
  const set = new Set();
  const sheet = getOrCreateReplySheet(sheetName);
  if (!sheet) return set;
  const vals = sheet.getDataRange().getValues();
  for (let r = 1; r < vals.length; r++) {
    if (vals[r][1]) set.add(String(vals[r][1]));
  }
  return set;
}

function logRepliedComment(sheetName, commentId, customerText, replyText) {
  const sheet = getOrCreateReplySheet(sheetName);
  if (!sheet) return;
  const nowStr = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM HH:mm:ss');
  sheet.appendRow([nowStr, commentId, customerText, replyText]);
}

function findLogByUploadId(uploadId) {
  const sheet = getOrCreateLogSheet();
  if (!sheet) return null;
  const vals = sheet.getDataRange().getValues();
  for (let r = vals.length - 1; r >= 1; r--) {
    if (vals[r][1] === uploadId) {
      return {
        rowNum: r + 1,
        ytStatus: vals[r][4], ytLink: vals[r][5],
        fbStatus: vals[r][6], fbLink: vals[r][7],
        ttStatus: vals[r][8] || '—'
      };
    }
  }
  return null;
}

function upsertLogRow(entry) {
  const sheet = getOrCreateLogSheet();
  if (!sheet) return;
  const nowStr = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM HH:mm:ss');
  const existing = findLogByUploadId(entry.uploadId);
  const rowVals = [nowStr, entry.uploadId, entry.product, entry.fileName, entry.ytStatus, entry.ytLink, entry.fbStatus, entry.fbLink, entry.ttStatus];
  if (existing) {
    sheet.getRange(existing.rowNum, 1, 1, 9).setValues([rowVals]);
  } else {
    sheet.appendRow(rowVals);
  }
}

function readRecentLogs(limit) {
  const sheet = getOrCreateLogSheet();
  if (!sheet) return [];
  const vals = sheet.getDataRange().getValues();
  const out = [];
  for (let r = vals.length - 1; r >= 1 && out.length < limit; r--) {
    out.push({
      time: vals[r][0], uploadId: vals[r][1], product: vals[r][2], fileName: vals[r][3],
      ytStatus: vals[r][4], ytLink: vals[r][5], fbStatus: vals[r][6], fbLink: vals[r][7],
      ttStatus: vals[r][8] || '—'
    });
  }
  return out;
}

function getOrCreateTempFolder() {
  const folders = DriveApp.getFoldersByName(TEMP_FOLDER_NAME);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(TEMP_FOLDER_NAME);
}

function cleanStaleTempFiles(folder) {
  try {
    const cutoff = Date.now() - 60 * 60 * 1000;
    const files = folder.getFiles();
    while (files.hasNext()) {
      const f = files.next();
      if (f.getLastUpdated().getTime() < cutoff) deleteFileCleanly(f);
    }
  } catch (e) {}
}

function deleteFileCleanly(file) {
  try {
    if (typeof Drive !== 'undefined' && Drive.Files) {
      if (typeof Drive.Files.delete === 'function') { Drive.Files.delete(file.getId()); return; }
      if (typeof Drive.Files.remove === 'function') { Drive.Files.remove(file.getId()); return; }
    }
  } catch (e) {}
  file.setTrashed(true);
}

function callGeminiForCopy(apiKey, productName, notes) {
  const prompt = `Bạn là chuyên gia viết content bán hàng đa kênh bằng tiếng Việt.
Sản phẩm: "${productName}"
Ghi chú thêm: "${notes}"

Hãy tạo nội dung thu hút, tự nhiên, không sáo rỗng cho 3 nền tảng dưới đây. MỖI NỀN TẢNG ĐÚNG 5 HASHTAG liên quan nhất (bắt đầu bằng dấu #).
Trả về ĐÚNG định dạng JSON sau:
{
  "tiktok": {
    "caption": "Câu hook giật tít + mô tả cực ngắn gọn dưới 120 ký tự",
    "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
  },
  "facebook": {
    "title": "Dòng tiêu đề mở bài gây tò mò có emoji",
    "body": "Nội dung 3-4 dòng nêu lợi ích + lời kêu gọi bình luận/nhắn tin",
    "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
  },
  "youtube": {
    "title": "Tiêu đề chuẩn SEO hấp dẫn dưới 90 ký tự kèm #shorts",
    "description": "Mô tả chi tiết sản phẩm + từ khóa tìm kiếm",
    "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
  }
}`;
  return callGeminiRaw(apiKey, prompt, true);
}

function callGeminiRaw(apiKey, prompt, expectJson) {
  const payload = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
  if (expectJson) payload.generationConfig = { responseMimeType: 'application/json' };

  let lastError = '';
  for (let i = 0; i < GEMINI_MODELS.length; i++) {
    const model = GEMINI_MODELS[i];
    const res = UrlFetchApp.fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'post', contentType: 'application/json',
      headers: { 'x-goog-api-key': apiKey },
      payload: JSON.stringify(payload), muteHttpExceptions: true
    });
    const code = res.getResponseCode();
    let json;
    try { json = JSON.parse(res.getContentText()); } catch (e) { lastError = res.getContentText(); continue; }
    if (code === 200 && json.candidates?.[0]?.content?.parts?.[0]?.text) {
      const txt = json.candidates[0].content.parts[0].text.trim();
      if (!expectJson) return txt;
      const parsed = JSON.parse(txt);
      parsed._usedModel = model;
      return parsed;
    }
    lastError = json.error?.message || `HTTP ${code}`;
    if ((code === 400 || code === 401 || code === 403) &&
        (lastError.toLowerCase().includes('api key') || lastError.toLowerCase().includes('permission'))) {
      throw new Error(lastError);
    }
  }
  throw new Error(`Các máy chủ Gemini đều đang bận: ${lastError}`);
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}