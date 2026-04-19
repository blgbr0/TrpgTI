(function () {
  var data = window.RPG_PERSONALITY_TEST;

  if (!data || !data.axes || !data.questions || !data.results) {
    return;
  }

  var state = {
    currentIndex: 0,
    answers: data.questions.map(function () {
      return null;
    }),
    result: null,
  };

  var resultLookup = data.results.reduce(function (acc, item) {
    acc[item.code] = item;
    return acc;
  }, {});
  var resultSlugLookup = data.results.reduce(function (acc, item) {
    acc[item.slug] = item;
    return acc;
  }, {});
  var resultShortLookup = data.results.reduce(function (acc, item) {
    acc[item.shortCode] = item;
    return acc;
  }, {});

  var tagMetaList = [];
  var tagLookup = {};

  data.axes.forEach(function (axis) {
    [
      { axis: axis, side: axis.left, label: axis.left.label },
      { axis: axis, side: axis.right, label: axis.right.label },
    ].forEach(function (item) {
      tagMetaList.push(item);
      tagLookup[item.label] = item;
    });
  });

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
  var resultTraits = document.getElementById("result-traits");
  var axisResults = document.getElementById("axis-results");
  var tagCounts = document.getElementById("tag-counts");
  var copyButton = document.getElementById("copy-button");
  var copyLinkButton = document.getElementById("copy-link-button");
  var downloadButton = document.getElementById("download-button");
  var restartButton = document.getElementById("restart-button");
  var copyFeedback = document.getElementById("copy-feedback");
  var atlasGrid = document.getElementById("atlas-grid");

  function showView(viewName) {
    homeView.hidden = viewName !== "home";
    quizView.hidden = viewName !== "quiz";
    resultView.hidden = viewName !== "result";
  }

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

  function getResultImagePath(item) {
    var entry = item.entry || item;
    return entry.slug ? "./assets/personas/" + entry.slug + ".png" : "";
  }

  function applyPosterFallback(image) {
    if (!image || !image.dataset || !image.dataset.fallback) {
      return;
    }

    image.onerror = null;
    image.src = image.dataset.fallback;
  }

  function hydratePosterImages(root) {
    Array.prototype.forEach.call(root.querySelectorAll(".js-poster"), function (image) {
      image.onerror = function () {
        applyPosterFallback(image);
      };
    });
  }

  function setPosterImage(image, item, width, height) {
    var fallback = buildPosterDataUrl(item, width, height);
    var imagePath = getResultImagePath(item);

    image.dataset.fallback = fallback;
    image.onerror = function () {
      applyPosterFallback(image);
    };
    image.src = imagePath || fallback;
  }

  function getBasePageUrl() {
    return window.location.origin + window.location.pathname;
  }

  function getResultParamValue(result) {
    var entry = result.entry || result;
    return entry.slug || entry.shortCode || entry.code;
  }

  function buildResultLink(result) {
    return getBasePageUrl() + "?result=" + encodeURIComponent(getResultParamValue(result));
  }

  function writeUrl(url) {
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, "", url);
    }
  }

  function clearResultUrl() {
    writeUrl(getBasePageUrl());
  }

  function syncResultUrl(result) {
    writeUrl(buildResultLink(result));
  }

  function renderAtlas(activeCode) {
    atlasGrid.innerHTML = data.results
      .map(function (item) {
        var activeClass = activeCode === item.code ? " is-active" : "";
        var hasContent = Boolean(item.name && item.description);
        var fallback = buildPosterDataUrl(item, 480, 620);
        return (
          '<article class="atlas-card' +
          activeClass +
          '">' +
          '<img class="atlas-poster js-poster" src="' +
          getResultImagePath(item) +
          '" data-fallback="' +
          fallback +
          '" alt="' +
          item.shortCode +
          ' 人格海报">' +
          '<div class="atlas-copy">' +
          '<div class="atlas-code">' +
          item.shortCode +
          "</div>" +
          '<h3 class="atlas-name">' +
          (item.name || "未命名结果") +
          "</h3>" +
          '<p class="atlas-tagline">' +
          item.code +
          "</p>" +
          '<p class="atlas-role">' +
          (hasContent ? item.tagline : "该代码暂未配置完整文案。") +
          "</p>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");

    hydratePosterImages(atlasGrid);
  }

  function startQuiz() {
    state.currentIndex = 0;
    state.answers = data.questions.map(function () {
      return null;
    });
    state.result = null;
    clearResultUrl();
    setFeedback("");
    renderQuestion();
    renderAtlas("");
    showView("quiz");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function restartQuiz() {
    startQuiz();
  }

  function renderQuestion() {
    var question = data.questions[state.currentIndex];
    var answer = state.answers[state.currentIndex];
    var progress = ((state.currentIndex + 1) / data.questions.length) * 100;

    questionCounter.textContent = "第 " + (state.currentIndex + 1) + " 题";
    questionDimension.textContent = "第 " + question.part + " 部分 · " + question.section;
    questionDimension.title = data.meta.tieBreakerRule;
    questionText.textContent = question.text;
    progressBar.style.width = progress + "%";

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
      state.currentIndex === data.questions.length - 1 ? "生成结果" : "下一题";
  }

  function selectAnswer(optionIndex) {
    var question = data.questions[state.currentIndex];
    var option = question.options[optionIndex];

    state.answers[state.currentIndex] = {
      questionId: question.id,
      optionIndex: optionIndex,
      label: option.label,
      tags: option.tags.slice(),
    };

    if (state.currentIndex === data.questions.length - 1) {
      finishQuiz();
      return;
    }

    state.currentIndex += 1;
    renderQuestion();
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

    if (state.currentIndex === data.questions.length - 1) {
      finishQuiz();
      return;
    }

    state.currentIndex += 1;
    renderQuestion();
  }

  function buildEmptyTagCounts() {
    return tagMetaList.reduce(function (acc, item) {
      acc[item.label] = 0;
      return acc;
    }, {});
  }

  function resolveAxisWinner(axis, counts, lastTagByAxis) {
    var leftCount = counts[axis.left.label];
    var rightCount = counts[axis.right.label];
    var isTie = leftCount === rightCount;
    var winner = leftCount > rightCount ? axis.left : axis.right;

    if (isTie) {
      winner = lastTagByAxis[axis.code] === axis.left.label ? axis.left : axis.right;
    }

    return {
      axis: axis,
      leftCount: leftCount,
      rightCount: rightCount,
      winner: winner,
      isTie: isTie,
      total: leftCount + rightCount,
      note: isTie
        ? axis.name + "平票（" + leftCount + ":" + rightCount + "），按最后一次相关选择判定为「" + winner.label + "」。"
        : "",
    };
  }

  function computeResult() {
    var counts = buildEmptyTagCounts();
    var lastTagByAxis = {};

    state.answers.forEach(function (answer) {
      if (!answer) {
        return;
      }

      answer.tags.forEach(function (tag) {
        counts[tag] += 1;
        lastTagByAxis[tagLookup[tag].axis.code] = tag;
      });
    });

    var axisBreakdown = data.axes.map(function (axis) {
      return resolveAxisWinner(axis, counts, lastTagByAxis);
    });

    var code = axisBreakdown
      .map(function (item) {
        return item.winner.label;
      })
      .join("·");

    var resultEntry = resultLookup[code];
    var tieNotes = axisBreakdown
      .map(function (item) {
        return item.note;
      })
      .filter(Boolean);

    return {
      code: code,
      shortCode: resultEntry ? resultEntry.shortCode : code.replace(/·/g, ""),
      entry: resultEntry || null,
      axisBreakdown: axisBreakdown,
      tagCounts: counts,
      tieNotes: tieNotes,
      sharedOnly: false,
    };
  }

  function buildSharedResult(entry) {
    var labels = entry.code.split("·");

    return {
      code: entry.code,
      shortCode: entry.shortCode,
      entry: entry,
      axisBreakdown: data.axes.map(function (axis, index) {
        var winner = labels[index] === axis.left.label ? axis.left : axis.right;
        return {
          axis: axis,
          leftCount: null,
          rightCount: null,
          winner: winner,
          isTie: false,
          total: null,
          note: "",
        };
      }),
      tagCounts: buildEmptyTagCounts(),
      tieNotes: [],
      sharedOnly: true,
    };
  }

  function finishQuiz() {
    state.result = computeResult();
    syncResultUrl(state.result);
    renderResult();
    showView("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildResultSummary(result) {
    if (!result) {
      return "";
    }

    return (
      "你的四轴代码已经确定为「" +
      result.code +
      "」。当前这条结果走的是回退展示，所以先返回代码、各轴计数和标签分布。"
    );
  }

  function buildAxisSummaryLines(result) {
    return result.axisBreakdown.map(function (item) {
      var summary =
        item.axis.name +
        "：" +
        item.winner.label +
        "（" +
        item.leftCount +
        " : " +
        item.rightCount +
        "）";

      if (item.isTie) {
        summary += "，平票按最后一次相关选择判定。";
      }

      return summary;
    });
  }

  function renderResult() {
    var result = state.result;
    var entry = result.entry || {};
    var detailLines =
      entry.traits && entry.traits.length ? entry.traits : buildAxisSummaryLines(result);
    var noteText = "";

    if (result.sharedOnly) {
      noteText = "这是一个可直接分享的人格结果页，未携带原始作答计分。重新作答可查看完整过程。";
    } else if (result.tieNotes.length) {
      noteText = result.tieNotes.join(" ");
    } else if (!entry.name || !entry.description) {
      noteText = data.meta.placeholderNote;
    }

    resultCode.textContent = result.shortCode;
    resultName.textContent = entry.name || "未命名人格";
    resultName.classList.toggle("is-placeholder", !entry.name);
    setPosterImage(resultPoster, entry.code ? entry : result, 640, 820);
    resultPoster.alt = result.shortCode + " 结果海报";
    resultTagline.textContent = entry.tagline || result.code;
    resultNote.textContent = noteText;
    resultNote.hidden = !noteText;
    resultDescription.textContent = entry.description || buildResultSummary(result);

    resultTraits.innerHTML = detailLines
      .map(function (line) {
        return "<li>" + line + "</li>";
      })
      .join("");

    renderAxisBreakdown(result.axisBreakdown);
    renderTagCounts(result.tagCounts, result.axisBreakdown);
    renderAtlas(result.code);
  }

  function renderAxisBreakdown(items) {
    axisResults.innerHTML = items
      .map(function (item) {
        var hasCounts = typeof item.leftCount === "number" && typeof item.rightCount === "number";
        var leftWidth = hasCounts && item.total ? (item.leftCount / item.total) * 100 : 50;
        var rightWidth = hasCounts && item.total ? (item.rightCount / item.total) * 100 : 50;
        return (
          '<article class="axis-card">' +
          '<div class="axis-card-header">' +
          '<div><p class="axis-card-kicker">' +
          item.axis.name +
          '</p><h3 class="axis-card-title">' +
          item.winner.label +
          "</h3></div>" +
          '<span class="axis-card-total">' +
          (hasCounts ? item.leftCount + " : " + item.rightCount : "分享结果") +
          "</span>" +
          "</div>" +
          '<div class="axis-side-row"><span>' +
          item.axis.left.label +
          "</span><span>" +
          item.axis.right.label +
          "</span></div>" +
          '<div class="axis-meter">' +
          '<div class="axis-meter-left" style="width:' +
          leftWidth +
          '%"></div>' +
          '<div class="axis-meter-right" style="width:' +
          rightWidth +
          '%"></div>' +
          "</div>" +
          '<p class="axis-card-note">' +
          (hasCounts
            ? item.isTie
              ? "平票，按最后一次相关选择判定。"
              : item.axis.description
            : "该分享页只锁定了最终轴向，不包含原始答题计分。") +
          "</p>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderTagCounts(countMap, axisBreakdown) {
    if (state.result && state.result.sharedOnly) {
      tagCounts.innerHTML =
        '<div class="shared-panel">' +
        '<p class="shared-panel-kicker">分享模式</p>' +
        '<h3 class="shared-panel-title">这条链接只展示人格结果</h3>' +
        '<p class="shared-panel-copy">8 个标签的原始计数没有跟着链接一起分享。想看完整计分过程，需要重新作答一次。</p>' +
        "</div>";
      return;
    }

    var winnerMap = axisBreakdown.reduce(function (acc, item) {
      acc[item.winner.label] = true;
      return acc;
    }, {});

    tagCounts.innerHTML =
      '<div class="tag-cloud">' +
      tagMetaList
        .map(function (item) {
          var activeClass = winnerMap[item.label] ? " is-active" : "";
          return (
            '<div class="tag-chip' +
            activeClass +
            '">' +
            '<span class="tag-chip-name">' +
            item.label +
            "</span>" +
            '<span class="tag-chip-axis">' +
            item.axis.name +
            "</span>" +
            '<strong class="tag-chip-count">' +
            countMap[item.label] +
            "</strong>" +
            "</div>"
          );
        })
        .join("") +
      "</div>";
  }

  function buildShareText() {
    if (!state.result) {
      return "";
    }

    var result = state.result;
    var entry = result.entry || {};
    var summary = result.axisBreakdown
      .map(function (item) {
        if (typeof item.leftCount === "number" && typeof item.rightCount === "number") {
          return item.axis.name + " " + item.leftCount + ":" + item.rightCount + " → " + item.winner.label;
        }
        return item.axis.name + " → " + item.winner.label;
      })
      .join("；");

    return [
      "我测出来是：" + result.code + (entry.name ? "【" + entry.name + "】" : ""),
      entry.tagline || "",
      entry.description || "",
      "四轴计数：" + summary,
      result.tieNotes.join(" "),
      "结果链接：" + buildResultLink(result),
    ]
      .filter(Boolean)
      .join("\n");
  }

  function setFeedback(text) {
    copyFeedback.textContent = text;
  }

  function copyUsingTextarea(text) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "readonly");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  function copyShareText() {
    var text = buildShareText();

    if (!text) {
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(function () {
          setFeedback("分享文案已复制。");
        })
        .catch(function () {
          copyUsingTextarea(text);
          setFeedback("分享文案已复制。");
        });
      return;
    }

    copyUsingTextarea(text);
    setFeedback("分享文案已复制。");
  }

  function copyResultLink() {
    if (!state.result) {
      return;
    }

    var text = buildResultLink(state.result);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(function () {
          setFeedback("结果链接已复制。");
        })
        .catch(function () {
          copyUsingTextarea(text);
          setFeedback("结果链接已复制。");
        });
      return;
    }

    copyUsingTextarea(text);
    setFeedback("结果链接已复制。");
  }

  function escapeSvg(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
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

  function svgTextLines(lines, x, y, lineHeight, fontSize, fill, weight, anchor) {
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
          '" text-anchor="' +
          (anchor || "start") +
          '" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
          escapeSvg(line) +
          "</text>"
        );
      })
      .join("");
  }

  function buildPosterSvg(item, width, height) {
    var entry = item.entry || item;
    var code = entry.code || item.code || "";
    var shortCode = entry.shortCode || item.shortCode || code.replace(/·/g, "");
    var name = entry.name || "未命名结果";
    var subText = entry.tagline || "先保留代码位，后续补人格文案";
    var labels = code.split("·");
    var gradientId = "poster-" + shortCode;
    var chips = data.axes
      .map(function (axis, index) {
        var y = 270 + index * 62;
        return (
          '<rect x="40" y="' +
          y +
          '" width="' +
          (width - 80) +
          '" height="46" rx="16" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)"/>' +
          '<text x="62" y="' +
          (y + 29) +
          '" font-size="18" fill="#b8ac93" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
          escapeSvg(axis.name) +
          "</text>" +
          '<text x="' +
          (width - 62) +
          '" y="' +
          (y + 29) +
          '" font-size="22" fill="#efe6d0" text-anchor="end" font-weight="700" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
          escapeSvg(labels[index] || "") +
          "</text>"
        );
      })
      .join("");

    return [
      '<svg xmlns="http://www.w3.org/2000/svg" width="' +
        width +
        '" height="' +
        height +
        '" viewBox="0 0 ' +
        width +
        " " +
        height +
        '">',
      "<defs>",
      '<linearGradient id="' +
        gradientId +
        '" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1a1713"/><stop offset="100%" stop-color="#111111"/></linearGradient>',
      "</defs>",
      '<rect width="' + width + '" height="' + height + '" rx="32" fill="url(#' + gradientId + ')"/>',
      '<rect x="16" y="16" width="' +
        (width - 32) +
        '" height="' +
        (height - 32) +
        '" rx="24" fill="rgba(24,24,22,0.92)" stroke="rgba(231,211,170,0.22)"/>',
      '<text x="' +
        width / 2 +
        '" y="92" font-size="16" fill="#d5b26c" letter-spacing="4" text-anchor="middle" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">TABLETOP CODE</text>',
      '<text x="' +
        width / 2 +
        '" y="174" font-size="58" fill="#efe6d0" font-weight="700" text-anchor="middle" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
        escapeSvg(shortCode) +
        "</text>",
      '<text x="' +
        width / 2 +
        '" y="214" font-size="30" fill="#efe6d0" font-weight="700" text-anchor="middle" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
        escapeSvg(name) +
        "</text>",
      svgTextLines(splitText(code, 12), width / 2, 252, 28, 24, "#d5b26c", 500, "middle"),
      chips,
      '<rect x="40" y="' +
        (height - 120) +
        '" width="' +
        (width - 80) +
        '" height="64" rx="20" fill="rgba(213,178,108,0.10)" stroke="rgba(213,178,108,0.22)"/>',
      '<text x="' +
        width / 2 +
        '" y="' +
        (height - 82) +
        '" font-size="18" fill="#efe6d0" text-anchor="middle" font-weight="700" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
        escapeSvg(entry.name ? "专属台词" : "未配置结果") +
        "</text>",
      svgTextLines(splitText(subText, 16).slice(0, 2), width / 2, height - 56, 20, 14, "#b8ac93", 400, "middle"),
      "</svg>",
    ].join("");
  }

  function buildPosterDataUrl(item, width, height) {
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(buildPosterSvg(item, width, height));
  }

  function buildShareCardSvg() {
    var result = state.result;
    var entry = result.entry || {};
    var rightX = 470;
    var codeStartY = entry.name ? 322 : 280;
    var axisSvg = result.axisBreakdown
      .map(function (item, index) {
        var y = 708 + index * 86;
        var leftWidth = item.total ? Math.round((item.leftCount / item.total) * 300) : 150;
        var rightWidth = 300 - leftWidth;
        return (
          '<text x="' +
          rightX +
          '" y="' +
          y +
          '" font-size="20" fill="#efe6d0" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
          escapeSvg(item.axis.name + " · " + item.winner.label) +
          "</text>" +
          '<text x="1060" y="' +
          y +
          '" text-anchor="end" font-size="18" fill="#b8ac93" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
          item.leftCount +
          " : " +
          item.rightCount +
          "</text>" +
          '<rect x="' +
          rightX +
          '" y="' +
          (y + 18) +
          '" width="300" height="12" rx="6" fill="rgba(255,255,255,0.08)"/>' +
          '<rect x="' +
          rightX +
          '" y="' +
          (y + 18) +
          '" width="' +
          leftWidth +
          '" height="12" rx="6" fill="#d5b26c"/>' +
          '<rect x="' +
          (rightX + leftWidth) +
          '" y="' +
          (y + 18) +
          '" width="' +
          rightWidth +
          '" height="12" rx="6" fill="#7fb08f"/>'
        );
      })
      .join("");

    var tagSvg = tagMetaList
      .map(function (item, index) {
        var x = 84 + (index % 4) * 150;
        var y = 1100 + Math.floor(index / 4) * 94;
        var count = result.tagCounts[item.label];
        var active = result.axisBreakdown.some(function (axisItem) {
          return axisItem.winner.label === item.label;
        });
        return (
          '<rect x="' +
          x +
          '" y="' +
          y +
          '" width="128" height="70" rx="18" fill="' +
          (active ? "rgba(213,178,108,0.14)" : "rgba(255,255,255,0.03)") +
          '" stroke="' +
          (active ? "rgba(213,178,108,0.28)" : "rgba(255,255,255,0.10)") +
          '"/>' +
          '<text x="' +
          (x + 20) +
          '" y="' +
          (y + 26) +
          '" font-size="15" fill="#b8ac93" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
          escapeSvg(item.axis.name) +
          "</text>" +
          '<text x="' +
          (x + 20) +
          '" y="' +
          (y + 54) +
          '" font-size="28" fill="#efe6d0" font-weight="700" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
          escapeSvg(item.label) +
          "</text>" +
          '<text x="' +
          (x + 108) +
          '" y="' +
          (y + 54) +
          '" text-anchor="end" font-size="24" fill="#d5b26c" font-weight="700" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
          count +
          "</text>"
        );
      })
      .join("");

    var tieLines = result.tieNotes.length ? result.tieNotes : [data.meta.tieBreakerRule];

    return [
      '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600">',
      "<defs>",
      '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#121212"/><stop offset="100%" stop-color="#1a1713"/></linearGradient>',
      "</defs>",
      '<rect width="1200" height="1600" fill="url(#bg)"/>',
      '<rect x="56" y="56" width="1088" height="1488" rx="28" fill="rgba(24,24,22,0.92)" stroke="rgba(231,211,170,0.22)"/>',
      '<image href="' +
        buildPosterDataUrl(result, 420, 580) +
        '" x="84" y="154" width="320" height="440" preserveAspectRatio="xMidYMid meet"/>',
      '<text x="470" y="154" font-size="18" fill="#d5b26c" letter-spacing="4" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">TABLETOP RESULT CODE</text>',
      '<text x="470" y="232" font-size="64" fill="#efe6d0" font-weight="700" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
        escapeSvg(result.shortCode) +
        "</text>",
      entry.name
        ? '<text x="470" y="276" font-size="30" fill="#efe6d0" font-weight="700" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
          escapeSvg(entry.name) +
          "</text>"
        : "",
      svgTextLines(splitText(result.code, 14), 470, codeStartY, 32, 28, "#d5b26c", 600),
      '<rect x="470" y="360" width="548" height="88" rx="20" fill="rgba(213,178,108,0.10)" stroke="rgba(213,178,108,0.22)"/>',
      svgTextLines(splitText(entry.tagline || data.meta.placeholderNote, 24).slice(0, 2), 494, 392, 24, 18, "#efe6d0", 500),
      svgTextLines(splitText(entry.description || buildResultSummary(result), 24), 470, 502, 34, 22, "#efe6d0", 400),
      '<text x="470" y="670" font-size="18" fill="#d5b26c" letter-spacing="4" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">AXIS BREAKDOWN</text>',
      axisSvg,
      '<text x="84" y="1060" font-size="18" fill="#d5b26c" letter-spacing="4" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">TAG COUNTS</text>',
      tagSvg,
      '<text x="84" y="1328" font-size="18" fill="#d5b26c" letter-spacing="4" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">RULES</text>',
      svgTextLines(tieLines, 84, 1372, 34, 22, "#efe6d0", 400),
      '<text x="84" y="1498" font-size="18" fill="#b8ac93" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">团桌生物鉴定 · 新版题库结果图导出</text>',
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
    downloadBlob(
      new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
      "团桌生物鉴定-" + state.result.shortCode + ".svg"
    );
    setFeedback("PNG 生成失败，已回退导出 SVG。");
  }

  function downloadShareCard() {
    if (!state.result) {
      return;
    }

    var svg = buildShareCardSvg();
    downloadButton.disabled = true;
    setFeedback("正在生成 PNG 结果图...");

    svgToPngBlob(svg, 2)
      .then(function (blob) {
        downloadBlob(blob, "团桌生物鉴定-" + state.result.shortCode + ".png");
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
  copyButton.addEventListener("click", copyShareText);
  copyLinkButton.addEventListener("click", copyResultLink);
  downloadButton.addEventListener("click", downloadShareCard);
  restartButton.addEventListener("click", restartQuiz);

  function bootstrapSharedResult() {
    var params = new URLSearchParams(window.location.search);
    var resultParam = params.get("result");
    var entry;

    if (!resultParam) {
      return false;
    }

    entry =
      resultSlugLookup[resultParam] ||
      resultShortLookup[resultParam] ||
      resultLookup[resultParam] ||
      null;

    if (!entry) {
      return false;
    }

    state.result = buildSharedResult(entry);
    renderResult();
    renderAtlas(entry.code);
    showView("result");
    return true;
  }

  renderHome();
  if (!bootstrapSharedResult()) {
    renderAtlas("");
  }
})();
