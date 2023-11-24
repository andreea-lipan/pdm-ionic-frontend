import React, {useCallback, useContext, useEffect, useState} from 'react';
import {
    IonActionSheet,
    IonButton,
    IonButtons, IonCol,
    IonContent, IonDatetime, IonFab, IonFabButton, IonGrid,
    IonHeader, IonIcon, IonImg,
    IonInput, IonLabel, IonList,
    IonLoading,
    IonPage, IonRadio, IonRadioGroup, IonRow,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import {getLogger} from '../logger';
import {BeehiveContext} from './BeehiveProvider';
import {RouteComponentProps} from 'react-router';
import {BeehiveProps} from './BeehiveProps';
import {camera, trash} from "ionicons/icons";
import {usePhotos} from "../core/usePhotos";
import {MyPhoto} from "./BeehiveListPage";
import {useFilesystem} from "../core/useFilesystem";
import {usePreferences} from "../core/usePreferences";
import {useCamera} from '../core/useCamera';
import MyMap from "../components/MyMap";

const log = getLogger('BeehiveEditPage');

interface BeehiveEditProps extends RouteComponentProps<{
    id?: string;
}> {
}

const BeehiveEditPage: React.FC<BeehiveEditProps> = ({history, match}) => {
    const {Beehives, saving, savingError, saveBeehive} = useContext(BeehiveContext);
    const [index, setIndex] = useState(0);
    const [dateCreated, setDateCreated] = useState(new Date(Date.now()));
    const [managerName, setManagerName] = useState('');
    const [autumnTreatment, setAutumnTreatment] = useState(false);
    const [lat, setLat] = useState(46.7698512402512);
    const [lng, setLng] = useState(23.626224272127693);
    const [Beehive, setBeehive] = useState<BeehiveProps>();


    // PHOTOS
    const [photoWebViews, setPhotoWebViews] = useState<string[]>([]);
    const [photoPaths, setPhotoPaths] = useState<string[]>([]);
    const {readFile, writeFile, deleteFile} = useFilesystem();
    const {get, set} = usePreferences();
    const {getPhoto} = useCamera();
    //
    // useEffect(loadPhotos, [get, readFile, setPhotos]);

    function loadPhotos() {
        loadSavedPhotos();

        async function loadSavedPhotos() {
            console.log('loadSavedPhotos')
            let newPhotos = [];

            if (photoPaths !== undefined) {
                for (let i = 0; i < photoPaths.length; i++) {
                    console.log('path', photoPaths[i])
                    const data = await readFile(photoPaths[i]);
                    const webviewPath = `data:image/jpeg;base64,${data}`;
                    newPhotos = [...newPhotos, webviewPath];
                }
                console.log('newPhotos in load', newPhotos)
                setPhotoWebViews(newPhotos);
            }
        }
    }

    useEffect(() => {
        loadPhotos();
    }, [photoPaths]);

    async function takePhoto() {
        console.log('takePhoto')
        const {base64String} = await getPhoto();
        const filepath = new Date().getTime() + '.jpeg';
        // save filepath
        let newPhotoPaths = [];
        if (photoPaths !== undefined) {
            newPhotoPaths = [...photoPaths];
        }
        console.log('PhotoPaths before', newPhotoPaths)
        newPhotoPaths = [...newPhotoPaths, filepath];
        console.log('PhotoPaths after', newPhotoPaths)
        setPhotoPaths(newPhotoPaths);


        console.log('filepath', filepath);
        await writeFile(filepath, base64String!);
        const webviewPath = `data:image/jpeg;base64,${base64String}`
        console.log('webviewPath', webviewPath);
        let newPhotoWebViews = [];
        // copy the old photos
        if (photoWebViews !== undefined) {
            newPhotoWebViews = [...photoWebViews];
        }
        // add the new photo
        newPhotoWebViews = [...newPhotoWebViews, webviewPath];
        console.log('newPhotos', newPhotoWebViews);
        setPhotoWebViews(newPhotoWebViews);
    }

    useEffect(() => {
        log('useEffect');
        const routeId = match.params.id || '';
        const Beehive = Beehives?.find(beehive => beehive._id === routeId);
        setBeehive(Beehive);
        if (Beehive) {
            setIndex(Beehive.index);
            setDateCreated(new Date(Beehive.dateCreated));
            setAutumnTreatment(Beehive.autumnTreatment);
            setManagerName(Beehive.managerName);
            if (Beehive.lat !== undefined) {
                setLat(Beehive.lat);
            }
            if (Beehive.lng !== undefined) {
                setLng(Beehive.lng);
            }
            setPhotoPaths(Beehive.photos);
            loadPhotos();
        }
    }, [match.params.id, Beehives]);

    const handleSave = useCallback(() => {
        const editedBeehive = Beehive ? {
            ...Beehive,
            index,
            dateCreated,
            autumnTreatment,
            managerName,
            photos: photoPaths,
            lat,
            lng
        } : {index, dateCreated, autumnTreatment, managerName, photos : photoPaths, lat, lng};
        console.log('editedBeehive', editedBeehive);
        saveBeehive && saveBeehive(editedBeehive).then(() => history.goBack());
    }, [Beehive, saveBeehive, index, dateCreated, autumnTreatment, managerName, photoPaths, lat, lng, history]);

    log('render');
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Edit</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={handleSave}>
                            Save
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonInput label="Index" placeholder="Enter the index" value={index} type="number" fill="outline"
                          onIonChange={e => setIndex(parseInt(e.detail.value as string))}/>

                <IonDatetime value={dateCreated.toISOString()}
                             onIonChange={e => setDateCreated(new Date(e.detail.value as string))}>
                    <span slot="title"><strong> Enter the creation date </strong></span>
                </IonDatetime>
                <IonLabel><strong>Autumn treatment done?</strong></IonLabel>
                <IonRadioGroup value={autumnTreatment} onIonChange={e => setAutumnTreatment(e.detail.value)}>
                    <br/>
                    <IonRadio value={true}>Yes</IonRadio>
                    <br/>
                    <IonRadio value={false}>No</IonRadio>
                </IonRadioGroup>
                <IonInput label="ManagerName" placeholder="Enter the manager's name" value={managerName} fill="outline"
                          onIonChange={e => setManagerName(e.detail.value || '')}/>


                {/*PHOTOS*/}

                <IonGrid>
                    <IonRow>
                        {photoWebViews.map((photo, index) => (
                            <IonCol size="6" key={index}>
                                <IonImg src={photo}/>
                            </IonCol>
                        ))}
                    </IonRow>
                </IonGrid>
                <IonFab vertical="bottom" horizontal="center" slot="fixed">
                    <IonFabButton onClick={() => takePhoto()}>
                        <IonIcon icon={camera}/>
                    </IonFabButton>
                </IonFab>



                {/* GOOGLE MAP */}
                <div>My Location is</div>
                {
                    (lat == 46.7698512402512 && lng == 23.626224272127693) ?
                        <div> NOT SET</div> : <></>
                }
                <div>latitude: {lat}</div>
                <div>longitude: {lng}</div>
                {lat && lng &&
                    <MyMap
                        lat={lat}
                        lng={lng}
                    />}



                {/* ERROR */}

                <IonLoading isOpen={saving}/>
                {savingError && (
                    <div>{savingError.message || 'Failed to save Beehive'}</div>
                )}

            </IonContent>
        </IonPage>
    );
};

export default BeehiveEditPage;
