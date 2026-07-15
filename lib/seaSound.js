'use client';
// 海声 · 实时合成，没有音频文件
//
// 真的海有三层：
//   远处持续的涌，低频，几乎是次声，你是用胸口听见它的；
//   近处的浪拍在滩上，中频，一次一次，有呼吸；
//   碎沫和沙的沙沙，高频，跟着浪来，浪退了它还留一会儿。
// 三层用不同的包络驱动，听起来才像海。只做一层白噪声开大开小，
// 那是电视雪花。
//
// 每一次浪都是新的：噪声是随机的，你听两遍不会一模一样。

const NOISE_SECONDS = 4;

export function createSeaSound(ctx, recipe = {}) {
  const {
    lowpass = 1500,
    highpass = 120,
    period = 6.5,   // 一次涌落的秒数
    swell = 0.55,   // 涌的幅度
    hiss = 0.45,    // 碎浪的高频量
    depth = 0.5,    // 低频轰隆
  } = recipe;

  // 一段循环的粉噪声底料
  const buf = ctx.createBuffer(2, ctx.sampleRate * NOISE_SECONDS, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      // 简易粉噪声：比白噪声低频更足，更像海
      b0 = 0.99765 * b0 + w * 0.0990460;
      b1 = 0.96300 * b1 + w * 0.2965164;
      b2 = 0.57000 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.16;
    }
  }

  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;

  const out = ctx.createGain();
  out.gain.value = 0;

  // ── 第一层：远处的涌。低频，缓慢起伏，是海的底。
  const deepFilter = ctx.createBiquadFilter();
  deepFilter.type = 'lowpass';
  deepFilter.frequency.value = Math.min(220, lowpass);
  deepFilter.Q.value = 0.6;
  const deepGain = ctx.createGain();
  deepGain.gain.value = depth * 0.55;

  // ── 第二层：拍岸的浪。中频，被涌的包络推着走。
  const bodyFilter = ctx.createBiquadFilter();
  bodyFilter.type = 'lowpass';
  bodyFilter.frequency.value = lowpass;
  bodyFilter.Q.value = 0.4;
  const bodyHP = ctx.createBiquadFilter();
  bodyHP.type = 'highpass';
  bodyHP.frequency.value = highpass;
  const bodyGain = ctx.createGain();
  bodyGain.gain.value = 0.5;

  // ── 第三层：碎沫的沙沙。高频，浪退了还留一会儿。
  const hissFilter = ctx.createBiquadFilter();
  hissFilter.type = 'highpass';
  hissFilter.frequency.value = 2200;
  const hissGain = ctx.createGain();
  hissGain.gain.value = 0;

  src.connect(deepFilter).connect(deepGain).connect(out);
  src.connect(bodyHP).connect(bodyFilter).connect(bodyGain).connect(out);
  src.connect(hissFilter).connect(hissGain).connect(out);

  // ── 涌的包络：不是正弦，是「慢慢涨、快快落、留一点余音」
  // 每一次周期长度都略有不同，海不打拍子。
  let stopped = false;
  const swellOnce = (t0) => {
    if (stopped) return;
    const p = period * (0.82 + Math.random() * 0.36);
    const peak = 0.5 + swell * (0.6 + Math.random() * 0.4);

    // 浪身：涨得慢，落得快
    bodyGain.gain.cancelScheduledValues(t0);
    bodyGain.gain.setValueAtTime(bodyGain.gain.value, t0);
    bodyGain.gain.linearRampToValueAtTime(peak, t0 + p * 0.42);
    bodyGain.gain.exponentialRampToValueAtTime(Math.max(0.02, peak * 0.22), t0 + p * 0.78);

    // 浪打上来时滤波器打开，像浪头翻过来那一下
    bodyFilter.frequency.cancelScheduledValues(t0);
    bodyFilter.frequency.setValueAtTime(bodyFilter.frequency.value, t0);
    bodyFilter.frequency.linearRampToValueAtTime(lowpass * 1.5, t0 + p * 0.44);
    bodyFilter.frequency.exponentialRampToValueAtTime(Math.max(120, lowpass * 0.6), t0 + p * 0.85);

    // 沙沙声比浪身晚一点到，退得也慢，浪走了它还在沙上
    if (hiss > 0.02) {
      const hp = hiss * (0.5 + Math.random() * 0.5) * 0.32;
      hissGain.gain.cancelScheduledValues(t0);
      hissGain.gain.setValueAtTime(hissGain.gain.value, t0);
      hissGain.gain.linearRampToValueAtTime(hp, t0 + p * 0.5);
      hissGain.gain.exponentialRampToValueAtTime(0.001, t0 + p * 0.95);
    }

    // 深处的涌几乎不动，只是极缓地呼吸
    deepGain.gain.cancelScheduledValues(t0);
    deepGain.gain.setValueAtTime(deepGain.gain.value, t0);
    deepGain.gain.linearRampToValueAtTime(depth * (0.45 + Math.random() * 0.25), t0 + p * 0.6);

    timer = setTimeout(() => swellOnce(ctx.currentTime), p * 1000);
  };

  let timer = null;

  return {
    node: out,
    start(fadeIn = 2.2) {
      src.start();
      swellOnce(ctx.currentTime);
      const t = ctx.currentTime;
      out.gain.cancelScheduledValues(t);
      out.gain.setValueAtTime(0, t);
      out.gain.linearRampToValueAtTime(1, t + fadeIn);
    },
    // 音乐进来时把海压下去，音乐停了再让它涨回来
    duck(level, ramp = 1.2) {
      const t = ctx.currentTime;
      out.gain.cancelScheduledValues(t);
      out.gain.setValueAtTime(out.gain.value, t);
      out.gain.linearRampToValueAtTime(level, t + ramp);
    },
    stop(fadeOut = 1.6) {
      stopped = true;
      clearTimeout(timer);
      const t = ctx.currentTime;
      out.gain.cancelScheduledValues(t);
      out.gain.setValueAtTime(out.gain.value, t);
      out.gain.linearRampToValueAtTime(0, t + fadeOut);
      setTimeout(() => { try { src.stop(); } catch {} }, (fadeOut + 0.2) * 1000);
    },
  };
}
