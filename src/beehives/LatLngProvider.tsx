import React, {useCallback, useState} from 'react';
import PropTypes from 'prop-types';
import {BeehiveProps} from "./BeehiveProps";


type UpdateLatLngFn = (lat : number, longitudine : number) => void;

export interface LatLngState {
    latitudine: number,
    longitudine: number,
    upd?: UpdateLatLngFn,
}



const initialState: LatLngState = {
    latitudine: 46.43822268835372,
    longitudine: 23.18524534738386,
};

export const LatLngContext = React.createContext<LatLngState>(initialState);

interface LatLngProviderProps {
    children: PropTypes.ReactNodeLike,
}

export const LatLngProvider: React.FC<LatLngProviderProps> = ({children}) => {

    const upd = useCallback<UpdateLatLngFn>(updateLatLng, []);
    const [latitudine, setLatitude] = useState(46.43822268835372);
    const [longitudine, setLongitude] = useState(23.18524534738386);

    console.log('LatLngProvider');

    function updateLatLng(latitudine: number, longitudine: number) {
        console.log('updateLatLng inside function');
        console.log('latitudine b4', latitudine);
        console.log('longitudine b4', longitudine);
        setLatitude(latitudine);
        setLongitude(longitudine);
    }

    return (
        <LatLngContext.Provider value={{latitudine, longitudine, upd}}>
            {children}
        </LatLngContext.Provider>
    );
};
