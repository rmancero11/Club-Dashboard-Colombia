import {doc, getDoc, setDoc} from 'firebase/firestore';
import {getFirebase} from '@/app/lib/firebase'
import {
	ALLIES_SUBCOLLECTION_NAME,
	DASHBOARD_COLLECTION_NAME,
	FREE_DINNER_SUBCOLLECTION_NAME,
	GIFT_CARD_SUBCOLLECTION_NAME,
	LOYALTY_SUBCOLLECTION_NAME,
	QIK_STARS_BENEFITS_SUBCOLLECTION_NAME,
	QIK_STARS_SUBCOLLECTION_NAME,
	STORE_SUBCOLLECTION_NAME
} from "@/app/constants/general";
import {Business} from "@/app/types/business";

const subCollections = [FREE_DINNER_SUBCOLLECTION_NAME, GIFT_CARD_SUBCOLLECTION_NAME, STORE_SUBCOLLECTION_NAME, ALLIES_SUBCOLLECTION_NAME];

const submitData = async (data: object, selectedBenefit: number, businessData: Business | undefined) => {
	await setDoc( doc(getFirebase().db, DASHBOARD_COLLECTION_NAME, businessData?.Id || '', LOYALTY_SUBCOLLECTION_NAME, QIK_STARS_SUBCOLLECTION_NAME, QIK_STARS_BENEFITS_SUBCOLLECTION_NAME, subCollections[selectedBenefit]), data );
}

const getData = async (selectedBenefit: number, businessData: Business | undefined) => {
	return await getDoc(doc(getFirebase().db, DASHBOARD_COLLECTION_NAME, businessData?.Id || '', LOYALTY_SUBCOLLECTION_NAME, QIK_STARS_SUBCOLLECTION_NAME, QIK_STARS_BENEFITS_SUBCOLLECTION_NAME, subCollections[selectedBenefit]));
}

const qikstarsService = {
	submitData,
	getData
}

export enum Benefit {
	FREE_DINNER,
	GIFT_CARD,
	STORE,
	ALLIES
}

export default qikstarsService; 