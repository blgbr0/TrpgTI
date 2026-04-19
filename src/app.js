(function () {
  var data = window.RPG_PERSONALITY_TEST;
  var state = {
    currentIndex: 0,
    questionFlow: [],
    answers: [],
    result: null,
  };

  var homeView = document.getElementById("home-view");
  var quizView = document.getElementById("quiz-view");
  var resultView = document.getElementById("result-view");
  var heroTitle = document.getElementById("hero-title");
  var heroSubtitle = document.getElementById("hero-subtitle");
  var heroIntro = document.getElementById("hero-intro");
  var heroStats = document.getElementById("hero-stats");
  var startButton = document.getElementById("start-button");
  var restartInlineButton = document.getElementById("restart-inline-button");
  var questionCounter = document.getElementById("question-counter");
  var questionDimension = document.getElementById("question-dimension");
  var questionText = document.getElementById("question-text");
  var questionOptions = document.getElementById("question-options");
  var progressBar = document.getElementById("progress-bar");
  var prevButton = document.getElementById("prev-button");
  var nextButton = document.getElementById("next-button");
  var resultCode = document.getElementById("result-code");
  var resultName = document.getElementById("result-name");
  var resultPoster = document.getElementById("result-poster");
  var resultTagline = document.getElementById("result-tagline");
  var resultNote = document.getElementById("result-note");
  var resultDescription = document.getElementById("result-description");
  var resultRole = document.getElementById("result-role");
  var resultTraits = document.getElementById("result-traits");
  var dimensionBars = document.getElementById("dimension-bars");
  var topMatches = document.getElementById("top-matches");
  var copyButton = document.getElementById("copy-button");
  var downloadButton = document.getElementById("download-button");
  var restartButton = document.getElementById("restart-button");
  var copyFeedback = document.getElementById("copy-feedback");
  var atlasGrid = document.getElementById("atlas-grid");

  var personaArt = {
    CLUE: { accent: "#80d8d3", glow: "#1b5f62", stamp: "侦查", noise: "侦查·聆听·细节" },
    HEAR: { accent: "#95d8ff", glow: "#204e74", stamp: "聆听", noise: "门后·脚步·呼吸" },
    BOOK: { accent: "#d5c07d", glow: "#5d4e1f", stamp: "图书馆", noise: "档案·旧报纸·手稿" },
    PSYC: { accent: "#b7ddff", glow: "#2d4666", stamp: "心理学", noise: "表情·停顿·测谎" },
    BARB: { accent: "#ef8e63", glow: "#7f2f25", stamp: "开战", noise: "踹门·斗殴·先砍" },
    ROLL: { accent: "#f0c75d", glow: "#7b5d15", stamp: "d100", noise: "大成·大失·上供" },
    FUMB: { accent: "#ff9e7a", glow: "#6d301f", stamp: "大失败", noise: "事故·寄了·支线" },
    ROLE: { accent: "#d9a2ff", glow: "#5e2a7b", stamp: "RP", noise: "出场·独白·高光" },
    MEME: { accent: "#ff7db7", glow: "#7a2648", stamp: "整活", noise: "节目·乐子·事故" },
    HIDE: { accent: "#95cf91", glow: "#234f2f", stamp: "苟住", noise: "撤退·保命·别撕卡" },
    RULE: { accent: "#8ab8ff", glow: "#223f7b", stamp: "规则", noise: "文本·勘误·重审" },
    TALK: { accent: "#7de1c5", glow: "#1d5f52", stamp: "嘴遁", noise: "社交·套话·谈判" },
    LORE: { accent: "#c6b37e", glow: "#5c4c22", stamp: "设定", noise: "小传·背景·附录" },
    PAIN: { accent: "#d98f8f", glow: "#682f36", stamp: "掉san", noise: "吃刀·沉浸·后劲" },
    SUSS: { accent: "#8eb3d9", glow: "#233c58", stamp: "可疑", noise: "NPC·试探·坏KP" },
    BANG: { accent: "#ff8f73", glow: "#6e3023", stamp: "斗殴", noise: "拳头·手枪·先动手" },
    TRAP: { accent: "#ff9d66", glow: "#6a371a", stamp: "别碰", noise: "按钮·陷阱·作死" },
    WORK: { accent: "#9cb7a0", glow: "#324734", stamp: "主线", noise: "收尾·拉线·带团" },
    JOKE: { accent: "#ffb171", glow: "#6f4020", stamp: "献祭", noise: "冷场·接梗·社死" },
    KANG: { accent: "#d4a6ff", glow: "#4c2a73", stamp: "理论", noise: "抬杠·例外·漏洞" },
    SCAN: { accent: "#9ed3ff", glow: "#274c6c", stamp: "再查", noise: "普通房间·补证据" },
    LATE: { accent: "#f1b66c", glow: "#6e451f", stamp: "马上", noise: "在路上·快到了·稍等" },
    CARD: { accent: "#d8d17d", glow: "#5b571f", stamp: "车卡", noise: "模板·现编·白板" },
    LOOT: { accent: "#ffc66b", glow: "#6c4d18", stamp: "舔包", noise: "捡钱·遗产·资产" },
    SANO: { accent: "#ff8bb0", glow: "#6f2842", stamp: "SAN0", noise: "精神污染·先看看" },
    SCAR: { accent: "#ff958e", glow: "#6c2525", stamp: "撕卡", noise: "退场·高光·纪念卡" },
    KPSD: { accent: "#a9b8ff", glow: "#2b366f", stamp: "坏KP", noise: "灵感·暗投·遗书" },
  };

  function renderHome() {
    heroTitle.textContent = data.meta.title;
    heroSubtitle.textContent = data.meta.subtitle;
    heroIntro.textContent = data.meta.intro;
    heroStats.innerHTML = data.meta.stats
      .map(function (item) {
        return (
          '<div class="stat-chip"><span class="stat-value">' +
          item.value +
          '</span><span class="stat-label">' +
          item.label +
          "</span></div>"
        );
      })
      .join("");
  }

  function renderAtlas() {
    atlasGrid.innerHTML = data.types
      .map(function (type) {
        return (
          '<article class="atlas-card">' +
          '<img class="atlas-poster" src="' +
          buildPersonaPosterDataUrl(type, 480, 620) +
          '" alt="' +
          type.name +
          ' 海报">' +
          '<div class="atlas-copy">' +
          '<div class="atlas-code">' +
          type.code +
          "</div>" +
          '<h3 class="atlas-name">' +
          type.name +
          "</h3>" +
          '<p class="atlas-tagline">' +
          type.tagline +
          "</p>" +
          '<p class="atlas-role">' +
          type.role +
          "</p>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  function getArtPreset(type) {
    return personaArt[type.code] || {
      accent: "#d5b26c",
      glow: "#4c3a1e",
      stamp: type.code,
      noise: type.name,
    };
  }

  function buildSceneObjectSvg(code, preset, w, h) {
    var objects = {
      CLUE:
        '<rect x="62" y="92" width="118" height="92" rx="16" fill="rgba(255,255,255,0.72)"/>' +
        '<rect x="72" y="106" width="42" height="8" rx="4" fill="' +
        preset.accent +
        '" fill-opacity="0.45"/>' +
        '<circle cx="139" cy="146" r="26" fill="none" stroke="' +
        preset.accent +
        '" stroke-width="8" stroke-opacity="0.8"/>' +
        '<rect x="156" y="162" width="42" height="10" rx="5" transform="rotate(38 156 162)" fill="' +
        preset.accent +
        '" fill-opacity="0.8"/>',
      BARB:
        '<rect x="296" y="82" width="76" height="164" rx="14" fill="rgba(255,255,255,0.18)"/>' +
        '<path d="M296 160 L372 122 L372 150 L296 188 Z" fill="' +
        preset.accent +
        '" fill-opacity="0.45"/>',
      ROLL:
        '<g transform="translate(304 118) rotate(-12)">' +
        '<rect width="54" height="54" rx="12" fill="rgba(255,255,255,0.86)"/>' +
        '<circle cx="16" cy="16" r="4" fill="' +
        preset.glow +
        '"/><circle cx="38" cy="38" r="4" fill="' +
        preset.glow +
        '"/>' +
        '</g>' +
        '<g transform="translate(72 272) rotate(16)">' +
        '<rect width="46" height="46" rx="10" fill="rgba(255,255,255,0.75)"/>' +
        '<circle cx="23" cy="23" r="5" fill="' +
        preset.accent +
        '"/>' +
        '</g>',
      ROLE:
        '<path d="M58 274 C88 228, 126 214, 168 210 L168 332 C122 332, 84 314, 58 274 Z" fill="' +
        preset.accent +
        '" fill-opacity="0.2"/>' +
        '<circle cx="340" cy="86" r="34" fill="rgba(255,255,255,0.72)"/>',
      MEME:
        '<path d="M302 96 C328 72, 356 74, 372 100 C346 106, 324 126, 316 154 C296 136, 290 116, 302 96 Z" fill="' +
        preset.accent +
        '" fill-opacity="0.38"/>' +
        '<circle cx="92" cy="108" r="10" fill="rgba(255,255,255,0.65)"/><circle cx="120" cy="86" r="6" fill="rgba(255,255,255,0.55)"/>',
      HIDE:
        '<rect x="66" y="234" width="104" height="88" rx="16" fill="rgba(255,255,255,0.18)"/>' +
        '<rect x="82" y="252" width="72" height="12" rx="6" fill="' +
        preset.accent +
        '" fill-opacity="0.28"/>',
      RULE:
        '<rect x="302" y="88" width="60" height="88" rx="14" fill="rgba(255,255,255,0.78)"/>' +
        '<rect x="314" y="104" width="36" height="6" rx="3" fill="' +
        preset.accent +
        '" fill-opacity="0.55"/>' +
        '<rect x="314" y="120" width="30" height="6" rx="3" fill="' +
        preset.accent +
        '" fill-opacity="0.35"/>',
      TALK:
        '<path d="M290 96 h70 a14 14 0 0 1 14 14 v36 a14 14 0 0 1 -14 14 h-24 l-18 18 v-18 h-28 a14 14 0 0 1 -14 -14 v-36 a14 14 0 0 1 14 -14 z" fill="rgba(255,255,255,0.75)"/>' +
        '<circle cx="314" cy="128" r="4" fill="' +
        preset.accent +
        '"/><circle cx="334" cy="128" r="4" fill="' +
        preset.accent +
        '"/><circle cx="354" cy="128" r="4" fill="' +
        preset.accent +
        '"/>',
      LORE:
        '<rect x="62" y="92" width="120" height="24" rx="8" fill="' +
        preset.accent +
        '" fill-opacity="0.32"/>' +
        '<rect x="74" y="118" width="108" height="24" rx="8" fill="rgba(255,255,255,0.72)"/>' +
        '<rect x="90" y="144" width="92" height="24" rx="8" fill="' +
        preset.accent +
        '" fill-opacity="0.2"/>',
      PAIN:
        '<path d="M82 112 C92 88, 126 82, 144 100 C168 90, 188 108, 186 128 C208 138, 206 170, 176 176 H94 C64 176, 56 142, 82 112 Z" fill="rgba(255,255,255,0.56)"/>' +
        '<path d="M112 176 l-12 24 M146 176 l-12 24" stroke="' +
        preset.accent +
        '" stroke-width="6" stroke-linecap="round" opacity="0.5"/>',
      SUSS:
        '<rect x="58" y="88" width="132" height="102" rx="18" fill="rgba(255,255,255,0.16)"/>' +
        '<circle cx="102" cy="118" r="10" fill="' +
        preset.accent +
        '" fill-opacity="0.5"/><circle cx="154" cy="104" r="8" fill="' +
        preset.accent +
        '" fill-opacity="0.35"/><rect x="92" y="154" width="72" height="8" rx="4" fill="rgba(255,255,255,0.5)"/>',
      TRAP:
        '<rect x="316" y="220" width="38" height="82" rx="12" fill="rgba(255,255,255,0.18)"/>' +
        '<circle cx="335" cy="208" r="24" fill="#ff6a5f" fill-opacity="0.9"/>',
      WORK:
        '<rect x="62" y="86" width="136" height="106" rx="18" fill="rgba(255,255,255,0.16)"/>' +
        '<path d="M86 114 L126 134 L166 98" stroke="' +
        preset.accent +
        '" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>' +
        '<circle cx="88" cy="114" r="6" fill="' +
        preset.accent +
        '"/><circle cx="126" cy="134" r="6" fill="' +
        preset.accent +
        '"/><circle cx="166" cy="98" r="6" fill="' +
        preset.accent +
        '"/>',
      JOKE:
        '<circle cx="326" cy="98" r="24" fill="rgba(255,255,255,0.72)"/><circle cx="356" cy="124" r="18" fill="' +
        preset.accent +
        '" fill-opacity="0.3"/><circle cx="300" cy="134" r="16" fill="' +
        preset.accent +
        '" fill-opacity="0.4"/>',
      KANG:
        '<rect x="304" y="88" width="64" height="104" rx="16" fill="rgba(255,255,255,0.78)"/>' +
        '<rect x="318" y="104" width="36" height="6" rx="3" fill="' +
        preset.accent +
        '"/><rect x="318" y="120" width="28" height="6" rx="3" fill="' +
        preset.accent +
        '" fill-opacity="0.55"/>' +
        '<rect x="318" y="136" width="42" height="6" rx="3" fill="' +
        preset.accent +
        '" fill-opacity="0.35"/>',
      SCAN:
        '<path d="M322 86 l34 28 l-42 52 l-24 -20 Z" fill="rgba(255,255,255,0.18)"/>' +
        '<circle cx="326" cy="180" r="18" fill="' +
        preset.accent +
        '" fill-opacity="0.35"/>',
      LATE:
        '<circle cx="336" cy="112" r="40" fill="rgba(255,255,255,0.78)"/>' +
        '<path d="M336 90 v22 l14 12" stroke="' +
        preset.accent +
        '" stroke-width="6" stroke-linecap="round" fill="none"/>',
      CARD:
        '<rect x="298" y="96" width="86" height="120" rx="16" fill="rgba(255,255,255,0.82)"/>' +
        '<rect x="316" y="120" width="48" height="8" rx="4" fill="' +
        preset.accent +
        '" fill-opacity="0.28"/><rect x="316" y="142" width="38" height="8" rx="4" fill="' +
        preset.accent +
        '" fill-opacity="0.18"/>',
      LOOT:
        '<rect x="62" y="250" width="94" height="62" rx="18" fill="rgba(255,255,255,0.2)"/>' +
        '<circle cx="98" cy="236" r="18" fill="#f4d392"/><circle cx="130" cy="228" r="14" fill="#d5b26c"/>',
      SANO:
        '<circle cx="330" cy="120" r="46" fill="rgba(255,255,255,0.18)"/>' +
        '<ellipse cx="330" cy="120" rx="26" ry="16" fill="rgba(255,255,255,0.74)"/><circle cx="330" cy="120" r="9" fill="' +
        preset.accent +
        '"/>' ,
      SCAR:
        '<path d="M314 84 C350 82 370 100 370 134 C370 168 336 184 306 178 C312 158 318 138 314 84 Z" fill="' +
        preset.accent +
        '" fill-opacity="0.18"/>' +
        '<path d="M326 98 L344 130 L314 152" stroke="rgba(255,255,255,0.72)" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
      KPSD:
        '<rect x="58" y="90" width="126" height="92" rx="18" fill="rgba(255,255,255,0.14)"/>' +
        '<path d="M74 116 h96" stroke="rgba(255,255,255,0.46)" stroke-width="6" stroke-linecap="round"/>' +
        '<path d="M74 142 h72" stroke="rgba(255,255,255,0.36)" stroke-width="6" stroke-linecap="round"/>' +
        '<circle cx="154" cy="148" r="10" fill="' + preset.accent + '" fill-opacity="0.55"/>'
    };

    return objects[code] || "";
  }

  function buildHandheldPropSvg(code, preset, x, y) {
    var props = {
      CLUE:
        '<circle cx="' + x + '" cy="' + y + '" r="18" fill="none" stroke="rgba(255,255,255,0.82)" stroke-width="8"/>' +
        '<rect x="' + (x + 10) + '" y="' + (y + 12) + '" width="26" height="8" rx="4" transform="rotate(36 ' + (x + 10) + ' ' + (y + 12) + ')" fill="' + preset.accent + '"/>',
      BARB:
        '<rect x="' + (x - 4) + '" y="' + (y - 34) + '" width="8" height="62" rx="4" fill="#d8c7a2"/>' +
        '<path d="M' + (x - 18) + ' ' + (y - 26) + ' L' + (x + 18) + ' ' + (y - 26) + ' L' + (x + 10) + ' ' + (y - 4) + ' L' + (x - 10) + ' ' + (y - 4) + ' Z" fill="rgba(255,255,255,0.82)"/>',
      ROLL:
        '<rect x="' + (x - 18) + '" y="' + (y - 18) + '" width="36" height="36" rx="10" fill="rgba(255,255,255,0.88)"/>' +
        '<circle cx="' + (x - 8) + '" cy="' + (y - 8) + '" r="3" fill="' + preset.glow + '"/><circle cx="' + (x + 8) + '" cy="' + (y + 8) + '" r="3" fill="' + preset.glow + '"/>',
      ROLE:
        '<path d="M' + (x - 18) + ' ' + (y - 10) + ' C' + (x - 4) + ' ' + (y - 24) + ', ' + (x + 10) + ' ' + (y - 24) + ', ' + (x + 18) + ' ' + (y - 8) + ' C' + (x + 10) + ' ' + (y + 4) + ', ' + (x - 2) + ' ' + (y + 10) + ', ' + (x - 18) + ' ' + (y - 10) + ' Z" fill="rgba(255,255,255,0.85)"/>',
      TALK:
        '<path d="M' + (x - 22) + ' ' + (y - 18) + ' h42 a12 12 0 0 1 12 12 v18 a12 12 0 0 1 -12 12 h-14 l-12 12 v-12 h-16 a12 12 0 0 1 -12 -12 v-18 a12 12 0 0 1 12 -12 z" fill="rgba(255,255,255,0.82)"/>',
      RULE:
        '<rect x="' + (x - 18) + '" y="' + (y - 24) + '" width="36" height="48" rx="8" fill="rgba(255,255,255,0.86)"/>' +
        '<rect x="' + (x - 10) + '" y="' + (y - 10) + '" width="20" height="4" rx="2" fill="' + preset.accent + '"/>',
      LORE:
        '<rect x="' + (x - 20) + '" y="' + (y - 22) + '" width="40" height="14" rx="4" fill="rgba(255,255,255,0.86)"/>' +
        '<rect x="' + (x - 16) + '" y="' + (y - 6) + '" width="36" height="14" rx="4" fill="' + preset.accent + '" fill-opacity="0.8"/>',
      PAIN:
        '<rect x="' + (x - 20) + '" y="' + (y - 10) + '" width="40" height="20" rx="10" fill="rgba(255,255,255,0.82)"/>' +
        '<rect x="' + (x - 2) + '" y="' + (y - 10) + '" width="4" height="20" fill="' + preset.accent + '" fill-opacity="0.55"/>',
      TRAP:
        '<circle cx="' + x + '" cy="' + y + '" r="16" fill="#ff6a5f"/>',
      WORK:
        '<rect x="' + (x - 18) + '" y="' + (y - 22) + '" width="36" height="48" rx="8" fill="rgba(255,255,255,0.86)"/>' +
        '<path d="M' + (x - 8) + ' ' + (y - 2) + ' L' + x + ' ' + (y + 8) + ' L' + (x + 10) + ' ' + (y - 10) + '" stroke="' + preset.accent + '" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
      JOKE:
        '<circle cx="' + (x - 10) + '" cy="' + (y - 4) + '" r="10" fill="#ffffff" fill-opacity="0.82"/><circle cx="' + (x + 10) + '" cy="' + (y + 6) + '" r="10" fill="' + preset.accent + '" fill-opacity="0.8"/>',
      KANG:
        '<rect x="' + (x - 2) + '" y="' + (y - 34) + '" width="4" height="68" rx="2" fill="#d8c7a2"/>',
      SCAN:
        '<rect x="' + (x - 10) + '" y="' + (y - 14) + '" width="20" height="28" rx="8" fill="rgba(255,255,255,0.86)"/>' +
        '<path d="M' + (x + 10) + ' ' + (y - 8) + ' L' + (x + 34) + ' ' + (y - 2) + ' L' + (x + 10) + ' ' + (y + 8) + ' Z" fill="' + preset.accent + '" fill-opacity="0.45"/>',
      LATE:
        '<circle cx="' + x + '" cy="' + y + '" r="18" fill="rgba(255,255,255,0.86)"/>' +
        '<path d="M' + x + ' ' + (y - 8) + ' v10 l8 6" stroke="' + preset.accent + '" stroke-width="4" stroke-linecap="round" fill="none"/>',
      CARD:
        '<rect x="' + (x - 16) + '" y="' + (y - 24) + '" width="32" height="44" rx="6" fill="rgba(255,255,255,0.86)"/>',
      LOOT:
        '<circle cx="' + (x - 8) + '" cy="' + y + '" r="10" fill="#f4d392"/><circle cx="' + (x + 8) + '" cy="' + (y - 8) + '" r="10" fill="' + preset.accent + '"/>',
      SANO:
        '<ellipse cx="' + x + '" cy="' + y + '" rx="20" ry="12" fill="rgba(255,255,255,0.85)"/><circle cx="' + x + '" cy="' + y + '" r="6" fill="' + preset.accent + '"/>',
      SCAR:
        '<path d="M' + (x - 12) + ' ' + (y - 18) + ' L' + (x + 16) + ' ' + y + ' L' + (x - 12) + ' ' + (y + 18) + ' Z" fill="rgba(255,255,255,0.84)"/>',
      KPSD:
        '<rect x="' + (x - 16) + '" y="' + (y - 22) + '" width="32" height="44" rx="8" fill="rgba(255,255,255,0.86)"/>' +
        '<circle cx="' + x + '" cy="' + (y - 2) + '" r="4" fill="' + preset.accent + '"/>'
    };

    return props[code] || "";
  }

  function buildCharacterSvg(code, preset, w, h) {
    var baseX = w * 0.54;
    var baseY = h * 0.72;
    var skin = "#e8cab6";
    var hair = {
      CLUE: "#4c5f63",
      BARB: "#55332c",
      ROLL: "#6b5634",
      ROLE: "#5b3c67",
      MEME: "#6a2f4d",
      HIDE: "#35513a",
      RULE: "#3a4666",
      TALK: "#2a5d58",
      LORE: "#645737",
      PAIN: "#5e3140",
      SUSS: "#32475f",
      TRAP: "#7a4729",
      WORK: "#465648",
      JOKE: "#6f4b2c",
      KANG: "#56356f",
      SCAN: "#335773",
      LATE: "#7b5831",
      CARD: "#6b6735",
      LOOT: "#805c1f",
      SANO: "#6f2842",
      SCAR: "#6b2f2f",
      KPSD: "#32406f",
    }[code] || "#5b5046";

    var outfit = preset.accent;
    var coat = preset.glow;
    var leftArm = { x: baseX - 30, y: baseY - 170, angle: -26, len: 70 };
    var rightArm = { x: baseX + 28, y: baseY - 168, angle: 18, len: 72 };
    var leftLeg = { x: baseX - 22, y: baseY - 72, angle: -8, len: 84 };
    var rightLeg = { x: baseX + 10, y: baseY - 72, angle: 8, len: 84 };

    if (code === "BARB" || code === "BANG") {
      rightArm.angle = 42;
      leftLeg.angle = -14;
      rightLeg.angle = 12;
    }
    if (code === "HIDE") {
      leftArm.angle = -8;
      rightArm.angle = -22;
    }
    if (code === "TALK" || code === "JOKE") {
      rightArm.angle = -22;
      leftArm.angle = -38;
    }
    if (code === "KANG" || code === "RULE") {
      rightArm.angle = 8;
      leftArm.angle = -52;
    }
    if (code === "SCAN" || code === "CLUE") {
      rightArm.angle = 30;
      leftArm.angle = -12;
    }
    if (code === "LATE") {
      leftArm.angle = -50;
    }
    if (code === "SANO") {
      rightArm.angle = -8;
      leftArm.angle = -18;
    }

    return [
      '<ellipse cx="' + baseX + '" cy="' + (baseY + 36) + '" rx="78" ry="18" fill="rgba(43,43,43,0.14)"/>',
      '<rect x="' + (baseX - 54) + '" y="' + (baseY - 228) + '" width="108" height="128" rx="34" fill="' + coat + '"/>',
      '<rect x="' + (baseX - 40) + '" y="' + (baseY - 208) + '" width="80" height="96" rx="24" fill="' + outfit + '"/>',
      '<rect x="' + (baseX - 8) + '" y="' + (baseY - 206) + '" width="16" height="42" rx="8" fill="#f2f1ec" fill-opacity="0.72"/>',
      '<g transform="translate(' + leftArm.x + ',' + leftArm.y + ') rotate(' + leftArm.angle + ')"><rect x="-10" y="0" width="20" height="70" rx="10" fill="' + outfit + '"/><circle cx="0" cy="72" r="12" fill="' + skin + '"/></g>',
      '<g transform="translate(' + rightArm.x + ',' + rightArm.y + ') rotate(' + rightArm.angle + ')"><rect x="-10" y="0" width="20" height="72" rx="10" fill="' + outfit + '"/><circle cx="0" cy="74" r="12" fill="' + skin + '"/></g>',
      buildHandheldPropSvg(code, preset, baseX + 66, baseY - 132),
      '<g transform="translate(' + leftLeg.x + ',' + leftLeg.y + ') rotate(' + leftLeg.angle + ')"><rect x="-12" y="0" width="24" height="88" rx="12" fill="#445259"/><rect x="-16" y="82" width="34" height="14" rx="7" fill="#2b2b2b"/></g>',
      '<g transform="translate(' + rightLeg.x + ',' + rightLeg.y + ') rotate(' + rightLeg.angle + ')"><rect x="-12" y="0" width="24" height="88" rx="12" fill="#445259"/><rect x="-16" y="82" width="34" height="14" rx="7" fill="#2b2b2b"/></g>',
      '<circle cx="' + baseX + '" cy="' + (baseY - 268) + '" r="40" fill="' + skin + '"/>',
      '<path d="M' + (baseX - 42) + ' ' + (baseY - 274) + ' C' + (baseX - 30) + ' ' + (baseY - 322) + ', ' + (baseX + 26) + ' ' + (baseY - 326) + ', ' + (baseX + 42) + ' ' + (baseY - 284) + ' L' + (baseX + 40) + ' ' + (baseY - 248) + ' C' + (baseX + 18) + ' ' + (baseY - 262) + ', ' + (baseX - 18) + ' ' + (baseY - 262) + ', ' + (baseX - 40) + ' ' + (baseY - 246) + ' Z" fill="' + hair + '"/>',
      '<circle cx="' + (baseX - 14) + '" cy="' + (baseY - 270) + '" r="3" fill="#2b2b2b"/><circle cx="' + (baseX + 12) + '" cy="' + (baseY - 270) + '" r="3" fill="#2b2b2b"/>',
      '<path d="M' + (baseX - 14) + ' ' + (baseY - 246) + ' C' + (baseX - 4) + ' ' + (baseY - 238) + ', ' + (baseX + 8) + ' ' + (baseY - 238) + ', ' + (baseX + 18) + ' ' + (baseY - 246) + '" stroke="#8b6651" stroke-width="4" fill="none" stroke-linecap="round"/>',
    ].join("");
  }

  function buildPersonaPosterSvg(type, width, height) {
    var preset = getArtPreset(type);
    var w = width || 400;
    var h = height || 400;
    var code = type.code;
    var bgLight = "#f4f1eb";
    var bgTint = preset.accent;

    return [
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">',
      '<defs>',
      '<linearGradient id="bg-' + code + '" x1="0" y1="0" x2="1" y2="1">',
      '<stop offset="0%" stop-color="' + bgLight + '"/>',
      '<stop offset="100%" stop-color="' + bgTint + '" stop-opacity="0.12"/>',
      '</linearGradient>',
      '<linearGradient id="panel-' + code + '" x1="0" y1="0" x2="0" y2="1">',
      '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.92"/>',
      '<stop offset="100%" stop-color="#ffffff" stop-opacity="0.55"/>',
      '</linearGradient>',
      '</defs>',
      '<rect width="' + w + '" height="' + h + '" rx="28" fill="url(#bg-' + code + ')"/>',
      '<rect x="18" y="18" width="' + (w - 36) + '" height="' + (h - 36) + '" rx="22" fill="url(#panel-' + code + ')" stroke="rgba(79,82,83,0.08)"/>',
      '<circle cx="' + (w - 92) + '" cy="88" r="58" fill="' + preset.accent + '" fill-opacity="0.18"/>',
      '<circle cx="90" cy="' + (h - 86) + '" r="46" fill="' + preset.accent + '" fill-opacity="0.12"/>',
      buildSceneObjectSvg(code, preset, w, h),
      buildCharacterSvg(code, preset, w, h),
      '</svg>',
    ].join("");
  }

  function buildPersonaPosterDataUrl(type, width, height) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(buildPersonaPosterSvg(type, width, height));
  }

  function showView(viewName) {
    homeView.hidden = viewName !== "home";
    quizView.hidden = viewName !== "quiz";
    resultView.hidden = viewName !== "result";
    homeView.classList.toggle("view-active", viewName === "home");
    quizView.classList.toggle("view-active", viewName === "quiz");
    resultView.classList.toggle("view-active", viewName === "result");
  }

  function randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function buildQuestionFlow() {
    var flow = data.questions.slice();

    (data.specialFlows || []).forEach(function (specialFlow) {
      var range = specialFlow.insertRange || [4, Math.max(4, flow.length - 4)];
      var min = Math.max(0, Math.min(range[0], flow.length));
      var max = Math.max(min, Math.min(range[1], flow.length));
      var insertIndex = randomInRange(min, max);
      flow.splice(insertIndex, 0, specialFlow.entry);
    });

    return flow;
  }

  function startQuiz() {
    state.currentIndex = 0;
    state.questionFlow = buildQuestionFlow();
    state.answers = new Array(state.questionFlow.length).fill(null);
    state.result = null;
    copyFeedback.textContent = "";
    renderQuestion();
    showView("quiz");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function restartQuiz() {
    startQuiz();
  }

  function getDimension(code) {
    return data.dimensions.find(function (item) {
      return item.code === code;
    });
  }

  function getType(code) {
    return data.types.find(function (item) {
      return item.code === code;
    });
  }

  function getHiddenType(code) {
    return (data.hiddenTypes || []).find(function (item) {
      return item.code === code;
    });
  }

  function getSpecialFlowByQuestionId(questionId) {
    return (data.specialFlows || []).find(function (flow) {
      return flow.entry.id === questionId || flow.followUp.id === questionId;
    });
  }

  function findQuestionIndexById(id) {
    return state.questionFlow.findIndex(function (question) {
      return question.id === id;
    });
  }

  function findAnswerByQuestionId(id) {
    return state.answers.find(function (answer) {
      return answer && answer.questionId === id;
    });
  }

  function renderQuestion() {
    var question = state.questionFlow[state.currentIndex];
    var answer = state.answers[state.currentIndex];
    var progress = ((state.currentIndex + 1) / state.questionFlow.length) * 100;

    questionCounter.textContent = "第 " + (state.currentIndex + 1) + " 题";
    questionText.textContent = question.text;
    progressBar.style.width = progress + "%";

    if (question.special) {
      questionDimension.textContent = question.badge || "彩蛋题";
      questionDimension.title = "这道题不计入维度分，但可能触发隐藏人格。";
    } else {
      var dimension = getDimension(question.dim);
      questionDimension.textContent = question.dim + " · " + dimension.name;
      questionDimension.title = dimension.description;
    }

    questionOptions.innerHTML = question.options
      .map(function (option, optionIndex) {
        var selectedClass = answer && answer.optionIndex === optionIndex ? " option-selected" : "";
        return (
          '<button class="option-button' +
          selectedClass +
          '" type="button" data-index="' +
          optionIndex +
          '">' +
          '<span class="option-letter">' +
          String.fromCharCode(65 + optionIndex) +
          "</span>" +
          '<span class="option-label">' +
          option.label +
          "</span>" +
          "</button>"
        );
      })
      .join("");

    Array.prototype.forEach.call(questionOptions.querySelectorAll("button"), function (button) {
      button.addEventListener("click", function () {
        selectAnswer(Number(button.getAttribute("data-index")));
      });
    });

    prevButton.disabled = state.currentIndex === 0;
    nextButton.disabled = !answer;
    nextButton.textContent =
      state.currentIndex === state.questionFlow.length - 1 ? "生成结果" : "下一题";
  }

  function selectAnswer(optionIndex) {
    var question = state.questionFlow[state.currentIndex];
    var option = question.options[optionIndex];

    state.answers[state.currentIndex] = {
      questionId: question.id,
      dim: question.dim || null,
      optionIndex: optionIndex,
      value: option.value,
      label: option.label,
      special: Boolean(question.special),
    };

    applySpecialFlow(question, option.value);

    if (state.currentIndex === state.questionFlow.length - 1) {
      finishQuiz();
      return;
    }

    state.currentIndex += 1;
    renderQuestion();
  }

  function applySpecialFlow(question, answerValue) {
    if (!question.special) {
      return;
    }

    var specialFlow = getSpecialFlowByQuestionId(question.id);
    if (!specialFlow || specialFlow.entry.id !== question.id) {
      return;
    }

    syncFollowUpQuestion(specialFlow, specialFlow.triggerValues.indexOf(answerValue) !== -1);
  }

  function syncFollowUpQuestion(specialFlow, shouldShow) {
    var followUpIndex = findQuestionIndexById(specialFlow.followUp.id);

    if (shouldShow && followUpIndex === -1) {
      state.questionFlow.splice(state.currentIndex + 1, 0, specialFlow.followUp);
      state.answers.splice(state.currentIndex + 1, 0, null);
      return;
    }

    if (!shouldShow && followUpIndex !== -1) {
      state.questionFlow.splice(followUpIndex, 1);
      state.answers.splice(followUpIndex, 1);
    }
  }

  function goPrev() {
    if (state.currentIndex === 0) {
      return;
    }

    state.currentIndex -= 1;
    renderQuestion();
  }

  function goNext() {
    if (!state.answers[state.currentIndex]) {
      return;
    }

    if (state.currentIndex === state.questionFlow.length - 1) {
      finishQuiz();
      return;
    }

    state.currentIndex += 1;
    renderQuestion();
  }

  function computeDimensionScores() {
    var sums = {};
    var counts = {};

    data.dimensions.forEach(function (dimension) {
      sums[dimension.code] = 0;
      counts[dimension.code] = 0;
    });

    state.questionFlow.forEach(function (question, index) {
      var answer = state.answers[index];
      if (!answer || question.special) {
        return;
      }

      sums[question.dim] += answer.value;
      counts[question.dim] += 1;
    });

    return data.dimensions.reduce(function (acc, dimension) {
      var count = counts[dimension.code] || 1;
      acc[dimension.code] = Number((sums[dimension.code] / count).toFixed(2));
      return acc;
    }, {});
  }

  function computeMatches(scores) {
    var maxDistance = data.dimensions.length * 3;

    return data.types
      .map(function (type) {
        var distance = 0;
        var exactMatches = 0;

        data.dimensions.forEach(function (dimension) {
          var score = scores[dimension.code];
          var target = type.profile[dimension.code];
          distance += Math.abs(score - target);
          if (Math.round(score) === target) {
            exactMatches += 1;
          }
        });

        return {
          code: type.code,
          distance: Number(distance.toFixed(2)),
          exactMatches: exactMatches,
          match: Math.max(0, Math.round((1 - distance / maxDistance) * 100)),
        };
      })
      .sort(function (a, b) {
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
        if (a.exactMatches !== b.exactMatches) {
          return b.exactMatches - a.exactMatches;
        }
        return a.code.localeCompare(b.code);
      });
  }

  function resolveHiddenResult() {
    var triggeredFlows = (data.specialFlows || []).filter(function (specialFlow) {
      var entryAnswer = findAnswerByQuestionId(specialFlow.entry.id);
      var followUpAnswer = findAnswerByQuestionId(specialFlow.followUp.id);

      return (
        entryAnswer &&
        specialFlow.triggerValues.indexOf(entryAnswer.value) !== -1 &&
        followUpAnswer &&
        specialFlow.hiddenTriggerValues.indexOf(followUpAnswer.value) !== -1
      );
    });

    if (!triggeredFlows.length) {
      return null;
    }

    triggeredFlows.sort(function (a, b) {
      return (b.priority || 0) - (a.priority || 0);
    });

    return triggeredFlows[0];
  }

  function finishQuiz() {
    var scores = computeDimensionScores();
    var rankedMatches = computeMatches(scores);
    var standardTop = getType(rankedMatches[0].code);
    var hiddenFlow = resolveHiddenResult();
    var hiddenType = hiddenFlow ? getHiddenType(hiddenFlow.hiddenTypeCode) : null;

    state.result = {
      top: hiddenType || standardTop,
      dimensionScores: scores,
      usedHidden: Boolean(hiddenType),
      hiddenNote: hiddenFlow ? hiddenFlow.note : "",
      standardTop: standardTop,
      matches: rankedMatches.slice(0, 3).map(function (match) {
        return Object.assign({}, getType(match.code), {
          match: match.match,
          distance: match.distance,
          exactMatches: match.exactMatches,
        });
      }),
    };

    renderResult();
    showView("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderResult() {
    var top = state.result.top;
    resultCode.textContent = top.code;
    resultName.textContent = top.name;
    resultPoster.src = buildPersonaPosterDataUrl(top, 640, 820);
    resultPoster.alt = top.name + " 人格海报";
    resultTagline.textContent = top.tagline;
    resultDescription.textContent = top.description;
    resultRole.textContent = top.role;
    resultNote.textContent = state.result.hiddenNote || "";
    resultNote.hidden = !state.result.hiddenNote;

    resultTraits.innerHTML = top.traits
      .map(function (trait) {
        return "<li>" + trait + "</li>";
      })
      .join("");

    renderDimensionBars(state.result.dimensionScores);
    renderTopMatches(state.result.matches);
  }

  function renderDimensionBars(scores) {
    dimensionBars.innerHTML = data.dimensions
      .map(function (dimension) {
        var score = scores[dimension.code];
        var width = (score / 3) * 100;
        return (
          '<div class="dimension-row">' +
          '<div class="dimension-label-row">' +
          '<span class="dimension-name">' +
          dimension.code +
          " · " +
          dimension.name +
          "</span>" +
          '<span class="dimension-score">' +
          score.toFixed(2) +
          "</span>" +
          "</div>" +
          '<div class="dimension-track"><div class="dimension-fill" style="width:' +
          width +
          '%"></div></div>' +
          "</div>"
        );
      })
      .join("");
  }

  function renderTopMatches(matches) {
    topMatches.innerHTML = matches
      .map(function (match, index) {
        return (
          '<article class="match-card">' +
          '<img class="match-poster" src="' +
          buildPersonaPosterDataUrl(match, 220, 280) +
          '" alt="' +
          match.name +
          ' 海报">' +
          '<div class="match-copy">' +
          '<div class="match-rank">Top ' +
          (index + 1) +
          "</div>" +
          '<div class="match-code">' +
          match.code +
          "</div>" +
          '<h3 class="match-name">' +
          match.name +
          "</h3>" +
          '<p class="match-tagline">' +
          match.tagline +
          "</p>" +
          '<div class="match-score-row"><span>匹配度</span><strong>' +
          match.match +
          "%</strong></div>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  function buildShareText() {
    var top = state.result.top;
    return [
      "我测出来是「" + top.code + " " + top.name + "」",
      top.tagline,
      top.share,
      state.result.hiddenNote || "",
      "来测测你在团桌上到底是个什么东西。",
    ]
      .filter(Boolean)
      .join("\n");
  }

  function setFeedback(text) {
    copyFeedback.textContent = text;
  }

  function copyShareText() {
    if (!state.result) {
      return;
    }

    var text = buildShareText();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(function () {
          setFeedback("分享文案已复制。");
        })
        .catch(function () {
          setFeedback(text);
        });
      return;
    }

    setFeedback(text);
  }

  function escapeSvg(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function splitText(text, maxChars) {
    var lines = [];
    var normalized = String(text || "");

    if (!normalized) {
      return lines;
    }

    for (var i = 0; i < normalized.length; i += maxChars) {
      lines.push(normalized.slice(i, i + maxChars));
    }

    return lines;
  }

  function svgTextLines(lines, x, y, lineHeight, fontSize, fill, weight) {
    return lines
      .map(function (line, index) {
        return (
          '<text x="' +
          x +
          '" y="' +
          (y + index * lineHeight) +
          '" font-size="' +
          fontSize +
          '" fill="' +
          fill +
          '" font-weight="' +
          (weight || 400) +
          '" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
          escapeSvg(line) +
          "</text>"
        );
      })
      .join("");
  }

  function buildSvgCard() {
    var top = state.result.top;
    var leftX = 84;
    var rightX = 470;
    var posterData = buildPersonaPosterDataUrl(top, 460, 460);
    var traitLines = top.traits.map(function (trait) {
      return "• " + trait;
    });
    var shareLines = splitText(top.share, 19);
    var noteLines = splitText(state.result.hiddenNote || "", 21);
    var descriptionLines = splitText(top.description, 22).slice(0, 8);
    var dimensionSvg = data.dimensions
      .map(function (dimension, index) {
        var score = state.result.dimensionScores[dimension.code];
        var y = 760 + index * 50;
        var width = Math.round((score / 3) * 300);
        return (
          '<text x="' +
          rightX +
          '" y="' +
          y +
          '" font-size="18" fill="#efe6d0" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
          escapeSvg(dimension.code + " · " + dimension.name) +
          "</text>" +
          '<text x="1060" y="' +
          y +
          '" text-anchor="end" font-size="18" fill="#d5b26c" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
          escapeSvg(score.toFixed(2)) +
          "</text>" +
          '<rect x="' +
          rightX +
          '" y="' +
          (y + 14) +
          '" width="300" height="10" rx="5" fill="rgba(255,255,255,0.10)" />' +
          '<rect x="' +
          rightX +
          '" y="' +
          (y + 14) +
          '" width="' +
          width +
          '" height="10" rx="5" fill="#d5b26c" />'
        );
      })
      .join("");

    var matchSvg = state.result.matches
      .map(function (match, index) {
        var y = 1388 + index * 64;
        return (
          '<rect x="' +
          rightX +
          '" y="' +
          y +
          '" width="590" height="52" rx="16" fill="rgba(255,255,255,0.03)" stroke="rgba(231,211,170,0.18)" />' +
          '<text x="' +
          (rightX + 22) +
          '" y="' +
          (y + 22) +
          '" font-size="12" fill="#d5b26c" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">TOP ' +
          (index + 1) +
          '</text>' +
          '<text x="' +
          (rightX + 22) +
          '" y="' +
          (y + 42) +
          '" font-size="20" fill="#efe6d0" font-weight="700" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
          escapeSvg(match.code + " " + match.name) +
          "</text>" +
          '<text x="' +
          (rightX + 566) +
          '" y="' +
          (y + 38) +
          '" text-anchor="end" font-size="15" fill="#b8ac93" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">匹配度 ' +
          match.match +
          '%</text>'
        );
      })
      .join("");

    return [
      '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600">',
      "<defs>",
      '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">',
      '<stop offset="0%" stop-color="#111111"/>',
      '<stop offset="100%" stop-color="#171411"/>',
      "</linearGradient>",
      "</defs>",
      '<rect width="1200" height="1600" fill="url(#bg)"/>',
      '<rect x="56" y="56" width="1088" height="1488" rx="28" fill="rgba(24,24,22,0.92)" stroke="rgba(231,211,170,0.22)"/>',
      '<text x="84" y="118" font-size="18" fill="#d5b26c" letter-spacing="4" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">TABLETOP PERSONALITY EXPERIMENT</text>',
      '<image href="' + posterData + '" x="84" y="154" width="320" height="320" preserveAspectRatio="xMidYMid meet"/>',
      '<text x="470" y="154" font-size="64" fill="#efe6d0" font-weight="700" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
        escapeSvg(top.code + " " + top.name) +
        "</text>",
      svgTextLines(splitText(top.tagline, 20), rightX, 208, 34, 28, "#d5b26c", 600),
      noteLines.length
        ? '<rect x="470" y="248" width="520" height="46" rx="23" fill="rgba(202,106,95,0.14)" stroke="rgba(202,106,95,0.35)" />' +
          svgTextLines(noteLines.slice(0, 1), 490, 278, 24, 16, "#efb9b2", 500)
        : "",
      svgTextLines(descriptionLines, rightX, noteLines.length ? 346 : 300, 34, 22, "#efe6d0", 400),
      '<text x="470" y="' +
        (noteLines.length ? 636 : 590) +
        '" font-size="20" fill="#b8ac93" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
        escapeSvg(top.role) +
        "</text>",
      svgTextLines(traitLines, leftX, 566, 42, 24, "#efe6d0", 500),
      '<text x="84" y="1020" font-size="18" fill="#d5b26c" letter-spacing="4" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">SHARE LINE</text>',
      '<rect x="84" y="1048" width="560" height="' +
        Math.max(86, shareLines.length * 32 + 28) +
        '" rx="22" fill="rgba(213,178,108,0.10)" stroke="rgba(213,178,108,0.26)"/>',
      svgTextLines(shareLines, 108, 1092, 32, 24, "#efe6d0", 600),
      '<text x="470" y="718" font-size="18" fill="#d5b26c" letter-spacing="4" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">DIMENSION MAP</text>',
      dimensionSvg,
      '<text x="470" y="1344" font-size="18" fill="#d5b26c" letter-spacing="4" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">TOP MATCHES</text>',
      matchSvg,
      '<text x="84" y="1498" font-size="18" fill="#b8ac93" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">团桌生物鉴定 · 结果图导出</text>',
      "</svg>",
    ].join("");
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(function () {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function svgToPngBlob(svg, scale) {
    return new Promise(function (resolve, reject) {
      var svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      var url = URL.createObjectURL(svgBlob);
      var image = new Image();

      image.onload = function () {
        var width = 1200;
        var height = 1600;
        var ratio = scale || 2;
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");

        canvas.width = width * ratio;
        canvas.height = height * ratio;

        if (!context) {
          URL.revokeObjectURL(url);
          reject(new Error("Canvas context unavailable"));
          return;
        }

        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.drawImage(image, 0, 0, width, height);

        canvas.toBlob(function (blob) {
          URL.revokeObjectURL(url);
          if (!blob) {
            reject(new Error("PNG export failed"));
            return;
          }
          resolve(blob);
        }, "image/png");
      };

      image.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("SVG image load failed"));
      };

      image.src = url;
    });
  }

  function fallbackSvgDownload(svg) {
    var blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    downloadBlob(blob, "团桌生物鉴定-" + state.result.top.code + ".svg");
    setFeedback("PNG 生成失败，已回退导出 SVG。\n如果你需要发群，SVG 也可以直接发。\n");
  }

  function downloadShareCard() {
    if (!state.result) {
      return;
    }

    var svg = buildSvgCard();
    downloadButton.disabled = true;
    setFeedback("正在生成 PNG 结果图...");

    svgToPngBlob(svg, 2)
      .then(function (blob) {
        downloadBlob(blob, "团桌生物鉴定-" + state.result.top.code + ".png");
        setFeedback("PNG 结果图已导出。");
      })
      .catch(function () {
        fallbackSvgDownload(svg);
      })
      .finally(function () {
        downloadButton.disabled = false;
      });
  }

  startButton.addEventListener("click", startQuiz);
  restartInlineButton.addEventListener("click", restartQuiz);
  prevButton.addEventListener("click", goPrev);
  nextButton.addEventListener("click", goNext);
  restartButton.addEventListener("click", restartQuiz);
  copyButton.addEventListener("click", copyShareText);
  downloadButton.addEventListener("click", downloadShareCard);

  renderHome();
  renderAtlas();
})();
