    // Trusted Types policy for controlled innerHTML assignments
    const ttPolicy = (typeof window.trustedTypes !== 'undefined' && window.trustedTypes.createPolicy)
      ? window.trustedTypes.createPolicy('oscilloscope-template', {
          createHTML: (s) => s
        })
      : { createHTML: (s) => s };

    const canvas = document.getElementById('scope');
    const g = canvas.getContext('2d');

    const ui = {
      status: document.getElementById('status'),
      startStop: document.getElementById('startStop'),
      mute: document.getElementById('mute'),
      freeze: document.getElementById('freeze'),
      sourceMode: document.getElementById('sourceMode'),
      legendA: document.getElementById('legendA'),
      legendB: document.getElementById('legendB'),
      sineFreq: document.getElementById('sineFreq'),
      sineAmp: document.getElementById('sineAmp'),
      sawFreq: document.getElementById('sawFreq'),
      sawAmp: document.getElementById('sawAmp'),
      wavFile: document.getElementById('wavFile'),
      wavInfo: document.getElementById('wavInfo'),
      wavPos: document.getElementById('wavPos'),
      followPlayback: document.getElementById('followPlayback'),
      loopWav: document.getElementById('loopWav'),
      zoomMs: document.getElementById('zoomMs'),
      vScale: document.getElementById('vScale'),
      smooth: document.getElementById('smooth'),
      syncMode: document.getElementById('syncMode'),
      triggerSource: document.getElementById('triggerSource'),
      triggerLevel: document.getElementById('triggerLevel'),
      masterVol: document.getElementById('masterVol'),
      fps: document.getElementById('fps'),
      sineFreqOut: document.getElementById('sineFreqOut'),
      sineAmpOut: document.getElementById('sineAmpOut'),
      sawFreqOut: document.getElementById('sawFreqOut'),
      sawAmpOut: document.getElementById('sawAmpOut'),
      wavPosOut: document.getElementById('wavPosOut'),
      zoomOut: document.getElementById('zoomOut'),
      vScaleOut: document.getElementById('vScaleOut'),
      smoothOut: document.getElementById('smoothOut'),
      triggerOut: document.getElementById('triggerOut'),
      masterOut: document.getElementById('masterOut'),
      fpsOut: document.getElementById('fpsOut')
    };

    const FFT_SIZE = 32768;

    let audio = null;
    let master = null;

    let oscSine = null;
    let oscSaw = null;
    let gainSine = null;
    let gainSaw = null;
    let analyserSine = null;
    let analyserSaw = null;

    let wavBuffer = null;
    let wavFileName = '';
    let wavSource = null;
    let wavPlaying = false;
    let wavStartTime = 0;
    let wavStartOffset = 0;

    let bufA = new Float32Array(FFT_SIZE);
    let bufB = new Float32Array(FFT_SIZE);
    let shownA = new Float32Array(1);
    let shownB = new Float32Array(1);

    let firstFrame = true;
    let frozen = false;
    let muted = false;
    let lastPaint = 0;
    let freeRunOffset = 0;

    function number(value) {
      return Number.parseFloat(value);
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function formatTime(seconds) {
      if (!Number.isFinite(seconds)) return '—';
      const totalMs = Math.max(0, Math.round(seconds * 1000));
      const minutes = Math.floor(totalMs / 60000);
      const secs = Math.floor((totalMs % 60000) / 1000);
      const ms = totalMs % 1000;
      return `${minutes}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
    }

    function resizeCanvas() {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);

      const width = Math.max(2, Math.floor(rect.width));
      shownA = new Float32Array(width);
      shownB = new Float32Array(width);
      firstFrame = true;
    }

    function isDemoMode() {
      return ui.sourceMode.value === 'demo';
    }

    function isDemoRunning() {
      return !!(oscSine && oscSaw);
    }

    function updateLegend() {
      const triggerOptions = ui.triggerSource.options;

      if (isDemoMode()) {
        ui.legendA.textContent = 'Sínus';
        ui.legendB.textContent = 'Píla';
        triggerOptions[0].textContent = 'Sínus';
        triggerOptions[1].textContent = 'Píla';
      } else {
        const mono = !wavBuffer || wavBuffer.numberOfChannels < 2;
        ui.legendA.textContent = mono ? 'WAV mono / L' : 'WAV L';
        ui.legendB.textContent = mono ? 'WAV mono kópia' : 'WAV R';
        triggerOptions[0].textContent = mono ? 'WAV mono / L' : 'WAV L';
        triggerOptions[1].textContent = mono ? 'WAV mono kópia' : 'WAV R';
      }
    }

    function updateStartButton() {
      if (isDemoMode()) {
        ui.startStop.textContent = isDemoRunning() ? 'Zastaviť demo' : 'Spustiť demo';
      } else {
        ui.startStop.textContent = wavPlaying ? 'Pozastaviť WAV' : 'Prehrať WAV';
      }
    }

    function currentWavPositionSec() {
      if (!wavBuffer) return 0;

      if (wavPlaying && audio) {
        let pos = wavStartOffset + (audio.currentTime - wavStartTime);
        if (ui.loopWav.checked && wavBuffer.duration > 0) {
          pos %= wavBuffer.duration;
        }
        return clamp(pos, 0, wavBuffer.duration);
      }

      return clamp(wavStartOffset, 0, wavBuffer.duration);
    }

    function updateWavPositionUI(forceSlider = false) {
      if (!wavBuffer) {
        ui.wavPosOut.textContent = '—';
        return;
      }

      const pos = currentWavPositionSec();
      ui.wavPosOut.textContent = `${formatTime(pos)} / ${formatTime(wavBuffer.duration)}`;

      if (forceSlider || document.activeElement !== ui.wavPos || wavPlaying) {
        ui.wavPos.value = String(Math.round(pos * 1000));
      }
    }

    function updateWavInfo(message = '') {
      if (message) {
        ui.wavInfo.textContent = message;
        return;
      }

      if (!wavBuffer) {
        ui.wavInfo.textContent = 'Zatiaľ nie je nahratý žiadny súbor.';
        return;
      }

      const channels = wavBuffer.numberOfChannels === 1 ? 'mono' : `${wavBuffer.numberOfChannels} kanály`;
      ui.wavInfo.textContent = `${wavFileName} · ${channels} · ${wavBuffer.sampleRate.toLocaleString('sk-SK')} Hz · ${formatTime(wavBuffer.duration)}`;
    }

    function updateLabels() {
      ui.sineFreqOut.textContent = `${ui.sineFreq.value} Hz`;
      ui.sineAmpOut.textContent = Number(ui.sineAmp.value).toFixed(2);
      ui.sawFreqOut.textContent = `${ui.sawFreq.value} Hz`;
      ui.sawAmpOut.textContent = Number(ui.sawAmp.value).toFixed(2);
      ui.zoomOut.textContent = `${ui.zoomMs.value} ms`;
      ui.vScaleOut.textContent = `${Number(ui.vScale.value).toFixed(2)}×`;
      ui.smoothOut.textContent = Number(ui.smooth.value).toFixed(2);
      ui.triggerOut.textContent = Number(ui.triggerLevel.value).toFixed(2);
      ui.masterOut.textContent = Number(ui.masterVol.value).toFixed(2);
      ui.fpsOut.textContent = `${ui.fps.value} fps`;
      updateWavPositionUI();
      updateWavInfo();
      updateLegend();
      updateStartButton();
    }

    function updateStatus() {
      const sampleRate = audio?.sampleRate || wavBuffer?.sampleRate || 48000;
      const audioState = isDemoRunning() ? 'demo hrá' : wavPlaying ? 'WAV hrá' : audio ? 'pripravené' : 'vypnuté';
      const sourceLabel = isDemoMode() ? 'demo oscilátory' : wavBuffer ? 'WAV/audio buffer' : 'WAV bez súboru';
      const wavLine = wavBuffer ? `<br>WAV: ${formatTime(currentWavPositionSec())} / ${formatTime(wavBuffer.duration)}` : '';
      ui.status.innerHTML = ttPolicy.createHTML(`Audio: ${audioState}<br>Vzorkovanie: ${sampleRate.toLocaleString('sk-SK')} Hz<br>Zdroj: ${sourceLabel}${wavLine}`);
    }

    function updatePanelState() {
      document.querySelectorAll('.demo-only').forEach((el) => el.classList.toggle('is-muted', !isDemoMode()));
      document.querySelectorAll('.wav-only').forEach((el) => el.classList.toggle('is-muted', isDemoMode()));
    }

    function updateAudioParams() {
      updateLabels();
      updatePanelState();
      updateStatus();
      if (!audio) return;

      const now = audio.currentTime;
      const timeConstant = 0.015;

      oscSine?.frequency.setTargetAtTime(number(ui.sineFreq.value), now, timeConstant);
      oscSaw?.frequency.setTargetAtTime(number(ui.sawFreq.value), now, timeConstant);
      gainSine?.gain.setTargetAtTime(number(ui.sineAmp.value), now, timeConstant);
      gainSaw?.gain.setTargetAtTime(number(ui.sawAmp.value), now, timeConstant);
      master?.gain.setTargetAtTime(muted ? 0 : number(ui.masterVol.value), now, timeConstant);
      if (wavSource) wavSource.loop = ui.loopWav.checked;
    }

    async function ensureAudio() {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();

      if (!master) {
        master = audio.createGain();
        master.gain.value = muted ? 0 : number(ui.masterVol.value);
        master.connect(audio.destination);
      }

      updateAudioParams();
      return audio;
    }

    async function startDemo() {
      await ensureAudio();
      await audio.resume();
      pauseWav();
      if (isDemoRunning()) return;

      oscSine = audio.createOscillator();
      oscSaw = audio.createOscillator();
      gainSine = audio.createGain();
      gainSaw = audio.createGain();
      analyserSine = audio.createAnalyser();
      analyserSaw = audio.createAnalyser();

      analyserSine.fftSize = FFT_SIZE;
      analyserSaw.fftSize = FFT_SIZE;
      analyserSine.smoothingTimeConstant = 0;
      analyserSaw.smoothingTimeConstant = 0;

      oscSine.type = 'sine';
      oscSaw.type = 'sawtooth';
      oscSine.frequency.value = number(ui.sineFreq.value);
      oscSaw.frequency.value = number(ui.sawFreq.value);
      gainSine.gain.value = number(ui.sineAmp.value);
      gainSaw.gain.value = number(ui.sawAmp.value);

      oscSine.connect(gainSine);
      gainSine.connect(analyserSine);
      analyserSine.connect(master);

      oscSaw.connect(gainSaw);
      gainSaw.connect(analyserSaw);
      analyserSaw.connect(master);

      oscSine.start();
      oscSaw.start();

      firstFrame = true;
      updateAudioParams();
    }

    function stopDemo() {
      for (const node of [oscSine, oscSaw]) {
        try { node?.stop(); } catch (_) {}
      }
      for (const node of [oscSine, oscSaw, gainSine, gainSaw, analyserSine, analyserSaw]) {
        try { node?.disconnect(); } catch (_) {}
      }
      oscSine = oscSaw = gainSine = gainSaw = analyserSine = analyserSaw = null;
      firstFrame = true;
      updateAudioParams();
    }

    function pauseWav() {
      if (!wavPlaying && !wavSource) return;

      const pos = currentWavPositionSec();
      if (wavSource) {
        try { wavSource.onended = null; } catch (_) {}
        try { wavSource.stop(); } catch (_) {}
        try { wavSource.disconnect(); } catch (_) {}
      }

      wavSource = null;
      wavPlaying = false;
      wavStartOffset = pos;
      firstFrame = true;
      updateAudioParams();
    }

    async function playWav() {
      if (!wavBuffer) {
        ui.sourceMode.value = 'wav';
        updateAudioParams();
        updateWavInfo('Najprv vyber WAV alebo iný audio súbor.');
        return;
      }

      await ensureAudio();
      await audio.resume();
      stopDemo();

      if (wavPlaying) return;
      if (wavStartOffset >= wavBuffer.duration - 0.001) wavStartOffset = 0;

      const source = audio.createBufferSource();
      source.buffer = wavBuffer;
      source.loop = ui.loopWav.checked;
      source.connect(master);
      wavSource = source;
      wavStartTime = audio.currentTime;
      wavPlaying = true;

      source.onended = () => {
        if (wavSource !== source || ui.loopWav.checked) return;
        wavSource = null;
        wavPlaying = false;
        wavStartOffset = wavBuffer?.duration || 0;
        firstFrame = true;
        updateAudioParams();
      };

      try {
        source.start(0, wavStartOffset);
      } catch (_) {
        wavStartOffset = 0;
        source.start(0, 0);
      }

      firstFrame = true;
      updateAudioParams();
    }

    async function seekWav(seconds) {
      if (!wavBuffer) return;
      const wasPlaying = wavPlaying;

      if (wavSource) {
        try { wavSource.onended = null; } catch (_) {}
        try { wavSource.stop(); } catch (_) {}
        try { wavSource.disconnect(); } catch (_) {}
        wavSource = null;
      }

      wavPlaying = false;
      wavStartOffset = clamp(seconds, 0, wavBuffer.duration);
      firstFrame = true;
      updateWavPositionUI(true);
      updateAudioParams();

      if (wasPlaying) await playWav();
    }

    async function loadWavFile(file) {
      if (!file) return;

      try {
        updateWavInfo('Dekódujem audio súbor…');
        ui.sourceMode.value = 'wav';
        updatePanelState();
        stopDemo();
        pauseWav();
        await ensureAudio();

        const arrayBuffer = await file.arrayBuffer();
        wavBuffer = await audio.decodeAudioData(arrayBuffer);
        wavFileName = file.name;
        wavStartOffset = 0;
        ui.wavPos.max = String(Math.max(1, Math.round(wavBuffer.duration * 1000)));
        ui.wavPos.value = '0';

        firstFrame = true;
        updateAudioParams();
      } catch (error) {
        console.error(error);
        wavBuffer = null;
        wavFileName = '';
        wavStartOffset = 0;
        ui.wavPos.max = '1';
        ui.wavPos.value = '0';
        updateWavInfo('Súbor sa nepodarilo dekódovať. Skús WAV, MP3 alebo iný formát podporovaný prehliadačom.');
        updateAudioParams();
      }
    }

    function findRisingTrigger(data, samplesToShow, startHint = 0) {
      const threshold = number(ui.triggerLevel.value);
      const maxStart = Math.max(0, data.length - samplesToShow - 2);
      const start = clamp(Math.floor(startHint), 0, maxStart);
      const searchSpan = Math.max(256, Math.min(maxStart - start, samplesToShow * 4));
      const searchEnd = Math.min(maxStart, start + searchSpan);

      for (let i = Math.max(1, start); i < searchEnd; i++) {
        if (data[i - 1] < threshold && data[i] >= threshold) return i;
      }

      return start;
    }

    function drawGrid(width, height, sampleRate, samplesToShow, modeText) {
      g.clearRect(0, 0, width, height);
      g.fillStyle = '#050912';
      g.fillRect(0, 0, width, height);

      g.save();
      g.strokeStyle = 'rgba(255,255,255,.085)';
      g.lineWidth = 1;

      const vDivs = 10;
      const hDivs = 8;
      for (let i = 0; i <= vDivs; i++) {
        const x = Math.round((width / vDivs) * i) + 0.5;
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x, height);
        g.stroke();
      }
      for (let i = 0; i <= hDivs; i++) {
        const y = Math.round((height / hDivs) * i) + 0.5;
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(width, y);
        g.stroke();
      }

      g.strokeStyle = 'rgba(255,255,255,.2)';
      g.beginPath();
      g.moveTo(0, Math.round(height / 2) + 0.5);
      g.lineTo(width, Math.round(height / 2) + 0.5);
      g.stroke();

      g.strokeStyle = 'rgba(142,230,111,.26)';
      g.beginPath();
      g.moveTo(Math.round(width / 2) + 0.5, 0);
      g.lineTo(Math.round(width / 2) + 0.5, height);
      g.stroke();

      const triggerY = height / 2 - number(ui.triggerLevel.value) * number(ui.vScale.value) * height * 0.39;
      if (triggerY > 0 && triggerY < height) {
        g.setLineDash([5, 7]);
        g.strokeStyle = 'rgba(142,230,111,.23)';
        g.beginPath();
        g.moveTo(0, Math.round(triggerY) + 0.5);
        g.lineTo(width, Math.round(triggerY) + 0.5);
        g.stroke();
        g.setLineDash([]);
      }

      const msVisible = samplesToShow / sampleRate * 1000;
      const msPerDiv = msVisible / vDivs;
      g.fillStyle = 'rgba(237,242,255,.66)';
      g.font = '12px ui-sans-serif, system-ui, sans-serif';
      g.fillText(`${modeText} · ${msVisible.toFixed(msVisible < 10 ? 2 : 1)} ms celkom  ·  ${msPerDiv.toFixed(msPerDiv < 1 ? 2 : 1)} ms/div`, 14, height - 16);
      g.restore();
    }

    function sampleAt(data, index, wrap) {
      const len = data.length;
      if (len === 0) return 0;
      let i = index;
      if (wrap) {
        i = ((i % len) + len) % len;
      } else if (i < 0 || i >= len) {
        return 0;
      }
      return data[i];
    }

    function sampleIntoDisplay(data, start, samplesToShow, targetArray, height, wrap = false) {
      const width = targetArray.length;
      const verticalScale = number(ui.vScale.value);
      const smooth = number(ui.smooth.value);
      const mid = height / 2;
      const yScale = height * 0.39;

      for (let x = 0; x < width; x++) {
        const pos = start + (x / Math.max(1, width - 1)) * (samplesToShow - 1);
        const i0 = Math.floor(pos);
        const i1 = i0 + 1;
        const frac = pos - i0;
        let v = sampleAt(data, i0, wrap) * (1 - frac) + sampleAt(data, i1, wrap) * frac;
        v = Math.max(-1.6, Math.min(1.6, v * verticalScale));
        const y = mid - v * yScale;

        targetArray[x] = firstFrame ? y : (targetArray[x] * smooth + y * (1 - smooth));
      }
    }

    function setFlatDisplay(targetArray, height) {
      const mid = height / 2;
      for (let i = 0; i < targetArray.length; i++) {
        targetArray[i] = firstFrame ? mid : targetArray[i] * number(ui.smooth.value) + mid * (1 - number(ui.smooth.value));
      }
    }

    function strokeTrace(points, color, height) {
      g.save();
      g.lineWidth = 2;
      g.strokeStyle = color;
      g.shadowColor = color;
      g.shadowBlur = 10;
      g.beginPath();
      for (let x = 0; x < points.length; x++) {
        const y = Math.max(-20, Math.min(height + 20, points[x]));
        if (x === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();

      g.shadowBlur = 0;
      g.globalAlpha = 0.38;
      g.lineWidth = 1;
      g.stroke();
      g.restore();
    }

    function drawMessage(width, height, text) {
      g.save();
      g.fillStyle = 'rgba(237,242,255,.76)';
      g.font = '15px ui-sans-serif, system-ui, sans-serif';
      g.textAlign = 'center';
      g.fillText(text, width / 2, height / 2 - 18);
      g.restore();
    }

    function makeFallbackSignal(type, freq, amp, sampleRate) {
      const out = type === 'sine' ? bufA : bufB;
      const omega = 2 * Math.PI * freq / sampleRate;
      for (let i = 0; i < out.length; i++) {
        const phase = i * omega;
        if (type === 'sine') out[i] = Math.sin(phase) * amp;
        else {
          const cycle = (phase / (2 * Math.PI)) % 1;
          out[i] = (2 * cycle - 1) * amp;
        }
      }
    }

    function getModeText() {
      if (isDemoMode()) return isDemoRunning() ? 'demo / analyser' : 'demo / náhľad bez audia';
      if (!wavBuffer) return 'WAV / čaká na súbor';
      return wavPlaying ? 'WAV / prehrávanie' : 'WAV / statické okno';
    }

    function paint(timestamp) {
      requestAnimationFrame(paint);

      const fpsMs = 1000 / number(ui.fps.value);
      if (timestamp - lastPaint < fpsMs) return;
      lastPaint = timestamp;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      let sampleRate = audio?.sampleRate || 48000;
      if (!isDemoMode() && wavBuffer) sampleRate = wavBuffer.sampleRate;

      const maxSamples = isDemoMode() ? FFT_SIZE - 4 : Math.max(32, wavBuffer?.length || FFT_SIZE);
      const samplesToShow = Math.min(maxSamples, Math.max(32, Math.round(sampleRate * number(ui.zoomMs.value) / 1000)));

      drawGrid(width, height, sampleRate, samplesToShow, getModeText());

      if (!frozen) {
        if (!isDemoMode()) {
          if (!wavBuffer) {
            setFlatDisplay(shownA, height);
            setFlatDisplay(shownB, height);
            drawMessage(width, height, 'Vyber WAV/audio súbor a potom klikni na „Prehrať WAV"');
          } else {
            const chA = wavBuffer.getChannelData(0);
            const chB = wavBuffer.numberOfChannels > 1 ? wavBuffer.getChannelData(1) : chA;
            const posSec = ui.followPlayback.checked && wavPlaying ? currentWavPositionSec() : wavStartOffset;
            const maxStart = Math.max(0, wavBuffer.length - samplesToShow - 2);
            let baseStart = clamp(Math.floor(posSec * wavBuffer.sampleRate), 0, maxStart);
            let startA = baseStart;
            let startB = baseStart;

            if (ui.syncMode.value === 'common') {
              const triggerData = ui.triggerSource.value === 'b' ? chB : chA;
              const start = findRisingTrigger(triggerData, samplesToShow, baseStart);
              startA = startB = start;
            } else if (ui.syncMode.value === 'perTrace') {
              startA = findRisingTrigger(chA, samplesToShow, baseStart);
              startB = findRisingTrigger(chB, samplesToShow, baseStart);
            }

            sampleIntoDisplay(chA, startA, samplesToShow, shownA, height, ui.loopWav.checked);
            sampleIntoDisplay(chB, startB, samplesToShow, shownB, height, ui.loopWav.checked);
            firstFrame = false;
            updateWavPositionUI();
          }
        } else {
          if (analyserSine && analyserSaw) {
            analyserSine.getFloatTimeDomainData(bufA);
            analyserSaw.getFloatTimeDomainData(bufB);
          } else {
            makeFallbackSignal('sine', number(ui.sineFreq.value), number(ui.sineAmp.value), sampleRate);
            makeFallbackSignal('saw', number(ui.sawFreq.value), number(ui.sawAmp.value), sampleRate);
          }

          const maxStart = Math.max(0, FFT_SIZE - samplesToShow - 2);
          let startA = 0;
          let startB = 0;

          if (ui.syncMode.value === 'free') {
            freeRunOffset = (freeRunOffset + Math.max(1, Math.floor(samplesToShow / 120))) % Math.max(1, maxStart);
            startA = startB = freeRunOffset;
          } else if (ui.syncMode.value === 'perTrace') {
            startA = findRisingTrigger(bufA, samplesToShow, 0);
            startB = findRisingTrigger(bufB, samplesToShow, 0);
          } else {
            const triggerBuffer = ui.triggerSource.value === 'b' ? bufB : bufA;
            const start = findRisingTrigger(triggerBuffer, samplesToShow, 0);
            startA = startB = start;
          }

          startA = clamp(startA, 0, maxStart);
          startB = clamp(startB, 0, maxStart);

          sampleIntoDisplay(bufA, startA, samplesToShow, shownA, height);
          sampleIntoDisplay(bufB, startB, samplesToShow, shownB, height);
          firstFrame = false;
        }
      }

      strokeTrace(shownA, getComputedStyle(document.documentElement).getPropertyValue('--trace-a').trim(), height);
      strokeTrace(shownB, getComputedStyle(document.documentElement).getPropertyValue('--trace-b').trim(), height);

      g.save();
      g.fillStyle = 'rgba(237,242,255,.72)';
      g.font = '12px ui-sans-serif, system-ui, sans-serif';
      const triggerLabel = ui.triggerSource.value === 'b' ? ui.legendB.textContent : ui.legendA.textContent;
      const modeLabel = ui.syncMode.value === 'common' ? `common trigger: ${triggerLabel}` : ui.syncMode.value;
      g.fillText(`sync: ${modeLabel}  ·  level: ${Number(ui.triggerLevel.value).toFixed(2)}  ·  stabilizácia: ${Number(ui.smooth.value).toFixed(2)}`, 14, 22);
      if (frozen) {
        g.fillStyle = 'rgba(255,104,120,.9)';
        g.fillText('FREEZE', width - 70, 22);
      }
      if (!isDemoMode() && wavBuffer) {
        g.fillStyle = 'rgba(237,242,255,.62)';
        g.fillText(`pozícia: ${formatTime(currentWavPositionSec())}`, 14, 42);
      }
      g.restore();

      updateStatus();
    }

    ui.startStop.addEventListener('click', async () => {
      if (isDemoMode()) {
        if (isDemoRunning()) stopDemo();
        else await startDemo();
      } else {
        if (wavPlaying) pauseWav();
        else await playWav();
      }
    });

    ui.mute.addEventListener('click', () => {
      muted = !muted;
      ui.mute.textContent = muted ? 'Unmute' : 'Mute';
      updateAudioParams();
    });

    ui.freeze.addEventListener('click', () => {
      frozen = !frozen;
      ui.freeze.textContent = frozen ? 'Unfreeze obraz' : 'Freeze obraz';
      if (!frozen) firstFrame = true;
    });

    ui.sourceMode.addEventListener('change', () => {
      firstFrame = true;
      updateAudioParams();
    });

    ui.wavFile.addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      await loadWavFile(file);
    });

    ui.wavPos.addEventListener('input', async () => {
      if (!wavBuffer) return;
      await seekWav(number(ui.wavPos.value) / 1000);
    });

    ui.loopWav.addEventListener('change', () => {
      if (wavSource) wavSource.loop = ui.loopWav.checked;
      firstFrame = true;
      updateAudioParams();
    });

    for (const control of [
      ui.sineFreq, ui.sineAmp, ui.sawFreq, ui.sawAmp, ui.zoomMs, ui.vScale, ui.smooth,
      ui.syncMode, ui.triggerSource, ui.triggerLevel, ui.masterVol, ui.fps, ui.followPlayback
    ]) {
      control.addEventListener('input', () => {
        firstFrame = true;
        updateAudioParams();
      });
      control.addEventListener('change', () => {
        firstFrame = true;
        updateAudioParams();
      });
    }

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', async (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        if (isDemoMode()) {
          if (isDemoRunning()) stopDemo();
          else await startDemo();
        } else {
          if (wavPlaying) pauseWav();
          else await playWav();
        }
      }
    });

    resizeCanvas();
    updateLabels();
    updateStatus();
    updatePanelState();
    requestAnimationFrame(paint);
