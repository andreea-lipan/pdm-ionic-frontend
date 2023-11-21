import {Redirect, Route} from 'react-router-dom';
import React from "react";
import {IonApp, IonRouterOutlet, setupIonicReact} from '@ionic/react';
import {IonReactRouter} from '@ionic/react-router';
import {BeehiveProvider} from "./beehives/BeehiveProvider";
import {BeehivesListPage, BeehiveEditPage} from "./beehives";
import {AuthProvider, Login, PrivateRoute} from "./auth";

// npm run lint -> if wanna run by hand

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => (
    <IonApp>
        <IonReactRouter>
            <IonRouterOutlet>
                <AuthProvider>
                    <Route path="/login" component={Login} exact={true}/>
                    <BeehiveProvider>
                        <PrivateRoute path="/beehives" component={BeehivesListPage} exact={true}/>
                        <PrivateRoute path="/beehive" component={BeehiveEditPage} exact={true}/>
                        <PrivateRoute path="/beehive/:id" component={BeehiveEditPage} exact={true}/>
                    </BeehiveProvider>
                    <Route exact path="/" render={() => <Redirect to="/beehives"/>}/>
                </AuthProvider>
            </IonRouterOutlet>
        </IonReactRouter>
    </IonApp>
);

export default App;
