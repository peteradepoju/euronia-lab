// The public lab site, drawn from feed.json.
//
// The feed is fetched rather than built in, so publishing from Euronia changes the site at
// once: no build, no Action, no secret in this repository. What is here is the shape; what
// is in the feed is the lab.
//
// Everything that comes out of the feed is set as text, never as markup, because the feed
// is a file in a repository and a site that executes what it reads is a site waiting for an
// accident. The one exception is the research statement, which is rendered from a small,
// closed subset of Markdown written here, element by element.

(function () {
  "use strict";

  var el = function (sel) { return document.querySelector(sel); };
  var all = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  function text(node, value) {
    if (!node) return;
    node.textContent = value == null ? "" : String(value);
  }

  function show(section, on) {
    var node = el('[data-section="' + section + '"]');
    if (node) node.hidden = !on;
  }

  /** A date a person reads: "March 2027", or the year alone when that is all there is. */
  function saysWhen(iso) {
    if (!iso) return "";
    var parts = String(iso).slice(0, 10).split("-");
    var year = parts[0];
    var month = Number(parts[1]);
    var MONTHS = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    if (!month || !MONTHS[month - 1]) return year;
    return MONTHS[month - 1] + " " + year;
  }

  function makeLink(href, label) {
    if (!href) return document.createTextNode(label);
    var a = document.createElement("a");
    // Only the two schemes a lab site needs. Anything else is shown as text.
    if (!/^(https?:|mailto:)/i.test(href)) return document.createTextNode(label);
    a.href = href;
    a.textContent = label;
    if (/^https?:/i.test(href)) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
    return a;
  }

  /**
   * The research statement, from a closed subset of Markdown.
   *
   * Paragraphs, three levels of heading, bullet lists, and nothing else. Built as elements
   * with textContent, so there is no path from the feed to markup however it is written.
   */
  function prose(into, source) {
    into.textContent = "";
    var blocks = String(source || "").replace(/\r\n/g, "\n").split(/\n{2,}/);
    blocks.forEach(function (block) {
      var lines = block.split("\n").filter(function (l) { return l.trim() !== ""; });
      if (lines.length === 0) return;

      if (lines.every(function (l) { return /^\s*[-*]\s+/.test(l); })) {
        var ul = document.createElement("ul");
        lines.forEach(function (line) {
          var li = document.createElement("li");
          li.textContent = line.replace(/^\s*[-*]\s+/, "");
          ul.appendChild(li);
        });
        into.appendChild(ul);
        return;
      }

      var heading = /^(#{1,3})\s+(.*)$/.exec(lines[0]);
      if (heading && lines.length === 1) {
        var h = document.createElement("h3");
        h.textContent = heading[2];
        into.appendChild(h);
        return;
      }

      var p = document.createElement("p");
      p.textContent = lines.join(" ");
      into.appendChild(p);
    });
  }

  function draw(feed) {
    var lab = feed.lab || {};
    var person = feed.person || {};

    text(el("[data-lab-name]"), lab.name || "Euronia");
    text(el("[data-lab-tagline]"), lab.tagline || "");
    text(el("[data-foot-name]"), person.name || lab.name || "Euronia");
    if (lab.name) document.title = person.name ? person.name + " · " + lab.name : lab.name;

    text(el("[data-person-name]"), person.name || lab.name || "Euronia");
    text(el("[data-person-role]"), [person.role, person.affiliation].filter(Boolean).join(" · "));
    text(el("[data-person-blurb]"), person.blurb || "");

    var interests = el("[data-interests]");
    (feed.interests || []).forEach(function (interest) {
      var li = document.createElement("li");
      li.textContent = interest;
      interests.appendChild(li);
    });

    var news = feed.news || [];
    if (news.length) {
      el("[data-news-box]").hidden = false;
      var list = el("[data-news]");
      news.slice(0, 6).forEach(function (item) {
        var li = document.createElement("li");
        var when = document.createElement("time");
        when.dateTime = String(item.on || "");
        when.textContent = saysWhen(item.on);
        var body = document.createElement("p");
        if (item.href) body.appendChild(makeLink(item.href, item.body || ""));
        else body.textContent = item.body || "";
        li.appendChild(when);
        li.appendChild(body);
        list.appendChild(li);
      });
    }

    var research = feed.research || [];
    show("research", research.length > 0);
    var lines = el("[data-research]");
    research.forEach(function (line) {
      var box = document.createElement("article");
      box.className = "line";

      var h = document.createElement("h3");
      h.textContent = line.title || "";
      if (line.stage) {
        var stage = document.createElement("span");
        stage.className = "stage";
        stage.textContent = line.stage;
        h.appendChild(stage);
      }
      box.appendChild(h);

      if (line.subtitle) {
        var sub = document.createElement("p");
        sub.className = "sub";
        sub.textContent = line.subtitle;
        box.appendChild(sub);
      }
      if (line.question) {
        var q = document.createElement("p");
        q.className = "question";
        q.textContent = line.question;
        box.appendChild(q);
      }
      if ((line.aims || []).length) {
        var aims = document.createElement("ul");
        aims.className = "aims";
        line.aims.forEach(function (aim) {
          var li = document.createElement("li");
          li.textContent = aim;
          aims.appendChild(li);
        });
        box.appendChild(aims);
      }
      lines.appendChild(box);
    });

    var pubs = feed.publications || [];
    show("publications", pubs.length > 0);
    var pubList = el("[data-publications]");
    pubs.forEach(function (pub) {
      var li = document.createElement("li");

      var title = document.createElement("p");
      title.className = "title";
      title.appendChild(makeLink(pub.href || pub.doi, pub.title || "Untitled"));
      if (pub.kind && pub.kind !== "paper") {
        var kind = document.createElement("span");
        kind.className = "kind";
        kind.textContent = pub.kind;
        title.appendChild(kind);
      }
      li.appendChild(title);

      var where = document.createElement("p");
      where.className = "where";
      where.textContent = [pub.authors, pub.venue, pub.year].filter(Boolean).join(" · ");
      if (where.textContent) li.appendChild(where);

      if (pub.note) {
        var note = document.createElement("p");
        note.className = "note";
        note.textContent = pub.note;
        li.appendChild(note);
      }
      pubList.appendChild(li);
    });

    var talks = feed.talks || [];
    show("talks", talks.length > 0);
    var talkList = el("[data-talks]");
    talks.forEach(function (talk) {
      var li = document.createElement("li");
      var when = document.createElement("span");
      when.className = "when";
      when.textContent = saysWhen(talk.on);
      var what = document.createElement("span");
      what.className = "what";
      what.appendChild(makeLink(talk.href, talk.title || "A talk"));
      var where = document.createElement("span");
      where.className = "aside";
      where.textContent = talk.where || "";
      li.appendChild(when);
      li.appendChild(what);
      li.appendChild(where);
      talkList.appendChild(li);
    });

    var software = feed.software || [];
    show("software", software.length > 0);
    var softList = el("[data-software]");
    software.forEach(function (item) {
      var li = document.createElement("li");
      var name = document.createElement("span");
      name.className = "when";
      name.appendChild(makeLink(item.href, item.name || ""));
      var what = document.createElement("span");
      what.className = "what";
      what.textContent = item.what || "";
      li.appendChild(name);
      li.appendChild(what);
      if (item.language) {
        var lang = document.createElement("span");
        lang.className = "aside";
        lang.textContent = item.language;
        li.appendChild(lang);
      }
      softList.appendChild(li);
    });

    var about = String(feed.about || "").trim();
    show("about", about.length > 0 || !!feed.cv);
    if (about) prose(el("[data-about]"), about);
    if (feed.cv && feed.cv.href) {
      var box = el("[data-cv-box]");
      var link = el("[data-cv]");
      if (/^https?:/i.test(feed.cv.href)) {
        link.href = feed.cv.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        box.hidden = false;
      }
    }

    var contact = feed.contact || {};
    var rows = [["Email", contact.email], ["Where", contact.where], ["", contact.note]]
      .filter(function (row) { return row[1]; });
    show("contact", rows.length > 0);
    var dl = el("[data-contact]");
    rows.forEach(function (row) {
      var dt = document.createElement("dt");
      dt.textContent = row[0];
      var dd = document.createElement("dd");
      if (row[0] === "Email") dd.appendChild(makeLink("mailto:" + row[1], row[1]));
      else dd.textContent = row[1];
      dl.appendChild(dt);
      dl.appendChild(dd);
    });

    var anything = research.length || pubs.length || talks.length || software.length
      || about || rows.length || news.length;
    el("[data-empty]").hidden = !!anything;

    // Hide a section's link in the bar when the section itself is not there.
    all(".top nav a").forEach(function (a) {
      var section = el('[data-section="' + a.getAttribute("href").slice(1) + '"]');
      if (section && section.hidden) a.hidden = true;
    });

    if (feed.generatedAt) {
      text(el("[data-generated]"), "Last published " + saysWhen(feed.generatedAt));
    }
  }

  fetch("feed.json", { cache: "no-cache" })
    .then(function (answer) { return answer.ok ? answer.json() : null; })
    .then(function (feed) {
      if (!feed) return;
      if (feed.version !== 1) {
        // A feed from a newer Euronia than this site understands. Better to show the page
        // as it was than to draw half of something.
        return;
      }
      draw(feed);
    })
    .catch(function () { /* No feed yet, or offline. The page stands as it is. */ });
})();
