// The public lab site, drawn from feed.json.
//
// The feed is fetched rather than built in, so publishing from Euronia changes the site at
// once: no build, no Action, no secret in this repository. What is here is the shape; what
// is in the feed is the lab.
//
// Everything that comes out of the feed is set as text, never as markup, because the feed
// is a file in a repository and a site that executes what it reads is a site waiting for an
// accident. The one exception is prose, which is rendered from a small, closed subset of
// Markdown written here, element by element.

(function () {
  "use strict";

  var el = function (sel) { return document.querySelector(sel); };

  function show(section, on) {
    var node = el('[data-section="' + section + '"]');
    if (node) node.hidden = !on;
  }

  /** A date a person reads: "March 2027", or the year alone when that is all there is. */
  function saysWhen(iso) {
    if (!iso) return "";
    var parts = String(iso).slice(0, 10).split("-");
    var MONTHS = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    var month = Number(parts[1]);
    if (!month || !MONTHS[month - 1]) return parts[0];
    return MONTHS[month - 1] + " " + parts[0];
  }

  var SAFE = /^(https?:|mailto:)/i;

  function link(href, label) {
    if (!href || !SAFE.test(href)) return document.createTextNode(label);
    var a = document.createElement("a");
    a.href = href;
    a.textContent = label;
    if (/^https?:/i.test(href)) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
    return a;
  }

  /** "Email / CV / Scholar / GitHub", the line every one of the reference sites has. */
  function slashes(into, items) {
    var put = 0;
    items.forEach(function (item) {
      if (!item || !item.href || !item.label) return;
      if (put > 0) {
        var sep = document.createElement("span");
        sep.className = "sep";
        sep.textContent = "/";
        into.appendChild(sep);
      }
      into.appendChild(link(item.href, item.label));
      put += 1;
    });
    return put;
  }

  /**
   * Prose, from a closed subset of Markdown.
   *
   * Paragraphs, three levels of heading, bullet lists, and nothing else. Built as elements
   * with textContent, so there is no path from the feed to markup however it is written.
   */
  function prose(into, source) {
    into.textContent = "";
    String(source || "").replace(/\r\n/g, "\n").split(/\n{2,}/).forEach(function (block) {
      var lines = block.split("\n").filter(function (l) { return l.trim() !== ""; });
      if (lines.length === 0) return;

      if (lines.every(function (l) { return /^\s*[-*]\s+/.test(l); })) {
        var ul = document.createElement("ul");
        ul.className = "aims";
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

  /**
   * The authors of a paper, with your own name marked.
   *
   * Every reference site does this, and it is the one piece of formatting a publications
   * list genuinely needs: it is how a reader finds you in a list of eleven names.
   */
  function authors(into, line, me) {
    var surname = String(me || "").trim().split(/\s+/).pop();
    if (!surname || surname.length < 3) { into.textContent = line; return; }

    var parts = String(line).split(new RegExp("(" + surname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")"));
    parts.forEach(function (part, i) {
      if (i % 2 === 1) {
        var strong = document.createElement("span");
        strong.className = "me";
        strong.textContent = part;
        into.appendChild(strong);
      } else if (part) {
        into.appendChild(document.createTextNode(part));
      }
    });
  }

  function draw(feed) {
    var lab = feed.lab || {};
    var person = feed.person || {};
    var name = person.name || lab.name || "Euronia";

    document.title = lab.name && person.name ? person.name + " · " + lab.name : name;
    el("[data-person-name]").textContent = name;

    var role = [person.role, person.affiliation].filter(Boolean).join(", ");
    if (role) {
      el("[data-person-role]").textContent = role;
      el("[data-person-role]").hidden = false;
    }

    if (person.photo && /^https?:/i.test(person.photo)) {
      var photo = el("[data-photo]");
      photo.src = person.photo;
      photo.alt = name;
      photo.hidden = false;
    }

    // The bio is the blurb and the research statement, read as one piece of prose, which is
    // how these sites read: there is no "about" page, there is the top of the page.
    var bio = [person.blurb, feed.about].filter(function (x) { return String(x || "").trim(); }).join("\n\n");
    if (bio) prose(el("[data-bio]"), bio);

    var line = el("[data-links]");
    var put = slashes(line, [
      person.email ? { label: "Email", href: "mailto:" + person.email } : null,
      feed.cv && feed.cv.href ? { label: "CV", href: feed.cv.href } : null,
    ].concat(person.links || []));
    line.hidden = put === 0;

    var research = feed.research || [];
    show("research", research.length > 0);
    var lines = el("[data-research]");
    research.forEach(function (item) {
      var box = document.createElement("article");
      box.className = "line";

      var h = document.createElement("h3");
      h.textContent = item.title || "";
      if (item.stage) {
        var stage = document.createElement("span");
        stage.className = "stage";
        stage.textContent = item.stage;
        h.appendChild(stage);
      }
      box.appendChild(h);

      if (item.subtitle) {
        var sub = document.createElement("p");
        sub.className = "sub";
        sub.textContent = item.subtitle;
        box.appendChild(sub);
      }
      if (item.question) {
        var q = document.createElement("p");
        q.className = "question";
        q.textContent = item.question;
        box.appendChild(q);
      }
      if ((item.aims || []).length) {
        var aims = document.createElement("ul");
        aims.className = "aims";
        item.aims.forEach(function (aim) {
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
    var pubBox = el("[data-publications]");
    pubs.forEach(function (pub) {
      var box = document.createElement("article");
      box.className = "pub";

      var title = document.createElement("p");
      title.className = "title";
      title.appendChild(link(pub.href || pub.doi, pub.title || "Untitled"));
      if (pub.kind && pub.kind !== "paper") {
        var kind = document.createElement("span");
        kind.className = "kind";
        kind.textContent = pub.kind;
        title.appendChild(kind);
      }
      box.appendChild(title);

      if (pub.authors) {
        var who = document.createElement("p");
        who.className = "authors";
        authors(who, pub.authors, person.name);
        box.appendChild(who);
      }

      if (pub.venue || pub.year) {
        var where = document.createElement("p");
        where.className = "where";
        var venue = document.createElement("span");
        venue.className = "venue";
        venue.textContent = [pub.venue, pub.year].filter(Boolean).join(", ");
        where.appendChild(venue);
        box.appendChild(where);
      }

      if ((pub.links || []).length) {
        var places = document.createElement("p");
        places.className = "links";
        if (slashes(places, pub.links)) box.appendChild(places);
      }

      if (pub.note) {
        var note = document.createElement("p");
        note.className = "note";
        note.textContent = pub.note;
        box.appendChild(note);
      }

      pubBox.appendChild(box);
    });

    /** Talks, software and news are the same shape: a label, a thing, and an aside. */
    function plain(section, list, make) {
      show(section, list.length > 0);
      var into = el("[data-" + section + "]");
      list.forEach(function (item) {
        var parts = make(item);
        var li = document.createElement("li");

        var when = document.createElement("span");
        when.className = "when";
        when.textContent = parts.when || "";
        li.appendChild(when);

        var what = document.createElement("span");
        what.className = "what";
        if (parts.href) what.appendChild(link(parts.href, parts.what));
        else what.textContent = parts.what;
        li.appendChild(what);

        if (parts.aside) {
          var aside = document.createElement("span");
          aside.className = "aside";
          aside.textContent = parts.aside;
          li.appendChild(aside);
        }
        into.appendChild(li);
      });
    }

    plain("talks", feed.talks || [], function (talk) {
      return { when: saysWhen(talk.on), what: talk.title || "A talk", href: talk.href, aside: talk.where };
    });
    plain("software", feed.software || [], function (item) {
      return { when: item.language || "", what: item.name || "", href: item.href, aside: item.what };
    });
    plain("news", feed.news || [], function (item) {
      return { when: saysWhen(item.on), what: item.body || "", href: item.href };
    });

    var contact = feed.contact || {};
    var bits = [];
    if (contact.email) bits.push({ label: contact.email, href: "mailto:" + contact.email });
    show("contact", !!(contact.email || contact.where || contact.note));
    var box = el("[data-contact]");
    if (contact.email) {
      var first = document.createElement("span");
      first.className = "line";
      first.appendChild(link("mailto:" + contact.email, contact.email));
      box.appendChild(first);
    }
    [contact.where, contact.note].forEach(function (text) {
      if (!text) return;
      var span = document.createElement("span");
      span.className = "line";
      span.textContent = text;
      box.appendChild(span);
    });

    var anything = research.length || pubs.length || (feed.talks || []).length
      || (feed.software || []).length || (feed.news || []).length || bio || bits.length;
    el("[data-empty]").hidden = !!anything;

    if (feed.generatedAt) {
      el("[data-generated]").textContent = "Last published " + saysWhen(feed.generatedAt);
    }
  }

  fetch("feed.json", { cache: "no-cache" })
    .then(function (answer) { return answer.ok ? answer.json() : null; })
    .then(function (feed) {
      // A feed from a newer Euronia than this site understands: better to show the page as
      // it stands than to draw half of something.
      if (feed && feed.version === 1) draw(feed);
    })
    .catch(function () { /* No feed yet, or offline. The page stands as it is. */ });
})();
