import unittest

from pipeline.image_sources import MetadataParser, _image_url, safe_story_key


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


if __name__ == "__main__":
    unittest.main()
