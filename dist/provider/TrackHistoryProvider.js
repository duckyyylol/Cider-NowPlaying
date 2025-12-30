"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const AudioServiceProvider_1 = require("./AudioServiceProvider");
const fs_extra_1 = require("fs-extra");
class TrackHistoryProvider {
    constructor() {
        this.dataDir = (0, path_1.join)(process.cwd(), "data");
        this.dataFilename = "tracks.json";
        this.dataFilePath = (0, path_1.join)(this.dataDir, this.dataFilename);
        if (!(0, fs_extra_1.existsSync)(this.dataDir)) {
            console.log(`Data directory ${this.dataDir} does not exist, creating it.`);
            (0, fs_extra_1.ensureDirSync)(this.dataDir);
        }
        if (!(0, fs_extra_1.existsSync)(this.dataFilePath)) {
            console.log(`Data file ${this.dataFilename} does not exist, creating it @ ${this.dataFilePath}`);
            (0, fs_extra_1.writeJSONSync)(this.dataFilePath, {}, { encoding: "utf8" });
        }
    }
    getData(trackId = null) {
        if (trackId == null) {
            try {
                const json = (0, fs_extra_1.readJSONSync)(this.dataFilePath);
                return { data: json, error: null };
            }
            catch (e) {
                return (0, AudioServiceProvider_1.statusError)(e);
            }
        }
        else {
            try {
                const json = (0, fs_extra_1.readJSONSync)(this.dataFilePath);
                const track = json[trackId];
                return { data: track, error: null };
            }
            catch (e) {
                return (0, AudioServiceProvider_1.statusError)(e);
            }
        }
    }
    writeData(data) {
        try {
            (0, fs_extra_1.writeJSONSync)(this.dataFilePath, data, { encoding: "utf8" });
            return { data: true, error: null };
        }
        catch (e) {
            return { data: null, error: "Not Found" };
        }
    }
    recordTrack(track) {
        const { data, error } = this.getData();
        if (error !== null)
            return { data: { success: false, trackId: null }, error: "Not Found" };
        try {
            track.lastPlayedTimestamp = Date.now();
            data[track.id] = track;
            this.writeData(data);
            return { data: { success: true, trackId: track.id }, error: null };
        }
        catch (e) {
            return { data: { success: false, trackId: track.id }, error: "Failed to record track to history" };
        }
    }
}
exports.default = TrackHistoryProvider;
//# sourceMappingURL=TrackHistoryProvider.js.map