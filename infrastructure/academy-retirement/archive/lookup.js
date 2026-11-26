'use strict';

const handleInput = document.querySelector('#handle');
const statusText = document.querySelector('[role=status]');
const results = document.querySelector('ul');
let searchNumber = 0;

async function findCertificates() {
    const search = ++searchNumber;
    const handle = handleInput.value.trim();
    results.replaceChildren();
    if (!handle || /[/\\\u0000-\u001f]/.test(handle) || handle === '.' || handle === '..') {
        statusText.textContent = 'Enter a Topcoder handle.';
        return;
    }
    statusText.textContent = 'Looking up certificates…';
    try {
        const response = await fetch('./awards.json');
        if (!response.ok) throw new Error('Archive catalogue unavailable');
        const awards = await response.json();
        const matches = await Promise.all(awards.map(async award => {
            // Historical keys retain their original capitalization. Some older imports used lowercase.
            for (const candidate of new Set([handle, handle.toLowerCase()])) {
                const url = '/certificate/' + encodeURIComponent(candidate) + '/' + award + '.jpg';
                const image = await fetch(url, { method: 'HEAD' });
                if (image.ok) return { award, url };
                if (![403, 404].includes(image.status)) throw new Error('Image store unavailable');
            }
            return undefined;
        }));
        if (search !== searchNumber) return;
        for (const match of matches.filter(Boolean)) {
            const item = document.createElement('li');
            const link = document.createElement('a');
            link.href = match.url;
            link.textContent = match.award.split('/')[1].replace(/-/g, ' ');
            item.append(link);
            results.append(item);
        }
        statusText.textContent = results.childElementCount
            ? 'Select a certificate to open or save the image.'
            : 'No archived certificates found. Check the spelling and capitalization of your original handle.';
    } catch {
        if (search === searchNumber) statusText.textContent = 'The archive could not be reached. Please try again.';
    }
}

document.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    findCertificates();
});
const initialHandle = new URLSearchParams(location.hash.slice(1)).get('handle');
if (initialHandle) {
    handleInput.value = initialHandle;
    findCertificates();
}
