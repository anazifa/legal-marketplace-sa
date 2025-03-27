// List of pages to check
const pages = [
    '/',
    '/ar/',
    '/404.html',
    '/health.html',
    '/logo.svg',
    '/robots.txt',
    '/sitemap.xml'
];

// Function to check if a page is accessible
async function checkPage(page) {
    try {
        const response = await fetch(`https://anazifa.github.io/legal-marketplace-sa${page}`);
        console.log(`${page}: ${response.status} ${response.statusText}`);
        return response.ok;
    } catch (error) {
        console.error(`Error checking ${page}:`, error);
        return false;
    }
}

// Check all pages
async function checkAllPages() {
    console.log('Checking all pages...');
    const results = await Promise.all(pages.map(checkPage));
    const allOk = results.every(Boolean);
    console.log(`All pages ${allOk ? 'are' : 'are not'} accessible`);
}

// Run the check
checkAllPages(); 