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
    advanceTimer: null,
  };
  var STORAGE_KEY = "trpgti.quiz-progress.v1";
  var feedbackTimer = null;
  var posterObserver = null;

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
  var metaDescription = document.querySelector('meta[name="description"]');
  var atlasGrid = document.getElementById("atlas-grid");
  var startButton = document.getElementById("start-button");
  var continueButton = document.getElementById("continue-button");
  var resumeNote = document.getElementById("resume-note");
  var restartInlineButton = document.getElementById("restart-inline-button");
  var quitButton = document.getElementById("quit-button");
  var questionCounter = document.getElementById("question-counter");
  var questionDimension = document.getElementById("question-dimension");
  var quizProgressValue = document.getElementById("quiz-progress-value");
  var questionText = document.getElementById("question-text");
  var questionOptions = document.getElementById("question-options");
  var progressBar = document.getElementById("progress-bar");
  var prevButton = document.getElementById("prev-button");
  var resultHomeLink = document.getElementById("result-home-link");
  var resultCode = document.getElementById("result-code");
  var resultName = document.getElementById("result-name");
  var resultQuote = document.getElementById("result-quote");
  var resultPoster = document.getElementById("result-poster");
  var resultNote = document.getElementById("result-note");
  var copyButton = document.getElementById("copy-button");
  var copyLinkButton = document.getElementById("copy-link-button");
  var downloadButton = document.getElementById("download-button");
  var restartButton = document.getElementById("restart-button");
  var copyFeedback = document.getElementById("copy-feedback");
  var resultProfile = document.getElementById("result-profile");
  var axisResults = document.getElementById("axis-results");
  var tagCounts = document.getElementById("tag-counts");
  var profilePanel = document.getElementById("profile-panel");
  var axisPanel = document.getElementById("axis-panel");
  var tagPanel = document.getElementById("tag-panel");

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showView(viewName) {
    homeView.hidden = viewName !== "home";
    quizView.hidden = viewName !== "quiz";
    resultView.hidden = viewName !== "result";
    document.body.setAttribute("data-view", viewName);
  }

  function clearPendingAdvance() {
    if (state.advanceTimer) {
      window.clearTimeout(state.advanceTimer);
      state.advanceTimer = null;
    }
  }

  function setFeedback(text, tone, persist) {
    if (feedbackTimer) {
      window.clearTimeout(feedbackTimer);
      feedbackTimer = null;
    }

    copyFeedback.textContent = text;
    copyFeedback.classList.remove("is-info", "is-success", "is-warning");

    if (tone) {
      copyFeedback.classList.add("is-" + tone);
    }

    if (!persist && text) {
      feedbackTimer = window.setTimeout(function () {
        feedbackTimer = null;
        resetFeedback();
      }, 2200);
    }
  }

  function getBasePageUrl() {
    return window.location.origin + window.location.pathname;
  }

  function writeUrl(url) {
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, "", url);
    }
  }

  function clearResultUrl() {
    writeUrl(getBasePageUrl());
  }

  function getQuestionCount() {
    return data.questions.length;
  }

  function getVisibleResultCount() {
    return data.results.filter(function (item) {
      return !item.hidden;
    }).length;
  }

  function getHeroSubtitleText() {
    return data.meta.subtitle || getQuestionCount() + " 题，测出你的团桌职业";
  }

  function getMetaDescriptionText() {
    return (
      getQuestionCount() +
      "题测出你的跑团职业人格。基于新版题库的静态人格测试，映射到 " +
      getVisibleResultCount() +
      " 种跑团职业结果。"
    );
  }

  function getDefaultFeedbackText() {
    if (!state.result) {
      return "";
    }

    if (state.result.sharedOnly) {
      return "这是分享页版本，可直接导出结果图或复制链接。";
    }

    return "建议先导出结果图，再复制文案或结果链接。";
  }

  function resetFeedback() {
    var defaultText = getDefaultFeedbackText();
    setFeedback(defaultText, defaultText ? "info" : "", true);
  }

  function createAnswerRecord(question, optionIndex) {
    var option = question.options[optionIndex];

    if (!option) {
      return null;
    }

    return {
      questionId: question.id,
      optionIndex: optionIndex,
      label: option.label,
      tags: option.tags.slice(),
    };
  }

  function getAnsweredCount(answers) {
    return answers.filter(Boolean).length;
  }

  function clearSavedProgress() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {}
  }

  function readSavedProgress() {
    var raw;
    var saved;
    var optionIndexes;

    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null;
    }

    if (!raw) {
      return null;
    }

    try {
      saved = JSON.parse(raw);
    } catch (error) {
      clearSavedProgress();
      return null;
    }

    if (
      !saved ||
      saved.version !== 1 ||
      !Array.isArray(saved.optionIndexes) ||
      saved.optionIndexes.length !== getQuestionCount() ||
      typeof saved.currentIndex !== "number" ||
      saved.currentIndex < 0 ||
      saved.currentIndex >= getQuestionCount()
    ) {
      clearSavedProgress();
      return null;
    }

    optionIndexes = saved.optionIndexes.map(function (optionIndex, index) {
      if (optionIndex === null) {
        return null;
      }

      if (typeof optionIndex !== "number" || optionIndex < 0 || optionIndex >= data.questions[index].options.length) {
        return "__INVALID__";
      }

      return optionIndex;
    });

    if (optionIndexes.indexOf("__INVALID__") > -1) {
      clearSavedProgress();
      return null;
    }

    saved.optionIndexes = optionIndexes;
    return saved;
  }

  function saveQuizProgress() {
    var answeredCount = getAnsweredCount(state.answers);
    var payload;

    try {
      if (!window.localStorage) {
        return;
      }
    } catch (error) {
      return;
    }

    if (!answeredCount || answeredCount >= getQuestionCount()) {
      clearSavedProgress();
      return;
    }

    payload = {
      version: 1,
      currentIndex: Math.max(0, Math.min(state.currentIndex, getQuestionCount() - 1)),
      optionIndexes: state.answers.map(function (answer) {
        return answer ? answer.optionIndex : null;
      }),
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {}
  }

  function refreshResumeEntry() {
    var saved = readSavedProgress();
    var answeredCount;
    var nextQuestion;

    if (!continueButton || !resumeNote) {
      return;
    }

    if (!saved) {
      continueButton.hidden = true;
      resumeNote.hidden = true;
      resumeNote.textContent = "";
      return;
    }

    answeredCount = saved.optionIndexes.filter(function (item) {
      return item !== null;
    }).length;

    if (!answeredCount || answeredCount >= getQuestionCount()) {
      continueButton.hidden = true;
      resumeNote.hidden = true;
      resumeNote.textContent = "";
      clearSavedProgress();
      return;
    }

    nextQuestion = Math.min(saved.currentIndex + 1, getQuestionCount());
    continueButton.hidden = false;
    continueButton.textContent = "继续第 " + nextQuestion + " 题";
    resumeNote.hidden = false;
    resumeNote.textContent = "已答 " + answeredCount + " / " + getQuestionCount() + "，进度只保存在当前浏览器。";
  }

  function resumeSavedQuiz() {
    var saved = readSavedProgress();

    if (!saved) {
      refreshResumeEntry();
      return;
    }

    state.answers = saved.optionIndexes.map(function (optionIndex, index) {
      if (optionIndex === null) {
        return null;
      }

      return createAnswerRecord(data.questions[index], optionIndex);
    });
    state.currentIndex = Math.max(0, Math.min(saved.currentIndex || 0, getQuestionCount() - 1));
    state.result = null;
    clearResultUrl();
    setFeedback("", "", true);
    renderQuestion();
    showView("quiz");
    scrollToTop();
  }

  function bootstrapSavedProgress() {
    if (!readSavedProgress()) {
      return false;
    }

    resumeSavedQuiz();
    return true;
  }

  function ensurePosterObserver() {
    if (posterObserver || !window.IntersectionObserver) {
      return posterObserver;
    }

    posterObserver = new window.IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }

          loadDeferredPoster(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "220px 0px" }
    );

    return posterObserver;
  }

  function loadDeferredPoster(image) {
    var actualSrc = image.getAttribute("data-src");

    if (!actualSrc) {
      return;
    }

    image.src = actualSrc;
    image.removeAttribute("data-src");
  }

  function getResultParamValue(result) {
    var entry = result.entry || result;
    return entry.slug || entry.shortCode || entry.code;
  }

  function buildResultLink(result) {
    return getBasePageUrl() + "?result=" + encodeURIComponent(getResultParamValue(result));
  }

  function syncResultUrl(result) {
    writeUrl(buildResultLink(result));
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function getQuestionAxisCodes(question) {
    var seen = {};

    question.options.forEach(function (option) {
      option.tags.forEach(function (tag) {
        var meta = tagLookup[tag];
        if (meta) {
          seen[meta.axis.code] = true;
        }
      });
    });

    return data.axes
      .filter(function (axis) {
        return seen[axis.code];
      })
      .map(function (axis) {
        return axis.code;
      });
  }

  function renderHome() {
    heroTitle.textContent = data.meta.title;
    heroSubtitle.textContent = getHeroSubtitleText();
    if (metaDescription) {
      metaDescription.setAttribute("content", getMetaDescriptionText());
    }
    renderAtlas("");
    refreshResumeEntry();
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
    var observer = ensurePosterObserver();

    Array.prototype.forEach.call(root.querySelectorAll(".js-poster"), function (image) {
      image.onerror = function () {
        applyPosterFallback(image);
      };

      if (image.dataset.src) {
        if (observer) {
          observer.observe(image);
        } else {
          loadDeferredPoster(image);
        }
      }
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

  function buildPersonaCard(item, variant, activeCode) {
    var cardClass = "atlas-card";
    var posterClass = "atlas-poster";
    var contentClass = "atlas-copy";
    var metaClass = "atlas-meta";
    var nameClass = "atlas-name";
    var fallback = buildPosterDataUrl(item, 480, 620);
    var activeClass = activeCode === item.code ? " is-active" : "";

    return (
      '<button class="' +
      cardClass +
      activeClass +
      '" type="button" data-result="' +
      escapeHtml(item.slug) +
      '">' +
      '<img class="' +
      posterClass +
      ' js-poster" src="' +
      escapeHtml(fallback) +
      '" data-src="' +
      escapeHtml(getResultImagePath(item)) +
      '" data-fallback="' +
      escapeHtml(fallback) +
      '" loading="lazy" decoding="async" fetchpriority="low" alt="' +
      escapeHtml(item.name) +
      ' 人格海报">' +
      '<div class="' +
      contentClass +
      '">' +
      '<div class="' +
      metaClass +
      '">' +
      '<span>' +
      escapeHtml(item.shortCode) +
      "</span>" +
      "</div>" +
      '<h3 class="' +
      nameClass +
      '">' +
      escapeHtml(item.name) +
      "</h3>" +
      "</div>" +
      "</button>"
    );
  }

  function renderAtlas(activeCode) {
    atlasGrid.innerHTML = data.results
      .filter(function (item) { return !item.hidden; })
      .map(function (item) {
        return buildPersonaCard(item, "atlas", activeCode);
      })
      .join("");

    hydratePosterImages(atlasGrid);
  }

  function createEmptyAnswers() {
    return data.questions.map(function () {
      return null;
    });
  }

  function startQuiz() {
    clearPendingAdvance();
    clearSavedProgress();
    state.currentIndex = 0;
    state.answers = createEmptyAnswers();
    state.result = null;
    clearResultUrl();
    setFeedback("", "", true);
    renderQuestion();
    showView("quiz");
    scrollToTop();
  }

  function exitQuiz() {
    clearPendingAdvance();
    clearResultUrl();
    showView("home");
    refreshResumeEntry();
    scrollToTop();
  }

  function renderQuestion() {
    var question = data.questions[state.currentIndex];
    var answer = state.answers[state.currentIndex];
    var progress = ((state.currentIndex + 1) / data.questions.length) * 100;

    questionCounter.textContent = "第 " + (state.currentIndex + 1) + " 题";
    questionDimension.textContent = "第 " + question.part + " 部分 · " + question.section;
    quizProgressValue.textContent = state.currentIndex + 1 + " / " + data.questions.length;
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
          escapeHtml(option.label) +
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
    saveQuizProgress();
  }

  function selectAnswer(optionIndex) {
    var question = data.questions[state.currentIndex];

    clearPendingAdvance();

    state.answers[state.currentIndex] = createAnswerRecord(question, optionIndex);

    renderQuestion();

    state.advanceTimer = window.setTimeout(function () {
      state.advanceTimer = null;

      if (state.currentIndex === data.questions.length - 1) {
        finishQuiz();
        return;
      }

      state.currentIndex += 1;
      renderQuestion();
    }, 140);
  }

  function goPrev() {
    if (state.currentIndex === 0) {
      return;
    }

    clearPendingAdvance();
    state.currentIndex -= 1;
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
        ? axis.name + "平票（" + leftCount + ":" + rightCount + "），按最后一次相关选择判给「" + winner.label + "」。"
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
        var meta = tagLookup[tag];

        if (!meta) {
          return;
        }

        counts[tag] += 1;
        lastTagByAxis[meta.axis.code] = tag;
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

    // --- Easter egg detection ---
    var fireballCount = 0;
    var poleCount = 0;
    var totalFireball = 0;
    var totalPole = 0;
    data.questions.forEach(function (q) {
      q.options.forEach(function (opt) {
        opt.tags.forEach(function (t) {
          if (t === "\ud83d\udd25\u706b\u7403\u672f") totalFireball++;
          if (t === "\ud83d\udccf\u5341\u5c3a\u6746") totalPole++;
        });
      });
    });
    state.answers.forEach(function (answer) {
      if (!answer) return;
      answer.tags.forEach(function (tag) {
        if (tag === "\ud83d\udd25\u706b\u7403\u672f") fireballCount++;
        if (tag === "\ud83d\udccf\u5341\u5c3a\u6746") poleCount++;
      });
    });
    if (totalFireball > 0 && fireballCount >= totalFireball) {
      resultEntry = resultSlugLookup["hidden-fireball"] || resultEntry;
    } else if (totalPole > 0 && poleCount >= totalPole) {
      resultEntry = resultSlugLookup["hidden-pole"] || resultEntry;
    }
    // --- End easter egg detection ---

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
    clearPendingAdvance();
    clearSavedProgress();
    state.result = computeResult();
    syncResultUrl(state.result);
    renderResult();
    showView("result");
    scrollToTop();
  }

  function openSharedResult(entry) {
    clearPendingAdvance();
    state.result = buildSharedResult(entry);
    syncResultUrl(state.result);
    renderResult();
    showView("result");
    scrollToTop();
  }

  function buildResultSummary(result) {
    if (!result) {
      return "";
    }

    return (
      "你的四轴代码已经锁定为「" +
      result.code +
      "」。这一型暂时只回传代码、轴向判定和标签计数，你可以先拿去认领，再回来补完整结果文案。"
    );
  }

  function buildAxisSummaryLines(result) {
    return result.axisBreakdown.map(function (item) {
      var summary = item.axis.name + "：" + item.winner.label;

      if (typeof item.leftCount === "number" && typeof item.rightCount === "number") {
        summary += "（" + item.leftCount + " : " + item.rightCount + "）";
      }

      if (item.isTie) {
        summary += "，平票时按最后一次相关选择判定。";
      }

      return summary;
    });
  }

  function renderProfile(result) {
    var entry = result.entry || {};
    var traitLines = entry.traits && entry.traits.length ? entry.traits : buildAxisSummaryLines(result);
    var lead = entry.role || "你的桌上职业已经被公会锁定。";
    var body = entry.description || buildResultSummary(result);

    resultProfile.innerHTML =
      '<div class="profile-block">' +
      '<p class="profile-lead">' +
      escapeHtml(lead) +
      "</p>" +
      '<p class="profile-description">' +
      escapeHtml(body) +
      "</p>" +
      '<ul class="profile-traits">' +
      traitLines
        .map(function (line) {
          return "<li>" + escapeHtml(line) + "</li>";
        })
        .join("") +
      "</ul>" +
      "</div>";
  }

  function renderAxisBreakdown(items) {
    axisResults.innerHTML = items
      .map(function (item) {
        var hasCounts = typeof item.leftCount === "number" && typeof item.rightCount === "number";
        var leftWidth = hasCounts && item.total ? (item.leftCount / item.total) * 100 : 50;
        var rightWidth = hasCounts && item.total ? (item.rightCount / item.total) * 100 : 50;
        var note = hasCounts
          ? item.isTie
            ? "这条轴出现平票，按最后一次相关选择判定。"
            : item.axis.description
          : "分享结果只保留最终轴向，不包含原始作答计分。";

        return (
          '<article class="axis-card">' +
          '<div class="axis-card-header">' +
          '<div><p class="axis-card-kicker">' +
          escapeHtml(item.axis.name) +
          '</p><h3 class="axis-card-title">' +
          escapeHtml(item.winner.label) +
          "</h3></div>" +
          '<span class="axis-card-total">' +
          escapeHtml(hasCounts ? item.leftCount + " : " + item.rightCount : "分享结果") +
          "</span>" +
          "</div>" +
          '<div class="axis-side-row"><span>' +
          escapeHtml(item.axis.left.label) +
          "</span><span>" +
          escapeHtml(item.axis.right.label) +
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
          escapeHtml(note) +
          "</p>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderTagCounts(countMap, axisBreakdown, sharedOnly) {
    if (sharedOnly) {
      tagCounts.innerHTML =
        '<div class="shared-panel">' +
        "<h3>这条结果链接只分享人格，不分享原始计分。</h3>" +
        "<p>想看 8 个标签的完整统计，需要重新做一次题。分享页只负责让你把这张公会鉴定卡直接丢进群里。</p>" +
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
            '<article class="tag-chip' +
            activeClass +
            '">' +
            '<span class="tag-chip-name">' +
            escapeHtml(item.label) +
            "</span>" +
            '<span class="tag-chip-axis">' +
            escapeHtml(item.axis.name) +
            "</span>" +
            '<strong class="tag-chip-count">' +
            escapeHtml(countMap[item.label]) +
            "</strong>" +
            "</article>"
          );
        })
        .join("") +
      "</div>";
  }

  function renderResult() {
    var result = state.result;
    var entry = result.entry || {};
    var noteText = "";

    if (result.sharedOnly) {
      noteText = "这是分享页版本：保留人格结论，不带原始计分。想看完整标签统计，需要重新作答。";
    } else if (result.tieNotes.length) {
      noteText = result.tieNotes.join(" ");
    } else if (!entry.name || !entry.description) {
      noteText = data.meta.placeholderNote;
    }

    resultCode.textContent = result.shortCode;
    resultName.textContent = entry.name || "未命名人格";
    resultQuote.textContent = entry.tagline || "这条人格暂未配置专属台词。";
    resultQuote.hidden = !resultQuote.textContent;
    resultNote.textContent = noteText;
    resultNote.hidden = !noteText;
    resultHomeLink.href = getBasePageUrl() + "#atlas";
    setPosterImage(resultPoster, entry.code ? entry : result, 680, 860);
    resultPoster.alt = result.shortCode + " 结果海报";

    renderProfile(result);
    renderAxisBreakdown(result.axisBreakdown);
    renderTagCounts(result.tagCounts, result.axisBreakdown, result.sharedOnly);
    renderAtlas(result.code);

    profilePanel.open = true;
    axisPanel.open = result.sharedOnly;
    tagPanel.open = false;
    resetFeedback();
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
      "我在《跑团职业检定》里测出来是：" + result.shortCode + (entry.name ? "｜" + entry.name : ""),
      entry.role || "",
      entry.description || "",
      entry.tagline ? "专属台词：" + entry.tagline : "",
      "四轴判定：" + summary,
      result.tieNotes.join(" "),
      "结果链接：" + buildResultLink(result),
    ]
      .filter(Boolean)
      .join("\n");
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
          setFeedback("分享文案已复制。", "success");
        })
        .catch(function () {
          copyUsingTextarea(text);
          setFeedback("分享文案已复制。", "success");
        });
      return;
    }

    copyUsingTextarea(text);
    setFeedback("分享文案已复制。", "success");
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
          setFeedback("结果链接已复制。", "success");
        })
        .catch(function () {
          copyUsingTextarea(text);
          setFeedback("结果链接已复制。", "success");
        });
      return;
    }

    copyUsingTextarea(text);
    setFeedback("结果链接已复制。", "success");
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
    var normalized = String(text || "");
    var lines = [];
    var index = 0;

    while (index < normalized.length) {
      lines.push(normalized.slice(index, index + maxChars));
      index += maxChars;
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

  function getPosterPalette(item) {
    var entry = item.entry || item;
    var family = entry.slug && entry.slug.indexOf("mang-") === 0 ? "mang" : "gou";
    var isLezi = entry.slug && entry.slug.indexOf("-lezi-") > -1;

    return {
      accent: family === "mang" ? "#c66b43" : "#5f8d5f",
      accentSoft: family === "mang" ? "#4a231a" : "#203224",
      secondary: isLezi ? "#d5a65a" : "#4d6e97",
      border: isLezi ? "rgba(213,166,90,0.28)" : "rgba(120,157,204,0.2)",
      ink: "#f2e8d3",
      muted: "#baa98d",
    };
  }

  function buildPosterSvg(item, width, height) {
    var entry = item.entry || item;
    var palette = getPosterPalette(entry);
    var code = entry.code || item.code || "";
    var shortCode = entry.shortCode || item.shortCode || code.replace(/·/g, "");
    var name = entry.name || "未命名人格";
    var role = entry.role || "公会等待你的职业画像回填。";
    var quote = entry.tagline || "缺少人物海报时，先用这张公会鉴定卡顶上。";
    var chips = code.split("·");

    return [
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + " " + height + '">',
      "<defs>",
      '<linearGradient id="card-bg" x1="0" y1="0" x2="1" y2="1">',
      '<stop offset="0%" stop-color="#18120f"/>',
      '<stop offset="100%" stop-color="' + palette.accentSoft + '"/>',
      "</linearGradient>",
      '<linearGradient id="card-glow" x1="0" y1="0" x2="1" y2="0">',
      '<stop offset="0%" stop-color="' + palette.accent + '"/>',
      '<stop offset="100%" stop-color="' + palette.secondary + '"/>',
      "</linearGradient>",
      "</defs>",
      '<rect width="' + width + '" height="' + height + '" rx="36" fill="url(#card-bg)"/>',
      '<rect x="18" y="18" width="' + (width - 36) + '" height="' + (height - 36) + '" rx="28" fill="rgba(20,16,13,0.84)" stroke="' + palette.border + '"/>',
      '<rect x="38" y="40" width="' + (width - 76) + '" height="108" rx="22" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)"/>',
      '<text x="58" y="82" font-size="18" fill="#d0a85c" letter-spacing="4" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">冒险者公会</text>',
      '<text x="58" y="122" font-size="48" fill="' + palette.ink + '" font-weight="700" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' + escapeSvg(shortCode) + "</text>",
      '<circle cx="' + (width - 84) + '" cy="94" r="38" fill="rgba(143,60,53,0.82)" stroke="rgba(242,232,211,0.12)"/>',
      '<text x="' + (width - 84) + '" y="101" font-size="18" fill="#f2e8d3" text-anchor="middle" font-weight="700" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">D20</text>',
      '<text x="58" y="212" font-size="44" fill="' + palette.ink + '" font-weight="700" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' + escapeSvg(name) + "</text>",
      svgTextLines(splitText(code, 12), 58, 252, 28, 24, "#d0a85c", 600),
      '<rect x="58" y="292" width="' + (width - 116) + '" height="92" rx="22" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)"/>',
      svgTextLines(splitText(role, 18).slice(0, 2), 82, 328, 26, 18, palette.ink, 600),
      chips
        .map(function (label, index) {
          var y = 426 + index * 72;
          return (
            '<rect x="58" y="' +
            y +
            '" width="' +
            (width - 116) +
            '" height="50" rx="18" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.04)"/>' +
            '<text x="82" y="' +
            (y + 31) +
            '" font-size="18" fill="#baa98d" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
            escapeSvg(data.axes[index].name) +
            "</text>" +
            '<text x="' +
            (width - 82) +
            '" y="' +
            (y + 31) +
            '" font-size="22" fill="' +
            palette.ink +
            '" font-weight="700" text-anchor="end" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
            escapeSvg(label || "") +
            "</text>"
          );
        })
        .join(""),
      '<rect x="58" y="' + (height - 188) + '" width="' + (width - 116) + '" height="112" rx="24" fill="url(#card-glow)" opacity="0.16"/>',
      '<rect x="58" y="' + (height - 188) + '" width="' + (width - 116) + '" height="112" rx="24" fill="rgba(20,16,13,0.4)" stroke="rgba(255,255,255,0.06)"/>',
      '<text x="82" y="' + (height - 146) + '" font-size="16" fill="#d0a85c" letter-spacing="3" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">专属台词</text>',
      svgTextLines(splitText(quote, 18).slice(0, 3), 82, height - 112, 24, 16, palette.ink, 400),
      "</svg>",
    ].join("");
  }

  function buildPosterDataUrl(item, width, height) {
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(buildPosterSvg(item, width, height));
  }

  function blobToDataUrl(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();

      reader.onload = function () {
        resolve(reader.result);
      };

      reader.onerror = function () {
        reject(new Error("Image data conversion failed"));
      };

      reader.readAsDataURL(blob);
    });
  }

  function imageElementToDataUrl(image) {
    if (!image || !image.complete || !image.naturalWidth || !image.naturalHeight) {
      return "";
    }

    try {
      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");

      if (!context) {
        return "";
      }

      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      context.drawImage(image, 0, 0);
      return canvas.toDataURL("image/png");
    } catch (error) {
      return "";
    }
  }

  function loadSharePosterDataUrl(result, imageElement) {
    var imagePath = getResultImagePath(result);
    var fallback = buildPosterDataUrl(result, 440, 620);
    var elementDataUrl = imageElementToDataUrl(imageElement);

    if (elementDataUrl) {
      return Promise.resolve(elementDataUrl);
    }

    if (!imagePath) {
      return Promise.resolve(fallback);
    }

    return fetch(imagePath)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Poster image unavailable");
        }

        return response.blob();
      })
      .then(blobToDataUrl)
      .catch(function () {
        return fallback;
      });
  }

  function buildShareCardSvg(posterDataUrl) {
    var result = state.result;
    var entry = result.entry || {};
    var axisSvg = result.axisBreakdown
      .map(function (item, index) {
        var y = 760 + index * 94;
        var leftWidth = item.total ? Math.round((item.leftCount / item.total) * 300) : 150;
        var rightWidth = 300 - leftWidth;
        return (
          '<text x="500" y="' +
          y +
          '" font-size="22" fill="#f2e8d3" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
          escapeSvg(item.axis.name + " · " + item.winner.label) +
          "</text>" +
          '<text x="1050" y="' +
          y +
          '" text-anchor="end" font-size="18" fill="#baa98d" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
          escapeSvg(typeof item.leftCount === "number" ? item.leftCount + " : " + item.rightCount : "分享结果") +
          "</text>" +
          '<rect x="500" y="' +
          (y + 18) +
          '" width="300" height="12" rx="6" fill="rgba(255,255,255,0.08)"/>' +
          '<rect x="500" y="' +
          (y + 18) +
          '" width="' +
          leftWidth +
          '" height="12" rx="6" fill="#d0a85c"/>' +
          '<rect x="' +
          (500 + leftWidth) +
          '" y="' +
          (y + 18) +
          '" width="' +
          rightWidth +
          '" height="12" rx="6" fill="#7ab17c"/>'
        );
      })
      .join("");

    var tagSvg = result.sharedOnly
      ? '<rect x="78" y="1178" width="1044" height="136" rx="28" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)"/>' +
        '<text x="110" y="1240" font-size="28" fill="#f2e8d3" font-weight="700" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">这条链接只分享人格，不分享原始计分。</text>' +
        svgTextLines(["想看 8 标签统计，需要重新作答一次。"], 110, 1284, 26, 20, "#baa98d", 400)
      : tagMetaList
          .map(function (item, index) {
            var x = 78 + (index % 4) * 260;
            var y = 1168 + Math.floor(index / 4) * 112;
            var count = result.tagCounts[item.label];
            var active = result.axisBreakdown.some(function (axisItem) {
              return axisItem.winner.label === item.label;
            });
            return (
              '<rect x="' +
              x +
              '" y="' +
              y +
              '" width="230" height="86" rx="20" fill="' +
              (active ? "rgba(208,168,92,0.12)" : "rgba(255,255,255,0.03)") +
              '" stroke="' +
              (active ? "rgba(208,168,92,0.22)" : "rgba(255,255,255,0.05)") +
              '"/>' +
              '<text x="' +
              (x + 24) +
              '" y="' +
              (y + 30) +
              '" font-size="16" fill="#baa98d" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
              escapeSvg(item.axis.name) +
              "</text>" +
              '<text x="' +
              (x + 24) +
              '" y="' +
              (y + 62) +
              '" font-size="28" fill="#f2e8d3" font-weight="700" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
              escapeSvg(item.label) +
              "</text>" +
              '<text x="' +
              (x + 206) +
              '" y="' +
              (y + 62) +
              '" text-anchor="end" font-size="24" fill="#efcf90" font-weight="700" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
              escapeSvg(count) +
              "</text>"
            );
          })
          .join("");

    return [
      '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600">',
      '<rect width="1200" height="1600" fill="#100d0b"/>',
      '<rect x="36" y="36" width="1128" height="1528" rx="36" fill="rgba(28,22,18,0.96)" stroke="rgba(211,173,104,0.18)"/>',
      '<image href="' +
        posterDataUrl +
        '" x="78" y="118" width="380" height="536" preserveAspectRatio="xMidYMid meet"/>',
      '<text x="500" y="132" font-size="20" fill="#d0a85c" letter-spacing="5" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">冒险者公会鉴定报告</text>',
      '<text x="500" y="224" font-size="68" fill="#f2e8d3" font-weight="700" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
        escapeSvg(result.shortCode) +
        "</text>",
      entry.name
        ? '<text x="500" y="274" font-size="34" fill="#f2e8d3" font-weight="700" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">' +
          escapeSvg(entry.name) +
          "</text>"
        : "",
      svgTextLines(splitText(entry.role || "你的桌上职业已经被公会锁定。", 22).slice(0, 2), 500, 330, 30, 24, "#efcf90", 600),
      svgTextLines(splitText(entry.description || buildResultSummary(result), 24).slice(0, 5), 500, 420, 36, 22, "#f2e8d3", 400),
      '<rect x="500" y="596" width="560" height="108" rx="24" fill="rgba(143,60,53,0.12)" stroke="rgba(143,60,53,0.24)"/>',
      svgTextLines(splitText(entry.tagline || "分享页会优先展示你的职业人格与专属台词。", 24).slice(0, 3), 530, 632, 24, 18, "#efcf90", 500),
      '<text x="78" y="734" font-size="20" fill="#d0a85c" letter-spacing="5" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">四轴判定</text>',
      axisSvg,
      '<text x="78" y="1122" font-size="20" fill="#d0a85c" letter-spacing="5" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">标签计数</text>',
      tagSvg,
      '<text x="78" y="1508" font-size="18" fill="#baa98d" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif">跑团职业检定</text>',
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
      "跑团职业检定-" + state.result.shortCode + ".svg"
    );
    setFeedback("PNG 生成失败，已回退导出 SVG。", "warning", true);
  }

  function downloadShareCard() {
    if (!state.result) {
      return;
    }

    downloadButton.disabled = true;
    setFeedback("正在生成结果图...", "info", true);

    loadSharePosterDataUrl(state.result, resultPoster)
      .then(function (posterDataUrl) {
        var svg = buildShareCardSvg(posterDataUrl);

        return svgToPngBlob(svg, 2).catch(function () {
          fallbackSvgDownload(svg);
          return Promise.reject(new Error("PNG export failed after SVG fallback"));
        });
      })
      .then(function (blob) {
        downloadBlob(blob, "跑团职业检定-" + state.result.shortCode + ".png");
        setFeedback("结果图已导出。", "success");
      })
      .catch(function (error) {
        if (!error || error.message !== "PNG export failed after SVG fallback") {
          setFeedback("结果图生成失败，请稍后重试。", "warning", true);
        }
      })
      .finally(function () {
        downloadButton.disabled = false;
      });
  }

  function handlePersonaCardClick(event) {
    var button = event.target.closest("[data-result]");
    var slug;
    var entry;

    if (!button) {
      return;
    }

    slug = button.getAttribute("data-result");
    entry = resultSlugLookup[slug];

    if (!entry) {
      return;
    }

    openSharedResult(entry);
  }

  function bootstrapSharedResult() {
    var params = new URLSearchParams(window.location.search);
    var resultParam = params.get("result");
    var entry;

    if (!resultParam) {
      return false;
    }

    entry = resultSlugLookup[resultParam] || resultShortLookup[resultParam] || resultLookup[resultParam] || null;

    if (!entry) {
      return false;
    }

    state.result = buildSharedResult(entry);
    renderResult();
    showView("result");
    return true;
  }

  startButton.addEventListener("click", startQuiz);
  if (continueButton) {
    continueButton.addEventListener("click", resumeSavedQuiz);
  }
  restartInlineButton.addEventListener("click", startQuiz);
  quitButton.addEventListener("click", exitQuiz);
  prevButton.addEventListener("click", goPrev);
  copyButton.addEventListener("click", copyShareText);
  copyLinkButton.addEventListener("click", copyResultLink);
  downloadButton.addEventListener("click", downloadShareCard);
  restartButton.addEventListener("click", startQuiz);
  atlasGrid.addEventListener("click", handlePersonaCardClick);

  renderHome();

  if (!bootstrapSharedResult() && !bootstrapSavedProgress()) {
    showView("home");
  }
})();
