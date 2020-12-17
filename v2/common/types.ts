export interface InterceptedData {
    id: string;
    method: string;
    url: string;
    requestHeaders: { name: string, value: string }[];
    requestBody?: string | null;
    status?: number;
    responseHeaders?: { name: string, value: string }[];
    responseBody?: string | null;
}