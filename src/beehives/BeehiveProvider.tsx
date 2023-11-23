import React, {useCallback, useContext, useEffect, useReducer, useState} from 'react';
import PropTypes from 'prop-types';
import {getLogger} from '../logger';
import {BeehiveProps} from './BeehiveProps';
import {createBeehive, getBeehives, newWebSocket, updateBeehive} from './BeehiveAPIs';
import {AuthContext} from '../auth'; // to yoink token
import {Preferences} from '@capacitor/preferences';
import {useNetwork} from "../core/useNetwork";

const log = getLogger('BeehiveProvider');
type SaveBeehiveFn = (Beehive: BeehiveProps) => Promise<any>;
type NextBeehivesPageFn = (currentPage: number, filter: string, search: string) => void;

export interface BeehivesState {
    Beehives?: BeehiveProps[],
    fetching: boolean,
    fetchingError?: Error | null,
    saving: boolean,
    savingError?: Error | null,
    saveBeehive?: SaveBeehiveFn,
    nextPage?: NextBeehivesPageFn,
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
                const Beehives = [...(state.Beehives || [])];

                const Beehive = payload;
                const index = Beehives.findIndex(it => it._id === Beehive._id);
                if (index === -1) {
                    Beehives.splice(0, 0, Beehive);
                } else {
                    Beehives[index] = Beehive;
                }
                return {...state, Beehives: Beehives, saving: false};
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
    const value = {Beehives, fetching, fetchingError, saving, savingError, saveBeehive, nextPage};

    const {networkStatus} = useNetwork();

    useEffect(() => {
            console.log("STATUS UPDATE:")
            console.log(networkStatus)

            // iterate throught beehivesLocal and add them to server
            if (networkStatus.connected) {
                console.log("ONLINE");
                backOnline();
            } else {
                console.log("OFFLINE");
            }
        },
        [networkStatus.connected]);

    async function backOnline() {
        // get beehivesLocal
        let BeehivesLocal = await Preferences.get({ key: 'BeehivesLocal' });

        let beesLocal : BeehiveProps[] = [];

        if (BeehivesLocal.value) {
            beesLocal = JSON.parse(BeehivesLocal.value) as BeehiveProps[];
        }

        // add them to server
        for (let i = 0; i < beesLocal.length; i++) {
            console.log("adding " + beesLocal[i].index + " to server");
            saveBeehive(beesLocal[i]);
        }

        // empty beehivesLocal
        Preferences.set({ key: 'BeehivesLocal', value: JSON.stringify([]) });
    }

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

            if (localStorage.getItem("status") === "true") {
                try {
                    log('fetchBeehives started');
                    dispatch({type: FETCH_BEEHIVES_STARTED});
                    let Beehives = await getBeehives();
                    log('fetchBeehives succeeded');

                    // fetch successful save data in preferences
                    await Preferences.set({key: 'Beehives', value: JSON.stringify(Beehives)});
                    await Preferences.set({key: 'BeehivesLocal', value: JSON.stringify([])});

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
                // load up from preferinte
                let BeehivesLocal = await Preferences.get({ key: 'BeehivesLocal' });
                let Beehivess= await Preferences.get({ key: 'Beehives' });

                let bees : BeehiveProps[] = [];
                let beesLocal : BeehiveProps[] = [];
                if (Beehivess.value) {
                    bees = JSON.parse(Beehivess.value) as BeehiveProps[];
                }
                if (BeehivesLocal.value) {
                    beesLocal = JSON.parse(BeehivesLocal.value) as BeehiveProps[];
                }
                bees = bees.concat(beesLocal);
                bees = bees.slice(0, 20);
                dispatch({type: FETCH_BEEHIVES_SUCCEEDED, payload: {Beehives: bees}});

            }
        }

    }

    async function saveBeehiveCallback(Beehive: BeehiveProps) {
        console.log("status");
        console.log(localStorage.getItem("status"));
        if (localStorage.getItem("status") === "true") {
            console.log("ONLINE sending add/edit to srv\n");
            try {
                log('saveBeehive started');
                dispatch({type: SAVE_BEEHIVE_STARTED});
                Beehive.saved = true;
                const savedBeehive = await (Beehive._id ? updateBeehive(Beehive) : createBeehive(Beehive));
                //log('saveBeehive succeeded');
                //dispatch({type: SAVE_BEEHIVE_SUCCEEDED, payload: {Beehives: savedBeehive}});
            } catch (error) {
                log('saveBeehive failed');
                dispatch({type: SAVE_BEEHIVE_FAILED, payload: {error}});
            }
        } else {
            console.log("OFFLINE cannot add/edit\n");
            Beehive.saved = false;

            // save in preferences
            let BeehivesLocal = await Preferences.get({ key: 'BeehivesLocal' });
            let Beehivess= await Preferences.get({ key: 'Beehives' });

            let bees : BeehiveProps[] = [];
            let beesLocal : BeehiveProps[] = [];
            if (Beehivess.value) {
                bees = JSON.parse(Beehivess.value) as BeehiveProps[];
            }
            if (BeehivesLocal.value) {
                beesLocal = JSON.parse(BeehivesLocal.value) as BeehiveProps[];
            }

            let indexLocal = beesLocal.findIndex(it => it.index === Beehive.index);
            let index = bees.findIndex(it => it._id === Beehive._id);
            console.log("INDEXL, INDEX")
            console.log(indexLocal)
            console.log(index)
            if (indexLocal === -1) {
                beesLocal.splice(0, 0, Beehive);
            } else {
                beesLocal[indexLocal] = Beehive;
            }

            // if it was an update, eliminate the elem from the bees list
            if (index !== -1) {
                console.log("No id, it was UPDATE");
                bees.splice(index, 1);
            }

            await Preferences.set({ key: 'BeehivesLocal', value: JSON.stringify(beesLocal) });
            await Preferences.set({ key: 'Beehives', value: JSON.stringify(bees) });

            getBeehivesEffect();
        }
    }

    async function AddUpdateBeehiveLocally(Beehive: BeehiveProps) {
        console.log("addupdate locally");
        console.log("beehive: " + Beehive.index);
        let Beehivess = await Preferences.get({key: 'Beehives'});
        let b: BeehiveProps[] = [];
        if (Beehivess.value) {
            b = JSON.parse(Beehivess.value) as BeehiveProps[];
        }

        // update the Beehive from b
        let foundIt = false;
        for (let i = b.length - 1; i >= 0; i--) {
            if (b[i]._id === Beehive._id) {
                b[i] = Beehive;
                foundIt = true;
                console.log("found it");
            }
        }
        if (!foundIt) {
            b.push(Beehive);
        }

        await Preferences.set({key: 'Beehives', value: JSON.stringify(b)});

        // give the listPage component only first page of data
        b = b.slice(0, 20);
    }

    function wsEffect() {
        let canceled = false;
        log('wsEffect - connecting');

        // to open socket only if you have token ?
        let closeWebSocket: () => void;
        if (token?.trim()) {
            closeWebSocket = newWebSocket(message => {
                console.log("SERVER BROADCAST THING");
                console.log(message)

                if (canceled) {
                    return;
                }
                const {event, payload} = message;
                log(`ws message, Beehive ${event}`);
                log(`Beehive: ${payload.index}`);
                //log(`Beehive idex: ${beehive.index}`);

                if (event === 'created' || event === 'updated') {

                    console.log("before AddUpdateBeehiveLocally")
                    AddUpdateBeehiveLocally(payload as BeehiveProps);
                    dispatch({type: SAVE_BEEHIVE_SUCCEEDED, payload});
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

        let resultBeehives: BeehiveProps[] = [];

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
                            //resultBeehives.pop();
                        resultBeehives.splice(i, 1);
                    }
                }
                console.log(resultBeehives)
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

        console.log(resultBeehives)
        resultBeehives = resultBeehives.slice(0, currentPage * 20 + 20);


        if ((filter === undefined || filter === "empty" ) && search === "") {  // else just give the next page
            console.log("next page")
            resultBeehives = b.slice(0, currentPage * 20 + 20);
        }

        console.log("dispatching");
        dispatch({type: NEXT_BEEHIVES_PAGE, payload: {Beehives: resultBeehives}});
    }


};
