import json
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Set localStorage to bypass login
    storage_state = {
        "state": {
            "profiles": ["test-user"],
            "activeProfile": "test-user",
            "profileData": {
                "test-user": {
                    "dailyTasks": {
                        "gathering": {"vine_bridge": False, "prosperity": False, "destinys_gorge": False},
                        "crafting": {"mithrillium": False, "elonian_cord": False, "spirit_residue": False, "gossamer": False},
                        "specials": {"psna": False, "home_instance": False}
                    },
                    "completedEventTypes": {}
                }
            },
            "lastResetDate": 0
        },
        "version": 1
    }

    # Navigate to the root to set localStorage on the correct origin
    page.goto("http://localhost:3000")

    # Inject the state into localStorage
    page.evaluate(f"localStorage.setItem('tyria-tracker-storage', '{json.dumps(storage_state)}')")

    # Reload the page to ensure the store is hydrated with the new state
    page.reload()

    # Wait for the redirect to the dashboard to complete
    page.wait_for_url("http://localhost:3000/dashboard")

    # Open the timer editor for Vine Bridge
    vine_bridge_task = page.locator('.group:has-text("Vine Bridge")')
    edit_button = vine_bridge_task.locator('button[title="Edit Timers"]')
    edit_button.click()

    # Wait for the dialog to appear
    page.wait_for_selector('div[role="dialog"]', state='visible')

    # Take a screenshot to debug the dialog content
    page.screenshot(path="jules-scratch/verification/debug.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)