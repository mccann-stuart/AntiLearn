from playwright.sync_api import sync_playwright

def verify_calendar():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:8080")

        # Wait for calendar to render
        page.wait_for_selector("#calendar .day")

        # Take screenshot of the calendar area
        page.locator("#calendar").screenshot(path="calendar.png")

        browser.close()

if __name__ == "__main__":
    verify_calendar()
