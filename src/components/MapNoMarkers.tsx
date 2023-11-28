import { GoogleMap } from '@capacitor/google-maps';
import {useContext, useEffect, useRef} from 'react';
import {LatLngContext} from "../beehives/LatLngProvider";
export const mapsApiKey = 'AIzaSyC1SJWNoMsl0kJCghopMcztI7vh5yIdq1E';

interface MyMapProps {
    lat: number;
    lng: number;

}

const MapNoMarkers: React.FC<MyMapProps> = ({ lat, lng }) => {
    const mapRef = useRef<HTMLElement>(null);
    useEffect(myMapEffect, [mapRef.current])

    const {latitudine, longitudine, upd} = useContext(LatLngContext);


    // const [markerLat, setMarkerLat] = useState(0);
    // const [markerLng, setMarkerLng] = useState(0);
    //
    // const [markerId, setMarkerId] = useState(null);
    // const [marker, setMarker] = useState(null);

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


            // console.log('latitudine', latitudine);
            // console.log('longitudine', longitudine);
            // if (latitudine !== 46.43822268835372 && longitudine !== 23.18524534738386) {
            //     await googleMap.addMarker({coordinate: {lat: latitudine, lng: longitudine}, title: 'My location2'});
            // }

            await googleMap.setOnMapClickListener(({ latitude, longitude }) => {
                console.log('map clicked', latitude, longitude);

                if (upd) {
                    console.log("updating with function")
                    upd(latitude, longitude);
                }

                googleMap.addMarker({coordinate: {lat: latitude, lng: longitude}, title: 'My location2'});
            });
        }
    }


}

export default MapNoMarkers;