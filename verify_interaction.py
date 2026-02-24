from playwright.sync_api import sync_playwright

def verify_interaction():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:8080")

        # Wait for calendar to render
        page.wait_for_selector("#calendar .day")

        # Find a workday that is not booked and click it
        # Assuming we can find one by class (not .leave, not .weekend, not .holiday)
        # Note: Initial state might have optimal plan booked.
        # Let's just click the first available workday we find.

        # We need to wait a bit because init might take a moment to compute optimal plan
        page.wait_for_timeout(1000)

        # Locate a day that is a workday (has efficiency data)
        day = page.locator(".day[data-efficiency]").first

        # Check if it has 'leave' class
        initial_class = day.get_attribute("class")
        print(f"Initial class: {initial_class}")

        day.click()

        # Wait for update (updateUI calls renderCalendar which calls updateDayNode)
        page.wait_for_timeout(500)

        final_class = day.get_attribute("class")
        print(f"Final class: {final_class}")

        if "leave" in initial_class:
            assert "leave" not in final_class, "Failed to unbook date"
        else:
            assert "leave" in final_class, "Failed to book date"

        page.locator("#calendar").screenshot(path="calendar_interacted.png")

        browser.close()

if __name__ == "__main__":
    verify_interaction()
