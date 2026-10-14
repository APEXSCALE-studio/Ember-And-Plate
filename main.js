(function () {
  // === EDIT ME: replace with the restaurant's real WhatsApp number (country code, no + or spaces) ===
  var WA_NUMBER = "260974656749";
  var DEFAULT_MSG = "Hi Ember & Plate, I'd like to make a reservation.";
  document.documentElement.classList.add("js");
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // WhatsApp links
  $$("[data-wa]").forEach(function (a) {
    var m = a.getAttribute("data-msg"); m = m ? decodeURIComponent(m) : DEFAULT_MSG;
    a.href = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(m);
    a.target = "_blank"; a.rel = "noopener";
  });

  // Header: scroll state + mobile menu
  var header = $(".site-header"), nav = $("#nav"), tog = $(".menu-toggle");
  var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 20); };
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
  function setMenu(open) { nav.classList.toggle("open", open); header.classList.toggle("menu-open", open); tog.setAttribute("aria-expanded", open); }
  tog.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
  $$("#nav a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  // Menu tabs (home)
  var tabs = $$('[role="tab"]');
  if (tabs.length) {
    var show = function (t, focus) {
      tabs.forEach(function (x) { var on = x === t; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; $("#" + x.getAttribute("aria-controls")).hidden = !on; });
      if (focus) t.focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { show(t); });
      t.addEventListener("keydown", function (e) {
        var k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (k) { e.preventDefault(); show(tabs[(i + k + tabs.length) % tabs.length], true); }
      });
    });
    show(tabs[0]);
  }

  // Cards fade in once
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { threshold: 0.15 });
    $$(".card").forEach(function (c) { io.observe(c); });
  } else { $$(".card").forEach(function (c) { c.classList.add("in"); }); }

  // Lightbox
  var lb = $(".lightbox"), items = $$(".g-item"), cur = 0;
  if (items.length && lb.showModal) {
    var lbImg = $("img", lb), cap = $("figcaption", lb);
    var open = function (i) { cur = (i + items.length) % items.length; var im = $("img", items[cur]); lbImg.src = im.src; lbImg.alt = im.alt; cap.textContent = im.alt; if (!lb.open) lb.showModal(); };
    items.forEach(function (b, i) { b.addEventListener("click", function () { open(i); }); });
    $(".lb-close", lb).addEventListener("click", function () { lb.close(); });
    $(".lb-prev", lb).addEventListener("click", function () { open(cur - 1); });
    $(".lb-next", lb).addEventListener("click", function () { open(cur + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") open(cur - 1); if (e.key === "ArrowRight") open(cur + 1); });
  }

  // Reservation form: saves to Supabase (config in js/config.js). Falls back to WhatsApp if saving fails.
  var form = $("#res-form");
  if (form) {
    var d = $("#date"), today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    d.min = today.toISOString().slice(0, 10);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = form.elements, v = function (k) { return f[k].value.trim(); }, req = ["name", "phone", "date", "time", "guests"];
      var missing = req.filter(function (k) { return !v(k); });
      var badEmail = v("email") && !f.email.checkValidity();
      $(".err").hidden = !missing.length && !badEmail;
      $(".err").textContent = badEmail && !missing.length ? "That email address doesn't look right. Please check it or leave it blank." : "Please fill in your name, phone, date, time and number of guests.";
      if (missing.length || badEmail) { (missing.length ? f[missing[0]] : f.email).focus(); return; }
      var text = "Hi Ember & Plate, I'd like to reserve a table.\nName: " + v("name") + "\nPhone: " + v("phone") + "\nDate: " + v("date") + "\nTime: " + v("time") + "\nGuests: " + v("guests") + (v("note") ? "\nRequest: " + v("note") : "");
      var wa = $("#send-wa"), msg = $("#msg"), btn = $("button[type=submit]", form);
      wa.href = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text); wa.target = "_blank"; wa.rel = "noopener";
      $("#who").textContent = v("name").split(" ")[0];
      var done = function (saved) {
        msg.textContent = saved
          ? "We've received your request for " + v("guests") + (v("guests") === "1" ? " guest" : " guests") + " on " + v("date") + " at " + v("time") + ". We'll confirm by phone, email or WhatsApp shortly."
          : "We couldn't send that online. Please tap the button below to send your request on WhatsApp instead.";
        form.hidden = true; var s = $(".success"); s.hidden = false; s.setAttribute("tabindex", "-1"); s.focus();
      };
      if (v("website")) { done(true); return; } // honeypot: bots fill the hidden field
      var c = window.EP_CONFIG; if (!c) { done(false); return; }
      btn.disabled = true; btn.textContent = "Sending...";
      fetch(c.SUPABASE_URL + "/rest/v1/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: c.SUPABASE_KEY, Authorization: "Bearer " + c.SUPABASE_KEY, Prefer: "return=minimal" },
        body: JSON.stringify({ booking_type: "table", name: v("name"), phone: v("phone"), email: v("email") || null, reservation_date: v("date"),
          reservation_time: v("time"), guests: parseInt(v("guests"), 10), special_requests: v("note") || null, source: "website" })
      }).then(function (r) { done(r.ok); }).catch(function () { done(false); });
    });
  }
})();
