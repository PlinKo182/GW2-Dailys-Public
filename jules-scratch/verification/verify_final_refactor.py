from playwright.sync_api import sync_playwright, Page, expect

def verify_final_refactor(page: Page):
    """
    Verifies the complete end-to-end user flow after the refactor.
    - Creates a new user.
    - Logs in with that user.
    - Confirms the dashboard loads with the correct default cards.
    - Takes a screenshot of the final, populated dashboard.
    """
    # 1. Arrange: Go to the application homepage.
    page.goto("http://localhost:3000")

    # 2. Act: Create a new user to ensure a clean state.
    username_input = page.get_by_placeholder("Username")
    expect(username_input).to_be_visible()
    # Use a unique username to avoid conflicts from previous runs
    username = f"final-verify-user-{page.evaluate('() => Date.now()')}"
    username_input.fill(username)

    create_user_button = page.get_by_role("button", name="Create User")
    create_user_button.click()

    # 3. Assert: Wait for the user creation and automatic login to complete.
    # The most reliable way to do this is to wait for the dashboard to appear.
    dashboard_header = page.get_by_role("heading", name="Guild Wars 2 Daily Tracker")
    expect(dashboard_header).to_be_visible(timeout=20000) # Generous timeout for API calls

    # Verify that the default cards have been loaded.
    expect(page.get_by_role("heading", name="Pact Supply Network")).to_be_visible()
    expect(page.get_by_role("heading", name="Daily Fractals")).to_be_visible()
    expect(page.get_by_role("heading", name="Daily Gathering")).to_be_visible()

    # 4. Screenshot: Capture the final, correct state of the UI.
    screenshot_path = "jules-scratch/verification/final_refactor_verification.png"
    page.screenshot(path=screenshot_path)
    print(f"Screenshot saved to {screenshot_path}")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        verify_final_refactor(page)
        browser.close()

if __name__ == "__main__":
    main()