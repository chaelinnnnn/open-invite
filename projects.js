// Open Invite — project-data.json 기반 렌더링
(function () {
  "use strict";

  var MEDIA_BASE = "assets/media/";
  var DATA_URL = "project-data.json";

  function mediaPath(src) {
    if (!src) return "";
    if (src.indexOf("http") === 0) return src; // 외부 URL은 그대로
    return MEDIA_BASE + src;
  }

  function pickDescription(desc) {
    if (!desc) return "";
    if (desc.ko && desc.ko.trim()) return desc.ko;
    if (desc.en && desc.en.trim()) return desc.en;
    return "";
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // 이미지 / 비디오 / 유튜브 / 비메오 한 개를 HTML로 변환
  function renderMediaItem(item) {
    if (!item || !item.type) return "";

    switch (item.type) {
      case "image":
        return (
          '<div class="media-item media-item--image">' +
          '<img src="' + mediaPath(item.src) + '" alt="" loading="lazy">' +
          "</div>"
        );

      case "video":
        return (
          '<div class="media-item media-item--video">' +
          '<video src="' + mediaPath(item.src) + '" autoplay muted loop playsinline controls></video>' +
          "</div>"
        );

      case "youtube":
        return (
          '<div class="media-item media-item--embed">' +
          '<iframe src="https://www.youtube.com/embed/' + item.id +
          '" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>' +
          "</div>"
        );

      case "vimeo":
        return (
          '<div class="media-item media-item--embed">' +
          '<iframe src="https://player.vimeo.com/video/' + item.id +
          '" title="Vimeo video" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>' +
          "</div>"
        );

      default:
        return "";
    }
  }

  function renderMediaGrid(mediaArray) {
    if (!mediaArray || !mediaArray.length) return "";
    return (
      '<div class="media-grid">' +
      mediaArray.map(renderMediaItem).join("") +
      "</div>"
    );
  }

  function renderSlides(slides) {
    if (!slides || !slides.length) return "";
    return (
      '<div class="slides-strip">' +
      slides.map(function (s) {
        return '<img src="' + mediaPath(s.src) + '" alt="" loading="lazy">';
      }).join("") +
      "</div>"
    );
  }

  // ---- 홈 화면: 프로젝트 그리드 ----

  function renderThumbnail(thumbnail) {
    if (!thumbnail) return "";
    if (thumbnail.type === "video") {
      return '<video src="' + mediaPath(thumbnail.src) + '" autoplay muted loop playsinline></video>';
    }
    return '<img src="' + mediaPath(thumbnail.src) + '" alt="" loading="lazy">';
  }

  function renderWorkCard(project) {
    return (
      '<a class="work-card" href="work-detail.html?id=' + encodeURIComponent(project.id) + '" data-category="' + escapeHtml(project.category) + '">' +
      '<div class="work-card__image">' + renderThumbnail(project.thumbnail) + "</div>" +
      '<div class="work-card__meta">' +
      "<h3>" + escapeHtml(project.title) + "</h3>" +
      "<p>" + escapeHtml(project.meta || project.type || "") + "</p>" +
      "</div>" +
      "</a>"
    );
  }

  function renderFilters(projects, filterEl, onChange) {
    if (!filterEl) return;
    var categories = [];
    projects.forEach(function (p) {
      if (p.category && categories.indexOf(p.category) === -1) categories.push(p.category);
    });

    var buttonsHtml = '<button class="filter-btn is-active" data-filter="all">All</button>' +
      categories.map(function (c) {
        return '<button class="filter-btn" data-filter="' + escapeHtml(c) + '">' + escapeHtml(c) + "</button>";
      }).join("");

    filterEl.innerHTML = buttonsHtml;

    filterEl.querySelectorAll(".filter-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterEl.querySelectorAll(".filter-btn").forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        onChange(btn.getAttribute("data-filter"));
      });
    });
  }

  function initHome() {
    var gridEl = document.getElementById("work-grid");
    var filterEl = document.getElementById("work-filters");
    var countEl = document.getElementById("work-count");
    if (!gridEl) return;

    fetch(DATA_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var projects = data.projects || [];
        if (countEl) countEl.textContent = projects.length + " projects";

        function draw(filter) {
          var visible = filter && filter !== "all"
            ? projects.filter(function (p) { return p.category === filter; })
            : projects;
          gridEl.innerHTML = visible.map(renderWorkCard).join("");
        }

        renderFilters(projects, filterEl, draw);
        draw("all");
      })
      .catch(function (err) {
        gridEl.innerHTML = "<p>프로젝트 데이터를 불러오지 못했습니다. project-data.json 파일을 확인해주세요.</p>";
        console.error(err);
      });
  }

  // ---- 상세 페이지 ----

  function renderSection(section) {
    var html = '<div class="project-section">';
    if (section.title) html += "<h2>" + escapeHtml(section.title) + "</h2>";
    if (section.desc) html += "<p>" + escapeHtml(section.desc) + "</p>";
    html += renderMediaGrid(section.media);
    html += renderSlides(section.slides);
    if (section.embedUrl) {
      html += '<div class="media-item media-item--embed media-item--full">' +
        '<iframe src="' + section.embedUrl + '" title="' + escapeHtml(section.title || "embed") + '" loading="lazy"></iframe>' +
        "</div>";
    }
    html += "</div>";
    return html;
  }

  function initDetail() {
    var root = document.getElementById("project-detail");
    if (!root) return;

    var params = new URLSearchParams(window.location.search);
    var id = params.get("id");

    fetch(DATA_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var projects = data.projects || [];
        var project = projects.filter(function (p) { return p.id === id; })[0];

        if (!project) {
          root.innerHTML = "<p>해당 프로젝트를 찾을 수 없습니다. <a href=\"index.html#work\">Work로 돌아가기</a></p>";
          return;
        }

        document.title = project.title + " — Open Invite";

        var metaBits = [project.client, project.date, project.type, project.collaboration]
          .filter(Boolean)
          .map(escapeHtml)
          .join(" · ");

        var html = "";
        html += '<a class="back-link" href="index.html#work">&larr; Work</a>';
        html += '<h1 class="project-detail__title">' + escapeHtml(project.title) + "</h1>";
        html += '<p class="project-detail__metaline">' + metaBits + "</p>";

        var desc = pickDescription(project.description);
        if (desc) html += '<p class="project-detail__body">' + escapeHtml(desc) + "</p>";

        if (project.externalUrl) {
          html += '<a class="external-link" href="' + project.externalUrl + '" target="_blank" rel="noopener">View project &rarr;</a>';
        }

        if (project.embedUrl) {
          html += '<div class="media-item media-item--embed media-item--full">' +
            '<iframe src="' + project.embedUrl + '" title="' + escapeHtml(project.title) + '" loading="lazy"></iframe>' +
            "</div>";
        }

        if (project.media && project.media.length) {
          html += renderMediaGrid(project.media);
        }

        if (project.sections && project.sections.length) {
          html += project.sections.map(renderSection).join("");
        }

        root.innerHTML = html;
      })
      .catch(function (err) {
        root.innerHTML = "<p>프로젝트 데이터를 불러오지 못했습니다.</p>";
        console.error(err);
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initHome();
    initDetail();
  });
})();
