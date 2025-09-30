import {doc, getDoc, setDoc} from 'firebase/firestore';
import {getFirebase} from '@/app/lib/firebase'
import {
	DASHBOARD_COLLECTION_NAME,
	LOYALTY_SUBCOLLECTION_NAME,
	QIK_CUMPLE_SUBCOLLECTION_NAME
} from "@/app/constants/general";
import {Business} from "@/app/types/business";

const submitData = async(data:object, businessData: Business | undefined) => {
	await setDoc( doc(getFirebase().db, DASHBOARD_COLLECTION_NAME, businessData?.id || '', LOYALTY_SUBCOLLECTION_NAME, QIK_CUMPLE_SUBCOLLECTION_NAME), data)
}

const getData = async (businessData: Business | undefined) => {
	return await getDoc(doc(getFirebase().db, DASHBOARD_COLLECTION_NAME, businessData?.id || '-', LOYALTY_SUBCOLLECTION_NAME, QIK_CUMPLE_SUBCOLLECTION_NAME));
}

const qikBirthdayService = {
	submitData,
	getData
}

export default qikBirthdayService;