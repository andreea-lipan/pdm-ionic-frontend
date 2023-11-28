import React, { useState } from 'react';
import { createAnimation, IonModal, IonButton, IonContent } from '@ionic/react';

export const MyModal: React.FC = () => {
    const [showModal, setShowModal] = useState(false);

    const enterAnimation = (baseEl: any) => {
        const root = baseEl.shadowRoot;
        const backdropAnimation = createAnimation()
            .addElement(root.querySelector('ion-backdrop')!)
            .fromTo('opacity', '0.01', 'var(--backdrop-opacity)')
            .fromTo('opacity', 'var(--backdrop-opacity)', '0.01');

        const wrapperAnimation = createAnimation()
            .addElement(root.querySelector('.modal-wrapper')!)
            .keyframes([
                { offset: 0, opacity: '1', transform: 'scale(0)' },
                { offset: 0.5, opacity: '0', transform: 'scale(0.5)' },
                { offset: 1, opacity: '1', transform: 'scale(0.5)' }
            ]);

        return createAnimation()
            .addElement(baseEl)
            .easing('ease-in-out')
            .duration(1000)
            .addAnimation([backdropAnimation, wrapperAnimation]);
    }

    const leaveAnimation = (baseEl: any) => {
        return enterAnimation(baseEl).direction('reverse');
    }

    console.log('MyModal', showModal);
    return (
        <>
            <IonModal isOpen={showModal} enterAnimation={enterAnimation} leaveAnimation={leaveAnimation}>
                <p>HEYYYYYYYYYYYYYYYYYYYY</p>
                <IonButton onClick={() => setShowModal(false)}>Close Modal</IonButton>
            </IonModal>
            <IonButton onClick={() => setShowModal(true)}>Show Modal</IonButton>
        </>
    );
};