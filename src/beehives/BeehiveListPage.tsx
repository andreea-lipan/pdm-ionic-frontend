import React, { useContext } from 'react';
import { RouteComponentProps } from 'react-router';
import {
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonList, IonLoading,
    IonPage,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import { add } from 'ionicons/icons';
import Beehive from './Beehive';
import { getLogger } from '../logger';
import { BeehiveContext } from './BeehiveProvider';

const log = getLogger('BeehiveList');

const BeehiveListPage: React.FC<RouteComponentProps> = ({ history }) => {
    const { Beehives, fetching, fetchingError } = useContext(BeehiveContext);
    log('render');
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Beehives</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonLoading isOpen={fetching} message="Fetching Beehives" />
                {Beehives && (
                    <IonList>
                        {Beehives.map(({ id, index, dateCreated, autumnTreatment, managerName }) =>
                            <Beehive key={id} id={id} index={index} dateCreated={dateCreated} autumnTreatment={autumnTreatment} managerName={managerName}
                                     onEdit={id => history.push(`/Beehive/${id}`)} />)}
                    </IonList>
                )}
                {fetchingError && (
                    <div>{fetchingError.message || 'Failed to fetch Beehives'}</div>
                )}
                <IonFab vertical="bottom" horizontal="end" slot="fixed">
                    <IonFabButton onClick={() => history.push('/Beehive')}>
                        <IonIcon icon={add} />
                    </IonFabButton>
                </IonFab>
            </IonContent>
        </IonPage>
    );
};

export default BeehiveListPage;
