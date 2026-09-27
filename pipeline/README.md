# Story image pipeline

Story images are prepared before deploy. The browser only loads local assets from `public/story-images/`.

News stories attempt to resolve the largest usable article preview image exposed by the source page's
`og:image` or `twitter:image` metadata, download it, validate it, and convert it to high-quality WebP.
Very small logos and thumbnails are rejected, and Google News' generic logo is rejected. If the source
page has no usable image, the story keeps the editorial fallback. The pipeline never enlarges a small
source image, so some stories may still use the fallback when a publisher only exposes a poor preview.

Data stories use the existing neutral department illustration workflow:

```bash
python3 pipeline/make_images.py
python3 pipeline/build_stories.py
python3 pipeline/build_news.py
```

`make_images.py` requires `GEMINI_API_KEY` and writes one local illustration per department. The
story builders add the image metadata fields without changing story IDs or campaign references.
Image source links remain separate from the evidence/source links shown on story pages.
