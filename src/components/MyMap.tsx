import { GoogleMap } from '@capacitor/google-maps';
import {useEffect, useRef, useState} from 'react';
export const mapsApiKey = 'AIzaSyC1SJWNoMsl0kJCghopMcztI7vh5yIdq1E';

interface MyMapProps {
    lat: number;
    lng: number;
}

const MyMap: React.FC<MyMapProps> = ({ lat, lng }) => {
    const mapRef = useRef<HTMLElement>(null);
    useEffect(myMapEffect, [mapRef.current])

    const [markerId, setMarkerId] = useState(null);

    return (
        <div className="component-wrapper">
            <capacitor-google-map ref={mapRef} style={{
                display: 'block',
                width: 300,
                height: 400
            }}></capacitor-google-map>
        </div>
    );



    function myMapEffect() {
        let canceled = false;
        let googleMap: GoogleMap | null = null;
        createMap();
        return () => {
            canceled = true;
            googleMap?.removeAllMapListeners();
        }

        async function createMap() {
            if (!mapRef.current) {
                return;
            }
            googleMap = await GoogleMap.create({
                id: 'my-cool-map',
                element: mapRef.current,
                apiKey: mapsApiKey,
                config: {
                    center: { lat, lng },
                    zoom: 8
                }
            })
            console.log('gm created');



            //const myLocationMarkerId = await googleMap.addMarker({ coordinate: { lat, lng }, title: 'My location2' });
            await googleMap.setOnMapClickListener(({ latitude, longitude }) => {
                console.log('map clicked', latitude, longitude);

                const marker = await googleMap?.addMarker({ coordinate: { lat: latitude, lng: longitude } });
                setMarkerId(marker);
            });
            await googleMap.setOnMarkerClickListener(({ markerId, latitude, longitude }) => {
                console.log('marker clicked', markerId, latitude, longitude);
            });
        }
    }
}

export default MyMap;