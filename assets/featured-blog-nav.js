(function () {
  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function initSection(section) {
    var sectionId = section.dataset.featuredBlogSection;
    var data = window['__featuredBlogData_' + sectionId];
    if (!data || !data.articles || data.articles.length < 2) return;

    var articles = data.articles;
    var authorRole = data.authorRole || '';
    var currentIdx = 0;

    var primaryEl = section.querySelector('[data-fb-article="primary"]');
    var secondaryEl = section.querySelector('[data-fb-article="secondary"]');
    var prevBtn = section.querySelector('[data-fb-nav="prev"]');
    var nextBtn = section.querySelector('[data-fb-nav="next"]');

    function q(parent, attr) {
      return parent ? parent.querySelector('[data-fb-field="' + attr + '"]') : null;
    }

    function updatePrimary(article, secondaryArticle) {
      var el;

      el = q(primaryEl, 'index');
      if (el) el.textContent = pad(currentIdx + 1);

      el = q(primaryEl, 'meta-date');
      if (el) el.textContent = article.date;

      el = q(primaryEl, 'title-link');
      if (el) { el.textContent = article.title; el.href = article.url; }

      el = q(primaryEl, 'excerpt');
      if (el) el.textContent = article.excerpt;

      el = q(primaryEl, 'tags');
      if (el) {
        el.innerHTML = '';
        (article.tags || []).forEach(function (tag) {
          var span = document.createElement('span');
          span.className = 'featured-blog-v2__tag';
          span.textContent = tag;
          el.appendChild(span);
        });
      }

      el = q(primaryEl, 'read-time');
      if (el) el.textContent = (article.readMinutes || 1) + ' MIN READ \u2022 ' + article.date;

      el = q(primaryEl, 'quote');
      if (el) el.textContent = '\u201c' + (secondaryArticle ? secondaryArticle.title : article.title) + '\u201d';

      el = q(primaryEl, 'author-name');
      if (el) el.textContent = article.author;

      el = q(primaryEl, 'author-role');
      if (el) el.textContent = authorRole;

      el = q(primaryEl, 'article-link');
      if (el) el.href = article.url;
    }

    function updateSecondary(article) {
      var el;

      el = q(secondaryEl, 'image-link');
      if (el) {
        el.href = article.url;
        var imgEl = el.querySelector('img');
        if (imgEl && article.image) {
          imgEl.srcset = '';
          imgEl.src = article.image;
          imgEl.alt = article.imageAlt || article.title;
        }
      }

      el = q(secondaryEl, 'meta-date');
      if (el) el.textContent = article.date;

      el = q(secondaryEl, 'title-link');
      if (el) { el.textContent = article.title; el.href = article.url; }

      el = q(secondaryEl, 'author-name');
      if (el) el.textContent = article.author;

      el = q(secondaryEl, 'author-role');
      if (el) el.textContent = authorRole;

      el = q(secondaryEl, 'article-link');
      if (el) el.href = article.url;
    }

    function navigate(direction) {
      currentIdx = (currentIdx + direction + articles.length) % articles.length;
      var secondaryIdx = (currentIdx + 1) % articles.length;
      updatePrimary(articles[currentIdx], articles[secondaryIdx]);
      updateSecondary(articles[secondaryIdx]);
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { navigate(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { navigate(1); });
  }

  function init() {
    document.querySelectorAll('[data-featured-blog-section]').forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
