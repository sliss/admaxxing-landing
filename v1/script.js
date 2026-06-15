/* =========================================================
   ADMAXXING™ — client-side hype engine
   No frameworks. No build step. Just vibes. Est. 1999.
   ========================================================= */

// ---- The scrolling chyron ads (the actual product, on display) ----
var ADS = [
  "🍕 BIG TONY'S PIZZA — 2 for 1 every Tuesday, dial 1-800-PIE-TONY",
  "💊 Lose 30 lbs with ONE weird trick doctors LOVE",
  "🚗 0% APR financing — your new car is WAITING",
  "📞 Psychic Hotline: the future is only $3.99/min",
  "💎 Genuine cubic zirconia — looks EXACTLY like a diamond*",
  "🖥️ Upgrade to 64MB of RAM and FLY through Windows",
  "🐢 Adopt-a-Tamagotchi — they need YOU to live",
  "🏝️ You've WON a free cruise! (Click to claim NOW)",
  "📀 12 CDs for 1 PENNY — just buy 47 more at full price",
  "☎️ FREE long distance after 9pm and weekends",
  "🧃 New SURGE soda — fully loaded with citrus POWER",
  "💻 Get 1000 FREE hours of internet*",
  "🦷 Whiten your teeth while you SLEEP",
  "🛒 Pets.com — because pets can't drive to the store",
];

function buildChyron() {
  var el = document.getElementById("chyronContent");
  if (!el) return;
  var html = "";
  for (var i = 0; i < ADS.length; i++) {
    var ad = ADS[i].replace(/WON|FREE|NOW|POWER/g, function (m) {
      return '<span class="hot">' + m + "</span>";
    });
    html += ad + ' <span class="sep">◆◆◆</span> ';
  }
  // Duplicate so the loop feels endless
  el.innerHTML = html + html;
}

// ---- Live earnings ticker (you're getting RICH as you read) ----
var earnings = 0;
function tickEarnings() {
  var el = document.getElementById("liveEarnings");
  if (!el) return;
  earnings += 0.0001 + Math.random() * 0.0003;
  el.textContent = "$" + earnings.toFixed(4);
}

// ---- Animated stat counters ----
function animateStat(id, target, prefix, suffix, frames) {
  var el = document.getElementById(id);
  if (!el) return;
  var step = 0;
  prefix = prefix || "";
  suffix = suffix || "";
  var timer = setInterval(function () {
    step++;
    var val = Math.round((target * step) / frames);
    if (step >= frames) {
      val = target;
      clearInterval(timer);
    }
    el.textContent = prefix + val.toLocaleString() + suffix;
  }, 30);
}

// ---- Slowly-climbing live numbers ----
function driftStats() {
  var paid = document.getElementById("paidOut");
  var ads = document.getElementById("adsServed");
  if (paid) {
    var cur = parseInt(paid.textContent.replace(/[^0-9]/g, ""), 10) || 0;
    paid.textContent = "$" + (cur + Math.floor(Math.random() * 7 + 1)).toLocaleString();
  }
  if (ads) {
    var cur2 = parseInt(ads.textContent.replace(/[^0-9]/g, ""), 10) || 0;
    ads.textContent = (cur2 + Math.floor(Math.random() * 40 + 5)).toLocaleString();
  }
}

// ---- Earnings calculator ----
function setupCalculator() {
  var slider = document.getElementById("hoursSlider");
  var hoursVal = document.getElementById("hoursVal");
  var result = document.getElementById("calcResult");
  if (!slider) return;
  function update() {
    var hours = parseInt(slider.value, 10);
    hoursVal.textContent = hours;
    // Wildly optimistic: ~$0.92/hr of glorious ocular engagement
    var perYear = Math.round(hours * 0.92 * 365);
    result.textContent = "$" + perYear.toLocaleString();
  }
  slider.addEventListener("input", update);
  update();
}

// ---- Visitor counter (odometer style) ----
function setupCounter() {
  var el = document.getElementById("visitorCounter");
  if (!el) return;
  // Persist a fun fake count locally
  var base = 1048576;
  var n = parseInt(localStorage.getItem("admaxx_visits") || "0", 10);
  n = n ? n + 1 : base + Math.floor(Math.random() * 9000);
  localStorage.setItem("admaxx_visits", String(n));
  el.textContent = String(n).padStart(9, "0");
}

// ---- Fake download ----
function fakeDownload() {
  alert(
    "🎉 THANK YOU FOR CHOOSING ADMAXXING! 🎉\n\n" +
    "Your download would begin now...\n" +
    "...if this were not a glorious tribute to the dot-com era.\n\n" +
    "Please insert Disk 2 of 14."
  );
}
window.fakeDownload = fakeDownload;

// ---- Boot it all up ----
document.addEventListener("DOMContentLoaded", function () {
  buildChyron();
  setupCalculator();
  setupCounter();

  animateStat("userCount", 2300451, "", "", 60);
  document.getElementById("paidOut").textContent = "$48,920";
  document.getElementById("adsServed").textContent = "9,847,201";

  setInterval(tickEarnings, 120);
  setInterval(driftStats, 2500);
});
