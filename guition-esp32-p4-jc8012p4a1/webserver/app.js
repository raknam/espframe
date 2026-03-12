(function () {
  "use strict";

  var S = {};
  var app = document.getElementById("app");
  if (!app) {
    app = document.createElement("div");
    app.id = "app";
    document.body.appendChild(app);
  }

  var endpoints = {
    immich_url: "/text/immich_url",
    api_key: "/text/immich_api_key_text",
    clock_format: "/select/clock_format_select",
    timezone: "/select/timezone_select",
    interval: "/number/slideshow_interval",
    backlight: "/light/backlight",
    show_clock: "/switch/show_clock",
    firmware: "/text_sensor/firmware_version",
    update: "/update/firmware_update",
  };

  function get(url) {
    return fetch(url).then(function (r) {
      return r.json();
    });
  }

  function post(url, params) {
    var qs = params
      ? "?" +
        Object.keys(params)
          .map(function (k) {
            return k + "=" + encodeURIComponent(params[k]);
          })
          .join("&")
      : "";
    return fetch(url + qs, { method: "POST" });
  }

  function fetchAll() {
    return Promise.all([
      get(endpoints.immich_url),
      get(endpoints.api_key),
      get(endpoints.clock_format + "?detail=all"),
      get(endpoints.timezone + "?detail=all"),
      get(endpoints.interval),
      get(endpoints.backlight),
      get(endpoints.show_clock),
      get(endpoints.firmware).catch(function () {
        return null;
      }),
      get(endpoints.update).catch(function () {
        return null;
      }),
    ]).then(function (r) {
      S.immich_url = r[0].value || "";
      S.api_key = r[1].value || "";
      S.clock_format = r[2].value;
      S.clock_options = r[2].options || ["24 Hour", "12 Hour"];
      S.timezone = r[3].value;
      S.tz_options = r[3].options || [];
      S.interval = r[4].value;
      S.interval_min = r[4].min_value || 5;
      S.interval_max = r[4].max_value || 300;
      S.interval_step = r[4].step || 5;
      S.backlight_on = r[5].state === "ON";
      S.brightness = r[5].brightness != null ? Math.round(r[5].brightness * 100) : 100;
      S.show_clock = r[6].value === true || r[6].state === "ON";
      S.firmware = r[7] ? r[7].value || r[7].state || "" : "";
      S.update_available =
        r[8] && r[8].installed_version && r[8].latest_version
          ? r[8].installed_version !== r[8].latest_version
          : false;
      S.installed_version = r[8] ? r[8].installed_version || "" : "";
      S.latest_version = r[8] ? r[8].latest_version || "" : "";
      return S;
    });
  }

  // --- Wizard ---

  function renderWizard() {
    var step = 1;
    app.innerHTML = "";
    var wrap = el("div", "fade-in");
    wrap.innerHTML =
      '<h1>Immich Frame</h1><p class="subtitle">Let\'s connect your photo frame</p>';
    var steps = el("div", "wizard-steps");
    var s1 = el("div", "step active");
    var s2 = el("div", "step");
    steps.appendChild(s1);
    steps.appendChild(s2);
    wrap.appendChild(steps);

    var body = el("div");
    wrap.appendChild(body);
    app.appendChild(wrap);

    function showStep() {
      body.innerHTML = "";
      if (step === 1) {
        s1.className = "step active";
        s2.className = "step";
        body.appendChild(renderStep1());
      } else {
        s1.className = "step done";
        s2.className = "step active";
        body.appendChild(renderStep2());
      }
    }

    function renderStep1() {
      var card = el("div", "card fade-in");
      card.innerHTML = "<h3>Connection</h3>";

      var f1 = field("Immich Server URL");
      var urlInput = input("url", S.immich_url, "https://immich.example.com");
      f1.appendChild(urlInput);
      card.appendChild(f1);

      var f2 = field("API Key");
      var grp = el("div", "input-group");
      var keyInput = input("password", S.api_key, "Your Immich API key");
      var showBtn = el("button", "btn btn-secondary btn-sm");
      showBtn.textContent = "Show";
      showBtn.type = "button";
      showBtn.onclick = function () {
        var isPass = keyInput.type === "password";
        keyInput.type = isPass ? "text" : "password";
        showBtn.textContent = isPass ? "Hide" : "Show";
      };
      grp.appendChild(keyInput);
      grp.appendChild(showBtn);
      f2.appendChild(grp);
      card.appendChild(f2);

      var nav = el("div", "wizard-nav");
      var nextBtn = el("button", "btn btn-primary");
      nextBtn.textContent = "Connect";
      nextBtn.onclick = function () {
        var u = urlInput.value.trim();
        var k = keyInput.value.trim();
        if (!u || !k) return;
        nextBtn.disabled = true;
        nextBtn.textContent = "Saving\u2026";
        Promise.all([
          post(endpoints.immich_url + "/set", { value: u }),
          post(endpoints.api_key + "/set", { value: k }),
        ]).then(function () {
          S.immich_url = u;
          S.api_key = k;
          step = 2;
          showStep();
        });
      };
      nav.appendChild(nextBtn);
      card.appendChild(nav);
      return card;
    }

    function renderStep2() {
      var card = el("div", "card fade-in");
      card.innerHTML = "<h3>Clock & Timezone</h3>";

      var f1 = field("Clock Format");
      var seg = el("div", "segment");
      S.clock_options.forEach(function (opt) {
        var b = document.createElement("button");
        b.textContent = opt;
        b.className = opt === S.clock_format ? "active" : "";
        b.onclick = function () {
          post(endpoints.clock_format + "/set", { option: opt });
          S.clock_format = opt;
          seg.querySelectorAll("button").forEach(function (x) {
            x.className = x.textContent === opt ? "active" : "";
          });
        };
        seg.appendChild(b);
      });
      f1.appendChild(seg);
      card.appendChild(f1);

      var f2 = field("Timezone");
      f2.appendChild(
        searchableSelect(S.tz_options, S.timezone, function (v) {
          post(endpoints.timezone + "/set", { option: v });
          S.timezone = v;
        })
      );
      card.appendChild(f2);

      var nav = el("div", "wizard-nav");
      var backBtn = el("button", "btn btn-secondary");
      backBtn.textContent = "Back";
      backBtn.onclick = function () {
        step = 1;
        showStep();
      };
      var doneBtn = el("button", "btn btn-primary");
      doneBtn.textContent = "Done";
      doneBtn.onclick = function () {
        renderSettings();
      };
      nav.appendChild(backBtn);
      nav.appendChild(doneBtn);
      card.appendChild(nav);
      return card;
    }

    showStep();
  }

  // --- Settings ---

  function renderSettings() {
    app.innerHTML = "";
    var wrap = el("div", "fade-in");
    wrap.innerHTML = '<h1>Immich Frame</h1><h2>Settings</h2>';

    // Connection
    var conn = el("div", "card");
    conn.innerHTML = "<h3>Connection</h3>";

    var f1 = field("Immich Server URL");
    var urlInput = input("url", S.immich_url, "https://immich.example.com");
    urlInput.onchange = function () {
      post(endpoints.immich_url + "/set", { value: urlInput.value.trim() });
    };
    f1.appendChild(urlInput);
    conn.appendChild(f1);

    var f2 = field("API Key");
    var grp = el("div", "input-group");
    var keyInput = input("password", S.api_key, "");
    keyInput.onchange = function () {
      post(endpoints.api_key + "/set", { value: keyInput.value.trim() });
    };
    var showBtn = el("button", "btn btn-secondary btn-sm");
    showBtn.textContent = "Show";
    showBtn.type = "button";
    showBtn.onclick = function () {
      var isPass = keyInput.type === "password";
      keyInput.type = isPass ? "text" : "password";
      showBtn.textContent = isPass ? "Hide" : "Show";
    };
    grp.appendChild(keyInput);
    grp.appendChild(showBtn);
    f2.appendChild(grp);
    conn.appendChild(f2);

    var statusEl = el("div", "status");
    statusEl.id = "conn-status";
    statusEl.innerHTML = '<span class="dot green"></span> Connected';
    conn.appendChild(statusEl);
    wrap.appendChild(conn);

    // Display
    var disp = el("div", "card");
    disp.innerHTML = "<h3>Display</h3>";

    var f3 = field("Slideshow Interval");
    var rw = el("div", "range-wrap");
    var slider = document.createElement("input");
    slider.type = "range";
    slider.min = S.interval_min;
    slider.max = S.interval_max;
    slider.step = S.interval_step;
    slider.value = S.interval;
    var valLabel = el("span", "range-val");
    valLabel.textContent = S.interval + "s";
    slider.oninput = function () {
      valLabel.textContent = slider.value + "s";
    };
    slider.onchange = function () {
      post(endpoints.interval + "/set", { value: slider.value });
    };
    rw.appendChild(slider);
    rw.appendChild(valLabel);
    f3.appendChild(rw);
    disp.appendChild(f3);

    var f4 = field("Backlight");
    var rw2 = el("div", "range-wrap");
    var bSlider = document.createElement("input");
    bSlider.type = "range";
    bSlider.min = 0;
    bSlider.max = 100;
    bSlider.step = 1;
    bSlider.value = S.backlight_on ? S.brightness : 0;
    var bVal = el("span", "range-val");
    bVal.textContent = (S.backlight_on ? S.brightness : 0) + "%";
    bSlider.oninput = function () {
      bVal.textContent = bSlider.value + "%";
    };
    bSlider.onchange = function () {
      var v = parseInt(bSlider.value);
      if (v === 0) {
        post(endpoints.backlight + "/turn_off");
      } else {
        post(endpoints.backlight + "/turn_on", {
          brightness: (v / 100).toFixed(2),
        });
      }
    };
    rw2.appendChild(bSlider);
    rw2.appendChild(bVal);
    f4.appendChild(rw2);
    disp.appendChild(f4);
    wrap.appendChild(disp);

    // Clock
    var clk = el("div", "card");
    clk.innerHTML = "<h3>Clock</h3>";

    var f5 = field("");
    var tr = el("div", "toggle-row");
    tr.innerHTML = "<span>Show Clock</span>";
    var tog = el("div", S.show_clock ? "toggle on" : "toggle");
    tog.onclick = function () {
      S.show_clock = !S.show_clock;
      tog.className = S.show_clock ? "toggle on" : "toggle";
      post(
        endpoints.show_clock + (S.show_clock ? "/turn_on" : "/turn_off")
      );
    };
    tr.appendChild(tog);
    f5.appendChild(tr);
    clk.appendChild(f5);

    var f6 = field("Format");
    var seg = el("div", "segment");
    S.clock_options.forEach(function (opt) {
      var b = document.createElement("button");
      b.textContent = opt;
      b.className = opt === S.clock_format ? "active" : "";
      b.onclick = function () {
        post(endpoints.clock_format + "/set", { option: opt });
        S.clock_format = opt;
        seg.querySelectorAll("button").forEach(function (x) {
          x.className = x.textContent === opt ? "active" : "";
        });
      };
      seg.appendChild(b);
    });
    f6.appendChild(seg);
    clk.appendChild(f6);

    var f7 = field("Timezone");
    f7.appendChild(
      searchableSelect(S.tz_options, S.timezone, function (v) {
        post(endpoints.timezone + "/set", { option: v });
        S.timezone = v;
      })
    );
    clk.appendChild(f7);
    wrap.appendChild(clk);

    // Firmware (only if data available)
    if (S.firmware || S.installed_version) {
      var fw = el("div", "card");
      fw.innerHTML = "<h3>Firmware</h3>";
      var ver = el("div", "field");
      ver.innerHTML =
        '<label>Version</label><span style="font-size:.9rem">' +
        esc(S.firmware || S.installed_version) +
        "</span>";
      fw.appendChild(ver);

      if (S.update_available) {
        var upd = el("div", "field");
        upd.innerHTML =
          '<label>Update Available</label><span style="font-size:.9rem;color:var(--accent)">' +
          esc(S.latest_version) +
          "</span>";
        fw.appendChild(upd);
      }

      var btnRow = el("div", "field");
      var checkBtn = el("button", "btn btn-secondary btn-sm");
      checkBtn.textContent = "Check for Update";
      checkBtn.onclick = function () {
        checkBtn.disabled = true;
        checkBtn.textContent = "Checking\u2026";
        post("/button/check_for_update/press")
          .then(function () {
            return new Promise(function (r) {
              setTimeout(r, 3000);
            });
          })
          .then(function () {
            return get(endpoints.update).catch(function () {
              return null;
            });
          })
          .then(function (data) {
            checkBtn.disabled = false;
            checkBtn.textContent = "Check for Update";
            if (
              data &&
              data.installed_version &&
              data.latest_version &&
              data.installed_version !== data.latest_version
            ) {
              S.update_available = true;
              S.latest_version = data.latest_version;
              renderSettings();
            }
          });
      };
      btnRow.appendChild(checkBtn);
      fw.appendChild(btnRow);
      wrap.appendChild(fw);
    }

    app.appendChild(wrap);

    if (S.firmware) {
      var verLine = el("div", "version");
      verLine.textContent = "v" + S.firmware;
      app.appendChild(verLine);
    }

    openSSE();
  }

  // --- SSE ---

  var evtSource = null;
  function openSSE() {
    if (evtSource) return;
    evtSource = new EventSource("/events");
    evtSource.addEventListener("state", function (e) {
      try {
        var d = JSON.parse(e.data);
        handleEvent(d);
      } catch (_) {}
    });
    evtSource.onerror = function () {
      setStatus(false);
    };
    evtSource.onopen = function () {
      setStatus(true);
    };
  }

  function handleEvent(d) {
    var id = d.id;
    var val = d.value != null ? d.value : d.state;
    if (id === "text-immich_url") {
      S.immich_url = val || "";
      updateInput("url", S.immich_url);
    } else if (id === "text-immich_api_key_text") {
      S.api_key = val || "";
    } else if (id === "select-clock_format_select") {
      S.clock_format = val;
    } else if (id === "select-timezone_select") {
      S.timezone = val;
    } else if (id === "number-slideshow_interval") {
      S.interval = parseFloat(val);
    } else if (id === "light-backlight") {
      S.backlight_on = d.state === "ON";
      S.brightness =
        d.brightness != null ? Math.round(d.brightness * 100) : S.brightness;
    } else if (id === "switch-show_clock") {
      S.show_clock = d.state === "ON" || val === true;
    }
  }

  function updateInput(type, value) {
    var inp = app.querySelector('input[type="' + type + '"]');
    if (inp && document.activeElement !== inp) inp.value = value;
  }

  function setStatus(online) {
    var el = document.getElementById("conn-status");
    if (!el) return;
    el.innerHTML = online
      ? '<span class="dot green"></span> Connected'
      : '<span class="dot red"></span> Disconnected';
  }

  // --- Searchable Select ---

  function searchableSelect(options, current, onChange) {
    var wrap = el("div", "searchable");
    var inp = document.createElement("input");
    inp.type = "text";
    inp.value = current || "";
    inp.placeholder = "Search\u2026";

    var dd = el("div", "dropdown");
    var highlighted = -1;

    function render(filter) {
      dd.innerHTML = "";
      var f = (filter || "").toLowerCase();
      var items = options.filter(function (o) {
        return !f || o.toLowerCase().indexOf(f) !== -1;
      });
      items.forEach(function (o, i) {
        var row = document.createElement("div");
        row.textContent = o;
        if (o === current) row.className = "selected";
        row.onmousedown = function (e) {
          e.preventDefault();
          inp.value = o;
          current = o;
          dd.classList.remove("open");
          onChange(o);
        };
        dd.appendChild(row);
      });
      highlighted = -1;
    }

    inp.onfocus = function () {
      inp.select();
      render(inp.value);
      dd.classList.add("open");
    };
    inp.oninput = function () {
      render(inp.value);
      dd.classList.add("open");
    };
    inp.onblur = function () {
      setTimeout(function () {
        dd.classList.remove("open");
      }, 150);
    };
    inp.onkeydown = function (e) {
      var items = dd.children;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        highlighted = Math.min(highlighted + 1, items.length - 1);
        updateHighlight(items);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        highlighted = Math.max(highlighted - 1, 0);
        updateHighlight(items);
      } else if (e.key === "Enter" && highlighted >= 0 && items[highlighted]) {
        e.preventDefault();
        items[highlighted].onmousedown({ preventDefault: function () {} });
      } else if (e.key === "Escape") {
        dd.classList.remove("open");
        inp.blur();
      }
    };

    function updateHighlight(items) {
      for (var i = 0; i < items.length; i++) {
        items[i].classList.toggle("highlight", i === highlighted);
      }
      if (items[highlighted]) {
        items[highlighted].scrollIntoView({ block: "nearest" });
      }
    }

    wrap.appendChild(inp);
    wrap.appendChild(dd);
    return wrap;
  }

  // --- Helpers ---

  function el(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  function field(labelText) {
    var f = el("div", "field");
    if (labelText) {
      var l = document.createElement("label");
      l.textContent = labelText;
      f.appendChild(l);
    }
    return f;
  }

  function input(type, value, placeholder) {
    var i = document.createElement("input");
    i.type = type;
    i.value = value || "";
    if (placeholder) i.placeholder = placeholder;
    return i;
  }

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  // --- Init ---

  app.innerHTML =
    '<div style="text-align:center;padding:60px 0;color:var(--text2)">Loading\u2026</div>';
  fetchAll()
    .then(function () {
      if (!S.immich_url) {
        renderWizard();
      } else {
        renderSettings();
      }
    })
    .catch(function () {
      app.innerHTML =
        '<div class="card" style="text-align:center"><h3>Connection Error</h3><p style="color:var(--text2);margin-top:8px">Could not reach the device. Make sure you\'re connected to its WiFi network.</p><button class="btn btn-primary btn-sm" style="margin-top:16px" onclick="location.reload()">Retry</button></div>';
    });
})();
