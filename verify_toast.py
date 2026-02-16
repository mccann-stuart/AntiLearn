from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()

        # 1. Desktop View - Test Export Toast (Success)
        print("Testing Desktop View...")
        page = browser.new_page()
        page.goto("http://localhost:8000")

        # Click Export
        page.click("#export-btn")

        # Wait for toast
        page.wait_for_selector(".toast.success")

        # Take screenshot of desktop toast
        page.screenshot(path="verification_desktop_toast.png")
        print("Desktop screenshot taken: verification_desktop_toast.png")

        # 2. Mobile View - Test Error Toast & Positioning
        print("Testing Mobile View...")
        context_mobile = browser.new_context(
            viewport={"width": 375, "height": 812},
            is_mobile=True,
            has_touch=True
        )
        page_mobile = context_mobile.new_page()
        page_mobile.goto("http://localhost:8000")

        # Click Add Custom without inputs to trigger error
        page_mobile.click("#add-custom-btn")

        page_mobile.wait_for_selector(".toast.error")

        # Take screenshot of mobile toast
        page_mobile.screenshot(path="verification_mobile_toast.png")
        print("Mobile screenshot taken: verification_mobile_toast.png")

        browser.close()

if __name__ == "__main__":
    run()
