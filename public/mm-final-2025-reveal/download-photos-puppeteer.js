const puppeteer = require('puppeteer');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Finalists from CONFIG
const finalists = [
    'wleite',
    'Daiver19',
    'sullyper',
    'gaha',
    'xllledanx',
    'frictionless',
    'Acarreo',
    'eulerscheZahl',
    'kovi',
    'marwar22',
    'krismaz',
    'therealbeef'
];

// Create photos directory if it doesn't exist
const photosDir = path.join(__dirname, 'photos');
if (!fs.existsSync(photosDir)) {
    fs.mkdirSync(photosDir, { recursive: true });
}

// Function to download a file
function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? require('https') : require('http');
        
        protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadFile(response.headers.location, filepath)
                    .then(resolve)
                    .catch(reject);
            }
            
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            
            const fileStream = fs.createWriteStream(filepath);
            response.pipe(fileStream);
            
            fileStream.on('finish', () => {
                fileStream.close();
                console.log(`✓ Downloaded: ${path.basename(filepath)}`);
                resolve();
            });
            
            fileStream.on('error', (err) => {
                fs.unlink(filepath, () => {});
                reject(err);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Main function using Puppeteer
async function downloadAllPhotos() {
    console.log('Starting photo download with Puppeteer...\n');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        for (const username of finalists) {
            try {
                console.log(`Fetching image for ${username}...`);
                const page = await browser.newPage();
                
                // Navigate to the interview page
                const url = `https://www.topcoder.com/marathon-match-tournament/interviews/${username}`;
                await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
                
                // Wait a bit for images to load
                await page.waitForTimeout(2000);
                
                // Try to find the image in various ways
                let imageUrl = null;
                
                // Method 1: Look for img tags with src containing the username or interview path
                imageUrl = await page.evaluate((uname) => {
                    // Find all images
                    const images = Array.from(document.querySelectorAll('img'));
                    
                    for (const img of images) {
                        const src = img.src || img.getAttribute('src');
                        if (!src) continue;
                        
                        // Check if it's related to interviews or the username
                        if (src.includes('/interviews/') || src.includes(uname.toLowerCase()) || src.includes(uname)) {
                            // Prefer larger images (profile photos)
                            if (img.naturalWidth > 100 || img.width > 100) {
                                return src;
                            }
                        }
                    }
                    
                    // Method 2: Look for background images
                    const elements = Array.from(document.querySelectorAll('[style*="background-image"]'));
                    for (const el of elements) {
                        const style = el.getAttribute('style');
                        const match = style.match(/url\(["']?([^"')]+)["']?\)/);
                        if (match && (match[1].includes('/interviews/') || match[1].includes(uname))) {
                            return match[1];
                        }
                    }
                    
                    // Method 3: Look for any image in the main content area
                    const mainContent = document.querySelector('main, .content, .interview-content, [class*="interview"]');
                    if (mainContent) {
                        const mainImages = Array.from(mainContent.querySelectorAll('img'));
                        for (const img of mainImages) {
                            const src = img.src || img.getAttribute('src');
                            if (src && (img.naturalWidth > 100 || img.width > 100)) {
                                return src;
                            }
                        }
                    }
                    
                    return null;
                }, username);
                
                await page.close();
                
                if (!imageUrl) {
                    console.log(`⚠ No image found for ${username}, skipping...`);
                    continue;
                }
                
                // Make sure URL is absolute
                if (imageUrl.startsWith('//')) {
                    imageUrl = 'https:' + imageUrl;
                } else if (imageUrl.startsWith('/')) {
                    imageUrl = 'https://www.topcoder.com' + imageUrl;
                }
                
                console.log(`Found image: ${imageUrl}`);
                const filepath = path.join(photosDir, `${username}.jpg`);
                
                await downloadFile(imageUrl, filepath);
                
                // Add delay to be respectful
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`✗ Error downloading ${username}:`, error.message);
            }
        }
    } finally {
        await browser.close();
    }
    
    console.log('\n✓ Photo download complete!');
}

// Run the script
downloadAllPhotos().catch(console.error);

