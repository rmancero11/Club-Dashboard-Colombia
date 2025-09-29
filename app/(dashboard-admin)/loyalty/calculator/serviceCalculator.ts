// Constant values needed
import {Business} from "@/app/types/business";
import {doc, getDoc, setDoc} from "firebase/firestore";
import {getFirebase} from "@/app/lib/firebase";
import {
    DASHBOARD_COLLECTION_NAME,
    CALCULATOR_SUBCOLLECTION_NAME
} from "@/app/constants/general";

const visitValues = new Map();
const possibleStarValues = new Map();

/*
    0: Prioritize visits over spending
    1: Prioritize spending over visits
 */
const priority = 0;
fillPossibleStarValues();

// ---------------------------------- INITIALIZATION / UPDATE ----------------------------------------

/**
 * Gives initial values for each visit
 * @param rangeWithin30Days
 * @param spendingIntervalOption
 * @returns visitValues
 */
const getVisitValues = (rangeWithin30Days: boolean, spendingIntervalOption: number) => {
    let visitInitValue = rangeWithin30Days ? 1 : 0.5;

    // Fill visitValues map
    let minVisit = rangeWithin30Days ? 1 : 2;

    for (let i = minVisit; i <= 10; i++) {
        if(rangeWithin30Days) {
            if(i === minVisit) {
                visitValues.set(i, 1);
                continue;
            }

            if(spendingIntervalOption <= 1) {
                if(i === 2) visitValues.set(i, 1);
                else if(i === 3) visitValues.set(i, spendingIntervalOption === 0 ? 1 : 1.5);
                else {
                    visitValues.set(4, 1.5);
                    visitValues.set(5, 1.5);
                    visitValues.set(6, 1.5);
                    visitValues.set(7, 2);
                    visitValues.set(8, 3);
                    visitValues.set(9, 3);
                    visitValues.set(10, 4);
                    break;
                }
            }
            else {
                visitValues.set(8, 4);
                visitValues.set(9, 5);
                visitValues.set(10, 5);

                if(spendingIntervalOption <= 3) {
                    if(i === 2) visitValues.set(i, 2);
                    else if(i === 7) {
                        visitValues.set(i, 3);
                        break;
                    }
                    else visitValues.set(i, spendingIntervalOption === 2 ? 2 : 3);
                }
                else {
                    if(i === 2) {
                        visitValues.set(i, spendingIntervalOption === 4 ? 2 : 2.5);
                    }
                    else if(i === 3) {
                        visitValues.set(i, spendingIntervalOption === 4 ? 3.5 : 4);
                    }
                    else if(i < 8) {
                        visitValues.set(i, 4);
                    }
                }
            }

        }
        else {
            if(spendingIntervalOption <= 1) {
                visitValues.set(2, 0.5);
                visitValues.set(3, spendingIntervalOption === 0 ? 0.5 : 1);
                visitValues.set(4, 1);
                visitValues.set(5, 1);
                visitValues.set(6, 1);
                visitValues.set(7, 1.5);
                visitValues.set(8, 2.5);
                visitValues.set(9, 2.5);
                visitValues.set(10, 3.5);
                break;
            }
            else {
                visitValues.set(2, 2);

                if(spendingIntervalOption === 2) {
                    if(i < 7) {
                        visitValues.set(i, 2);
                    }
                    else {
                        visitValues.set(7, 3);
                        visitValues.set(8, 4);
                        visitValues.set(9, 5);
                        visitValues.set(10, 5);
                        break;
                    }
                }
                else if(spendingIntervalOption === 3) {
                    if(i <= 4 && i !== 2) {
                        visitValues.set(i, 2.5);
                    }
                    else if(i <= 7) {
                        visitValues.set(i, 3);
                    }
                    else if(i <= 9) {
                        visitValues.set(i, 4);
                    }
                    else {
                        visitValues.set(i, 5);
                        break;
                    }
                }
                else if(spendingIntervalOption === 4) {
                    if(i === 3) visitValues.set(i, 2.5);
                    else if(i === 4) visitValues.set(i, 3);
                    else if(i > 4 && i <= 8) visitValues.set(i, 3.5);
                    else if(i === 9) {
                        visitValues.set(9, 4);
                        visitValues.set(10, 5);
                        break;
                    }
                }
                else if(spendingIntervalOption === 5) {
                    if(i !== 2 && i <= 8) visitValues.set(i, 3.5);
                    else if(i > 8) visitValues.set(i, 4.5);
                }
            }
        }
    }

    return visitValues;
}

/**
 * Gives an initial map of max spending interval value percentage
 * @param rangeWithin30Days
 * @param selectedSpendingInterval
 * @returns percentages map
 */
const getInitPercentages = (rangeWithin30Days: boolean, selectedSpendingInterval: number,) => {
    const percentages = new Map();
    let minVisit = rangeWithin30Days ? 1 : 2;

    switch (selectedSpendingInterval) {
        case 0: // $1 - $5
            for(let i = minVisit; i <= 10; i++ ) {
                if(rangeWithin30Days) {
                    if(i <= minVisit+5) percentages.set(i, 0.05);
                    else if(i <= minVisit+7) percentages.set(i, 0.15);
                    else {
                        percentages.set(9, 0.20);
                        percentages.set(10, 0.20);
                        break;
                    }
                }
                else {
                    if(i <= minVisit+4) percentages.set(i, 0.15);
                    else if(i === minVisit+5) percentages.set(i, 0.20);
                    else if(i === minVisit+6) percentages.set(i, 0.25);
                    else {
                        percentages.set(9, 0.30);
                        percentages.set(10, 0.20);
                        break;
                    }
                }
            }
            break;
        case 1: // $5 - $10
            for(let i = minVisit; i <= 10; i++ ) {
                if(rangeWithin30Days) {
                    if(i <= minVisit+5) percentages.set(i, 0.15);
                    else if(i === minVisit+6) percentages.set(i, 0.20);
                    else if(i === minVisit+7) percentages.set(i, 0.25);
                    else {
                        percentages.set(9, 0.30);
                        percentages.set(10, 0.30);
                        break;
                    }
                }
                else {
                    if(i <= minVisit+4) percentages.set(i, 0.15);
                    else if(i === minVisit+5) percentages.set(i, 0.20);
                    else if(i === minVisit+6) percentages.set(i, 0.25);
                    else {
                        percentages.set(9, 0.30);
                        percentages.set(10, 0.20);
                        break;
                    }
                }
            }
            break;

        case 2: // $10 - $15
        case 3: // $15 - 20
        case 4: // $20 - $25
            for (let i = minVisit; i <= 10; i++) {
                if(rangeWithin30Days) {
                    if(i <= minVisit+1) percentages.set(i, 0.15);
                    else if(i <= minVisit+4) percentages.set(i, 0.20);
                    else if(i <= minVisit+5) percentages.set(i, 0.25);
                    else {
                        percentages.set(7, 0.40);
                        percentages.set(8, 0.40);
                        percentages.set(9, 0.40);
                        percentages.set(10, 0.40);
                        break;
                    }
                }
                else {
                    percentages.set(2, 0.10);

                    if(selectedSpendingInterval === 2) {
                        if(i > 2 && i <= 6) percentages.set(i, 0.15);
                        else if(i === 7) {
                            percentages.set(i, 0.20);
                            percentages.set(8, 0.25);
                            percentages.set(9, 0.30);
                            percentages.set(10, 0.30);
                            break;
                        }
                    }
                    else if(selectedSpendingInterval === 3) {
                        if(i > 2 && i <= 4) percentages.set(i, 0.20);
                        else if(i > 4 && i <= 6) percentages.set(i, 0.15);
                        else if(i === 7) {
                            percentages.set(i, 0.25);
                            percentages.set(8, 0.25);
                            percentages.set(9, 0.30);
                            percentages.set(10, 0.30);
                            break;
                        }
                    }
                    else {
                        if(i > 2 && i <= 5) percentages.set(i, 0.25);
                        else if(i === 6) percentages.set(i, 0.30);
                        else if(i > 6) {
                            percentages.set(7, 0.40);
                            percentages.set(8, 0.40);
                            percentages.set(9, 0.40);
                            percentages.set(10, 0.40);
                            break;
                        }
                    }
                }
            }
            break;

        case 5: // $25+
            for (let i = minVisit; i <= 10; i++) {
                if(rangeWithin30Days) {
                    if(i === minVisit) percentages.set(i, 0.20);
                    else if(i <= 3) percentages.set(i, 0.25);
                    else if(i <= 6) percentages.set(i, 0.30);
                    else if(i <= 8) percentages.set(i, 0.40);
                    else {
                        percentages.set(9, 0.50);
                        percentages.set(10, 0.50);
                        break;
                    }
                }
                else {
                    if(i <= 3) percentages.set(i, 0.20);
                    else if(i === 4) percentages.set(i, 0.25);
                    else if(i <= 6) percentages.set(i, 0.30);
                    else {
                        percentages.set(7, 0.40);
                        percentages.set(8, 0.40);
                        percentages.set(9, 0.40);
                        percentages.set(10, 0.40);
                        break;
                    }
                }
            }
            break;

        default:
            break;
    }

    return percentages;
}

function adjustDecimals(n:number, decimals?:number) {
    return parseFloat(n.toFixed(decimals || 1));
}

// ------------------------------------------ CALCULATIONS -------------------------------------------

const getStarsFromVisits = (visits: number, visitValue: any) => {
    return visits * visitValue;
}

const getStarsFromSpending = (selectedSpendingInterval: number, percentage: any, rangeWithin30Days: boolean) => {
    const maxSpendingIntervalValues = initMaxSpendingValues(rangeWithin30Days);

    // @ts-ignore
    return adjustDecimals(percentage * maxSpendingIntervalValues[selectedSpendingInterval]);
}

function initMaxSpendingValues(rangeWithin30Days: boolean) {
    return {
        0: 5,
        1: 10,
        2: 15,
        3: 20,
        4: 25,
        5: rangeWithin30Days ? 30 : 35
    };
}

// -------------------------------- GET REQUIRED VISITS AND SPENDING --------------------------------------

/**
 *
 * @param totalStars
 */
const getRequiredValuesFromInput = (totalStars:number) => {
    totalStars = parseFloat( totalStars.toFixed(1) );

    if(totalStars <= 1.3 && totalStars > 0)
        return possibleStarValues.get(1.3);
    else if(totalStars >= 65)
        return possibleStarValues.get(65);
    else if( possibleStarValues.get(totalStars) )
        return possibleStarValues.get(totalStars);
    else if( possibleStarValues.get(totalStars+0.1) )
        return possibleStarValues.get(totalStars+0.1);
    else if( possibleStarValues.get(totalStars-0.1) )
        return possibleStarValues.get(totalStars-0.1);
    else if( possibleStarValues.get(totalStars+0.2) )
        return possibleStarValues.get(totalStars+0.2);
    else if( possibleStarValues.get(totalStars-0.2) )
        return possibleStarValues.get(totalStars-0.2);
    else if( possibleStarValues.get(totalStars+0.3) )
        return possibleStarValues.get(totalStars+0.3);
    else if( possibleStarValues.get(totalStars-0.3) )
        return possibleStarValues.get(totalStars-0.3);
    else if( possibleStarValues.get(totalStars+0.4) )
        return possibleStarValues.get(totalStars+0.4);
    else if( possibleStarValues.get(totalStars-0.4) )
        return possibleStarValues.get(totalStars-0.4);
    else if( possibleStarValues.get(totalStars+0.5) )
        return possibleStarValues.get(totalStars+0.5);
    else if( possibleStarValues.get(totalStars-0.5) )
        return possibleStarValues.get(totalStars-0.5);
    else
        return null;
}

function fillPossibleStarValues() {
    possibleStarValues.set(1.3, [true, 1, 0]);
    possibleStarValues.set(1.8, [false, 2, 0]);
    possibleStarValues.set(2.3, [true, 2, 0]);
    possibleStarValues.set(2.5, [true, 1, 1]);
    possibleStarValues.set(3.5, [true, 2, 1]);
    possibleStarValues.set(4.0, [true, 1, 3]);
    possibleStarValues.set(4.5, [false, 3, 1]);
    possibleStarValues.set(5.8, [false, 5, 0]);
    possibleStarValues.set(6.8, [false, 6, 0]);
    possibleStarValues.set(7.5, [true, 4, 1]);
    possibleStarValues.set(8.3, [false, 3, 2]);
    possibleStarValues.set(9.3, [true, 6, 0]);
    possibleStarValues.set(10.3, [false, 4, 2]);
    possibleStarValues.set(10.5, [true, 6, 1]);
    possibleStarValues.set(11.0, [true, 4, 2]);
    possibleStarValues.set(12.3, [false, 5, 2]);
    possibleStarValues.set(12.5, [true, 2, 5]);
    possibleStarValues.set(13.8, [false, 3, 4]);
    possibleStarValues.set(14.0, [false, 4, 3]);
    possibleStarValues.set(14.3, [false, 6, 2]);
    possibleStarValues.set(14.8, [true, 7, 0]);
    possibleStarValues.set(15.5, [true, 3, 4]);
    possibleStarValues.set(15.8, [true, 6, 2]);
    possibleStarValues.set(17.5, [false, 3, 5]);
    possibleStarValues.set(18.0, [false, 5, 3]);
    possibleStarValues.set(18.3, [false, 4, 4]);
    possibleStarValues.set(19.0, [true, 5, 3]);
    possibleStarValues.set(19.5, [true, 3, 5]);
    possibleStarValues.set(21.0, [true, 4, 4]);
    possibleStarValues.set(21.3, [false, 8, 0]);
    possibleStarValues.set(22.5, [false, 8, 1]);
    possibleStarValues.set(22.8, [false, 4, 5]);
    possibleStarValues.set(23.0, [true, 6, 3]);
    possibleStarValues.set(23.8, [false, 5, 4]);
    possibleStarValues.set(24.8, [true, 8, 0]);
    possibleStarValues.set(25.5, [false, 9, 1]);
    possibleStarValues.set(26.0, [false, 7, 3]);
    possibleStarValues.set(26.5, [true, 8, 1]);
    possibleStarValues.set(27.0, [true, 7, 2]);
    possibleStarValues.set(28.0, [true, 9, 0]);
    possibleStarValues.set(28.5, [false, 6, 4]);
    possibleStarValues.set(30.0, [true, 9, 1]);
    possibleStarValues.set(30.3, [true, 6, 4]);
    possibleStarValues.set(31.5, [false, 6, 5]);
    possibleStarValues.set(32.5, [true, 6, 5]);
    possibleStarValues.set(33.0, [true, 6, 5]);
    possibleStarValues.set(34.0, [false, 7, 4]);
    possibleStarValues.set(34.5, [false, 7, 4]);
    possibleStarValues.set(35.0, [false, 8, 2]);
    possibleStarValues.set(35.8, [false, 8, 2]);
    possibleStarValues.set(36.5, [false, 10, 0]);
    possibleStarValues.set(37.0, [false, 8, 3]);
    possibleStarValues.set(38.5, [false, 7, 5]);
    possibleStarValues.set(41.0, [false, 10, 0]);
    possibleStarValues.set(42.0, [true, 8, 4]);
    possibleStarValues.set(43.0, [true, 10, 1]);
    possibleStarValues.set(44.0, [true, 8, 5]);
    possibleStarValues.set(45.0, [false, 9, 4]);
    possibleStarValues.set(46.0, [false, 9, 4]);
    possibleStarValues.set(47.0, [false, 9, 2]);
    possibleStarValues.set(48.0, [false, 9, 2]);
    possibleStarValues.set(49.5, [false, 9, 2]);
    possibleStarValues.set(50.5, [true, 9, 2]);
    possibleStarValues.set(51.0, [true, 9, 2]);
    possibleStarValues.set(52.0, [true, 9, 3]);
    possibleStarValues.set(53.0, [true, 9, 3]);
    possibleStarValues.set(55.0, [true, 9, 4]);
    possibleStarValues.set(56.0, [true, 10, 2]);
    possibleStarValues.set(57.0, [true, 10, 3]);
    possibleStarValues.set(58.0, [true, 10, 3]);
    possibleStarValues.set(59.0, [false, 10, 5]);
    possibleStarValues.set(61.0, [true, 10, 5]);
    possibleStarValues.set(62.0, [true, 10, 5]);
    possibleStarValues.set(63.0, [true, 10, 5]);
    possibleStarValues.set(64.0, [true, 10, 5]);
    possibleStarValues.set(65.0, [true, 10, 5]);

    // Minor visits number is preferred
    if(priority === 0) {
        possibleStarValues.set(3.3, [true, 1, 2]);
        possibleStarValues.set(4.8, [true, 1, 4]);
        possibleStarValues.set(5.5, [false, 2, 2]);
        possibleStarValues.set(6.0, [false, 2, 3]);
        possibleStarValues.set(6.3, [true, 2, 2]);
        possibleStarValues.set(6.5, [false, 2, 4]);
        possibleStarValues.set(7.0, [true, 1, 5]);
        possibleStarValues.set(7.8, [true, 2, 4]);
        possibleStarValues.set(9.0, [true, 3, 2]);
        possibleStarValues.set(11.5, [false, 3, 3]);
        possibleStarValues.set(13.0, [true, 3, 3]);
        possibleStarValues.set(16.0, [true, 4, 3]);
        possibleStarValues.set(24.0, [false, 7, 3]);
        possibleStarValues.set(25.0, [true, 4, 5]);
        possibleStarValues.set(29.0, [true, 5, 5]);
        possibleStarValues.set(38.0, [true, 7, 4]);
        possibleStarValues.set(39.5, [true, 7, 5]);
        possibleStarValues.set(40.0, [true, 7, 5]);
        possibleStarValues.set(54.0, [false, 9, 5]);
        possibleStarValues.set(54.5, [false, 9, 5]);
        possibleStarValues.set(60.0, [true, 9, 5]);
    }
    else { // Minor spending interval is preferred
        possibleStarValues.set(3.3, [true, 3, 0]);
        possibleStarValues.set(4.8, [false, 4, 0]);
        possibleStarValues.set(5.5, [false, 4, 1]);
        possibleStarValues.set(6.0, [true, 3, 1]);
        possibleStarValues.set(6.3, [true, 4, 0]);
        possibleStarValues.set(6.5, [false, 5, 1]);
        possibleStarValues.set(7.0, [true, 2, 3]);
        possibleStarValues.set(7.8, [true, 5, 0]);
        possibleStarValues.set(9.0, [true, 5, 1]);
        possibleStarValues.set(11.5, [false, 7, 0]);
        possibleStarValues.set(13.0, [true, 5, 2]);
        possibleStarValues.set(16.0, [true, 7, 1]);
        possibleStarValues.set(24.0, [false, 9, 0]);
        possibleStarValues.set(25.0, [true, 5, 4]);
        possibleStarValues.set(29.0, [true, 7, 3]);
        possibleStarValues.set(38.0, [true, 8, 2]);
        possibleStarValues.set(39.5, [true, 8, 3]);
        possibleStarValues.set(40.0, [true, 8, 3]);
        possibleStarValues.set(54.0, [false, 10, 2]);
        possibleStarValues.set(54.5, [false, 10, 2]);
        possibleStarValues.set(60.0, [true, 10, 4]);
    }
}

const submitStarValue = async (value: number, businessData: Business | undefined | null) => {
    await setDoc( doc(getFirebase().db, DASHBOARD_COLLECTION_NAME, businessData?.Id || '', CALCULATOR_SUBCOLLECTION_NAME, 'starValue'), {starValue: value});
}

const getStarValue = async (businessData: Business | undefined | null) => {
    return await getDoc(doc(getFirebase().db, DASHBOARD_COLLECTION_NAME, businessData?.Id || '-', CALCULATOR_SUBCOLLECTION_NAME, 'starValue'));
}

const calculatorService = {
    getVisitValues,
    getInitPercentages,
    getStarsFromVisits,
    getStarsFromSpending,
    getRequiredValuesFromInput,
    submitStarValue,
    getStarValue
}

export default calculatorService;

