import axios from 'axios';
import { getLogger } from '../logger';
import { BeehiveProps } from './BeehiveProps';
import beehive from "./Beehive";
import { authConfig } from "../core"
import {getToken} from "../auth/authApi";

const log = getLogger('BeehiveApi');

const baseUrl = 'localhost:3000';
const BeehivesUrl = `http://${baseUrl}/api/beehives`;

interface ResponseProps<T> {
    data: T;
}

function withLogs<T>(promise: Promise<ResponseProps<T>>, fnName: string): Promise<T> {
    log(`${fnName} - started`);
    return promise
        .then(res => {
            log(`${fnName} - succeeded`);
            return Promise.resolve(res.data);
        })
        .catch(err => {
            log(`${fnName} - failed`);
            return Promise.reject(err);
        });
}

// const config = {
//     headers: {
//         'Content-Type': 'application/json'
//     }
// };

export const getBeehives: () => Promise<BeehiveProps[]> = () => {
    return withLogs(axios.get(BeehivesUrl, authConfig(getToken())), 'getBeehives');
}

export const createBeehive: (Beehive: BeehiveProps) => Promise<BeehiveProps[]> = beehive => {
    return withLogs(axios.post(BeehivesUrl, beehive, authConfig(getToken())), 'createBeehive');
}

export const updateBeehive: (Beehive: BeehiveProps) => Promise<BeehiveProps[]> = beehive => {
    return withLogs(axios.put(`${BeehivesUrl}/${beehive._id}`, beehive, authConfig(getToken())), 'updateBeehive');
}

interface MessageData {
    event: string;
    payload: {
        beehive: BeehiveProps;
    };
}

export const newWebSocket = (onMessage: (data: MessageData) => void) => {
    const ws = new WebSocket(`ws://${baseUrl}`)
    ws.onopen = () => {
        log('web socket onopen');

        // to open socket only if you have token
        ws.send(JSON.stringify({type:'authorization', payload: {token: getToken()}}));
    };


    ws.onclose = () => {
        log('web socket onclose');
    };
    ws.onerror = error => {
        log('web socket onerror', error);
    };
    ws.onmessage = messageEvent => {
        log('web socket onMessage');
        onMessage(JSON.parse(messageEvent.data));
    };
    return () => {
        ws.close();
    }
}

