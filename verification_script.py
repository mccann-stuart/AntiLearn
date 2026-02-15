
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        # iPhone 14 viewport
        page = browser.new_page(viewport={"width": 390, "height": 844})

        # Block external fonts to avoid timeouts/instability as per memory
        page.route("**/*.{woff,woff2}", lambda route: route.abort())

        page.goto("http://localhost:8000")

        # Wait for content to load
        page.wait_for_selector("h1")

        # 1. Screenshot of the top (Region control)
        page.screenshot(path="verification_top.png")

        # 2. Scroll to bottom to see controls
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")

        # Wait a bit for scroll and any lazy loading (though this app seems static)
        page.wait_for_timeout(1000)

        # 3. Screenshot of the bottom (Controls)
        page.screenshot(path="verification_bottom.png")

        browser.close()

if __name__ == "__main__":
    run()
