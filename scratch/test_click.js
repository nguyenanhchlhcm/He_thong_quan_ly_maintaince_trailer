const { chromium } = require('playwright')

async function run() {
  console.log("Launching browser...")
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  
  // Listen for page errors (uncaught exceptions)
  page.on('pageerror', error => {
    console.error('🔴 BROWSER RUNTIME EXCEPTION:', error.message)
    console.error(error.stack)
  })

  // Listen for console logs/errors
  page.on('console', message => {
    console.log(`[Browser Console - ${message.type()}]: ${message.text()}`)
  })

  try {
    console.log("Navigating to http://localhost:3000/test-dropdown...")
    await page.goto('http://localhost:3000/test-dropdown')
    
    console.log("Waiting for page load...")
    await page.waitForLoadState('networkidle')
    
    console.log("Clicking trigger button...")
    const button = page.locator('text=Lọc theo loại')
    await button.click()
    
    // Wait a brief moment for the click event to fire and error to register
    await page.waitForTimeout(2000)
    
  } catch (err) {
    console.error("Script execution error:", err)
  } finally {
    await browser.close()
    console.log("Browser closed.")
  }
}

run()
