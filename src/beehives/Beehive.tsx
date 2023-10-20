import React, { memo } from 'react';
import { IonItem, IonLabel } from '@ionic/react';
import { getLogger } from '../logger';
import { BeehiveProps } from './BeehiveProps';

const log = getLogger('Painting');

interface PaintingPropsExt extends BeehiveProps {
    onEdit: (id?: string) => void;
}

const Beehive: React.FC<PaintingPropsExt> = ({ id, index, onEdit }) => {
    return (
        <IonItem onClick={() => onEdit(id)}>
            <IonLabel>{index}</IonLabel>
        </IonItem>
    );
};

export default memo(Beehive);
// memeo -> if no modificari dont recreate the entity
