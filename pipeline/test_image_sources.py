import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from PIL import Image

from pipeline.image_sources import MetadataParser, _download_image, _image_url, safe_story_key


class ImageSourceTests(unittest.TestCase):
    def test_prefers_open_graph_image(self):
        parser = MetadataParser()
        parser.feed('<meta property="og:image" content="/images/story.jpg"><meta name="twitter:image" content="/fallback.jpg">')
        self.assertEqual(_image_url("https://example.com/news/story", parser), "https://example.com/images/story.jpg")

    def test_rejects_google_news_logo(self):
        parser = MetadataParser()
        parser.feed('<meta property="og:image" content="https://lh3.googleusercontent.com/logo=s0-w300">')
        self.assertIsNone(_image_url("https://news.google.com/articles/example", parser))

    def test_safe_story_key_is_stable_and_path_safe(self):
        self.assertEqual(safe_story_key("News/ABC 123"), "news-abc-123")

    def test_rejects_tiny_preview_images(self):
        image = Image.new("RGB", (100, 100), "red")
        data = io.BytesIO()
        image.save(data, format="PNG")

        class Headers:
            def get_content_type(self):
                return "image/png"

        class Response(io.BytesIO):
            headers = Headers()

            def __enter__(self):
                return self

            def __exit__(self, *_):
                self.close()

        with tempfile.TemporaryDirectory() as directory, patch("urllib.request.urlopen", return_value=Response(data.getvalue())):
            self.assertFalse(_download_image("https://example.com/tiny.png", Path(directory) / "tiny.webp"))


if __name__ == "__main__":
    unittest.main()
