export interface GoogleDriveError {
    result: GoogleDriveErrorResult;
    /** result en string */
    body: string;
    /** map : nom du header en minuscule, valeur */
    'headers': string;
    /** 404 par exemple */
    'status': number;
    'statusText': null;
}

interface GoogleDriveErrorResult {
    error: {
        'errors': GoogleDriveErrorDetail[],
        'code': number; // 404,
        'message': string; // "File not found: ."
    };
}

interface GoogleDriveErrorDetail {
    /** par exemple "global" */
    'domain'?: string;
    /** par exemple "notFound" */
    'reason'?: string;
    /** par exemple "File not found: ." */
    'message'?: string;
    /** par exemple "parameter" */
    'locationType'?: string;
    /** par exemple "fileId" */
    'location'?: string;
}

export function errorContains(error: GoogleDriveError, errorDetail: GoogleDriveErrorDetail) {
    if (!error || !error.result || !error.result.error || !error.result.error.errors) {
        return false;
    }

    return error.result.error.errors.find(currentDetail => equalsOnlyDefinedFields(currentDetail, errorDetail));
}

export function equalsOnlyDefinedFields(actual, expected) {
    for (const key in expected) {
        if (expected.hasOwnProperty(key) && expected[key] !== undefined && expected[key] !== actual[key]) {
            return false;
        }
    }
    return true;
}
