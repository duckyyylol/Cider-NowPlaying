import axios from "axios";
import { JSONEncodable } from "discord.js";

export enum Params {
    id = "id"
}

export enum URLTypes {
    PLAYBACK = "/playback",
    LYRICS = "/lyrics",

}


export enum Endpoints {
    //GET /playback
    NOWPLAYING = "/now-playing",
    IS_ACTIVE = "/active",
    IS_PLAYING = "/is-playing",
    QUEUE = "/queue",
    IS_SHUFFLED = "/shuffle-mode",
    IS_REPEATING = "/repeat-mode",
    IS_AUTOPLAYING = "/autoplay",
    GET_VOLUME = "/volume",
    // POST /playback
    UNPAUSE = "/play",
    PAUSE = "/pause",
    TOGGLE_PAUSE = "/playpause",
    STOP_TRACK = "/stop",
    SKIP = "/next",
    PREVIOUS = "/previous",
    SEEK_TO_TIME = "/seek", //Requires {position: number}
    SET_VOLUME = "/volume", //Requires {volume: number}
    SET_RATING = "/set-rating", //Requires {rating: -1 | 0 | 1}
    PLAY_URL = "/play-url", //Requires AM URL in request body
    PLAY_LATER_ID = "/play-later", //Requires {id: string, type: "song"}
    PLAY_NEXT_ID = "/play-next", //Requires {id: string, type: "song"}
    TOGGLE_REPEAT = "/toggle-repeat",
    TOGGLE_SHUFFLE = "/toggle-shuffle",
    TOGGLE_AUTOPLAY = "/toggle-autoplay",
    // POST /playback/queue
    QUEUE_MOVETRACK = "/queue/move-to-position", //Requires {startIndex: number, destinationIndex, number, returnQueue: boolean}
    QUEUE_JUMPTRACK = "/queue/change-to-index", //Requires index: number in request body
    QUEUE_REMOVE_TRACK = "/queue/remove-by-index", //Requires index: number in request body
    QUEUE_CLEAR = "/queue/clear-queue",
    //GET /lyrics
    GET_LYRICS = "/{id}"
}

interface URLParam {
    p: Params,
    value: any | string,
}

const vars = {
    api: {
        port: 10767,
        base_url: "http://127.0.0.1:10767/api/v1"
    }
}

export const utils = {
    api: {
        buildURL: (type: URLTypes, endpoint: Endpoints, params?: URLParam[]): string => {
            let url = `${vars.api.base_url}${type}${endpoint}`
            if (!params) return url;
            Object.values(Params).forEach(p => {
                console.log(p)
                let matches: any = url.matchAll(new RegExp(`{${p}}`))
                if (!matches) return;
                matches = matches.return;
                matches.forEach(match => {
                    url = url.replace(match, params[p])
                })
            })
            console.log(url)
            return url;
        },
        GET: async (url: string): Promise<any> => {
            let res: any = await fetch(url)
            if (!res) return null;
            res = await res.json()
            if (!res) return null;
            return res;
            // let res;
            // console.log(url)
            // res = await fetch(url).catch(() => res = null)
            // if (res === null) return null;
            // res = await res.json();
            // return res;

        }
    },
    app: {
    },
    playback: {
        // pause: () => {

        // }
    }
}

export const Cider = {
    vars,
    utils
}

export default Cider;
