"""Fetch and cache source-page images for story assets.

Images are resolved while the story pipeline runs, never while a user is viewing a story.
The fetcher intentionally accepts only HTTPS image URLs, caps response sizes, and treats every
failure as a missing image so story generation can continue.
"""

import io
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

from PIL import Image, UnidentifiedImageError

HERE = Path(__file__).parent
PUBLIC_IMAGES = HERE.parent / "public" / "story-images" / "news"
MAX_HTML_BYTES = 1_000_000
MAX_IMAGE_BYTES = 12_000_000
MIN_IMAGE_PIXELS = 300_000
TIMEOUT_SECONDS = 15
USER_AGENT = "Where Does My Tax Go? story image pipeline/1.0"


class MetadataParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta: dict[str, str] = {}
        self.canonical: str | None = None
        self.article_id: str | None = None
        self.signature: str | None = None
        self.timestamp: str | None = None

    def handle_starttag(self, tag, attrs):
        values = {key.lower(): value or "" for key, value in attrs}
        self.article_id = self.article_id or values.get("data-n-a-id")
        self.signature = self.signature or values.get("data-n-a-sg")
        self.timestamp = self.timestamp or values.get("data-n-a-ts")
        if tag.lower() == "meta":
            key = values.get("property") or values.get("name")
            content = values.get("content")
            if key and content:
                self.meta.setdefault(key.lower(), content.strip())
        elif tag.lower() == "link" and values.get("rel", "").lower() == "canonical" and values.get("href"):
            self.canonical = values["href"].strip()


def _request(url: str, accept: str) -> tuple[str, bytes, str]:
    if urllib.parse.urlparse(url).scheme != "https":
        raise ValueError("only HTTPS sources are accepted")
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": accept})
    with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
        content_type = response.headers.get_content_type()
        data = response.read(MAX_HTML_BYTES + 1)
        if len(data) > MAX_HTML_BYTES:
            raise ValueError("source page is too large")
        return response.geturl(), data, content_type


def _metadata(url: str) -> tuple[str, MetadataParser]:
    final_url, body, _ = _request(url, "text/html,application/xhtml+xml")
    parser = MetadataParser()
    parser.feed(body.decode("utf-8", errors="replace"))
    return final_url, parser


def _google_news_source_url(article_url: str, parser: MetadataParser) -> str | None:
    """Resolve Google's current encrypted RSS token through its article endpoint."""
    if not (parser.article_id and parser.signature and parser.timestamp):
        return None
    request_data = [
        [
            "Fbv4je",
            json.dumps(
                [
                    "garturlreq",
                    [["en-CA", "CA", ["FINANCE_TOP_INDICES", "WEB_TEST_1_0_0"], None, None, 1, 1, "CA:en", None, 180, None, None, None, None, None, 0, None, None, [985646084, 1790485733]], "en-CA", "CA", 1, [2, 3, 4, 8], 1, 0, parser.article_id, 0, 0, None, 0],
                    parser.article_id,
                    int(parser.timestamp),
                    parser.signature,
                ],
                separators=(",", ":"),
            ),
            None,
            "generic",
        ]
    ]
    body = urllib.parse.urlencode({"f.req": json.dumps([request_data], separators=(",", ":"))}).encode()
    request = urllib.request.Request(
        "https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je",
        data=body,
        headers={"User-Agent": USER_AGENT, "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
        result = response.read(MAX_HTML_BYTES).decode("utf-8", errors="replace")
    marker = '[\\"garturlres\\",\\"'
    start = result.find(marker)
    if start < 0:
        return None
    start += len(marker)
    end = result.find('\\",', start)
    if end < 0:
        return None
    return json.loads('"' + result[start:end] + '"')


def _image_urls(page_url: str, parser: MetadataParser) -> list[str]:
    candidates = []
    for key in ("og:image:secure_url", "og:image", "twitter:image", "twitter:image:src", "image_src"):
        raw = parser.meta.get(key)
        if raw:
            candidates.append(urllib.parse.urljoin(page_url, raw))
    return list(dict.fromkeys(candidates))


def _image_url(page_url: str, parser: MetadataParser) -> str | None:
    candidates = _image_urls(page_url, parser)
    if not candidates:
        return None
    image_url = candidates[0]
    # Google News wraps the source link and exposes its own square logo as og:image.
    # It is not the article image, so never cache it as story artwork.
    page_host = urllib.parse.urlparse(page_url).hostname or ""
    image_host = urllib.parse.urlparse(image_url).hostname or ""
    if page_host.endswith("news.google.com") and image_host.endswith("googleusercontent.com"):
        return None
    return image_url


def _download_image(url: str, destination: Path) -> bool:
    if urllib.parse.urlparse(url).scheme != "https":
        return False
    try:
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "image/*"})
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            content_type = response.headers.get_content_type()
            if not content_type.startswith("image/"):
                return False
            data = response.read(MAX_IMAGE_BYTES + 1)
            if len(data) > MAX_IMAGE_BYTES:
                return False
    except (OSError, urllib.error.URLError, TimeoutError):
        return False
    try:
        with Image.open(io.BytesIO(data)) as source:
            source.verify()
        with Image.open(io.BytesIO(data)) as source:
            if source.width * source.height < MIN_IMAGE_PIXELS:
                return False
            image = source.convert("RGB")
            # Preserve more of the publisher's source resolution. thumbnail() never
            # enlarges small source images, so low-resolution previews remain honest.
            image.thumbnail((1600, 900), Image.Resampling.LANCZOS)
            destination.parent.mkdir(parents=True, exist_ok=True)
            image.save(destination, format="WEBP", quality=90, method=6)
    except (OSError, UnidentifiedImageError):
        return False
    return True


def cache_article_image(article_url: str, story_key: str) -> dict[str, str | None]:
    """Resolve, download, and cache an article preview image.

    Returns image_url, image_source_url, and image_credit-compatible values. All failures return
    null fields so callers can keep the story and render its fallback artwork.
    """
    empty = {"image_url": None, "image_source_url": None}
    try:
        page_url, parser = _metadata(article_url)
        if (urllib.parse.urlparse(page_url).hostname or "").endswith("news.google.com"):
            resolved = _google_news_source_url(page_url, parser)
            if resolved:
                page_url, parser = _metadata(resolved)
        canonical = urllib.parse.urljoin(page_url, parser.canonical) if parser.canonical else page_url
        image_urls = [url for url in _image_urls(page_url, parser) if not ((urllib.parse.urlparse(page_url).hostname or "").endswith("news.google.com") and (urllib.parse.urlparse(url).hostname or "").endswith("googleusercontent.com"))]
        if not image_urls and canonical != page_url:
            canonical_page, canonical_parser = _metadata(canonical)
            canonical = urllib.parse.urljoin(canonical_page, canonical_parser.canonical) if canonical_parser.canonical else canonical_page
            image_urls = _image_urls(canonical_page, canonical_parser)
        if not image_urls:
            return empty
        destination = PUBLIC_IMAGES / f"{story_key}.webp"
        if not destination.exists() and not any(_download_image(url, destination) for url in image_urls):
            return empty
        return {"image_url": f"/story-images/news/{destination.name}", "image_source_url": canonical}
    except (OSError, ValueError, TimeoutError, urllib.error.URLError):
        return empty


def safe_story_key(value: str) -> str:
    """Keep generated asset filenames stable and safe for the public directory."""
    return re.sub(r"[^a-zA-Z0-9_-]+", "-", value).strip("-").lower()
