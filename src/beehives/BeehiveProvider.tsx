import React, {useCallback, useContext, useEffect, useReducer, useState} from 'react';
import PropTypes from 'prop-types';
import {getLogger} from '../logger';
import {BeehiveProps} from './BeehiveProps';
import {createBeehive, getBeehives, newWebSocket, updateBeehive} from './BeehiveAPIs';
import {AuthContext} from '../auth'; // to yoink token
import { Preferences } from '@capacitor/preferences';
import {useNetwork} from "../core/useNetwork";

const log = getLogger('BeehiveProvider');
type SaveBeehiveFn = (Beehive: BeehiveProps, currentPage? :number) => Promise<any>;
type NextBeehivesPageFn = (currentPage: number, filter: string, search: string) => void;
type onlineRefreshBeehivesFn = () => void;

export interface BeehivesState {
    Beehives?: BeehiveProps[],
    fetching: boolean,
    fetchingError?: Error | null,
    saving: boolean,
    savingError?: Error | null,
    saveBeehive?: SaveBeehiveFn,
    nextPage?: NextBeehivesPageFn,
    onlineRefreshBeehives?: onlineRefreshBeehivesFn,
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
const NEXT_BEEHIVES_PAGE = 'NEXT_BEEHIVES_PAGE';

const reducer: (state: BeehivesState, action: ActionProps) => BeehivesState =
    (state, {type, payload}) => {
        switch (type) {
            case FETCH_BEEHIVES_STARTED:
                return {...state, fetching: true, fetchingError: null};
            case FETCH_BEEHIVES_SUCCEEDED:
                return {...state, Beehives: payload.Beehives, fetching: false};
            case FETCH_BEEHIVES_FAILED:
                return {...state, fetchingError: payload.error, fetching: false};
            case SAVE_BEEHIVE_STARTED:
                return {...state, savingError: null, saving: true};
            case SAVE_BEEHIVE_SUCCEEDED:

                // const Beehives = [...(state.Beehives || [])];
                // console.log(Beehives)
                // console.log(payload)
                // const Beehive = payload.Beehives;
                // const index = Beehives.findIndex(it => it._id === Beehive._id);
                // if (index === -1) {
                //     Beehives.splice(0, 0, Beehive);
                // } else {
                //     Beehives[index] = Beehive;
                // }



                // const Beehive = payload.Beehives;
                // const index = Beehives.findIndex(it => it._id === Beehive._id);
                // if (index === -1) {
                //     Beehives.splice(0, 0, Beehive);
                // } else {
                //     Beehives[index] = Beehive;
                // }

                return {...state, saving: false};
            case SAVE_BEEHIVE_FAILED:
                return {...state, savingError: payload.error, saving: false};
            case NEXT_BEEHIVES_PAGE:
                console.log("new:");
                console.log(payload.Beehives);
                return {...state, Beehives: payload.Beehives};
            default:
                return state;
        }
    };

export const BeehiveContext = React.createContext<BeehivesState>(initialState);

interface BeehiveProviderProps {
    children: PropTypes.ReactNodeLike,
}

export const BeehiveProvider: React.FC<BeehiveProviderProps> = ({children}) => {
    const {token} = useContext(AuthContext);
    const [state, dispatch] = useReducer(reducer, initialState);
    const {Beehives, fetching, fetchingError, saving, savingError} = state;
    useEffect(getBeehivesEffect, [token]);
    useEffect(wsEffect, [token]);
    const saveBeehive = useCallback<SaveBeehiveFn>(saveBeehiveCallback, []);
    const nextPage = useCallback<NextBeehivesPageFn>(nextPageCallback, []);
    const onlineRefreshBeehives = useCallback<onlineRefreshBeehivesFn>(onlineRefreshBeehivesCallBack, []);
    const value = {Beehives, fetching, fetchingError, saving, savingError, saveBeehive, nextPage, onlineRefreshBeehives};

    const {networkStatus} = useNetwork();

    useEffect(() => {
        if (networkStatus.connected) {
            getBeehivesEffect();
        }
      },
      [networkStatus.connected]);

    log('returns');
    return (
        <BeehiveContext.Provider value={value}>
            {children}
        </BeehiveContext.Provider>
    );

    function getBeehivesEffect() {
        let canceled = false;
        if (token) {
            fetchBeehives();
        }
        return () => {
            canceled = true;
        }

        async function fetchBeehives() {

            if (networkStatus.connected) {
                try {
                    log('fetchBeehives started');
                    dispatch({type: FETCH_BEEHIVES_STARTED});
                    let Beehives = await getBeehives();
                    log('fetchBeehives succeeded');

                    // fetch successful save data in preferences
                    await Preferences.set({key: 'Beehives', value: JSON.stringify(Beehives)});

                    // give the listPage component only first page of data
                    Beehives = Beehives.slice(0, 20);

                    if (!canceled) {
                        dispatch({type: FETCH_BEEHIVES_SUCCEEDED, payload: {Beehives: Beehives}});
                    }
                } catch (error) {
                    log('fetchBeehives failed');
                    if (!canceled) {
                        dispatch({type: FETCH_BEEHIVES_FAILED, payload: {error}});
                    }
                }
            } else {
                // fetch from preferences
                let Beehivess = await Preferences.get({ key: 'Beehives' });
                let b : BeehiveProps[] = [];
                if (Beehivess.value) {
                    b = JSON.parse(Beehivess.value) as BeehiveProps[];
                }
                b = b.slice(0, 20);
                dispatch({type: FETCH_BEEHIVES_SUCCEEDED, payload: {Beehives: b}});
            }

        }

    }

    async function saveBeehiveCallback(Beehive: BeehiveProps) {
        console.log("BEEHIVE: ");

        console.log("network status: " + networkStatus.connected);

        if(networkStatus.connected) {
            try {
                log('saveBeehive started');
                dispatch({type: SAVE_BEEHIVE_STARTED});
                const savedBeehive = await (Beehive._id ? updateBeehive(Beehive) : createBeehive(Beehive));
                log('saveBeehive succeeded');
                dispatch({type: SAVE_BEEHIVE_SUCCEEDED, payload: {Beehives: savedBeehive}});
            } catch (error) {
                log('saveBeehive failed');
                dispatch({type: SAVE_BEEHIVE_FAILED, payload: {error}});


            }

         } else {


        // save in preferences
        let BeehivesLocal = await Preferences.get({ key: 'BeehivesLocal' });
        let b : BeehiveProps[] = [];
        if (BeehivesLocal.value) {
            b = JSON.parse(BeehivesLocal.value) as BeehiveProps[];
        }

        let index = b.findIndex(it => it.index === Beehive.index);
        if (index === -1) {
            b.splice(0, 0, Beehive);
        } else {
            b[index] = Beehive;
        }
        await Preferences.set({ key: 'BeehivesLocal', value: JSON.stringify(b) });
          }


        // refresh the list from the server
        if (networkStatus.connected) {
            await getBeehivesEffect();
        } else {
            // refresh the list from the preferences
            let Beehivess= await Preferences.get({ key: 'Beehives' });
            let BeehivesLocal = await Preferences.get({ key: 'BeehivesLocal' });
            let b : BeehiveProps[] = [];
            let b2 : BeehiveProps[] = [];
            if (Beehivess.value) {
                b = JSON.parse(Beehivess.value) as BeehiveProps[];
            }
            if (BeehivesLocal.value) {
                b2 = JSON.parse(BeehivesLocal.value) as BeehiveProps[];
            }
            b = b.concat(b2);
            b = b.slice(0, 20); // first page
            dispatch({type: FETCH_BEEHIVES_SUCCEEDED, payload: {Beehives: b}});
        }

    }

    async function onlineRefreshBeehivesCallBack() {
        let BeehivesLocal = await Preferences.get({ key: 'BeehivesLocal' });
        let b : BeehiveProps[] = [];
        if (BeehivesLocal.value) {
            b = JSON.parse(BeehivesLocal.value) as BeehiveProps[];
        }
        for (let i = b.length; i >= 0; i--) {
            await saveBeehiveCallback(b[i]);
            b.pop();
        }
    }

    function wsEffect() {
        let canceled = false;
        log('wsEffect - connecting');

        // to open socket only if you have token ?
        let closeWebSocket: () => void;
        if (token?.trim()) {
            closeWebSocket = newWebSocket(message => {
                if (canceled) {
                    return;
                }
                const {event, payload: {beehive}} = message;
                log(`ws message, Beehive ${event}`);

                if (event === 'created' || event === 'updated') {
                    dispatch({type: SAVE_BEEHIVE_SUCCEEDED, payload: {Beehives: beehive}});
                }
            });
        }


        return () => {
            log('wsEffect - disconnecting');
            canceled = true;
            closeWebSocket?.();
        }
    }


    async function nextPageCallback(currentPage: number, filter: string, search: string): Promise<void> {
        log('next page computation started');

        console.log("current page: " + currentPage);
        console.log("filter: " + filter);
        console.log("search: " + search);

        // give the listPage component only first page of data
        let Beehivess= await Preferences.get({ key: 'Beehives' });
        let BeehivesLocal = await Preferences.get({ key: 'BeehivesLocal' });

        let b : BeehiveProps[] = [];
        let b2 : BeehiveProps[] = [];
        if (Beehivess.value) {
             b = JSON.parse(Beehivess.value) as BeehiveProps[];
        }
        if (BeehivesLocal.value) {
            b2 = JSON.parse(BeehivesLocal.value) as BeehiveProps[];
        }

        b = b.concat(b2);

        let resultBeehives : BeehiveProps[] = [];

        if ((filter === "yes" || filter === "no") && filter != undefined) {  // check if any filter is applied
            console.log("filtering")
            if (filter === "yes") {
                resultBeehives = b.filter(beehive => beehive.autumnTreatment === (filter === "yes"));
            } else {
                resultBeehives = b.filter(beehive => beehive.autumnTreatment !== (filter === "no"));
            }
            //resultBeehives = resultBeehives.slice(0, currentPage * 20 + 20);

        }
        if (search !== "" && search != undefined) {  // check if any search is applied
            console.log("searching")
            // remove from the filtered list the ones that don't contain the search string
            if (resultBeehives.length > 0) {
                for (let i = resultBeehives.length - 1; i >= 0; i--) {
                    if (!resultBeehives[i].managerName.includes(search)) {
                        console.log("removing " + resultBeehives[i].managerName)
                        resultBeehives.pop();
                    }
                }
            } else {
                // else if filtered list is empty, search in the whole list
                for (let i = 0; i < b.length; i++) {
                    if (b[i].managerName.includes(search)) {
                        resultBeehives.push(b[i]);
                    }
                }
            }
            //resultBeehives = resultBeehives.slice(0, currentPage * 20 + 20);

        }
        if (resultBeehives.length !== 0) {
            resultBeehives = resultBeehives.slice(0, currentPage * 20 + 20);
        }
        if (filter === undefined && search === "") {  // else just give the next page
            console.log("next page")
            resultBeehives = b.slice(0, currentPage * 20 + 20);
        }

        console.log("dispatching");
        dispatch({type: NEXT_BEEHIVES_PAGE, payload: {Beehives: resultBeehives}});
    }


};
