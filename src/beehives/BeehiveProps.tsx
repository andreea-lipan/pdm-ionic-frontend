/*
    Properties of a Beehive entity
 */
export interface BeehiveProps {
    _id?: string;
    index: number;
    dateCreated: Date;
    autumnTreatment: boolean;
    managerName: string;
    saved: boolean;
    photos: string[];
    lat: number;
    lng: number;
}
