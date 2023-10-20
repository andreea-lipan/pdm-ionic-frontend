import React, { useCallback, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import { getLogger } from '../logger';
import { BeehiveProps } from './BeehiveProps';
import { createBeehive, getBeehives, newWebSocket, updateBeehive } from './BeehiveAPIs';

const log = getLogger('BeehiveProvider');
type SaveBeehiveFn = (Beehive: BeehiveProps) => Promise<any>;

export interface BeehivesState {
    Beehives?: BeehiveProps[],
    fetching: boolean,
    fetchingError?: Error | null,
    saving: boolean,
    savingError?: Error | null,
    saveBeehive?: SaveBeehiveFn,
}

interface ActionProps {
    type: string,
    payload?: any,
}

const initialState: BeehivesState = {
    fetching: false,
    saving: false,
};

const FETCH_BEEHIVES_STARTED = 'FETCH_BEEHIVES_STARTED';
const FETCH_BEEHIVES_SUCCEEDED = 'FETCH_BEEHIVES_SUCCEEDED';
const FETCH_BEEHIVES_FAILED = 'FETCH_BEEHIVES_FAILED';
const SAVE_BEEHIVE_STARTED = 'SAVE_BEEHIVE_STARTED';
const SAVE_BEEHIVE_SUCCEEDED = 'SAVE_BEEHIVE_SUCCEEDED';
const SAVE_BEEHIVE_FAILED = 'SAVE_BEEHIVE_FAILED';

const reducer: (state: BeehivesState, action: ActionProps) => BeehivesState =
    (state, { type, payload }) => {
        switch(type) {
            case FETCH_BEEHIVES_STARTED:
                return { ...state, fetching: true, fetchingError: null };
            case FETCH_BEEHIVES_SUCCEEDED:
                return { ...state, Beehives: payload.Beehives, fetching: false };
            case FETCH_BEEHIVES_FAILED:
                return { ...state, fetchingError: payload.error, fetching: false };
            case SAVE_BEEHIVE_STARTED:
                return { ...state, savingError: null, saving: true };
            case SAVE_BEEHIVE_SUCCEEDED:
                const Beehives = [...(state.Beehives || [])];
                console.log(Beehives)
                console.log(payload)
                const Beehive = payload.Beehives;
                const index = Beehives.findIndex(it => it.id === Beehive.id);
                if (index === -1) {
                    Beehives.splice(0, 0, Beehive);
                } else {
                    Beehives[index] = Beehive;
                }
                return { ...state,  Beehives: Beehives, saving: false };
            case SAVE_BEEHIVE_FAILED:
                return { ...state, savingError: payload.error, saving: false };
            default:
                return state;
        }
    };

export const BeehiveContext = React.createContext<BeehivesState>(initialState);

interface BeehiveProviderProps {
    children: PropTypes.ReactNodeLike,
}

export const BeehiveProvider: React.FC<BeehiveProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { Beehives, fetching, fetchingError, saving, savingError } = state;
    useEffect(getBeehivesEffect, []);
    useEffect(wsEffect, []);
    const saveBeehive = useCallback<SaveBeehiveFn>(saveBeehiveCallback, []);
    const value = { Beehives, fetching, fetchingError, saving, savingError, saveBeehive };
    log('returns');
    return (
        <BeehiveContext.Provider value={value}>
            {children}
        </BeehiveContext.Provider>
    );

    function getBeehivesEffect() {
        let canceled = false;
        fetchBeehives();
        return () => {
            canceled = true;
        }

        async function fetchBeehives() {
            try {
                log('fetchBeehives started');
                dispatch({ type: FETCH_BEEHIVES_STARTED });
                const Beehives = await getBeehives();
                log('fetchBeehives succeeded');
                if (!canceled) {
                    dispatch({ type: FETCH_BEEHIVES_SUCCEEDED, payload: { Beehives: Beehives } });
                }
            } catch (error) {
                log('fetchBeehives failed');
                if (!canceled) {
                    dispatch({ type: FETCH_BEEHIVES_FAILED, payload: { error } });
                }
            }
        }
    }

    async function saveBeehiveCallback(Beehive: BeehiveProps) {
        try {
            log('saveBeehive started');
            dispatch({ type: SAVE_BEEHIVE_STARTED });
            const savedBeehive = await (Beehive.id ? updateBeehive(Beehive) : createBeehive(Beehive));
            log('saveBeehive succeeded');
            dispatch({ type: SAVE_BEEHIVE_SUCCEEDED, payload: { Beehives: savedBeehive } });
        } catch (error) {
            log('saveBeehive failed');
            dispatch({ type: SAVE_BEEHIVE_FAILED, payload: { error } });
        }
    }

    function wsEffect() {
        let canceled = false;
        log('wsEffect - connecting');
        const closeWebSocket = newWebSocket(message => {
            if (canceled) {
                return;
            }
            const { event, payload: { beehive }} = message;
            log(`ws message, Beehive ${event}`);

            if (event === 'created' || event === 'updated') {
                dispatch({ type: SAVE_BEEHIVE_SUCCEEDED, payload: { Beehives:beehive } });
            }
        });
        return () => {
            log('wsEffect - disconnecting');
            canceled = true;
            closeWebSocket();
        }
    }
};
