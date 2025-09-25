import { collection, doc, setDoc } from "firebase/firestore";
import { getFirebase } from "../lib/firebase";
import { COLLECTION_NAME } from "../constants/general";
import { formattedName } from "./business";

export const saveSessionId = async (businessId: string, sessionId: string) => {
  try {
    const businessRef = doc(
      collection(
      getFirebase().db,
      COLLECTION_NAME || ''),
      formattedName(businessId)
    );
    await setDoc(businessRef, { sessionId }, { merge: true})
    console.log("Sessionid added to Firebase")
  } catch (error) {
    console.log(`There was an error ${error}`)
  }
};