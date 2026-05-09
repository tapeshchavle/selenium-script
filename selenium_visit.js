const { Builder, Browser } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// Configuration
const url = 'https://www.tapesh.me/';
const totalVisits = 10; // Change this to 100000 later
const concurrencyLimit = 3; // How many browsers run at the exact same time (don't set this too high!)

async function createBrowserAndVisit(taskId) {
    let options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--disable-gpu');
    options.addArguments('--no-sandbox');

    let driver = await new Builder()
        .forBrowser(Browser.CHROME)
        .setChromeOptions(options)
        .build();

    try {
        console.log(`[Visit ${taskId}] Loading site...`);
        await driver.get(url);
        // Wait briefly to ensure tracking scripts load
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`[Visit ${taskId}] Finished!`);
    } catch (error) {
        console.error(`[Visit ${taskId}] Error:`, error.message);
    } finally {
        await driver.quit();
    }
}

async function runConcurrently() {
    console.log(`Starting ${totalVisits} visits, running ${concurrencyLimit} at a time...`);
    
    let activePromises = [];
    let completedVisits = 0;

    for (let i = 0; i < totalVisits; i++) {
        // Start a new visit asynchronously
        const visitPromise = createBrowserAndVisit(i + 1).then(() => {
            completedVisits++;
            // Remove from active tracking once finished
            activePromises.splice(activePromises.indexOf(visitPromise), 1);
        });
        
        activePromises.push(visitPromise);

        // If we hit our concurrency limit, wait for at least one browser to finish before starting a new one
        if (activePromises.length >= concurrencyLimit) {
            await Promise.race(activePromises);
        }
    }

    // Wait for the very last batch to finish
    await Promise.all(activePromises);
    
    console.log(`\nSuccessfully completed all ${completedVisits} visits.`);
}

runConcurrently();
