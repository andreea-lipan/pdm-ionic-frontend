import React, {useContext, useEffect, useState} from 'react';
import {RouteComponentProps} from 'react-router';
import {
    IonButton, IonCard,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon, IonInfiniteScroll, IonInfiniteScrollContent, IonLabel,
    IonList, IonLoading,
    IonPage, IonSearchbar, IonSelect, IonSelectOption, IonText,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import {add} from 'ionicons/icons';
import Beehive from './Beehive';
import {getLogger} from '../logger';
import {BeehiveContext} from './BeehiveProvider';
import {AuthContext} from "../auth";
import {useNetwork} from "../core/useNetwork";
import {BeehiveProps} from "./BeehiveProps";
import axios from "axios";
import {authConfig} from "../core";
import {getToken} from "../auth/authApi";

const log = getLogger('BeehiveList');

const BeehiveListPage: React.FC<RouteComponentProps> = ({history}) => {
    const { Beehives, fetching, fetchingError , nextPage, onlineRefreshBeehives} = useContext(BeehiveContext);

    const {logout} = useContext(AuthContext)
    const {networkStatus} = useNetwork();
    log('render');

    const [currentPage, setCurrentPage] = useState(1);
    log('CURRENTPAGE: ');
    log(currentPage);
    const [disableInfiniteScroll, setDisableInfiniteScroll] = useState<boolean>(false);

    // SEARCH
    const [searchValue, setSearchValue] = useState<string>('');


    // FILTRARE
    const [filter, setFilter] = useState<string | undefined>(undefined);


    async function nextPageHandler ($event: CustomEvent<void>) {
        console.log($event.target);
        if (nextPage) {
            await nextPage(currentPage, filter, searchValue);
        }
        setCurrentPage(currentPage + 1);
        await ($event.target as HTMLIonInfiniteScrollElement).complete();
    }

    async function fetchInitialData(filter, search) {
        console.log("fetching initial data");
        if (nextPage) {
            await nextPage(0, filter, search);
        }
    }


    // refresh when back online
    useEffect(() => {
        if (networkStatus.connected) {
            onlineRefreshBeehives && onlineRefreshBeehives();
        }
    }, [networkStatus.connected]);


    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Beehives</IonTitle>

                    <IonButton  onClick={logout}>Log out</IonButton>
                    <IonText className="ion-float-right">{networkStatus.connected ? "connected" : "not connected"}</IonText>
                    {/*<IonButton onClick={nextPageHandler}>NEXT!</IonButton>*/}
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                {/*<IonLoading isOpen={fetching} message="Fetching Beehives" />*/}
                {/*{Beehives && (*/}
                {/*    <IonList>*/}
                {/*        {Beehives.map(({ _id, index, dateCreated, autumnTreatment, managerName }) =>*/}
                {/*            <Beehive key={_id} _id={_id} index={index} dateCreated={dateCreated} autumnTreatment={autumnTreatment} managerName={managerName}*/}
                {/*                     onEdit={id => history.push(`/Beehive/${id}`)} />)}*/}
                {/*    </IonList>*/}
                {/*)}*/}



                {/*{items.map((item: string, i: number) => {*/}
                {/*    return <IonCard key={`${i}`}><img src={item}/></IonCard>*/}
                {/*})}*/}


                {/*  SERCH BAR  */}
                <IonSearchbar
                    value={searchValue}
                    debounce={300}
                    onIonInput={e => {
                        setSearchValue(e.detail.value!);
                        fetchInitialData(filter, e.detail.value);
                    }
                    }>
                </IonSearchbar>


                {/*  FILTRARE  */}
                <IonSelect value={filter} placeholder="Select Treatment yes/no"
                           onIonChange={e => {
                               console.log("e" + e.detail.value);
                               setFilter(e.detail.value);
                               fetchInitialData(e.detail.value, searchValue);
                           }
                           }>
                    <IonSelectOption key={"yes"} value={"yes"}>yes</IonSelectOption>
                    <IonSelectOption key={"no"} value={"no"}>no</IonSelectOption>
                    <IonSelectOption key={"empty"} value={"empty"}>no filter</IonSelectOption>
                </IonSelect>


                {/*  ELEMES */}
                {Beehives && (
                    <IonList>
                        {Beehives.map(({ _id, index, dateCreated, autumnTreatment, managerName, saved }) =>
                            <Beehive key={index} _id={_id} index={index} dateCreated={dateCreated} autumnTreatment={autumnTreatment} managerName={managerName} saved={saved}
                                     onEdit={id => history.push(`/Beehive/${id}`)}
                            />)}
                    </IonList>
                )}

                {/*  PAGINARE <=> INFINITE SCROLL */}
                <IonInfiniteScroll threshold="10px" disabled={disableInfiniteScroll}
                                   onIonInfinite={(e: CustomEvent<void>) => nextPageHandler(e)}>
                    <IonInfiniteScrollContent
                        loadingText="Loading more beehives, wait!...">
                    </IonInfiniteScrollContent>
                </IonInfiniteScroll>

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
