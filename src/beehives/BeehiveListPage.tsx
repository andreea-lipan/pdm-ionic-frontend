import React, {useContext, useEffect, useRef, useState} from 'react';
import {RouteComponentProps} from 'react-router';
import {
    CreateAnimation,
    createAnimation,
    IonActionSheet,
    IonButton, IonCard, IonCol,
    IonContent,
    IonFab,
    IonFabButton, IonGrid,
    IonHeader,
    IonIcon, IonImg, IonInfiniteScroll, IonInfiniteScrollContent, IonLabel,
    IonList, IonLoading,
    IonPage, IonRow, IonSearchbar, IonSelect, IonSelectOption, IonText,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import {add, camera, trash} from 'ionicons/icons';
import Beehive from './Beehive';
import {getLogger} from '../logger';
import {BeehiveContext} from './BeehiveProvider';
import {AuthContext} from "../auth";
import {useNetwork} from "../core/useNetwork";
import {BeehiveProps} from "./BeehiveProps";
import axios from "axios";
import {authConfig} from "../core";
import {getToken} from "../auth/authApi";
import {usePhotos} from "../core/usePhotos";
import {MyModal} from "../components/MyModal";

const log = getLogger('BeehiveList');

export interface MyPhoto {
    filepath: string;
    webviewPath?: string;
}

const PHOTOS = 'photos';

const BeehiveListPage: React.FC<RouteComponentProps> = ({history}) => {
    const {Beehives, fetching, fetchingError, nextPage} = useContext(BeehiveContext);

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


    async function nextPageHandler($event: CustomEvent<void>) {
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


    // ANIMATION

    function simpleAnimationJS() {
        const el = document.querySelector('.square-a');
        if (el) {
            const animation = createAnimation()
                .addElement(el)
                .duration(1000)
                .direction('alternate')
                .iterations(Infinity)
                .keyframes([
                    {offset: 0, transform: 'scale(1.5)', opacity: '1'},
                    {offset: 0.25, transform: 'scale(1)', opacity: '1'},
                    {offset: 0.5, transform: 'scale(0.5)', opacity: '0.2'}
                ]);
            animation.play();
        }
    }

    function animateIndexes() {
        const el = document.querySelector('.square-b');
        if (el) {
            const animation = createAnimation()
                .addElement(el)
                .duration(1000)
                .direction('alternate')
                .iterations(1)
                .keyframes([
                    {offset: 0, opacity: '1'},
                    {offset: 0.5,  opacity: '0.5'},
                    {offset: 1, opacity: '1'}
                ]);
            animation.play();
        }
    }

    useEffect(animateIndexes, [currentPage])

    const animationRef = useRef<CreateAnimation>(null);
    const animationRef2 = useRef<CreateAnimation>(null);
    useEffect(simpleAnimationJS, []);
    useEffect(simpleAnimationReact, [animationRef2.current]);


    function simpleAnimationReact() {
        if (animationRef2.current !== null) {
            animationRef2.current.animation.play();
        }
    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <div className="square-a">
                        <IonTitle>Beehives</IonTitle>
                    </div>
                    <CreateAnimation
                        ref={animationRef2}
                        duration={5000}
                        fromTo={{
                            property: 'transform',
                            fromValue: 'translateY(0) rotate(0)',
                            toValue: `translateY(200px) rotate(180deg)`,
                        }}
                        easing="ease-out">
                        <div>Hiiiiiiiiii</div>
                    </CreateAnimation>

                    <IonButton onClick={logout}>Log out</IonButton>
                    <MyModal/>

                    <IonText
                        className="ion-float-right">{networkStatus.connected ? "connected" : "not connected"}</IonText>
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
                    <IonList className="square-b">
                        {Beehives.map(({_id, index, dateCreated, autumnTreatment, managerName, saved}) =>
                            <Beehive key={index} _id={_id} index={index} dateCreated={dateCreated}
                                     autumnTreatment={autumnTreatment} managerName={managerName} saved={saved}
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
                        <IonIcon icon={add}/>
                    </IonFabButton>
                </IonFab>

            </IonContent>
        </IonPage>
    );
};

export default BeehiveListPage;
