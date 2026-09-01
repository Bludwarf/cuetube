// Source : https://stackoverflow.com/a/57331494/1655155
export function getAssetFile(filePath: string, fileName = filePath): Promise<File> {
    return new Promise((resolve, reject) => {
        const request = createAssetFileRequest(filePath);

        request.onload = () => {
            if (request.status !== 200) {
                reject(new Error(`Failed to load ${filePath}: ${request.status}`));
                return;
            }
            const file = new File([request.response], fileName, {type: 'application/zip'})
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
    return fetch(`${document.baseURI}assets/${assetPath}`)
}

function createAssetFileRequest(filePath: string): XMLHttpRequest {
    const request = new XMLHttpRequest();
    request.open('GET', filePath, true);
    request.responseType = 'arraybuffer'; // maybe also 'text'
    return request;
}
