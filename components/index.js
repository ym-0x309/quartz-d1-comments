import { h } from "preact";

const styles = `
.blog-comments {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--lightgray);
}
.blog-comments-heading { margin-bottom: 1.25rem; }
.blog-comments-list { display: grid; gap: 1rem; }
.blog-comment {
  --comment-depth: 0;
  --comment-indent-step: 1.15rem;
  margin-inline-start: calc(var(--comment-indent-step) * var(--comment-indent-active, 0));
  padding: 1rem;
  border: 1px solid var(--lightgray);
  border-radius: 0.5rem;
}
.blog-comment-reply {
  margin-top: 0.75rem;
  background: color-mix(in srgb, var(--light) 75%, var(--lightgray));
}
.blog-comment-header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.75rem;
  margin-bottom: 0.4rem;
}
.blog-comment-author { color: var(--dark); font-weight: 600; }
.blog-comment-website,
.blog-comment-time,
.blog-comment-replying-to {
  color: var(--gray);
  font-size: 0.85rem;
}
.blog-comment-time { margin-left: auto; }
.blog-comment-replying-to { margin: 0 0 0.55rem; }
.blog-comment-body {
  margin: 0;
  color: var(--darkgray);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.blog-comment-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.75rem;
}
.blog-comments-reply-button,
.blog-comments-toggle-replies,
.blog-comments-cancel-reply {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--secondary);
  font: inherit;
  font-size: 0.9rem;
  cursor: pointer;
}
.blog-comments-reply-button:hover,
.blog-comments-toggle-replies:hover,
.blog-comments-cancel-reply:hover { text-decoration: underline; }
.blog-comment-children {
  display: grid;
  gap: 0.65rem;
  margin-top: 0.75rem;
}
.blog-comment-children[hidden] { display: none; }
.blog-comment-children-list { display: grid; gap: 0.65rem; }
.blog-comment-reply-slot:empty { display: none; }
.blog-comments-empty,
.blog-comments-error { color: var(--gray); }
.blog-comments-more,
.blog-comments-load-more {
  justify-self: start;
  margin-top: 0.75rem;
  padding: 0.45rem 0.85rem;
  border: 1px solid var(--lightgray);
  border-radius: 0.4rem;
  background: transparent;
  color: var(--dark);
  cursor: pointer;
}
.blog-comments-form {
  display: grid;
  gap: 0.9rem;
  max-width: 48rem;
  margin-top: 2rem;
}
.blog-comments-form-heading { margin: 0; }
.blog-comments-field {
  display: grid;
  gap: 0.35rem;
  color: var(--dark);
  font-weight: 600;
}
.blog-comments-field input,
.blog-comments-field textarea {
  box-sizing: border-box;
  width: 100%;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--lightgray);
  border-radius: 0.4rem;
  background: var(--light);
  color: var(--dark);
  font: inherit;
  font-weight: 400;
}
.blog-comments-field textarea { resize: vertical; }
.blog-comments-field input:focus-visible,
.blog-comments-field textarea:focus-visible,
.blog-comments-more:focus-visible,
.blog-comments-load-more:focus-visible,
.blog-comments-submit:focus-visible,
.blog-comments-reply-button:focus-visible,
.blog-comments-toggle-replies:focus-visible,
.blog-comments-cancel-reply:focus-visible {
  outline: 2px solid var(--secondary);
  outline-offset: 2px;
}
.blog-comments-turnstile { min-height: 65px; }
.blog-comments-message {
  min-height: 1.4em;
  margin: 0;
  color: var(--secondary);
  font-size: 0.9rem;
}
.blog-comments-submit {
  justify-self: start;
  padding: 0.6rem 1rem;
  border: 0;
  border-radius: 0.4rem;
  background: var(--secondary);
  color: var(--light);
  font: inherit;
  cursor: pointer;
}
.blog-comments-submit:disabled,
.blog-comments-more:disabled,
.blog-comments-load-more:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
.blog-comments-privacy {
  margin: 0;
  color: var(--gray);
  font-size: 0.85rem;
}
@media (max-width: 600px) {
  .blog-comment {
    --comment-indent-step: 0.55rem;
    padding: 0.8rem;
  }
}
`;

const script = String.raw`
(() => {
  const initializedKey = "__ymhBlogCommentsInitialized";
  if (window[initializedKey]) return;
  window[initializedKey] = true;

  let turnstilePromise;

  function loadTurnstile() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (turnstilePromise) return turnstilePromise;
    turnstilePromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.blogCommentsTurnstile = "true";
      script.onload = () => window.turnstile
        ? resolve(window.turnstile)
        : reject(new Error("Turnstile API did not initialize"));
      script.onerror = () => reject(new Error("Turnstile script failed to load"));
      document.head.appendChild(script);
    });
    return turnstilePromise;
  }

  function makeMessage(className, text) {
    const element = document.createElement("p");
    element.className = className;
    element.textContent = text;
    return element;
  }

  function safeWebsite(value) {
    if (typeof value !== "string" || !value) return null;
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" && url.protocol !== "http:") return null;
      if (url.username || url.password) return null;
      return url;
    } catch {
      return null;
    }
  }

  function makeButton(className, text, data = {}) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = text;
    for (const [key, value] of Object.entries(data)) {
      button.dataset[key] = String(value);
    }
    return button;
  }

  function renderComment(comment, locale, depth = 0, parentNickname = null) {
    const article = document.createElement("article");
    article.className = depth === 0 ? "blog-comment" : "blog-comment blog-comment-reply";
    article.dataset.commentId = String(comment.id ?? "");
    article.dataset.replyCount = String(Number(comment.replyCount) || 0);
    article.style.setProperty("--comment-depth", String(depth));
    // Each nested level adds one step up to level three; deeper levels
    // preserve their logical depth without consuming additional width.
    article.style.setProperty("--comment-indent-active", depth > 0 && depth <= 3 ? "1" : "0");

    const header = document.createElement("div");
    header.className = "blog-comment-header";

    const author = document.createElement("span");
    author.className = "blog-comment-author";
    author.textContent = String(comment.nickname ?? "Anonymous");
    header.appendChild(author);

    const website = safeWebsite(comment.website);
    if (website) {
      const link = document.createElement("a");
      link.className = "blog-comment-website";
      link.href = website.href;
      link.target = "_blank";
      link.rel = "nofollow noopener noreferrer";
      link.textContent = website.hostname;
      header.appendChild(link);
    }

    const timestamp = Number(comment.createdAt);
    if (Number.isFinite(timestamp) && timestamp > 0) {
      const date = new Date(timestamp * 1000);
      const time = document.createElement("time");
      time.className = "blog-comment-time";
      time.dateTime = date.toISOString();
      time.textContent = date.toLocaleString(locale);
      header.appendChild(time);
    }

    article.appendChild(header);

    if (parentNickname) {
      const context = document.createElement("p");
      context.className = "blog-comment-replying-to";
      context.textContent = "Replying to " + parentNickname;
      article.appendChild(context);
    }

    const body = document.createElement("p");
    body.className = "blog-comment-body";
    body.textContent = String(comment.body ?? "");
    article.appendChild(body);

    const actions = document.createElement("div");
    actions.className = "blog-comment-actions";
    actions.appendChild(makeButton(
      "blog-comments-reply-button",
      "Reply",
      { replyTo: comment.id, replyAuthor: comment.nickname ?? "this comment" },
    ));

    const replyCount = Number(comment.replyCount) || 0;
    if (replyCount > 0) {
      actions.appendChild(makeButton(
        "blog-comments-toggle-replies",
        "View " + replyCount + (replyCount === 1 ? " reply" : " replies"),
        { toggleReplies: comment.id },
      ));
    }

    article.appendChild(actions);

    const replySlot = document.createElement("div");
    replySlot.className = "blog-comment-reply-slot";
    article.appendChild(replySlot);

    const children = document.createElement("div");
    children.className = "blog-comment-children";
    children.hidden = true;

    const childList = document.createElement("div");
    childList.className = "blog-comment-children-list";
    children.appendChild(childList);

    const loadMore = makeButton("blog-comments-load-more", "Load more replies", {
      loadMoreReplies: comment.id,
    });
    loadMore.hidden = true;
    children.appendChild(loadMore);

    article.appendChild(children);
    return article;
  }

  async function mount() {
    const root = document.getElementById("blog-comments");
    if (!root || root.dataset.mounted === "true") return;
    root.dataset.mounted = "true";

    const list = root.querySelector(".blog-comments-list");
    const moreButton = root.querySelector(".blog-comments-more");
    const form = root.querySelector(".blog-comments-form");
    const formHome = root.querySelector(".blog-comments-form-home");
    const formHeading = root.querySelector(".blog-comments-form-heading");
    const message = root.querySelector(".blog-comments-message");
    const submitButton = root.querySelector(".blog-comments-submit");
    const cancelReplyButton = root.querySelector(".blog-comments-cancel-reply");
    const turnstileContainer = root.querySelector(".blog-comments-turnstile");
    const siteKey = root.dataset.turnstileSiteKey ?? "";
    const locale = root.dataset.locale || "en-US";
    const apiPath = root.dataset.apiPath || "/api/comments";

    let apiUrl;
    try {
      apiUrl = new URL(apiPath, window.location.origin);
      if (apiUrl.origin !== window.location.origin) {
        throw new Error("The comments API must be same-origin");
      }
      apiUrl.search = "";
      apiUrl.hash = "";
    } catch {
      list.replaceChildren(makeMessage("blog-comments-error", "The comments API URL is invalid."));
      submitButton.disabled = true;
      return;
    }

    let rootOffset = 0;
    let rootHasMore = false;
    let turnstile = null;
    let widgetId = null;
    let turnstileToken = null;
    const threadStates = new Map();

    const setMessage = (text) => { message.textContent = text; };

    function closeReplyForm() {
      formHome.appendChild(form);
      delete form.dataset.parentId;
      formHeading.textContent = "Leave a comment";
      submitButton.textContent = "Post comment";
      cancelReplyButton.hidden = true;
    }

    function openReplyForm(parentId, authorName, slot) {
      form.dataset.parentId = parentId;
      formHeading.textContent = "Reply to " + authorName;
      submitButton.textContent = "Post reply";
      cancelReplyButton.hidden = false;
      slot.appendChild(form);
      setMessage("");
      form.elements.namedItem("body").focus();
    }

    function endpointFor(parentId, offset) {
      const endpoint = new URL(apiUrl.href);
      endpoint.searchParams.set("page", window.location.pathname);
      endpoint.searchParams.set("limit", "20");
      endpoint.searchParams.set("offset", String(offset));
      if (parentId) endpoint.searchParams.set("parentId", parentId);
      return endpoint;
    }

    async function requestComments(parentId, offset) {
      const response = await fetch(endpointFor(parentId, offset).href, {
        headers: { Accept: "application/json" },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to load comments.");
      return data;
    }

    async function loadRootComments(reset) {
      const offset = reset ? 0 : rootOffset;
      list.setAttribute("aria-busy", "true");
      moreButton.disabled = true;
      if (reset) {
        closeReplyForm();
        list.replaceChildren(makeMessage("blog-comments-empty", "Loading comments…"));
      }

      try {
        const data = await requestComments(null, offset);
        const comments = Array.isArray(data.comments) ? data.comments : [];
        if (reset) list.replaceChildren();
        for (const comment of comments) {
          list.appendChild(renderComment(comment, locale));
        }
        if (reset && comments.length === 0) {
          list.appendChild(makeMessage("blog-comments-empty", "No comments yet. Be the first to comment."));
        }
        rootHasMore = data.hasMore === true && Number.isInteger(data.nextOffset);
        rootOffset = rootHasMore ? data.nextOffset : 0;
        moreButton.hidden = !rootHasMore;
      } catch (error) {
        if (reset) list.replaceChildren(makeMessage(
          "blog-comments-error",
          "Unable to load comments. Please refresh the page.",
        ));
        else setMessage(error instanceof Error ? error.message : "Unable to load comments.");
      } finally {
        list.setAttribute("aria-busy", "false");
        moreButton.disabled = false;
      }
    }

    async function loadReplies(parentId, article, reset) {
      const childList = article.querySelector(".blog-comment-children-list");
      const loadMore = article.querySelector(".blog-comments-load-more");
      const children = article.querySelector(".blog-comment-children");
      const state = threadStates.get(parentId) ?? { offset: 0, hasMore: false, loaded: false, loading: false };
      if (state.loading) return;
      state.loading = true;
      threadStates.set(parentId, state);
      loadMore.disabled = true;
      if (reset) childList.replaceChildren(makeMessage("blog-comments-empty", "Loading replies…"));

      try {
        const data = await requestComments(parentId, reset ? 0 : state.offset);
        const comments = Array.isArray(data.comments) ? data.comments : [];
        if (reset) childList.replaceChildren();
        const parentAuthor = article.querySelector(".blog-comment-author")?.textContent || "this comment";
        for (const comment of comments) {
          childList.appendChild(renderComment(comment, locale, Number(article.style.getPropertyValue("--comment-depth")) + 1, parentAuthor));
        }
        if (reset && comments.length === 0) {
          childList.appendChild(makeMessage("blog-comments-empty", "No replies yet."));
        }
        state.hasMore = data.hasMore === true && Number.isInteger(data.nextOffset);
        state.offset = state.hasMore ? data.nextOffset : 0;
        state.loaded = true;
        loadMore.hidden = !state.hasMore;
        children.hidden = false;
        const toggle = article.querySelector("[data-toggle-replies]");
        if (toggle) toggle.textContent = "Hide replies";
      } catch (error) {
        if (reset) childList.replaceChildren(makeMessage(
          "blog-comments-error",
          error instanceof Error ? error.message : "Unable to load replies.",
        ));
        else setMessage(error instanceof Error ? error.message : "Unable to load replies.");
      } finally {
        state.loading = false;
        loadMore.disabled = false;
      }
    }

    function updateReplyCount(article, delta) {
      const nextCount = Math.max(0, Number(article.dataset.replyCount || 0) + delta);
      article.dataset.replyCount = String(nextCount);
      let toggle = article.querySelector("[data-toggle-replies]");
      if (nextCount === 0) {
        toggle?.remove();
        return;
      }
      if (!toggle) {
        toggle = makeButton("blog-comments-toggle-replies", "", {
          toggleReplies: article.dataset.commentId,
        });
        article.querySelector(".blog-comment-actions").appendChild(toggle);
      }
      const expanded = !article.querySelector(".blog-comment-children").hidden;
      toggle.textContent = expanded
        ? "Hide replies"
        : "View " + nextCount + (nextCount === 1 ? " reply" : " replies");
    }

    cancelReplyButton.addEventListener("click", closeReplyForm);

    list.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const replyButton = target.closest("[data-reply-to]");
      if (replyButton && list.contains(replyButton)) {
        const article = replyButton.closest(".blog-comment");
        const slot = article?.querySelector(".blog-comment-reply-slot");
        if (article && slot) {
          openReplyForm(article.dataset.commentId, replyButton.dataset.replyAuthor || "this comment", slot);
        }
        return;
      }

      const toggle = target.closest("[data-toggle-replies]");
      if (toggle && list.contains(toggle)) {
        const article = toggle.closest(".blog-comment");
        const parentId = toggle.dataset.toggleReplies;
        const children = article?.querySelector(".blog-comment-children");
        if (!article || !children) return;
        if (!children.hidden) {
          children.hidden = true;
          toggle.textContent = "View " + article.dataset.replyCount +
            (Number(article.dataset.replyCount) === 1 ? " reply" : " replies");
          return;
        }
        children.hidden = false;
        const state = threadStates.get(parentId);
        if (!state?.loaded) await loadReplies(parentId, article, true);
        else toggle.textContent = "Hide replies";
        return;
      }

      const loadMore = target.closest("[data-load-more-replies]");
      if (loadMore && list.contains(loadMore)) {
        const article = loadMore.closest(".blog-comment");
        const parentId = loadMore.dataset.loadMoreReplies;
        if (article) await loadReplies(parentId, article, false);
      }
    });

    moreButton.addEventListener("click", () => {
      if (rootHasMore) loadRootComments(false);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      if (!turnstileToken) {
        setMessage("Please complete the spam protection check before posting.");
        return;
      }

      const fields = new FormData(form);
      const parentId = form.dataset.parentId || null;
      const payload = {
        pagePath: window.location.pathname,
        parentId,
        nickname: String(fields.get("nickname") ?? ""),
        email: String(fields.get("email") ?? ""),
        website: String(fields.get("website") ?? "").trim() || null,
        body: String(fields.get("body") ?? ""),
        turnstileToken,
      };

      submitButton.disabled = true;
      submitButton.textContent = parentId ? "Posting reply…" : "Posting…";
      setMessage("");

      try {
        const response = await fetch(apiUrl.href, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (response.status === 403 && turnstile) {
            turnstileToken = null;
            turnstile.reset(widgetId);
          }
          if (response.status === 403) throw new Error("Spam protection verification failed. Please try again.");
          if (response.status === 503) throw new Error("Spam protection is temporarily unavailable. Please try again later.");
          throw new Error(data.error || "Unable to post your comment.");
        }

        form.elements.namedItem("body").value = "";
        turnstileToken = null;
        if (turnstile) turnstile.reset(widgetId);
        closeReplyForm();

        if (parentId) {
          const parentArticle = list.querySelector(
            '[data-comment-id="' + CSS.escape(parentId) + '"]',
          );
          if (parentArticle) {
            updateReplyCount(parentArticle, 1);
            const children = parentArticle.querySelector(".blog-comment-children");
            children.hidden = false;
            await loadReplies(parentId, parentArticle, true);
          }
          setMessage("Your reply has been posted.");
        } else {
          await loadRootComments(true);
          setMessage("Your comment has been posted.");
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to post your comment.");
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = form.dataset.parentId ? "Post reply" : "Post comment";
      }
    });

    await loadRootComments(true);

    if (!siteKey) {
      submitButton.disabled = true;
      setMessage("Set a Cloudflare Turnstile Site Key to enable comment submission.");
      return;
    }

    submitButton.disabled = true;
    try {
      turnstile = await loadTurnstile();
      if (!root.isConnected) return;
      widgetId = turnstile.render(turnstileContainer, {
        sitekey: siteKey,
        theme: "auto",
        language: "en",
        callback: (token) => { turnstileToken = token; setMessage(""); },
        "expired-callback": () => {
          turnstileToken = null;
          setMessage("The spam protection check expired. Please verify again.");
        },
        "error-callback": () => {
          turnstileToken = null;
          setMessage("Unable to load spam protection. Please refresh the page.");
        },
      });
      submitButton.disabled = false;
    } catch {
      setMessage("Unable to load Turnstile. Please refresh the page.");
    }
  }

  document.addEventListener("nav", mount);
  document.addEventListener("render", mount);
  mount();
})();
`;

export function BlogComments(options = {}) {
  const apiPath = options.apiPath ?? "/api/comments";
  const turnstileSiteKey = options.turnstileSiteKey ?? "";
  const locale = options.locale ?? "en-US";

  const BlogCommentsComponent = ({ displayClass, fileData }) => {
    const commentsEnabled = fileData.frontmatter?.comments;
    if (commentsEnabled === false || commentsEnabled === "false") return null;

    return h("section", {
      id: "blog-comments",
      class: ["blog-comments", displayClass].filter(Boolean).join(" "),
      "data-api-path": apiPath,
      "data-turnstile-site-key": turnstileSiteKey,
      "data-locale": locale,
      lang: "en",
      "aria-labelledby": "blog-comments-heading",
    }, [
      h("h2", { id: "blog-comments-heading", class: "blog-comments-heading" }, "Comments"),
      h("div", { class: "blog-comments-list", "aria-live": "polite", "aria-busy": "true" }),
      h("button", { type: "button", class: "blog-comments-more", hidden: true }, "Load more"),
      h("div", { class: "blog-comments-form-home" }, [
        h("form", { class: "blog-comments-form" }, [
          h("h3", { class: "blog-comments-form-heading" }, "Leave a comment"),
          h("label", { class: "blog-comments-field" }, [
            h("span", {}, "Nickname"),
            h("input", { type: "text", name: "nickname", maxLength: 40, autoComplete: "nickname", placeholder: "Your display name", required: true }),
          ]),
          h("label", { class: "blog-comments-field" }, [
            h("span", {}, "Email"),
            h("input", { type: "email", name: "email", maxLength: 254, autoComplete: "email", placeholder: "Your email address", required: true }),
          ]),
          h("label", { class: "blog-comments-field" }, [
            h("span", {}, "Website (optional)"),
            h("input", { type: "url", name: "website", maxLength: 2048, autoComplete: "url", placeholder: "https://example.com" }),
          ]),
          h("label", { class: "blog-comments-field" }, [
            h("span", {}, "Comment"),
            h("textarea", { name: "body", rows: 5, maxLength: 5000, placeholder: "Write your comment…", required: true }),
          ]),
          h("div", { class: "blog-comments-turnstile", "aria-label": "Spam protection check" }),
          h("p", { class: "blog-comments-message", role: "status", "aria-live": "polite" }),
          h("button", { type: "submit", class: "blog-comments-submit", disabled: true }, "Post comment"),
          h("button", { type: "button", class: "blog-comments-cancel-reply", hidden: true }, "Cancel reply"),
          h("p", { class: "blog-comments-privacy" },
            "Comments are published immediately. Your email address is not displayed and is stored for comment administration and spam prevention.",
          ),
        ]),
      ]),
    ]);
  };

  BlogCommentsComponent.css = styles;
  BlogCommentsComponent.afterDOMLoaded = script;
  return BlogCommentsComponent;
}
