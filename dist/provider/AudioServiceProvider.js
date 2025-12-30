"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusError = statusError;
exports.returnData = returnData;
const axios_1 = require("axios");
function statusError(result) {
    return { data: null, error: result.statusText ? result.statusText : "Not Found" };
}
function returnData(result) {
    return { data: result.data, error: null };
}
let trackIdDelim = "+";
class AudioServiceProvider {
    constructor(baseUrl, baseEndpoint, statusEndpoint, serviceName) {
        this.baseUrl = baseUrl;
        this.baseEndpoint = baseEndpoint;
        this.statusEndpoint = statusEndpoint;
        this.active = false;
        this.serviceName = serviceName;
        this.interval = 3000;
    }
    encodeTrackId(artist, title, album) {
        let joined = `${(artist)}${trackIdDelim}${(title)}${trackIdDelim}${(album)}`;
        joined = joined.replaceAll(new RegExp("[^a-zA-Z0-9]*", "gim"), "");
        return btoa(joined);
    }
    decodeTrackid(id) {
        const decoded = atob(id);
        const split = decoded.split(trackIdDelim);
        return { artist: split[0], title: split[1], album: split[2] };
    }
    async GET(endpoint) {
        let res = null;
        try {
            res = await (0, axios_1.get)(`${this.baseUrl}${this.baseEndpoint}${endpoint}`, { headers: { "Content-Type": "application/json" } });
            if (!res || !res.data)
                return statusError(res);
            if (res.status !== axios_1.HttpStatusCode.Ok)
                return statusError(res);
            return returnData(res);
        }
        catch (e) {
            return statusError(e);
        }
    }
}
exports.default = AudioServiceProvider;
//# sourceMappingURL=AudioServiceProvider.js.map