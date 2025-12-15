const https = require('https');
const http = require('http');
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
        const protocol = url.startsWith('https') ? https : http;
        
        protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                // Handle redirects
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

// Function to fetch HTML and extract image URL
function fetchImageUrl(username) {
    return new Promise((resolve, reject) => {
        const url = `https://www.topcoder.com/marathon-match-tournament/interviews/${username}`;
        
        https.get(url, (response) => {
            let html = '';
            
            response.on('data', (chunk) => {
                html += chunk;
            });
            
            response.on('end', () => {
                // Try to find image in various patterns
                const patterns = [
                    /<img[^>]+src=["']([^"']*\/interviews\/[^"']*\/[^"']*\.(jpg|jpeg|png|webp))[^"']*)["']/gi,
                    /<img[^>]+src=["']([^"']*\/interviews\/[^"']*\/photo[^"']*\.(jpg|jpeg|png|webp))[^"']*)["']/gi,
                    /<img[^>]+src=["']([^"']*\/interviews\/[^"']*\/image[^"']*\.(jpg|jpeg|png|webp))[^"']*)["']/gi,
                    /<img[^>]+src=["']([^"']*\/interviews\/[^"']*\/avatar[^"']*\.(jpg|jpeg|png|webp))[^"']*)["']/gi,
                    /background-image:\s*url\(["']?([^"')]*\/interviews\/[^"')]*\.(jpg|jpeg|png|webp))[^"')]*["']?\)/gi,
                ];
                
                let imageUrl = null;
                
                for (const pattern of patterns) {
                    const matches = [...html.matchAll(pattern)];
                    if (matches.length > 0) {
                        imageUrl = matches[0][1];
                        // Make absolute URL if relative
                        if (imageUrl.startsWith('//')) {
                            imageUrl = 'https:' + imageUrl;
                        } else if (imageUrl.startsWith('/')) {
                            imageUrl = 'https://www.topcoder.com' + imageUrl;
                        } else if (!imageUrl.startsWith('http')) {
                            imageUrl = 'https://www.topcoder.com' + imageUrl;
                        }
                        break;
                    }
                }
                
                // Also try to find any img tag with the username in the src
                const usernamePattern = new RegExp(`<img[^>]+src=["']([^"']*${username}[^"']*\\.(jpg|jpeg|png|webp))[^"']*)["']`, 'gi');
                const usernameMatches = [...html.matchAll(usernamePattern)];
                if (usernameMatches.length > 0 && !imageUrl) {
                    imageUrl = usernameMatches[0][1];
                    if (imageUrl.startsWith('//')) {
                        imageUrl = 'https:' + imageUrl;
                    } else if (imageUrl.startsWith('/')) {
                        imageUrl = 'https://www.topcoder.com' + imageUrl;
                    } else if (!imageUrl.startsWith('http')) {
                        imageUrl = 'https://www.topcoder.com' + imageUrl;
                    }
                }
                
                resolve(imageUrl);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Main function to download all photos
async function downloadAllPhotos() {
    console.log('Starting photo download...\n');
    
    for (const username of finalists) {
        try {
            console.log(`Fetching image URL for ${username}...`);
            const imageUrl = await fetchImageUrl(username);
            
            if (!imageUrl) {
                console.log(`⚠ No image found for ${username}, skipping...`);
                continue;
            }
            
            console.log(`Found image: ${imageUrl}`);
            const filepath = path.join(photosDir, `${username}.jpg`);
            
            await downloadFile(imageUrl, filepath);
            
            // Add small delay to be respectful
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`✗ Error downloading ${username}:`, error.message);
        }
    }
    
    console.log('\n✓ Photo download complete!');
}

// Run the script
downloadAllPhotos().catch(console.error);

