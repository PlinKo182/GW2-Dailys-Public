from playwright.sync_api import sync_playwright, Page, expect

def verify_fractals_card(page: Page):
    """
    This script verifies the changes to the FractalsCard component.
    """
    # Capture console and network logs
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
    page.on("request", lambda request: print(f"REQUEST: {request.method} {request.url}"))
    page.on("response", lambda response: print(f"RESPONSE: {response.status} {response.url}"))

    # 1. Navigate to the application.
    page.goto("http://localhost:33923")

    # 2. Handle login
    try:
        # Wait for the login form to be visible
        expect(page.get_by_placeholder("Username")).to_be_visible(timeout=10000)

        # Fill in the username and click the login button
        page.get_by_placeholder("Username").fill("PlinKo")
        page.get_by_role("button", name="Login").click()

        # Wait for navigation to the dashboard, which is the root path in this case
        expect(page).to_have_url(f"http://localhost:33923/", timeout=10000)

    except Exception as e:
        print(f"Login failed: {e}")
        page.screenshot(path="jules-scratch/verification/login_error_screenshot.png")
        print("Login error screenshot saved.")
        return # Exit if login fails

    # 3. Wait for the Fractals card to be visible.
    try:
        fractals_card_title = page.get_by_role("heading", name="Daily Fractals")
        expect(fractals_card_title).to_be_visible(timeout=15000)

        # 4. Locate the card element itself to take a screenshot.
        card = page.locator("div.card", has=fractals_card_title).first

        # 5. Take a screenshot of the card.
        screenshot_path = "jules-scratch/verification/verification.png"
        card.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")
    except Exception as e:
        print(f"An error occurred while trying to find the fractals card: {e}")
        page.screenshot(path="jules-scratch/verification/error_screenshot.png")
        print("Error screenshot saved.")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_fractals_card(page)
        finally:
            browser.close()

if __name__ == "__main__":
    main()