import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
    IonButton,
    IonButtons,
    IonContent, IonDatetime,
    IonHeader,
    IonInput, IonLabel, IonList,
    IonLoading,
    IonPage, IonRadio, IonRadioGroup,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import { getLogger } from '../logger';
import { BeehiveContext } from './BeehiveProvider';
import { RouteComponentProps } from 'react-router';
import { BeehiveProps } from './BeehiveProps';

const log = getLogger('BeehiveEditPage');

interface BeehiveEditProps extends RouteComponentProps<{
    id?: string;
}> {}

const BeehiveEditPage: React.FC<BeehiveEditProps> = ({ history, match }) => {
    const { Beehives, saving, savingError, saveBeehive } = useContext(BeehiveContext);
    const [index, setIndex] = useState(0);
    const [dateCreated, setDateCreated] = useState(new Date(Date.now()));
    const [managerName, setManagerName] = useState('');
    const [autumnTreatment, setAutumnTreatment] = useState(false);
    const [Beehive, setBeehive] = useState<BeehiveProps>();

    useEffect(() => {
        log('useEffect');
        const routeId = match.params.id || '';
        const Beehive = Beehives?.find(beehive => beehive.id === routeId);
        setBeehive(Beehive);
        if (Beehive) {
            setIndex(Beehive.index);
            setDateCreated(new Date(Beehive.dateCreated));
            setAutumnTreatment(Beehive.autumnTreatment);
            setManagerName(Beehive.managerName);
        }
    }, [match.params.id, Beehives]);

    const handleSave = useCallback(() => {
        const editedBeehive = Beehive ? { ...Beehive, index, dateCreated, autumnTreatment, managerName } : { index, dateCreated, autumnTreatment, managerName };
        saveBeehive && saveBeehive(editedBeehive).then(() => history.goBack());
    }, [Beehive, saveBeehive, index, dateCreated, autumnTreatment, managerName, history]);

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
                <IonInput label="Index" placeholder="Enter the index" value={index} type="number" fill="outline" onIonChange={e => setIndex(parseInt(e.detail.value as string))} />

                <IonDatetime  value={dateCreated.toISOString()} onIonChange={e=>setDateCreated(new Date(e.detail.value as string))}>
                    <span slot="title"><strong> Enter the creation date </strong></span>
                </IonDatetime>
                <IonLabel><strong>Autumn treatment done?</strong></IonLabel>
                <IonRadioGroup value={autumnTreatment} onIonChange={e=>setAutumnTreatment(e.detail.value)}>
                    <br/>
                    <IonRadio value={true}>Yes</IonRadio>
                    <br />
                    <IonRadio value={false}>No</IonRadio>
                </IonRadioGroup>
                <IonInput label="ManagerName" placeholder="Enter the manager's name" value={managerName} fill="outline" onIonChange={e => setManagerName(e.detail.value || '')} />

                <IonLoading isOpen={saving} />
                {savingError && (
                    <div>{savingError.message || 'Failed to save Beehive'}</div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default BeehiveEditPage;
