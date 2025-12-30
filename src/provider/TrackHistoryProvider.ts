import { join } from "path";
import { JSON_StoredTrack, Response, statusError, Track } from "./AudioServiceProvider";
import { ensureDirSync, existsSync, opendirSync, readJSONSync, writeJSONSync } from "fs-extra";

export interface RecordedTrackResponse {
    trackId: string | null;
    success: boolean;
}

export default class TrackHistoryProvider {
    dataDir: string;
    dataFilename: string;
    dataFilePath: string;

    constructor() {
        this.dataDir = join(process.cwd(), "data");
        this.dataFilename = "tracks.json";
        this.dataFilePath = join(this.dataDir, this.dataFilename);

        if (!existsSync(this.dataDir)) {
            console.log(`Data directory ${this.dataDir} does not exist, creating it.`)
            ensureDirSync(this.dataDir);
        }
        if (!existsSync(this.dataFilePath)) {
            console.log(`Data file ${this.dataFilename} does not exist, creating it @ ${this.dataFilePath}`)
            writeJSONSync(this.dataFilePath, {}, { encoding: "utf8" });
        }
    }

    getData(trackId: string | null = null): Response<JSON_StoredTrack | Track> {
        if (trackId == null) {
            try {
                const json: JSON_StoredTrack = readJSONSync(this.dataFilePath);
                return { data: json as JSON_StoredTrack, error: null };
            } catch (e) {
                return statusError(e);
            }
        } else {
            try {
                const json: JSON_StoredTrack = readJSONSync(this.dataFilePath);
                const track: Track = json[trackId];
                return { data: track as Track, error: null };
            } catch (e) {
                return statusError(e);
            }
        }

    }

    writeData(data: JSON_StoredTrack): Response<boolean> {
        try {
            writeJSONSync(this.dataFilePath, data, { encoding: "utf8" });
            return { data: true, error: null }
        } catch (e) {
            return { data: null, error: "Not Found" };
        }
    }

    recordTrack(track: Track): Response<RecordedTrackResponse> {
        const { data, error }: { data: JSON_StoredTrack | Track, error: string | null } = this.getData();
        if (error !== null) return { data: { success: false, trackId: null }, error: "Not Found" };

        try {
            track.lastPlayedTimestamp = Date.now();
            data[track.id] = track;
            this.writeData(data as JSON_StoredTrack);
            return { data: { success: true, trackId: track.id }, error: null };
        } catch (e) {
            return { data: { success: false, trackId: track.id }, error: "Failed to record track to history" };
        }
    }
}