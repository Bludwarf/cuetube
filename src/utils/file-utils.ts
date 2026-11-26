// Source : https://stackoverflow.com/a/57331494/1655155
export function getAssetFile(filePath: string, fileName = filePath): Promise<File> {
    return new Promise((resolve, reject) => {
        const request = createAssetFileRequest(filePath);

        request.onload = () => {
            if (request.status !== 200) {
                reject(new Error(`Failed to load ${filePath}: ${request.status}`));
                return;
            }
            const file = new File([request.response], fileName, {type: 'application/zip'});
            resolve(file);
        };

        request.onerror = () => reject(new Error(`Network error loading ${filePath}`));
        request.send(null);
    });
}

/**
 * @param assetPath chemin relatif au dossier <code>assets</code>, sans séparateur en préfixe
 */
export function fetchAssetFile(assetPath: string): Promise<Response> {
    return fetch(`${document.baseURI}assets/${assetPath}`);
}

function createAssetFileRequest(filePath: string): XMLHttpRequest {
    const request = new XMLHttpRequest();
    request.open('GET', filePath, true);
    request.responseType = 'arraybuffer'; // maybe also 'text'
    return request;
}

export function downloadFile(name: string, content: string) {
    // Create a Blob object with the file content
    const blob = new Blob([content], {type: 'text/plain'});

    // Create a temporary link element
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;

    // Programmatically click the link to trigger the download
    link.click();

    // Clean up the URL object
    URL.revokeObjectURL(link.href);
}
