import { AxiosError, AxiosResponse, get, HttpStatusCode } from "axios";

export interface Response<T = any> {
    error: string | null;
    data: T | null;
}

export interface Track {
    id: string;
    artist: string;
    title: string;
    album: string;
    trackUrl: string;
    lastPlayedTimestamp: number;
    imageUrl: string | null;
    genres: string[] | null;
    hash: string;
}

export interface JSON_StoredTrack {
    [id: string]: Track;
}

export function statusError(result: AxiosResponse): Response {
    return { data: null, error: result.statusText ? result.statusText : "Not Found" }
}

export function returnData(result: AxiosResponse): Response {
    return { data: result.data, error: null };
}



export default class AudioServiceProvider {
    baseUrl: string;
    baseEndpoint: string;
    statusEndpoint: string;
    active: boolean;
    serviceName: string;
    interval: number;

    constructor(baseUrl: string, baseEndpoint: string, statusEndpoint: string, serviceName: string) {
        this.baseUrl = baseUrl;
        this.baseEndpoint = baseEndpoint;

        this.statusEndpoint = statusEndpoint;
        this.active = false;

        this.serviceName = serviceName;
        this.interval = 5000;
    }

    makeHash(track: Track): string {
        let trackIdDelim = "+"
        let joined = `${(track.artist)}${trackIdDelim}${(track.title)}${trackIdDelim}${(track.album)}`;
        joined = joined.replaceAll(new RegExp("[^a-zA-Z0-9]*", "gim"), "");
        return btoa(joined);
    }

    encodeTrackId(artist: string, title: string, album: string): string {
        let trackIdDelim = "+"
        let joined = `${(artist != null ? artist : "")}${artist != null ? trackIdDelim : ""}${(title != null ? title : "")}${album != null ? trackIdDelim : ""}${(album != null ? album : "")}`;
        joined = joined.replaceAll(new RegExp("[^a-zA-Z0-9]*", "gim"), "").toLowerCase().trim();
        return joined;
    }

    decodeTrackid(id: string): {artist: string, title: string, album: string} {
        let trackIdDelim = "+"
        const decoded = atob(id);
        const split = decoded.split(trackIdDelim);
        return {artist: split[0], title: split[1], album: split[2]};
    }

    async GET(endpoint: string): Promise<Response> {
        let res: AxiosResponse | null = null;

        try {
            res = await get(`${this.baseUrl}${this.baseEndpoint}${endpoint}`, {headers: {"Content-Type": "application/json"}});

            if (!res || !res.data) return statusError(res);
            if (res.status !== HttpStatusCode.Ok) return statusError(res);

            return returnData(res);
        } catch (e) {
            return statusError(e)
        }

    }
}