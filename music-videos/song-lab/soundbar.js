(() => {
  const audio = document.querySelector('#soundbar-audio');
  const canvas = document.querySelector('#soundbar-canvas');
  const toggle = document.querySelector('#soundbar-toggle');
  const stop = document.querySelector('#soundbar-stop');
  const title = document.querySelector('#soundbar-title');
  const status = document.querySelector('#soundbar-status');
  const time = document.querySelector('#soundbar-time');
  const trackLinks = [...document.querySelectorAll('.lcars-record > a')];
  const sourceStyleLinks = [...document.querySelectorAll('.style-link-grid a[data-track-id]')];
  const audioRoot = '../../project-files/yesterdays-son/audio/song-lab/';
  const availableTracks = {
    '0454d711-c82f-408e-bcd4-b30da14a9fb1': '0454d711-c82f-408e-bcd4-b30da14a9fb1.mp3',
    '0ce75703-bd26-48d9-b622-61d0336093af': '0ce75703-bd26-48d9-b622-61d0336093af.mp3',
    '1cadffbf-f43b-4ae4-8bcf-122f31eb9a85': '1cadffbf-f43b-4ae4-8bcf-122f31eb9a85.mp3',
    '50f735b7-4fcb-4e97-8a86-474b99a2434e': '50f735b7-4fcb-4e97-8a86-474b99a2434e.mp3',
    '564e4cde-7f50-44b6-a226-653d9a62eb91': '0ce75703-bd26-48d9-b622-61d0336093af.mp3',
    '6ecabe44-8bc0-4513-ab59-d6454d07150b': '6ecabe44-8bc0-4513-ab59-d6454d07150b.mp3',
    '73eaccd3-f345-48b7-83f7-26586d4faeb6': '73eaccd3-f345-48b7-83f7-26586d4faeb6.mp3',
    '8409bcf3-ffb0-4e78-a269-daef9ab4e214': '8409bcf3-ffb0-4e78-a269-daef9ab4e214.mp3',
    '85398936-f25a-47c4-b0e3-7e9f7c1f5d1a': '85398936-f25a-47c4-b0e3-7e9f7c1f5d1a.mp3',
    '8952118d-423d-48d6-b78f-2921fb658a8c': '8952118d-423d-48d6-b78f-2921fb658a8c.mp3',
    '9c344cd6-f457-4e25-bf4c-47a5de25312e': '9c344cd6-f457-4e25-bf4c-47a5de25312e.mp3',
    'a6b9100e-290f-4e9d-a678-48939002893b': 'a6b9100e-290f-4e9d-a678-48939002893b.mp3',
    'd5f091a3-642f-4c12-aa86-53972acba91a': 'd5f091a3-642f-4c12-aa86-53972acba91a.mp3'
  };
  const substitutions = {
    '1cadffbf-f43b-4ae4-8bcf-122f31eb9a85': 'One Lonely Guy (Remix)',
    '564e4cde-7f50-44b6-a226-653d9a62eb91': 'A Lonely Borg Guy',
    '6ecabe44-8bc0-4513-ab59-d6454d07150b': "Orion's Baby Daddy (1.21x)",
    '8952118d-423d-48d6-b78f-2921fb658a8c': 'Men in Flight — Rockabilly Circuit Jive',
    'd5f091a3-642f-4c12-aa86-53972acba91a': 'Men in Flight — Cyber Sax Transmission'
  };
  const context = canvas.getContext('2d');
  let audioContext;
  let analyser;
  let source;
  let frequencyData;
  let waveformData;
  let frame;
  let activeLink;
  let stopped = false;

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  const resizeCanvas = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  };

  const draw = () => {
    cancelAnimationFrame(frame);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const middle = height / 2;
    context.clearRect(0, 0, width, height);

    if (analyser) {
      analyser.getByteFrequencyData(frequencyData);
      analyser.getByteTimeDomainData(waveformData);
    }

    const barCount = Math.max(32, Math.floor(width / 16));
    const spacing = width / barCount;
    context.fillStyle = '#35bff4';
    for (let index = 0; index < barCount; index += 1) {
      const sampleIndex = Math.floor(index * (frequencyData ? frequencyData.length : barCount) / barCount);
      const sample = frequencyData ? frequencyData[sampleIndex] / 255 : 0.08 + Math.abs(Math.sin(index * 0.72)) * 0.08;
      const barHeight = Math.max(8, sample * height * 0.82);
      context.fillRect(Math.round(index * spacing + spacing * 0.38), middle - barHeight / 2, Math.max(2, spacing * 0.18), barHeight);
    }

    context.beginPath();
    context.strokeStyle = '#fff04a';
    context.lineWidth = 1.25;
    const points = waveformData ? waveformData.length : 96;
    for (let index = 0; index < points; index += 1) {
      const x = index * width / Math.max(1, points - 1);
      const normalized = waveformData ? (waveformData[index] - 128) / 128 : Math.sin(index * 0.32) * 0.025;
      const y = middle + normalized * height * 0.46;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();

    if (!audio.paused && !audio.ended) frame = requestAnimationFrame(draw);
  };

  const prepareAnalyser = async () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.78;
      frequencyData = new Uint8Array(analyser.frequencyBinCount);
      waveformData = new Uint8Array(analyser.fftSize);
      source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
    }
    if (audioContext.state === 'suspended') await audioContext.resume();
  };

  const updateControls = () => {
    const playing = !audio.paused && !audio.ended;
    toggle.textContent = playing ? 'PAUSE' : 'PLAY';
    status.textContent = playing ? activeLink?.dataset.isAlt === 'true' ? 'NOW PLAYING · ALT' : 'NOW PLAYING' : activeLink ? stopped ? 'TRACK STOPPED' : 'TRACK PAUSED' : 'AUDIO READY';
    trackLinks.forEach((link) => {
      if (link.classList.contains('is-audio-missing')) return;
      const selected = link === activeLink;
      link.textContent = selected && playing ? 'STOP AUDIO' : 'PLAY AUDIO';
      link.closest('.lcars-record').classList.toggle('is-playing', selected && playing);
      link.setAttribute('aria-pressed', String(selected && playing));
    });
    stop.disabled = !activeLink;
  };

  const stopPlayback = () => {
    if (!activeLink) return;
    stopped = true;
    audio.pause();
    audio.currentTime = 0;
    time.textContent = `00:00 / ${formatTime(audio.duration)}`;
    updateControls();
    draw();
  };

  const selectTrack = async (link) => {
    const record = link.closest('.lcars-record');
    const registerTitle = record.querySelector('h3').textContent.trim();
    const nextTitle = substitutions[link.dataset.trackId] ? `${registerTitle} · ALT: ${substitutions[link.dataset.trackId]}` : registerTitle;
    if (activeLink === link) {
      if (audio.paused) {
        await prepareAnalyser();
        await audio.play();
      } else stopPlayback();
      return;
    }

    activeLink = link;
    stopped = false;
    title.textContent = nextTitle;
    audio.src = link.href;
    toggle.disabled = false;
    await prepareAnalyser();
    await audio.play();
  };

  trackLinks.forEach((link) => {
    const songId = link.dataset.trackId;
    link.removeAttribute('target');
    link.removeAttribute('rel');
    if (!availableTracks[songId]) {
      link.removeAttribute('href');
      link.textContent = 'AUDIO NEEDED';
      link.classList.add('is-audio-missing');
      link.setAttribute('aria-disabled', 'true');
      return;
    }
    link.href = `${audioRoot}${availableTracks[songId]}`;
    if (substitutions[songId]) {
      link.dataset.isAlt = 'true';
      const type = link.closest('.lcars-record').querySelector('.record-status');
      if (type && !type.textContent.trim().startsWith('ALT ')) type.textContent = `ALT ${type.textContent.trim()}`;
    }
    link.textContent = 'PLAY AUDIO';
    link.setAttribute('role', 'button');
    link.setAttribute('aria-pressed', 'false');
    link.addEventListener('click', (event) => {
      event.preventDefault();
      selectTrack(link).catch(() => {
        status.textContent = 'AUDIO UNAVAILABLE';
      });
    });
  });

  sourceStyleLinks.forEach((link) => {
    const songId = link.dataset.trackId;
    const matchingTrack = trackLinks.find((trackLink) => trackLink.dataset.trackId === songId);
    if (availableTracks[songId] && matchingTrack) {
      link.href = `${audioRoot}${availableTracks[songId]}`;
      const note = link.querySelector('small');
      if (note) note.textContent = `${note.textContent} · PLAY IN SOUNDBAR`;
      link.addEventListener('click', (event) => {
        event.preventDefault();
        selectTrack(matchingTrack).catch(() => {
          status.textContent = 'AUDIO UNAVAILABLE';
        });
      });
      return;
    }
    link.removeAttribute('href');
    link.classList.add('is-audio-missing');
    link.setAttribute('aria-disabled', 'true');
    const note = link.querySelector('small');
    if (note) note.textContent = `${note.textContent} · AUDIO FILE NEEDED`;
  });

  toggle.addEventListener('click', () => {
    if (!activeLink) return;
    if (audio.paused) {
      prepareAnalyser().then(() => audio.play()).catch(() => {
        status.textContent = 'AUDIO UNAVAILABLE';
      });
    } else audio.pause();
  });

  stop.addEventListener('click', stopPlayback);

  audio.addEventListener('play', () => {
    stopped = false;
    updateControls();
    draw();
  });
  audio.addEventListener('pause', updateControls);
  audio.addEventListener('ended', () => {
    stopPlayback();
  });
  audio.addEventListener('timeupdate', () => {
    time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
  });
  audio.addEventListener('loadedmetadata', () => {
    time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
  });
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  updateControls();
})();
