// Open Invite — 인트로 로고 애니메이션 (Lottie)
//
// assets/animation/logo-intro.json 파일을 넣으면 페이지가 열릴 때
// 그 로고 애니메이션이 한 번 재생된 뒤 사이트 화면으로 자연스럽게 넘어갑니다.
//
// 안전장치:
// - json 파일이 아직 없거나(404) 깨져 있으면 바로 인트로를 건너뜁니다.
// - 애니메이션이 너무 길거나 끝나지 않아도 최대 4초 뒤에는 무조건 넘어갑니다.
// - 한 세션(브라우저 탭 하나) 안에서는 처음 한 번만 재생하고, 이후에는 건너뜁니다.
// - 사용자가 "동작 줄이기(reduce motion)" 설정을 켜둔 경우 애니메이션 없이 바로 넘어갑니다.

(function () {
  "use strict";

  var ANIMATION_PATH = "assets/animation/logo-intro.json";
  var MAX_WAIT_MS = 4000;
  var SESSION_KEY = "openinvite_intro_played";

  var overlay = document.getElementById("intro");
  var logoEl = document.getElementById("intro-logo");
  if (!overlay || !logoEl) return;

  function hideIntro() {
    if (overlay.classList.contains("intro--hidden")) return;
    overlay.classList.add("intro--hidden");
    document.body.classList.remove("intro-lock");
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch (e) {}
    window.setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 700); // CSS 트랜지션 시간과 맞춤
  }

  // 이미 이번 세션에서 재생했으면 건너뛰기
  var alreadyPlayed = false;
  try { alreadyPlayed = sessionStorage.getItem(SESSION_KEY) === "1"; } catch (e) {}

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (alreadyPlayed || prefersReducedMotion || typeof window.lottie === "undefined") {
    hideIntro();
    return;
  }

  document.body.classList.add("intro-lock");

  var safetyTimer = window.setTimeout(hideIntro, MAX_WAIT_MS);

  overlay.addEventListener("click", hideIntro); // 클릭하면 바로 건너뛰기

  var anim = window.lottie.loadAnimation({
    container: logoEl,
    renderer: "svg",
    loop: false,
    autoplay: true,
    path: ANIMATION_PATH,
  });

  anim.addEventListener("complete", function () {
    window.clearTimeout(safetyTimer);
    hideIntro();
  });

  anim.addEventListener("data_failed", function () {
    window.clearTimeout(safetyTimer);
    hideIntro();
  });
})();
