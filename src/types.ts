export interface BlogCommentsOptions {
  /** Same-origin comments API endpoint. Defaults to "/api/comments". */
  apiPath?: string;
  /** Public Cloudflare Turnstile Site Key. Never use the Secret Key here. */
  turnstileSiteKey?: string;
  /** Locale used to format comment timestamps. Defaults to "en-US". The locale affects date and time formatting only. */
  locale?: string;
}

export type BlogCommentsProps = {
  displayClass?: string;
  fileData?: {
    frontmatter?: Record<string, unknown>;
  };
  [key: string]: unknown;
};

export type QuartzComponent = ((props: BlogCommentsProps) => unknown) & {
  css?: string | string[];
  beforeDOMLoaded?: string | string[];
  afterDOMLoaded?: string | string[];
};

export type QuartzComponentConstructor<
  Options extends object | undefined = undefined,
> = (options?: Options) => QuartzComponent;
