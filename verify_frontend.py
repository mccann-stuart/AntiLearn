from playwright.sync_api import sync_playwright
import sys

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        print("Navigating to app...")
        # Navigate to the app
        page.goto("http://localhost:8000")

        print("Waiting for selector...")
        # Wait for the region select to be visible
        page.wait_for_selector("#region-select")

        # Check if the region select has the correct value
        region_value = page.eval_on_selector("#region-select", "el => el.value")
        print(f"Initial region value: {region_value}")

        if region_value != 'england-wales':
            print("Error: Initial region is not england-wales")
            sys.exit(1)

        print("Changing region to Scotland...")
        # Change region to Scotland
        page.select_option("#region-select", "scotland")

        # Wait a bit for potential UI updates (holidays re-rendering)
        page.wait_for_timeout(1000)

        print("Taking screenshot...")
        # Take a screenshot
        page.screenshot(path="verification_screenshot.png")

        browser.close()
        print("Done.")

if __name__ == "__main__":
    run()
