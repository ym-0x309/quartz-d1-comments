import { h } from "preact";

const styles = `
.blog-comments {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--lightgray);
}

.blog-comments-heading {
  margin-bottom: 1.25rem;
}

.blog-comments-list {
  display: grid;
  gap: 1rem;
}

.blog-comment {
  padding: 1rem;
  border: 1px solid var(--lightgray);
  border-radius: 0.5rem;
}

.blog-comment-header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.75rem;
  margin-bottom: 0.65rem;
}

.blog-comment-author {
  color: var(--dark);
  font-weight: 600;
}

.blog-comment-website,
.blog-comment-time {
  color: var(--gray);
  font-size: 0.85rem;
}

.blog-comment-time {
  margin-left: auto;
}

.blog-comment-body {
  margin: 0;
  color: var(--darkgray);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.blog-comments-empty,
.blog-comments-error {
  color: var(--gray);
}

.blog-comments-more {
  margin-top: 1rem;
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

.blog-comments-form-heading {
  margin: 0;
}

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

.blog-comments-field textarea {
  resize: vertical;
}

.blog-comments-field input:focus-visible,
.blog-comments-field textarea:focus-visible,
.blog-comments-more:focus-visible,
.blog-comments-submit:focus-visible {
  outline: 2px solid var(--secondary);
  outline-offset: 2px;
}

.blog-comments-turnstile {
  min-height: 65px;
}

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
.blog-comments-more:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.blog-comments-privacy {
  margin: 0;
  color: var(--gray);
  font-size: 0.85rem;
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
      script.onload = () => {
        if (window.turnstile) resolve(window.turnstile);
        else reject(new Error("Turnstile API did not initialize"));
      };
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

  function renderComment(comment, locale) {
    const article = document.createElement("article");
    article.className = "blog-comment";

    const header = document.createElement("div");
    header.className = "blog-comment-header";

    const author = document.createElement("span");
    author.className = "blog-comment-author";
    author.textContent = String(comment.nickname ?? "익명");
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

    const body = document.createElement("p");
    body.className = "blog-comment-body";
    body.textContent = String(comment.body ?? "");

    article.append(header, body);
    return article;
  }

  async function mount() {
    const root = document.getElementById("blog-comments");
    if (!root || root.dataset.mounted === "true") return;
    root.dataset.mounted = "true";

    const list = root.querySelector(".blog-comments-list");
    const moreButton = root.querySelector(".blog-comments-more");
    const form = root.querySelector(".blog-comments-form");
    const message = root.querySelector(".blog-comments-message");
    const submitButton = root.querySelector(".blog-comments-submit");
    const turnstileContainer = root.querySelector(".blog-comments-turnstile");
    const siteKey = root.dataset.turnstileSiteKey ?? "";
    const locale = root.dataset.locale || "ko-KR";
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
      list.replaceChildren(makeMessage("blog-comments-error", "댓글 API 주소 설정이 올바르지 않습니다."));
      submitButton.disabled = true;
      return;
    }

    let nextOffset = 0;
    let hasMore = false;
    let turnstile = null;
    let widgetId = null;
    let turnstileToken = null;

    const setMessage = (text) => {
      message.textContent = text;
    };

    async function fetchComments(reset) {
      const offset = reset ? 0 : nextOffset;
      list.setAttribute("aria-busy", "true");
      if (reset) {
        list.replaceChildren(makeMessage("blog-comments-empty", "댓글을 불러오는 중입니다."));
      } else {
        moreButton.disabled = true;
      }

      try {
        const endpoint = new URL(apiUrl.href);
        endpoint.searchParams.set("page", window.location.pathname);
        endpoint.searchParams.set("limit", "30");
        endpoint.searchParams.set("offset", String(offset));

        const response = await fetch(endpoint.href, {
          headers: { Accept: "application/json" },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "댓글을 불러오지 못했습니다.");
        }

        const comments = Array.isArray(data.comments) ? data.comments : [];
        if (reset) list.replaceChildren();

        for (const comment of comments) {
          list.appendChild(renderComment(comment, locale));
        }

        if (reset && comments.length === 0) {
          list.appendChild(makeMessage("blog-comments-empty", "아직 댓글이 없습니다. 첫 댓글을 남겨 보세요."));
        }

        hasMore = data.hasMore === true && Number.isInteger(data.nextOffset);
        nextOffset = hasMore ? data.nextOffset : 0;
        moreButton.hidden = !hasMore;
      } catch (error) {
        if (reset) {
          list.replaceChildren(
            makeMessage("blog-comments-error", "댓글을 불러오지 못했습니다. 페이지를 새로고침해 주세요."),
          );
        } else {
          setMessage(error instanceof Error ? error.message : "댓글을 불러오지 못했습니다.");
        }
      } finally {
        list.setAttribute("aria-busy", "false");
        moreButton.disabled = false;
      }
    }

    moreButton.addEventListener("click", () => {
      if (hasMore) fetchComments(false);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      if (!turnstileToken) {
        setMessage("댓글을 등록하기 전에 스팸 방지 확인을 완료해 주세요.");
        return;
      }

      const fields = new FormData(form);
      const payload = {
        pagePath: window.location.pathname,
        nickname: String(fields.get("nickname") ?? ""),
        email: String(fields.get("email") ?? ""),
        website: String(fields.get("website") ?? "").trim() || null,
        body: String(fields.get("body") ?? ""),
        turnstileToken,
      };

      submitButton.disabled = true;
      submitButton.textContent = "등록 중…";
      setMessage("");

      try {
        const response = await fetch(apiUrl.href, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          if (response.status === 403 && turnstile) {
            turnstileToken = null;
            turnstile.reset(widgetId);
          }
          if (response.status === 403) {
            throw new Error("스팸 방지 확인에 실패했습니다. 다시 확인한 뒤 등록해 주세요.");
          }
          if (response.status === 503) {
            throw new Error("스팸 방지 서비스가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해 주세요.");
          }
          throw new Error(data.error || "댓글 등록에 실패했습니다.");
        }

        form.elements.namedItem("body").value = "";
        turnstileToken = null;
        if (turnstile) turnstile.reset(widgetId);
        setMessage("댓글이 등록되었습니다.");
        await fetchComments(true);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "댓글 등록에 실패했습니다.");
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "댓글 등록";
      }
    });

    await fetchComments(true);

    if (!siteKey) {
      submitButton.disabled = true;
      setMessage("댓글 작성 기능을 활성화하려면 Turnstile Site Key를 설정해야 합니다.");
      return;
    }

    submitButton.disabled = true;
    try {
      turnstile = await loadTurnstile();
      if (!root.isConnected) return;

      widgetId = turnstile.render(turnstileContainer, {
        sitekey: siteKey,
        theme: "auto",
        language: "ko",
        callback: (token) => {
          turnstileToken = token;
          setMessage("");
        },
        "expired-callback": () => {
          turnstileToken = null;
          setMessage("스팸 방지 확인이 만료되었습니다. 다시 확인해 주세요.");
        },
        "error-callback": () => {
          turnstileToken = null;
          setMessage("스팸 방지 확인을 불러오지 못했습니다. 페이지를 새로고침해 주세요.");
        },
      });
      submitButton.disabled = false;
    } catch {
      setMessage("Turnstile을 불러오지 못했습니다. 페이지를 새로고침해 주세요.");
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
  const locale = options.locale ?? "ko-KR";

  const BlogCommentsComponent = ({ displayClass, fileData }) => {
    const commentsEnabled = fileData.frontmatter?.comments;
    if (commentsEnabled === false || commentsEnabled === "false") return null;

    return h(
      "section",
      {
        id: "blog-comments",
        class: ["blog-comments", displayClass].filter(Boolean).join(" "),
        "data-api-path": apiPath,
        "data-turnstile-site-key": turnstileSiteKey,
        "data-locale": locale,
        lang: "ko",
        "aria-labelledby": "blog-comments-heading",
      },
      [
        h("h2", { id: "blog-comments-heading", class: "blog-comments-heading" }, "댓글"),
        h("div", {
          class: "blog-comments-list",
          "aria-live": "polite",
          "aria-busy": "true",
        }),
        h(
          "button",
          {
            type: "button",
            class: "blog-comments-more",
            hidden: true,
          },
          "댓글 더 보기",
        ),
        h("form", { class: "blog-comments-form" }, [
          h("h3", { class: "blog-comments-form-heading" }, "댓글 작성"),
          h("label", { class: "blog-comments-field" }, [
            h("span", {}, "닉네임"),
            h("input", {
              type: "text",
              name: "nickname",
              maxLength: 40,
              autoComplete: "nickname",
              placeholder: "표시할 닉네임",
              required: true,
            }),
          ]),
          h("label", { class: "blog-comments-field" }, [
            h("span", {}, "이메일"),
            h("input", {
              type: "email",
              name: "email",
              maxLength: 254,
              autoComplete: "email",
              placeholder: "이메일 주소",
              required: true,
            }),
          ]),
          h("label", { class: "blog-comments-field" }, [
            h("span", {}, "웹사이트 (선택)"),
            h("input", {
              type: "url",
              name: "website",
              maxLength: 2048,
              autoComplete: "url",
              placeholder: "https://example.com",
            }),
          ]),
          h("label", { class: "blog-comments-field" }, [
            h("span", {}, "내용"),
            h("textarea", {
              name: "body",
              rows: 5,
              maxLength: 5000,
              placeholder: "댓글을 입력하세요.",
              required: true,
            }),
          ]),
          h("div", {
            class: "blog-comments-turnstile",
            "aria-label": "스팸 방지 확인",
          }),
          h("p", {
            class: "blog-comments-message",
            role: "status",
            "aria-live": "polite",
          }),
          h(
            "button",
            {
              type: "submit",
              class: "blog-comments-submit",
              disabled: true,
            },
            "댓글 등록",
          ),
          h(
            "p",
            { class: "blog-comments-privacy" },
            "등록한 댓글은 즉시 공개됩니다. 이메일 주소는 공개되지 않으며, 댓글 운영 및 스팸 대응을 위해 저장됩니다.",
          ),
        ]),
      ],
    );
  };

  BlogCommentsComponent.css = styles;
  BlogCommentsComponent.afterDOMLoaded = script;
  return BlogCommentsComponent;
}
