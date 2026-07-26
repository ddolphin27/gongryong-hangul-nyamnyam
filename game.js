/* 공룡 한글 냠냠 - 외부 라이브러리 없는 HTML5 Canvas 게임 */
(() => {
  'use strict';

  // 한글 유니코드 조합 순서표. 겹모음/겹받침은 기본 자모로 다시 나눈다.
  const INITIALS = [...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'];
  const MEDIALS = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
  const FINALS = ['', 'ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  const SPLIT = {
    'ㄲ':['ㄱ','ㄱ'], 'ㄸ':['ㄷ','ㄷ'], 'ㅃ':['ㅂ','ㅂ'], 'ㅆ':['ㅅ','ㅅ'], 'ㅉ':['ㅈ','ㅈ'],
    'ㅘ':['ㅗ','ㅏ'], 'ㅙ':['ㅗ','ㅐ'], 'ㅚ':['ㅗ','ㅣ'], 'ㅝ':['ㅜ','ㅓ'], 'ㅞ':['ㅜ','ㅔ'], 'ㅟ':['ㅜ','ㅣ'], 'ㅢ':['ㅡ','ㅣ'],
    'ㄳ':['ㄱ','ㅅ'], 'ㄵ':['ㄴ','ㅈ'], 'ㄶ':['ㄴ','ㅎ'], 'ㄺ':['ㄹ','ㄱ'], 'ㄻ':['ㄹ','ㅁ'], 'ㄼ':['ㄹ','ㅂ'],
    'ㄽ':['ㄹ','ㅅ'], 'ㄾ':['ㄹ','ㅌ'], 'ㄿ':['ㄹ','ㅍ'], 'ㅀ':['ㄹ','ㅎ'], 'ㅄ':['ㅂ','ㅅ']
  };
  const DOUBLE_INITIALS = new Set(['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ']);
  const ALL_JAMO = [...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣㅐㅔ'];
  // 화면 표시와 분리된 TTS 전용 문자열. 브라우저 발음 보정은 이 표만 수정하면 된다.
  const ttsMap = {
    'ㄱ':'기역', 'ㄲ':'쌍기역', 'ㄴ':'니은', 'ㄷ':'디귿', 'ㄸ':'쌍디귿', 'ㄹ':'리을',
    'ㅁ':'미음', 'ㅂ':'비읍', 'ㅃ':'쌍비읍', 'ㅅ':'시옷', 'ㅆ':'쌍시옷',
    'ㅇ':'이응', 'ㅈ':'지읒', 'ㅉ':'쌍지읒', 'ㅊ':'치읓', 'ㅋ':'키윽', 'ㅌ':'티읕', 'ㅍ':'피읖', 'ㅎ':'히읏',
    'ㅏ':'아', 'ㅑ':'야', 'ㅓ':'어', 'ㅕ':'여', 'ㅗ':'오', 'ㅛ':'요', 'ㅜ':'우', 'ㅠ':'유',
    'ㅡ':'으', 'ㅣ':'이', 'ㅐ':'애', 'ㅔ':'에'
  };
  const BASE_FALL_SPEED = 208;
  const FALL_SPEED_MULTIPLIER = { easy: .6, normal: 1.2, hard: 1.95 };
  const BASE_SPAWN_INTERVAL = { easy: .72, normal: .58, hard: .44 };
  const SPAWN_INTERVAL_MULTIPLIER = { easy: 1.5, normal: 1, hard: .8 };
  const MAX_ACTIVE_NORMAL_BLOCKS = 6;
  const MAX_ACTIVE_SPECIAL_BLOCKS = 1;
  const SETTINGS = {
    // 생성 간격을 줄여 화면에 보이는 블록 수를 약 1.7배 늘린다.
    easy:   { fall: BASE_FALL_SPEED * FALL_SPEED_MULTIPLIER.easy, secondsPerLetter: 90, spawn: BASE_SPAWN_INTERVAL.easy * SPAWN_INTERVAL_MULTIPLIER.easy },
    normal: { fall: BASE_FALL_SPEED * FALL_SPEED_MULTIPLIER.normal, secondsPerLetter: 60, spawn: BASE_SPAWN_INTERVAL.normal * SPAWN_INTERVAL_MULTIPLIER.normal },
    hard:   { fall: BASE_FALL_SPEED * FALL_SPEED_MULTIPLIER.hard, secondsPerLetter: 30, spawn: BASE_SPAWN_INTERVAL.hard * SPAWN_INTERVAL_MULTIPLIER.hard }
  };
  const SPECIAL_TYPES = ['star', 'heart', 'fairy', 'bomb', 'dizzy'];
  const SPECIAL_ICON = { star: '⭐', heart: '❤️', fairy: '🧚', bomb: '💣', dizzy: '🌀' };
  const SPECIAL_COLOR = {
    star: { fill: '#fff3ad', stroke: '#f1b82f', glow: '#ffd93d' },
    heart: { fill: '#ffd4df', stroke: '#ef4d6d', glow: '#ff6f91' },
    fairy: { fill: '#cfffe9', stroke: '#56cfa0', glow: '#6df0be' },
    bomb: { fill: '#424850', stroke: '#181d24', glow: '#30343a' },
    dizzy: { fill: '#dcd7ff', stroke: '#6b6bce', glow: '#8a7cff' }
  };
  const SIZE_SCALE = .7;
  const BLOCK_SIZE = Math.round(82 * SIZE_SCALE);
  const DINO_SIZE = { w: Math.round(164 * SIZE_SCALE), h: Math.round(128 * SIZE_SCALE) };
  const DINO_DRAW_SCALE = 1.34;
  const BLOCK_HITBOX_RATIO = .9;
  const DINO_GROUND_GAP = 44;
  const DEBUG_HITBOX = false;
  const UI_FONT = '"NanumSquareRound", "Arial Rounded MT Bold", "Noto Sans KR", Arial, sans-serif';
  const dinoSprites = {
    idle: loadDinoSprite('idle'),
    open: loadDinoSprite('open'),
    full: loadDinoSprite('full'),
    star: loadDinoSprite('star'),
    fairy: loadDinoSprite('fairy'),
    stun: loadDinoSprite('stun'),
    dizzy: loadDinoSprite('dizzy')
  };
  const blockSprites = {
    block: loadBlockSprite('block'),
    star: loadBlockSprite('star'),
    heart: loadBlockSprite('heart'),
    fairy: loadBlockSprite('fairy'),
    bomb: loadBlockSprite('bomb'),
    dizzy: loadBlockSprite('dizzy')
  };

  const $ = (id) => document.getElementById(id);
  const screens = [...document.querySelectorAll('.screen')];
  const canvas = $('gameCanvas');
  const ctx = canvas.getContext('2d');
  const controls = { left: false, right: false };
  const RANDOM_DINO_IMAGES = Array.from({ length: 7 }, (_, i) => `images/random/${i + 1}.png`);
  let state = null;
  let animationId = 0;
  let reactionTimer = 0;
  let starTimers = [];
  let preferredKoreanVoice = null;
  let speechSequenceId = 0;
  let targetTransitionTimer = 0;
  const SOUND_STORAGE_KEY = 'dinoHangulSoundSettings';
  const VOICE_STORAGE_KEY = 'dinoHangulSelectedVoiceURI';
  const DEFAULT_SOUND_SETTINGS = { sfx: .7, tts: 1, bgm: .5, ttsRate: 1, ttsPitch: 1, bgmChoice: 'random' };
  const BGM_TRACKS = [
    { id: '001', title: '슈퍼파워 히어로', src: 'audio/bgm/001.ogg' },
    { id: '002', title: '엄마랑 한글공부', src: 'audio/bgm/002.ogg' },
    { id: '003', title: '변신 합체 출동', src: 'audio/bgm/003.ogg' },
    { id: '004', title: '공룡이랑 같이 놀자', src: 'audio/bgm/004.ogg' },
    { id: '005', title: '방구요정 뿡뿡뿡', src: 'audio/bgm/005.ogg' }
  ];
  const BGM_OUTPUT_GAIN = .4;
  const MAIN_BGM_OUTPUT_MULTIPLIER = .8;
  const BGM_ENDING_SCENE_MULTIPLIER = .35;
  const BGM_ENDING_FADE_MS = 650;
  const BGM_GAME_FADE_MS = 500;
  const BGM_STOP_FADE_MS = 320;
  const MAIN_BGM_TRACK = { id: 'main', title: '메인 테마', src: 'audio/bgm/main.ogg' };
  const MAIN_BGM_FADE_OUT_MS = 400;
  const MAIN_BGM_FADE_IN_MS = 500;
  const BGM_PREVIEW_MAIN_FADE_MS = 200;
  let availableTtsVoices = [];
  let selectedVoiceURI = loadSelectedVoiceURI();
  let soundSettings = loadSoundSettings();
  let committedSoundSettings = { ...soundSettings };
  let draftSoundSettings = { ...soundSettings };
  let committedVoiceURI = selectedVoiceURI;
  let draftVoiceURI = selectedVoiceURI;
  let mainBgmAudio = null;
  let bgmAudio = null;
  let nextBgmAudio = null;
  let randomBgmQueue = [];
  let lastBgmId = '';
  let bgmSessionActive = false;
  let bgmPreviewAudio = null;
  let bgmPreviewTrackId = '';
  let bgmPreviewRequestId = 0;
  let bgmFadeAnimationId = 0;
  let mainBgmFadeAnimationId = 0;
  let currentBgmMode = 'none';

  function loadSoundSettings() {
    const ranges = {
      sfx: [0, 1], tts: [0, 1], bgm: [0, 1],
      ttsRate: [.7, 1.3], ttsPitch: [.7, 1.6]
    };
    try {
      const saved = JSON.parse(localStorage.getItem(SOUND_STORAGE_KEY));
      if (!saved) return { ...DEFAULT_SOUND_SETTINGS };
      return Object.fromEntries(Object.entries(DEFAULT_SOUND_SETTINGS).map(([key, value]) => {
        if (key === 'bgmChoice') {
          const valid = saved[key] === 'random' || BGM_TRACKS.some((track) => track.id === saved[key]);
          return [key, valid ? saved[key] : value];
        }
        const [min, max] = ranges[key];
        return [key, Number.isFinite(saved[key]) ? Math.max(min, Math.min(max, saved[key])) : value];
      }));
    } catch (_) { return { ...DEFAULT_SOUND_SETTINGS }; }
  }

  function saveSoundSettings() {
    try { localStorage.setItem(SOUND_STORAGE_KEY, JSON.stringify(soundSettings)); } catch (_) { /* 저장이 제한돼도 게임은 계속된다. */ }
  }

  function getActiveSoundViewId() {
    return document.querySelector('.sound-view.active')?.id || 'soundMenuView';
  }

  function getSoundViewFields(viewId) {
    if (viewId === 'volumeView') return ['sfx', 'tts', 'bgm'];
    if (viewId === 'bgmView') return ['bgmChoice'];
    if (viewId === 'ttsView') return ['ttsRate', 'ttsPitch'];
    return Object.keys(DEFAULT_SOUND_SETTINGS);
  }

  function copyFields(source, target, fields) {
    fields.forEach((field) => { target[field] = source[field]; });
  }

  function applyDraftSettingsToRuntime(fields = Object.keys(DEFAULT_SOUND_SETTINGS)) {
    copyFields(draftSoundSettings, soundSettings, fields);
    if (fields.includes('bgm')) {
      updateBgmVolume();
      updateMainBgmVolume();
      if (bgmPreviewAudio) bgmPreviewAudio.volume = getBgmPreviewVolume();
    }
    if (fields.includes('ttsRate') || fields.includes('ttsPitch')) updatePreferredVoice();
  }

  function restoreDraftFromCommitted(viewId = 'all') {
    const fields = viewId === 'all' ? Object.keys(DEFAULT_SOUND_SETTINGS) : getSoundViewFields(viewId);
    copyFields(committedSoundSettings, draftSoundSettings, fields);
    copyFields(committedSoundSettings, soundSettings, fields);
    if (viewId === 'ttsView' || viewId === 'all') {
      draftVoiceURI = committedVoiceURI;
      selectedVoiceURI = committedVoiceURI;
      updatePreferredVoice();
    }
    if (fields.includes('bgmChoice')) syncBgmChoiceControls();
    syncSoundControls();
    updateBgmVolume();
    updateMainBgmVolume();
    if (bgmPreviewAudio) bgmPreviewAudio.volume = getBgmPreviewVolume();
  }

  function commitDraftSettings(viewId) {
    const fields = getSoundViewFields(viewId);
    copyFields(draftSoundSettings, committedSoundSettings, fields);
    copyFields(committedSoundSettings, soundSettings, fields);
    if (viewId === 'ttsView') {
      committedVoiceURI = draftVoiceURI;
      selectedVoiceURI = committedVoiceURI;
      saveSelectedVoiceURI();
      updatePreferredVoice();
    }
    saveSoundSettings();
    syncSoundControls();
    syncBgmChoiceControls();
    updateBgmVolume();
    updateMainBgmVolume();
    if (bgmPreviewAudio) bgmPreviewAudio.volume = getBgmPreviewVolume();
  }

  function createBgmAudio(track) {
    const audio = new Audio(track.src);
    audio.preload = 'auto';
    audio.volume = getActualBgmVolume();
    audio.dataset.trackId = track.id;
    return audio;
  }

  function createMainBgmAudio() {
    const audio = new Audio(MAIN_BGM_TRACK.src);
    audio.preload = 'auto';
    audio.loop = true;
    audio.volume = getMainBgmVolume();
    audio.dataset.trackId = MAIN_BGM_TRACK.id;
    return audio;
  }

  function getCurrentBgmSceneMultiplier() {
    return ($('successScreen')?.classList.contains('active') || $('restScreen')?.classList.contains('active'))
      ? BGM_ENDING_SCENE_MULTIPLIER
      : 1;
  }

  function getActualBgmVolume() {
    return Math.max(0, Math.min(1, getBaseBgmVolume() * getCurrentBgmSceneMultiplier()));
  }

  function getMainBgmVolume() {
    return Math.max(0, Math.min(1, getBaseBgmVolume() * MAIN_BGM_OUTPUT_MULTIPLIER));
  }

  function getBaseBgmVolume() {
    return Math.max(0, Math.min(1, soundSettings.bgm * BGM_OUTPUT_GAIN));
  }

  function getBgmPreviewVolume() {
    return getBaseBgmVolume();
  }

  function cancelBgmFade() {
    if (bgmFadeAnimationId) cancelAnimationFrame(bgmFadeAnimationId);
    bgmFadeAnimationId = 0;
  }

  function cancelMainBgmFade() {
    if (mainBgmFadeAnimationId) cancelAnimationFrame(mainBgmFadeAnimationId);
    mainBgmFadeAnimationId = 0;
  }

  function applyBgmVolume(volume) {
    if (bgmAudio) bgmAudio.volume = volume;
    if (nextBgmAudio) nextBgmAudio.volume = volume;
    if (bgmPreviewAudio) bgmPreviewAudio.volume = getBgmPreviewVolume();
  }

  function applyMainBgmVolume(volume) {
    if (mainBgmAudio) mainBgmAudio.volume = volume;
  }

  function fadeBgmVolumeTo(targetVolume, duration = 0, onComplete) {
    cancelBgmFade();
    const targets = [bgmAudio, nextBgmAudio].filter(Boolean);
    if (!targets.length || duration <= 0) {
      applyBgmVolume(targetVolume);
      onComplete?.();
      return;
    }
    const startTime = performance.now();
    const startVolumes = targets.map((audio) => audio.volume);
    const step = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      targets.forEach((audio, index) => {
        audio.volume = startVolumes[index] + (targetVolume - startVolumes[index]) * eased;
      });
      if (progress < 1) {
        bgmFadeAnimationId = requestAnimationFrame(step);
      } else {
        bgmFadeAnimationId = 0;
        applyBgmVolume(targetVolume);
        onComplete?.();
      }
    };
    bgmFadeAnimationId = requestAnimationFrame(step);
  }

  function updateBgmVolume(duration = 0) {
    fadeBgmVolumeTo(getActualBgmVolume(), duration);
  }

  function fadeMainBgmVolumeTo(targetVolume, duration = 0, onComplete) {
    cancelMainBgmFade();
    if (!mainBgmAudio || duration <= 0) {
      applyMainBgmVolume(targetVolume);
      onComplete?.();
      return;
    }
    const startTime = performance.now();
    const startVolume = mainBgmAudio.volume;
    const step = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      mainBgmAudio.volume = startVolume + (targetVolume - startVolume) * eased;
      if (progress < 1) {
        mainBgmFadeAnimationId = requestAnimationFrame(step);
      } else {
        mainBgmFadeAnimationId = 0;
        applyMainBgmVolume(targetVolume);
        onComplete?.();
      }
    };
    mainBgmFadeAnimationId = requestAnimationFrame(step);
  }

  function updateMainBgmVolume(duration = 0) {
    fadeMainBgmVolumeTo(getMainBgmVolume(), duration);
  }

  function createBgmPreviewAudio(track) {
    const audio = new Audio(track.src);
    audio.preload = 'auto';
    audio.volume = getBgmPreviewVolume();
    audio.dataset.trackId = track.id;
    return audio;
  }

  function setBgmPreviewIndicator(trackId = '') {
    document.querySelectorAll('.bgm-choice-list label').forEach((label) => {
      const input = label.querySelector('input[name="bgmChoice"]');
      label.classList.toggle('previewing', !!trackId && input?.value === trackId);
    });
  }

  function pauseMainBgmForPreview(onComplete) {
    if (!mainBgmAudio || mainBgmAudio.paused) {
      onComplete?.();
      return;
    }
    fadeMainBgmVolumeTo(0, BGM_PREVIEW_MAIN_FADE_MS, () => {
      mainBgmAudio.pause();
      applyMainBgmVolume(getMainBgmVolume());
      onComplete?.();
    });
  }

  function resumeMainBgmAfterPreview() {
    if (!$('startScreen')?.classList.contains('active')) return;
    if (!mainBgmAudio) mainBgmAudio = createMainBgmAudio();
    if (!mainBgmAudio.paused) {
      updateMainBgmVolume(BGM_PREVIEW_MAIN_FADE_MS);
      return;
    }
    mainBgmAudio.volume = 0;
    currentBgmMode = 'main';
    mainBgmAudio.play()
      .then(() => updateMainBgmVolume(BGM_PREVIEW_MAIN_FADE_MS))
      .catch(() => {});
  }

  function stopBgmPreview(resumeMain = true) {
    bgmPreviewRequestId += 1;
    if (bgmPreviewAudio) {
      bgmPreviewAudio.pause();
      bgmPreviewAudio.currentTime = 0;
      bgmPreviewAudio.onended = null;
      bgmPreviewAudio = null;
    }
    bgmPreviewTrackId = '';
    setBgmPreviewIndicator('');
    if (resumeMain) resumeMainBgmAfterPreview();
  }

  function toggleBgmPreview(trackId) {
    const track = BGM_TRACKS.find((item) => item.id === trackId);
    if (!track) {
      stopBgmPreview(true);
      return;
    }
    if (bgmPreviewAudio && bgmPreviewTrackId === trackId && !bgmPreviewAudio.paused) {
      stopBgmPreview(true);
      return;
    }
    stopBgmPreview(false);
    const requestId = ++bgmPreviewRequestId;
    pauseMainBgmForPreview(() => {
      if (requestId !== bgmPreviewRequestId) return;
      bgmPreviewAudio = createBgmPreviewAudio(track);
      bgmPreviewTrackId = track.id;
      setBgmPreviewIndicator(track.id);
      bgmPreviewAudio.onended = () => stopBgmPreview(true);
      bgmPreviewAudio.play().catch(() => stopBgmPreview(true));
    });
  }

  function selectBgmChoice(value) {
    draftSoundSettings.bgmChoice = value;
    soundSettings.bgmChoice = value;
    document.querySelectorAll('input[name="bgmChoice"]').forEach((input) => {
      input.checked = input.value === value;
    });
  }

  function shuffledBgmTracks() {
    const tracks = shuffleArray(BGM_TRACKS);
    if (lastBgmId && tracks[0]?.id === lastBgmId && tracks.length > 1) {
      tracks.push(tracks.shift());
    }
    return tracks;
  }

  function nextRandomBgmTrack() {
    if (!randomBgmQueue.length) randomBgmQueue = shuffledBgmTracks();
    return randomBgmQueue.shift();
  }

  function prepareNextRandomBgm() {
    if (soundSettings.bgmChoice !== 'random') {
      nextBgmAudio = null;
      return;
    }
    const nextTrack = randomBgmQueue[0] || nextRandomBgmTrack();
    if (!nextTrack) return;
    if (!randomBgmQueue.length || randomBgmQueue[0]?.id !== nextTrack.id) randomBgmQueue.unshift(nextTrack);
    nextBgmAudio = createBgmAudio(nextTrack);
  }

  function playBgmTrack(track, fadeIn = false) {
    if (!track) return;
    stopMainBgm(false);
    if (bgmAudio) {
      bgmAudio.pause();
      bgmAudio.onended = null;
    }
    bgmAudio = nextBgmAudio?.dataset.trackId === track.id ? nextBgmAudio : createBgmAudio(track);
    nextBgmAudio = null;
    bgmAudio.volume = fadeIn ? 0 : getActualBgmVolume();
    bgmAudio.loop = soundSettings.bgmChoice !== 'random';
    bgmAudio.onended = () => {
      if (!bgmSessionActive || soundSettings.bgmChoice !== 'random') return;
      lastBgmId = bgmAudio?.dataset.trackId || '';
      const nextTrack = nextRandomBgmTrack();
      prepareNextRandomBgm();
      playBgmTrack(nextTrack);
    };
    currentBgmMode = 'game';
    bgmAudio.play().catch(() => { /* 모바일 오디오 제한이 있어도 게임은 계속된다. */ });
    if (fadeIn) updateBgmVolume(BGM_GAME_FADE_MS);
    if (soundSettings.bgmChoice === 'random') prepareNextRandomBgm();
  }

  function startBgm(fadeIn = false) {
    bgmSessionActive = true;
    cancelBgmFade();
    if (bgmAudio && !bgmAudio.paused) {
      currentBgmMode = 'game';
      stopMainBgm(false);
      updateBgmVolume(fadeIn ? BGM_GAME_FADE_MS : 0);
      return;
    }
    if (soundSettings.bgmChoice === 'random') {
      randomBgmQueue = shuffledBgmTracks();
      playBgmTrack(nextRandomBgmTrack(), fadeIn);
      return;
    }
    const track = BGM_TRACKS.find((item) => item.id === soundSettings.bgmChoice) || BGM_TRACKS[0];
    playBgmTrack(track, fadeIn);
  }

  function stopBgm(fade = false, onComplete) {
    bgmSessionActive = false;
    randomBgmQueue = [];
    lastBgmId = '';
    const stopAudios = () => {
      cancelBgmFade();
      if (bgmAudio) {
        bgmAudio.pause();
        bgmAudio.currentTime = 0;
        bgmAudio.onended = null;
      }
      if (nextBgmAudio) {
        nextBgmAudio.pause();
        nextBgmAudio = null;
      }
      if (currentBgmMode === 'game') currentBgmMode = 'none';
      onComplete?.();
    };
    if (fade && bgmAudio && !bgmAudio.paused) {
      fadeBgmVolumeTo(0, BGM_STOP_FADE_MS, stopAudios);
      return;
    }
    stopAudios();
  }

  function startMainBgm(fadeIn = 0, restart = false) {
    if (!$('startScreen')?.classList.contains('active')) return Promise.resolve(false);
    stopBgm(false);
    cancelMainBgmFade();
    if (!mainBgmAudio) mainBgmAudio = createMainBgmAudio();
    if (restart) mainBgmAudio.currentTime = 0;
    mainBgmAudio.loop = true;
    mainBgmAudio.volume = fadeIn ? 0 : getMainBgmVolume();
    currentBgmMode = 'main';
    return mainBgmAudio.play()
      .then(() => {
        if (fadeIn) updateMainBgmVolume(fadeIn);
        removeMainBgmUnlockListeners();
        return true;
      })
      .catch(() => {
        currentBgmMode = 'none';
        return false;
      });
  }

  function stopMainBgm(fade = false, onComplete) {
    const stopAudio = () => {
      cancelMainBgmFade();
      if (mainBgmAudio) {
        mainBgmAudio.pause();
        mainBgmAudio.currentTime = 0;
      }
      if (currentBgmMode === 'main') currentBgmMode = 'none';
      onComplete?.();
    };
    if (fade && mainBgmAudio && !mainBgmAudio.paused) {
      fadeMainBgmVolumeTo(0, MAIN_BGM_FADE_OUT_MS, stopAudio);
      return;
    }
    stopAudio();
  }

  function switchFromMainToGameBgm() {
    stopBgmPreview(false);
    if (mainBgmAudio && !mainBgmAudio.paused) {
      stopMainBgm(true, () => startBgm(true));
      return;
    }
    stopMainBgm(false);
    startBgm(true);
  }

  function tryStartMainBgmFromInteraction(event) {
    if (!$('startScreen')?.classList.contains('active')) return;
    if (event?.target?.closest?.('#startButton')) return;
    if (mainBgmAudio && !mainBgmAudio.paused) return;
    startMainBgm(MAIN_BGM_FADE_IN_MS, false);
  }

  function playButtonClickSfx(event) {
    const button = event.target?.closest?.('button');
    if (!button || button.disabled) return;
    if (button.dataset.clickSound === 'false' || button.classList.contains('no-click-sfx')) return;
    event.sfxPromise = playSfx('click');
  }

  function addMainBgmUnlockListeners() {
    document.addEventListener('pointerdown', tryStartMainBgmFromInteraction, { passive: true });
    document.addEventListener('keydown', tryStartMainBgmFromInteraction);
  }

  function removeMainBgmUnlockListeners() {
    document.removeEventListener('pointerdown', tryStartMainBgmFromInteraction);
    document.removeEventListener('keydown', tryStartMainBgmFromInteraction);
  }

  function loadSelectedVoiceURI() {
    try { return localStorage.getItem(VOICE_STORAGE_KEY) || ''; } catch (_) { return ''; }
  }

  function saveSelectedVoiceURI() {
    try {
      if (selectedVoiceURI) localStorage.setItem(VOICE_STORAGE_KEY, selectedVoiceURI);
      else localStorage.removeItem(VOICE_STORAGE_KEY);
    } catch (_) { /* 음성 선택 저장이 막혀도 게임은 계속된다. */ }
  }

  function loadDinoSprite(name) {
    const image = new Image();
    image.src = `images/dino/${name}.png`;
    image.onerror = (event) => console.error('공룡 이미지 로드 실패:', image.src, event);
    return image;
  }

  function loadBlockSprite(name) {
    const image = new Image();
    image.src = `images/blocks/${name}.png`;
    image.onerror = (event) => console.error('블록 이미지 로드 실패:', image.src, event);
    return image;
  }

  function showScreen(id) {
    const wasEndingScene = $('successScreen')?.classList.contains('active') || $('restScreen')?.classList.contains('active');
    screens.forEach((screen) => screen.classList.toggle('active', screen.id === id));
    if (id === 'startScreen') shuffleStartDinoMarch();
    if (id === 'startScreen') return;
    const isEndingScene = id === 'successScreen' || id === 'restScreen';
    const fadeDuration = isEndingScene ? BGM_ENDING_FADE_MS : (wasEndingScene ? BGM_GAME_FADE_MS : 0);
    updateBgmVolume(fadeDuration);
  }

  function shuffleArray(array) {
    const mixed = [...array];
    for (let i = mixed.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mixed[i], mixed[j]] = [mixed[j], mixed[i]];
    }
    return mixed;
  }

  function shuffleStartDinoMarch() {
    const track = $('randomDinoTrack');
    if (!track) return;
    const order = shuffleArray(RANDOM_DINO_IMAGES);
    track.innerHTML = '';
    const images = [...order, ...order].map((src, index) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      img.draggable = false;
      img.style.animationDelay = `${-(index % order.length) * .23}s`;
      track.appendChild(img);
      return img;
    });
    updateStartDinoMarchDistance(images, order.length);
  }

  function updateStartDinoMarchDistance(images, setLength = RANDOM_DINO_IMAGES.length) {
    const track = $('randomDinoTrack');
    images = images || [...(track?.children || [])];
    if (!track || !images.length) return;
    const waitImages = images.map((img) => {
      if (img.complete && img.naturalWidth) return Promise.resolve();
      if (img.decode) return img.decode().catch(() => {});
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });
    Promise.all(waitImages).then(() => {
      const firstSet = [...track.children].slice(0, setLength);
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      const distance = firstSet.reduce((sum, img) => sum + img.getBoundingClientRect().width, 0) + gap * setLength;
      track.style.setProperty('--march-distance', `${Math.max(distance, 1)}px`);
    });
  }

  // 완성형 한글 음절을 초성/중성/종성으로 분해한다.
  function decomposeHangul(text) {
    const result = [];
    for (const char of text) {
      const code = char.charCodeAt(0);
      if (code >= 0xAC00 && code <= 0xD7A3) {
        const offset = code - 0xAC00;
        const initial = INITIALS[Math.floor(offset / 588)];
        const medial = MEDIALS[Math.floor((offset % 588) / 28)];
        const final = FINALS[offset % 28];
        result.push(initial);
        result.push(...(SPLIT[medial] || [medial]));
        if (final) result.push(...(SPLIT[final] || [final]));
      } else if (/^[ㄱ-ㅎㅏ-ㅣ]$/.test(char)) {
        result.push(...(DOUBLE_INITIALS.has(char) ? [char] : (SPLIT[char] || [char])));
      }
    }
    return result;
  }

  function cleanWord(value) {
    return [...value.trim()].filter((c) => /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(c)).slice(0, 10).join('');
  }

  function startGame() {
    const word = cleanWord($('wordInput').value);
    $('wordInput').value = word;
    $('inputHelp').classList.remove('shake');
    if (!word) {
      $('startMessage').textContent = '';
      void $('inputHelp').offsetWidth;
      $('inputHelp').classList.add('shake');
      $('wordInput').focus();
      return;
    }
    $('startMessage').textContent = '';
    const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
    const targets = [...word].map((char) => ({ char, jamo: decomposeHangul(char) }));
    const needed = targets.flatMap((target) => target.jamo);
    const config = SETTINGS[difficulty];
    const timeLimit = Math.min(word.length * config.secondsPerLetter, 600);
    clearTimeout(targetTransitionTimer);
    speechSequenceId += 1;
    state = {
      word, needed, targets, targetIndex: 0, remaining: [...targets[0].jamo], health: 5,
      difficulty, config, timeLimit,
      elapsed: 0, lastTime: 0, spawnClock: 0, normalSinceSpecial: 0, nextSpecialAfter: randomSpecialGap(),
      trapSinceCorrect: 0, nextCorrectAfter: randomCorrectGap(),
      lastSpecialType: '', items: [], particles: [], recentLanes: [], transitioning: false, running: true,
      mode: 'trace', traceIndex: 0, traceDrawing: false, traceLastPoint: null, traceStrokes: [],
      // 기존 별 효과 때의 체감 이동속도를 기본 속도로 올린다.
      dino: { x: 0, y: 0, w: DINO_SIZE.w, h: DINO_SIZE.h, speed: 374, frozenUntil: 0, boostedUntil: 0, invincibleUntil: 0, transitionInvincibleUntil: 0, fairyUntil: 0, reversedUntil: 0, eatUntil: 0, eatStartedAt: 0, eatSpecialType: '', facing: 1 }
    };
    switchFromMainToGameBgm();
    $('missionWord').textContent = word;
    renderTraceInfo();
    renderHealth();
    showScreen('gameScreen');
    $('gameScreen').classList.add('trace-mode');
    resizeCanvas();
    state.dino.x = (canvas.clientWidth - state.dino.w) / 2;
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(traceLoop);
    speakCurrentTarget();
  }

  function renderRemaining(eatenIndex = -1) {
    $('remainingJamo').innerHTML = '';
    document.querySelector('.remaining-title').textContent = '지금 먹을 글자';
    state.remaining.forEach((jamo, i) => {
      const chip = document.createElement('span');
      chip.className = 'jamo-chip';
      chip.textContent = jamo;
      chip.dataset.index = i;
      $('remainingJamo').appendChild(chip);
    });
  }

  function renderTraceInfo() {
    $('remainingJamo').innerHTML = '';
    $('traceNextButton').classList.add('show');
    $('traceNextButton').disabled = false;
    $('healthHearts').innerHTML = '';
    const chip = document.createElement('span');
    chip.className = 'jamo-chip';
    chip.textContent = `${state.traceIndex + 1} / ${state.targets.length}`;
    $('remainingJamo').appendChild(chip);
    document.querySelector('.remaining-title').textContent = '따라쓰기';
  }

  function renderHealth() {
    $('healthHearts').innerHTML = Array.from({ length: 5 }, (_, i) => `<span class="${i < state.health ? '' : 'empty'}">♥</span>`).join('');
    $('healthHearts').setAttribute('aria-label', `체력 ${state.health}칸`);
  }

  function updatePreferredVoice() {
    if (!('speechSynthesis' in window)) return;
    availableTtsVoices = window.speechSynthesis.getVoices();
    const koreanVoices = availableTtsVoices.filter((voice) => /^ko([-_]|$)/i.test(voice.lang || ''));
    const savedVoice = selectedVoiceURI ? availableTtsVoices.find((voice) => (voice.voiceURI || voice.name) === selectedVoiceURI) : null;
    preferredKoreanVoice = savedVoice || koreanVoices[0] || availableTtsVoices[0] || null;
    if (selectedVoiceURI && !savedVoice && preferredKoreanVoice) {
      selectedVoiceURI = preferredKoreanVoice.voiceURI || preferredKoreanVoice.name || '';
      draftVoiceURI = selectedVoiceURI;
    }
    renderTtsVoiceControls();
  }

  function resetTtsSettings() {
    updatePreferredVoice();
    const koreanVoices = availableTtsVoices.filter((voice) => /^ko([-_]|$)/i.test(voice.lang || ''));
    preferredKoreanVoice = koreanVoices[0] || availableTtsVoices[0] || null;
    draftVoiceURI = preferredKoreanVoice ? (preferredKoreanVoice.voiceURI || preferredKoreanVoice.name || '') : '';
    selectedVoiceURI = draftVoiceURI;
    draftSoundSettings.ttsRate = DEFAULT_SOUND_SETTINGS.ttsRate;
    draftSoundSettings.ttsPitch = DEFAULT_SOUND_SETTINGS.ttsPitch;
    applyDraftSettingsToRuntime(['ttsRate', 'ttsPitch']);
    syncSoundControls();
    renderTtsVoiceControls();
  }

  function getDisplayVoices() {
    const koreanVoices = availableTtsVoices.filter((voice) => /^ko([-_]|$)/i.test(voice.lang || ''));
    return koreanVoices.length ? koreanVoices : availableTtsVoices;
  }

  function renderTtsVoiceControls() {
    const select = $('ttsVoiceSelect');
    if (!select) return;
    const voices = getDisplayVoices();
    select.innerHTML = '';
    if (!voices.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = '음성 불러오는 중';
      select.appendChild(option);
      return;
    }
    voices.forEach((voice, index) => {
      const option = document.createElement('option');
      option.value = voice.voiceURI || voice.name || String(index);
      option.textContent = `${voice.name || '이름 없음'} (${voice.lang || 'lang 없음'})`;
      select.appendChild(option);
    });
    if (preferredKoreanVoice) select.value = preferredKoreanVoice.voiceURI || preferredKoreanVoice.name || '';
  }

  function createKoreanUtterance(text) {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'ko-KR';
    if (preferredKoreanVoice) speech.voice = preferredKoreanVoice;
    speech.rate = soundSettings.ttsRate;
    speech.pitch = soundSettings.ttsPitch;
    speech.volume = soundSettings.tts;
    return speech;
  }

  function getTtsTestText(button) {
    if (button.dataset.ttsJamo) return [...button.dataset.ttsJamo].map((jamo) => ttsMap[jamo] || jamo).join(', ');
    return button.dataset.ttsTest || '';
  }

  function speakTestSequence(words, pause = 260) {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
    try {
      updatePreferredVoice();
      window.speechSynthesis.cancel();
      const speakNext = (index) => {
        if (index >= words.length) return;
        const speech = createKoreanUtterance(words[index]);
        const next = () => setTimeout(() => speakNext(index + 1), pause);
        speech.onend = next;
        speech.onerror = next;
        window.speechSynthesis.speak(speech);
      };
      speakNext(0);
    } catch (_) { /* 테스트 음성도 지원되지 않으면 조용히 넘어간다. */ }
  }

  function initializeTtsVoiceTester() {
    const select = $('ttsVoiceSelect');
    if (select) {
      select.addEventListener('change', () => {
        draftVoiceURI = select.value;
        selectedVoiceURI = draftVoiceURI;
        updatePreferredVoice();
      });
    }
    document.querySelectorAll('[data-tts-test], [data-tts-jamo]').forEach((button) => {
      button.addEventListener('click', (event) => {
        Promise.resolve(event.sfxPromise).finally(() => speakTestSequence([getTtsTestText(button)], 0));
      });
    });
    $('resetTtsButton')?.addEventListener('click', resetTtsSettings);
  }

  function speakSequence(words, pause = 240) {
    if (!state || !state.running || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
    try {
      updatePreferredVoice();
      const sequenceId = ++speechSequenceId;
      window.speechSynthesis.cancel();
      const speakNext = (index) => {
        if (sequenceId !== speechSequenceId || index >= words.length || !state?.running) return;
        const speech = createKoreanUtterance(words[index]);
        const next = () => setTimeout(() => speakNext(index + 1), pause);
        speech.onend = next;
        speech.onerror = next;
        window.speechSynthesis.speak(speech);
      };
      speakNext(0);
    } catch (_) { /* 음성 미지원 환경에서는 게임만 계속한다. */ }
  }

  function speakCurrentTarget() {
    if (!state?.running) return;
    const target = state.mode === 'trace' ? state.targets[state.traceIndex] : state.targets[state.targetIndex];
    speakSequence([target.char], 0);
  }

  function speakJamo(jamo) {
    speakSequence([ttsMap[jamo] || jamo], 0);
  }

  // 효과음은 파일이 없거나 볼륨이 0이면 조용히 건너뛰고, 필요하면 끝난 뒤 다음 동작을 이어간다.
  function playSfx(type) {
    const paths = {
      click: 'audio/sfx/click.ogg',
      eat: 'audio/sfx/eat.ogg',
      good: 'audio/sfx/good.ogg',
      bad: 'audio/sfx/bad.ogg',
      resultStar: 'audio/sfx/result-star.ogg',
      success: 'audio/sfx/success.ogg',
      fail: 'audio/sfx/fail.ogg'
    };
    const path = paths[type];
    if (!path || soundSettings.sfx <= 0) return Promise.resolve(false);
    return new Promise((resolve) => {
      try {
        const audio = new Audio(path);
        const volumeMultiplier = type === 'bad' ? 1.15 : (type === 'resultStar' ? 1.2 : (type === 'fail' ? .85 : (type === 'success' ? .9 : 1)));
        audio.volume = Math.min(1, soundSettings.sfx * volumeMultiplier);
        const done = (played) => {
          audio.onended = null;
          audio.onerror = null;
          resolve(played);
        };
        const fallbackTimer = setTimeout(() => done(false), 900);
        audio.onended = () => {
          clearTimeout(fallbackTimer);
          done(true);
        };
        audio.onerror = () => {
          clearTimeout(fallbackTimer);
          done(false);
        };
        audio.play().catch(() => {
          clearTimeout(fallbackTimer);
          done(false);
        });
      } catch (_) {
        resolve(false);
      }
    });
  }

  function playEatSfxThenSpeak(jamo) {
    playSfx('eat').finally(() => speakJamo(jamo));
  }

  function advanceTarget() {
    state.targetIndex += 1;
    if (state.targetIndex >= state.targets.length) {
      finishGame();
      return;
    }
    state.transitioning = false;
    state.spawnClock = 0;
    state.remaining = [...state.targets[state.targetIndex].jamo];
    state.trapSinceCorrect = 0;
    state.nextCorrectAfter = randomCorrectGap();
    state.dino.transitionInvincibleUntil = performance.now() + 500;
    rerollExistingJamoBlocks();
    renderRemaining();
    speakCurrentTarget();
  }

  function restartPlayOnly() {
    if (!state) {
      startGame();
      return;
    }
    clearTimeout(targetTransitionTimer);
    speechSequenceId += 1;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    state.running = true;
    state.mode = 'play';
    state.targetIndex = 0;
    state.traceIndex = 0;
    state.remaining = [...state.targets[0].jamo];
    state.health = 5;
    state.elapsed = 0;
    state.lastTime = 0;
    state.spawnClock = 0;
    state.normalSinceSpecial = 0;
    state.nextSpecialAfter = randomSpecialGap();
    state.trapSinceCorrect = 0;
    state.nextCorrectAfter = randomCorrectGap();
    state.items = [];
    state.particles = [];
    state.recentLanes = [];
    state.transitioning = false;
    state.traceDrawing = false;
    state.traceLastPoint = null;
    state.traceStrokes = [];
    clearSpecialEffects();
    state.dino.eatUntil = 0;
    state.dino.eatStartedAt = 0;
    state.dino.eatSpecialType = '';
    state.dino.transitionInvincibleUntil = 0;
    $('missionWord').textContent = state.word;
    $('traceNextButton').classList.remove('show');
    $('traceNextButton').disabled = true;
    $('gameScreen').classList.remove('trace-mode');
    renderRemaining();
    renderHealth();
    showScreen('gameScreen');
    resizeCanvas();
    controls.left = false;
    controls.right = false;
    state.dino.x = (canvas.clientWidth - state.dino.w) / 2;
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(gameLoop);
    speakCurrentTarget();
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (state) state.dino.y = rect.height - state.dino.h - DINO_GROUND_GAP;
    if (state?.mode === 'trace') drawTrace();
  }

  function randomSpecialGap() {
    return 4 + Math.floor(Math.random() * 2);
  }

  function randomCorrectGap() {
    return 2 + Math.floor(Math.random() * 2);
  }

  function traceLoop(time) {
    if (!state || !state.running || state.mode !== 'trace') return;
    if (!state.lastTime) state.lastTime = time;
    state.lastTime = time;
    drawTrace();
    animationId = requestAnimationFrame(traceLoop);
  }

  function drawTrace() {
    if (!state || state.mode !== 'trace') return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#f5fbff'); sky.addColorStop(1, '#dff8ee');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    drawCloud(w * .18, h * .14, .85); drawCloud(w * .82, h * .24, .65);

    const target = state.targets[state.traceIndex]?.char || '';
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `1000 ${getTraceFontSize(target, w, h)}px ${UI_FONT}`;
    ctx.fillStyle = '#c8ced4';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(10, Math.min(w, h) * .028);
    ctx.strokeText(target, w / 2, h / 2 - 12);
    ctx.fillText(target, w / 2, h / 2 - 12);
    ctx.restore();

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#171717';
    ctx.lineWidth = Math.max(14, Math.min(w, h) * .045);
    state.traceStrokes.forEach((stroke) => {
      if (stroke.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y);
      ctx.stroke();
    });
    ctx.restore();

  }

  function getTraceFontSize(text, width, height) {
    const maxWidth = width * .96;
    const maxHeight = height * .84;
    let size = Math.min(height * .9, width * 1.55, 520);
    while (size > 80) {
      ctx.font = `1000 ${size}px ${UI_FONT}`;
      const metrics = ctx.measureText(text);
      const textHeight = (metrics.actualBoundingBoxAscent || size * .75) + (metrics.actualBoundingBoxDescent || size * .18);
      if (metrics.width <= maxWidth && textHeight <= maxHeight) return size;
      size -= 8;
    }
    return size;
  }

  function resetTraceStroke() {
    state.traceDrawing = false;
    state.traceLastPoint = null;
    state.traceStrokes = [];
    renderTraceInfo();
    state.lastTime = 0;
    speakCurrentTarget();
  }

  function completeTraceMode() {
    state.mode = 'play';
    state.lastTime = 0;
    state.targetIndex = 0;
    state.remaining = [...state.targets[0].jamo];
    state.items = [];
    state.particles = [];
    state.spawnClock = 0;
    state.normalSinceSpecial = 0;
    state.nextSpecialAfter = randomSpecialGap();
    state.trapSinceCorrect = 0;
    state.nextCorrectAfter = randomCorrectGap();
    state.recentLanes = [];
    state.transitioning = false;
    state.dino.transitionInvincibleUntil = 0;
    $('traceNextButton').classList.remove('show');
    $('traceNextButton').disabled = true;
    $('gameScreen').classList.remove('trace-mode');
    renderRemaining();
    renderHealth();
    resizeCanvas();
    controls.left = false; controls.right = false;
    state.dino.x = (canvas.clientWidth - state.dino.w) / 2;
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(gameLoop);
    speakCurrentTarget();
  }

  function goNextTrace() {
    if (!state || state.mode !== 'trace') return;
    state.traceIndex += 1;
    if (state.traceIndex >= state.targets.length) {
      completeTraceMode();
      return;
    }
    resetTraceStroke();
  }

  function gameLoop(time) {
    if (!state || !state.running) return;
    if (!state.lastTime) state.lastTime = time;
    const dt = Math.min((time - state.lastTime) / 1000, .04);
    state.lastTime = time;
    state.elapsed += dt;
    update(dt, time);
    draw(time);
    animationId = requestAnimationFrame(gameLoop);
  }

  function update(dt, now) {
    const dino = state.dino;
    const frozen = now < dino.frozenUntil;
    const boosted = now < dino.boostedUntil;
    const reversed = now < dino.reversedUntil;
    if (!frozen) {
      const inputDirection = (controls.right ? 1 : 0) - (controls.left ? 1 : 0);
      const direction = reversed ? -inputDirection : inputDirection;
      if (direction) dino.facing = direction;
      dino.x += direction * dino.speed * (boosted ? 2.5 : 1) * dt;
      dino.x = Math.max(0, Math.min(canvas.clientWidth - dino.w, dino.x));
    }
    state.spawnClock += dt;
    if (!state.transitioning && state.spawnClock >= state.config.spawn) {
      state.spawnClock = 0;
      spawnItem();
    }
    for (let i = state.items.length - 1; i >= 0; i--) {
      const item = state.items[i];
      // 목표 글자가 바뀌며 블록 목록이 짧아진 프레임은 안전하게 건너뛴다.
      if (!item) continue;
      item.y += item.speed * dt;
      item.bob += dt * 4;
      updateItemMotion(item, dt, now);
      if (state.transitioning && item.type === 'jamo') {
        if (item.y > canvas.clientHeight + 55) state.items.splice(i, 1);
        continue;
      }
      if (collides(item, dino)) {
        state.items.splice(i, 1);
        collect(item, now);
      } else if (item.y > canvas.clientHeight + 55) {
        state.items.splice(i, 1);
      }
    }
    state.particles.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 130 * dt; p.life -= dt; });
    state.particles = state.particles.filter((p) => p.life > 0);
  }

  function updateItemMotion(item, dt, now) {
    if (item.type === 'star') {
      // 별은 한눈에 보이는 지그재그: 큰 폭 + 빠른 흔들림.
      item.x = item.baseX + Math.sin(now / 105 + item.phase) * 42;
    } else if (item.type === 'heart') {
      // 하트는 좌우보다 위아래 통통 튀는 느낌이 나도록 세로 흔들림을 크게 준다.
      item.x = item.baseX + Math.sin(now / 520 + item.phase) * 5;
    } else if (item.type === 'fairy') {
      item.x = item.baseX + Math.sin(now / 330 + item.phase) * 13;
      item.sparkle += dt * 7;
    } else if (item.type === 'dizzy') {
      item.rotation += dt * 6.5;
    }
    const visualW = item.w * getBlockVisualScale(item);
    const minX = 3 - item.w / 2 + visualW / 2;
    const maxX = canvas.clientWidth - 3 - item.w / 2 - visualW / 2;
    item.x = Math.max(minX, Math.min(maxX, item.x));
  }

  // 일반 블록은 정답 30%, 함정 70% 비율로만 생성한다.
  function assignNormalBlockContent(item, usePattern = true) {
    if (usePattern && state.remaining.length && state.trapSinceCorrect >= state.nextCorrectAfter) {
      assignCorrectBlockContent(item);
      state.trapSinceCorrect = 0;
      state.nextCorrectAfter = randomCorrectGap();
      return;
    }
    assignTrapBlockContent(item);
    if (usePattern) state.trapSinceCorrect += 1;
  }

  function assignCorrectBlockContent(item) {
    item.type = 'jamo';
    item.role = 'correct';
    item.value = state.remaining[Math.floor(Math.random() * state.remaining.length)];
  }

  function assignTrapBlockContent(item) {
    const targetJamo = state.targets[state.targetIndex].jamo;
    const traps = ALL_JAMO.filter((jamo) => !targetJamo.includes(jamo));
    item.type = 'jamo';
    item.role = 'trap';
    item.value = traps[Math.floor(Math.random() * traps.length)];
  }

  function assignSpecialBlockContent(item) {
    const choices = SPECIAL_TYPES.filter((type) => type !== state.lastSpecialType);
    const type = choices[Math.floor(Math.random() * choices.length)];
    state.lastSpecialType = type;
    item.type = type;
    item.role = 'special';
    item.value = '';
    if (type === 'star') item.speed *= 1.5;
    else item.speed *= ['heart', 'fairy'].includes(type) ? 1.5 : 1.8 + Math.random() * .2;
    item.rotation = 0;
  }

  function refreshEatenBlocks(eatenValue) {
    state.items.forEach((item) => {
      if (item.type === 'jamo' && item.value === eatenValue) assignNormalBlockContent(item, false);
    });
  }

  function rerollExistingJamoBlocks() {
    const normalBlocks = state.items.filter((item) => item.type === 'jamo');
    if (!normalBlocks.length) return;
    let correctCount = 0;
    normalBlocks.forEach((item) => {
      assignNormalBlockContent(item, true);
      if (item.role === 'correct') correctCount += 1;
    });
    if (!correctCount && state.remaining.length) {
      assignCorrectBlockContent(normalBlocks[Math.floor(Math.random() * normalBlocks.length)]);
      state.trapSinceCorrect = 0;
      state.nextCorrectAfter = randomCorrectGap();
    }
  }

  function isActiveFallingItem(item) {
    return item && item.y <= canvas.clientHeight + 55;
  }

  function countActiveNormalBlocks() {
    return state.items.filter((item) => isActiveFallingItem(item) && item.type === 'jamo').length;
  }

  function countActiveSpecialBlocks() {
    return state.items.filter((item) => isActiveFallingItem(item) && item.role === 'special').length;
  }

  function spawnItem() {
    const shouldSpawnSpecial = state.normalSinceSpecial >= state.nextSpecialAfter;
    if (shouldSpawnSpecial) {
      if (countActiveSpecialBlocks() >= MAX_ACTIVE_SPECIAL_BLOCKS) return;
    } else if (countActiveNormalBlocks() >= MAX_ACTIVE_NORMAL_BLOCKS) {
      return;
    }

    // 화면 전체를 더 촘촘한 레인으로 나누고, 좌/중/우가 골고루 나오도록 고른다.
    const size = BLOCK_SIZE;
    const sidePadding = 8;
    const maxVisualSize = size * 2;
    const minCenter = sidePadding + maxVisualSize / 2;
    const maxCenter = Math.max(minCenter, canvas.clientWidth - sidePadding - maxVisualSize / 2);
    const gap = 14;
    const minSpacing = maxVisualSize * .78 + gap;
    const nearby = state.items.filter((item) => item.y < maxVisualSize + gap);
    const laneCount = Math.max(3, Math.min(6, Math.round(canvas.clientWidth / 86)));
    const lanes = Array.from({ length: laneCount }, (_, i) => laneCount === 1 ? minCenter : minCenter + (maxCenter - minCenter) * i / (laneCount - 1));
    const allIndexes = lanes.map((_, index) => index);
    const openIndexes = allIndexes.filter((index) => nearby.every((item) => Math.abs(lanes[index] - (item.x + item.w / 2)) >= minSpacing));
    let choices = openIndexes.length ? openIndexes : allIndexes;
    const recent = state.recentLanes.slice(-6);
    const notTooClose = choices.filter((index) => recent.every((old) => Math.abs(index - old) > 1));
    if (notTooClose.length >= 2) choices = notTooClose;
    else {
      const exactFresh = choices.filter((index) => !recent.slice(-3).includes(index));
      if (exactFresh.length) choices = exactFresh;
    }
    const regionCounts = [0, 0, 0];
    recent.forEach((index) => { regionCounts[Math.min(2, Math.floor(index / laneCount * 3))] += 1; });
    const maxRegionCount = Math.max(...regionCounts);
    const rankedChoices = choices.map((index) => ({
      index,
      score:
        (maxRegionCount - regionCounts[Math.min(2, Math.floor(index / laneCount * 3))]) * 7 +
        (recent.length ? Math.min(...recent.map((old) => Math.abs(index - old))) * 1.6 : 0) +
        Math.random() * 8
    })).sort((a, b) => b.score - a.score);
    const laneIndex = rankedChoices[0].index;
    const x = lanes[laneIndex] - size / 2;
    state.recentLanes.push(laneIndex);
    state.recentLanes = state.recentLanes.slice(-6);
    const item = {
      x, baseX: x, y: -size, w: size, h: size, speed: state.config.fall * (.88 + Math.random() * .25),
      bob: Math.random() * 6, phase: Math.random() * Math.PI * 2, sparkle: Math.random() * Math.PI * 2
    };
    if (shouldSpawnSpecial) {
      assignSpecialBlockContent(item);
      state.normalSinceSpecial = 0;
      state.nextSpecialAfter = randomSpecialGap();
    } else {
      assignNormalBlockContent(item);
      state.normalSinceSpecial += 1;
    }
    state.items.push(item);
  }

  function collides(a, b) {
    const aBox = getBlockHitbox(a);
    const bBox = b === state?.dino ? getDinoHitbox(b) : getHitbox(b, .88);
    return aBox.x + aBox.w > bBox.x && aBox.x < bBox.x + bBox.w &&
      aBox.y + aBox.h > bBox.y && aBox.y < bBox.y + bBox.h;
  }

  function getDinoHitbox(d) {
    // 공룡 이미지는 투명 여백과 긴 꼬리가 있으므로, 보이는 크기보다 조금 관대하게 판정한다.
    const displayW = d.w * DINO_DRAW_SCALE;
    const displayH = d.h * DINO_DRAW_SCALE;
    const now = performance.now();
    const eatElapsed = now - d.eatStartedAt;
    const mouthOpen = now < d.eatUntil && eatElapsed < 120;
    const w = displayW * (mouthOpen ? .384 : .344);
    const h = displayH * (mouthOpen ? .384 : .352);
    const drawLeft = d.x + d.w / 2 - displayW / 2;
    const drawTop = d.y + d.h / 2 - displayH / 2;
    const frontRatio = mouthOpen ? .17 : .21;
    const x = d.facing >= 0
      ? drawLeft + displayW * (1 - frontRatio) - w
      : drawLeft + displayW * frontRatio;
    const y = drawTop + displayH * (mouthOpen ? .14 : .17);
    return {
      x,
      y,
      w,
      h
    };
  }

  function getHitbox(obj, ratio) {
    const w = obj.w * ratio;
    const h = obj.h * ratio;
    return { x: obj.x + (obj.w - w) / 2, y: obj.y + (obj.h - h) / 2, w, h };
  }

  function getBlockVisualScale(item) {
    if (item.type === 'jamo') return 1.38;
    if (item.type === 'fairy') return 1.4;
    if (item.type === 'star') return 1.292;
    if (item.type === 'heart') return 1.17045;
    if (['bomb', 'dizzy'].includes(item.type)) return 1.224;
    return 1.38;
  }

  function getBlockVisualBounds(item, visualY = item.y) {
    const scale = getBlockVisualScale(item);
    const w = item.w * scale;
    const h = item.h * scale;
    return {
      x: item.x + item.w / 2 - w / 2,
      y: visualY + item.h / 2 - h / 2,
      w,
      h
    };
  }

  function getBlockHitbox(item) {
    const bounds = getBlockVisualBounds(item);
    const ratio = item.type === 'jamo' ? BLOCK_HITBOX_RATIO * .9 : BLOCK_HITBOX_RATIO;
    const w = bounds.w * ratio;
    const h = bounds.h * ratio;
    return {
      x: bounds.x + (bounds.w - w) / 2,
      y: bounds.y + (bounds.h - h) / 2,
      w,
      h
    };
  }

  function collect(item, now) {
    if (item.role === 'special') {
      if (isBadEffectBlocked(now) && (item.type === 'bomb' || item.type === 'dizzy')) {
        stopEatAnimation();
        burst(item.x + item.w / 2, item.y + item.h / 2, '#ffd93d');
        return;
      }
      const skipEatMotion = hasActiveSpecialEffect(now);
      if (!skipEatMotion) startEatAnimation(now, item.type);
      else stopEatAnimation();
      applySpecialEffect(item.type, now);
      playSfx(['star', 'heart', 'fairy'].includes(item.type) ? 'good' : 'bad');
      burst(item.x + item.w / 2, item.y + item.h / 2, SPECIAL_COLOR[item.type]?.glow || '#ffd93d');
      return;
    }
    if (item.type === 'bomb') {
      state.dino.frozenUntil = Math.max(state.dino.frozenUntil, now + 3000);
      burst(item.x + item.w / 2, item.y + item.h / 2, '#666');
      return;
    }
    const index = state.remaining.indexOf(item.value);
    if (index >= 0) {
      startEatAnimation(now);
      state.remaining.splice(index, 1);
      if (state.remaining.length) refreshEatenBlocks(item.value);
      burst(item.x + item.w / 2, item.y + item.h / 2, '#fff06b');
      playEatSfxThenSpeak(item.value);
      if (!state.remaining.length) {
        state.transitioning = true;
        state.dino.transitionInvincibleUntil = now + 500;
        clearTimeout(targetTransitionTimer);
        targetTransitionTimer = setTimeout(advanceTarget, 120);
      } else {
        renderRemaining();
      }
    } else {
      if (isBadEffectBlocked(now)) {
        burst(item.x + item.w / 2, item.y + item.h / 2, '#ffd93d');
        return;
      }
      startEatAnimation(now);
      state.health -= 1;
      renderHealth();
      playEatSfxThenSpeak(item.value);
      if (state.health <= 0) finishRest();
    }
  }

  function startEatAnimation(now, specialType = '') {
    if (!state?.running || state.mode !== 'play') return;
    state.dino.eatStartedAt = now;
    state.dino.eatSpecialType = specialType;
    // 일반 글자는 open → full → idle, 특수블록은 open 직후 바로 특수 상태 이미지로 이어진다.
    state.dino.eatUntil = now + (specialType ? 120 : 360);
  }

  function stopEatAnimation() {
    if (!state?.dino) return;
    state.dino.eatUntil = 0;
    state.dino.eatSpecialType = '';
  }

  function hasActiveSpecialEffect(now) {
    if (!state?.dino) return false;
    const d = state.dino;
    return now < d.frozenUntil || now < d.invincibleUntil || now < d.fairyUntil || now < d.reversedUntil;
  }

  function isStarActive(now) {
    return !!state?.dino && now < state.dino.invincibleUntil;
  }

  function isTransitionProtected(now) {
    return !!state?.dino && now < state.dino.transitionInvincibleUntil;
  }

  function isBadEffectBlocked(now) {
    return isStarActive(now) || isTransitionProtected(now);
  }

  function clearSpecialEffects() {
    if (!state) return;
    state.dino.boostedUntil = 0;
    state.dino.invincibleUntil = 0;
    state.dino.fairyUntil = 0;
    state.dino.frozenUntil = 0;
    state.dino.reversedUntil = 0;
  }

  function applySpecialEffect(type, now) {
    const starActive = isStarActive(now);
    if (starActive && type === 'heart') {
      state.health = Math.min(5, state.health + 1);
      renderHealth();
      return;
    }
    if (starActive && type === 'fairy') {
      state.dino.fairyUntil = now + 5000;
      return;
    }
    if (starActive && (type === 'bomb' || type === 'dizzy')) {
      // 별 무적 중에는 폭탄/어지러움 같은 불이익이 들어오지 않게 한다.
      if (type === 'heart') {
        state.health = Math.min(5, state.health + 1);
        renderHealth();
      }
      return;
    }
    clearSpecialEffects();
    if (type === 'star') {
      state.dino.invincibleUntil = now + 3000;
      state.dino.boostedUntil = now + 3000;
    } else if (type === 'heart') {
      state.health = Math.min(5, state.health + 1);
      renderHealth();
    } else if (type === 'fairy') {
      state.dino.fairyUntil = now + 5000;
    } else if (type === 'bomb') {
      state.dino.frozenUntil = now + 3000;
    } else if (type === 'dizzy') {
      state.dino.reversedUntil = now + 5000;
    }
  }

  function finishRest() {
    if (!state.running) return;
    state.running = false;
    cancelAnimationFrame(animationId);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    showScreen('restScreen');
    playSfx('fail');
  }

  function react(text, color) {
    // 플레이 중 번쩍이는 텍스트 팝업은 제거했다. 추후 효과음/비주얼 효과용 자리만 남긴다.
    clearTimeout(reactionTimer);
  }

  function burst(x, y, color) {
    for (let i = 0; i < 9; i++) {
      const angle = Math.PI * 2 * i / 9;
      state.particles.push({ x, y, vx: Math.cos(angle) * 80, vy: Math.sin(angle) * 80 - 30, life: .65, color });
    }
  }

  function draw(now) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    // 하늘, 구름, 먼 산, 잔디를 단순한 도형으로 그려 화면 크기에 자연스럽게 맞춘다.
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#72d7e7'); sky.addColorStop(1, '#c5f3e2');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    drawCloud(w * .18, h * .15, 1); drawCloud(w * .78, h * .3, .72);
    ctx.fillStyle = '#84c977';
    ctx.beginPath(); ctx.moveTo(0,h-62); ctx.quadraticCurveTo(w*.24,h-135,w*.48,h-62); ctx.quadraticCurveTo(w*.72,h-130,w,h-62); ctx.lineTo(w,h); ctx.lineTo(0,h); ctx.fill();
    ctx.fillStyle = '#48a858'; ctx.fillRect(0, h - 33, w, 33);
    state.items.forEach((item) => drawItem(item, now));
    state.particles.forEach((p) => { ctx.globalAlpha = Math.max(0, p.life * 1.5); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x,p.y,5,0,Math.PI*2); ctx.fill(); });
    ctx.globalAlpha = 1;
    drawDino(state.dino, now);
    drawDebugHitboxes();
  }

  function drawDebugHitboxes() {
    if (!DEBUG_HITBOX || !state) return;
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 0, 0, .9)';
    const dinoBox = getDinoHitbox(state.dino);
    ctx.strokeRect(dinoBox.x, dinoBox.y, dinoBox.w, dinoBox.h);
    ctx.strokeStyle = 'rgba(255, 80, 80, .55)';
    state.items.forEach((item) => {
      const box = getBlockHitbox(item);
      ctx.strokeRect(box.x, box.y, box.w, box.h);
    });
    ctx.restore();
  }

  function drawCloud(x, y, scale) {
    ctx.save(); ctx.translate(x,y); ctx.scale(scale,scale); ctx.fillStyle = '#ffffffaa';
    ctx.beginPath(); ctx.arc(-25,5,20,0,Math.PI*2); ctx.arc(0,-4,28,0,Math.PI*2); ctx.arc(29,5,21,0,Math.PI*2); ctx.fillRect(-25,5,54,20); ctx.fill(); ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  }

  function drawItem(item, now) {
    let x = item.x;
    let y = item.y + Math.sin(item.bob) * 2;
    if (item.type === 'heart') y += Math.sin(now / 210 + item.phase) * 18;
    const visual = getBlockVisualBounds(item, y);
    const centerX = visual.x + visual.w / 2;
    const centerY = visual.y + visual.h / 2;
    ctx.save();
    ctx.shadowColor = '#31545a55'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 4;
    if (item.type === 'jamo') {
      const fairyActive = item.role === 'correct' && state.dino.fairyUntil > now;
      if (fairyActive) {
        const pulse = 1.16 + Math.sin(now / 95 + item.phase) * .13;
        ctx.translate(centerX, centerY);
        ctx.scale(pulse, pulse);
        ctx.translate(-visual.w / 2, -visual.h / 2);
        drawCorrectSparkles(item, now, visual.w, visual.h);
        drawBlockImage('block', 0, 0, visual.w, visual.h, { glow: true });
        drawBlockLetter(item.value, visual.w / 2, visual.h / 2, Math.round(visual.w * .46), '#1d5f47');
        ctx.restore();
        return;
      }
      drawBlockImage('block', visual.x, visual.y, visual.w, visual.h);
      drawBlockLetter(item.value, centerX, centerY, Math.round(visual.w * .44), '#344c5c');
    } else {
      const color = SPECIAL_COLOR[item.type] || SPECIAL_COLOR.star;
      ctx.translate(centerX, centerY);
      if (item.type === 'dizzy') ctx.rotate(item.rotation);
      if (item.type === 'fairy') {
        const fairyPulse = 1.08 + Math.sin(now / 86 + item.phase) * .16;
        ctx.scale(fairyPulse, fairyPulse);
      } else if (item.type === 'heart') {
        const heartPulse = 1.04 + Math.sin(now / 78 + item.phase) * .08;
        ctx.scale(heartPulse, heartPulse);
      }
      ctx.shadowColor = color.glow;
      ctx.shadowBlur = item.type === 'bomb' ? 5 : 14;
      if (item.type === 'fairy') drawFairySparkles(item);
      drawBlockImage(item.type, -visual.w / 2, -visual.h / 2, visual.w, visual.h);
    }
    ctx.restore();
  }

  function drawBlockImage(type, x, y, w, h, options = {}) {
    const sprite = blockSprites[type] || blockSprites.block;
    if (sprite?.complete && sprite.naturalWidth) {
      if (options.glow) {
        ctx.save();
        ctx.filter = 'drop-shadow(0 0 6px rgba(80, 255, 170, .9)) drop-shadow(0 0 12px rgba(80, 255, 170, .6))';
      }
      ctx.drawImage(sprite, x, y, w, h);
      if (options.glow) ctx.restore();
      return;
    }
    const fallbackColor = type === 'block' ? '#fff4a8' : (SPECIAL_COLOR[type]?.fill || '#fff3ad');
    ctx.fillStyle = fallbackColor;
    roundRect(x, y, w, h, 10);
    ctx.fill();
  }

  function drawBlockLetter(value, x, y, size, color) {
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = color;
    ctx.font = `1000 ${size}px ${UI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(value, x, y);
  }

  function drawCorrectSparkles(item, now, w = item.w, h = item.h) {
    ctx.save();
    ctx.shadowColor = '#b8ffe2';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 8; i++) {
      const angle = now / 140 + item.phase + i * Math.PI / 4;
      const radius = Math.min(w, h) * .3 + Math.sin(now / 120 + i) * 5;
      ctx.beginPath();
      ctx.arc(w / 2 + Math.cos(angle) * radius, h / 2 + Math.sin(angle) * radius, i % 2 ? 2.5 : 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFairySparkles(item) {
    ctx.save();
    ctx.shadowColor = '#96ffd8';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 5; i++) {
      const angle = item.sparkle + i * Math.PI * .4;
      const radius = 24 + Math.sin(item.sparkle + i) * 5;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawDino(d, now) {
    const frozen = now < d.frozenUntil;
    const boosted = now < d.boostedUntil;
    const invincible = now < d.invincibleUntil;
    const reversed = now < d.reversedUntil;
    const eatElapsed = now - d.eatStartedAt;
    const eating = now < d.eatUntil;
    const spriteName = eating ? (eatElapsed < 120 ? 'open' : 'full') : getDinoSpriteName(d, now);
    const sprite = dinoSprites[spriteName] || dinoSprites.idle;
    ctx.save();
    const shake = frozen ? Math.sin(now / 24) * 7 : 0;
    const giantScale = invincible ? 1.5 : 1;
    const giantLift = invincible ? d.h * .23 : 0;
    const eatJump = eating ? Math.sin(Math.min(1, eatElapsed / 170) * Math.PI) * 7 : 0;
    ctx.translate(d.x + d.w/2 + shake, d.y + d.h/2 - giantLift - eatJump);
    if (invincible) drawDinoAura(now);
    const openPop = eating && eatElapsed < 120 ? 1.12 - Math.abs(eatElapsed - 60) / 60 * .12 : 1;
    const dinoScale = 1.225 * DINO_DRAW_SCALE * giantScale * openPop;
    // 원본 PNG의 기본 방향에 맞춰 좌/우 이동 방향과 시선 방향이 일치하도록 반전한다.
    ctx.scale(-d.facing * dinoScale, dinoScale);
    if (frozen) ctx.globalAlpha = .68;
    if (boosted || invincible) { ctx.shadowColor = '#ffd93d'; ctx.shadowBlur = 22; }
    if (sprite.complete && sprite.naturalWidth) {
      ctx.drawImage(sprite, -d.w / 2, -d.h / 2, d.w, d.h);
    } else {
      drawFallbackDino();
    }
    ctx.restore();
  }

  function getDinoSpriteName(d, now) {
    if (now < d.frozenUntil) return 'stun';
    if (now < d.invincibleUntil) return 'star';
    if (now < d.fairyUntil) return 'fairy';
    if (now < d.reversedUntil) return 'dizzy';
    return 'idle';
  }

  function drawFallbackDino() {
    ctx.fillStyle = '#55bd63'; ctx.beginPath(); ctx.ellipse(0, 8, 33, 25, 0, 0, Math.PI * 2); ctx.fill();
    roundRect(7, -28, 34, 39, 15); ctx.fill();
    ctx.fillStyle = '#b9ef85'; ctx.beginPath(); ctx.ellipse(5, 15, 16, 17, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(27, -14, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#273c45'; ctx.beginPath(); ctx.arc(29, -14, 3, 0, Math.PI * 2); ctx.fill();
  }

  function drawDinoAura(now) {
    ctx.save();
    ctx.globalAlpha = .72 + Math.sin(now / 120) * .16;
    ctx.strokeStyle = '#ffe66f';
    ctx.lineWidth = 5;
    ctx.shadowColor = '#ffd93d';
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.ellipse(0, 2, 74 + Math.sin(now / 150) * 5, 62 + Math.cos(now / 160) * 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#fff6a8';
    for (let i = 0; i < 7; i++) {
      const angle = now / 260 + i * Math.PI * 2 / 7;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * 74, Math.sin(angle) * 58, i % 2 ? 2.5 : 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function finishGame() {
    if (!state.running) return;
    state.running = false;
    cancelAnimationFrame(animationId);
    const stars = state.health === 5 ? 3 : state.health >= 3 ? 2 : 1;
    state.stars = stars;
    $('successWord').textContent = state.word;
    // 성공할 때마다 001.jpg~028.jpg 가운데 한 장을 새로 선택한다.
    const photoNumber = String(Math.floor(Math.random() * 28) + 1).padStart(3, '0');
    state.successPhoto = `images/kids/${photoNumber}.jpg`;
    loadSuccessPhoto(state.successPhoto);
    $('bragWord').textContent = state.word;
    $('bragStars').textContent = '★'.repeat(stars);
    [...$('starRow').children].forEach((star) => star.classList.remove('on'));
    showScreen('successScreen');
    playSfx('success');
    starTimers.forEach(clearTimeout); starTimers = [];
    for (let i = 0; i < stars; i++) {
      starTimers.push(setTimeout(() => {
        $('starRow').children[i].classList.add('on');
        playSfx('resultStar');
      }, 450 + i * 650));
    }
  }

  function loadSuccessPhoto(src) {
    const photo = $('successPhoto');
    const frame = photo.closest('.success-photo-frame');
    frame.classList.remove('loaded', 'error');
    photo.removeAttribute('src');
    photo.onload = () => {
      frame.classList.add('loaded');
      frame.classList.remove('error');
    };
    photo.onerror = (event) => {
      frame.classList.add('error');
      frame.classList.remove('loaded');
      console.error('성공 사진 로드 실패:', src, event);
    };
    photo.src = src;
  }

  function bindHold(button, direction) {
    const set = (value) => { controls[direction] = value; button.classList.toggle('pressed', value); };
    button.addEventListener('pointerdown', (e) => { e.preventDefault(); button.setPointerCapture(e.pointerId); set(true); });
    button.addEventListener('pointerup', () => set(false));
    button.addEventListener('pointercancel', () => set(false));
    button.addEventListener('lostpointercapture', () => set(false));
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function startTraceDraw(event) {
    if (!state || state.mode !== 'trace') return;
    event.preventDefault();
    canvas.setPointerCapture?.(event.pointerId);
    const point = canvasPoint(event);
    state.traceDrawing = true;
    state.traceLastPoint = point;
    state.traceStrokes.push([point]);
  }

  function moveTraceDraw(event) {
    if (!state || state.mode !== 'trace' || !state.traceDrawing) return;
    event.preventDefault();
    const point = canvasPoint(event);
    const last = state.traceLastPoint || point;
    const distance = Math.hypot(point.x - last.x, point.y - last.y);
    if (distance > 1.5) {
      state.traceLastPoint = point;
      state.traceStrokes[state.traceStrokes.length - 1].push(point);
    }
  }

  function endTraceDraw(event) {
    if (!state || state.mode !== 'trace') return;
    event.preventDefault();
    state.traceDrawing = false;
    state.traceLastPoint = null;
  }

  function returnToStart() {
    if (state) state.running = false;
    cancelAnimationFrame(animationId);
    clearTimeout(targetTransitionTimer);
    clearSpecialEffects();
    $('gameScreen').classList.remove('trace-mode');
    $('traceNextButton').classList.remove('show');
    $('traceNextButton').disabled = true;
    speechSequenceId += 1;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    controls.left = false; controls.right = false;
    showScreen('startScreen');
    stopBgm(true, () => startMainBgm(MAIN_BGM_FADE_IN_MS, true));
    $('wordInput').focus();
  }

  function openSoundSettings() {
    restoreDraftFromCommitted('all');
    updatePreferredVoice();
    showSoundSettingsView('soundMenuView');
    $('soundModal').classList.add('open');
    $('soundModal').setAttribute('aria-hidden', 'false');
  }

  function closeSoundSettings() {
    restoreDraftFromCommitted('all');
    stopBgmPreview(true);
    $('soundModal').classList.remove('open');
    $('soundModal').setAttribute('aria-hidden', 'true');
    $('soundSettingsButton').focus();
  }

  function showSoundSettingsView(id) {
    const previousViewId = getActiveSoundViewId();
    if (id === 'soundMenuView' && previousViewId !== 'soundMenuView') restoreDraftFromCommitted(previousViewId);
    else if (id !== 'soundMenuView') restoreDraftFromCommitted(id);
    if (id !== 'bgmView') stopBgmPreview(true);
    document.querySelectorAll('.sound-view').forEach((view) => view.classList.toggle('active', view.id === id));
    const titles = {
      soundMenuView: '🔊 소리 설정',
      volumeView: '볼륨 설정',
      bgmView: '배경음악 설정',
      ttsView: '글자 읽기 설정'
    };
    $('soundTitle').textContent = titles[id] || titles.soundMenuView;
  }

  const soundControlConfigs = {
    sfxVolume: { key: 'sfx', type: 'percent' },
    ttsVolume: { key: 'tts', type: 'percent' },
    bgmVolume: { key: 'bgm', type: 'percent' },
    ttsRate: { key: 'ttsRate', type: 'decimal' },
    ttsPitch: { key: 'ttsPitch', type: 'decimal' }
  };

  function formatSoundValue(value, type) {
    return type === 'percent' ? `${Math.round(value * 100)}%` : Number(value).toFixed(2);
  }

  function syncSoundControls() {
    Object.entries(soundControlConfigs).forEach(([id, config]) => {
      const slider = $(id);
      const output = $(`${id}Value`);
      if (!slider || !output) return;
      slider.value = config.type === 'percent' ? Math.round(draftSoundSettings[config.key] * 100) : draftSoundSettings[config.key];
      output.textContent = formatSoundValue(draftSoundSettings[config.key], config.type);
    });
  }

  function syncBgmChoiceControls() {
    document.querySelectorAll('input[name="bgmChoice"]').forEach((input) => {
      input.checked = input.value === draftSoundSettings.bgmChoice;
    });
  }

  function saveCurrentSoundView() {
    const viewId = getActiveSoundViewId();
    if (viewId === 'soundMenuView') {
      closeSoundSettings();
      return;
    }
    commitDraftSettings(viewId);
    showSoundSettingsView('soundMenuView');
  }

  function initializeSoundControls() {
    Object.entries(soundControlConfigs).forEach(([id, config]) => {
      const slider = $(id);
      const output = $(`${id}Value`);
      if (!slider || !output) return;
      slider.addEventListener('input', () => {
        draftSoundSettings[config.key] = config.type === 'percent' ? Number(slider.value) / 100 : Number(slider.value);
        output.textContent = formatSoundValue(draftSoundSettings[config.key], config.type);
        soundSettings[config.key] = draftSoundSettings[config.key];
        if (config.key === 'bgm') {
          updateBgmVolume();
          updateMainBgmVolume();
          if (bgmPreviewAudio) bgmPreviewAudio.volume = getBgmPreviewVolume();
        } else if (config.key === 'ttsRate' || config.key === 'ttsPitch') {
          updatePreferredVoice();
        }
      });
    });
    syncSoundControls();
    syncBgmChoiceControls();
    document.querySelector('.bgm-choice-list')?.addEventListener('click', (event) => {
      const label = event.target.closest('label');
      const input = label?.querySelector('input[name="bgmChoice"]');
      if (!input) return;
      event.preventDefault();
      selectBgmChoice(input.value);
      if (input.value === 'random') {
        stopBgmPreview(true);
        return;
      }
      toggleBgmPreview(input.value);
    });
    document.querySelectorAll('[data-sound-view]').forEach((button) => {
      button.addEventListener('click', () => showSoundSettingsView(button.dataset.soundView));
    });
  }

  $('startButton').addEventListener('click', startGame);
  $('wordInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') startGame(); });
  $('wordInput').addEventListener('input', (e) => { e.target.value = [...e.target.value].slice(0, 10).join(''); });
  document.querySelector('.difficulty-row')?.addEventListener('click', (event) => {
    if (event.target.closest('label, input')) playSfx('click');
  });
  $('homeFromSuccessButton').addEventListener('click', returnToStart);
  $('listenButton').addEventListener('click', speakCurrentTarget);
  $('playHomeButton').addEventListener('click', returnToStart);
  $('traceNextButton').addEventListener('click', goNextTrace);
  $('restartButton').addEventListener('click', restartPlayOnly);
  $('homeFromRestButton').addEventListener('click', returnToStart);
  $('homeButton').addEventListener('click', returnToStart);
  $('soundSettingsButton').addEventListener('click', (event) => {
    tryStartMainBgmFromInteraction(event);
    openSoundSettings();
  });
  $('closeSoundButton').addEventListener('click', closeSoundSettings);
  $('doneSoundButton').addEventListener('click', saveCurrentSoundView);
  $('soundModal').addEventListener('click', () => {});
  window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && $('soundModal').classList.contains('open')) closeSoundSettings(); });
  document.addEventListener('click', playButtonClickSfx, true);
  addMainBgmUnlockListeners();
  canvas.addEventListener('pointerdown', startTraceDraw);
  canvas.addEventListener('pointermove', moveTraceDraw);
  canvas.addEventListener('pointerup', endTraceDraw);
  canvas.addEventListener('pointercancel', endTraceDraw);
  canvas.addEventListener('lostpointercapture', endTraceDraw);
  bindHold($('leftButton'), 'left'); bindHold($('rightButton'), 'right');
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); controls[e.key === 'ArrowLeft' ? 'left' : 'right'] = true; }
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') controls[e.key === 'ArrowLeft' ? 'left' : 'right'] = false;
  });
  window.addEventListener('resize', () => {
    resizeCanvas();
    if ($('startScreen')?.classList.contains('active')) updateStartDinoMarchDistance();
  });
  document.addEventListener('visibilitychange', () => { if (state) state.lastTime = 0; });
  if ('speechSynthesis' in window) {
    updatePreferredVoice();
    if (window.speechSynthesis.addEventListener) {
      window.speechSynthesis.addEventListener('voiceschanged', updatePreferredVoice);
    } else {
      window.speechSynthesis.onvoiceschanged = updatePreferredVoice;
    }
  }
  initializeSoundControls();
  initializeTtsVoiceTester();
  shuffleStartDinoMarch();
  startMainBgm(0, true).then((played) => {
    if (!played) addMainBgmUnlockListeners();
  });
})();
